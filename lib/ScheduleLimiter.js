/**
 * A generic Schedule Limiter for NodeJS.
 *
 * USAGE:
 *
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
        for(let month of Object.keys(monthMapping)) {
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
    setLimits(limits) {}

    /**
     * Set the limit against particular id. Then this limit will consider as
     * limit for every month
     * @param id {Integer/String} ID (appId or userId) which want to limit
     * @param months {Integer/String/Object} Month number or First three letters
     * or Array of Months s.t. ['Jan', 'feb', 3]
     * @return {Object} Remaining limits for each month s.t.
     * {'1': 10, '2': 15, '3': 20, '4': 30}
     */
    getUsage(id, months) {}

    /**
     * Increase the usage value of given set of months against particular ID.
     * If successfully increase the values, return values after increment.
     * Otherwise rollback to previous state and return an error.
     * @param id {Integer/String} ID (appId or userId) which want to limit
     * @param tokens {Object} Number of tokens which want to use s.t.
     * {'Jan' 10, 'feb': 15, 3: 20, '4': 30}
     * @return {Object} Remaining limits for each month s.t.
     * {'1': 10, '2': 15, '3': 20, '4': 30}
     */
    isExceed(id, tokens, force) {
        debug(`IsExceed ${id} tokens: `, tokens);
        if (!isNaN(tokens)) { // if a number, then create an Obj for current month
            const month = new Date().getMonth() + 1;
            tokens = [{
                month: tokens
            }];
        }
        // Set force default value as 'false'
        force = force || false;

        /**
         * There are two approach to check the limit and set the values
         * 1. Increase the usage with given token values, then compare return
         *    values (new usage) with limit whether it exceeds
         *    -> If exceeds > rollback
         *    -> Otherwise > do nothing
         * E.g. In Redis, one database call (when exceeds, two database calls)
         * 2. Get the usage according to given tokens, then compare with limit
         *    with considering if it increase the token value, then exceeds the
         *    limit
         *    -> If exceeds > do nothing
         *    -> Otherwise  > increase the usage
         * E.g. In Redis, two database call (when exceeds, one database calls)
         */
        // Rollback Implementation
        // If success function fail at some point, then call failure fn backward
        for (let token of Object.keys(tokens)) {
            this.adapter.increaseValue(id, tokens, force);
        }
    }

    /**
     * Cancel previously schedule by decrease the usage value of given set of
     * months against particular ID.
     * If successfully decrease the values, return values after decrement.
     * Otherwise rollback to previous state and return an error.
     * @param id {Integer/String} ID (appId or userId) which want to limit
     * @param tokens {Object} Number of tokens which want to use s.t.
     * {'Jan' 10, 'feb': 15, 3: 20}
     * @return {Object} Remaining limits for each month s.t.
     * {'1': 10, '2': 15, '3': 20, '4': 30}
     */
    cancelSchedule(id, tokens) {
        if (!isNaN(tokens)) {//if a number,then create an Obj for current month
            const month = new Date().getMonth() + 1;
            tokens = {
                month: tokens
            };
        }

    }

};

// export default ScheduleLimiter;
