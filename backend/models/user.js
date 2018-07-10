'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schemaObject = {
    createdAt: {type: Date},
    email: {type: String},
    name: {type: String},
    request: {
        reason: String,
        requestDate: {type: Date},
    },
    roles: {
        __global_roles__: [String]
    },
    updatedAt: {type: Date},
    username: {type: String},
    updated: {type: Date}
};

const UserSchema = new Schema(schemaObject);

UserSchema.pre('save', function (next) {

    let currentDate = new Date();

    this.updatedAt = currentDate;

    if (!this.createdAt) {
        this.createdAt = currentDate;
    }

    next();
});

module.exports = mongoose.model('User', UserSchema);