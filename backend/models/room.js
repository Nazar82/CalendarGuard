'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const schemaObject = {
    id: {type: String, unique: true},
    name: {type: String},
    locationPrefix: {type: String},
    createdAt: {type: Date},
    updatedAt: {type: Date}
};

let RoomSchema = new Schema(schemaObject);

RoomSchema.pre('save', function(next) {
    let currentDate = new Date();

    this.updatedAt = currentDate;

    if(!this.createdAt) {
        this.createdAt = currentDate;
    }

    next();
});

module.exports = mongoose.model('Room', RoomSchema);