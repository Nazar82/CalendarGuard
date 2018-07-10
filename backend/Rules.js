'use strict';

const Events = require('./Events.js');
const Mail = require('./Nodemailer.js');
const Const = require('./Constant.js');
const Crypto = require('crypto');
const async = require('async');
const Log = require('./log.js')(module);
const moment = require('moment');
const Event = require('./models/event');
const Location = require('./models/location');
const User = require('./models/user');
const SimultaneousEvents = require('./models/simultaneouslyevents');
const Rrecur = require('rrecur').Rrecur;

class Rules {

    /**
     * Updates events, sets recurrent state, checks if event is long booked
     * @param callback
     */
    checkRecurrent(callback) {
        let self = this;

        Log.info("Rule running: setting all recurrent events;");

        Event.find({$and: [{'recurrence.0': {$exists: true}}]}, (err, events) => {
            if (err) {
                Log.error('Can\'t load events from db: ' + err);
                callback(err);
                return;
            }

            Log.info("Recurrent events count: " + events.length);

            async.each(events, (evt, callback) => {
                self.setRecurrentAndLongBookedState(evt, callback);
            }, (error) => {
                callback(error);
            });
        });
    }

    /**
     * Sets recurrent state, checks if event is long booked
     * @param event
     * @param callback
     */
    setRecurrentAndLongBookedState(event, callback) {
        let self = this;
        let recurrentInstances;
        let recurrentInstancesLength;

        // setting event status
        if (event.status === null) {
            event.status = Events.Status.ES_NEW;
        }

        Log.debug('Recurrent Event id: ' + event.id + '; Summary: ' + event.summary + '; status: ' + event.status);

        Event.find({'recurringEventId': event.id}, (err, recurrentEvents) => {

            if (err) {
                Log.error('Can\'t load events from db: ' + err);
                callback(err);
                return;
            }

            recurrentInstances = recurrentEvents;
            recurrentInstancesLength = recurrentInstances.length;

            Log.debug('Recurrent Event recurrentInstances count: ' + recurrentInstancesLength);

            // Sorts the recurring events in ascending order by dates
            if (recurrentInstancesLength !== 0) {
                recurrentInstances.sort((a, b) => {
                    return moment(a.startDate) - moment(b.startDate);
                });

                // Checks first and last recurring events and adds them to event object as recurrentInstances
                if (typeof recurrentInstances[0] !== 'undefined' && typeof recurrentInstances[recurrentInstancesLength - 1] !== 'undefined') {
                    let minDate = moment.max(moment(recurrentInstances[0].startDate), moment());
                    let maxDate = moment(recurrentInstances[recurrentInstancesLength - 1].startDate);
                    let isLongBookingEvent = false;
                    let currentDate = new Date();

                    event.recurrentInstances = {
                        first: recurrentInstances[0],
                        last: recurrentInstances[recurrentInstancesLength - 1]
                    };
                    event.recurrent = event.recurrentInstances.last.startDate > currentDate;

                    // Checks if event is long booked
                    if (maxDate.diff(minDate, 'd') >= self.settings.general.longBookingsPeriod) {
                        isLongBookingEvent = true;
                    }
                    event.isLongBooking = isLongBookingEvent;

                    Log.debug('isLongBookingEvent: ' + isLongBookingEvent + '; dates diff: ' + maxDate.diff(minDate, 'd') + "\n settings.general.longBookingsPeriod: " + self.settings.general.longBookingsPeriod);
                } else {
                    Log.debug('No first & last recurrent event!');
                }
                event.save((err) => {
                    callback(err);
                });
                Log.debug('Event saved');
            } else {
                Log.debug('No recurrentInstances; event id: ' + event.id);
                callback(null);
            }
        });
    }

