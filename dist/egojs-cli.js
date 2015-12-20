/*istanbul ignore next*/'use strict';

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

var _egojs = require('./egojs');

var _egojs2 = _interopRequireDefault(_egojs);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

var _cliTable = require('cli-table');

var _cliTable2 = _interopRequireDefault(_cliTable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Creates a CLI interface to work with EgoJS.
 * @version 1.0.0
 */

var EgoJSCli = (function () {
    /**
     * Create a new instance of the CLI interface and use commander to defined all the possible
     * commands.
     * @public
     */

    function EgoJSCli() {
        /*istanbul ignore next*/
        _classCallCheck(this, EgoJSCli);

        /**
         * The current package version.
         * @type {string}
         * @private
         * @ignore
         */
        this._version = this._getPackageVersion();
        /**
         * The text for the loading indicator.
         * @type {String}
         * @private
         * @ignore
         */
        this._indicatorText = 'Loading, please diet';
        /**
         * The interval object that will be created with setInterval.
         * @type {Object}
         * @private
         * @ignore
         */
        this._indicatorInterval = null;
        /**
         * A utility counter to know how many dos will be added to the indicator
         * @type {Number}
         * @private
         * @ignore
         */
        this._indicatorCounter = -1;
        /**
         * After this many iterations, the dots will start to be removed instead of added. When the
         * counter hits 0, it will start adding again, until it hits this limit.
         * @type {Number}
         * @private
         * @ignore
         */
        this._indicatorLimit = 3;
        /**
         * A flag to know if the indicator it's currently adding dots or removing them.
         * @type {Boolean}
         * @private
         * @ignore
         */
        this._indicatorIncrease = true;
        /**
         * The EgoJS instance the CLI will interface with.
         * @type {EgoJS}
         */
        this._ego = new /*istanbul ignore next*/_egojs2.default();
        /**
         * Disable some default text from the prompt utility.
         */
        /*istanbul ignore next*/_prompt2.default.message = '';
        /*istanbul ignore next*/_prompt2.default.delimiter = '';
        /**
         * Set the package version into the commander.
         */
        /*istanbul ignore next*/_commander2.default.version(this._version);
        /**
         * Define the interface possible commands.
         */
        /*istanbul ignore next*/_commander2.default.command('list').description('List the stats').action(this.listPackages.bind(this));
        /*istanbul ignore next*/_commander2.default.command('config').description('Change the configuration').action(this.configure.bind(this));
        /*istanbul ignore next*/_commander2.default.command('add').description('Add a package').action(this.addPackage.bind(this));
        /*istanbul ignore next*/_commander2.default.command('edit <id>').description('Edit a package').action(this.editPackage.bind(this));
        /*istanbul ignore next*/_commander2.default.command('remove <id>').description('Remove a package').action(this.removePackage.bind(this));
        /*istanbul ignore next*/_commander2.default.command('refresh').description('Clean the cache and refresh stats').action(this.refresh.bind(this));

        /*istanbul ignore next*/_commander2.default.options[0].flags = '-v, --version';
        /*istanbul ignore next*/_commander2.default.options[0].short = '-v';
        /*istanbul ignore next*/_commander2.default.options[0].description = 'print the EgoJS version';

        /*istanbul ignore next*/_commander2.default.parse(process.argv);
        /**
         * If there's no command to execute, show the list.
         */
        if (! /*istanbul ignore next*/_commander2.default.args.length) {
            this.listPackages();
        }
    }
    /**
     * Read the package version from the `package.json` and return it.
     * @return {String}
     * @private
     * @ignore
     */

    _createClass(EgoJSCli, [{
        key: '_getPackageVersion',
        value: function _getPackageVersion() {
            var packageContents = /*istanbul ignore next*/_fs2.default.readFileSync(__dirname + '/../package.json', 'utf-8');
            return JSON.parse(packageContents).version;
        }
        /**
         * Wraps a prompt call inside a Promise.
         * @param  {Array} schema A list of the "questions" for the prompt.
         * @return {Promise<Object, Error>} The input data or an error if something went wrong.
         * @private
         * @ignore
         */

    }, {
        key: '_promisePrompt',
        value: function _promisePrompt(schema) {
            return new Promise(function (resolve, reject) {
                /*istanbul ignore next*/_prompt2.default.get(schema, function (err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        }
        /**
         * Use the prompt to ask the user for new settings.
         * @param  {Object} [defaults={}] Already existing settings (for when it goes on edit mode).
         * @return {Promise<Object,Error>}
         * @private
         * @ignore
         */

    }, {
        key: '_getSettingsPrompt',
        value: function _getSettingsPrompt() {
            /*istanbul ignore next*/
            var _this = this;

            var defaults = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            /*istanbul ignore next*/_logUtil2.default.verbose('You can create a token on ' + /*istanbul ignore next*/_colors2.default.green('https://github.com/settings/tokens/new'));
            return this._promisePrompt([{
                description: 'Please enter a Github Access Token',
                name: 'ghToken',
                hidden: true,
                required: true,
                default: defaults.ghToken || ''
            }]).then((function (result) {
                /*istanbul ignore next*/_this._ego.setGitHubToken(result.ghToken);
                /*istanbul ignore next*/_logUtil2.default.debug('The settings were sucessfully saved');
            }).bind(this)).catch(function (err) /*istanbul ignore next*/{
                return (/*istanbul ignore next*/_this._logError(err)
                );
            });
        }
        /**
         * This method runs inside every command in order to validate that there are settings saved
         * inside the module. If the settings are saved, it will return an already fullfiled promise,
         * otherwise, it will use the prompt to ask for them.
         * @return {Promise<*, Error>}
         * @private
         * @ignore
         */

    }, {
        key: '_detectSettings',
        value: function _detectSettings() {
            return this._ego.settings ? /*istanbul ignore next*/_utils2.default.resolvedPromise() : this._getSettingsPrompt();
        }
        /**
         * Use the prompt to add/edit a package.
         * @param  {Object} [defaults={}] In case this is being used to edit a package, this will
         *                                contain its properties.
         * @return {Promise<Object,Error>}
         * @private
         * @ignore
         */

    }, {
        key: '_getPackagePrompt',
        value: function _getPackagePrompt() {
            /*istanbul ignore next*/var defaults = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

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
        /**
         * Logs an error on the console with the appropriate styles for an error (red text).
         * @param {Error} err The error to log. If the error has a stack it will log that, instead
         *                    of just the message.
         * @private
         * @ignore
         */

    }, {
        key: '_logError',
        value: function _logError(err) {
            this._stopIndicator();
            /*istanbul ignore next*/_logUtil2.default.error(err.stack ? err.stack : err);
        }
        /**
         * Starts showing the progress indicator on the terminal.
         * @private
         * @ignore
         */

    }, {
        key: '_startIndicator',
        value: function _startIndicator() {
            this._indicatorInterval = setInterval(this._runIndicator.bind(this), 500);
        }
        /**
         * The actual method that shows the progress indicator on the terminal.
         * @private
         * @ignore
         */

    }, {
        key: '_runIndicator',
        value: function _runIndicator() {
            var text = this._indicatorText;
            if (this._indicatorIncrease) {
                this._indicatorCounter++;
                if (this._indicatorCounter === this._indicatorLimit) {
                    this._indicatorIncrease = false;
                }
            } else {
                this._indicatorCounter--;
                if (this._indicatorCounter === 0) {
                    this._indicatorIncrease = true;
                }
            }

            for (var i = 0; i < this._indicatorCounter; i++) {
                text += '.';
            }

            this._restartLine();
            this._print(text);
        }
        /**
         * Removes the progress indicator from the terminal.
         * @private
         * @ignore
         */

    }, {
        key: '_stopIndicator',
        value: function _stopIndicator() {
            if (this._indicatorInterval) {
                clearInterval(this._indicatorInterval);
                this._restartLine();
            }
        }
        /**
         * Removes everything on the current terminal line and sets the cursor to the initial
         * position.
         * @private
         * @ignore
         */

    }, {
        key: '_restartLine',
        value: function _restartLine() {
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
        }
        /**
         * Writes a message in the terminal.
         * @param {String} message - The text to write.
         * @private
         * @ignore
         */

    }, {
        key: '_print',
        value: function _print(message) {
            process.stdout.write(message);
        }
        /**
         * A utility methods that returns formated text for a cli-table cell. If the value is
         * undefined, it will return '-', if the value is '0', it will color it red, otherwise,
         * it will return it as it is.
         * @param  {*} value The value to evaluate.
         * @return {String} The value for the cell.
         * @private
         * @ignore
         */

    }, {
        key: '_tableCellNumericValue',
        value: function _tableCellNumericValue(value) {
            var result = typeof value === 'undefined' ? '-' : String(value);
            return result === '0' ? /*istanbul ignore next*/_colors2.default.red(result) : result;
        }
        /**
         * List all the package stats on the terminal.
         * @return {Promise<null,Error>} In case of success, the promise will be resolved with no
         *                               arguments
         */

    }, {
        key: 'listPackages',
        value: function listPackages() {
            /*istanbul ignore next*/
            var _this2 = this;

            return this._detectSettings().then(function () /*istanbul ignore next*/{
                return (/*istanbul ignore next*/_this2._startIndicator()
                );
            }).then(function () /*istanbul ignore next*/{
                return (/*istanbul ignore next*/_this2._ego.getStats()
                );
            }).then((function (data) {
                var headers = ['ID', 'Name', 'Stars', 'Watchers', 'NPM Downloads', 'Forks', 'URLs'];

                var t = new /*istanbul ignore next*/_cliTable2.default({
                    head: headers.map(function (header) /*istanbul ignore next*/{
                        return (/*istanbul ignore next*/_colors2.default.green(header)
                        );
                    })
                });

                for (var i = 0; i < data.length; i++) {
                    var row = data[i];
                    var urls = row.repository.url || '';
                    urls += (urls ? '\n' : '') + (row.npm.url || '');
                    t.push([Number(row.id), row.name, /*istanbul ignore next*/_this2._tableCellNumericValue(row.repository.stars), /*istanbul ignore next*/_this2._tableCellNumericValue(row.repository.watchers), /*istanbul ignore next*/_this2._tableCellNumericValue(row.npm.downloads), /*istanbul ignore next*/_this2._tableCellNumericValue(row.repository.forks), urls]);
                }

                /*istanbul ignore next*/_this2._stopIndicator();
                console.log(t.toString());
            }).bind(this)).catch(function (err) /*istanbul ignore next*/{
                return (/*istanbul ignore next*/_this2._logError(err)
                );
            });
        }
        /**
         * Show the settings prompt in order to enter the new settings.
         * @return {Promise<null,Error>} In case of success, the promise will be resolved with no
         *                               arguments
         */

    }, {
        key: 'configure',
        value: function configure() {
            return this._getSettingsPrompt(this._ego.settings || {});
        }
        /**
         * Use the prompt to add a new package.
         * @return {Promise<null,Error>} In case of success, the promise will be resolved with no
         *                               arguments
         */

    }, {
        key: 'addPackage',
        value: function addPackage() {
            /*istanbul ignore next*/
            var _this3 = this;

            return this._getPackagePrompt().then((function (result) {
                return (/*istanbul ignore next*/_this3._ego.addPackage(result.name, result.repository, result.npmPackage)
                );
            }).bind(this)).then(function (result) /*istanbul ignore next*/{
                return (/*istanbul ignore next*/_logUtil2.default.debug(result.name + ' was successfully added')
                );
            }).catch(function (err) /*istanbul ignore next*/{
                return (/*istanbul ignore next*/_this3._logError(err)
                );
            });
        }
        /**
         * Use the prompt to edit an existing package.
         * @param  {Number} id The package unique id.
         * @return {Promise<null,Error>} In case of success, the promise will be resolved with no
         *                               arguments
         */

    }, {
        key: 'editPackage',
        value: function editPackage(id) {
            /*istanbul ignore next*/
            var _this4 = this;

            var pckg = null;
            id = Number(id);
            return this._ego.getPackage(id).then((function (response) {
                pckg = response;
                return (/*istanbul ignore next*/_this4._getPackagePrompt(pckg)
                );
            }).bind(this)).then((function (result) {
                return (/*istanbul ignore next*/_this4._ego.editPackage(id, result.name, result.repository, result.npmPackage)
                );
            }).bind(this)).then(function (result) /*istanbul ignore next*/{
                return (/*istanbul ignore next*/_logUtil2.default.debug(result.name + ' was successfully edited')
                );
            }).catch(function (err) /*istanbul ignore next*/{
                return (/*istanbul ignore next*/_this4._logError(err)
                );
            });
        }
        /**
         * Use the prompt to remove an existing package.
         * @param  {Number} id The package unique id.
         * @return {Promise<null,Error>} In case of success, the promise will be resolved with no
         *                               arguments
         */

    }, {
        key: 'removePackage',
        value: function removePackage(id) {
            /*istanbul ignore next*/
            var _this5 = this;

            return this._ego.removePackage(Number(id)).then(function (result) {
                /*istanbul ignore next*/_logUtil2.default.debug(result.name + ' was successfully removed');
            }).catch(function (err) /*istanbul ignore next*/{
                return (/*istanbul ignore next*/_this5._logError(err)
                );
            });
        }
        /**
         * Clear the cache and show the table again.
         * @return {Promise<null,Error>} In case of success, the promise will be resolved with no
         *                               arguments
         */

    }, {
        key: 'refresh',
        value: function refresh() {
            this._ego.deleteCache();
            return this.listPackages();
        }
    }]);

    return EgoJSCli;
})();

/*istanbul ignore next*/exports.default = EgoJSCli;