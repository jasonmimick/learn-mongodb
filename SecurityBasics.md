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
You have to figure how to complete the above!
* Restart your ``mongod`` with ``--auth``.
* Now try to shell in as usual and try to query something, what happens?
* Try to shell in again, now using your credentials. *(Remember to google stuff to figure out the details!)*
* Create another user with only ``read`` access on the ``students`` database.
* Shell in as that user and verify you cannot insert a document into the ``students`` database.
