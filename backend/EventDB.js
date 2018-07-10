"use strict";

const Event = require('./models/event');

/**
 * Saves array of events into DB
 * @param data
 */
exports.saveEventList = (data) => {
    data.forEach((event, index) => {
        Event.findOne({id: event.id}, (err, res) => {
            if (!err && res === null) {
                new Event(event).save();
            }
        });
    });
};

/**
 * Saves event into DB
 * @param event
 * @param callback
 */
exports.saveEventDb = (event, callback) => {
    Event.findOneAndUpdate({id: event.id}, event, {upsert: true, setDefaultsOnInsert: true}, (err, event) => {
        callback(err);
    });
};