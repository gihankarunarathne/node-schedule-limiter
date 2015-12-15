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
        const keys = this._generateRedisKey(id);
        return this.redisClient.hgetAsync(keys.redis, keys.hash);
    }

    getUsage(id, months) {
        const keys = this._generateRedisKey(id);
        return this.redisClient.hgetAsync(keys.redis, keys.hash);
    }

};

// export default Redis;
