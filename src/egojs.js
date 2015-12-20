
import LocallyDB from 'locallydb';
import path from 'path';
import EgoJSUtils from './utils';
/**
 * The actual 'core' for EgoJS. This class saves the packages into the local db, manages the
 * cache, makes the requests and returns the package stats.
 */
export default class EgoJS {
    /**
     * Class constructor
     * @public
     */
    constructor() {
        /**
         * A reference to the local database.
         * @type {LocallyDB}
         * @private
         * @ignore
         */
        this._db = new LocallyDB(path.resolve('./data'));
        /**
         * A dictionary with the local database tables.
         * @type {Object}
         */
        this._tables = {
            /**
             * This table will have only one record with the module settings.
             * @type {Object}
             */
            settings: this._db.collection('settings'),
            /**
             * This table stores all the user packages.
             * @type {Object}
             */
            packages: this._db.collection('packages'),
            /**
             * This table saves the requests cache.
             * @type {Object}
             */
            cache: this._db.collection('cache'),
        };
        /**
         * The module main settings. Right now it's only the GitHub token.
         * @type {Object}
         */
        this._settings = this._getDBSettings();
    }
    /**
     * Gets the settings from the database... or null.
     * @return {Object|null}
     * @private
     * @ignore
     */
    _getDBSettings() {
        return this._tables.settings.where({
            settingId: 1,
        }).items[0] || null;
    }
    /**
     * Checks whether a package exists or not based on a specified property.
     * @param  {Number} id       The unique ID that the record can't have.
     * @param  {String} property The name of the property to look for.
     * @param  {String} value    The value of the property.
     * @return {Boolean} Whether the record exists or not.
     * @private
     * @ignore
     */
    _packageExists(id, property, value) {
        const where = '@cid != ' + id + ' && @' + property + ' == \'' + value + '\'';
        return !!this._tables.packages.where(where).items.length;
    }
    /**
     * Get a cache record for a package. If there's one but it already pass it expiration time, it
     * will remove it and return null.
     * @param  {Object} pckg        The package information.
     * @param  {String} infoKey     The cache reference key, like 'github' or `npm`. The reason of
     *                              this is because there may be multiple records for one package
     *                              but for different 'responses'.
     * @param  {Number} [limit=300] How many seconds the record can be in the cache before
     *                              expiration.
     * @return {Object|null}
     * @private
     * @ignore
     */
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
    /**
     * Save a cache record for a package. This is used to save the already parsed responses from
     * the APIs the script use.
     * @param {Object} pckg    The package information.
     * @param {String} infoKey The cache reference key, like 'github' or 'npm'. The reason of this
     *                         is because there may be multiple records for one package but for
     *                         different 'responses'.
     * @param {String} value   The data to save in JSON format.
     * @private
     * @ignore
     */
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
    /**
     * This is a utility method used in order to request information from a JSON API (like
     * GitHub's). This method makes the request, checks for an error, call a callback that
     * formats the result and saves it on the cache.
     * @param  {Object}   pckg                  The package information.
     * @param  {String}   property              The name of the package property that will be
     *                                          used. This exists because right now, both GitHub
     *                                          and NPM are optional (but you must have at least
     *                                          one).
     * @param  {String}   cacheKey              The cache reference key that will be use to save
     *                                          the result.
     * @param  {Object}   request               The request information (as you would send it to
     *                                          Request).
     * @param  {Function} format                A callback function that receives the response
     *                                          object, formats it in the way it will be used, and
     *                                          returns it in order to cache it.
     * @param  {String} [errorProperty='error'] The name of a property in the reponse object that
     *                                          may indicate the request caused an error.
     * @return {Promise<Object,Error>}
     * @private
     * @ignore
     */
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
    /**
     * Connects with the GitHub API in order to retrieve a package information.
     * @param  {Object} pckg The package information.
     * @return {Promise<Object,Error>}
     * @private
     * @ignore
     */
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
    /**
     * Connects with the NPMJS API in order to retrieve the downloads count for the last month.
     * @param  {Object} pckg The package information.
     * @return {Promise<Object,Error>}
     * @private
     * @ignore
     */
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
    /**
     * Gets both the GitHub and NPMJS information for a package.
     * @param  {Object} pckg The package information.
     * @return {Object} An object with the requested information.
     * @property {Number} id         The package unique id.
     * @property {String} name       The package name.
     * @property {Object} repository The parsed information from the GitHub API.
     * @property {Object} npm        The parsed information from the NPMJS API.
     * @private
     * @ignore
     */
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
    /**
     * A utility method that it's used when a package it's added or edited.
     * @param  {Number} id         The package unique id. If the package it's new, it will be -1.
     * @param  {String} name       The name of the package.
     * @param  {String} repository The package repository URL (username/repository).
     * @param  {String} npmPackage The NPM name for the package.
     * @return {Promise<Object,Error>} If success, it will return the saved package.
     * @private
     * @ignore
     */
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
    /**
     * Add a new package to the database.
     * @param  {String} name       The package name.
     * @param  {String} repository The package repository URL (username/repository).
     * @param  {String} npmPackage The NPM name for the package.
     * @return {Promise<Object,Error>} If success, it will return the saved package.
     */
    addPackage(name, repository, npmPackage) {
        return this._setPackage(-1, name, repository, npmPackage);
    }
    /**
     * Edit the information of an existing package.
     * @param  {Number} id         The package unique ID.
     * @param  {String} name       The package name.
     * @param  {String} repository The package repository URL (username/repository).
     * @param  {String} npmPackage The NPM name for the package.
     * @return {Promise<Object,Error>} If success, it will return the saved package.
     */
    editPackage(id, name, repository, npmPackage) {
        return this._setPackage(id, name, repository, npmPackage);
    }
    /**
     * Get a package from the database.
     * @example
     * instance.getPackage(12)
     * .then((pckg) => doSomethig(pckg))
     * .catch((err) => console.log(err));
     *
     * // ...or...
     *
     * instance.getPackage('The Pckg', 'name')
     * .then((pckg) => doSomethig(pckg))
     * .catch((err) => console.log(err));
     *
     * @param  {String|Number}  id              By default, this is the package unique id, but if
     *                                          you change the value of the second argument, this
     *                                          can be the value you are looking for.
     * @param  {String}         [property='id'] The name of the filter property that will be used
     *                                          to make the search.
     * @return {Promise<Object,Error>}
     */
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
    /**
     * Remove a package from the database.
     * @example
     * instance.removePackage(12)
     * .then((pckg) => confirmRemove(pckg))
     * .catch((err) => console.log(err));
     *
     * // ...or...
     *
     * instance.removePackage('The Pckg', 'name')
     * .then((pckg) => confirmRemove(pckg))
     * .catch((err) => console.log(err));
     * @param  {String|Number}  id              By default, this is the package unique id, but if
     *                                          you change the value of the second argument, this
     *                                          can be the value that the property has to have.
     * @param  {String}         [property='id'] The name of the filter property that will be used
     *                                          to make the search.
     * @return {Promise<Object,Error>}
     */
    removePackage(id, property = 'id') {
        return this.getPackage(id, property).then(((pckg) => {
            this._tables.packages.remove(pckg.cid);
            this.deleteCache(pckg.cid);
            return pckg;
        }).bind(this));
    }
    /**
     * Get the stats for all the packages saved on the database.
     * @example
     * instance.getStats()
     * .then((list) => {
     *     for (let i = 0; i < list.length; i++) {
     *         console.log('Package ', list[i].name);
     *     }
     * });
     * @return {Promise<Array,Error>} A list of the packages stats.
     */
    getStats() {
        const result = {};
        const all = [];
        this._tables.packages.items.forEach((it) => all.push(this._getPackageStats(it)));
        return Promise.all(all).then(((response) => {
            return response;
        }).bind(this));
    }
    /**
     * Delete all the cached requests for all the packages or for an specific one.
     * @param {Number} [id=null] If specified, the cache will be only removed for that package.
     */
    deleteCache(id = null) {
        const records = id ? this._tables.cache.where({
            packageId: id,
        }).items : this._tables.cache.items;
        for (let i = 0; i < records.length; i++) {
            this._tables.cache.remove(records[i].cid);
        }
    }
    /**
     * Shortcut method to set the GitHub token on the settings.
     * @param {String} token The GitHub access token required to access the API.
     */
    setGitHubToken(token) {
        this.settings = {
            ghToken: token,
        };
    }
    /**
     * Set the module settings object. It uses an special setter because it merges it with any
     * existing settings and saves them on the database.
     * @type {Object}
     */
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
    /**
     * Get the module settings object.
     * @type {Object}
     */
    get settings() {
        return this._settings;
    }

}
