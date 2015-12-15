/**
 * Test cases for Adapter
 * USAGE:
 *   1. Go to the project directory and run `npm install`
 *   2. Run test cases `gulp test`
 */

'use strict';

let assert = require('assert');
let Adapter = require('../lib/Adapter.js');
const testConf = require('./config.json');
let debug = require('debug')('ScheduleLimiter:test:Adapter');

describe('Adapter ', () => {
    let adapter = null;

    before(done => {
        debug('Before');
        adapter = new Adapter(testConf);
        done();
    }); // END - before

    after(done => {
        done();
    }); // END - after

    beforeEach(done => {
        let redisClient = require('redis').createClient(testConf.database.options);
        redisClient.on('ready', () => {
            redisClient.flushall((err) => {
                assert.ifError(err);
                done();
            });
        });
    });

    describe('increaseValues ', () => {
        it('should increase values', done => {
            const id = 1000;
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
            const months = {
                '2015': ['1', '2', '3']
            };
            adapter.increaseValues(id, tokens).then(values => {
                assert.equal(values['2015']['1'], 5);
                assert.equal(values['2015']['2'], 6);
                assert.equal(values['2015']['3'], 11);
                assert.equal(values['2016']['4'], 8);
                adapter.getUsage(id, months).then(usage => {
                    assert.equal(usage['2015']['1'], 5);
                    done();
                });
            }).catch(err => {

            });
        });
    });

    describe('getUsage ', () => {
        it('should return usage', done => {
            const id = 1000;
            const months = {
                '2015': ['1', '2', '3']
            };

            adapter.getUsage(id, months).then(usage => {
                debug('usage: ', usage);
                assert.equal(usage['2015']['1'], 0);
                assert.equal(usage['2015']['2'], 0);
                assert.equal(usage['2015']['3'], 0);
                done();
            }).catch(err => {
                assert.ifError(err);
            });
        });
    });

});
