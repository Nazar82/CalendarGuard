'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const schemaObject = {
  resourceId: {type: String, unique: true},
  resourceCommonName: {type: String},
  resourceEmail: {type: String},
  createdAt: {type: Date},
  updatedAt: {type: Date}
};

let ResourceSchema = new Schema(schemaObject);

ResourceSchema.pre('save', function(next) {
  let currentDate = new Date();

  this.updatedAt = currentDate;

  if(!this.createdAt) {
    this.createdAt = currentDate;
  }

  next();
});

module.exports = mongoose.model('Resource', ResourceSchema);