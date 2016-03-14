var mysql = require('mysql');
var async = require('async');
var path = require('path');
var fs = require('fs');
var moment = require('moment');
var prompt = require('./prompt');
var _ = require('lodash');

var _migrationPath = null;
var _dbms = null;
var _connectionOptions = null;
var _migrationHistoryTableName = null;
var pool = {};

var migrationBaseObject = {
    up: function (pool, callback) {
        var self = this;

        if (!_.isFunction(self.safeUp)) {
            return callback(new Error('safeUp method is not implemented'));
        }

        pool.getConnection(function (err, connection) {
            connection.beginTransaction(function (err) {
                if (err) {
                    return rollback(err);
                }

                self.safeUp(connection, function (err) {
                    if (err) {
                        return rollback(err);
                    }

                    connection.commit(function (err) {
                        if (err) {
                            return rollback(err);
                        }

                        callback();
                    });
                });
            });

            function rollback(err) {
                connection.rollback(function () {
                    connection.release();

                    callback(err);
                });
            }
        });
    },
    down: function (pool, callback) {
        var self = this;

        if (!_.isFunction(self.safeDown)) {
            return callback(new Error('safeDown method is not implemented'));
        }

        pool.getConnection(function (err, connection) {
            connection.beginTransaction(function (err) {
                if (err) {
                    return rollback(err);
                }

                self.safeDown(connection, function (err) {
                    if (err) {
                        return rollback(err);
                    }

                    connection.commit(function (err) {
                        if (err) {
                            return rollback(err);
                        }

                        callback();
                    });
                });
            });

            function rollback(err) {
                connection.rollback(function () {
                    connection.release();

                    callback(err);
                });
            }
        });
    }
};

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

