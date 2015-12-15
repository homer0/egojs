
import commander from 'commander';
import prompt from 'prompt';
import logUtil from 'log-util';
import colors from 'colors';
import fs from 'fs';
import path from 'path';
import EgoJS from './egojs';
import EgoJSUtils from './utils';
import Table from 'cli-table';

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
            this._ego.setGitHubToken(result.ghToken);
            logUtil.debug('The settings were sucessfully saved');
        }).bind(this))

        .catch((err) => this._logError(err));
    }

    _detectSettings() {
        return this._ego.settings ? EgoJSUtils.resolvedPromise() : this._getSettingsPrompt();
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

    _logError(err) {
        logUtil.error(err.stack ? err.stack : err);
    }

    _tableCellNumericValue(value) {
        const result = typeof value === 'undefined' ? '-' : String(value);
        return result === '0' ? colors.red(result) : result;
    }

    listPackages() {
        return this._detectSettings().then(() => this._ego.getStats())
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

            console.log(t.toString());

        }).bind(this))

        .catch((err) => this._logError(err));
    }

    configure() {
        return this._getSettingsPrompt(this._ego.settings || {});
    }

    addPackage() {
        return this._getPackagePrompt().then(((result) => {
            return this._ego.addPackage(result.name, result.repository, result.npmPackage);
        })

        .bind(this))
        .then((result) => logUtil.debug(result.name + ' was successfully added'))
        .catch((err) => this._logError(err));
    }

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

    removePackage(id) {
        return this._ego.removePackage(Number(id)).then((result) => {
            logUtil.debug(result.name + ' was successfully removed');
        })

        .catch((err) => this._logError(err));
    }

    refresh() {
        this._ego.deleteCache();
        return this.listPackages();
    }

}
