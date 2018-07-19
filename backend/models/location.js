'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

function locationNameLengthChecker(locationName) {
    if (!locationName) {
        return false;
    }

    const MIN_LENGTH = 3;
    const MAX_LENGTH = 10;

    return !(locationName.length < MIN_LENGTH || locationName.length > MAX_LENGTH);
}

const locationNameValidators = [{
    validator: locationNameLengthChecker,
    message: 'Location name must be at least 3 characters long but no more than 10'
}];

const schemaObject = {
    createdAt: {type: Date},
    updatedAt: {type: Date},
    assignedUser: {type: String},
    locationName: {type: String, required: true, unique: true, validate: locationNameValidators}
};

const LocationSchema = new Schema(schemaObject);

LocationSchema.pre('save', function (next) {
    let currentDate = new Date();
    this.updatedAt = currentDate;

    if (!this.createdAt) {
        this.createdAt = currentDate;
    }

    next();
});

module.exports = mongoose.model('location', LocationSchema);