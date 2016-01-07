/**
 * A generic Schedule Limiter for NodeJS.
 *
 * USAGE:
 *   let ScheduleLimiter = require('schedule-limiter');
 *   let limiter = new ScheduleLimiter({
 *       database: {
 *           type: 'Redis',
 *           options: {
 *               host: 'localhost',
 *               port: 6379
 *           }
 *       }
 *   });
 *   let id = 1; // e.g. userId
 *   limiter.setLimit(id,100); // Set Limit as 100
 *   limiter.createSchedule(id, {'2015': {'Dec': 50}, '2016': {'Jan': 60}})
 *     .then(function(usage) {
 *         callMyRequestSendingFunction(...);
 *     }).catch(function(error) {
 *         console.log(error.message);
 *         // Handle error and notify user
 *     });
 *   limiter.getUsage(id, {'2015': ['Dec'], '2016': ['Jan', 'Feb'] })
 *     .then(function(usage) {
 *         console.log(usage);
 *         // {'2015': {'12': 50}, '2016': {'1': 60, '2': 0}}
 *     });
 *   limiter.cancelSchedule(id, {'2015': {'Dec': 50}, '2016': {'Jan': 60}})
 *     .then(function(usage) {
 *         callMyFunction(...);
 *     }).catch(function(error) {
 *         console.log(error.message);
 *         // Handle error and notify user
 *     });
 */

'use strict';

let Adapter = require('./Adapter');
let debug = require('debug')('ScheduleLimiter:lib:ScheduleLimiter');

