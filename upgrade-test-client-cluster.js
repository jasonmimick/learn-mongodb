/*
 * This script will attempt to write & read
 * data from a mongodb replica set over a long
 * period of time.
 * It should be run and the output monitored while
 * you test an upgrade scenario to ensure the replica
 * set maintains full availability
 */

// Standard connection string - note the client you run this from
// must be able to connect to each node listed (so if running locally on 
// your laptop to EC2 nodes, make sure to use public DNS and firewalls are 
// set appropriately).
connectionStrings = [ "mongodb://ec2-52-91-1-26.compute-1.amazonaws.com:27017/?" +
                      "w=majority&readPreference=primaryPreferred",
                      "mongodb://ec2-52-91-1-26.compute-1.amazonaws.com:27018/?" +
                      "w=majority&readPreference=primaryPreferred" ];

var connections = [];
connectionStrings.forEach( function(connStr) {
    connections.push(new Mongo( connStr ) );
});

var dbs = [];
connections.forEach( function(conn) {
    dbs.push( conn.getDB("test") );
});

var try_db = function( fn ) {
    for (var i=0;i<dbs.length;i++) {
        var db = dbs[i];
        //print("---db---");printjson(db);
        try {
            //printjson(fn);
            var result = fn(db);
            //print("result from invoking fn(db)");
            //printjson(result);
            return result;
        } catch (error) {
            print("Error on " + db);
            printjson(error);
        }
    }
}
//db.foo.drop();
try_db( function(db) {
    db.testcontrol.drop();
});

//print("db.foo.count()=" + db.foo.count() );
var initialCount = try_db( function(db) { return db.foo.count() } );
print("db.foo.count() = " + initialCount );
var numDocsShouldBe = initialCount;
var numDocsActuallyInserted = 0;
try_db( function(db) {
    var wr = db.testcontrol.insert( { "_id" : "MAIN", "shouldRun" : 1 } )
    if ( wr.nInserted != 1 ) {
        throw new Error("Error inserting test control document!");
    }
});

var MAX_RETRIES = 100;
var __checkShouldRun = function(checkTries) {
        try {
            return try_db( function(db) {
                var controller = db.testcontrol.findOne( { "_id" : "MAIN" } );
                return controller;
            });
        } catch (error) {
            print("error finding MAIN controldoc");
            printjson(error);
            if ( checkTries > MAX_RETRIES ) {
                throw error;
            }
            print("will retry attempt #"+checkTries);
            return __checkShouldRun(checkTries++);
        }
}

var checkShouldRun = function() {
    var controller = {};
    while ( Object.keys(controller).length===0 ) {
        //printjson(controller);
        controller = __checkShouldRun(0);
        //printjson(controller);
    }
    if ( controller.shouldRun===1 ) {
        return true;
    }
    print("shouldRun != 1 - test will terminate");
    printjson(controller);
    return false;
}

var makeDoc = function() {
    return { "x" : Math.floor(Math.random()*10000), "ts" : new Date() };
}
while ( checkShouldRun() ) {
    
    var insertCall = function(insertTries, doc) { 
        try {
            return try_db( function(db) {
                var result = db.foo.insert( doc );
                return result;
            });
        } catch (error) {
            print("error attempting to insert into 'foo' collection");
            // TODO - this logic will possibly insert the same doc multiple
            // time, we need to check the exact error and also the writeResult
            // the call to insert() may have successfully inserted the document
            // but an error is thrown from like getlasterror (when connecting to 
            // older MongoDB version)
            printjson(error);
            if ( insertTries > MAX_RETRIES ) {
                throw error;
            }
            print("will retry attempt #"+insertTries);
            return insertCall(insertTries++,doc);
        }
    }
    var doc = makeDoc();
    var result = {};
    while ( Object.keys(result).length===0 ) {
        result = insertCall(0, doc);
    }
    numDocsShouldBe++;
    if ( result.writeError ) {
        printjson(result);
    } else {
        numDocsActuallyInserted += result.nInserted
    }
    sleep(1000);    
    if ( numDocsActuallyInserted%60===0 ) {     //every 60 seconds check doc count
        var count = 0;
        try {
            try_db( function(db) {
                count = db.foo.count();
            });
        } catch (error) {
            print("error calling foo.count()");
            printjson(error);
            throw error;
        }
        print("db.foo.count()=" +count +
              " numDocsShouldBe=" + numDocsShouldBe +
              " numDocsActuallyInserted=" + numDocsActuallyInserted);
    }

}

