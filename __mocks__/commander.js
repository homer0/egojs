'use strict';

// __mocks__/commander.js

const commanderMock = {

    mocks: {
        command: jest.genMockFunction(),
        description: jest.genMockFunction(),
        action: jest.genMockFunction(),
        version: jest.genMockFunction(),
        parse: jest.genMockFunction(),
    },

    options: [{
        flags: '-V, --version',
        required: 0,
        optional: 0,
        bool: true,
        short: '-V',
        long: '--version',
        description: 'output the version number',
    },],

    command(value) {
        this.mocks.command(value);
        return this;
    },

    description(value) {
        this.mocks.description(value);
        return this;
    },

    action(value) {
        this.mocks.action(value);
        return this;
    },

    version(value) {
        this.mocks.version(value);
        return this;
    },

    parse(value) {
        this.mocks.parse(value);
        return this;
    },

    reset: function() {
        for (const mock in this.mocks) {
            this.mocks[mock].mockClear();
        }

        this.args = [];
    },

    args: [],
};

module.exports = commanderMock;
