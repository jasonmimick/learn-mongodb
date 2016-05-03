
var consumer = function(i,mongo) {
    var db = mongo.getDB("test");
    print("consumer:"+i);
    var cursor = db.events.find({},{timeout:false}).tailable({isAwaitData:true}).noCursorTimeout();
    while (true) {
        while ( cursor.hasNext() ) {
        printjson({ i:i, "o": cursor.next()});
        }
        // the shell may timeout, so if we're here we can out
        // chill a sec and continue
        sleep(500);
    }
}

//consumer(i,mongo);

