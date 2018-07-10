'use strict';

var mongoose = require('mongoose');

const Schema = mongoose.Schema;

var creatorSchema = new Schema({
    primaryEmail: {type: String, required: true, unique: true},
    creatorId: {type: String, required: true, unique: true},
    kind: {type: String},
    etag: {type: String},
    exists: {type: Boolean},
    phones: [],
    organizations: [],
    addresses: [],
    relations: [],
    externalIds: [],
    emails: [],
    name: {},
    createdAt: {type: Date},
    updatedAt: {type: Date}
});

creatorSchema.pre('save', function (next) {
    let currentDate = new Date();

    this.updatedAt = currentDate;

    if (!this.createdAt) {
        this.createdAt = currentDate;
    }

    next();
});

var Creator = mongoose.model('Creator', creatorSchema);

module.exports = Creator;