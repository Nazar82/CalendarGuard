"use strict";

const Const = require('./Constant.js');
const Log = require('./log.js')(module);
const Utils = require('./Utils.js');

//module.exports = appSettings;

class Settings {
    constructor(path) {
        this.userConfig = this.getUserConfig(path);
    }

    getUserConfig(path) {
        let config;
        let lines;
        let requiredSettings;
        let requiredParamNames = [
            'position',
            'location',
            'period',
            'notification',
            'checking_interval'
        ];
        let data = Utils.readFileSync(path);

        this._config = {
            error: "Failed to parse ini file"
        };

        if (data.error) {
            this._config = {
                error: "Cannot find configuration file " + path
            };
        } else {
            config = {};
            lines = data.split(/\r?\n/);

            lines.forEach((line) => {
                let param;
                let values;

                line = line.trim();

                //Ignores comment lines which start with '#' char
                if (line.search('#') === 0) {
                    return;
                }

                //if hasn't '='
                param = line.split("=");
                if (param.length !== 2) {
                    return;
                }

                //checks parameter name
                param[0] = param[0].trim();
                //if empty parameter name
                if (param[0].length === 0) {
                    return;
                }

                values = param[1].trim();
                //if empty value
                if (values.length === 0) {
                    return;
                }

                //parses values if it is needed
                switch (param[0]) {
                    case 'period':
                    case 'notification':
                    case 'checking_interval':
                        //if value is Number
                        values = parseInt(values, (10));
                        break;
                    case 'position':
                    case 'location':
                        //if value is Array
                        //split parameter values with ','
                        values = param[1].split(",");
                        //filter empty parameter values and trim white spaces
                        values = values.filter(el => (el.trim().length !== 0)).map(el => el.trim());
                        //if empty array of values
                        if (!values.length) {
                            return;
                        }
                        break;
                    default: //ignore if unknown parameters name
                        return;
                }
                config[param[0]] = values;
            });

            //check if all needed parameters are present
            requiredSettings = requiredParamNames.filter(name => (undefined === (config[name])));

            if (requiredSettings.length) {
                Log.error("Absent or has wrong value " + JSON.stringify(requiredSettings) + " in configuration file " + path);
            } else {
                this._config = config;
                this._config.checking_interval *= 1000 * 60;
            }
        }
    }

    get config() {
        return this._config;
    }

    set config(value) {
        this._config = value;
    }
}

let settings = new Settings(Const.USER_CONFIG_PATH);
module.exports = settings;