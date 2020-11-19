"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MysqlMigration = void 0;
const util = require("util");
class MysqlMigration {
    constructor(connection) {
        this.connection = connection;
    }
    async sql(queryString = '', queryParams = null) {
        return new Promise((resolve, reject) => {
            this.connection.query(queryString, queryParams, function (err, rows) {
                if (err) {
                    return reject(new Error(`${err.message} \nParams: ${util.inspect(queryParams, { depth: null })} ${queryString}`));
                }
                resolve(rows);
            });
        });
    }
    async beginTransaction() {
        return new Promise((resolve, reject) => {
            this.connection.beginTransaction((err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }
    async commit() {
        return new Promise((resolve, reject) => {
            this.connection.commit((err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }
    async rollback() {
        return new Promise((resolve, reject) => {
            this.connection.rollback(() => {
                resolve();
            });
        });
    }
    async up() {
        // this.safeDown.constructor.name !== 'AsyncFunction'
        if (typeof this.safeUp !== 'function') {
            throw new Error('safeUp method is not implemented');
        }
        try {
            await this.beginTransaction();
            await this.safeUp();
            await this.commit();
        }
        catch (err) {
            await this.rollback();
            throw err;
        }
    }
    async safeUp() {
    }
    async down() {
        // this.safeDown.constructor.name !== 'AsyncFunction'
        if (typeof this.safeDown !== 'function') {
            throw new Error('safeDown method is not implemented');
        }
        try {
            await this.beginTransaction();
            await this.safeDown();
            await this.commit();
        }
        catch (err) {
            await this.rollback();
            throw err;
        }
    }
    async safeDown() {
    }
}
exports.MysqlMigration = MysqlMigration;
