"use strict";

const MailListener = require("mail-listener2");
const Const = require("./Constant.js");
const Log = require('./log.js')(module);
const Rules = require('./Rules.js');

/**
 *  Starts tracking gmail inbox
 *  Creates connection with Gmail
 */

exports.checkInbox = () => {
    let mailListener = new MailListener({
        username: Const.CALENDAR_GUARD_ADMIN_EMAIL,
        password: Const.CALENDAR_GUARD_ADMIN_PASS,
        host: "imap.gmail.com",
        port: 993, // imap port
        tls: true, // use secure connection
        mailbox: "INBOX", // mailbox to monitor
        markSeen: true, // all fetched email willbe marked as seen and not fetched next time
        fetchUnreadOnStart: true // use it only if you want to get all unread email on lib start. Default is `false`
    });

    mailListener.start();

    mailListener.on("server:connected", () => {
        setTimeout(() => {
            mailListener.stop();
        }, 1000 * 60 * (Const.INBOX_CHECK_INTERVAL - 1));
        Log.info("Successfully connected to my e-mail");
    });

    mailListener.on("mail", (mail, seqno, attributes) => {
        if (mail.subject === Const.ANSW_EMAIL_SUBJECT) {
            Log.info('Processing long booking answer');
            let content = mail.text.match(/hash:\S*\s/), id, hash;
            content[0] = content[0].replace(/hash:/g, '');
            content[0] = content[0].replace(/\s/g, '');
            [id, hash] = content[0].split('/');
            Rules.handleRecurrentEvent(id, hash);
        } else if (mail.subject === Const.SIMULTANEOUS_ANSW_SUBJECT) {
            Log.info("Processing simultaneous events answer");
            let content = mail.text.match(/hash:\S*\s/), id, hash;
            content[0] = content[0].replace(/hash:/g, '');
            content[0] = content[0].replace(/\s/g, '');
            [id, hash] = content[0].split('/');
            Rules.handleSimultaneousEvents(id, hash);
        }
    });

    mailListener.on("server:disconnected", () => {
        Log.info("imapDisconnected");
    });
};