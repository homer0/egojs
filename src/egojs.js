
import LocallyDB from 'locallydb';
import path from 'path';
import EgoJSUtils from './utils';

export default class EgoJS {

    constructor() {
        this._db = new LocallyDB(path.resolve('./data'));
        this._tables = {
            settings: this._db.collection('settings'),
            packages: this._db.collection('packages'),
        };

        this._settings = this._getDBSettings();
    }

    _getDBSettings() {
        const records = this._tables.settings.where({
            settingId: 1,
        });

        let result = null;
        if (records.items.length) {
            result = records.items[0];
        }

        return result;
    }

    _packageExists(property, value) {
        const where = {};
        where[property] = value;
        return this._tables.packages.where(where).items.length;
    }

    addPackage(name, repository, npmPackage) {
        return new Promise(((resolve, reject) => {
            let error = null;
            let record = null;

            if (!repository && !npmPackage) {
                error = 'You need to enter at least the repository or the NPM package';
            } else if (this._packageExists('name', name)) {
                error = 'You already have a package with that name';
            } else if (repository && this._packageExists('repository', repository)) {
                error = 'You already have a package with that repository URL';
            } else if (npmPackage && this._packageExists('npmPackage', npmPackage)) {
                error = 'You already have a package with that NPM name';
            } else {
                const newId = this._tables.packages.insert({
                    name,
                    repository,
                    npmPackage,
                });

                record = this._tables.packages.get(newId);
            }

            if (record) {
                resolve(record);
            } else {
                reject(new Error(error));
            }

        }).bind(this));
    }

    removePackage(id, property = 'id') {
        if (property === 'id') {
            property = 'cid';
        }

        return new Promise(((resolve, reject) => {
            const where = [];
            where[property] = id;
            const records = this._tables.packages.where(where).items;

            if (records.length) {
                this._tables.packages.remove(records[0].cid);
                resolve(records[0]);
            } else {
                reject(new Error('That package doesn\'t exist'));
            }

        }).bind(this));
    }

    set settings(value) {
        const dbSettings = this._getDBSettings();
        const settingsCid = dbSettings ? dbSettings.cid : -1;

        this._settings = value;
        const record = EgoJSUtils.mergeObjects({
            settingId: 1,
        }, value);

        if (settingsCid > -1) {
            this._tables.settings.update(settingsCid, record);
        } else {
            this._tables.settings.insert(record);
            this._settings = this._getDBSettings();
        }
    }

    get settings() {
        return this._settings;
    }

}
