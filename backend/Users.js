"use strict";

const Const = require('./Constant.js');
const Url = require('url');
const QueryString = require('querystring');
const Auth = require('./Auth.js');
const Log = require('./log.js')(module);
const rp = require('request-promise');

class Users {

    constructor() {
        this._profiles = [];
    }

    /**
     * Searches for user profile with given email address
     * @param userEmail
     * @param callback
     */
    getProfile(userEmail, callback) {
        if (undefined === this._profiles[userEmail]) {
            let token = Auth.oAuthClient.credentials;
            let href = Url.parse(Const.CONTACT_URL.replace('{userKey}', userEmail)).href + '?' + QueryString.stringify({
                'viewType': 'domain_public',
                'domain': 'globallogic.com'
            });
            let options = {
                method: 'GET',
                uri: href,
                headers: {
                    'Authorization': token.token_type + ' ' + token.access_token
                },
                json: true
            };

            Log.debug("Downloading profile of " + userEmail);

            //set promise object to profiles array to prevent redundant API calls
            this._profiles[userEmail] = rp(options)
                .then((data) => {
                    this._profiles[userEmail] = data;
                    this._profiles[userEmail].exists = true;
                    callback(this._profiles[userEmail]);
                })
                .catch((err) => {
                    Log.error('Users::getProfile() - Request Error: ' + err.statusCode + " for " + userEmail);
                    if (err.statusCode == 404) {
                        this._profiles[userEmail] = {primaryEmail: userEmail, exists: false};
                        callback(this._profiles[userEmail]);
                    } else {
                        this._profiles[userEmail] = {primaryEmail: userEmail, exists: true};
                        callback(this._profiles[userEmail]);
                    }
                });
        } else if (this._profiles[userEmail].then) { //if object is promise - wait until it will be resolved
            this._profiles[userEmail].then(() => {
                callback(this._profiles[userEmail]);
            });
        } else {
            callback(this._profiles[userEmail]);
        }
    }
}

module.exports = new Users();
