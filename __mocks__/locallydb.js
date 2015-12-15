'use strict';

// __mocks__/locallydb.js

class LocallyDBTableMock {

    constructor() {
        this.mocks = {
            where: jest.genMockFunction(),
            insert: jest.genMockFunction(),
            update: jest.genMockFunction(),
            remove: jest.genMockFunction(),
            get: jest.genMockFunction(),
        };
        this.whereResults = [];
        this.items = [];
        this.item = null;
        this.nextId = 0;
    }

    where(filter) {
        const indx = this.mocks.where.mock.calls.length;
        this.mocks.where(filter);
        return {
            items: this.whereResults[indx] || [],
        };
    }

    insert(record) {
        this.mocks.insert(record);
        return this.nextId;
    }

    update(cid, record) {
        this.mocks.update(cid, record);
        return this.nextId;
    }

    remove(cid) {
        this.mocks.remove(cid);
    }

    get(cid) {
        this.mocks.get(cid);
        return this.item;
    }

}

class LocallyDBMock {

    constructor() {
        this.mocks = {
            constructor: jest.genMockFunction(),
            collection: jest.genMockFunction(),
        };
        this.tables = {};
    }

    newInstance(path) {
        this.mocks.constructor.apply(this, arguments);
        return this;
    }

    collection(name) {
        this.mocks.collection(name);
        this.tables[name] = this.tables[name] || new LocallyDBTableMock(name);
        return this.tables[name];
    }

    addTable(name) {
        this.tables[name] = new LocallyDBTableMock(name);
    }

    resetMocks() {
        Object.keys(this.mocks).forEach((name) => {
            this.mocks[name].mockClear();
        }, this);

        Object.keys(this.tables).forEach((name) => {
            delete this.tables[name];
        }, this);
    }

}

const mockInstance = new LocallyDBMock();

module.exports = {
    mock: mockInstance,
    module: () => mockInstance.newInstance(),
};