function getMigrationsFromDirectory(callback) {
    fs.readdir(_migrationPath, function (err, files) {
        if (err) {
            return callback(err);
        }

        // TODO to optimize
        files = _.filter(files, function (file) {
            return /^(m(\d{8}_\d{6})_.*?)\.js$/i.test(file)
        });
        files = _.map(files, function (file) {
            return file.slice(0, -3)
        });
        callback(null, files);
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
    if (_.isFunction(limit)) {
        callback = limit;
        limit = null;
    }

    pool.query(
        'SELECT version, apply_time ' +
        'FROM ?? ' +
        'ORDER BY apply_time DESC, version DESC ' +
        (limit ? 'LIMIT ?' : ''),
        [_migrationHistoryTableName, limit],
        function (err, rows) {
            if (err) {
                return callback(err);
            }

            callback(null, rows);
        }
    );
}

function getNewMigrations(callback) {
    async.series([
        getMigrationsFromDirectory,
        getMigrationHistory
    ], function (err, result) {
        if (err) {
            return callback(err);
        }

        callback(null, _.difference(result[0], _.pluck(result[1], 'version')));
    });
}

function actionCreate(filename, callback) {
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

function actionUp(limit, callback) {
    getNewMigrations(function (err, newMigrations) {
        if (err) {
            return callback(err);
        }

        if (!newMigrations.length) {
            return callback(null, 'No new migration found. Your system is up-to-date.');
        }

        newMigrations.sort();

        var total = newMigrations.length;
        limit = parseInt(limit) || 0;

        if (limit > 0) {
            newMigrations = newMigrations.slice(0, limit);
        }
        var n = newMigrations.length;

        if (n === total) {
            console.log('Total ' + n + ' new ' + (n === 1 ? 'migration' : 'migrations') + ' to be applied:');
        } else {
            console.log('Total ' + n + ' out of ' + total + ' new ' + (total === 1 ? 'migration' : 'migrations') + ' to be applied:');
        }

        newMigrations.forEach(function (migration) {
            console.log('\t' + migration);
        });

        prompt.confirm('Apply the above ' + n === 1 ? 'migration' : 'migrations' + '?', function (err, result) {
            if (err || !result) {
                return callback(err);
            }

            up();

            function up(err) {
                if (err) {
                    console.log('Migration failed. The rest of the migrations are canceled.');
                    return callback(err);
                }

                var migration = newMigrations.shift();

                if (!migration) {
                    return callback(null, 'Migrated up successfully.');
                }

                migrateUp(migration, up);
            }
        });
    });
}

function actionDown(limit, callback) {
    limit = limit || 1;

    if (limit === 'all') {
        limit = null;
    } else {
        limit = parseInt(limit);
        if (limit < 1) {
            return callback(new Error('The step argument must be greater than 0.'));
        }
    }

    getMigrationHistory(limit, function (err, migrations) {
        if (err) {
            return callback(err);
        }

        if (!migrations.length) {
            return callback(null, 'No migration has been done before.');
        }

        migrations = _.pluck(migrations, 'version');

        var n = migrations.length;
        console.log('Total ' + n + ' ' + (n === 1 ? 'migration' : 'migrations') + ' to be reverted:');

        migrations.forEach(function (migration) {
            console.log('\t' + migration);
        });

        prompt.confirm('Revert the above ' + n === 1 ? 'migration' : 'migrations' + '?', function (err, result) {
            if (err || !result) {
                return callback(err);
            }

            down();

            function down(err) {
                if (err) {
                    console.log('Migration failed. The rest of the migrations are canceled.');
                    return callback(err);
                }

                var migration = migrations.shift();

                if (!migration) {
                    return callback(null, 'Migrated down successfully.');
                }

                migrateDown(migration, down);
            }
        });
    });
}

function migrateUp(migration, callback) {
    console.log('*** applying ' + migration);

    var start = Date.now();
    var migrationObject = createMigration(migration);

    migrationObject.up(pool, function (err) {
        if (err) {
            return fail(err);
        }

        addMigrationHistory(migration, function (err) {
            if (err) {
                return fail(err);
            }

            var time = Math.floor((Date.now() - start) / 1000);
            console.log('*** applied ' + migration + ' (time: ' + time + 's)');

            callback();
        });
    });

    function fail(err) {
        var time = Math.floor((Date.now() - start) / 1000);
        console.log('*** failed to apply ' + migration + ' (time: ' + time + 's)');

        return callback(err);
    }
}

function migrateDown(migration, callback) {
    console.log('*** reverting ' + migration);

    var start = Date.now();
    var migrationObject = createMigration(migration);

    migrationObject.down(pool, function (err) {
        if (err) {
            return fail(err);
        }

        removeMigrationHistory(migration, function (err) {
            if (err) {
                return fail(err);
            }

            var time = Math.floor((Date.now() - start) / 1000);
            console.log('*** reverted ' + migration + ' (time: ' + time + 's)');

            callback();
        });
    });

    function fail(err) {
        var time = Math.floor((Date.now() - start) / 1000);
        console.log('*** failed to revert ' + migration + ' (time: ' + time + 's)');

        return callback(err);
    }
}

/**
 * Creates a new migration instance.
 * @param string $class the migration class name
 * @return \yii\db\MigrationInterface the migration instance
 */
function createMigration(migration) {
    var file = path.join(_migrationPath, migration + '.js');

    // TODO may be to remove the object {}
    return _.extend({}, migrationBaseObject, require(file));
}

function actionHistory(limit, callback) {
    limit = limit || 10;

    if (limit === 'all') {
        limit = null;
    } else {
        limit = parseInt(limit);
        if (limit < 1) {
            return callback(new Error('The limit must be greater than 0.'));
        }
    }

    getMigrationHistory(limit, function (err, migrations) {
        if (err) {
            return callback(err);
        }

        if (!migrations.length) {
            return callback(null, 'No migration has been done before.');
        }

        var n = migrations.length;
        if (limit > 0) {
            console.log('Showing the last ' + n + ' applied' + (n === 1 ? 'migration' : 'migrations') +':');
        } else {
            console.log('Total ' + n + ' ' + (n === 1 ? 'migration has' : 'migrations have') + ' been applied before:');
        }

        migrations.forEach(function(migration) {
            console.log('\t(', moment(migration.apply_time * 1000).format('Y/MM/DD HH:mm:ss'),')', migration.version);
        });

        callback();
    });
}

exports.init = init;
exports.create = actionCreate;
exports.migrate = actionUp;
exports.down = actionDown;
exports.history = actionHistory;

