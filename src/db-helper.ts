import * as mysql from 'mysql';

const noImplicitThisFixing = {
    escape(value: string) {},
    escapeId(value: string) {},
    queryFormat(query: string, values: any): string {
        if (!values) return query;

        const self = this;

        return query.replace(/\:\:(\w+)/g, function (txt: string, key: any) {
            if (values.hasOwnProperty(key)) {
                return self.escapeId(values[key]);
            }
            return txt;
        }.bind(this)).replace(/\:(\w+)/g, function (txt: string, key: any) {
            if (values.hasOwnProperty(key)) {
                return self.escape(values[key]);
            }
            return txt;
        }.bind(this));
    }
};

export class DbHelper {
    private dbms: 'mysql' | 'postgresql';
    private pool: mysql.IPool;
    private tableName: string;

    constructor(dbms: 'mysql' | 'postgresql', connection: mysql.IConnectionConfig, tableName: string) {
        this.dbms = dbms;
        this.tableName = tableName;

        this.pool = mysql.createPool({ ...connection, queryFormat: noImplicitThisFixing.queryFormat });
    }

    getTemplate(filename: string): string {
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

    createHistoryTable(callback: (err: mysql.IError) => void): void {
        this.pool.query(
            'CREATE TABLE IF NOT EXISTS ::tableName ( ' +
            '`version` varchar(180) NOT NULL, ' +
            '`apply_time` int(11) DEFAULT NULL ' +
            ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
            {
                tableName: this.tableName
            },
            callback
        );
    }

    getMigrationHistory(limit: number, callback: (err: mysql.IError, rows?: {version, apply_time}[]) => void): void {
        this.pool.query(
            'SELECT version, apply_time ' +
            'FROM ::tableName ' +
            'ORDER BY apply_time DESC, version DESC ' +
            (limit ? 'LIMIT :limit' : ''),
            {
                tableName: this.tableName,
                limit
            },
            function (err, rows) {
                if (err) {
                    return callback(err);
                }

                callback(undefined, rows);
            }
        );
    }

    addMigrationHistory(version: string, callback): void {
        this.pool.query(
            'INSERT INTO ::tableName SET version = :version, apply_time = :time',
            {
                tableName: this.tableName,
                version,
                time: Date.now() / 1000
            },
            callback
        );
    }

    removeMigrationHistory(version: string, callback): void {
        this.pool.query(
            'DELETE FROM ::tableName WHERE version = :version',
            {
                tableName: this.tableName,
                version
            },
            callback
        );
    }

    migrateUp(migrationClass, migrationName, callback): void {
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

    migrateDown(migrationClass, migrationName, callback): void {
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
