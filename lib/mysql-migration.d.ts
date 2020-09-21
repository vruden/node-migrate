import * as mysql from 'mysql';
export interface IMysqlMigration {
    up(callback: (err?: any) => void): void;
    safeUp(callback: (err?: any) => void): void;
    down(callback: (err?: any) => void): void;
    safeDown(callback: (err?: any) => void): void;
}
export declare class MysqlMigration implements IMysqlMigration {
    connection: mysql.IConnection;
    constructor(connection: mysql.IConnection);
    sql(queryString?: string, queryParams?: any): Promise<any | any[]>;
    private beginTransaction;
    private commit;
    private rollback;
    up(): Promise<void>;
    safeUp(): Promise<void>;
    down(): Promise<void>;
    safeDown(): Promise<void>;
}
