/*istanbul ignore next*/'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _request2 = require('request');

var _request3 = _interopRequireDefault(_request2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * A set of utlity methods.
 * @abstract
 */

var EgoJSUtils = (function () {
    function EgoJSUtils() {
        _classCallCheck(this, EgoJSUtils);
    }

    _createClass(EgoJSUtils, null, [{
        key: '_fullfilledPromise',

        /**
         * Returns an already fullfilled promise with a given value.
         * @param  {bollean} success  - Whether to call `resolve` or `reject`.
         * @param  {*}       response - The object to resolve or reject.
         * @return {Promise<*,*>}
         * @private
         * @ignore
         */
        value: function _fullfilledPromise(success, response) {
            return new Promise(function (resolve, reject) {
                if (success) {
                    resolve(response);
                } else {
                    reject(response);
                }
            });
        }
        /**
         * Returns an already rejected promise.
         * @example
         * EgoJSUtils.rejectedPromise('error message').catch((e) => {
         *     // It will log 'error message'
         *     console.log(e);
         * });
         *
         * @param  {*} response - The object to send to the `.catch` method.
         * @return {Promise<null, *>} This promise won't call `.then` but `.catch` directly.
         */

    }, {
        key: 'rejectedPromise',
        value: function rejectedPromise(response) {
            return this._fullfilledPromise(false, response);
        }
        /**
         * Returns an already resolved promise.
         * @example
         * EgoJSUtils.rejectedPromise('hello world').then((message) => {
         *     // It will log 'hello world'
         *     console.log(message);
         * });
         *
         * @param  {*} response - The object to send to the `.then` method.
         * @return {Promise<*, null>} This promise won't call `.catch`.
         */

    }, {
        key: 'resolvedPromise',
        value: function resolvedPromise(response) {
            return this._fullfilledPromise(true, response);
        }
        /**
         * It will merge a given list of Objects into a new one. It works recursively, so any "sub
         * objects" will also be merged. This method returns a new Object, so none of the targets will
         * be modified.
         * @example
         * const a = {
         *     b: 'c',
         *     d: {
         *         e: 'f',
         *         g: {
         *             h: ['i'],
         *         },
         *     },
         *     j: 'k',
         * };
         * const b = {
         *     j: 'key',
         *     d: {
         *         g: {
         *             h: ['x', 'y', 'z'],
         *             l: 'm',
         *         },
         *     },
         * };
         * // The result will be
         * // {
         * //     b: 'c',
         * //     d: {
         * //         e: 'f',
         * //         g: {
         * //             h: ['x', 'y', 'z'],
         * //             l: 'm',
         * //         },
         * //     },
         * //     j: 'key',
         * // }
         * ._mergeObjects(a, b);
         *
         * @param  {...Object} objects - The list of objects to merge.
         * @return {Object} A new object with the merged properties.
         */

    }, {
        key: 'mergeObjects',
        value: function mergeObjects() {
            /*istanbul ignore next*/
            var _this = this;

            var result = {};
            /*istanbul ignore next*/
            for (var _len = arguments.length, objects = Array(_len), _key = 0; _key < _len; _key++) {
                objects[_key] = arguments[_key];
            }

            objects.forEach(function (obj) {
                if (typeof obj !== 'undefined') {
                    Object.keys(obj).forEach(function (objKey) {
                        var current = obj[objKey];
                        var target = result[objKey];
                        if (typeof target !== 'undefined' && current.constructor === Object && target.constructor === Object) {
                            result[objKey] = /*istanbul ignore next*/_this.mergeObjects(target, current);
                        } else {
                            result[objKey] = current;
                        }
                    }, /*istanbul ignore next*/_this);
                }
            }, this);

            return result;
        }
        /**
         * Wraps a Request call into a Promise.
         * @example
         * request({uri: 'https://homer0.com/rosario'})
         * .then((response) => doSomething(response))
         * .catch((err) => handleErrors(err));
         *
         * @param  {Object} data The request settings. The same you would use with request().
         * @return {Promise<Object, Error>} It will be resolved or rejected depending on the response.
         */

    }, {
        key: 'request',
        value: function request(data) {
            return new Promise(function (resolve, reject) {
                /*istanbul ignore next*/(0, _request3.default)(data, function (err, httpResponse, body) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(body);
                    }
                });
            });
        }
    }]);

    return EgoJSUtils;
})();

/*istanbul ignore next*/exports.default = EgoJSUtils;