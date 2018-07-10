"use strict";

const Url = require('url');
const QueryString = require('querystring');

const Auth = require('./Auth.js');
const Utils = require('./Utils.js');
const async = require('async');
const moment = require('moment');
const Log = require('./log.js')(module);
const EventDB = require('./EventDB.js');
const Users = require('./Users.js');
const rp = require('request-promise');
const when = require('when');

const WHITELIST_PATH = './config/whitelist.ini';
const EVENTS_API_URL = 'https://www.googleapis.com/calendar/v3/calendars/calendarId/events';

const ES_NEW = "New";
const ES_ACTION_TAKEN = "Handled";
const ES_NO_ASSIGNED_USER = "No assigned user";
const ES_MAIL_SENT = "Message has been sent";

const EA_CONFIRMED = "Confirmed";
const EA_DECLINED = "Declined";
const EA_AUTO = "Auto";

const Resource = require('./models/resource');
const Event = require('./models/event');
const Creator = require('./models/creator');

class Events {

    /**
     * Removes outdated events
     * @param callback
     */
    validateEvents(callback) {
        Event.find({upToDate: false, startDate: {$gt: new Date()}}).remove().exec();
        Event.find({recurrent: true}, (err, events) => {
            async.each(events, (event, callback) => {
                let href = Url.parse(EVENTS_API_URL.replace('calendarId', event.resource.id)).href + '/' + event.id;
                let token = Auth.oAuthClient.credentials;
                let options = {
                    method: 'GET',
                    uri: href,
                    headers: {
                        'Authorization': token.token_type + ' ' + token.access_token
                    },
                    json: true
                };

                rp(options)
                    .then((data) => {
                        if (data && data.status && data.status === 'cancelled') {
                            event.remove((err) => {
                                callback(err);
                            });
                        } else {
                            callback(null);
                        }
                    })
                    .catch((err) => {
                        if (err.statusCode === 404) {
                            event.remove((err) => {
                                callback(err);
                            });
                        } else {
                            callback(null);
                        }
                    });
            }, (error) => {
                callback(error);
            });
        });
    }

    /**
     * Delete event from calendar
     * @param event
     */
    deleteEvent(event) {
        let href = Url.parse(EVENTS_API_URL.replace('calendarId', event.resource.id)).href + '/' + event.id;
        let token = Auth.oAuthClient.credentials;
        let options = {
            method: 'DELETE',
            uri: href,
            headers: {
                'Authorization': token.token_type + ' ' + token.access_token
            },
            json: true,
        };
        rp(options)
            .then((data) => {
                Log.info("Event's location was deleted");
            })
            .catch((err) => {
                Log.error('Events::deleteEvent() - Request Error: ' + err);

                if (err.statusCode !== 410) {
                    Event.findOne({id: event.id}, (err, event) => {
                        if (!err) {
                            event.failedToDelete = true;
                            Log.info(JSON.stringify(event));
                            event.save();
                            Log.info("Event " + event.summary + " will be deleted later");
                        }
                    });
                }
            });
    }

    /**
     * Finds event creator by email address
     * @param creatorEmail
     * @param callback
     */
    static getUserDataFromDb(creatorEmail, callback) {
        Creator.findOne({'primaryEmail': creatorEmail}, (err, creator) => {
            let eventUserData = null;

            if (err) {
                Log.debug('Event creator email : ' + creatorEmail + '; Search error : ' + err);
               }
            if (creator && typeof creator.primaryEmail !== "undefined" && typeof creator.creatorId !== "undefined") {
                Log.debug('Creator found in db : ' + creator.primaryEmail);
                eventUserData = creator;
            }
            callback(eventUserData);
        });
    }

