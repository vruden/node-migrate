/// <reference types="node" />
import ErrnoException = NodeJS.ErrnoException;
export declare class FileHelper {
    private path;
    constructor(path: string);
    createDirectory(callback: (err: ErrnoException) => void): void;
    generateFileName(migrationName: string): string;
    getFilePath(filename: string): string;
    createFile(filename: string, template: string, callback: (err: Error) => void): void;
    getMigrationsFromDirectory(callback: (err: Error, files?: string[]) => void): void;
    getMigrationClass(migrationName: string): ClassDecorator;
}
