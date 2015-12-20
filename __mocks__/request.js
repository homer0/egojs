'use strict';

// __mocks__/fs.js

// Get the automatic mock for `request`
const requestMock = jest.genMockFromModule('request');

let fileContent = null;

function __setReponse(content) {
    if (typeof content !== 'string') {
        content = JSON.stringify(content);
    }

    fileContent = content;
}

module.exports = requestMock;
