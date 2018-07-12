const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');

router.get('/users', (req, res) => {

   User.find({'roles.__global_roles__': {$in: ['wait-role']}}, (err, users) => {
       if(err) {
           return res.status(500).send({
               success: false,
               message: 'Server error.'
           });
       }
       res.json(users);
   });
});


module.exports = router;