Basic Security Stuff
=

MongoDB supports a rich set of security features. This exercise will walk through the basic steps
of configuring security on your ``mongod`` instance.

To enable security, you need to start your ``mongod`` instance with the ``--auth`` parameter.
But - how can connect without making users yet? There is a special feature called the "localhost
exception" which allows a ``mongod`` to accept a connection from the same computer as long as no
users have been created yet.

Users are defined within a database. Each user has an associtated set of roles. Each role defines 
priviliges, each of which is comprised of actions against a database or collection. Please consult the
official documentation for full details.

For this exercise, we'll create a user first and then enable security.

* Shell into you ``mongod`` and switch to the ``admin`` database.
* Create a "super" with with the roles ``userAdminAnyDatabase, readWriteAnyDatabase, dbAdminAnyDatabase``.

Here is little *hint*...
```
>var superUser = { "user" : <some-user-name>, "pwd" : <some-password>, roles : [ ... ]
>db.createUser(
```

*hint* #2 - http://docs.mongodb.org/manual/tutorial/add-user-administrator/

You have to figure how to complete the above!
* Restart your ``mongod`` with ``--auth``.
* Now try to shell in as usual and try to query something, what happens?
* Try to shell in again, now using your credentials. *(Remember to google stuff to figure out the details!)*
* Create another user with only ``read`` access on the ``students`` database.
* Shell in as that user and verify you cannot insert a document into the ``students`` database.

Logged in as your 'superUser' you should see something like this in the ``system.users`` collection:

```
> use admin
switched to db admin
> show collections
system.indexes
system.users
system.version
> db.system.users.find()
{ "_id" : "admin.root", "user" : "root", "db" : "admin", "credentials" : { "SCRAM-SHA-1" : { "iterationCount" : 10000, "salt" : "khoGP8a7n1A/MEpQ3VLjRQ==", "storedKey" : "wWTIRLPCW8gBegUcBvYt7EYjdFA=", "serverKey" : "buk7i8wTIsNBHA0kIIJseYTIeh0=" } }, "roles" : [ { "role" : "userAdminAnyDatabase", "db" : "admin" }, { "role" : "readWriteAnyDatabase", "db" : "admin" }, { "role" : "dbAdminAnyDatabase", "db" : "admin" } ] }
{ "_id" : "students.john", "user" : "john", "db" : "students", "credentials" : { "SCRAM-SHA-1" : { "iterationCount" : 10000, "salt" : "2GHaIJReKQj9+vSQDkX/fw==", "storedKey" : "FfGOYtXaj+JlGXcVMO1NJVNdqCQ=", "serverKey" : "u2Cta0RmXe5SFthhsukey6KZ7O8=" } }, "roles" : [ { "role" : "read", "db" : "students" } ] }
```

Auth with Replica Sets
=

Run through this tutorial to enable auth in your 3.0.3 repl set:

http://docs.mongodb.org/manual/tutorial/deploy-replica-set-with-auth/