    /**
     * Processes recurrent events
     * @param callback
     */
    processRecurrentEvents(callback) {
        let self = this;

        Event.find({recurrent: true}, (err, allRecurrentEvents) => {
            if (err) {
                Log.error('Cannot load Recurrent Events from db');
                callback(err);
                return;
            }
            Log.info('Loaded events: ' + allRecurrentEvents.length);

            async.each(allRecurrentEvents, (event, callback) => {
                Log.info("Processing event `" + event.summary + "`: " + (allRecurrentEvents.indexOf(event) + 1) + " out of " + allRecurrentEvents.length);

                switch (event.status) {
                    case Events.Status.ES_NEW:
                    case Events.Status.ES_NO_ASSIGNED_USER:
                        self.processNewEvent(event);
                        break;
                    case Events.Status.ES_MAIL_SENT:
                        self.processMailedEvent(event);
                        break;
                    case Events.Status.ES_ACTION_TAKEN:
                        self.processProcessedEvent(event);
                        break;
                }
                callback(null);
            }, (err) => {
                callback(err);
            });
        });
    }

    /**
     * Getting location prefix
     * @param event
     * @param callback
     */
    getLocationPrefix(event, callback) {
        let prefix = '';
        let eventPrefixInCity = event.resource.name.slice(0, 3);

        Location.find({}).lean().exec((err, locations) => {
            if (locations.length === 0) {
                Log.info('Location not found');
                return callback(null, 'location not found');
            }
            locations.forEach((location) => {
                if (location.locationName.length === 3 && location.locationName.indexOf(eventPrefixInCity) > -1) {
                    prefix = eventPrefixInCity;
                    callback(null, prefix);
                } else if (location.locationName.length > 3) {
                    let locationsPrefixes = location.locationName.split('-');
                    let eventPrefixes = event.resource.name.split('-');

                    if (locationsPrefixes[0] = eventPrefixes[0]) {
                        prefix = eventPrefixes[0];
                        return callback(null, prefix);
                    }
                }
            });

            // if (locations.length === 0) {
            //     callback(null, 'location not found');
            //     Log.info('Location not found');
            // } else {
            //     locations.forEach((location) => {
            //         if (location.locationName.length === 3 && location.locationName.indexOf(eventPrefixInCity) > -1) {
            //             prefix = eventPrefixInCity;
            //             callback(null, prefix);
            //         } else if (location.locationName.length > 3) {
            //             let locationsPrefixes = location.locationName.split('-');
            //             let eventPrefixes = event.resource.name.split('-');
            //
            //             if (locationsPrefixes[0] = eventPrefixes[0]) {
            //                 prefix = eventPrefixes[0];
            //                 callback(null, prefix);
            //             }
            //         }
            //     });
            // }
        });
    }

    /**
     * Gets location by a prefix
     * @param prefix
     * @param callback
     */
    getLocationByPrefix(prefix, callback) {

        if (prefix !== 'location not found') {
            Location.findOne({locationName: prefix}).lean().exec((err, location) => {
                if (err) {
                    Log.error('Location error: ' + err);
                    return callback(err);
                }
                if (location === null || !location.assignedUser) {
                    Log.error('Can\'t process an event because there no assigned user to location: ' + prefix);
                    return callback('no assigned user to location');
                }
                return callback(null, location.assignedUser);

                // if (err) {
                //     Log.error('Location error: ' + err);
                //     return callback(err);
                // } else if (location === null || !location.assignedUser) {
                //     Log.error('Can\'t process an event because there no assigned user to location: ' + prefix);
                //     return callback('no assigned user to location');
                // } else {
                //     return callback(null, location.assignedUser);
                // }
            });
        } else {
            User.findOne({name: 'calendar_guard_admin'}).lean().exec((err, user) => {
                let defaultUserID = user._id;
                Log.info('Locations empty. Email going to be sent to default user');
                callback(null, defaultUserID);
            });
        }
    }

    /** Gets a user by location
     * @param userId
     * @param callback
     */
    getUserByLocation(userId, callback) {

        User.findOne({_id: userId}).lean().exec((err, user) => {
            if (err) {
                return callback(err);
            }
            if (!user.email) {
                Log.error('Can\'t process an event because user has no email: ', {user: user.username});
                event.status = Events.Status.ES_NO_ASSIGNED_USER;
                event.action = 'No assigned user';
                event.save();
                return callback('user has no email');
            }
            return callback(null, user.email);

            // if (err) {
            //     return callback(err);
            // } else if (!user.email) {
            //     Log.error('Can\'t process an event because user has no email: ', {user: user.username});
            //     event.status = Events.Status.ES_NO_ASSIGNED_USER;
            //     event.action = 'No assigned user';
            //     event.save();
            //     return callback('user has no email');
            // } else {
            //     return callback(null, user.email);
            // }
        });
    }

