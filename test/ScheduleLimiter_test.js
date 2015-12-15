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
            redisClient.flushall((err) => {
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
            limiter.setLimit(1, 10).then(limit => {
                limiter.getLimit(1).then(limit => {
                    assert.equal(limit, 10);
                    done();
                });
            });
        });
    }); // END - setLimit

    describe('isExceed ', () => {
        it('should block after limit exceeds ', done => {
            const id = 1;
            const tokens = {
                '2015': {
                    'Jan': 5,
                    'feb': 6,
                    3: 7,
                    '4': 8
                }
            };
            limiter.setLimit(id, 10).then(limit => {
                limiter.createSchedule(id, tokens).then(usage => {
                    debug('usage ', usage);
                    assert.equal(usage['2015']['1'], 5);
                    assert.equal(usage['2015']['2'], 6);
                    assert.equal(usage['2015']['3'], 7);
                    assert.equal(usage['2015']['4'], 8);
                    done();
                });
            });
        });
    }); // END - isExceed

    describe('cancelSchedule ', () => {

    }); // END - cancelSchedule

    describe('_formatMonths ', () => {
        it('should format months to common number format ', done => {
            const tokens = {
                '2015': {
                    'Jan': 5,
                    'feb': 6,
                    3: 7
                },
                '2016': {
                    '4': 8
                }
            };
            const formattedTokens = limiter._formatMonths(tokens);
            assert.equal(formattedTokens['2015']['1'], 5);
            assert.equal(formattedTokens['2015']['2'], 6);
            assert.equal(formattedTokens['2015']['3'], 7);
            assert.equal(formattedTokens['2016']['4'], 8);
            done();
        });
    }); // END - _formatMonths

    describe('_isExceed ', () => {
        it('should return true if not exceeds ', done => {
            const limit = 10;
            const usage = {
                '2015': {
                    '1': 5,
                    '2': 6,
                    '3': 7
                },
                '2016': {
                    '4': 8
                }
            };
            const tokens = {
                '2015': {
                    '1': 5,
                    '2': 4,
                    '3': 3
                },
                '2016': {
                    '4': 2
                }
            };
            assert.ok(limiter._isExceed(limit, usage, tokens).state);
            done();
        });

        it('should return false if exceeds ', done => {
            const limit = 10;
            const usage = {
                '2015': {
                    '1': 5,
                    '2': 5,
                    '3': 5
                },
                '2016': {
                    '4': 5
                }
            };
            const tokens = {
                '2015': {
                    '1': 5,
                    '2': 6,
                    '3': 11
                },
                '2016': {
                    '4': 8
                }
            };
            console.log(limiter._isExceed(limit, usage, tokens));
            assert.ok(!limiter._isExceed(limit, usage, tokens).state);
            done();
        });
    });

}); // END - ScheduleLimiter
