"use strict";

const Url = require('url');
const Http = require('https');
const async = require('async');
const Log = require('./Log.js')(module);
const Auth = require('./Auth.js');
const CALENDAR_URL = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';
const EXCEPTION_NEED_TO_REFRESH_TOKEN = 'Need to refresh token';

const mongoose = require('mongoose');
const Resource = require('./models/resource');

class Resources {
    constructor() {
        this._entries = [];
    }

    /**
     * Checks if string matches prefix
     * @param str
     * @param prefixes
     * @returns {boolean}
     */
    matchesPrefix(str, prefixes) {
        let result = prefixes.filter((prefix) => {
            return str.indexOf(prefix) === 0;
        });
        return !!result.length;
    }

    /**
     * Filters resources by prefixes
     * @param resources
     * @param filter
     * @param prefixes
     * @returns {Array}
     */
    filterResourceArray(resources, filter, prefixes) {
        let array = [];

        Log.info(resources.length, filter, prefixes);

        resources.forEach((res) => {
            let newRes = {
                resourceId: res.id || '',
                resourceCommonName: res.summary || '',
                resourceEmail: res.id || '',
                resourceType: res.kind || ''
            };

            if (filter(newRes.resourceCommonName, prefixes)) {
                array.push(newRes);
            }
        });

        return array;
    }

    /**
     * Stores resources into DB
     * @param resources
     * @param callback
     */
    storeResourcesInDB(resources, callback) {
        async.each(resources, (resource, callback) => {
            let itemToSave = new Resource(resource);
            itemToSave.save((error) => {
                callback(error);
            });
        }, (error) => {
            callback(error);
        });
    }

    /**
     * Downloads resources using Google API
     * @param auth
     */
    downloadResources(auth) {
        let self = this;
        let token = auth.credentials;
        let url = Url.parse(CALENDAR_URL);
        let options = {
            method: 'GET',
            hostname: url.hostname,
            path: url.path,
            headers: {
                'Authorization': token.token_type + ' ' + token.access_token
            }
        };
        let request;

        request = Http.request(options, (result) => {
            let body = '';

            Log.debug('Recources::getNextResources() - RESPONSE STATUS:', result.statusCode);

            if (result.statusCode !== 200) {
                self.end(EXCEPTION_NEED_TO_REFRESH_TOKEN);
                return;
            }

            result.on('data', (chunk) => {
                body += chunk;
            });

            result.on('end', () => {
                let data;

                try {
                    data = JSON.parse(body);
                } catch (err) {
                    Log.error('Resources::downloadResources() - Failed to parse resources:\n');
                    Log.error(err);
                    self.end(err);
                    return;
                }

                let calendarList = data.items;

                calendarList.forEach((calendar) => {
                    if (calendar.id.indexOf('resource.calendar.google.com') !== -1) {
                        self._entries = self._entries.concat(calendar);
                    }
                });

                Log.debug('Received count of resources:', self._entries.length);

                self._entries = self.filterResourceArray(self._entries, self.matchesPrefix, self._prefixes);
                self.storeResourcesInDB(self._entries, (error) => {
                    self.end(error);
                });
            });
        });

        request.on('error', (err) => {
            Log.error('Resources::getNextResources() - Request error occurred:\n');
            Log.error(err);
            self.end(err);
        });

        request.end();
    }

    /**
     * Refreshes resources collection in DB
     * @param prefixes
     * @param callback
     */
    getAllResources(prefixes, callback) {
        let self = this;

        self._entries = [];

        this._callback = callback;
        this._prefixes = prefixes;

        Log.info('Start getting all resources\n');
        mongoose.connection.db.dropCollection('resources', (err, result) => {
            if (err) {
                Log.error("Drop collection 'resources'", err);
            } else {
                Log.info("Drop collection 'resources': ok");
                self.downloadResources(Auth.oAuthClient);
            }
        });
    }

    get resources() {
        return this._entries;
    }

    get error() {
        return this._error;
    }

    end(error) {
        this._error = error || null;
        this._callback();
    }
}

module.exports = new Resources();