    /**
     * Sends email from assigned to location user to event creator
     * @param event
     */
    processNewEvent(event) {
        let self = this;

        if (!event.isLongBooking) {
            return;
        }

        async.waterfall([
                (callback) => {
                    self.getLocationPrefix(event, callback);
                },
                self.getLocationByPrefix,
                self.getUserByLocation
            ],
            (err, userEmail) => {
                if (!err) {

                    // // Send email
                    let debugMode = self.settings.debug.debugMode;
                    let emailTo;

                    if (debugMode) {
                        emailTo = self.settings.debug.debugEmail;
                    } else {
                        // emailTo = event.creator.primaryEmail;
                    }

                    Log.info("Sending mail for " + event.summary + " to event creator: " + event.creator.primaryEmail);

                    event.yesHash = Crypto.createHash('md5').update('yes' + event.id).digest('hex');
                    event.noHash = Crypto.createHash('md5').update('no' + event.id).digest('hex');

                    Mail.send(userEmail, emailTo, Const.FIRST_SUBJECT, Const.FIRST_USER_TEMPLATE_PATH, (event, error) => {
                        if (!error) {

                            //commented in debug mode
                            event.status = Events.Status.ES_MAIL_SENT;
                            event.action = 'Pending';
                            event.notificationDate = moment();
                            event.save();
                            Log.info("Mail sent to: " + emailTo + '; event summary: ' + event.summary);
                        } else {
                            Log.error("Error sending mail about recurrent event to: " + event.creator.primaryEmail + ". Error: " + JSON.stringify(error));
                        }
                    }, event);
                } else {
                    Log.error(err);
                }
            }
        );
    }

    /**
     * Creates ticket for event, if waiting period is passed
     * @param event
     */
    processMailedEvent(event) {
        let self = this;
        let debugMode = self.settings.debug.debugMode;

        if (event.isLongBooking && (moment().diff(moment(event.notificationDate), 'd') >= self.settings.general.waitingPeriod)) {
            if (debugMode) {
                Log.info('It\'s debug mode! Event should have been deleted');
            } else {
                // Events.deleteEvent(event);
            }
        }
    }

    /**
     * Changes event status to 'new', if waiting period is passed
     * @param event
     */
    processProcessedEvent(event) {
        let self = this;
        let debugMode = self.settings.debug.debugMode;

        if (event.isLongBooking && (event.action === Events.Action.EA_CONFIRMED) && moment().isBefore(moment(event.recurrentInstances.last.startDate))
            && moment().diff(event.notificationDate, 'd') >= self.settings.general.longBookingsPeriod) {

            // Put event back to unprocessed
            event.status = Events.Status.ES_NEW;
            event.notificationDate = null;
            event.ticketCreationDate = null;
            event.action = 'Pending (Reopened)';
            event.save((err) => {
                if (!err) {
                    Log.info('Event put back to unprocessed: ' + event.summary);
                }
            });
        } else if (event.failedToDelete) {
            if (debugMode) {
                Log.info('It\'s debug mode! Event should have been deleted');
            } else {
                // Delete previously declined event
                // Events.deleteEvent(event);
            }
        }
    }

