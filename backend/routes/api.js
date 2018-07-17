const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');

router.get('/users', (req, res) => {

   User.find({'roles.__global_roles__': {$in: [req.query.firstRole, req.query.secondRole]}}, (err, users) => {
       if(err) {
           return res.status(500).send({
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

router.delete('/delete-user/:id', (req, res) => {

    User.remove({_id: req.params.id}, function (err, data) {
        if (err) {
            return res.status(500).send({
                success: false,
                message: 'Server error.'
            });
        }
        res.json(data);
    });

});

module.exports = router;