    /**
     * Saves event creator into DB
     * @param eventUserData
     * @param callback
     */
    static saveUserData(eventUserData, callback) {
        let creatorObj = {
            primaryEmail: eventUserData.primaryEmail,
            creatorId: eventUserData.id,
            kind: eventUserData.kind,
            etag: eventUserData.etag,
            exists: eventUserData.exists,
            phones: eventUserData.phones,
            organizations: eventUserData.organizations,
            addresses: eventUserData.addresses,
            relations: eventUserData.relations,
            externalIds: eventUserData.externalIds,
            emails: eventUserData.emails,
            name: eventUserData.name
        };

        let saveCreator = new Creator(creatorObj);
        saveCreator.save((err) => {
            callback(null, creatorObj);
        });
    }

    /**
     * Gets events list
     * @param calendarId
     * @param token
     * @param items
     * @param pageToken
     * @param timeMinVal
     * @param singleEventsVal
     * @returns {object}
     */

    static getEvents(calendarId, token, items, pageToken, timeMinVal, singleEventsVal) {
        let href = Url.parse(EVENTS_API_URL.replace('calendarId', calendarId)).href + '?' + QueryString.stringify({
            timeMin: timeMinVal,
            singleEvents: singleEventsVal,
            maxResults: 2500, //Maximum number of events returned on one result page
            pageToken: pageToken || '' //Token specifying which result page to return
        });
        let options = {
            method: 'GET',
            uri: href,
            headers: {
                'Authorization': token.token_type + ' ' + token.access_token
            },
            json: true
        };
        let nextPageToken;

        items = items || [];

        return rp(options)
            .then((data) => {
                if (data.items) {
                    items = items.concat(data.items);
                    nextPageToken = data.nextPageToken;
                    if (nextPageToken) {
                        return Events.getEvents(calendarId, token, items, data.nextPageToken, timeMinVal, singleEventsVal);
                    } else {
                        return items;
                    }
                }
            })
            .catch((err) => {
                Log.error('Events::getEvents() - Request Error: ' + err);
                return items;
            });
    }

    /**
     * Returns whitelist
     * @param path
     * @returns {mixed}
     */
    static getWhitelist(path) {
        let data = Utils.readFileSync(path);

        if (data.error) {
            Log.error('getWhitelist:', data.error);
            return -1;
        }

        return data.split('\r\n');
    }

    /**
     * Returns event creator's data
     * @param email
     * @param callback
     */
    getCreatorData(email, callback) {
        if (typeof this.creatorsArray[email] === 'undefined' || this.creatorsArray[email] === null) {
            Events.getUserDataFromDb(email, (eventData) => {
                // get user data if not found in db
                if (eventData === null) {
                    Users.getProfile(email, (userData) => {
                        if (userData !== null && userData !== "undefined") {
                            Events.saveUserData(userData, () => {
                                this.creatorsArray[email] = eventData;
                                callback(userData);
                            });
                        } else {
                            callback(null);
                        }
                    });
                } else {
                    this.creatorsArray[email] = eventData;
                    callback(eventData);
                }
            });
        } else {
            callback(this.creatorsArray[email]);
        }
    }

