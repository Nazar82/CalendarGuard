"use strict";

const Const = require('./Constant.js');
const Utils = require('./Utils.js');
const GoogleAPI = require('googleapis');
const Log = require('./log.js')(module);
const Http = require('https');
const Url = require('url');
const express = require('express');
const http = require('http');

class Auth {
    refreshToken() {
        let self = this;
        self._oAuthClient.refreshAccessToken((error, token) => {
            if (error) {
                Log.error('An error of refreshing token occurred: ', error);
                self.end(error);
            }
            Log.debug('Token was refreshed.');
            self._oAuthClient.setCredentials(token);
            Auth.storeToken(token, Const.REFRESH_TOKEN_PATH);
            self.end();
        });
    }

    checkToken(token) {
        let self = this;
        let testUrl = Url.parse(Const.TEST_URL),
            req,
            options = {
                method: 'GET',
                hostname: testUrl.hostname,
                path: testUrl.path,
                headers: {
                    'Authorization': token.token_type + ' ' + token.access_token
                }
            };

        req = Http.request(options, (res) => {
            res.on('data', () => {
            });
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    Log.error('An error of checking token occurred: ', res.statusCode);
                    self.refreshToken();
                } else {
                    self.end();
                }
            });
        });

        req.on('error', (e) => {
            Log.error('An error of checking token occurred: ', e);
            this.end(e);
        });

        req.end();
    }

    getNewToken() {
        let self = this;
        let app = express();
        let server = http.createServer(app);

        app.get('/', (req, res) => {
            Log.info('Authorization server: Creating new token...');
            let authUrl = self._oAuthClient.generateAuthUrl({
                access_type: 'offline',
                approval_prompt: 'force',
                scope: Const.SCOPE
            });
            res.redirect(authUrl);
        });

        app.get('/auth', (req, res) => {
            let code = req.query.code;
            if (code) {

                // Get an access token based on our OAuth code
                self._oAuthClient.getToken(code, (error, token) => {
                    Log.debug('oauth2Client.getToken', token);
                    if (!error) {

                        // Store our credentials and redirect back to our main page
                        self._oAuthClient.setCredentials(token);
                        Auth.storeToken(token, Const.REFRESH_TOKEN_PATH);
                        res.send("<h2>You were authenticated successfully! Now, You can close this page!</h2>");
                        self.end();
                    } else {
                        self.end(error);
                    }
                });
            } else {
                res.end();
            }
            //TODO: Server doesn't close here
            server.close();
        });

        //Start local server
        server = app.listen(Const.AUTH_SERVER_PORT, () => {
            Log.info('Authorization server was started: listening at %s\n', Const.AUTH_SERVER_URL);
            Log.info('You should visit %s for getting new token\n', Const.AUTH_SERVER_URL);
        });

        server.on('close', () => {
            Log.info('Authorization server was closed\n');
        });
    }

    static storeToken(token, path) {
        let res = Utils.writeFileSync(path, JSON.stringify(token));
        if (res.error) {
            Log.debug('storeToken(): Token was not stored in ', path);
            Log.debug(res.error);
        } else {
            Log.debug('storeToken(): Token was stored in ', path);
        }
        return res;
    }

    authorize(callback) {
        this._callback = callback;
        console.log('Const.SECRET_PATH', Const.SECRET_PATH);
        let credentials = Utils.getJSONConfigSync(Const.SECRET_PATH);
        console.log('credentials', credentials);
        let clientSecret = credentials.web.client_secret,
            clientId = credentials.web.client_id,
            redirectUrl = credentials.web.redirect_uris[0],
            token = Utils.getJSONConfigSync(Const.REFRESH_TOKEN_PATH);

        this._oAuthClient = new GoogleAPI.auth.OAuth2(clientId, clientSecret, redirectUrl);

        if (token && token.access_token) {
            this._oAuthClient.setCredentials(token);
            this.checkToken(token);
        } else {
            this.getNewToken();
        }
    }

    get oAuthClient() {
        return this._oAuthClient;
    }

    set oAuthClient(value) {
        this._oAuthClient = value;
    }

    get error() {
        return this._error;
    }

    end(error) {
        this._error = error || null;
        this._callback();
    }
}

module.exports = new Auth();
