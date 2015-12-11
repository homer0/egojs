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