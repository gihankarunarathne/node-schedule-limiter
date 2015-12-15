/**
 *
 */

'use strict';

let redis = require('redis');
let bluebird = require('bluebird');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
let debug = require('debug')('ScheduleLimiter:adapters:Redis');

module.exports = class Redis {
    constructor(opts) {
        this.tag = "SL";
        this.redisClient = redis.createClient(opts);
        this.redisClient.on('connect', () => {
            debug('Connected to Redis server with ', opts);
        });
        this.redisClient.on('error', (err) => {
            console.error(err);
        });
    }

    _generateRedisKey(id) {
        return {
            redis: this.tag + id.toString().slice(0, -2),
            hash: id.toString().substr(-2)
        };
    }

    setLimit(id, limit) {
        const keys = this._generateRedisKey(id);
        return this.redisClient.hsetAsync(keys.redis, keys.hash, limit);
    }

    getLimit(id) {
        const keys = this._generateRedisKey(id);
        return this.redisClient.hgetAsync(keys.redis, keys.hash);
    }

    increaseValues(id, tokens) {
        debug(`IncreaseValues ${id} tokens: `, tokens);

        const keys = this._generateRedisKey(id);
        let multiCommands = [];
        for (let year of Object.keys(tokens)) {
            for (let month of Object.keys(tokens[year])) {
                multiCommands.push(['hincrby', keys.redis,
                    keys.hash + year + month, tokens[year][month]
                ]);
            }
        }

        return new Promise((resolve, reject) => {
            this.redisClient.multi(multiCommands).execAsync().then(values => {
                let usage = {};
                let i = 0;

                for (let year of Object.keys(tokens)) {
                    usage[year] = {};
                    for (let month of Object.keys(tokens[year])) {
                        usage[year][month] = values[i];
                        i++;
                    }
                }
                resolve(usage);
            }).catch(err => {
                reject(err);
            });
        });
    }

    decreaseValues(id, tokens) {
        debug(`DecreaseValues ${id} tokens: `, tokens);

        const keys = this._generateRedisKey(id);
        let multiCommands = [];
        for (let year of Object.keys(tokens)) {
            for (let month of Object.keys(tokens[year])) {
                multiCommands.push(['hincrby', keys.redis,
                    keys.hash + year + month, -1 * tokens[year][month]
                ]);
            }
        }

        return new Promise((resolve, reject) => {
            this.redisClient.multi(multiCommands).execAsync().then(values => {
                let usage = {};
                let i = 0;

                for (let year of Object.keys(tokens)) {
                    usage[year] = {};
                    for (let month of Object.keys(tokens[year])) {
                        usage[year][month] = values[i];
                        i++;
                    }
                }
                resolve(usage);
            }).catch(err => {
                reject(err);
            });
        });
    }

    getUsage(id, months) {
        debug(`GetUsage ${id} months: `, months);

        const keys = this._generateRedisKey(id);
        let monthKeys = [];
        for (let year of Object.keys(months)) {
            for (let month of months[year]) {
                monthKeys.push(keys.hash + year + month);
            }
        }

        return new Promise((resolve, reject) => {
            this.redisClient.hmgetAsync(keys.redis, monthKeys).then(values => {
                let usage = {};
                let i = 0;

                for (let year of Object.keys(months)) {
                    usage[year] = {};
                    for (let month of months[year]) {
                        usage[year][month] = (values[i]) ? values[i] : 0;
                        i++;
                    }
                }
                resolve(usage);
            }).catch(err => {
                reject(err);
            });
        });
    }

};

// export default Redis;
