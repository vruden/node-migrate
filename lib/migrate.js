var mysql = require('mysql');
var async = require('async');
var path = require('path');
var fs = require('fs');
var moment = require('moment');
var prompt = require('./prompt');

var _migrationPath = null;
var _dbms = null;
var _connectionOptions = null;
var _migrationHistoryTableName = null;
var pool = {};

function init(migrationPath, dbms, connectionOptions, migrationTableName, callback) {
    _migrationPath = migrationPath;
    _dbms = dbms;
    _connectionOptions = connectionOptions;
    _migrationHistoryTableName = migrationTableName;

    pool = mysql.createPool(_connectionOptions);

    async.series([
        createMigrationDirectory,
        createMigrationHistoryTable
    ], function (err, results) {
        if (err) {
            return callback(err);
        }

        callback();
    });
}

function createMigrationDirectory(callback) {
    fs.lstat(_migrationPath, function (err, stats) {
        if (err && err.errno === -2) {
            fs.mkdir(_migrationPath, callback);
        } else {
            callback(err);
        }
    });
}

function createMigrationHistoryTable(callback) {
    pool.query(
        'CREATE TABLE IF NOT EXISTS ?? ( ' +
        '`version` varchar(180) NOT NULL, ' +
        '`apply_time` int(11) DEFAULT NULL ' +
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
        [_migrationHistoryTableName],
        callback
    );
}

function addMigrationHistory(version, callback) {
    pool.query(
        'INSERT INTO ?? SET version = ?, apply_time = ?',
        [_migrationHistoryTableName, version, Date.now() / 1000],
        callback
    );
}

function removeMigrationHistory(version, callback) {
    pool.query(
        'DELETE FROM ?? WHERE version = ?',
        [_migrationHistoryTableName, version],
        callback
    );
}

function getMigrationHistory(limit, callback) {
    limit = limit || 10;

    pool.query(
        'SELECT version, apply_time ' +
        'FROM ?? ' +
        'ORDER BY apply_time DESC, version DESC ' +
        'LIMIT ?',
        [_migrationHistoryTableName, limit],
        callback
    );
}

function create(filename, callback) {
    if (!/^\w+$/.test(filename)) {
        return callback(new Error('The migration name should contain letters, digits and/or underscore characters only.'));
    }

    var name = 'm' + moment().format('YMMDD_HHmmss') + '_' + filename + '.js';
    var file = path.join(_migrationPath, name);

    prompt.confirm('Create new migration' + file + '?', function (err, result) {
        if (err || !result) {
            return callback(err);
        }

        var fdr = fs.createReadStream(path.resolve(__dirname, './template.js'));
        var fdw = fs.createWriteStream(file);

        fdr.on('end', function () {
            callback(null, 'New migration created successfully.\n');
        });

        fdr.pipe(fdw);
    });
}

function migrate(number, callback) {
    callback();
}

function down(number, callback) {
    callback();
}

exports.init = init;
exports.create = create;
exports.migrate = migrate;
exports.down = down;
exports.history = getMigrationHistory;

