/**
 * A generic Schedule Limiter for NodeJS.
 *
 * USAGE:
 *
 */

'use strict';

let Adapter = require('./Adapter');

class ScheduleLimiter {
    constructor(opts) {
        this.adapter = new Adapter(opts);
        this.scheduleUpto = 12; // (months) Able to schedule up to one year
    }

    setLimit(id, limit) {
        this.adapter.setLimit(id, limit);
    }

    isExceed(id, tokens, force) {

    }

    cancelSchedule(id, tokens) {

    }
}

export default ScheduleLimiter;
