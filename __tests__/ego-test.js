/**
 * Basic setup
 * ================================
 *
 * Disable the auto mock for the class that's about to be tested and the utility class (the
 * utility class because otherwise I would have to mock some crazy Promises :P).
 */
jest.dontMock('../src/egojs.js');
jest.dontMock('../src/utils.js');
/**
 * Require the custom mock of LocallyDB, which also contains a mock class for LocallyDB tables.
 */
const mockDB = require('locallydb');
jest.setMock('locallydb', mockDB.module);
/**
 * For some reason, the regular require is not working for node native modules, and that's why I
 * require it directly from the __mocks__ folder.
 */
jest.dontMock('../__mocks__/path.js');
const mockPath = require('../__mocks__/path');
jest.setMock('path', mockPath);
/**
 * Small hack to avoid creating a new mock for the utility class: I save the original request
 * method in a variable, generate a mock function, swap them in the test and restore them after.
 * So not proud.
 */
const EgoJSUtils = require('../src/utils.js');
const originalRequest = EgoJSUtils.default.request;
const mockRequest = jest.genMockFunction();
/**
 * Require the module to test.
 */
const EgoJS = require('../src/egojs.js').default;
/**
 * Dummy data
 * ================================
 *
 * The default settings "saved in the module".
 */
const dummySettings = {
    ghToken: 'Ros/ario',
};
/**
 * A random ID to use on DB record.
 */
const dummyId = 12;
/**
 * A package as the database saves it.
 */
const dummyPackage = {
    cid: dummyId,
    name: 'gulp-bundlerify',
    repository: 'homer0/gulp-bundlerify',
    npmPackage: 'gulp-bundlerify',
};
/**
 * A package without any NPM data.
 */
const dummyPackageWithoutNPM = {
    cid: dummyId,
    name: 'gulp-bundlerify',
    repository: 'homer0/gulp-bundlerify',
};
/**
 * A cache record for a GitHub repository.
 */
const dummyRepositoryStats = {
    cid: 1,
    infoKey: 'github',
    packageId: dummyId,
    time: 'to be set on the beforeEach',
    value: '{"forks":0,"stars":26,"watchers":26,"url":"homer0/gulp-bundlerify"}',
};
/**
 * A cache record for an NPM package.
 */
const dummyNPMStats = {
    cid: 2,
    infoKey: 'npm',
    packageId: dummyId,
    time: 'to be set on the beforeEach',
    value: '{"downloads":73,"url":"package/gulp-bundlerify"}',
};
/**
 * A reponse from the GitHub API.
 */
// jscs:disable
const dummyGitHubReponse = {
    forks_count: 1,
    stargazers_count: 2,
    watchers_count: 3,
    html_url: 'homer0.com',
};
// jscs:enable
/**
 * An error response from the GitHub API.
 */
const dummyGitHubErrorReponse = {
    message: 'Unknown error',
};
/**
 * A response from the NPM API.
 */
const dummyNPMReponse = {
    downloads: 12,
    package: 'charito',
};
/**
 * An error response from the NPM API.
 */
const dummyNPMErrorReponse = {
    error: 'Unknown error',
};
/**
 * A dummy error to use in the tests.
 */
const dummyError = new Error('Random Error');
/**
 * The suite.
 */
