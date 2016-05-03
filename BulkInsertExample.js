db = db.getSiblingDB("test");

db.bulkdemo.drop();

var bulk = db.bulkdemo.initializeUnorderedBulkOp()
for (var i=0;i<1000;i++) {
    bulk.insert( { i : i } );
}
var bwr = bulk.execute();
printjson(bwr);
