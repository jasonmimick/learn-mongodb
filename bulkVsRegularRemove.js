//var auditDB = db.getSiblingDB('audit');

db.foo.drop();
db.bar.drop();
db.createCollection("foo");
db.createCollection("bar");
db.foo.createIndex({"x":1});
db.bar.createIndex({"x":1});
var loadData = function() {
    for (var i=0;i<10000;i++) {
        var x = Math.floor(Math.random()*3);
        db.foo.insert({_id:i, "x" : x});
        db.bar.insert({_id:i, "x" : x});
    }
    db.foo.copyTo("foo2");
    db.bar.copyTo("bar2");
}
loadData();
var query = { "x" : Math.floor(Math.random()*3) };
printjson(query);


var totalCount = db.foo.find(query).count();
print("totalCount="+totalCount);


var bulkDelete = function() {
    print("bulkDelete");
    var count = 0;

    var fooCursor = db.foo.find(query);
    var fooBulk = db.foo.initializeUnorderedBulkOp();
    var barBulk = db.bar.initializeUnorderedBulkOp();

    while ( fooCursor.hasNext() ) {
        var doc = fooCursor.next();
        fooBulk.find( { "_id" : doc._id } ).remove();
        barBulk.find( { "_id" : doc._id } ).remove();
        //print( doc._id );
        //print(((++count / totalCount) * 100) + "% Completed");
    }


    var result = fooBulk.execute();
    printjson(result);
    result = barBulk.execute();
    printjson(result);

}

var regularDelete = function() {
    print("regularDelete");
    var count = 0;
    db.foo2.find(query).forEach( function(doc) {
        db.foo2.remove( { "_id" : doc._id } );
        db.bar2.remove( { "_id" : doc._id } );
        //print( doc._id );
        //print(((++count / totalCount) * 100) + "% Completed");

    });

}

var timeFunction = function(f) {
    var start = (new Date()).getTime();
    f();
    var runtime =(new Date().getTime()-start); 
    print( "Runtime: " + runtime );
    return runtime;
}

var btime = timeFunction(bulkDelete);

var rtime = timeFunction(regularDelete);

print( "Bulk is " + (rtime/btime)*100 + "% faster" );