    /**
     * Handles user action from mail
     * @param id
     * @param hash
     */
    handleRecurrentEvent(id, hash) {
        let resEvent = null;
        let userChoice;
        let self = this;
        let debugMode = self.settings.debug.debugMode;

        Event.findOne({id: id}, (err, event) => {
            if (err) {
                resEvent = {'message': 'error', 'reason': 'err'};
                Log.error(err);
                return;
            }
            if (!event) {
                resEvent = {'message': 'error', 'reason': 'notfound'};
                Log.info('404 Event not found');
                return;
            }
            if (event && Events.Status.ES_ACTION_TAKEN !== event.status) {
                if (event.yesHash && event.yesHash === hash) {

                    // commented in debug mode
                    event.status = Events.Status.ES_ACTION_TAKEN;
                    event.action = Events.Action.EA_CONFIRMED;
                    event.save();
                    userChoice = true;
                    resEvent = event;
                    Log.info('Event %s was confirmed by %s', event.summary, event.creator.name.givenName);
                    return;
                }
                if (event.noHash && event.noHash === hash) {

                    // commented in debug mode
                    event.status = Events.Status.ES_ACTION_TAKEN;
                    event.action = Events.Action.EA_DECLINED;
                    event.save();
                    resEvent = event;
                    userChoice = false;
                    if (debugMode) {
                        Log.info('It\'s debug mode! Event should have been deleted');
                    } else {
                        // Events.deleteEvent(event);
                    }
                    Log.info('Event %s was declined by %s', event.summary, event.creator.name.givenName);
                    return;
                }
                resEvent = {'message': 'error', 'reason': 'hash'};
                Log.info('Unknown hash :( %s', hash);
            }

            // if (err) {
            //     resEvent = {'message': 'error', 'reason': 'err'};
            //     Log.error(err);
            // } else {
            //     if (!event) {
            //         resEvent = {'message': 'error', 'reason': 'notfound'};
            //         Log.info('404 Event not found');
            //     } else {
            //         if (event && Events.Status.ES_ACTION_TAKEN !== event.status) {
            //             if (event.yesHash && event.yesHash === hash) {
            //
            //                 // commented in debug mode
            //                 event.status = Events.Status.ES_ACTION_TAKEN;
            //                 event.action = Events.Action.EA_CONFIRMED;
            //                 event.save();
            //                 userChoice = true;
            //                 resEvent = event;
            //                 Log.info('Event %s was confirmed by %s', event.summary, event.creator.name.givenName);
            //
            //             } else if (event.noHash && event.noHash === hash) {
            //                 if (debugMode) {
            //                     Log.info('It\'s debug mode! Event should have been deleted');
            //                 } else {
            //                     // commented in debug mode
            //                     event.status = Events.Status.ES_ACTION_TAKEN;
            //                     event.action = Events.Action.EA_DECLINED;
            //                     event.save();
            //                     resEvent = event;
            //                     userChoice = false;
            //                     Log.info('Event should have been deleted');
            //                     // Events.deleteEvent(event);
            //                     Log.info('Event %s was declined by %s', event.summary, event.creator.name.givenName);
            //                 }
            //             } else {
            //                 resEvent = {'message': 'error', 'reason': 'hash'};
            //                 Log.info('Unknown hash :( %s', hash);
            //             }
            //         }
            //     }
            // }
        });
    }

