db = db.getSiblingDB("test");

var coll = "events";                // name your collection
var collSizeMB = 10;                // max size - must be capped for tailing!
var stopCollection = "events.stop"  // add 1 record to this collection to stop tailing
var loadSize = 10000;               // num docs to insert for tailer

// clean out any existing stuff
db.getCollection( coll ).drop();
db.getCollection( stopCollection ).drop();

// Must do! - create the collection capped and of fixed size 
db.createCollection("events", { capped : true, size : (collSizeMB*1024*1024) } );

/*
var tailerShell = startParallelShell( function() {
    // Here is the tailable cursor - note the options!
    print("tailerShell started");
    db = db.getSiblingDB("test");
    var tailer = db.events.find().addOption( DBQuery.Option.tailable )
                             .addOption( DBQuery.Option.awaitData )
                             .addOption( DBQuery.Option.noTimeout );
    while ( tailer.hasNext() ) { 
        printjson( tailer.next() ); 
        //if ( db[stopCollection].count() > 0 ) { 
        //    break; 
        //} 
    }
    print("tailerShell done");
});
*/

//var loaderShell = startParallelShell( function() {
//    print("loaderShell started");
    db = db.getSiblingDB("test");
    for (var i=0;i< 100 ;i++) { 
        db.getCollection( 'events' ).save( 
            { "i" : i, "e" : Math.floor( Math.random() * 10000 ) } );
    }
    print("loaderShell done");
//});

//loaderShell(loadSize,coll);
sleep(3000);

//tailerShell();
// set MongoDB cursor options
var cursorOptions = {
   tailable: true,
   awaitdata: true };
       //numberOfRetries: -1
//};
/*
var tailer = db.events.find().addOption( DBQuery.Option.tailable )
                             .addOption( DBQuery.Option.awaitData )
                             .addOption( DBQuery.Option.noTimeout );
*/
var tailer = db.events.find({},cursorOptions);
while ( tailer.hasNext() ) { 
    printjson( tailer.next() ); 
    //if ( db[stopCollection].count() > 0 ) { 
    //    break; 
    //} 
}

