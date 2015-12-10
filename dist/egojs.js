'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _logUtil = require('log-util');

var _logUtil2 = _interopRequireDefault(_logUtil);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EgoJS = (function () {
    function EgoJS() {
        _classCallCheck(this, EgoJS);

        this._version = this._getPackageVersion();

        _commander2.default.version(this.version);

        _commander2.default.command('config').description('Change the configuration').action(this.configure.bind(this));
        _commander2.default.command('add').description('Add a package').action(this.addPackage.bind(this));
        _commander2.default.command('remove').description('Remove a package').action(this.removePackage.bind(this));

        _commander2.default.options[0].flags = '-v, --version';
        _commander2.default.options[0].description = 'print the EgoJS version';

        _commander2.default.parse(process.argv);
    }

    _createClass(EgoJS, [{
        key: '_getPackageVersion',
        value: function _getPackageVersion() {
            var packagePath = _path2.default.resolve('./package.json');
            var packageContents = _fs2.default.readFileSync(packagePath, 'utf-8');
            return JSON.parse(packageContents).version;
        }
    }, {
        key: 'version',
        value: function version() {
            console.log(this._version);
        }
    }, {
        key: 'configure',
        value: function configure() {
            console.log('Open config...');
        }
    }, {
        key: 'addPackage',
        value: function addPackage() {
            console.log('Start adding...');
        }
    }, {
        key: 'removePackage',
        value: function removePackage() {
            console.log('Remove package...');
        }
    }]);

    return EgoJS;
})();

exports.default = EgoJS;