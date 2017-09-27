Migration system for Node.js

## Installation
To use DbMigrate you need to install it globally first:
    
    $ npm install -g dbmigrate
    $ npm link dbmigrate
    
DbMigrate is now available to you via:

    $ dbmigrate
    or
    $ migrate
    
### Or as local module
Want to use DbMigrate as local module?

    $ npm install db-migrate

DbMigrate is now available to you via:

    $ node node_modules/dbmigrate/bin/migrate


## How do I use migrate?

Create the configuration file with name .migration or .migration.js and fill the following properties:
    
    module.exports = {
        migrationPath: './migrations',
        dbms: 'mysql',
        connection: {
            user: 'username',
            password: 'password',
            database: 'databaseName'
        },
        migrationTableName: '_migrations'
    };

* migrationPath - Path to the migrations directory (relative to migrate)
* dbms - Which DBMS to use for executing migrations
* connection - Configuration for MySQL (username, password, etc.)
* migrationTableName - 

Once you have the configuration file filled you you can create a new migration from the command line:

    $ migrate create migration_name

This command will create a blank migration and stick it in the migrations folder that you supplied in the configuration file. 

    const Migration = require("dbmigrate").MysqlMigration;
    
    class m20170927_113738_user_table extends Migration {
        up(callback) {
            this.connection.query(
                'CREATE TABLE user (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), age INT)',
                (err, result) => {
                    if (err) {
                        return callback(err);
                    }
    
                    this.connection.query(
                        'INSERT INTO user (name, age) VALUES ?',
                        [[
                            ['Tom', 23],
                            ['Adam', 29]
                        ]],
                        callback);
                }
            );
        }
    
        down(callback) {
            this.connection.query(
                'DROP TABLE user',
                callback
            );
        }
    }
    
    exports.migrationClass = m20170927_113738_user_table;

Once you fill out the migration's up and down functions you can then apply the migration to your schema like so:

    $ migrate migrate
    $ migrate migrate 3

That command will determine if there are any migrations that have not been applied and apply them sequentially until they are all done or one of them fails.

If you wish to roll back any migrations that's super simple too, just use:

    $ migrate down

By default this will roll back only a single migration, but you can provide a numeric parameter to tell it how many migrations you'd like it to roll back. For instance, here's how you would roll back five migrations:

    $ migrate down 5

Show history

    $ migrate history      # showing the last 10 applied migrations
    $ migrate history 5    # showing the last 5 applied migrations
    $ migrate history all  # showing all applied migrations