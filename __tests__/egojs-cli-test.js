/**
 * Basic setup
 * ================================
 *
 * Disable the auto mock for the class that's about to be tested and the utility class (the
 * utility class because otherwise I would have to mock some crazy Promises :P).
 */
jest.dontMock('../src/egojs-cli.js');
jest.dontMock('../src/utils.js');
/**
 * Require the custom mock for the EgoJS class.
 */
const mockEgoJS = require('egojs');
jest.setMock('../src/egojs', mockEgoJS.module);
/**
 * Generate and set a mock function for the log utility.
 */
const mockLogger = jest.genMockFromModule('log-util');
jest.setMock('log-util', mockLogger);
/**
 * Generate and set a mock for the terminal prompt utility.
 */
const mockPrompt = jest.genMockFromModule('prompt');
jest.setMock('prompt', mockPrompt);
/**
 * Require the custom mock for the commander module.
 */
const mockCommander = require('commander');
jest.setMock('commander', mockCommander);
/**
 * Require the custom mock for the cli-table module.
 */
const mockTable = require('cli-table');
jest.setMock('cli-table', mockTable.module);
/**
 * For some reason, the regular require is not working for node native modules, and that's why I
 * require them directly from the __mocks__ folder.
 *
 * Require fs in order to read the version from the package.json
 */
jest.dontMock('../__mocks__/fs.js');
const mockFS = require('../__mocks__/fs');
jest.setMock('fs', mockFS);
/**
 * Require path in order to resolve the path to the package.json
 */
jest.dontMock('../__mocks__/path.js');
const mockPath = require('../__mocks__/path');
jest.setMock('path', mockPath);
/**
 * Save a reference to the original console so it can be restored after adding a spy on it.
 */
const originalConsoleLog = console.log;
/**
 * Require the module to test.
 */
const EgoJSCli = require('../src/egojs-cli.js').default;
/**
 * Dummy data
 * ================================
 *
 * The module version the class will read from the "package.json".
 */
const dummyVersion = '25.09.2015';
/**
 * A list of "stats" saved on the "database".
 */
const dummyStats = [
    {
        name: 'Package 1',
        repository: {
            stars: 1,
            watchers: 0,
            forks: 2,
            url: 'github.com/ros/ario',
        },
        npm: {
            downloads: 1,
            url: 'npmjs.com/ros/ario',
        },
    },
    {
        name: 'Package 2',
        repository: {
            stars: 0,
            watchers: 2,
            forks: 0,
            url: 'github.com/ros/ario',
        },
        npm: {},
    },
    {
        name: 'Package 3',
        repository: {},
        npm: {
            downloads: 2,
            url: 'npmjs.com/ros/ario',
        },
    },
];
/**
 * The default settings "saved in the module".
 */
const dummySettings = {
    ghToken: 'Ros/ario',
};
/**
 * A package to set/get.
 */
const dummyPckg = {
    name: 'Ros/ario',
    repository: 'ros/ario',
    npmPackage: 'rosario',
};
/**
 * A dummy error to use in the tests.
 */
const dummyError = new Error('Random Error');
/**
 * The suite.
 */
