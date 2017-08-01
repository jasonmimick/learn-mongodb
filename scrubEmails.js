/*
 * scrub-emails.js
 *
 * Author: jason.mimick@mongodb.com
 * SAMPLE CODE
 * USE AT YOUR OWN RISK
 * TEST TEST TEST TEST
 *
 * This script will modify the Email key
 * found in an array of subdocuments under a
 * key called "User" in a document.
 *
 * REQUIRED:
 * Set DB_NAME, COLL_NAME to the correct database
 * and collection you want to modify.
 *
 * Set NUM_WORKERS to the number of parallel threads
 * to launch at a time (multiple batches of this 
 * number of threads will run sequentially).
 *
 * APPROX_NUM_DOCS_IN_CHUNK configures roughly
 * how many documents are updated per thread.
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !! BACKUP the data to be modified !! 
 * !! before running this script     !!
 * !! THERE IS NO UNDO               !!  
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 *
 * Usage:
 * $mongo scrub-email.js
 *
 */

// NOTE - requires the file parallelTester.js
// be present in same directory
load("./parallelTester.js");
var DB_NAME = "united";
var COLL_NAME = "customers";
var NUM_WORKERS = 25;
var APPROX_NUM_DOCS_IN_CHUNK = 100;
db = db.getSiblingDB(DB_NAME);


// Spin through a chunk of docs updating the email's
var scrubChunk = function(startId, endId, db_name, coll_name) {
    // This function does the actual string
    // manipulation on one email address.
    var scrubEmail = function(email) {
        var parts = email.split("@");
        return "xxx@" + parts[1];
    }
    db = db.getSiblingDB(db_name);
    var query = { "_id" : { "$gte" : startId, "$lt" : endId } };
    var cursor = db.getCollection(coll_name).find( query );
    var bulk = db.getCollection(coll_name).initializeUnorderedBulkOp();
    while (cursor.hasNext()) {
        var customer = cursor.next();
        var fieldUpdates = {};
        Object.keys(customer.User).forEach( function(id) {
            if ( customer.User[id].Email ) {
                var subdocRef = "User."+id+".Email"; 
                fieldUpdates[subdocRef] = scrubEmail( customer.User[id].Email );
            }
        });
        var updateOp = { "$set" : fieldUpdates }; 
        bulk.find({ "_id" : customer._id}).update( updateOp );
    }
    var result = bulk.execute();
    return "Scrubbed [ " + startId + "," + endId + "] " + JSON.stringify(result);
}

// This function takes an array of _id's and
// launches a thread for each which calls
// the scrubChunk function
var workOnBatch = function(splitKeys,current,lastBatchFlag,db_name,coll_name) {
    var threads = [];
    splitKeys.forEach( function(key) {
        print("Launching shell for chunk [ " + current + "," + key._id + "]");
        var thread = new ScopedThread(scrubChunk, current, key._id, db_name, coll_name);
        threads.push(thread);
        thread.start();
        current = key._id;
    });

    if ( lastBatchFlag ) {
        var thread = new ScopedThread(scrubChunk, current, MaxKey, db_name, coll_name);
        threads.push( thread );
        thread.start();
    }
    // Wait for all threads to finish and print out their summaries
    threads.forEach(function(t) {
        t.join();
    });
    threads.forEach(function(t) {
        printjson(t.returnData());
    });
    return current;
}

// "main"
// Script execution begins here.
// First we calculate the size for the chunks by multipling
// the average object size by how many documents we want in 
// each chunk.
var objSize = db.getCollection(COLL_NAME).stats().avgObjSize 
var splitSizeBytes = (objSize * (2 * APPROX_NUM_DOCS_IN_CHUNK));

// Run the "splitVector" command to get the splits
var namespace = DB_NAME + "." + COLL_NAME;

if ( db.getMongo().getDBNames().indexOf( DB_NAME ) == -1 ) {
    throw "Error: You set DB_NAME='"+DB_NAME+"' and no database with that name exists!";
}

if ( db.getSiblingDB(DB_NAME).getCollectionNames().indexOf( COLL_NAME ) == -1 ) {
    throw "Error: you set COLL_NAME='"+COLL_NAME="' and no collection with that name exists "
        + "in the " + DB_NAME + " database!";
}

var split = db.runCommand( {splitVector: namespace, 
                            keyPattern: {_id: 1},
                            maxChunkSizeBytes : splitSizeBytes})

// Now call workOnBatch for each batch
// of NUM_WORKERS splitKeys
var current = MinKey;
var i = 0;
var lastBatchFlag = false;
var numBatches = Math.ceil(split.splitKeys.length/NUM_WORKERS);
var startTime = new Date().getTime();
for(var i=0; i<numBatches; i++) {
    var start = i * NUM_WORKERS;
    var stop = (i+1) * NUM_WORKERS;
    if ( stop > split.splitKeys.length ) {
        stop = split.splitKeys.length;
        lastBatchFlag = true;
    }
    var keys = split.splitKeys.slice(i*NUM_WORKERS,(i+1)*NUM_WORKERS);
    current = workOnBatch(keys, current, lastBatchFlag, DB_NAME, COLL_NAME);
}
var endTime = new Date().getTime();

print("Total runtime: " + (endTime-startTime)/1000 + " seconds.");

// Finally, run a query to
// prove the scrub worked
print("Running query to validate no emails missed...")
var foundError = false;
cursor = db.getCollection(COLL_NAME).find({});
while ( cursor.hasNext() ) {
    var c = cursor.next();
    Object.keys(c.User).forEach( function(id) { 
        if ( c.User[id].Email.split("@")[0] != "xxx" ) {
            print("ERROR: " + c._id + ":" + id + ":" + c.User[id].Email );
            foundError = true;
        }
    });
}
if ( !foundError ) {
    print("No errors detected.")
}

