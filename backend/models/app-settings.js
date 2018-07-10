'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const schemaObject = {
  createdAt: {type: Date},
  updatedAt: {type: Date}

};

const AppSettingSchema = new Schema(schemaObject);

AppSettingSchema.pre('save', function (next) {
  let currentDate = new Date();

  this.updatedAt = currentDate;

  if (!this.createdAt) {
    this.createdAt = currentDate;
  }

  next();
});

module.exports = mongoose.model('AppSetting', AppSettingSchema);