describe('EgoJS: CLI', () => {

    beforeEach(() => {

        mockFS.__setReponse({
            version: dummyVersion,
        });

        mockLogger.error.mockClear();
        mockLogger.debug.mockClear();
        mockLogger.verbose.mockClear();

        mockCommander.reset();
        mockCommander.args = ['-h'];

        mockEgoJS.mock.resetMocks();
        mockTable.mock.resetMocks();
        mockPrompt.get.mockClear();

    });
    /**
     * @test {EgoJSCli#constructor}
     */
    it('should be a class with instance methods', () => {
        expect(() => EgoJSCli()).toThrow('Cannot call a class as a function');
        const instance = new EgoJSCli();
        expect(instance).toEqual(jasmine.any(EgoJSCli));
        expect(instance.listPackages).toEqual(jasmine.any(Function));
        expect(instance.configure).toEqual(jasmine.any(Function));
        expect(instance.addPackage).toEqual(jasmine.any(Function));
        expect(instance.editPackage).toEqual(jasmine.any(Function));
        expect(instance.removePackage).toEqual(jasmine.any(Function));
        expect(instance.refresh).toEqual(jasmine.any(Function));

        expect(mockCommander.mocks.command.mock.calls.length).toEqual(6);
        expect(mockCommander.mocks.description.mock.calls.length).toEqual(6);
        expect(mockCommander.mocks.action.mock.calls.length).toEqual(6);
        expect(mockCommander.mocks.version.mock.calls.length).toEqual(1);
        expect(mockCommander.mocks.version.mock.calls[0][0]).toEqual(dummyVersion);
        expect(mockCommander.mocks.parse.mock.calls.length).toEqual(1);

        expect(mockCommander.options[0].flags).toEqual('-v, --version');
        expect(mockCommander.options[0].short).toEqual('-v');
        expect(mockCommander.options[0].description).toEqual('print the EgoJS version');

        expect(mockFS.readFileSync.mock.calls.length).toEqual(1);
        expect(mockPath.resolve.mock.calls.length).toEqual(1);

        expect(mockEgoJS.mock.mocks.constructor.mock.calls.length).toEqual(1);
    });
    /**
     * @test {EgoJSCli#constructor}
     */
    pit('should render a table with the packages', () => {
        const instance = new EgoJSCli();
        mockEgoJS.mock.settings = dummySettings;
        mockEgoJS.mock.stats = dummyStats;
        console.log = jasmine.createSpy('log');
        return instance.listPackages().then(() => {
            expect(console.log).toHaveBeenCalled();
            console.log = originalConsoleLog;
            expect(mockTable.mock.mocks.constructor.mock.calls.length).toEqual(1);
            expect(mockTable.mock.mocks.push.mock.calls.length).toEqual(3);
        });
    });
    /**
     * @test {EgoJSCli#constructor}
     */
    it('should render the table if there isn\'t a command to execute', () => {
        mockCommander.args = [];
        const instance = new EgoJSCli();
        expect(mockLogger.verbose.mock.calls.length).toEqual(1);
        expect(mockLogger.verbose.mock.calls[0][0]).toMatch(/tokens\/new/);
    });
    /**
     * @test {EgoJSCli#listPackages}
     */
    pit('should try to render a table but fail with an error', () => {
        const instance = new EgoJSCli();
        mockEgoJS.mock.settings = dummySettings;
        mockEgoJS.mock.stats = null;
        return instance.listPackages().then(() => {
            expect(mockLogger.error.mock.calls.length).toEqual(1);
        });
    });
    /**
     * @test {EgoJSCli#configure}
     */
    pit('should prompt the configuration', () => {
        const instance = new EgoJSCli();
        mockEgoJS.mock.settings = {};
        const result = instance.configure().then(() => {
            expect(mockLogger.verbose.mock.calls.length).toEqual(1);
            expect(mockEgoJS.mock.settings).toEqual(dummySettings);
        });

        mockPrompt.get.mock.calls[0][1](null, dummySettings);
        return result;
    });
    /**
     * @test {EgoJSCli#configure}
     */
    pit('should prompt the configuration and fail', () => {
        const instance = new EgoJSCli();
        mockEgoJS.mock.settings = null;
        const result = instance.configure().then(() => {
            expect(mockLogger.verbose.mock.calls.length).toEqual(1);
            expect(mockLogger.error.mock.calls.length).toEqual(1);
        });

        mockPrompt.get.mock.calls[0][1](dummyError, null);
        return result;
    });
    /**
     * @test {EgoJSCli#addPackage}
     */
    pit('should successfully add a package', () => {
        const instance = new EgoJSCli();
        mockEgoJS.mock.settings = {};

        const result = instance.addPackage().then(() => {
            expect(mockEgoJS.mock.mocks.addPackage.mock.calls.length).toEqual(1);
            expect(mockEgoJS.mock.mocks.addPackage.mock.calls[0][0]).toEqual(dummyPckg.name);
            expect(mockLogger.debug.mock.calls.length).toEqual(1);
        });

        mockPrompt.get.mock.calls[0][1](null, dummyPckg);
        return result;
    });
    /**
     * @test {EgoJSCli#addPackage}
     */
    pit('should try to add a package and fail', () => {
        const instance = new EgoJSCli();
        mockEgoJS.mock.settings = {};

        const result = instance.addPackage().then(() => {
            expect(mockLogger.error.mock.calls.length).toEqual(1);
        });

        mockPrompt.get.mock.calls[0][1](dummyError.message, null);
        return result;
    });
    /**
     * @test {EgoJSCli#editPackage}
     */
    pit('should successfully edit a package', () => {
        const instance = new EgoJSCli();
        mockEgoJS.mock.settings = {};
        mockEgoJS.mock.package = dummyPckg;

        mockPrompt.get.mockImplementation(() => {
            mockPrompt.get.mock.calls[0][1](null, dummyPckg);
        });

        const mockId = 12;

        const result = instance.editPackage(mockId).then(() => {
            expect(mockEgoJS.mock.mocks.editPackage.mock.calls.length).toEqual(1);
            expect(mockEgoJS.mock.mocks.editPackage.mock.calls[0][0]).toEqual(mockId);
            expect(mockEgoJS.mock.mocks.editPackage.mock.calls[0][1]).toEqual(dummyPckg.name);
            expect(mockLogger.debug.mock.calls.length).toEqual(1);
        });

        return result;
    });
    /**
     * @test {EgoJSCli#editPackage}
     */
    pit('should try to edit a package and fail', () => {
        const instance = new EgoJSCli();
        mockEgoJS.mock.settings = {};
        mockEgoJS.mock.package = dummyPckg;

        mockPrompt.get.mockImplementation(() => {
            mockPrompt.get.mock.calls[0][1](dummyError, null);
        });

        const result = instance.editPackage(12).then(() => {
            expect(mockLogger.error.mock.calls.length).toEqual(1);
        });

        return result;
    });
    /**
     * @test {EgoJSCli#removePackage}
     */
    pit('should successfully remove a package', () => {
        const instance = new EgoJSCli();
        mockEgoJS.mock.settings = {};
        mockEgoJS.mock.package = dummyPckg;
        const mockId = 12;

        return instance.removePackage(mockId).then(() => {
            expect(mockEgoJS.mock.mocks.removePackage.mock.calls.length).toEqual(1);
            expect(mockEgoJS.mock.mocks.removePackage.mock.calls[0][0]).toEqual(mockId);
            expect(mockLogger.debug.mock.calls.length).toEqual(1);
        });
    });
    /**
     * @test {EgoJSCli#removePackage}
     */
    pit('should try to remove a package and fail', () => {
        const instance = new EgoJSCli();
        mockEgoJS.mock.settings = {};

        return instance.removePackage(12).then(() => {
            expect(mockLogger.error.mock.calls.length).toEqual(1);
        });
    });
    /**
     * @test {EgoJSCli#refresh}
     */
    pit('should clear the cache the draw the list again using the refresh method', () => {
        const instance = new EgoJSCli();
        mockEgoJS.mock.settings = dummySettings;
        mockEgoJS.mock.stats = dummyStats;
        console.log = jasmine.createSpy('log');
        return instance.refresh().then(() => {
            expect(console.log).toHaveBeenCalled();
            console.log = originalConsoleLog;
            expect(mockEgoJS.mock.mocks.deleteCache.mock.calls.length).toEqual(1);
            expect(mockTable.mock.mocks.constructor.mock.calls.length).toEqual(1);
            expect(mockTable.mock.mocks.push.mock.calls.length).toEqual(3);
        });
    });

});
