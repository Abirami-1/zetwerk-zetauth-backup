/**
 * @type Database Utility
 * @desc Utility for connecting to the MongoDB database using mongoose ODM
 */

const mongoose = require('mongoose');
const config = require('config');
const dbHelpers = require('./setup-db-helpers');
const MAX_POOL_SIZE = 5;

/* Connect to the MongoDB database */
var state = {
    db: null
};

exports.getUrl = function() {
    let url = '';

    /** Check if mongodb is running in a cluster and generate the connection url accordingly */
    if (config.has('db.isCluster') && config.get('db.isCluster')) {
        url =
            'mongodb+srv://' +
            config.get('db.username') +
            ':' +
            config.get('db.password') +
            '@' +
            config.get('db.host') +
            '/' +
            config.get('db.name') +
            '?retryWrites=true&w=majority';
    } else {
        url = 'mongodb://' + config.get('db.host') + ':' + config.get('db.port') + '/' + config.get('db.name');
    }

    return url;
};

exports.connect = async function() {
    if (state.db) return;
    let url = exports.getUrl();
    const db = await mongoose.createConnection(url, { maxPoolsize: MAX_POOL_SIZE });
    state.db = db;
};

exports.get = function() {
    return state.db;
};

exports.close = function(done) {
    if (state.db) {
        state.db.close(function(err) {
            state.db = null;
            state.mode = null;
            done(err);
        });
    }
};

exports.setupHelpers = async function(model) {
    dbHelpers.setup(model);
    // const initializeDB = require('./initialize-db');
    // initializeDB.addUser();
    // initializeDB.addRoles();
    // initializeDB.addApplications();
};
