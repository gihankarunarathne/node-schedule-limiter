/**
 * A generic Schedule Limiter for NodeJS.
 *
 * USAGE:
 *
 */

'use strict';

let Adapter = require('./Adapter');

module.exports = class ScheduleLimiter {
    constructor(opts) {
        this.adapter = new Adapter(opts);
        this.scheduleUpto = 12; // (months) Able to schedule up to one year
    }

    setLimit(id, limit) {
        return this.adapter.setLimit(id, limit);
    }

    getLimit(id){
        return this.adapter.getLimit(id);
    }

    setLimits(limits){}

    getUsage(id, months){}
    isExceed(id, tokens, force) {
        if (!isNaN(tokens)) { // if a number, then create an Obj for current month
            const month = new Date().getMonth() + 1;
            tokens = [{
                month: tokens
            }];
        }
        // Set force default value as 'false'
        force = force || false;

        // Rollback Implementation
        // If success function fail at some point, then call failure fn backward
        for (let token of tokens) {
            this.adapter.increaseValue(id, tokens, force);
        }
    }

    cancelSchedule(id, tokens) {
        if (!isNaN(tokens)) { // if a number, then create an Obj for current month
            const month = new Date().getMonth() + 1;
            tokens = {
                month: tokens
            };
        }

    }

};

// export default ScheduleLimiter;
