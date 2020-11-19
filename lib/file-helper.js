"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileHelper = void 0;
const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
class FileHelper {
    constructor(path) {
        this.path = path;
    }
    createDirectory(callback) {
        fs.lstat(this.path, (err) => {
            if (err && err.errno === -2) {
                fs.mkdir(this.path, callback);
            }
            else {
                callback(err);
            }
        });
    }
    generateFileName(migrationName) {
        return `m${moment().format('YMMDD_HHmmss')}_${migrationName}`;
    }
    getFilePath(filename) {
        return path.join(this.path, filename + '.js');
    }
    createFile(filename, template, callback) {
        const filePath = this.getFilePath(filename);
        fs.writeFile(filePath, template, callback);
    }
    getMigrationsFromDirectory(callback) {
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
    getMigrationClass(migrationName) {
        // const file = path.join(this.path, migrationName + '.js');
        return require(path.join(this.path, migrationName)).migrationClass;
    }
}
exports.FileHelper = FileHelper;
