const express = require('express');
const router = express.Router();
const ldapService = require('../services/ldapService.js');
const mongoose = require('mongoose');
const User = mongoose.model('User');


router.post('/login', (req, res) => {

    ldapService.authenticateUser(req.body.name, req.body.password)
        .then(() => {

                User.findOne({username: req.body.name}, (err, user) => {

                    if (err) {
                        return res.status(500).send({
                            success: false,
                            message: 'Server error.'
                        });
                    }

                    if (!user) {
                        let domainName = 'globallogic.com';
                        let name = req.body.name.split('.').shift();
                        let user = new User();

                        user.email = `${req.body.name}@${domainName}`;
                        user.name = name;
                        user.username = req.body.name;

                        user.save((err, user) => {
                            if (err) {
                                return res.status(500).send({
                                    success: false,
                                    message: 'Server error.'
                                });
                            }
                            res.json(user);
                        });
                        return;
                    }
                    return res.json(user);
                });
            },
            (err) => {
                return res.status(401).json({
                    success: false,
                    error: err,
                    message: 'Logging failed. Check Your username and password!'
                });
            });
});

router.put('/decline-request/user/:id', (req, res) => {
    User.findById(req.params.id, (err, user) => {
        if (err) {
            return res.status(500).send({
                success: false,
                message: 'Server error.'
            });
        }

        user.request = {};
        user.roles.__global_roles__ = [];

        user.save((err, user) => {
            if (err) {
                return res.status(500).send({
                    success: false,
                    message: 'Server error.'
                });
            }
            res.json(user);
        });
    })

});

router.put('/request-role/user/:id', (req, res) => {

    User.findById(req.params.id, (err, user) => {
        if (err) {
            return res.status(500).send({
                success: false,
                message: 'Server error.'
            });
        }

        user.request = {
            reason: req.body.reason,
            requestDate: new Date()
        };

        user.roles.__global_roles__ = ['wait-role'];

        user.save((err, user) => {
            if (err) {
                return res.status(500).send({
                    success: false,
                    message: 'Server error.'
                });
            }
            res.json(user);
        });

    });
});

router.put('/set-role/user/:id', (req, res) => {

    User.findById(req.params.id, (err, user) => {
        if (err) {
            return res.status(500).send({
                success: false,
                message: 'Server error.'
            });
        }

        user.roles.__global_roles__.splice(0, 1, req.body.role);

        user.save((err, user) => {
            if (err) {
                return res.status(500).send({
                    success: false,
                    message: 'Server error.'
                });
            }
            res.json(user);
        });

    });
});

module.exports = router;