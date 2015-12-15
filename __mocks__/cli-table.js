'use strict';

// __mocks__/cli-table.js

class CliTableMock{

    constructor() {

        this.mocks = {
            constructor: jest.genMockFunction(),
            push: jest.genMockFunction(),
        };
    }

    newInstance() {
        this.mocks.constructor();
        return this;
    }

    push() {
        this.mocks.push.apply(this, arguments);
    }

    resetMocks() {
        Object.keys(this.mocks).forEach((name) => {
            this.mocks[name].mockClear();
        }, this);
    }
};

const mockInstance = new CliTableMock();

module.exports = {
    mock: mockInstance,
    module: () => mockInstance.newInstance(),
};
