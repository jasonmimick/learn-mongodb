Install your own MongoDB 
=

Good Morning - get some coffee and solve this challenge!
Install a stand alone MongoDB on your provided MacBook.
This should be the latest stable version available - cutting edge stuff.
We'll use this instance for some additional exercises.

Hints
~
* Find a URL to download from - OR - copy the latest kit from your thumb drive
* Think about how you want to run your ``mongod`` (what ``dbpath`` do you want? what other configuration options 
should you specify?)
* Get Mongo running, shell in and make sure things look right. If they do, then you should see something like this:

```
> db.version()
3.0.2
> db.stats()
{
	"db" : "test",
	"collections" : 0,
	"objects" : 0,
	"avgObjSize" : 0,
	"dataSize" : 0,
	"storageSize" : 0,
	"numExtents" : 0,
	"indexes" : 0,
	"indexSize" : 0,
	"fileSize" : 0,
	"ok" : 1
}
```

*Hint*: You'll need a terminal session on your laptop to get things running and run the ``mongo`` shell.
