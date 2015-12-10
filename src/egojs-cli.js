
import commander from 'commander';
import fs from 'fs';
import path from 'path';

export default class EgoJSCli {

    constructor() {

        this._version = this._getPackageVersion();
        commander.version(this.version);

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
        commander.options[0].description = 'print the EgoJS version';

        commander.parse(process.argv);

    }

    _getPackageVersion() {
        const packagePath = path.resolve('./package.json');
        const packageContents = fs.readFileSync(packagePath, 'utf-8');
        return JSON.parse(packageContents).version;
    }

    version() {
        console.log(this._version);
    }

    configure() {
        console.log('Change the configuration');
    }

    addPackage() {
        console.log('Add a package');
    }

    removePackage() {
        console.log('Remove a package');
    }

    refresh() {
        console.log('Refresh the cache');
    }

}