module.exports = class ScheduleLimiter {
    constructor(opts) {
        this.adapter = new Adapter(opts);
        this.scheduleUpto = 12; // (months) Able to schedule up to one year
        const monthMapping = {
            'jan': 1,
            'feb': 2,
            'mar': 3,
            'apr': 4,
            'may': 5,
            'jun': 6,
            'jul': 7,
            'aug': 8,
            'sep': 9,
            'oct': 10,
            'nov': 11,
            'dec': 12
        };
        this.monthMap = new Map();
        for (let month of Object.keys(monthMapping)) {
            this.monthMap.set(month, monthMapping[month]);
        }
    }

    /**
     * Set the limit against particular id. Then this limit will consider as
     * limit for every month
     * @param id {Integer/String} ID (appId or userId) which want to limit
     * @param limit {Integer} Limit value
     */
    setLimit(id, limit) {
        return this.adapter.setLimit(id, limit);
    }

    /**
     * Get the stored limit against particular ID
     * @param id {Integer/String} ID (appId or userId) which want to limit
     * @return {Integer} Limit value
     */
    getLimit(id) {
        return this.adapter.getLimit(id);
    }

    /**
     * Set the limit against particular id. Then this limit will consider as
     * limit for every month
     * @param limit {Array} Array of limit Objects s.t.
     * [{'userId': 1000}, {'userId2: 500}, ...]
     */
    setLimits(limits) {

    }

    /**
     * Get the current usage (used tokens) against a particular id.
     * @param id {Integer/String} ID (appId or userId) which want to limit
     * @param months {Object} Object which contains Months Array s.t.
     * {'2015': ['Jan', 'feb', 3, '4']}
     * @param includeLimit {Boolean} Whether include current limit (Optional) Default `false`
     * @return {Object} Remaining limits for each month s.t.
     * {'2015': {'1': 10, '2': 15, '3': 20, '4': 30}}
     */
    getUsage(id, months, includeLimit) {
        this.adapter.getUsage(id, months, includeLimit);
    }

    /**
     * Increase the usage value of given set of months against particular ID.
     * If successfully increase the values, return values after increment.
     * Otherwise rollback to previous state and return an error.
     * @param id {Integer/String} ID (appId or userId) which want to limit
     * @param tokens {Object} Number of tokens which want to use s.t.
     * {'2015': {'Jan': 10, 'feb': 15, 3: 20, '4': 30}, '2016': {'1': 40}}
     * @return {Object} Remaining limits for each month s.t.
     * {'2015': {'1': 10, '2': 15, '3': 20, '4': 30}, '2016': {'1': 40}}
     */
    createSchedule(id, tokens, force) {
        debug(`CreateSchedule ${id} tokens: `, tokens);
        if (!isNaN(tokens)) { // if a number, then create an Obj for current month
            const month = new Date().getMonth() + 1;
            tokens = [{
                month: tokens
            }];
        }
        // Set force default value as 'false'
        force = force || false;

        /**
         * Reference: http://redis.io/commands/incr#pattern-rate-limiter
         *
         * There are two approach to check the limit and set the values
         * 1. Increase the usage with given token values, then compare return
         *    values (new usage) with limit whether it exceeds
         *    -> If exceeds > rollback
         *    -> Otherwise > do nothing
         * E.g. In Redis, one database call (when exceeds, two database calls)
         * 2. Get the usage according to given tokens, then compare with limit
         *    by considering if it increase the token value, then exceeds the
         *    limit
         *    -> If exceeds > do nothing
         *    -> Otherwise  > increase the usage
         * E.g. In Redis, two database call (when exceeds, one database calls)
         *
         * Both options have a race condition, which can be neglectable.
         */

        // TODO: 1nd option implementation (should be able to one of them)

        // 2nd option implementation
        const formattedTokens = this._formatMonths(tokens);
        let months = {};
        for (let year of Object.keys(formattedTokens)) {
            months[year] = Object.keys(formattedTokens[year]);
        }

        return new Promise((resolve, reject) => {
            this.adapter.getUsage(id, months, true).then(usage => {
                const limit = usage.limit;
                // Delete `limit` field
                delete usage.limit;
                const isExceed = this._isExceed(limit, usage, formattedTokens);
                if (isExceed.state) {
                    this.adapter.increaseValues(id, isExceed.tokens).
                    then(usage => {
                        resolve(usage);
                    }).catch(err => {
                        reject(err);
                    });
                } else {
                    reject(new Error(isExceed.message));
                }
            }).catch(err => {
                reject(err);
            });
        }); // END - 2nd Option
    }

    /**
     * Cancel previously schedule by decrease the usage value of given set of
     * months against particular ID.
     * If successfully decrease the values, return values after decrement.
     * Otherwise rollback to previous state and return an error.
     * @param id {Integer/String} ID (appId or userId) which want to limit
     * @param tokens {Object} Number of tokens which want to use s.t.
     * {'2015': {'Jan' 10, 'feb': 15, 3: 20}, '2016': {'4': 30}}
     * @return {Object} Remaining limits for each month s.t.
     * {'2015': {'1': 10, '2': 15, '3': 20}, '2016': {'4': 30}}
     */
    cancelSchedule(id, tokens, force) {
        debug(`CancelSchedule ${id} tokens: `, tokens);

        if (!isNaN(tokens)) { //if a number,then create an Obj for current month
            const month = new Date().getMonth() + 1;
            tokens = {
                month: tokens
            };
        }
        force = force || false;

        // 2nd Option implementation (reverse)
        const formattedTokens = this._formatMonths(tokens);
        let months = {};
        for (let year of Object.keys(formattedTokens)) {
            months[year] = Object.keys(formattedTokens[year]);
        }

        return new Promise((resolve, reject) => {
            this.adapter.getUsage(id, months).then(usage => {
                const isNegative = this._isNegative(usage, formattedTokens);
                if (isNegative.state) {
                    this.adapter.decreaseValues(id, isNegative.tokens).
                        then(usage => {
                            resolve(usage);
                        }).catch(err => {
                            reject(err);
                        });
                } else {
                    reject(new Error(isNegative.message));
                }
            }).catch(err => {
                reject(err);
            });
        }); // END - 2nd Option
    }

    /**
     * Format mixed month keys into Number format
     * @param tokens {Object} Number of tokens which want to use s.t.
     * {'2015': {'Jan' 10, 'feb': 15, 3: 20}, '2016': {'4': 30}}
     * @return {Object} Formatted token keys for each month s.t.
     * {'2015': {'1': 10, '2': 15, '3': 20}, '2016': {'4': 30}}
     */
    _formatMonths(tokens) {
        debug('_formatMonths tokens: ', tokens);

        let formattedTokens = {};
        for (let year of Object.keys(tokens)) {
            formattedTokens[year] = {};
            for (let month of Object.keys(tokens[year])) {
                let monthNumber = (isNaN(month)) ?
                    this.monthMap.get(month.toLowerCase()) : month;
                formattedTokens[year][monthNumber] = tokens[year][month];
            }
        }

        return formattedTokens;
    }

    _isExceed(limit, usage, tokens) {
        debug('_isExceed args : ', limit, usage, tokens);
        // If force enabled, possible removable token size get changed
        let newTokens = tokens;

        for (let year of Object.keys(usage)) {
            for (let month of Object.keys(usage[year])) {
                if (usage[year][month] + tokens[year][month] > limit) {
                    return {
                        state: false,
                        message: `Required amount of ${usage[year][month]} ` +
                          `exceeds the limit ${limit} in ${year}-${month} by ` +
                          `${(usage[year][month]+tokens[year][month] - limit)}.` +
                          ` Remained amount is ${limit - usage[year][month]}`
                    };
                }
            }
        }
        return {
            state: true,
            tokens: newTokens
        };
    }

    _isNegative(usage, tokens) {
        // If force enabled, possible removable token size get changed
        let newTokens = tokens;

        for (let year of Object.keys(usage)) {
            for (let month of Object.keys(usage[year])) {
                if ((usage[year][month] - tokens[year][month]) < 0) {
                    return {
                        state: false,
                        message: `Usage ${usage[year][month]} can't less than 0 in ${year}-${month}`
                    };
                }
            }
        }
        return {
            state: true,
            tokens: newTokens
        };
    }

};

// export default ScheduleLimiter;
