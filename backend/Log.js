"use strict";

const winston = require('winston');
const moment = require('moment');
require('winston-mongodb').MongoDB;

module.exports = (module) => {
    return makeLogger(module.filename);
};

function makeLogger(path) {

    let timestamp = () => {
        return moment().format();
    };

    let transports = [
        new winston.transports.Console({
            colorize: true,
            level: 'info',
            timestamp: timestamp
        }), new winston.transports.MongoDB({
            db: 'mongodb://127.0.0.1:81/gleye',
            collection: 'logs',
            level: 'info',
            timestamp: timestamp
        }), new winston.transports.File({
            level: 'debug',
            timestamp: timestamp,
            filename: 'debug.log',
            json: true,
            prettyPrint: true
        })
    ];

    return new winston.Logger({
        transports: transports
    });
}