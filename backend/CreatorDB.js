"use strict";

const Creator = require('./models/creator');

exports.saveCreatorsList = (data) => {
    data.forEach((creator) => {
        Creator.findOne({creatorId: creator.id}, (err, res) => {
            if (!err && res === null) {
                new Creator(creator).save();
            }
        });
    });
};