describe('EgoJS: Class', () => {

    beforeEach(() => {

        mockDB.mock.resetMocks();
        mockRequest.mockClear();
        dummyRepositoryStats.time = Date.now();
        dummyNPMStats.time = Date.now();

    });

    afterEach(() => {
        EgoJSUtils.default.request = originalRequest;
    });
    /**
     * @test {EgoJS#constructor}
     */
    it('should be a class with instance methods', () => {
        expect(() => EgoJS()).toThrow('Cannot call a class as a function');
        const instance = new EgoJS();
        expect(instance).toEqual(jasmine.any(EgoJS));
        expect(instance.addPackage).toEqual(jasmine.any(Function));
        expect(instance.editPackage).toEqual(jasmine.any(Function));
        expect(instance.getPackage).toEqual(jasmine.any(Function));
        expect(instance.removePackage).toEqual(jasmine.any(Function));
        expect(instance.getStats).toEqual(jasmine.any(Function));
        expect(instance.deleteCache).toEqual(jasmine.any(Function));
        expect(instance.setGitHubToken).toEqual(jasmine.any(Function));

        expect(mockDB.mock.mocks.collection.mock.calls.length).toEqual(3);

    });
    /**
     * @test {EgoJS#addPackage}
     */
    pit('should successfully add a package', () => {
        const instance = new EgoJS();
        mockDB.mock.tables.packages.item = dummyPackage;
        return instance.addPackage(
            dummyPackage.name,
            dummyPackage.repository,
            dummyPackage.npmPackage
        ).then((response) => {
            expect(response).toEqual(dummyPackage);
            expect(mockDB.mock.tables.packages.mocks.insert.mock.calls.length).toEqual(1);
        });
    });
    /**
     * @test {EgoJS#addPackage}
     */
    pit('should try to add a package and fail because the properties are invalid', () => {
        const instance = new EgoJS();
        return instance.addPackage(dummyPackage.name)
        .then(() => expect(true).toBeFalsy())
        .catch(() => expect(true).toBeTruthy());
    });
    /**
     * @test {EgoJS#addPackage}
     */
    pit('should try to add a package and fail because there\'s one with the same name', () => {
        const instance = new EgoJS();
        mockDB.mock.tables.packages.whereResults = [[dummyPackage]];
        return instance.addPackage(
            dummyPackage.name,
            dummyPackage.repository,
            dummyPackage.npmPackage
        ).then(() => expect(true).toBeFalsy())
        .catch(() => {
            expect(true).toBeTruthy();
            expect(mockDB.mock.tables.packages.mocks.where.mock.calls.length).toEqual(1);
        });
    });
    /**
     * @test {EgoJS#addPackage}
     */
    pit('should try to add a package and fail because the repo format is invalid', () => {
        const instance = new EgoJS();
        return instance.addPackage(
            dummyPackage.name,
            'some/invalid/format',
            dummyPackage.npmPackage
        ).then(() => expect(true).toBeFalsy())
        .catch(() => {
            expect(true).toBeTruthy();
            expect(mockDB.mock.tables.packages.mocks.where.mock.calls.length).toEqual(1);
        });
    });
    /**
     * @test {EgoJS#addPackage}
     */
    pit('should try to add a package and fail because there\'s one with the same repo', () => {
        const instance = new EgoJS();
        mockDB.mock.tables.packages.whereResults = [[], [dummyPackage]];
        return instance.addPackage(
            dummyPackage.name,
            dummyPackage.repository,
            dummyPackage.npmPackage
        ).then(() => expect(true).toBeFalsy())
        .catch(() => {
            expect(true).toBeTruthy();
            expect(mockDB.mock.tables.packages.mocks.where.mock.calls.length).toEqual(2);
        });
    });
    /**
     * @test {EgoJS#addPackage}
     */
    pit('should try to add a package and fail because there\'s one with the same npm URL', () => {
        const instance = new EgoJS();
        mockDB.mock.tables.packages.whereResults = [[], [], [dummyPackage]];
        return instance.addPackage(
            dummyPackage.name,
            dummyPackage.repository,
            dummyPackage.npmPackage
        ).then(() => expect(true).toBeFalsy())
        .catch(() => {
            expect(true).toBeTruthy();
            expect(mockDB.mock.tables.packages.mocks.where.mock.calls.length).toEqual(3);
        });
    });
    /**
     * @test {EgoJS#editPackage}
     */
    pit('should successfully edit a package', () => {
        const instance = new EgoJS();
        mockDB.mock.tables.packages.item = dummyPackage;

        return instance.editPackage(
            dummyId,
            dummyPackage.name,
            dummyPackage.repository,
            dummyPackage.npmPackage
        ).then((response) => {
            expect(response).toEqual(dummyPackage);
            const updateMock = mockDB.mock.tables.packages.mocks.update.mock;
            expect(updateMock.calls.length).toEqual(1);
            expect(updateMock.calls[0][0]).toEqual(dummyId);
            expect(updateMock.calls[0][1]).toEqual({
                name: dummyPackage.name,
                repository: dummyPackage.repository,
                npmPackage: dummyPackage.npmPackage,
            });
        });
    });
    /**
     * @test {EgoJS#getPackage}
     */
    pit('should successfully get a package by its ID', () => {
        const instance = new EgoJS();
        mockDB.mock.tables.packages.whereResults = [[dummyPackage]];

        return instance.getPackage(dummyId).then((response) => {
            const whereMock = mockDB.mock.tables.packages.mocks.where.mock;
            expect(whereMock.calls[0][0].cid).toEqual(dummyId);
            expect(response).toEqual(dummyPackage);
        });
    });
    /**
     * @test {EgoJS#getPackage}
     */
    pit('should successfully get a package by its name', () => {
        const instance = new EgoJS();
        mockDB.mock.tables.packages.whereResults = [[dummyPackage]];

        return instance.getPackage(dummyPackage.name, 'name').then((response) => {
            const whereMock = mockDB.mock.tables.packages.mocks.where.mock;
            expect(whereMock.calls[0][0].name).toEqual(dummyPackage.name);
            expect(response).toEqual(dummyPackage);
        });
    });
    /**
     * @test {EgoJS#getPackage}
     */
    pit('should try to get a package and fail because it doesn\'t exist', () => {
        const instance = new EgoJS();
        return instance.getPackage(dummyId)
        .then(() => expect(true).toBeFalsy())
        .catch(() => expect(true).toBeTruthy());
    });
    /**
     * @test {EgoJS#removePackage}
     */
    pit('should successfully remove a package by its ID', () => {
        const instance = new EgoJS();
        mockDB.mock.tables.packages.whereResults = [[dummyPackage], [dummyPackage]];
        mockDB.mock.tables.cache.whereResults = [[dummyRepositoryStats, dummyNPMStats]];

        return instance.removePackage(dummyId).then((response) => {
            const whereMock = mockDB.mock.tables.packages.mocks.where.mock;
            expect(whereMock.calls[0][0].cid).toEqual(dummyId);
            const remMock = mockDB.mock.tables.packages.mocks.remove.mock;
            expect(remMock.calls[0][0]).toEqual(dummyId);
            expect(response).toEqual(dummyPackage);
        });
    });
    /**
     * @test {EgoJS#deleteCache}
     */
    it('should delete a package cache by its package ID', () => {
        const instance = new EgoJS();
        mockDB.mock.tables.cache.items = [dummyRepositoryStats, dummyNPMStats];
        instance.deleteCache();
        const remMock = mockDB.mock.tables.cache.mocks.remove.mock;
        expect(remMock.calls.length).toEqual(2);
    });
    /**
     * @test {EgoJS#settings}
     */
    it('should be able to save settings for the first time', () => {
        const instance = new EgoJS();
        mockDB.mock.tables.settings.whereResults = [[], [], [dummySettings]];
        expect(mockDB.mock.tables.settings.mocks.where.mock.calls.length).toEqual(1);
        instance.settings = dummySettings;
        expect(instance.settings).toEqual(dummySettings);
        expect(mockDB.mock.tables.settings.mocks.where.mock.calls.length).toEqual(3);
    });
    /**
     * @test {EgoJS#settings}
     */
    it('should be able to merge settings', () => {
        const savedSettings = {
            cid: dummyId,
            name: 'Rosario',
            settingId: 1,
        };
        const finalSettings = {
            ghToken: 'Ros/ario',
            name: 'Rosario',
        };
        const updateSettings = {
            cid: dummyId,
            ghToken: 'Ros/ario',
            name: 'Rosario',
            settingId: 1,
        };

        mockDB.mock.addTable('settings');
        mockDB.mock.tables.settings.whereResults = [
            [savedSettings],
            [savedSettings],
            [finalSettings],
        ];

        const instance = new EgoJS();
        expect(mockDB.mock.tables.settings.mocks.where.mock.calls.length).toEqual(1);
        instance.settings = dummySettings;
        expect(instance.settings).toEqual(finalSettings);
        const updateMock = mockDB.mock.tables.settings.mocks.update.mock;
        expect(updateMock.calls[0][1]).toEqual(updateSettings);
        expect(mockDB.mock.tables.settings.mocks.where.mock.calls.length).toEqual(2);
    });
    /**
     * @test {EgoJS#setGitHubToken}
     */
    it('should set the GitHub token setting using the setGitHubToken method', () => {
        const instance = new EgoJS();
        mockDB.mock.tables.settings.whereResults = [[], [], [dummySettings]];
        instance.setGitHubToken(dummySettings.ghToken);
        expect(instance.settings).toEqual(dummySettings);
    });
    /**
     * @test {EgoJS#getStats}
     */
    pit('should get the stats for the packages currently saved', () => {
        let requestsCounter = 0;
        const requestsResponses = [dummyGitHubReponse, dummyNPMReponse];
        mockRequest.mockImplementation((request) => {
            return new Promise((resolve) => {
                resolve(JSON.stringify(requestsResponses[requestsCounter]));
                requestsCounter++;
            });
        });

        EgoJSUtils.default.request = mockRequest;

        const instance = new EgoJS();
        mockDB.mock.tables.settings.whereResults = [[], [], [dummySettings]];
        mockDB.mock.tables.cache.whereResults = [
            [],
            [dummyRepositoryStats],
            [],
            [dummyNPMStats],
        ];
        instance.settings = dummySettings;
        mockDB.mock.tables.packages.items = [dummyPackage];
        const result = instance.getStats().then((response) => {
            expect(mockRequest.mock.calls.length).toEqual(2);
            expect(mockRequest.mock.calls[0][0].uri).toMatch(/api\.github\.com/ig);
            expect(mockRequest.mock.calls[1][0].uri).toMatch(/api\.npmjs\.org/ig);
        });

        return result;
    });
    /**
     * @test {EgoJS#getStats}
     */
    pit('should get the stats for the packages currently saved, using the cache', () => {
        let requestsCounter = 0;
        const requestsResponses = [dummyGitHubReponse, dummyNPMReponse];
        mockRequest.mockImplementation((request) => {
            return new Promise((resolve) => {
                resolve(JSON.stringify(requestsResponses[requestsCounter]));
                requestsCounter++;
            });
        });

        EgoJSUtils.default.request = mockRequest;

        const instance = new EgoJS();
        mockDB.mock.tables.settings.whereResults = [[], [], [dummySettings]];
        mockDB.mock.tables.cache.whereResults = [
            [dummyRepositoryStats],
            [dummyNPMStats],
        ];
        instance.settings = dummySettings;
        mockDB.mock.tables.packages.items = [dummyPackage];
        const result = instance.getStats().then((response) => {
            expect(mockRequest.mock.calls.length).toEqual(0);
        });

        return result;
    });
    /**
     * @test {EgoJS#getStats}
     */
    pit('should try to use an invalid cache to get stats', () => {
        const invalidTime = Date.now() - 3600000;
        dummyRepositoryStats.time = invalidTime;
        dummyNPMStats.time = invalidTime;
        let requestsCounter = 0;
        const requestsResponses = [dummyGitHubReponse, dummyNPMReponse];
        mockRequest.mockImplementation((request) => {
            return new Promise((resolve) => {
                resolve(JSON.stringify(requestsResponses[requestsCounter]));
                requestsCounter++;
            });
        });

        EgoJSUtils.default.request = mockRequest;

        const instance = new EgoJS();
        mockDB.mock.tables.settings.whereResults = [[], [], [dummySettings]];
        mockDB.mock.tables.cache.whereResults = [
            [dummyRepositoryStats],
            [dummyNPMStats],
        ];
        instance.settings = dummySettings;
        mockDB.mock.tables.packages.items = [dummyPackage];
        const result = instance.getStats().then((response) => {
            expect(mockRequest.mock.calls.length).toEqual(2);
        });

        return result;
    });
    /**
     * @test {EgoJS#getStats}
     */
    pit('should handle errors from GitHub and NPM', () => {
        let requestsCounter = 0;
        const requestsResponses = [dummyGitHubErrorReponse, dummyNPMErrorReponse];
        mockRequest.mockImplementation((request) => {
            return new Promise((resolve) => {
                resolve(JSON.stringify(requestsResponses[requestsCounter]));
                requestsCounter++;
            });
        });

        EgoJSUtils.default.request = mockRequest;

        const instance = new EgoJS();
        mockDB.mock.tables.settings.whereResults = [[], [], [dummySettings]];
        instance.settings = dummySettings;
        mockDB.mock.tables.packages.items = [dummyPackage];
        const result = instance.getStats()
        .then(() => expect(true).toBeFalsy())
        .catch(() => expect(true).toBeTruthy());

        return result;
    });
    /**
     * @test {EgoJS#getStats}
     */
    pit('should return empty stats if the package doesn\'t have a repo or an npm package', () => {
        let requestsCounter = 0;
        const requestsResponses = [dummyGitHubReponse];
        mockRequest.mockImplementation((request) => {
            return new Promise((resolve) => {
                resolve(JSON.stringify(requestsResponses[requestsCounter]));
                requestsCounter++;
            });
        });

        EgoJSUtils.default.request = mockRequest;

        const instance = new EgoJS();
        mockDB.mock.tables.settings.whereResults = [[], [], [dummySettings]];
        mockDB.mock.tables.cache.whereResults = [
            [],
            [dummyRepositoryStats],
        ];
        instance.settings = dummySettings;
        mockDB.mock.tables.packages.items = [dummyPackageWithoutNPM];
        const result = instance.getStats().then((response) => {
            expect(mockRequest.mock.calls.length).toEqual(1);
            expect(mockRequest.mock.calls[0][0].uri).toMatch(/api\.github\.com/ig);
        });

        return result;
    });

});
