import * as minimist from 'minimist';
import * as path from 'path';
import * as migrate from './migrate';

const argv = minimist(process.argv.slice(2));
const configFilePath = argv['config-file'] || '.migration';
const config = require(path.join(process.cwd(), configFilePath));

config.migrationPath = path.join(process.cwd(), config.migrationPath);

const migration = new migrate.Migration(config);

migration.init(function (err) {
    if (err) {
        console.error(err);
        return process.exit(1);
    }

    switch (argv._[0]) {
        case 'create':
            migration.create(argv._[1], callback);
            break;
        case 'down':
            migration.down(argv._[1], callback);
            break;
        // case 'redo':
        //     migration.redo(argv._[1], callback);
        //     break;
        case 'history':
            migration.history(argv._[1], callback);
            break;
        case 'new':
            migration.new(argv._[1], callback);
            break;
        case 'up':
            migration.up(argv._[1], callback);
        default :
            migration.up(argv._[0], callback);
    }

    function callback(err, result) {
        if (err) {
            console.error(err.message);
            return process.exit(1);
        }

        if (result) {
            console.log(result);
        }

        process.exit(0);
    }
});