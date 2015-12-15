
jest.dontMock('../src/utils.js');
let mockRequest;
const dummyRequest = {
    uri: '/ros/ario',
};

let EgoJSUtils;

describe('EgoJS: Utils', () => {

    beforeEach(() => {
        mockRequest = jest.genMockFunction();
        jest.setMock('request', mockRequest);
        EgoJSUtils = require('../src/utils.js').default;
    });

    it('should be a class with only static methods', () => {
        const instance = new EgoJSUtils();
        expect(Object.keys(instance).length).toEqual(0);
        expect(() => EgoJSUtils()).toThrow('Cannot call a class as a function');
    });

    pit('should return an already rejected promise', () => {
        return EgoJSUtils.rejectedPromise()
        .then(() => expect(true).toBeFalsy())
        .catch(() => expect(true).toBeTruthy());
    });

    pit('should return an already resolved promise', () => {
        return EgoJSUtils.resolvedPromise()
        .then(() => expect(true).toBeTruthy())
        .catch(() => expect(true).toBeFalsy());
    });

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

    pit('should wrap a request call in a promise and resolve it', () => {
        const result = EgoJSUtils.request(dummyRequest)
        .then((response) => {
            expect(response).toEqual(dummyRequest);
        });

        mockRequest.mock.calls[0][1](null, null, dummyRequest);
        return result;
    });

    pit('should wrap a request call in a promise and reject it', () => {
        const result = EgoJSUtils.request(dummyRequest)
        .catch((err) => {
            expect(err).toEqual(dummyRequest);
        });

        mockRequest.mock.calls[0][1](dummyRequest, null, null);
        return result;
    });

});
