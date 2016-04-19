
var db = db.getSiblingDB("test");
db.foo.drop();
var bulk = db.foo.initializeUnorderedBulkOp();

var BATCH_SIZE=500;
var ids = [ "HW9QR4", "AJPN6L", "C4NG2J", "FTNYEN", "FEYS5J" ]; //....
// If you want to code-generate the list of ids,
// then you can generate a file with
// var ids = [....]
// and then call load("generatedIds.js")
// in this script to setup the 'ids' variable

var build_mock_data = function() {
   ids.forEach( function(id) { 
       print("inserting id="+id);
       db.foo.insert( { "_id":id, "PassengerNameRecord" : { "Segments" : [1,2,3] } });
    });
};

build_mock_data();

var counter = 1;
ids.forEach( function(id) {
    bulk.find({"_id" : id, 'PassengerNameRecord.MqEnqueueDateTime': {$exists: false}}) 
        .update({"$set" : { 'PassengerNameRecord.Segments' : [] }});
    
    if ( ( counter++ % BATCH_SIZE ) === 0 ) {
        var result = bulk.execute();
        printjson(result);
        if ( result.getEriteErrorCount() > 0)  {
            print("ERROR");
            printjson(result);
        }
        bulk = db.foo.initializeUnorderedBulkOp();

    }
});
var result = bulk.execute();
        
if ( result.getWriteErrorCount() > 0 ) {
    print("ERROR");
    printjson(result);
}


