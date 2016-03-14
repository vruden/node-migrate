Migration system for Node.js

How do I use migrate?

Once you have the configuration file filled you you can create a new migration from the command line:

node migrate.js create create_users_table

This command will create a blank migration and stick it in the migrations folder that you supplied in the configuration file. Once you fill out the migration's up and down functions you can then apply the migration to your schema like so:

node migrate.js migrate
node migrate.js migrate 3

That command will determine if there are any migrations that have not been applied and apply them sequentially until they are all done or one of them fails.

If you wish to roll back any migrations that's super simple too, just use:

node migrate.js down

By default this will roll back only a single migration, but you can provide a numeric parameter to tell it how many migrations you'd like it to roll back. For instance, here's how you would roll back five migrations:

node migrate.js down 5


Redoing Migrations
Redoing migrations means first reverting the specified migrations and then applying again. This can be done as follows:

yii migrate/redo        # redo the last applied migration
yii migrate/redo 3      # redo the last 3 applied migrations



yii migrate/history     # showing the last 10 applied migrations
yii migrate/history 5   # showing the last 5 applied migrations
yii migrate/history all # showing all applied migrations