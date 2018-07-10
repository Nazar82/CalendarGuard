'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const schemaObject = {
  createdAt: {type: Date},
  updatedAt: {type: Date}
};

const LocationSchema = new Schema(schemaObject);

LocationSchema.pre('save', function (next) {
  let currentDate = new Date();
  this.updatedAt = currentDate;

  if (!this.createdAt) {
    this.createdAt = currentDate;
  }

  next();
});

module.exports = mongoose.model('location', LocationSchema);