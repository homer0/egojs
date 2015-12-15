
import LocallyDB from 'locallydb';
import path from 'path';
import EgoJSUtils from './utils';

export default class EgoJS {

    constructor() {
        this._db = new LocallyDB(path.resolve('./data'));
        this._tables = {
            settings: this._db.collection('settings'),
            packages: this._db.collection('packages'),
            cache: this._db.collection('cache'),
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

    _packageExists(id, property, value) {
        const where = '@cid != ' + id + ' && @' + property + ' == \'' + value + '\'';
        return this._tables.packages.where(where).items.length;
    }

    _getCachedInfo(pckg, infoKey, limit = 300) {
        const record = this._tables.cache.where({
            packageId: pckg.cid,
            infoKey: infoKey,
        }).items[0];

        let result = null;
        if (record) {
            limit = limit * 1000;
            const now = Date.now();
            const recordTime = Number(record.time);
            if ((now - recordTime) < limit) {
                result = JSON.parse(record.value);
            } else {
                this._tables.cache.remove(record.cid);
            }
        }

        return result;
    }

    _setCachedInfo(pckg, infoKey, value) {
        const record = this._tables.cache.where({
            packageId: pckg.cid,
            infoKey: infoKey,
        }).items[0];

        const newRecord = {
            packageId: pckg.cid,
            infoKey: infoKey,
            value: value,
            time: Date.now(),
        };

        if (record) {
            this._tables.cache.update(record.cid, newRecord);
        } else {
            this._tables.cache.insert(newRecord);
        }
    }

    _getInformation(pckg, property, cacheKey, request, format, errorProperty = 'error') {
        let result = null;

        if (pckg[property]) {
            const cached = this._getCachedInfo(pckg, cacheKey);

            if (cached) {
                result = EgoJSUtils.resolvedPromise(cached);
            } else {
                result = EgoJSUtils.request(request).then(((response) => {
                    const parsed = JSON.parse(response);
                    let chainResult = null;
                    if (!parsed || parsed[errorProperty]) {
                        chainResult = EgoJSUtils.rejectedPromise(parsed[errorProperty]);
                    } else {
                        chainResult = format(parsed);
                        this._setCachedInfo(pckg, cacheKey, JSON.stringify(chainResult));
                    }

                    return chainResult;
                }).bind(this));

            }
        } else {
            result = EgoJSUtils.resolvedPromise({});
        }

        return result;
    }

    _getPackageRepositoryInfo(pckg) {
        return this._getInformation(pckg, 'repository', 'github', {
            uri: 'https://api.github.com/repos/' + pckg.repository,
            headers: {
                Authorization: 'token ' + this.settings.ghToken,
                Accept: 'application/json',
                'User-Agent': 'EgoJS',
            },
            method: 'GET',
        }, (parsed) => {
            return {
                // jscs:disable
                forks: parsed.forks_count,
                stars: parsed.stargazers_count,
                watchers: parsed.watchers_count,
                url: parsed.html_url,
                // jscs:enable
            };
        }, 'message');
    }

    _getPackageNPMInfo(pckg) {
        return this._getInformation(pckg, 'npmPackage', 'npm', {
            uri: 'https://api.npmjs.org/downloads/point/last-month/' + pckg.npmPackage,
            headers: {
                Accept: 'application/json',
                'User-Agent': 'EgoJS',
            },
            method: 'GET',
        }, (parsed) => {
            return {
                // jscs:disable
                downloads: parsed.downloads,
                url: 'https://www.npmjs.com/package/' + parsed.package,
                // jscs:enable
            };
        });
    }

    _getPackageStats(pckg) {
        const result = {
            id: pckg.cid,
            name: pckg.name,
        };

        return this._getPackageRepositoryInfo(pckg)
        .then(((response) => {
            result.repository = response;
            return this._getPackageNPMInfo(pckg);
        }).bind(this))

        .then(((response) => {
            result.npm = response;
            return result;
        }).bind(this));
    }

    _setPackage(id, name, repository, npmPackage) {
        return new Promise(((resolve, reject) => {
            let error = null;
            let record = null;

            if (!repository && !npmPackage) {
                error = 'You need to enter at least the repository or the NPM package';
            } else if (this._packageExists(id, 'name', name)) {
                error = 'You already have a package with that name';
            } else if (repository && repository.split('/').length !== 2) {
                error = 'Please enter a valid repository URL';
            } else if (repository && this._packageExists(id, 'repository', repository)) {
                error = 'You already have a package with that repository URL';
            } else if (npmPackage && this._packageExists(id, 'npmPackage', npmPackage)) {
                error = 'You already have a package with that NPM name';
            } else {
                const use = {
                    name,
                    repository,
                    npmPackage,
                };

                if (id > -1) {
                    this._tables.packages.update(id, use);
                    record = this._tables.packages.get(id);
                } else {
                    const newId = this._tables.packages.insert(use);
                    record = this._tables.packages.get(newId);
                }
            }

            if (record) {
                resolve(record);
            } else {
                reject(new Error(error));
            }

        }).bind(this));
    }

    addPackage(name, repository, npmPackage) {
        return this._setPackage(-1, name, repository, npmPackage);
    }

    editPackage(id, name, repository, npmPackage) {
        return this._setPackage(id, name, repository, npmPackage);
    }

    getPackage(id, property = 'id') {
        if (property === 'id') {
            property = 'cid';
        }

        return new Promise(((resolve, reject) => {
            const where = [];
            where[property] = id;
            const pckg = this._tables.packages.where(where).items[0];
            if (pckg) {
                resolve(pckg);
            } else {
                reject(new Error('That package doesn\'t exist'));
            }
        }).bind(this));
    }

    removePackage(id, property = 'id') {
        return this.getPackage(id, property).then(((pckg) => {
            this._tables.packages.remove(pckg.cid);
            this.deleteCache(pckg.cid);
            return pckg;
        }).bind(this));
    }

    getStats() {
        const result = {};
        const all = [];
        this._tables.packages.items.forEach((it) => all.push(this._getPackageStats(it)));
        return Promise.all(all).then(((response) => {
            return response;
        }).bind(this));
    }

    deleteCache(id = null) {
        const records = id ? this._tables.cache.where({
            packageId: id,
        }).items : this._tables.cache.items;
        for (let i = 0; i < records.length; i++) {
            this._tables.cache.remove(records[i].cid);
        }
    }

    setGitHubToken(token) {
        this.settings = {
            ghToken: token,
        };
    }

    set settings(value) {
        const dbSettings = this._getDBSettings();
        const settingsCid = dbSettings ? dbSettings.cid : -1;
        if (this._settings) {
            value = EgoJSUtils.mergeObjects(this._settings, value);
        }

        this._settings = value;
        const record = EgoJSUtils.mergeObjects({
            settingId: 1,
        }, value);

        if (settingsCid > -1) {
            this._tables.settings.update(settingsCid, record);
            delete this._settings.cid;
            delete this._settings.settingId;
        } else {
            this._tables.settings.insert(record);
            this._settings = this._getDBSettings();
        }
    }

    get settings() {
        return this._settings;
    }

}
