"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
class MysqlMigration {
    constructor(connection) {
        this.connection = connection;
    }
    sql(queryString = '', queryParams = null) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.connection.query(queryString, queryParams, function (err, rows) {
                    if (err) {
                        return reject(new Error(`${err.message} \nParams: ${util.inspect(queryParams, { depth: null })} ${queryString}`));
                    }
                    resolve(rows);
                });
            });
        });
    }
    beginTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.connection.beginTransaction((err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            });
        });
    }
    commit() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.connection.commit((err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            });
        });
    }
    rollback() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.connection.rollback(() => {
                    resolve();
                });
            });
        });
    }
    up() {
        return __awaiter(this, void 0, void 0, function* () {
            // this.safeDown.constructor.name !== 'AsyncFunction'
            if (typeof this.safeUp !== 'function') {
                throw new Error('safeUp method is not implemented');
            }
            try {
                yield this.beginTransaction();
                yield this.safeUp();
                yield this.commit();
            }
            catch (err) {
                yield this.rollback();
                throw err;
            }
        });
    }
    safeUp() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    down() {
        return __awaiter(this, void 0, void 0, function* () {
            // this.safeDown.constructor.name !== 'AsyncFunction'
            if (typeof this.safeDown !== 'function') {
                throw new Error('safeDown method is not implemented');
            }
            try {
                yield this.beginTransaction();
                yield this.safeDown();
                yield this.commit();
            }
            catch (err) {
                yield this.rollback();
                throw err;
            }
        });
    }
    safeDown() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
}
exports.MysqlMigration = MysqlMigration;
