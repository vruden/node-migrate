import * as mysql from 'mysql';
import * as util from 'util';

export interface IMysqlMigration {
    up(callback: (err?) => void): void;
    safeUp(callback: (err?) => void): void;
    down(callback: (err?) => void): void;
    safeDown(callback: (err?) => void): void;
}


export class MysqlMigration implements IMysqlMigration {
    constructor(public connection: mysql.IConnection) {

    }

    async sql(queryString: string = '', queryParams: any = null): Promise<any | any[]> {
        return new Promise((resolve, reject) => {
            this.connection.query(queryString, queryParams, function (err, rows) {
                if (err) {
                    return reject(new Error(`${err.message} \nParams: ${util.inspect(queryParams, {depth: null})} ${queryString}`));
                }

                resolve(rows);
            });
        });
    }

    private async beginTransaction() {
        return new Promise<void>((resolve, reject) => {
            this.connection.beginTransaction((err) => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        });
    }

    private async commit() {
        return new Promise<void>((resolve, reject) => {
            this.connection.commit((err) => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        });
    }

    private async rollback() {
        return new Promise<void>((resolve, reject) => {
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
        } catch (err) {
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
        } catch (err) {
            await this.rollback();

            throw err;
        }
    }

    async safeDown() {

    }
}
