var db = db.getSiblingDB("test");

/* Create capped collection
 * insert 1,000,000 documents
 * with "ts"=new Timestamp()
 * query for last 100 ms both with
 * and without oplogReplay option
 * and see which is faster.
 */

//var NUM_DOCS = 100000; //#00;

var buildStream = function(NUM_DOCS) {
    print("Building stream of " + NUM_DOCS + " documents");
   if ( db.stream ) { db.stream.drop() }
    var bulk = db.stream.initializeUnorderedBulkOp();

    /* each doc ~45kb, we'll pad to 60kb */
    db.createCollection("stream", { "capped" : true,
                                "size" : (NUM_DOCS*60),  
                                "max"  : NUM_DOCS } );
    var result = {};
    for (var i=0;i<NUM_DOCS;i++) {
        bulk.insert( { "i" : i, "ts" : new Timestamp() } );
        if ( i%1000 ) {
            result = bulk.execute();
            bulk = db.stream.initializeUnorderedBulkOp();
        }
    }
    result = bulk.execute();
    print("Build complete.");


};

var test = function(limit,oplogReplay,last) {
    var since = last.ts.t - 10;
    var sinceTS = new Timestamp(since,0);
    var cursor = db.stream.find( { "ts" : { "$gte" : sinceTS } } ).tailable(true);
    if ( limit != "*" ) {
        cursor.limit(limit);
    }
    var msg = "cursor.oplogReplay(false)";
    if ( oplogReplay ) {
        cursor.oplogReplay(true);
        msg = "cursor.oplogReplay(true) ";
    }

    start = new Date().getTime();
    //while ( cursor.hasNext() ) { cursor.next() };
    var count = cursor.itcount();
    var rt = ((new Date().getTime())-start);
    print(msg + " [count="+count+"]" + 
            " [limit="+ limit + "] [runtime=" + rt +"ms]");
    return rt;
}


//if ( db.xxx ) { db.xxx.drop() }
//db.xxx.insert({"x":new Timestamp()});
//var now = db.xxx.findOne().x;
var last = db.stream.find().sort({$natural:-1}).limit(1).next();
printjson(last);

//buildStream(3000000);

var percentFaster = function(smaller,bigger) {
    return ( 1 - (smaller/bigger) )*100;
}
for (var limit=10;limit<10000000;limit=limit*10) {
    var rt = test(limit,false,last);
    var rt1 = test(limit,true,last);
    print("oplogReplay: " + percentFaster(rt1,rt) + "% faster [limit="+limit+"]");
}

var rt = test("*",false,last);
var rt1 = test("*",true,last);
print("oplogReplay: " + percentFaster(rt1,rt) + "% faster [limit="+limit+"]");