    /**
     * Handles user action on simultaneous event mail
     * @param id
     * @param hash
     */
    handleSimultaneousEvents(id, hash) {
        let self = this;
        let debugMode = self.settings.debug.debugMode;

        SimultaneousEvents.findOne({id: id}, (err, simultaneousEventsGroup) => {
            if (err) {
                Log.error(err);
                return;
            }
            if (!simultaneousEventsGroup) {
                Log.info('404 Event not found');
                return;
            }
            if (simultaneousEventsGroup && Events.Status.ES_ACTION_TAKEN !== simultaneousEventsGroup.status) {
                // Changes simultaneous events group status to 'confirmed' if creator confirms the event
                if (simultaneousEventsGroup.yesHash && simultaneousEventsGroup.yesHash === hash) {
                    simultaneousEventsGroup.status = Events.Status.ES_ACTION_TAKEN;
                    simultaneousEventsGroup.action = Events.Action.EA_CONFIRMED;
                    simultaneousEventsGroup.save();
                    Log.info('Simultaneous events for %s were confirmed by %s', simultaneousEventsGroup.startDate.toLocaleString(), simultaneousEventsGroup.creator.name.givenName);
                    return;
                }
                // Deletes events from the simultaneous group
                if (simultaneousEventsGroup.noHash && simultaneousEventsGroup.noHash === hash) {
                    simultaneousEventsGroup.status = Events.Status.ES_ACTION_TAKEN;
                    simultaneousEventsGroup.action = Events.Action.EA_DECLINED;
                    simultaneousEventsGroup.save();
                    simultaneousEventsGroup.events.forEach((event) => {
                        if (debugMode) {
                            Log.info('It\'s debug mode! Event should have been deleted');
                        } else {
                            // Events.deleteEvent(event);
                        }
                    });
                    Log.info('Simultaneous events for %s were declined by %s', simultaneousEventsGroup.startDate.toLocaleString(), simultaneousEventsGroup.creator.name.givenName);
                    return;
                }
                Log.info('Unknown hash :( %s', hash);
            }


            // if (err) {
            //     Log.error(err);
            // } else {
            //     if (!simultaneousEventsGroup) {
            //         Log.info('404 Event not found');
            //     } else {
            //         if (simultaneousEventsGroup && Events.Status.ES_ACTION_TAKEN !== simultaneousEventsGroup.status) {
            //             if (simultaneousEventsGroup.yesHash && simultaneousEventsGroup.yesHash === hash) {
            //                 simultaneousEventsGroup.status = Events.Status.ES_ACTION_TAKEN;
            //                 simultaneousEventsGroup.action = Events.Action.EA_CONFIRMED;
            //                 simultaneousEventsGroup.save();
            //                 Log.info('Simultaneous events for %s were confirmed by %s', simultaneousEventsGroup.startDate.toLocaleString(), simultaneousEventsGroup.creator.name.givenName);
            //             } else if (simultaneousEventsGroup.noHash && simultaneousEventsGroup.noHash === hash) {
            //                 if (debugMode) {
            //                     Log.info('It\'s debug mode! Event should have been deleted');
            //                 } else {
            //                     simultaneousEventsGroup.status = Events.Status.ES_ACTION_TAKEN;
            //                     simultaneousEventsGroup.action = Events.Action.EA_DECLINED;
            //                     simultaneousEventsGroup.save();
            //                     simultaneousEventsGroup.events.forEach((event) => {
            //                         // Events.deleteEvent(event);
            //                     });
            //                     Log.info('Simultaneous events for %s were declined by %s', simultaneousEventsGroup.startDate.toLocaleString(), simultaneousEventsGroup.creator.name.givenName);
            //                 }
            //
            //             } else {
            //                 Log.info('Unknown hash :( %s', hash);
            //             }
            //         }
            //     }
            // }
        });
    }

    /**
     * Creates tickets for events without creator
     * @param callback
     */
    processOrphanEvents(callback) {
        let self = this;
        let debugMode = self.settings.debug.debugMode;

        Event.find({'creator.exists': false}, (err, events) => {
            if (err) {
                callback(err);
                return;
            }
            async.each(events, (event, callback) => {
                if (event.status !== Events.Status.ES_ACTION_TAKEN && !event.recurringEventId) {
                    if (debugMode) {
                        Log.info('It\'s debug mode! Event should have been deleted');
                    } else {
                        // Events.deleteEvent(event);
                    }
                }
                callback(null);
            }, (err) => {
                callback(err);
            });
        });
    }

