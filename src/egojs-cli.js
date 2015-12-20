
import commander from 'commander';
import prompt from 'prompt';
import logUtil from 'log-util';
import colors from 'colors';
import fs from 'fs';
import path from 'path';
import EgoJS from './egojs';
import EgoJSUtils from './utils';
import Table from 'cli-table';
/**
 * Creates a CLI interface to work with EgoJS.
 * @version 1.0.0
 */
export default class EgoJSCli {
    /**
     * Create a new instance of the CLI interface and use commander to defined all the possible
     * commands.
     * @public
     */
    constructor() {
        /**
         * The current package version.
         * @type {string}
         * @private
         * @ignore
         */
        this._version = this._getPackageVersion();
        /**
         * The text for the loading indicator.
         * @type {String}
         * @private
         * @ignore
         */
        this._indicatorText = 'Loading, please diet';
        /**
         * The interval object that will be created with setInterval.
         * @type {Object}
         * @private
         * @ignore
         */
        this._indicatorInterval = null;
        /**
         * A utility counter to know how many dos will be added to the indicator
         * @type {Number}
         * @private
         * @ignore
         */
        this._indicatorCounter = -1;
        /**
         * After this many iterations, the dots will start to be removed instead of added. When the
         * counter hits 0, it will start adding again, until it hits this limit.
         * @type {Number}
         * @private
         * @ignore
         */
        this._indicatorLimit = 3;
        /**
         * A flag to know if the indicator it's currently adding dots or removing them.
         * @type {Boolean}
         * @private
         * @ignore
         */
        this._indicatorIncrease = true;
        /**
         * The EgoJS instance the CLI will interface with.
         * @type {EgoJS}
         */
        this._ego = new EgoJS();
        /**
         * Disable some default text from the prompt utility.
         */
        prompt.message = '';
        prompt.delimiter = '';
        /**
         * Set the package version into the commander.
         */
        commander.version(this._version);
        /**
         * Define the interface possible commands.
         */
        commander
            .command('list')
            .description('List the stats')
            .action(this.listPackages.bind(this));
        commander
            .command('config')
            .description('Change the configuration')
            .action(this.configure.bind(this));
        commander
            .command('add')
            .description('Add a package')
            .action(this.addPackage.bind(this));
        commander
            .command('edit <id>')
            .description('Edit a package')
            .action(this.editPackage.bind(this));
        commander
            .command('remove <id>')
            .description('Remove a package')
            .action(this.removePackage.bind(this));
        commander
            .command('refresh')
            .description('Clean the cache and refresh stats')
            .action(this.refresh.bind(this));

        commander.options[0].flags = '-v, --version';
        commander.options[0].short = '-v';
        commander.options[0].description = 'print the EgoJS version';

        commander.parse(process.argv);
        /**
         * If there's no command to execute, show the list.
         */
        if (!commander.args.length) {
            this.listPackages();
        }

    }
    /**
     * Read the package version from the `package.json` and return it.
     * @return {String}
     * @private
     * @ignore
     */
    _getPackageVersion() {
        const packagePath = path.resolve('./package.json');
        const packageContents = fs.readFileSync(packagePath, 'utf-8');
        return JSON.parse(packageContents).version;
    }
    /**
     * Wraps a prompt call inside a Promise.
     * @param  {Array} schema A list of the "questions" for the prompt.
     * @return {Promise<Object, Error>} The input data or an error if something went wrong.
     * @private
     * @ignore
     */
    _promisePrompt(schema) {
        return new Promise((resolve, reject) => {
            prompt.get(schema, function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }
    /**
     * Use the prompt to ask the user for new settings.
     * @param  {Object} [defaults={}] Already existing settings (for when it goes on edit mode).
     * @return {Promise<Object,Error>}
     * @private
     * @ignore
     */
    _getSettingsPrompt(defaults = {}) {
        logUtil.verbose('You can create a token on ' +
            colors.green('https://github.com/settings/tokens/new'));
        return this._promisePrompt([
            {
                description: 'Please enter a Github Access Token',
                name: 'ghToken',
                hidden: true,
                required: true,
                default: defaults.ghToken || '',
            },
        ]).then(((result) => {
            this._ego.setGitHubToken(result.ghToken);
            logUtil.debug('The settings were sucessfully saved');
        }).bind(this))

        .catch((err) => this._logError(err));
    }
    /**
     * This method runs inside every command in order to validate that there are settings saved
     * inside the module. If the settings are saved, it will return an already fullfiled promise,
     * otherwise, it will use the prompt to ask for them.
     * @return {Promise<*, Error>}
     * @private
     * @ignore
     */
    _detectSettings() {
        return this._ego.settings ? EgoJSUtils.resolvedPromise() : this._getSettingsPrompt();
    }
    /**
     * Use the prompt to add/edit a package.
     * @param  {Object} [defaults={}] In case this is being used to edit a package, this will
     *                                contain its properties.
     * @return {Promise<Object,Error>}
     * @private
     * @ignore
     */
    _getPackagePrompt(defaults = {}) {
        return this._promisePrompt([
            {
                description: 'Package name',
                name: 'name',
                required: true,
                default: defaults.name || '',
            },
            {
                description: 'Github repository (username/repository)',
                name: 'repository',
                required: false,
                default: defaults.repository || '',
            },
            {
                description: 'NPM package name',
                name: 'npmPackage',
                required: false,
                default: defaults.npmPackage || '',
            },
        ]);
    }
    /**
     * Logs an error on the console with the appropriate styles for an error (red text).
     * @param {Error} err The error to log. If the error has a stack it will log that, instead
     *                    of just the message.
     * @private
     * @ignore
     */
    _logError(err) {
        logUtil.error(err.stack ? err.stack : err);
        this._stopIndicator();
    }
    /**
     * Starts showing the progress indicator on the terminal.
     * @private
     * @ignore
     */
    _startIndicator() {
        this._indicatorInterval = setInterval(this._runIndicator.bind(this), 500);
    }
    /**
     * The actual method that shows the progress indicator on the terminal.
     * @private
     * @ignore
     */
    _runIndicator() {
        let text = this._indicatorText;
        if (this._indicatorIncrease) {
            this._indicatorCounter++;
            if (this._indicatorCounter === this._indicatorLimit) {
                this._indicatorIncrease = false;
            }
        } else {
            this._indicatorCounter--;
            if (this._indicatorCounter === 0) {
                this._indicatorIncrease = true;
            }
        }

        for (let i = 0; i < this._indicatorCounter; i++) {
            text += '.';
        }

        this._restartLine();
        this._print(text);
    }
    /**
     * Removes the progress indicator from the terminal.
     * @private
     * @ignore
     */
    _stopIndicator() {
        if (this._indicatorInterval) {
            clearInterval(this._indicatorInterval);
            this._restartLine();
        }
    }
    /**
     * Removes everything on the current terminal line and sets the cursor to the initial
     * position.
     * @private
     * @ignore
     */
    _restartLine() {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
    }
    /**
     * Writes a message in the terminal.
     * @param {String} message - The text to write.
     * @private
     * @ignore
     */
    _print(message) {
        process.stdout.write(message);
    }
    /**
     * A utility methods that returns formated text for a cli-table cell. If the value is
     * undefined, it will return '-', if the value is '0', it will color it red, otherwise,
     * it will return it as it is.
     * @param  {*} value The value to evaluate.
     * @return {String} The value for the cell.
     * @private
     * @ignore
     */
    _tableCellNumericValue(value) {
        const result = typeof value === 'undefined' ? '-' : String(value);
        return result === '0' ? colors.red(result) : result;
    }
    /**
     * List all the package stats on the terminal.
     * @return {Promise<null,Error>} In case of success, the promise will be resolved with no
     *                               arguments
     */
    listPackages() {
        return this._detectSettings()
        .then(() => this._startIndicator())
        .then(() => this._ego.getStats())
        .then(((data) => {
            const headers = [
                'ID',
                'Name',
                'Stars',
                'Watchers',
                'NPM Downloads',
                'Forks',
                'URLs',
            ];

            const t = new Table({
                head: headers.map((header) => colors.green(header)),
            });

            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                let urls = row.repository.url || '';
                urls += (urls ? '\n' : '') + (row.npm.url || '');
                t.push([
                    Number(row.id),
                    row.name,
                    this._tableCellNumericValue(row.repository.stars),
                    this._tableCellNumericValue(row.repository.watchers),
                    this._tableCellNumericValue(row.npm.downloads),
                    this._tableCellNumericValue(row.repository.forks),
                    urls,
                ]);
            }

            this._stopIndicator();
            console.log(t.toString());

        }).bind(this))

        .catch((err) => this._logError(err));
    }
    /**
     * Show the settings prompt in order to enter the new settings.
     * @return {Promise<null,Error>} In case of success, the promise will be resolved with no
     *                               arguments
     */
    configure() {
        return this._getSettingsPrompt(this._ego.settings || {});
    }
    /**
     * Use the prompt to add a new package.
     * @return {Promise<null,Error>} In case of success, the promise will be resolved with no
     *                               arguments
     */
    addPackage() {
        return this._getPackagePrompt().then(((result) => {
            return this._ego.addPackage(result.name, result.repository, result.npmPackage);
        })

        .bind(this))
        .then((result) => logUtil.debug(result.name + ' was successfully added'))
        .catch((err) => this._logError(err));
    }
    /**
     * Use the prompt to edit an existing package.
     * @param  {Number} id The package unique id.
     * @return {Promise<null,Error>} In case of success, the promise will be resolved with no
     *                               arguments
     */
    editPackage(id) {
        let pckg = null;
        id = Number(id);
        return this._ego.getPackage(id).then(((response) => {
            pckg = response;
            return this._getPackagePrompt(pckg);
        }).bind(this))

        .then(((result) => {
            return this._ego.editPackage(id, result.name, result.repository, result.npmPackage);
        })

        .bind(this))
        .then((result) => logUtil.debug(result.name + ' was successfully edited'))
        .catch((err) => this._logError(err));
    }
    /**
     * Use the prompt to remove an existing package.
     * @param  {Number} id The package unique id.
     * @return {Promise<null,Error>} In case of success, the promise will be resolved with no
     *                               arguments
     */
    removePackage(id) {
        return this._ego.removePackage(Number(id)).then((result) => {
            logUtil.debug(result.name + ' was successfully removed');
        })

        .catch((err) => this._logError(err));
    }
    /**
     * Clear the cache and show the table again.
     * @return {Promise<null,Error>} In case of success, the promise will be resolved with no
     *                               arguments
     */
    refresh() {
        this._ego.deleteCache();
        return this.listPackages();
    }

}
