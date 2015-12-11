'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _locallydb = require('locallydb');

var _locallydb2 = _interopRequireDefault(_locallydb);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EgoJS = (function () {
    function EgoJS() {
        _classCallCheck(this, EgoJS);

        this._db = new _locallydb2.default(_path2.default.resolve('./data'));
        this._tables = {
            settings: this._db.collection('settings'),
            packages: this._db.collection('packages')
        };

        this._settings = this._getDBSettings();
    }

    _createClass(EgoJS, [{
        key: '_getDBSettings',
        value: function _getDBSettings() {
            var records = this._tables.settings.where({
                settingId: 1
            });

            var result = null;
            if (records.items.length) {
                result = records.items[0];
            }

            return result;
        }
    }, {
        key: '_packageExists',
        value: function _packageExists(property, value) {
            var where = {};
            where[property] = value;
            return this._tables.packages.where(where).items.length;
        }
    }, {
        key: 'addPackage',
        value: function addPackage(name, repository, npmPackage) {
            var _this = this;

            return new Promise((function (resolve, reject) {
                var error = null;
                var record = null;

                if (!repository && !npmPackage) {
                    error = 'You need to enter at least the repository or the NPM package';
                } else if (_this._packageExists('name', name)) {
                    error = 'You already have a package with that name';
                } else if (repository && _this._packageExists('repository', repository)) {
                    error = 'You already have a package with that repository URL';
                } else if (npmPackage && _this._packageExists('npmPackage', npmPackage)) {
                    error = 'You already have a package with that NPM name';
                } else {
                    var newId = _this._tables.packages.insert({
                        name: name,
                        repository: repository,
                        npmPackage: npmPackage
                    });

                    record = _this._tables.packages.get(newId);
                }

                if (record) {
                    resolve(record);
                } else {
                    reject(new Error(error));
                }
            }).bind(this));
        }
    }, {
        key: 'settings',
        set: function set(value) {
            var dbSettings = this._getDBSettings();
            var settingsCid = dbSettings ? dbSettings.cid : -1;

            this._settings = value;
            var record = _utils2.default.mergeObjects({
                settingId: 1
            }, value);

            if (settingsCid > -1) {
                this._tables.settings.update(settingsCid, record);
            } else {
                this._tables.settings.insert(record);
                this._settings = this._getDBSettings();
            }
        },
        get: function get() {
            return this._settings;
        }
    }]);

    return EgoJS;
})();

exports.default = EgoJS;