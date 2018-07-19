const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Location = mongoose.model('location');
const HTTP_STATUS_CODES = require('../http_codes');
const MONGODB_CODES = require('../md_codes');


router.get('/users', (req, res) => {
    User.find({'roles.__global_roles__': {$in: [req.query.firstRole, req.query.secondRole]}}, (err, users) => {
        if (err) {
            return res.status(HTTP_STATUS_CODES.SERVER_ERROR).send({
                success: false,
                message: 'Server error.'
            });
        }
        res.json(users);
    });

});

router.put('/request-role/user/:id', (req, res) => {
    User.findById(req.params.id, (err, user) => {
        if (err) {
            return res.status(HTTP_STATUS_CODES.SERVER_ERROR).send({
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
                return res.status(HTTP_STATUS_CODES.SERVER_ERROR).send({
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
            return res.status(HTTP_STATUS_CODES.SERVER_ERROR).send({
                success: false,
                message: 'Server error.'
            });
        }

        user.roles.__global_roles__.splice(0, 1, req.body.role);

        user.save((err, user) => {
            if (err) {
                return res.status(HTTP_STATUS_CODES.SERVER_ERROR).send({
                    success: false,
                    message: 'Server error.'
                });
            }
            res.json(user);
        });

    });
});

router.delete('/delete-user/:id', (req, res) => {

    User.deleteOne({_id: req.params.id}, (err, data) => {
        if (err) {
            return res.status(HTTP_STATUS_CODES.SERVER_ERROR).send({
                success: false,
                message: 'Server error.'
            });
        }
        res.json(data);
    });

});

router.get('/locations', (req, res) => {
    Location.find({}, (err, locations) => {
        if (err) {
            return res.status(HTTP_STATUS_CODES.SERVER_ERROR).send({
                success: false,
                message: 'Server error.'
            });
        }
        res.json(locations);
    });
});

router.post('/locations', (req, res) => {
    let location = new Location();

    location.assignedUser = req.body.assignedUser;
    location.locationName = req.body.locationName;

    location.save((err, location) => {
        if (err) {
            console.log(err);
            if (err.errors) {
                if (err.errors.locationName) {
                    return res.json({
                        success: false, code: HTTP_STATUS_CODES.BAD_REQUEST,
                        message: err.errors.locationName.message
                    });
                }
            }
            if (err.code === MONGODB_CODES.MD_DUPLICATE) {
                return res.json({
                    success: false,
                    code: HTTP_STATUS_CODES.BAD_REQUEST,
                    message: 'Location with such name already exists.'
                });
            }
            return res.status(HTTP_STATUS_CODES.SERVER_ERROR).send({
                success: false,
                message: 'Server error.'
            });
        }
        res.json(location);
    });
});

router.put('/locations/:id', (req, res) => {
    Location.findById(req.params.id, (err, location) => {
        if (err) {
            return res.status(HTTP_STATUS_CODES.SERVER_ERROR).send({
                success: false,
                message: 'Server error.'
            });
        }
        location.assignedUser = req.body.userId;
        location.save((err, location) => {
            if (err) {
                return res.status(HTTP_STATUS_CODES.SERVER_ERROR).send({
                    success: false,
                    message: 'Server error.'
                });
            }
            res.json(location);
        });
    })
});

router.delete('/locations/:id', (req, res) => {
    Location.deleteOne({_id: req.params.id}, (err, data) => {
        if (err) {
            return res.status(HTTP_STATUS_CODES.SERVER_ERROR).send({
                success: false,
                message: 'Server error.'
            });
        }
        res.json(data);
    });
});

module.exports = router;
