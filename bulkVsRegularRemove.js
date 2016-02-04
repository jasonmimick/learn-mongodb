db = db.getSiblingDB('test');

var collections = [ "foo", "foo2", "bar", "bar2"];

collections.forEach( function(coll) {
    db.getCollection(coll).drop();
    db.createCollection(coll);
    db.getCollection(coll).createIndex( { "x" : 1 });
});

var loadData = function() {
    
    for (var i=0;i<10000;i++) {
        var x = Math.floor(Math.random()*3);
        collections.forEach( function(coll) {
            db.getCollection(coll).insert({_id:i, "x" : x});
        });
    }
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