    /**
     * Finds primary event of the simultaneous events group
     * @param event
     * @param overlappedEvents
     * @param processedEvents
     */
    findPrimaryEvent(event, overlappedEvents, processedEvents) {
        let self = this;
        Event.findOne({
            'id': event.recurringEventId,
            'recurringEventId': null
        }, (err, primaryEvent) => {
            if (err) {
                Log.error('Can\'t find primary event');
                return;
            }
            if (!primaryEvent || primaryEvent.processedAsSimultaneous || (primaryEvent.action === Events.Action.EA_CONFIRMED)) {
                return;
            }
            let recurrenceData = Rrecur.parse(primaryEvent.recurrence[0]);
            let overlappedIDs;
            let isOftenHapenned = (recurrenceData.freq === 'daily' || (recurrenceData.freq === 'weekly' && recurrenceData.byday.length > 2 && !recurrenceData.interval));

            //if overlapped events are recurrent - get primary events of overlapped events
            overlappedIDs = overlappedEvents.map((event) => {
                if (event.recurringEventId) {
                    return event.recurringEventId;
                } else {
                    return event.id;
                }
            });
            Event.find({id: {$in: overlappedIDs}}, (err, primaryOverlapped) => {
                if (primaryOverlapped.length === overlappedEvents.length) {
                    let checkedOverlappedEvents = [];
                    let recurrentOverlappedCount = 0;

                    // Save overlapped events for processing
                    for (let i = 0, recurrence; i < primaryOverlapped.length; i++) {
                        if (primaryOverlapped[i].recurrence && primaryOverlapped[i].recurrence[0]) {

                            //Process primary event if it is recurred often
                            recurrence = Rrecur.parse(primaryOverlapped[i].recurrence[0]);
                            if (primaryOverlapped[i].recurrence[0] === primaryEvent.recurrence[0]) {
                                checkedOverlappedEvents.push(primaryOverlapped[i]);
                                processedEvents.push(primaryOverlapped[i].id);
                                recurrentOverlappedCount++;
                                isOftenHapenned = true;
                            } else {
                                if (isOftenHapenned && (recurrence.freq === 'daily' || (recurrence.freq === 'weekly' && recurrence.byday.length > 2 && !recurrence.interval))) {
                                    checkedOverlappedEvents.push(primaryOverlapped[i]);
                                    processedEvents.push(primaryOverlapped[i].id);
                                    recurrentOverlappedCount++;
                                } else {
                                    checkedOverlappedEvents.push(overlappedEvents[i]);
                                }
                            }
                        } else {

                            //Process single event if it is not recurrent
                            checkedOverlappedEvents.push(primaryOverlapped[i]);
                            processedEvents.push(primaryOverlapped[i].id);
                        }
                    }
                    checkedOverlappedEvents = checkedOverlappedEvents.filter((event) => {
                        return !event.processedAsSimultaneous;
                    });
                    if (checkedOverlappedEvents.length) {
                        if (recurrentOverlappedCount && isOftenHapenned) {
                            checkedOverlappedEvents.push(primaryEvent);
                            self.sendSimultaneousMail(primaryEvent, checkedOverlappedEvents);
                        } else {
                            checkedOverlappedEvents.push(event);
                            self.sendSimultaneousMail(event, checkedOverlappedEvents);
                        }
                    }
                }
            });
        });
    }

