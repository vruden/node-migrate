"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
class MysqlMigration {
    constructor(connection) {
        this.connection = connection;
    }
    up(callback) {
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
    safeUp(callback) {
    }
    down(callback) {
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
    safeDown(callback) {
    }
}
exports.MysqlMigration = MysqlMigration;
