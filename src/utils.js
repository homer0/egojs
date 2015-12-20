
import request from 'request';
/**
 * A list of utlity methods for the DevKit library.
 * @abstract
 */
export default class EgoJSUtils {
    /**
     * Returns an already fullfilled promise with a given value.
     * @param  {bollean} success  - Whether to call `resolve` or `reject`.
     * @param  {*}       response - The object to resolve or reject.
     * @return {Promise<*,*>}
     * @private
     * @ignore
     */
    static _fullfilledPromise(success, response) {
        return new Promise((resolve, reject) => {
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
     * OlapicUtils.rejectedPromise('error message').catch((e) => {
     *     // It will log 'error message'
     *     console.log(e);
     * });
     *
     * @param  {*} response - The object to send to the `.catch` method.
     * @return {Promise<null, *>} This promise won't call `.then` but `.catch` directly.
     */
    static rejectedPromise(response) {
        return this._fullfilledPromise(false, response);
    }
    /**
     * Returns an already resolved promise.
     * @example
     * OlapicUtils.rejectedPromise('hello world').then((message) => {
     *     // It will log 'hello world'
     *     console.log(message);
     * });
     *
     * @param  {*} response - The object to send to the `.then` method.
     * @return {Promise<*, null>} This promise won't call `.catch`.
     */
    static resolvedPromise(response) {
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
    static mergeObjects(...objects) {
        const result = {};
        objects.forEach((obj) => {
            if (typeof obj !== 'undefined') {
                Object.keys(obj).forEach((objKey) => {
                    const current = obj[objKey];
                    const target = result[objKey];
                    if (typeof target !== 'undefined' &&
                        current.constructor === Object &&
                        target.constructor === Object) {
                        result[objKey] = this.mergeObjects(target, current);
                    } else {
                        result[objKey] = current;
                    }

                }, this);
            }

        }, this);

        return result;
    }
    /**
     * Wrap a Request call into a Promise.
     * @example
     * request({uri: 'https://homer0.com/rosario'})
     * .then((response) => doSomething(response))
     * .catch((err) => handleErrors(err));
     *
     * @param  {Object} data The request settings. The same you would use with request().
     * @return {Promise<Object, Error>} It will be resolved or rejected depending on the response.
     */
    static request(data) {
        return new Promise((resolve, reject) => {
            request(data, (err, httpResponse, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        });
    }
}
