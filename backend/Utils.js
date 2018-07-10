"use strict";

const fs = require('fs');

/**
 * Synchronously writes data from the file
 **/
exports.writeFileSync = (path, data) => {

    try {
        fs.writeFileSync(path, data);
        return {};
    } catch (e) {
        return {
            'error': 'Utils::writeFileSync(): ' + e
        };
    }
};

/**
 * Synchronously appends data to the file
 **/
exports.appendFileSync = (path, data) => {
    try {
        fs.appendFileSync(path, data);
        return {};
    } catch (e) {
        return {
            'error': 'Utils::appendFileSync(): ' + e
        };
    }
};

/**
 * Synchronously reads data from the file
 **/
exports.readFileSync = (path) => {
    if (fs.existsSync(path)) {
        return fs.readFileSync(path).toString();
    } else {
        return {
            error: "File doesn't exist"
        };
    }
};

/**
 * Synchronously remove file
 **/
exports.removeFileSync = (path) => {
    try {
        fs.rmdirSync(path);
        return {};
    } catch (e) {
        return {
            'error': 'Utils::removeFileSync(): ' + e
        };
    }
};

/**
 * Synchronously reads data from the file and converts to JSON
 **/
exports.getJSONConfigSync = (path) => {
    console.log('path', path);
    try {
        let file = exports.readFileSync(path);
        console.log(11111, file);
        if (file.error) {

            throw file.error;
        }
        console.log(2222, JSON.parse(file));
        return JSON.parse(file);
    } catch (e) {
        return {};
    }
};