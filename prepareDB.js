const mongoose = require('mongoose');
const async = require('async');

console.log('Running DB creation script');
mongoose.connect('mongodb://127.0.0.1:81/gleye');

let settings = {
    app: 'gleye',
    settings: {
        period: 90,
        businessHours: {
            start: '6:0',
            end: '22:0'
        },
        debug: {
            debugMode: true,
            debugEmail: ''
        },
        general: {
            checkingInterval: 600,
            longBookingsPeriod: 90,
            waitingPeriod: 4,
            mailSendingDelay: 5
        }
    }
};

//default user, replace with something else or remove later
let defaultUsers = [
    {
        _id: 'EjQ75zBNbNh8J429K', //need hard-coded id to store it as string instead of 'ObjectId' type
        createdAt: new Date('2016-01-01'),
        services: {
            resume: {
                loginTokens: []
            }
        },
        username: 'SYNAPSE\\calendar_guard_admin',
        email: 'calendar_guard_admin@globallogic.com',
        name: 'calendar_guard_admin',
        request: {
            reason: 'default user',
            requestDate: new Date('2016-01-01')
        },
        roles: {
            __global_roles__: [
                'admin'
            ]
        }
    },
    {
        _id : 'k8PzGdSivoja6Wwxi',
        createdAt : new Date('2016-01-01'),
        services : {
            resume : {
                loginTokens : []
            }
        },
        username : 'SYNAPSE\\maksym.kostyuchenko',
        email : 'maksym.kostyuchenko@globallogic.com',
        name : 'maksym.kostyuchenko',
        request : {
            "reason" : "to manage",
            "requestDate" : new Date('2016-01-01')
        },
        roles : {
            '__global_roles__' : [
                'admin'
            ]
        }
    },
    {
        _id : 'AaGrcxN3MeRsaerXX',
        createdAt : new Date('2016-01-01'),
        services : {
            resume : {
                loginTokens : []
            }
        },
        username : 'SYNAPSE\\Yaryna.Lyseyko',
        email : 'Yaryna.Lyseyko@globallogic.com',
        name : 'Yaryna.Lyseyko',
        request : {
            "reason" : "to manage",
            "requestDate" : new Date('2016-01-01')
        },
        roles : {
            '__global_roles__' : [
                'admin'
            ]
        }
    }
];

let devices = [
    {
        _id:'ERvv9HHZDekW85W6J',
        macAddress:'B8:27:EB:83:C8:19',
        status:'1463650362857',
        assignedResource:'LWO3-L2-8-Video-(S)',
        ipAddress:'::ffff:172.24.223.141'
    },
    {
        _id:"veG2NPz34TCjBsaPN",
        macAddress:'B8:27:EB:2D:DF:4A',
        status:'1463645898819',
        assignedResource:'LWO3-1-6',
        ipAddress:'::ffff:172.24.223.45'
    },
    {
        _id:'w3RJNwGyPmqLRTnwJ',
        macAddress:'B8:27:EB:7A:FC:67',
        status:'1463648475738',
        assignedResource:'LWO3-L2-9-Audio-(S)',
        ipAddress:'::ffff:172.24.223.187'
    }
];

let locations = [
    {
        _id : "oauswRFwD7x2SWthJ",
        locationName : "LWO",
        assignedUser : "AaGrcxN3MeRsaerXX"
    }
];

mongoose.connection.on('open', () => {
    let db = mongoose.connection.db;

    console.log('Mongoose connected');

    db.createCollection('appsettings');
    db.createCollection('creators');
    db.createCollection('devices');
    db.createCollection('events');
    db.createCollection('locations');
    db.createCollection('logs');
    db.createCollection('resources');
    db.createCollection('roles');
    db.createCollection('simultaneouslyevents');
    db.createCollection('users');
    db.createCollection('utilizations');

    async.waterfall([
        (callback) => {
            db.collection('appsettings').count((err, count) => {
                if (!err && count === 0) {
                    db.collection('appsettings').insert(settings, (err) => {
                        console.log('Default settings created');
                        callback(err);
                    });
                } else {
                    callback(err);
                }
            });
        },
        (callback) => {
            db.collection('users').count((err, count) => {
                if (!err && count === 0) {
                    db.collection('users').insert(defaultUsers, (err) => {
                        console.log('Default user created');
                        callback(err);
                    });
                } else {
                    callback(err);
                }
            });
        },
        (callback) => {
            db.collection('devices').count((err, count) => {
                if (!err && count === 0) {
                    db.collection('devices').insert(devices, (err) => {
                        console.log('Default devices created');
                        callback(err);
                    });
                } else {
                    callback(err);
                }
            });
        },
        (callback) => {
            db.collection('locations').count((err, count) => {
                if (!err && count === 0) {
                    db.collection('locations').insert(locations, (err) => {
                        console.log('Default location created');
                        callback(err);
                    });
                } else {
                    callback(err);
                }
            });
        }
    ], (error) => {
        process.exit();
    });
});