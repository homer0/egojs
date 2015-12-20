#!/usr/bin/env node --harmony

'use strict';
/**
 * Import the CLI interface.
 */

/*istanbul ignore next*/
var _egojsCli = require('./egojs-cli');

var _egojsCli2 = _interopRequireDefault(_egojsCli);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Create a new instance.
 */
new /*istanbul ignore next*/_egojsCli2.default();