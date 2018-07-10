'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const schemaObject = {
    events: [],
    id: {type: String, required: true, unique: true},
    action: {type: String, default: null},
    yesHash: {type: String},
    noHash: {type: String},
    notificationDate: {type: Date, default: null},
    status: {type: String, default: null}, // = state column
    startDate: {type: Date},
    creator: {
        kind: {type: String},
        id: {type: String},
        etag: {type: String},
        primaryEmail: {type: String},
        name: {
            givenName: {type: String},
            familyName: {type: String},
            fullName: {type: String}
        },
        emails: [
            {
                address: {type: String},
                primary: {type: Boolean}
            }
        ],
        externalIds: [
            {
                value: {type: String},
                type: {type: String},
                customType: {type: String}
            },
            {
                value: {type: String},
                type: {type: String}
            }
        ],
        relations: [
            {
                value: {type: String},
                type: {type: String}
            }
        ],
        addresses: [
            {
                type: {type: String},
                primary: {type: Boolean}
            }
        ],
        organizations: [
            {
                name: {type: String},
                title: {type: String},
                primary: {type: Boolean},
                customType: {type: String},
                department: {type: String},
                location: {type: String}
            }
        ],
        phones: [
            {
                value: {type: String},
                type: {type: String}
            },
            {
                value: {type: String},
                type: {type: String}
            },
            {
                value: {type: String},
                type: {type: String}
            }
        ],
        exists: {type: Boolean}
    }
};

const schema = new Schema(schemaObject);

schema.pre('save', (next) => {
    let currentDate = new Date();
    this.updatedAt = currentDate;

    if (!this.createdAt) {
        this.createdAt = currentDate;
    }

    next();
});

module.exports = mongoose.model('simultaneouslyevents', schema);