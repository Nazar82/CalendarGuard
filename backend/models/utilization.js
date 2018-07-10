'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const schemaObject = {
  resourceName: {type: String},
  start: {type: Date},
  end: {type: Date}
};

const UtilizationSchema = new Schema(schemaObject);
module.exports = mongoose.model('Utilization', UtilizationSchema);
