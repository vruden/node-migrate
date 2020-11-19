"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration = void 0;
const _ = require("lodash");
const async = require("async");
const moment = require("moment");
const prompt = require("./prompt");
const file_helper_1 = require("./file-helper");
const db_helper_1 = require("./db-helper");
class Migration {
    constructor(config) {
        this.db = new db_helper_1.DbHelper(config.dbms, config.connection, config.migrationTableName);
        this.file = new file_helper_1.FileHelper(config.migrationPath);
    }
    init(callback) {
        async.series([
            (callback) => { this.file.createDirectory(callback); },
            (callback) => { this.db.createHistoryTable(callback); }
        ], function (err) {
            callback(err);
        });
    }
    create(migrationName, callback) {
        if (!/^\w+$/.test(migrationName)) {
            return callback(new Error('The migration name should contain letters, digits and/or underscore characters only.'));
        }
        const filename = this.file.generateFileName(migrationName);
        prompt.confirm(`Create new migration ${filename}?`, (err, result) => {
            if (err || !result) {
                return callback(err);
            }
            const template = this.db.getTemplate(filename);
            this.file.createFile(filename, template, (err) => {
                if (err) {
                    return callback(err);
                }
                callback(null, 'New migration created successfully.');
            });
        });
    }
    new(limit, callback) {
        let _limit;
        if (limit === 'all') {
            _limit = null;
        }
        else {
            _limit = parseInt(limit);
            if (_limit < 1) {
                return callback(new Error('The limit must be greater than 0.'));
            }
        }
        this.getNewMigrations(function (err, migrations) {
            if (err) {
                return callback(err);
            }
            if (!migrations.length) {
                return callback(null, 'No new migrations found. Your system is up-to-date.');
            }
            const migrationNumber = migrations.length;
            if (_limit && migrationNumber > _limit) {
                migrations = migrations.slice(0, _limit);
                console.log(`Showing ${_limit} out of ${migrationNumber} new ${migrationNumber === 1 ? 'migration' : 'migrations'}:`);
            }
            else {
                console.log(`Found ${migrationNumber} new ${migrationNumber === 1 ? 'migration' : 'migrations'} been applied before:`);
            }
            migrations.forEach(function (migration) {
                console.log(`\t ${migration}`);
            });
            callback();
        });
    }
    history(limit, callback) {
        let _limit;
        if (limit === 'all') {
            _limit = null;
        }
        else {
            _limit = parseInt(limit);
            if (_limit < 1) {
                return callback(new Error('The limit must be greater than 0.'));
            }
        }
        this.db.getMigrationHistory(_limit, function (err, migrations) {
            if (err) {
                return callback(err);
            }
            if (!migrations.length) {
                return callback(null, 'No migration has been done before.');
            }
            const n = migrations.length;
            if (_limit > 0) {
                console.log(`Showing the last ${n} applied ${n === 1 ? 'migration' : 'migrations'}:`);
            }
            else {
                console.log(`Total ${n} ${n === 1 ? 'migration has' : 'migrations have'} been applied before:`);
            }
            migrations.forEach(function (migration) {
                console.log(`\t(${moment(migration.apply_time * 1000).format('Y/MM/DD HH:mm:ss')}) ${migration.version}`);
            });
            callback();
        });
    }
    up(limit, callback) {
        const self = this;
        this.getNewMigrations(function (err, newMigrations) {
            if (err) {
                return callback(err);
            }
            if (!newMigrations.length) {
                return callback(null, 'No new migration found. Your system is up-to-date.');
            }
            newMigrations.sort();
            const totalNewMigrationNumber = newMigrations.length;
            const _limit = parseInt(limit) || 0;
            if (_limit > 0) {
                newMigrations = newMigrations.slice(0, _limit);
            }
            const newMigrationNumber = newMigrations.length;
            if (newMigrationNumber === totalNewMigrationNumber) {
                console.log(`Total ${newMigrationNumber} new ${newMigrationNumber === 1 ? 'migration' : 'migrations'} to be applied:`);
            }
            else {
                console.log(`Total ${newMigrationNumber} out of ${totalNewMigrationNumber} new ${totalNewMigrationNumber === 1 ? 'migration' : 'migrations'} to be applied:`);
            }
            newMigrations.forEach(function (migration) {
                console.log(`\t ${migration}`);
            });
            prompt.confirm(`Apply the above ${newMigrationNumber === 1 ? 'migration' : 'migrations'}?`, (err, result) => {
                if (err || !result) {
                    return callback(err);
                }
                async.eachSeries(newMigrations, (migration, callback) => {
                    self.migrateUp(migration, callback);
                }, (err) => {
                    if (err) {
                        console.log('Migration failed. The rest of the migrations are canceled.');
                        return callback(err);
                    }
                    callback(null, 'Migrated up successfully.');
                });
            });
        });
    }
    down(limit, callback) {
        const self = this;
        let _limit;
        if (limit === 'all') {
            _limit = null;
        }
        else {
            _limit = parseInt(limit) || 1;
            if (_limit < 1) {
                return callback(new Error('The step argument must be greater than 0.'));
            }
        }
        this.db.getMigrationHistory(_limit, function (err, migrations) {
            if (err) {
                return callback(err);
            }
            if (!migrations.length) {
                return callback(null, 'No migration has been done before.');
            }
            migrations = _.map(migrations, 'version');
            const n = migrations.length;
            console.log(`Total ${n} ${n === 1 ? 'migration' : 'migrations'} to be reverted:`);
            migrations.forEach(function (migration) {
                console.log('\t' + migration);
            });
            prompt.confirm(`Revert the above ${n === 1 ? 'migration' : 'migrations'}?`, (err, result) => {
                if (err || !result) {
                    return callback(err);
                }
                async.eachSeries(migrations, (migration, callback) => {
                    self.migrateDown(migration, callback);
                }, (err) => {
                    if (err) {
                        console.log('Migration failed. The rest of the migrations are canceled.');
                        return callback(err);
                    }
                    callback(null, 'Migrated down successfully.');
                });
            });
        });
    }
    getNewMigrations(callback) {
        this.file.getMigrationsFromDirectory((err, files) => {
            if (err) {
                return callback(err);
            }
            this.db.getMigrationHistory(null, (err, rows) => {
                if (err) {
                    return callback(err);
                }
                callback(null, _.difference(files, _.map(rows, 'version')));
            });
        });
    }
    migrateUp(migrationName, callback) {
        console.log(`*** applying ${migrationName}`);
        const start = Date.now();
        const migrationClass = this.file.getMigrationClass(migrationName);
        this.db.migrateUp(migrationClass, migrationName, function (err) {
            const time = Math.floor((Date.now() - start) / 1000);
            if (err) {
                console.log(`*** failed to apply ${migrationName} (time: ${time} s)`);
                return callback(err);
            }
            console.log(`*** applied ${migrationName} (time: ${time}s)`);
            callback();
        });
    }
    migrateDown(migrationName, callback) {
        console.log(`*** reverting ${migrationName}`);
        const start = Date.now();
        const migrationClass = this.file.getMigrationClass(migrationName);
        this.db.migrateDown(migrationClass, migrationName, function (err) {
            const time = Math.floor((Date.now() - start) / 1000);
            if (err) {
                console.log(`*** failed to revert ${migrationName} (time: ${time}s)`);
                return callback(err);
            }
            console.log(`*** reverted ${migrationName} (time: ${time}s)`);
            callback();
        });
    }
}
exports.Migration = Migration;
