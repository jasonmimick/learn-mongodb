# Backups with ```mongodump``` and ``mongorestore``

This exercise will work through an example of taking a backup from
a MongoDB replica set and then restoring the backup.

The exercise assumes you have a running replica set.

High Level Steps
----------------
1. Chose a secondary to run the backup on
2. Pause the secondary
3. Run the ```mongodump`` tool
4. Un-pause the secondary
5. Compress the backup
6. Restore the backup

Setup
-----

To start, let's seed some sample data into our replica set.
Open a text editor, copy/paste the following javascript, and
then save the file as ```sampleDataLoader.js```.

```
db = db.getSiblingDB("test")
for (var i=0;i<1000;i++) { db.data.insert({"value" : i, "ts" : new Date()}); }
print("db.data.count()="+db.data.count());
```
Connect to your primary node and run the script:

```
$mongo <connection_info> sampleDataLoader.js
```

You should verify and validate that you have 1000 documents in the ```data```
collection.

Now we can take a backup. You will need 2 command prompts to complete
this part.

In your first prompt, open a ```mongo``` shell to the secondary you wish to take
a backup on and run the following:

```
SECONDARY:replSet>db.fsyncLock()
{
	"info" : "now locked against writes, use db.fsyncUnlock() to unlock",
	"seeAlso" : "http://dochub.mongodb.org/core/fsynccommand",
	"ok" : 1
}
```

**keep this shell open** and **do not close this shell session until we're
done with the backup!**

Now, in your second comment prompt we'll use the ```mongodump``` tool
to dump out BSON files with all the data in all the collections:

```
$mongodump <connection_info>
$ls -l dump
```

By default ```mongodump``` will write the backup files into a directory
called ```dump```. You can control the output directory, run 
```mongodump --help`` to see all the options available.

Now we can unlock the secondary, so go back to the shell session
and issue the following:

```
SECONDARY:replSet>db.fsyncUnlock()
{ "info" : "unlock completed", "ok" : 1 }
```

At this point your replica set is back to normal operational status.
