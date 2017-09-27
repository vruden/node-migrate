import * as _ from 'lodash';
import fs = require('fs');
import * as path from 'path';
import * as moment from 'moment';
import ErrnoException = NodeJS.ErrnoException;

export class FileHelper {
    private path: string;

    constructor(path: string) {
        this.path = path;
    }

    createDirectory(callback: (err: ErrnoException) => void): void {
        fs.lstat(this.path, (err) => {
            if (err && err.errno === -2) {
                fs.mkdir(this.path, callback);
            } else {
                callback(err);
            }
        });
    }

    generateFileName(migrationName: string): string {
        return `m${moment().format('YMMDD_HHmmss')}_${migrationName}`;
    }

    getFilePath(filename: string): string {
        return path.join(this.path, filename + '.js');
    }

    createFile(filename: string, template: string, callback: (err: Error) => void): void {
        const filePath = this.getFilePath(filename);

        fs.writeFile(filePath, template, callback);
    }

    getMigrationsFromDirectory(callback: (err: Error, files?: string[]) => void): void {
        fs.readdir(this.path, function (err, files) {
            if (err) {
                return callback(err);
            }

            // TODO to optimize
            files = _.filter(files, (file) => /^(m(\d{8}_\d{6})_.*?)\.js$/i.test(file));
            files = _.map(files, (file) => file.slice(0, -3));

            callback(null, files);
        });
    }

    getMigrationClass(migrationName: string): ClassDecorator {
        // const file = path.join(this.path, migrationName + '.js');

        return require(path.join(this.path, migrationName)).migrationClass;
    }
}