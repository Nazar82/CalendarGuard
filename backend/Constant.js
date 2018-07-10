"use strict";

class Const {
}

Const.SCOPE = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/admin.directory.user',
    'https://www.googleapis.com/auth/admin.directory.user.readonly',
    'https://www.googleapis.com/auth/admin.directory.resource.calendar'
];
Const.REFRESH_TOKEN_PATH = './config/refresh.json';
Const.SECRET_PATH = './config/key.json';
Const.USER_CONFIG_PATH = './config/userConfig.ini';

//URL for testing refresh token
Const.TEST_URL = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';
Const.CONTACT_URL = 'https://www.googleapis.com/admin/directory/v1/users/{userKey}';
Const.FIRST_USER_TEMPLATE_PATH = './templates/firstUserMessage.html';
Const.FIRST_SUBJECT = "Meeting room usage";
Const.SIMULTANEOUS_TEMPLATE_PATH = './templates/simultaneousEventsMessage.html';
Const.SIMULTANEOUS_SUBJECT = 'Simultaneous bookings';
// authorization server settings
Const.AUTH_SERVER_PORT = 2002;
Const.AUTH_SERVER_URL = "http://localhost:{{port}}/".replace('{{port}}', Const.AUTH_SERVER_PORT);
// mail config
Const.SUPER_ADMIN_EMAIL = 'maksym.kostyuchenko@globallogic.com';
// Subject of answer e-mail
Const.ANSW_EMAIL_SUBJECT = "Answer on e-mail";
// Subject of simultaneous answer e-mail
Const.SIMULTANEOUS_ANSW_SUBJECT = 'Simultaneous events answer';
// E-mail credentials
Const.CALENDAR_GUARD_ADMIN_EMAIL  = "calendar.guard@globallogic.com";
Const.CALENDAR_GUARD_ADMIN_PASS = "Global@123";
// E-mail inbox check interval (minutes)
Const.INBOX_CHECK_INTERVAL = 20;
// ldap config
Const.LDAP = {
    domain: 'SYNAPSE\\',
    url: 'ldap://172.24.94.13'
};

// listener config
Const.LISTENER = {
    PORT: 4444,
    INCOMING_ADDRESS: '/log',
    PRESENCE_LOG: '../data/presence.json'
};

module.exports = Const;
