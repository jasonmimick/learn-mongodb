/* Sample script to setup pre-split collection */

db = db.getSisterDB("test123");

var numShardKeySlots = 9;

var fakeData = function(x) {
    var data = "";
    for (var i=0;i<x;i++) {
        data += Math.random().toString(36).slice(2);
    }
    return data;
}
var getDoc = function(numDataFields, dataSize) {
    var doc = { "i" : Math.floor(Math.random()*numShardKeySlots) };
    for (var i=0;i<numDataFields;i++) {
        doc["data"+i] = fakeData( dataSize )
    }
    return doc;
}
var loadData = function(numDocs, numDataFields, dataSize) {
    for (var i=0;i<numDocs; i++) {
        db.data.insert( getDoc(numDataFields, dataSize) );
        if ( i%1000===0 ) {
            print( db.data.count() + " docs inserted");
        }
    }
}

sh.enableSharding("test123");
db.data.drop();
db.createCollection("data");
db.data.createIndex({"i":1});
sh.shardCollection("test123.data", { "i" : 1 });

for (var i=0;i<numShardKeySlots;i++) {
    var result = db.getSiblingDB("admin").runCommand( 
            { split : "test123.data", middle : { "i" : i } } );
    printjson( result );
}

var shardInfo = db.getSiblingDB("admin").runCommand( { "listShards" : 1 } );
var numShards = shardInfo.shards.length;

for(var i=0;i<numShardKeySlots;i++) {
    var result = db.adminCommand( { "moveChunk" : "test123.data",
                       "find" : { "i" : i },
                       "to" : shardInfo.shards[i%numShards].host } );
    printjson(result);
}

sh.setBalancerState( false );   // this is the whole point, we're pre-split & mirgated
loadData(100000,5,10);
