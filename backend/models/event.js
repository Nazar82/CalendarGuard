'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const schemaObject = {
    id: {type: String, required: true, unique: true},
    htmlLink: {type: String},
    summary: {type: String},
    description: {type: String},
    startDate: {type: Date},
    endDate: {type: Date},
    statusInfo: {type: String},
    recurrence: {type: Array},
    recurringEventId: {type: String},
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
    },
    resource: {
        id: {type: String},
        name: {type: String}
    },
    filter: {type: String},

    // recurrence data
    recurrent: {type: Boolean, default: false},
    recurrentInstances: {},
    isLongBooking: {type: Boolean},
    status: {type: String, default: null}, // = state column
    notificationDate: {type: Date, default: null},
    ticketCreationDate: {type: Date, default: null},
    action: {type: String, default: null},
    yesHash: {type: String},
    noHash: {type: String},
    upToDate: {type: Boolean},
    failedToDelete: {type: Boolean, default: false},

    // simultaneity data
    processedAsSimultaneous: {type: Boolean, default: false}
};

const EventSchema = new Schema(schemaObject, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);