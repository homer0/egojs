
import commander from 'commander';
import prompt from 'prompt';
import logUtil from 'log-util';
import colors from 'colors';
import fs from 'fs';
import path from 'path';
import EgoJS from './egojs';
import EgoJSUtils from './utils';

export default class EgoJSCli {

    constructor() {

        prompt.message = '';
        prompt.delimiter = '';

        this._version = this._getPackageVersion();
        commander.version(this._version);
        this._ego = new EgoJS();

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
            .command('remove')
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

        if (!commander.args.length) {
            this.listPackages();
        }

    }

    _getPackageVersion() {
        const packagePath = path.resolve('./package.json');
        const packageContents = fs.readFileSync(packagePath, 'utf-8');
        return JSON.parse(packageContents).version;
    }

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
            this._ego.settings = {
                ghToken: result.ghToken,
            };
            logUtil.debug('The settings were sucessfully saved');
        }).bind(this));
    }

    _detectSettings() {
        return this._ego.settings ? EgoJSUtils.resolvedPromise() : this._getSettingsPrompt();
    }

    listPackages() {
        this._detectSettings().then(() => {
            console.log('List the stats');
        });
    }

    configure() {
        this._getSettingsPrompt(this._ego.settings || {});
    }

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

    addPackage() {
        this._getPackagePrompt().then(((result) => {
            return this._ego.addPackage(result.name, result.repository, result.npmPackage);
        })

        .bind(this))
        .then(((result) => {
            logUtil.debug('The package was successfully added');
        }).bind(this))

        .catch(((err) => {
            logUtil.error(err);
        }).bind(this));
    }

    removePackage() {
        console.log('Remove a package');
    }

    refresh() {
        console.log('Refresh the cache');
    }

}
