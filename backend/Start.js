"use strict";

const async = require('async');
const Log = require('./log.js')(module);
const Resource = require('./Resources.js');
const Rules = require('./Rules.js');
const Events = require('./Events.js');
const Auth = require('./Auth.js');
const Const = require('./Constant.js');
const Inbox = require('./InboxChecker.js');
const Mail = require('./Nodemailer');
const AppSetting = require('./models/app-settings');
const Location = require('./models/location');

// Create db configuration
const mongoose = require('mongoose');
mongoose.set('debug', false);
mongoose.connect('mongodb://127.0.0.1:81/gleye');

class App {

    /**
     * Starts application
     */
    start() {

        let self = this;

        AppSetting
            .findOne({app: 'gleye'})
            .lean()
            .exec((err, data) => {
                self.settings = data.settings;
                self.oldInterval = self.settings.general.checkingInterval;
                self.cycle();
                self.interval = setInterval(self.cycle.bind(self), self.oldInterval * 60 * 1000);

                setInterval(() => {
                    AppSetting
                        .findOne({app: 'gleye'})
                        .lean()
                        .exec((err, data) => {
                            self.newSettings = data.settings.general.checkingInterval;
                            if (self.newSettings !== self.oldInterval) {
                                clearInterval(self.interval);
                                self.oldInterval = self.newSettings;
                                self.interval = setInterval(self.cycle.bind(self), self.newSettings * 60 * 1000);
                            }
                        });
                }, 6000);
                Inbox.checkInbox();
                setInterval(() => {
                    Inbox.checkInbox();
                }, 1000 * 60 * Const.INBOX_CHECK_INTERVAL);
            });
    }

    /**
     * Starts cycle
     */
    cycle() {
        let self = this;

        async.waterfall([
            // START ITERATION
            (callback) => {
                Log.info('New parsing cycle\n');
                return callback(null);
            },

            // AUTHORIZATION
            (callback) => {
                Log.info('Start authorization\n');
                Auth.authorize(() => {
                    if (!Auth.error) {
                        Log.info('Authorized\n');
                    }
                    return callback(Auth.error);
                });
            },
            // // DOWNLOAD ROOMS
            (callback) => {
                Log.info('Downloading rooms\n');
                Location.find({}).lean().exec((err, locations) => {
                    let prefixes = locations.map((el) => el.locationName);
                    Log.info('Prefixes: ' + prefixes);
                    Resource.getAllResources(prefixes.map(el => el.trim()), () => {
                        return callback(Resource.error);
                    });
                });
            },

            // DOWNLOAD EVENTS
            (callback) => {
                Log.info('Downloading events\n');
                Events.updateEvents(self.settings, () => {
                    return callback(Events.error);
                });
            },

            // RUN RULES
            (callback) => {
                Rules.run(self.settings, (error) => {
                    return callback(error);
                });
            }], (error) => {
            if (error) {
                Log.error('Waterfall: An error occurred.\n', error);
            } else {
                Log.info('Waterfall: cycle finished\n');
                Mail.sendAll();
            }
        });
    }
}

module.exports = new App();