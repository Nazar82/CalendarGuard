'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const schemaObject = {
    macAddress: {type: String},
    ipAddress: {type: String},
    status: {type: Date},
    assignedResource: {type: String},
    createdAt: {type: Date},
    updatedAt: {type: Date}
};

let DeviceSchema = new Schema(schemaObject);

DeviceSchema.pre('save', function(next) {
    let currentDate = new Date();

    this.updatedAt = currentDate;

    if(!this.createdAt) {
        this.createdAt = currentDate;
    }

    next();
});

module.exports = mongoose.model('Device', DeviceSchema);