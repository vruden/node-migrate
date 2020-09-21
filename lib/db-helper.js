"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql = require("mysql");
const noImplicitThisFixing = {
    escape(value) { },
    escapeId(value) { },
    queryFormat(query, values) {
        if (!values)
            return query;
        const self = this;
        return query.replace(/\:\:(\w+)/g, function (txt, key) {
            if (values.hasOwnProperty(key)) {
                return self.escapeId(values[key]);
            }
            return txt;
        }.bind(this)).replace(/\:(\w+)/g, function (txt, key) {
            if (values.hasOwnProperty(key)) {
                return self.escape(values[key]);
            }
            return txt;
        }.bind(this));
    }
};
class DbHelper {
    constructor(dbms, connection, tableName) {
        this.dbms = dbms;
        this.tableName = tableName;
        this.pool = mysql.createPool(Object.assign({}, connection, { queryFormat: noImplicitThisFixing.queryFormat }));
    }
    getTemplate(filename) {
        const migrationClass = 'MysqlMigration';
        const template = `
const Migration = require("dbmigrate").${migrationClass};

class ${filename} extends Migration {
    // async up() {
    //
    // }

    // async down() {
    //
    // }

    async safeUp() {

    }

    async safeDown() {

    }
}


exports.migrationClass = ${filename};`;
        return template;
    }
    createHistoryTable(callback) {
        this.pool.query('CREATE TABLE IF NOT EXISTS ::tableName ( ' +
            '`version` varchar(180) NOT NULL, ' +
            '`apply_time` int(11) DEFAULT NULL ' +
            ') ENGINE=InnoDB DEFAULT CHARSET=utf8', {
            tableName: this.tableName
        }, callback);
    }
    getMigrationHistory(limit, callback) {
        this.pool.query('SELECT version, apply_time ' +
            'FROM ::tableName ' +
            'ORDER BY apply_time DESC, version DESC ' +
            (limit ? 'LIMIT :limit' : ''), {
            tableName: this.tableName,
            limit
        }, function (err, rows) {
            if (err) {
                return callback(err);
            }
            callback(undefined, rows);
        });
    }
    addMigrationHistory(version, callback) {
        this.pool.query('INSERT INTO ::tableName SET version = :version, apply_time = :time', {
            tableName: this.tableName,
            version,
            time: Date.now() / 1000
        }, callback);
    }
    removeMigrationHistory(version, callback) {
        this.pool.query('DELETE FROM ::tableName WHERE version = :version', {
            tableName: this.tableName,
            version
        }, callback);
    }
    migrateUp(migrationClass, migrationName, callback) {
        const self = this;
        this.pool.getConnection(function (err, connection) {
            const migration = new migrationClass(connection);
            migration.up().then(() => {
                self.addMigrationHistory(migrationName, function (err) {
                    connection.release();
                    if (err) {
                        return callback(err);
                    }
                    callback();
                });
            }).catch((err) => {
                connection.release();
                return callback(err);
            });
        });
    }
    migrateDown(migrationClass, migrationName, callback) {
        const self = this;
        this.pool.getConnection(function (err, connection) {
            const migration = new migrationClass(connection);
            migration.down().then(() => {
                self.removeMigrationHistory(migrationName, function (err) {
                    connection.release();
                    if (err) {
                        return callback(err);
                    }
                    callback();
                });
            }).catch((err) => {
                connection.release();
                return callback(err);
            });
        });
    }
}
exports.DbHelper = DbHelper;
