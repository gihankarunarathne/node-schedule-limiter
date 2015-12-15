# node-schedule-limiter
A generic Schedule rate limiter for NodeJS. Useful for API clients and sms, email, notification daemons which tasks that need to be throttled.

## Installation

Use NPM to install using;

`npm install schedule-limiter --save`

## Getting Started

```JavaScript
let ScheduleLimiter = require('schedule-limiter');
let limiter = new ScheduleLimiter({
    database: {
        type: 'Redis',
        options: {
            host: 'localhost',
            port: 6379
        }
    }
});
let id = 1; // e.g. userId
limiter.setLimit(id,100); // Set Limit as 100
limiter.createSchedule(id, {'2015': {'Dec': 50}, '2016': {'Jan': 60}})
  .then(function(usage) {
      callMyRequestSendingFunction(...);
  }).catch(function(error) {
      console.log(error.message);
      // Handle error and notify user
  });
limiter.getUsage(id, {'2015': ['Dec'], '2016': ['Jan', 'Feb'] })
  .then(function(usage) {
      console.log(usage);
      // {'2015': {'12': 50}, '2016': {'1': 60, '2': 0}}
  });
limiter.cancelSchedule(id, {'2015': {'Dec': 50}, '2016': {'Jan': 60}})
  .then(function(usage) {
      callMyFunction(...);
  }).catch(function(error) {
      console.log(error.message);
      // Handle error and notify user
  });
```

## API

Following methods are available in Schedule Limiter;

1. [constructor](#constructor)
2. [setLimit(id, limit)](#setlimitid-limit)
3. [getLimit(id)](#getlimitid)
4. [setLimits(limits)](#setlimitslimits)
5. [createSchedule(id, tokens \[,force\])](#createscheduleid-tokens-force)
6. [cancelSchedule(id, tokens \[,force\])](#cancelscheduleid-tokens-force)
7. [getUsage(id, months)](#getusageid-months))

### constructor
Create new instance of Schedule Limiter

```JavaScript
let ScheduleLimiter = require('schedule-limiter');
let limiter = new ScheduleLimiter({
   database: {
       type: 'Redis',
       options: {
           host: 'localhost',
           port: 6379
       }
   }
});
```

### setLimit(id, limit)
Set the limit against particular id. Then this limit will consider as
limit for every month

###### Parameters
- **id** : *{Integer/String}* ID (appId or userId) which want to limit
- **limit** : *{Integer}* Limit value

### getLimit(id)
Get the stored limit against particular ID

###### Parameters
- **id** : *{Integer/String}* ID (appId or userId) which want to limit

###### Return
*{Integer}* Limit value

### setLimits(limits)
Set the limit against particular id. Then this limit will consider as
limit for every month

###### Parameters
- **limit** : *{Array}* Array of limit Objects s.t. [{'userId': 1000}, {'userId2: 500}, ...]

### createSchedule(id, tokens [,force])
Increase the usage value of given set of months against particular ID.
If successfully increase the values, return values after increment.
Otherwise rollback to previous state and return an error.

###### Parameters
- **id** : *{Integer/String}* ID (appId or userId) which want to limit
- **tokens** : *{Object}* Number of tokens which want to use s.t. {'2015': {'Jan': 10, 'feb': 15, 3: 20, '4': 30}, '2016': {'1': 40}}

###### Return
*{Object}* Remaining limits for each month s.t. {'2015': {'1': 10, '2': 15, '3': 20, '4': 30}, '2016': {'1': 40}}

### cancelSchedule(id, tokens [,force])
Increase the usage value of given set of months against particular ID.
If successfully increase the values, return values after increment.
Otherwise rollback to previous state and return an error.

###### Parameters
- **id** : *{Integer/String}* ID (appId or userId) which want to limit
- **tokens** : *{Object}* Number of tokens which want to use s.t. {'2015': {'Jan': 10, 'feb': 15, 3: 20, '4': 30}, '2016': {'1': 40}}

###### Return
*{Object}* Remaining limits for each month s.t. {'2015': {'1': 10, '2': 15, '3': 20, '4': 30}, '2016': {'1': 40}}

### getUsage(id, months)
Get the current usage (used tokens) against a particular id.

###### Parameters
- **id** : *{Integer/String}* ID (appId or userId) which want to limit
- **months** : *{Object}* Object which contains Months Array s.t. {'2015': ['Jan', 'feb', 3, '4']}

###### Return
*{Object}* Remaining limits for each month s.t. {'2015': {'1': 10, '2': 15, '3': 20, '4': 30}}

## License

This Software is licensed under [MIT License](/blob/master/LICENSE)

Copyright (c) 2015 Gihan Karunarathne <gckarunarathne@gmail.com>