    /**
     * Process event and saves it into DB
     * @param eventCreatorData
     * @param event
     * @param resource
     * @param callback
     */
    processEvent(eventCreatorData, event, resource, callback) {
        let self = this;
        let whitelist = Events.getWhitelist(WHITELIST_PATH);
        let objEvent;

        //save event
        if (eventCreatorData !== null && eventCreatorData !== "undefined"
            && moment(event.start.dateTime).isBefore(moment().add(2 * self.settings.general.longBookingsPeriod, 'days'))) {
            let eventRecurringEventId = null;
            let attendee;

            //if it is not valid event
            if (!(event.creator && event.status !== 'cancelled' && event.attendees)) {
                callback();
                return;
            }

            //if creator in whitelist
            if (whitelist.indexOf(event.creator.email) !== -1) {
                callback();
                return;
            }
            //if room not accepted the invite
            for (let i = 0; i < event.attendees.length; i++) {
                attendee = event.attendees[i];
                if (attendee.email === resource.resourceEmail && attendee.responseStatus !== 'accepted') {
                    callback();
                    return;
                }
            }

            // set event parent recurring id
            if (typeof event.recurringEventId !== 'undefined' && event.recurringEventId !== null) {
                eventRecurringEventId = event.recurringEventId;
            }

            objEvent = {
                id: event.id,
                htmlLink: event.htmlLink,
                summary: event.summary,
                description: event.description,
                startDate: moment(event.start.dateTime || event.start.date),
                endDate: moment(event.end.dateTime || event.end.date),
                statusInfo: event.status,
                creator: eventCreatorData,
                resource: {
                    id: resource.resourceEmail,
                    name: resource.resourceCommonName
                },
                recurrence: event.recurrence,
                recurringEventId: eventRecurringEventId,
                upToDate: true
            };

            EventDB.saveEventDb(objEvent, () => {
                callback();
            });
        } else {
            callback();
        }
    }

    /**
     * Updates events
     * @param settings
     * @param callback
     */
    updateEvents(settings, callback) {
        let self = this;

        self._callback = callback;
        self._error = null;
        self.creatorsArray = [];
        self.settings = settings;

        async.waterfall([
                (callback) => {
                    Event.update({}, {upToDate: false}, {multi: true}, (err) => {
                        callback(err);
                    });
                },
                (callback) => {
                    self.downloadEvents((error) => {
                        return callback(error);
                    });
                },
                (callback) => {
                    self.validateEvents((error) => {
                        return callback(error);
                    });
                }],
            (err) => {
                self.end(err);
            });
    }

    /**
     * Downloads events and stores them into DB
     * @param callback
     */
    downloadEvents(callback) {
        let self = this;

        Resource.find({}, (err, resources) => {
            if (err) {
                callback(err);
            } else {
                let roomsLeft = resources.length;
                //Prepare queue tasks
                async.each(resources, (resource, resourceCallback) => {
                    let eventsPromises = [
                        // all parent events
                        Events.getEvents(resource.resourceEmail, Auth.oAuthClient.credentials, [], '', moment().startOf('week').format(), false),
                        // all other events
                        Events.getEvents(resource.resourceEmail, Auth.oAuthClient.credentials, [], '', moment().startOf('week').format(), true)
                    ];

                    when.all(eventsPromises).then((eventsPromisesResults) => {
                        // concat all events to allEvents array
                        let allEvents = eventsPromisesResults[0].concat(eventsPromisesResults[1]);

                        if (allEvents.length > 0) {
                            async.each(allEvents, (event, callback) => {
                                // To process (save in DB) an event we need information about the creator of the event
                                if (typeof event.creator !== "undefined" && typeof event.creator.email !== "undefined") {
                                    self.getCreatorData(event.creator.email, (eventCreatorData) => {
                                        self.processEvent(eventCreatorData, event, resource, () => {
                                            callback(null);
                                        });
                                    });
                                } else {
                                    callback(null);
                                }
                            }, (error) => {
                                Log.info('All events processed for room ' + resource.resourceCommonName);
                                resourceCallback(error);
                            });
                        } else {
                            resourceCallback(null)
                        }
                    });
                }, (error) => {
                    callback(error);
                });
            }
        });
    }

    get error() {
        return this._error;
    }

    end(error) {
        this._error = error || null;
        this._callback();
    }
}

Events.prototype.Status = {
    ES_NEW: ES_NEW,
    ES_MAIL_SENT: ES_MAIL_SENT,
    ES_ACTION_TAKEN: ES_ACTION_TAKEN,
    ES_NO_ASSIGNED_USER: ES_NO_ASSIGNED_USER
};

Events.prototype.Action = {
    EA_CONFIRMED: EA_CONFIRMED,
    EA_DECLINED: EA_DECLINED,
    EA_AUTO: EA_AUTO
};

module.exports = new Events();