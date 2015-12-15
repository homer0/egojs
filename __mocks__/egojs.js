'use strict';

// __mocks__/egojs.js

class EgoJSMock{

    constructor() {

        this.settings = null;
        this.stats = null;
        this.package = null;
        this.mocks = {
            constructor: jest.genMockFunction(),
            setGitHubToken: jest.genMockFunction(),
            getStats: jest.genMockFunction(),
            addPackage: jest.genMockFunction(),
            getPackage: jest.genMockFunction(),
            editPackage: jest.genMockFunction(),
            removePackage: jest.genMockFunction(),
            deleteCache: jest.genMockFunction(),
        };
    }

    newInstance() {
        this.mocks.constructor();
        return this;
    }

    setGitHubToken(token) {
        this.mocks.setGitHubToken.apply(this, arguments);
        this.settings = {
            ghToken: token,
        };
    }

    getStats() {
        this.mocks.getStats.apply(this, arguments);
        return this.stats;
    }

    addPackage() {
        this.mocks.addPackage.apply(this, arguments);
        return {};
    }

    getPackage() {
        this.mocks.getPackage.apply(this, arguments);
        return new Promise(((resolve) => {
            resolve(this.package);
        }).bind(this));
    }

    editPackage() {
        this.mocks.editPackage.apply(this, arguments);
        return {};
    }

    removePackage() {
        this.mocks.removePackage.apply(this, arguments);
        return new Promise(((resolve) => {
            resolve(this.package);
        }).bind(this));
    }

    deleteCache() {
        this.mocks.deleteCache.apply(this, arguments);
    }

    resetMocks() {
        Object.keys(this.mocks).forEach((name) => {
            this.mocks[name].mockClear();
        }, this);

        this.settings = null;
        this.stats = null;
        this.package = null;
    }
};

const mockInstance = new EgoJSMock();

module.exports = {
    mock: mockInstance,
    module: () => mockInstance.newInstance(),
};
