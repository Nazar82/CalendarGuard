"use strict";

const nodemailer = require('nodemailer');
const Log = require('./log.js')(module);
const Const = require('./Constant.js');
const Utils = require('./Utils.js');
const Settings = require('./Settings.js');
const AppSetting = require('./models/app-settings');
let messages = [];
let failedMessages = [];
let sendingDelay;

/**
 * Create string message from file template
 * @param {string} path  path to template file
 * @param {object} event event's object
 * @return {string} formated message
 */
function createMessageFromTemplate(path, event) {
    let str = Utils.readFileSync(path);
    let id;
    let key;
    if (event.yesHash && event.noHash) {
        id = event.id;
        str = str
            .replace(/{{yesHash}}/g, event.id + '/' + event.yesHash)
            .replace(/{{noHash}}/g, event.id + '/' + event.noHash)
    }

    if (path === Const.SIMULTANEOUS_TEMPLATE_PATH) {
        let resources = [];
        event.events.forEach((ev) => {
            resources.push(ev.resource.name);
        });
        str = str
            .replace(/{{Subject}}/g, Const.SIMULTANEOUS_ANSW_SUBJECT)
            .replace(/{{resources}}/g, resources.join(', '));
        if (event.recurrent && event.recurrence) {
            str = str.replace(/{{date}}/g, "from " + event.recurrence.firstDate.toLocaleDateString() + " till " + event.recurrence.lastDate.toLocaleDateString() + " at " + event.startDate.toLocaleTimeString());
        } else {
            str = str.replace(/{{date}}/g, event.startDate.toLocaleString());
        }
    } else {
        str = str
            .replace(/{{Subject}}/g, Const.ANSW_EMAIL_SUBJECT)
            .replace(/{{room}}/g, event.resource.name)
            .replace(/{{summary}}/g, event.summary)
            .replace(/{{htmlLink}}/g, event.htmlLink);
    }

    //support all parameters from config in templates
    for (key in Settings.config) {
        if (Settings.config.hasOwnProperty(key)) {
            str = str.replace(new RegExp('{{' + key + '}}', 'g'), Settings.config[key]);
        }
    }
    let eventCreatorName;
    if (!event.creator.name.givenName) {
        let creatorName = event.creator.primaryEmail.split('.')[0];
        eventCreatorName = creatorName.charAt(0).toUpperCase() + creatorName.slice(1);
    } else {
        eventCreatorName = event.creator.name.givenName;
    }
    return str
        .replace(/{{name}}/g, eventCreatorName);
}

function addToFailed(from, to, subject, template, callback, event) {
    failedMessages.push({
        from: from,
        to: to,
        subject: subject,
        template: template,
        callback: callback,
        event: event
    });
}

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: Const.CALENDAR_GUARD_ADMIN_EMAIL,
        pass: Const.CALENDAR_GUARD_ADMIN_PASS
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 50000,
    rateLimit: 10
});

AppSetting
    .findOne({app: 'gleye'})
    .lean()
    .exec((err, data) => {
        sendingDelay = data.settings.general.mailSendingDelay;
        setInterval(() => {
            AppSetting
                .findOne({app: 'gleye'})
                .lean()
                .exec((err, data) => {
                    sendingDelay = data.settings.general.mailSendingDelay;
                });
        }, 6000);
    });

/**
 * Sends emails
 * @param from
 * @param to
 * @param subject
 * @param template
 * @param callback
 * @param event
 */
exports.send = (from, to, subject, template, callback, event) => {
    messages.push({
        from: from,
        to: to,
        subject: subject,
        template: template,
        callback: callback,
        event: event
    });

};

exports.sendAll = () => {
    let sendingInterval = setInterval(() => {
        if (messages.length > 0) {
            let msg = messages.pop();
            transporter.sendMail({
                from: 'Calendar Guard <' + msg.from + '>',
                to: msg.to,
                bcc: Const.SUPER_ADMIN_EMAIL,
                subject: msg.subject,
                html: createMessageFromTemplate(msg.template, msg.event)
            }, (error) => {
                if (error) {
                    addToFailed(msg.from, msg.to, msg.subject, msg.template, msg.callback, msg.event);
                    if (messages.length) {
                        failedMessages = failedMessages.concat(messages);
                        messages = [];
                    }
                }
                msg.callback(msg.event, error);
            });
        } else {
            if (failedMessages.length === 0) {
                clearInterval(sendingInterval);
            } else {
                clearInterval(sendingInterval);
                Log.info("Resending " + failedMessages.length + " failed messages");
            }
            setTimeout(() => {
                if (failedMessages.length === 0 && messages.length === 0) {
                    return;
                }
                messages = messages.concat(failedMessages);
                failedMessages = [];
                exports.sendAll();
            }, 1000 * 60 * sendingDelay);
        }
    }, 200);
};
