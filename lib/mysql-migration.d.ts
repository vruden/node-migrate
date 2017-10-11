import * as mysql from 'mysql';
export interface IMysqlMigration {
    up(callback: (err?) => void): void;
    safeUp(callback: (err?) => void): void;
    down(callback: (err?) => void): void;
    safeDown(callback: (err?) => void): void;
}
export declare class MysqlMigration implements IMysqlMigration {
    connection: mysql.IConnection;
    constructor(connection: mysql.IConnection);
    up(callback: (err?) => void): void;
    safeUp(callback: (err?) => void): void;
    down(callback: (err?) => void): void;
    safeDown(callback: (err?) => void): void;
}
