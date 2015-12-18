/**
 * Basic setup
 * ================================
 *
 * Disable the auto mock for the class that's about to be tested.
 */
jest.dontMock('../src/utils.js');
/**
 * In the beforeEach, a mock function will be set in this variable.
 */
let mockRequest;
/**
 * In the beforeEach, the class to test will be set in this variable.
 */
let EgoJSUtils;
/**
 * Dummy data
 * ================================
 *
 * A dummy "request" to use in the tests.
 */
const dummyRequest = {
    uri: '/ros/ario',
};
/**
 * The suite.
 */
describe('EgoJS: Utils', () => {

    beforeEach(() => {
        mockRequest = jest.genMockFunction();
        jest.setMock('request', mockRequest);
        EgoJSUtils = require('../src/utils.js').default;
    });
    /**
     * @test {EgoJSUtils#constructor}
     */
    it('should be a class with only static methods', () => {
        const instance = new EgoJSUtils();
        expect(Object.keys(instance).length).toEqual(0);
        expect(() => EgoJSUtils()).toThrow('Cannot call a class as a function');
    });
    /**
     * @test {EgoJSUtils#rejectedPromise}
     */
    pit('should return an already rejected promise', () => {
        return EgoJSUtils.rejectedPromise()
        .then(() => expect(true).toBeFalsy())
        .catch(() => expect(true).toBeTruthy());
    });
    /**
     * @test {EgoJSUtils#resolvedPromise}
     */
    pit('should return an already resolved promise', () => {
        return EgoJSUtils.resolvedPromise()
        .then(() => expect(true).toBeTruthy())
        .catch(() => expect(true).toBeFalsy());
    });
    /**
     * @test {EgoJSUtils#mergeObjects}
     */
    it('should sucessfully merge two objects', () => {
        const a = {
            b: 'c',
            d: {
                e: 'f',
                g: {
                    h: ['i'],
                },
            },
            j: 'k',
            m: ['n'],
            n: {m: 'm'},
        };
        const b = {
            j: 'key',
            d: {
                g: {
                    h: ['x', 'y', 'z'],
                    l: 'm',
                },
            },
            m: {n: 'n'},
            n: ['m'],
        };
        const c = {
            b: 'c',
            d: {
                e: 'f',
                g: {
                    h: ['x', 'y', 'z'],
                    l: 'm',
                },
            },
            j: 'key',
            m: {n: 'n'},
            n: ['m'],
        };

        expect(EgoJSUtils.mergeObjects(a, undefined, b)).toEqual(c);
    });
    /**
     * @test {EgoJSUtils#request}
     */
    pit('should wrap a request call in a promise and resolve it', () => {
        const result = EgoJSUtils.request(dummyRequest)
        .then((response) => {
            expect(response).toEqual(dummyRequest);
        });

        mockRequest.mock.calls[0][1](null, null, dummyRequest);
        return result;
    });
    /**
     * @test {EgoJSUtils#request}
     */
    pit('should wrap a request call in a promise and reject it', () => {
        const result = EgoJSUtils.request(dummyRequest)
        .catch((err) => {
            expect(err).toEqual(dummyRequest);
        });

        mockRequest.mock.calls[0][1](dummyRequest, null, null);
        return result;
    });

});
