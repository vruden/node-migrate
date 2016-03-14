var assert = require("assert");
var mysql = require('mysql');
var _ = require('lodash');
var migrate = require('../lib/migrate');

var pool = mysql.createPool({
    "host": "localhost",
    "user": "root",
    "password": "123123",
    "database": "node-migrate"
});

describe('migrate', function () {
    var data = {
        name: 'Test group',
        title: 'Test group title'
    };

    function get_by_id(id, callback) {
        db.sql('SELECT * FROM `group` WHERE id = ?', [id], callback);
    }

    function remove_by_id(id, callback) {
        db.sql('DELETE FROM `group` WHERE id = ?', [id], callback);
    }



    describe('#init', function () {
        it('should create migrations table', function (done) {
            migrate._init(function () {


                pool.query('SHOW TABLES', [], function () {

                });
            });

            GroupModel.get(function (err, rows) {
                if (err) {
                    return done(err);
                }

                assert.equal(true, rows[0].hasOwnProperty('id'), 'Object does not contain a property named id');
                assert.equal(true, rows[0].hasOwnProperty('name'), 'Object does not contain a property named name');
                assert.equal(true, rows[0].hasOwnProperty('title'), 'Object does not contain a property named title');

                done();
            });
        });
    });

    describe('#add', function () {
        var new_group_id;

        after('Remove test data', function (done) {
            if (!new_group_id)
                return false;

            remove_by_id(new_group_id, done);
        });

        it('should add a group', function (done) {
            GroupModel.add(data, function (err, result) {
                if (err) {
                    return done(err);
                }

                new_group_id = result.insertId;

                get_by_id(new_group_id, function (err, rows) {
                    if (err) {
                        return done(err);
                    }

                    assert.equal(new_group_id, rows[0].id, 'Has wrong name');
                    assert.equal(data.name, rows[0].name, 'Has wrong name');
                    assert.equal(data.title, rows[0].title, 'Has wrong title');
                    assert.equal(0, rows[0].archived, 'Has wrong archived property');

                    done();
                });
            });
        });
    });

    describe('#edit', function () {
        var group_id;
        var new_properties = {
            name: 'new test group name',
            title: 'new test group title'
        };

        before('Insert test data', function (done) {
            db.sql('INSERT INTO `group` SET ?', [data], function (err, result) {
                if (err) {
                    return done(err);
                }

                group_id = result.insertId;

                done();
            });
        });

        after('Remove test data', function (done) {
            remove_by_id(group_id, done);
        });

        it('should edit the group', function (done) {
            new_properties.id = group_id;
            GroupModel.edit(new_properties, function (err, result) {
                if (err) {
                    return done(err);
                }

                get_by_id(group_id, function (err, rows) {
                    if (err) {
                        return done(err);
                    }

                    assert.equal(new_properties.name, rows[0].name, 'Has wrong name');
                    assert.equal(new_properties.title, rows[0].title, 'Has wrong title');

                    done();
                });
            });
        });
    });

    describe('#edit_notes', function () {
        var group_id;
        var new_properties = {
            name: 'new test group name',
            title: 'new test group title'
        };

        before('Insert test data', function (done) {
            db.sql('INSERT INTO `group` SET ?', [data], function (err, result) {
                if (err) {
                    return done(err);
                }

                group_id = result.insertId;

                done();
            });
        });

        after('Remove test data', function (done) {
            remove_by_id(group_id, done);
        });

        it('should edit notes', function (done) {
            var notes = 'test notes';
            GroupModel.edit_notes(group_id, notes, function (err, result) {
                if (err) {
                    return done(err);
                }

                get_by_id(group_id, function (err, rows) {
                    if (err) {
                        return done(err);
                    }

                    assert.equal(notes, rows[0].notes, 'Has wrong property notes');

                    done();
                });
            });
        });
    });

    describe('#archive', function () {
        var group_id;

        before('Insert test data', function (done) {
            db.sql('INSERT INTO `group` SET ?', [data], function (err, result) {
                if (err) {
                    return done(err);
                }

                group_id = result.insertId;

                done();
            });
        });

        after('Remove test data', function (done) {
            remove_by_id(group_id, done);
        });

        it('should archive the group', function (done) {
            GroupModel.archive(group_id, function (err, result) {
                if (err) {
                    return done(err);
                }

                get_by_id(group_id, function (err, rows) {
                    if (err) {
                        return done(err);
                    }

                    assert.equal(1, rows[0].archived, 'Has wrong property named "archived"');

                    done();
                });
            });
        });
    });

    describe('#create_default_for_user', function () {
        var user = {
            login: '99_test_user_99',
            first_name: 'test_user',
            last_name: 'second'
        };
        var ids = {
            group: null,
            campus: null
        };

        before('Insert test data', function (done) {
            db.sql('INSERT INTO user SET ?', [user], function (err, result) {
                if (err) {
                    return done(err);
                }

                user.user_id = result.insertId;

                done();
            });
        });

        after('Remove test data', function (done) {
            db.sql('DELETE FROM user WHERE id = ?', [user.user_id], function (err) {
                if (err) {
                    return done(err);
                }

                db.sql('DELETE FROM `group` WHERE id = ?', [ids.group], function (err) {
                    if (err) {
                        return done(err);
                    }

                    db.sql('DELETE FROM group_campus WHERE group_id = ?', [ids.group], function (err) {
                        if (err) {
                            return done(err);
                        }

                        db.sql('DELETE FROM campus WHERE id = ?', [ids.campus], done);
                    });
                });
            });
        });

        it('should create new group and campus for user and set group_id to user object', function (done) {
            GroupModel.create_default_set_for_user(user, function (err, group_id) {
                if (err) {
                    return done(err);
                }

                ids.group = group_id;

                db.sql(
                    'SELECT g.*, gc.* ' +
                    'FROM `group` g ' +
                    'JOIN group_campus gc ON g.id = gc.group_id ' +
                    'JOIN campus ca ON ca.id = gc.campus_id ' +
                    'WHERE g.id = ? ' +
                    'AND gc.owner = 1',
                    [group_id],
                    function (err, rows) {
                        if (err) {
                            return done(err);
                        }

                        if (rows.length) {
                            ids.campus = rows[0].campus_id;
                        }

                        assert.equal(1, !!rows.length);
                        assert.equal(user.login, rows[0].title, 'Wrong group title');
                        assert.equal(user.first_name + ' ' + user.last_name, rows[0].name, 'Wrong group title');

                        db.sql('SELECT * FROM user WHERE id = ?', [user.user_id], function (err, rows) {
                            if (err) {
                                return done(err);
                            }

                            assert.equal(group_id, rows[0].group_id, 'Has wrong value of property named "group_id"');

                            done();
                        });
                    });
            });
        });
    });
});