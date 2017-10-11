import * as _ from 'lodash';
import * as mysql from 'mysql';

export interface IMysqlMigration {
    up(callback: (err?) => void): void;
    safeUp(callback: (err?) => void): void;
    down(callback: (err?) => void): void;
    safeDown(callback: (err?) => void): void;
}


export class MysqlMigration implements IMysqlMigration {
    constructor(public connection: mysql.IConnection) {

    }

    up(callback: (err?) => void): void {
        const self = this;

        if (typeof this.safeUp === 'function') {
            return callback(new Error('safeUp method is not implemented'));
        }

        this.connection.beginTransaction(function (err) {
            if (err) {
                return rollback(err);
            }

            self.safeUp(function (err) {
                if (err) {
                    return rollback(err);
                }

                self.connection.commit(function (err) {
                    if (err) {
                        return rollback(err);
                    }

                    callback();
                });
            });
        });

        function rollback(err) {
            self.connection.rollback(function () {
                callback(err);
            });
        }
    }

    safeUp(callback: (err?) => void): void {
    }

    down(callback: (err?) => void): void {
        const self = this;

        if (!_.isFunction(self.safeDown)) {
            return callback(new Error('safeDown method is not implemented'));
        }

        this.connection.beginTransaction(function (err) {
            if (err) {
                return rollback(err);
            }

            self.safeDown(function (err) {
                if (err) {
                    return rollback(err);
                }

                self.connection.commit(function (err) {
                    if (err) {
                        return rollback(err);
                    }

                    callback();
                });
            });
        });

        function rollback(err) {
            self.connection.rollback(function () {
                callback(err);
            });
        }
    }

    safeDown(callback: (err?) => void): void {
    }
}