"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ghostSql = void 0;
const got = require("got"); //const got = require('got');
async function ghostSql(migration, sql, params) {
    if (migration.connection.config.flags.ghost) {
        const config = migration.connection.config;
        const ghostConfig = config.flags.ghost;
        const url = `http://${ghostConfig.server}:${ghostConfig.port}/gh-ost/migration`;
        await got.post(url, {
            json: {
                dbConfig: {
                    host: config.host,
                    user: config.user,
                    database: config.database,
                    password: config.password
                },
                dbName: 'localtest',
                cutOverMode: ghostConfig.cutOverMode,
                alterSqlScript: sql
            }
        });
    }
    else {
        console.log('Falling back to regular SQL');
        await migration.sql(sql, params);
    }
}
exports.ghostSql = ghostSql;
