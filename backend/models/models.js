const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const heroSchema = new Schema({
    heroName: { type: String, required: true, unique: true },
    heroPower: { type: Number, required: true, unique: false },
    created_at: { type: Date, default: Date.now }
});

mongoose.model('Hero', heroSchema);