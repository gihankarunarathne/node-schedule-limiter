/**
 *
 */

'use strict';

let Memory = require('./adapters/Memory');
let Redis = require('./adapters/Redis');

module.exports = class Adapter {
    /**
     * Create a new instance of Adapter with given type of Database
     * USAGE:
     * opts {Object} set of options as an Object in following format
     * {
     *   database: {
     *     type: 'Memory|Redis',
     *     options: {}
     *   }
     * }
     * E.g. Redis Database
     * {
     *   database: {
     *     type: 'Redis',
     *     options: {
     *       host: '127.0.0.1',
     *       port: 6379
     *     }
     *   }
     * }
     */
    constructor(opts) {
        this.tag = 'SL';

        switch (opts.database.type.toLowerCase()) {
            case 'memory':
                this.store = new Memory();
                break;
            case 'redis':
                this.store = new Redis(opts.database.options);
                break;
            default:
                throw new Error(`Unknown database type ${opts.database.type}.`);
                break;
        }
    }

    setLimit(id, limit) {
        return this.store.setLimit(id, limit);
    }

    getLimit(id) {
        return this.store.getLimit(id);
    }

    /**
     * Increase current usage of each month with given token sizes
     * @param id {Integer/String} ID (appId or userId) which want to limit
     * @param tokens {Object} Number of tokens which want to use s.t.
     * {'2015': {'Jan': 10, 'feb': 15, 3: 20, '4': 30}, '2016': {'1': 40}}
     * @return {Object} Remaining limits for each month s.t.
     * {'2015': {'1': 10, '2': 15, '3': 20, '4': 30}, '2016': {'1': 40}}
     */
    increaseValues(id, tokens) {
        return this.store.increaseValues(id, tokens);
    }

    /**
     * Get the current usage (used tokens) against a particular id.
     * @param id {Integer/String} ID (appId or userId) which want to limit
     * @param months {Object} Object which contains Months Array s.t.
     * {'2015': ['1', '2', 3], '2016': ['4']}
     * @return {Object} Remaining limits for each month s.t.
     * {'2015': {'1': 10, '2': 15, '3': 20}, '2016': {'4': 30}}
     */
    getUsage(id, months) {
        return this.store.getUsage(id, months);
    }
};

//export default Adapter;
