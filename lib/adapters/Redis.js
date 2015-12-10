/**
 *
 */

'use strict';

let RedisClient = require('redis');

class Redis {
    constructor(opts) {
        this.redisClient = RedisClient.createClient(opts);
    }

    _generateRedisKey(id) {
        return {
            redisKey: this.tag + id.toString().slice(0, -2),
            hashKey: id.toString().substr(-2)
        };
    }

}

export default Redis;
