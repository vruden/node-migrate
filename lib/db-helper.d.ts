import * as mysql from 'mysql';
export declare class DbHelper {
    private dbms;
    private pool;
    private tableName;
    constructor(dbms: 'mysql' | 'postgresql', connection: mysql.IConnectionConfig, tableName: string);
    getTemplate(filename: string): string;
    createHistoryTable(callback: (err: mysql.IError) => void): void;
    getMigrationHistory(limit: number, callback: (err: mysql.IError, rows?: {
        version: any;
        apply_time: any;
    }[]) => void): void;
    addMigrationHistory(version: string, callback: any): void;
    removeMigrationHistory(version: string, callback: any): void;
    migrateUp(migrationClass: any, migrationName: any, callback: any): void;
    migrateDown(migrationClass: any, migrationName: any, callback: any): void;
}
