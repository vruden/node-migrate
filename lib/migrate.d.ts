import * as mysql from 'mysql';
export interface IMigrateConfig {
    migrationPath: string;
    dbms: 'mysql' | 'postgresql';
    connection: mysql.IConnectionConfig;
    migrationTableName: string;
}
export interface IMigrationCallback {
    (err?: Error, results?: string): void;
}
export interface IMigration {
}
export declare class Migration implements IMigration {
    private db;
    private file;
    constructor(config: IMigrateConfig);
    init(callback: any): void;
    create(migrationName: string, callback: IMigrationCallback): void;
    new(limit: string, callback: IMigrationCallback): void;
    history(limit: string, callback: IMigrationCallback): void;
    up(limit: string, callback: any): void;
    down(limit: string, callback: any): any;
    private getNewMigrations(callback);
    private migrateUp(migrationName, callback);
    private migrateDown(migrationName, callback);
}
