'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _prompt = require('prompt');

var _prompt2 = _interopRequireDefault(_prompt);

var _logUtil = require('log-util');

var _logUtil2 = _interopRequireDefault(_logUtil);

var _colors = require('colors');

var _colors2 = _interopRequireDefault(_colors);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _egojs = require('./egojs');

var _egojs2 = _interopRequireDefault(_egojs);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EgoJSCli = (function () {
    function EgoJSCli() {
        _classCallCheck(this, EgoJSCli);

        _prompt2.default.message = '';
        _prompt2.default.delimiter = '';

        this._version = this._getPackageVersion();
        _commander2.default.version(this._version);
        this._ego = new _egojs2.default();

        _commander2.default.command('list').description('List the stats').action(this.listPackages.bind(this));
        _commander2.default.command('config').description('Change the configuration').action(this.configure.bind(this));
        _commander2.default.command('add').description('Add a package').action(this.addPackage.bind(this));
        _commander2.default.command('remove').description('Remove a package').action(this.removePackage.bind(this));
        _commander2.default.command('refresh').description('Clean the cache and refresh stats').action(this.refresh.bind(this));

        _commander2.default.options[0].flags = '-v, --version';
        _commander2.default.options[0].short = '-v';
        _commander2.default.options[0].description = 'print the EgoJS version';

        _commander2.default.parse(process.argv);

        if (!_commander2.default.args.length) {
            this.listPackages();
        }
    }

    _createClass(EgoJSCli, [{
        key: '_getPackageVersion',
        value: function _getPackageVersion() {
            var packagePath = _path2.default.resolve('./package.json');
            var packageContents = _fs2.default.readFileSync(packagePath, 'utf-8');
            return JSON.parse(packageContents).version;
        }
    }, {
        key: '_promisePrompt',
        value: function _promisePrompt(schema) {
            return new Promise(function (resolve, reject) {
                _prompt2.default.get(schema, function (err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        }
    }, {
        key: '_getSettingsPrompt',
        value: function _getSettingsPrompt() {
            var _this = this;

            var defaults = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            _logUtil2.default.verbose('You can create a token on ' + _colors2.default.green('https://github.com/settings/tokens/new'));
            return this._promisePrompt([{
                description: 'Please enter a Github Access Token',
                name: 'ghToken',
                hidden: true,
                required: true,
                default: defaults.ghToken || ''
            }]).then((function (result) {
                _this._ego.settings = {
                    ghToken: result.ghToken
                };
                _logUtil2.default.debug('The settings were sucessfully saved');
            }).bind(this));
        }
    }, {
        key: '_detectSettings',
        value: function _detectSettings() {
            return this._ego.settings ? _utils2.default.resolvedPromise() : this._getSettingsPrompt();
        }
    }, {
        key: 'listPackages',
        value: function listPackages() {
            this._detectSettings().then(function () {
                console.log('List the stats');
            });
        }
    }, {
        key: 'configure',
        value: function configure() {
            this._getSettingsPrompt(this._ego.settings || {});
        }
    }, {
        key: '_getPackagePrompt',
        value: function _getPackagePrompt() {
            var defaults = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            return this._promisePrompt([{
                description: 'Package name',
                name: 'name',
                required: true,
                default: defaults.name || ''
            }, {
                description: 'Github repository (username/repository)',
                name: 'repository',
                required: false,
                default: defaults.repository || ''
            }, {
                description: 'NPM package name',
                name: 'npmPackage',
                required: false,
                default: defaults.npmPackage || ''
            }]);
        }
    }, {
        key: 'addPackage',
        value: function addPackage() {
            var _this2 = this;

            this._getPackagePrompt().then((function (result) {
                return _this2._ego.addPackage(result.name, result.repository, result.npmPackage);
            }).bind(this)).then((function (result) {
                _logUtil2.default.debug('The package was successfully added');
            }).bind(this)).catch((function (err) {
                _logUtil2.default.error(err);
            }).bind(this));
        }
    }, {
        key: 'removePackage',
        value: function removePackage() {
            console.log('Remove a package');
        }
    }, {
        key: 'refresh',
        value: function refresh() {
            console.log('Refresh the cache');
        }
    }]);

    return EgoJSCli;
})();

exports.default = EgoJSCli;