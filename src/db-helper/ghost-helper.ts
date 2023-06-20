const got = require('got');

export async function ghostSql(migration: any, sql: string, params: any) {
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
                dbName:  'master',
                cutOverMode: ghostConfig.cutOverMode,
                alterSqlScript: sql
            }
        });
    } else {
        console.log('Falling back to regular SQL');
        await migration.sql(sql, params);
    }
}