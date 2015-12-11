/**
 * Test cases for Schedule Limiter
 * USAGE:
 *   1. Go to the project directory and run `npm install`
 *   2. Run test cases `gulp test`
 */

'use strict';

let assert = require('assert');
let ScheduleLimiter = require('../lib/ScheduleLimiter.js');
const testConf = require('./config.json');
let debug = require('debug')('ScheduleLimiter:test:ScheduleLimiter');

describe('ScheduleLimiter ', () => {
    let limiter = null;

    before(done => {
        debug('Before');
        limiter = new ScheduleLimiter(testConf);
        done();
    }); // END - before

    after(done => {
        done();
    }); // END - after

    beforeEach(done => {
        let redisClient = require('redis').
                createClient(testConf.database.options);
        redisClient.on('ready', () => {
            redisClient.flushall((err)=> {
                assert.ifError(err);
                done();
            });
        });
    });

    describe('setLimit ', () => {
        it('should set limits ', done => {
            limiter.setLimit(1, 10).then(limit => {
                assert.equal(limit, 1);
                done();
            });
        });
    }); // END - setLimit

    describe('getLimit ', () => {
        it('should set limits ', done => {
            limiter.setLimit(10, 10).then(limit => {
                limiter.getLimit(10).then(limit => {
                    assert.equal(limit, 10);
                    done();
                });
            });
        });
    }); // END - setLimit

    describe('isExceed ', () => {

    }); // END - isExceed

    describe('cancelSchedule ', () => {

    }); // END - cancelSchedule

}); // END - ScheduleLimiter
