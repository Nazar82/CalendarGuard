"use strict";
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const parser = require('./Start.js');

// Connect to local data base
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:81/gleye');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to local Data Base');
});

require('./models/models.js');

const app = express();
const port = process.env.PORT || '3000';

// Parsers for POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Point static path to dist folder
app.use(express.static(path.join('../', 'frontend', 'dist', 'calendarGuard')));

// Set middleware for cross-origin communication
const cors = require('cors');
app.use(cors());

// Set api routes
const api = require('./routes/api');
const auth = require('./routes/auth');

app.use('/api', api);
app.use('/auth', auth);

app.listen(port, () => {
    console.log('CalendarGuard running on ' + port);
    // parser.start();
});