    /**
     * Processes overlapped events
     * @param callback
     */
    processSimultaneousEvents(callback) {
        let self = this;
        let processedEvents = [];

        Event.find({'recurrence': null}, (err, events) => {
            if (err) {
                callback(err);
                return;
            }
            events.forEach((event) => {
                if (event.processedAsSimultaneous) {
                    return;
                }
                Event.find({
                    'startDate': {$lt: event.endDate},
                    'endDate': {$gt: event.startDate},
                    'creator.primaryEmail': event.creator.primaryEmail,
                    'id': {$ne: event.id},
                    'recurringEventId': {$ne: event.id},
                    'recurrence': null,
                }, (err, overlappedEvents) => {
                    //if event was already processed
                    if (processedEvents.indexOf(event.id) !== -1 || processedEvents.indexOf(event.recurringEventId) !== -1)
                        return;
                    if (event.id && overlappedEvents.length) {
                        if (event.recurringEventId || (event.recurrence && event.recurrence[0])) {

                            // if event is one of recurrent events - find and process it's primary event
                            if (event.recurringEventId) {
                                processedEvents.push(event.recurringEventId);

                                // save overlapped events as processed
                                overlappedEvents.forEach((event) => {
                                    if (event.recurringEventId) {
                                        processedEvents.push(event.recurringEventId);
                                    } else {
                                        processedEvents.push(event.id);
                                    }
                                });

                                self.findPrimaryEvent(event, overlappedEvents, processedEvents);

                                //find primary event
                                // Event.findOne({
                                //     'id': event.recurringEventId,
                                //     'recurringEventId': null
                                // }, (err, primaryEvent) => {
                                //     if (err) {
                                //         Log.error('Cant find primary event');
                                //     } else {
                                //         if (!primaryEvent || primaryEvent.processedAsSimultaneous || (primaryEvent.action == Events.Action.EA_CONFIRMED))
                                //             return;
                                //         let recurrenceData = Rrecur.parse(primaryEvent.recurrence[0]),
                                //             overlappedIDs, isOftenHapenned;
                                //         isOftenHapenned = (recurrenceData.freq == 'daily' || (recurrenceData.freq == 'weekly' && recurrenceData.byday.length > 2 && !recurrenceData.interval));
                                //
                                //         //if overlapped events are recurrent - get primary events of overlapped events
                                //         overlappedIDs = overlappedEvents.map((event) => {
                                //             if (event.recurringEventId)
                                //                 return event.recurringEventId;
                                //             else return event.id;
                                //         });
                                //         Event.find({id: {$in: overlappedIDs}}, (err, primaryOverlapped) => {
                                //             if (primaryOverlapped.length == overlappedEvents.length) {
                                //                 let checkedOverlappedEvents = [], recurrentOverlappedCount = 0;
                                //
                                //                 // Save overlapped events for processing
                                //                 for (let i = 0, recurrence; i < primaryOverlapped.length; i++) {
                                //                     if (primaryOverlapped[i].recurrence && primaryOverlapped[i].recurrence[0]) {
                                //
                                //                         //Process primary event if it is recurred often
                                //                         recurrence = Rrecur.parse(primaryOverlapped[i].recurrence[0]);
                                //                         if (primaryOverlapped[i].recurrence[0] == primaryEvent.recurrence[0]) {
                                //                             checkedOverlappedEvents.push(primaryOverlapped[i]);
                                //                             processedEvents.push(primaryOverlapped[i].id);
                                //                             recurrentOverlappedCount++;
                                //                             isOftenHapenned = true;
                                //                         } else {
                                //                             if (isOftenHapenned && (recurrence.freq == 'daily' || (recurrence.freq == 'weekly' && recurrence.byday.length > 2 && !recurrence.interval))) {
                                //                                 checkedOverlappedEvents.push(primaryOverlapped[i]);
                                //                                 processedEvents.push(primaryOverlapped[i].id);
                                //                                 recurrentOverlappedCount++;
                                //                             } else {
                                //                                 checkedOverlappedEvents.push(overlappedEvents[i]);
                                //                             }
                                //                         }
                                //                     } else {
                                //
                                //                         //Process single event if it is not recurrent
                                //                         checkedOverlappedEvents.push(primaryOverlapped[i]);
                                //                         processedEvents.push(primaryOverlapped[i].id);
                                //                     }
                                //                 }
                                //                 checkedOverlappedEvents = checkedOverlappedEvents.filter((event) => {
                                //                     return !event.processedAsSimultaneous;
                                //                 });
                                //                 if (checkedOverlappedEvents.length) {
                                //                     if (recurrentOverlappedCount && isOftenHapenned) {
                                //                         checkedOverlappedEvents.push(primaryEvent);
                                //                         self.sendSimultaneousMail(primaryEvent, checkedOverlappedEvents);
                                //                     } else {
                                //                         checkedOverlappedEvents.push(event);
                                //                         self.sendSimultaneousMail(event, checkedOverlappedEvents);
                                //                     }
                                //                 }
                                //             }
                                //         });
                                //     }
                                // });
                            }
                        } else {
                            processedEvents.push(event.id);
                            overlappedEvents.forEach((event) => {
                                processedEvents.push(event.id);
                            });
                            if (overlappedEvents.length) {
                                overlappedEvents.push(event);
                                self.sendSimultaneousMail(event, overlappedEvents);
                            }
                        }
                    }
                });
            });
            callback(null);
        });
    }

