"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql = require("mysql");
class DbHelper {
    constructor(dbms, connection, tableName) {
        this.dbms = dbms;
        this.tableName = tableName;
        this.pool = mysql.createPool(connection);
    }
    getTemplate(filename) {
        const migrationClass = 'MysqlMigration';
        const template = `
const Migration = require("dbmigrate").${migrationClass};

class ${filename} extends Migration {
    up(callback) {
        callback();
    }

    down(callback) {
        callback();
    }

    // safeUp(callback) {
    //     callback();
    // }
    //
    // safeDown(callback) {
    //     callback();
    // }

}


exports.migrationClass = ${filename};`;
        return template;
    }
    createHistoryTable(callback) {
        this.pool.query('CREATE TABLE IF NOT EXISTS ?? ( ' +
            '`version` varchar(180) NOT NULL, ' +
            '`apply_time` int(11) DEFAULT NULL ' +
            ') ENGINE=InnoDB DEFAULT CHARSET=utf8', [this.tableName], callback);
    }
    getMigrationHistory(limit, callback) {
        this.pool.query('SELECT version, apply_time ' +
            'FROM ?? ' +
            'ORDER BY apply_time DESC, version DESC ' +
            (limit ? 'LIMIT ?' : ''), [this.tableName, limit], function (err, rows) {
            if (err) {
                return callback(err);
            }
            callback(undefined, rows);
        });
    }
    addMigrationHistory(version, callback) {
        this.pool.query('INSERT INTO ?? SET version = ?, apply_time = ?', [this.tableName, version, Date.now() / 1000], callback);
    }
    removeMigrationHistory(version, callback) {
        this.pool.query('DELETE FROM ?? WHERE version = ?', [this.tableName, version], callback);
    }
    migrateUp(migrationClass, migrationName, callback) {
        const self = this;
        this.pool.getConnection(function (err, connection) {
            const migration = new migrationClass(connection);
            migration.up(function (err) {
                if (err) {
                    connection.release();
                    return callback(err);
                }
                self.addMigrationHistory(migrationName, function (err) {
                    connection.release();
                    if (err) {
                        return callback(err);
                    }
                    callback();
                });
            });
        });
    }
    migrateDown(migrationClass, migrationName, callback) {
        const self = this;
        this.pool.getConnection(function (err, connection) {
            const migration = new migrationClass(connection);
            migration.down(function (err) {
                if (err) {
                    connection.release();
                    return callback(err);
                }
                self.removeMigrationHistory(migrationName, function (err) {
                    connection.release();
                    if (err) {
                        return callback(err);
                    }
                    callback();
                });
            });
        });
    }
}
exports.DbHelper = DbHelper;
//# sourceMappingURL=db-helper.js.map