/**
 *
 */

'use strict';

let Memory = require('./adapters/Memory');
let Redis = require('./adapters/Redis');

class Adapter {
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

        switch (opts.database.type) {
            case 'Memory':
                this.store = new Memory();
                break;
            case 'Redis':
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

}

export default Adapter;
