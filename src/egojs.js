
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
