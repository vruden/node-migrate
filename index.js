var argv = require('minimist')(process.argv.slice(2));
var path = require('path');
var migrate = require('./lib/migrate');

var configFilePath = argv.config || '.migration';

var config = require(path.join(process.cwd(), configFilePath));

migrate.init(config.migrationPath, config.dbms, config.mysql, config.migrationTableName, function (err, result) {
    if (err) {
        console.error(err);
        return process.exit(1);
    }

    switch (argv._[0]) {
        case 'create':
            migrate.create(argv._[1], callback);
            break;
        case 'down':
            migrate.down(argv._[1], callback);
            break;
        case 'redo':
            migrate.redo(argv._[1], callback);
            break;
        case 'history':
            migrate.history(argv._[1], callback);
            break;
        case 'migrate':
            migrate.migrate(argv._[1], callback);
        default :
            migrate.migrate(argv._[0], callback);
    }

    function callback(err, result) {
        if (err) {
            console.error(err);
            return process.exit(1);
        }

        console.log(result);
        process.exit(0);
    }
});

module.exports = migrate;