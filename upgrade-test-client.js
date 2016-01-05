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
var connectionString = "mongodb://ec2-54-172-76-252.compute-1.amazonaws.com:27017," +
                        "ec2-54-173-184-115.compute-1.amazonaws.com:27017," +
                        "ec2-54-173-185-120.compute-1.amazonaws.com/?" +
                        "replicaSet=FLUFFY&w=majority&readPreference=primaryPreferred";

connectionString = "mongodb://ec2-52-91-1-26.compute-1.amazonaws.com:27017," +
                   "ec2-52-91-1-26.compute-1.amazonaws.com:27018/?" +
                   "w=majority&readPreference=primaryPreferred";

var connection = new Mongo( connectionString );

var db = connection.getDB("test");

//db.foo.drop();
db.testcontrol.drop();

print("db.foo.count()=" + db.foo.count() );
var numDocsShouldBe = 0;
var numDocsActuallyInserted = 0;
var wr = db.testcontrol.insert( { "_id" : "MAIN", "shouldRun" : 1 } )
if ( wr.nInserted != 1 ) {
    throw new Error("Error inserting test control document!");
}

var MAX_RETRIES = 100;
var __checkShouldRun = function(checkTries) {
        try {
            var controller = db.testcontrol.findOne( { "_id" : "MAIN" } );
            return controller;
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
        controller = __checkShouldRun(0);
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
            var result = db.foo.insert( doc );
            return result;
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
        try {
            var count = db.foo.count();
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