    /**
     * Sending mails about simultaneous events
     * @param event
     * @param overlappedEvents
     */
    sendSimultaneousMail(event, overlappedEvents) {
        let self = this;

        async.waterfall([
                (callback) => {
                    self.getLocationPrefix(event, callback);
                },
                self.getLocationByPrefix,
                self.getUserByLocation],
            (err, userEmail) => {
                if (!err) {
                    let debugMode = self.settings.debug.debugMode;
                    let emailTo;
                    let simultaneousEventsGroup = {
                        id: event.id,
                        creator: event.creator,
                        events: overlappedEvents,
                        startDate: event.startDate,
                        recurrent: event.recurrent,
                    };

                    if (simultaneousEventsGroup.recurrent) {
                        simultaneousEventsGroup.recurrence = {
                            firstDate: event.recurrentInstances.first.startDate,
                            lastDate: event.recurrentInstances.last.startDate
                        }
                    }

                    if (debugMode) {
                        emailTo = self.settings.debug.debugEmail;
                    } else {
                        // emailTo = event.creator.primaryEmail;
                    }

                    Log.info("Sending mail for " + event.summary + " to event creator: " + event.creator.primaryEmail + " from " + userEmail);

                    simultaneousEventsGroup.yesHash = Crypto.createHash('md5').update('yes' + simultaneousEventsGroup.id).digest('hex');
                    simultaneousEventsGroup.noHash = Crypto.createHash('md5').update('no' + simultaneousEventsGroup.id).digest('hex');
                    Mail.send(userEmail, emailTo, Const.SIMULTANEOUS_SUBJECT, Const.SIMULTANEOUS_TEMPLATE_PATH, (simultaneousEventsGroup, error) => {
                        console.log('SENDSIMULTANEOUSMAILINNER', userEmail);
                        if (!error) {

                            //commented in debug mode
                            simultaneousEventsGroup.events.forEach((event) => {
                                event.processedAsSimultaneous = true;
                                event.save();
                            });
                            Log.info("Mail sent to: " + emailTo + '; event summary: ' + event.summary);
                            let now = moment();

                            (new SimultaneousEvents({
                                id: simultaneousEventsGroup.id,
                                events: simultaneousEventsGroup.events,
                                creator: simultaneousEventsGroup.creator,
                                status: Events.Status.ES_MAIL_SENT,
                                action: 'Pending',
                                notificationDate: now,
                                yesHash: simultaneousEventsGroup.yesHash,
                                noHash: simultaneousEventsGroup.noHash,
                                startDate: simultaneousEventsGroup.startDate,
                            })).save((err) => {
                                if (!err) {
                                    Log.info('Stored overlapped events created by ' + overlappedEvents[0].creator.primaryEmail + ': ' + overlappedEvents.map(e => e.summary).join(','));
                                } else {
                                    Log.error('Error while storing simultaneous events');
                                    Log.error(err);
                                }
                            });
                        } else {
                            Log.error("Error sending mail about simultaneous event to: " + event.creator.primaryEmail + ". Error: " + JSON.stringify(error));
                        }
                    }, simultaneousEventsGroup);
                } else {
                    Log.error(err);
                }
            }
        );
    }

    /**
     * Processes mailed simultaneous events
     * @param callback
     */
    processMailedSimultaneous(callback) {
        let self = this;
        let debugMode = self.settings.debug.debugMode;

        SimultaneousEvents.find({status: Events.Status.ES_MAIL_SENT}, (err, simultaneousEventsGroups) => {
            if (err) {
                callback(err);
                return;
            }
            simultaneousEventsGroups.forEach((group) => {
                if ((moment().diff(moment(group.notificationDate), 'd') >= self.settings.general.waitingPeriod)) {
                    group.events.forEach((event) => {
                        if (debugMode) {
                            Log.info('It\'s debug mode! Event should have been deleted');
                        } else {
                            // Events.deleteEvent(event);
                        }
                    });
                    group.action = Events.Action.EA_AUTO;
                    group.status = Events.Status.ES_ACTION_TAKEN;
                    group.save();
                }
            });
        });
        callback(null);
    }

    /**
     * Runs rules
     * @param settings
     * @param callback
     */
    run(settings, callback) {
        let self = this;

        Log.info("Running rules...");
        self.settings = settings;
        async.waterfall([
                (callback) => {
                    self.checkRecurrent((error) => {
                        return callback(error);
                    });
                },
                (callback) => {
                    self.processRecurrentEvents((error) => {
                        return callback(error);
                    });
                },
                (callback) => {
                    self.processOrphanEvents((error) => {
                        return callback(error);
                    });
                },
                (callback) => {
                    self.processSimultaneousEvents((error) => {
                        return callback(error)
                    })
                },
                (callback) => {
                    self.processMailedSimultaneous((error) => {
                        return callback(error)
                    })
                }
            ],
            (err) => {
                callback(err);
            });
    }
}

module.exports = new Rules();