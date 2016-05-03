db = db.getSiblingDB("test");

// create some docs with 
// array of ints
for (var i=0;i<100;i++) {
    var numInts = Math.floor( Math.random() * 10 );
    var data = [];
    for (var j=0;j<numInts;j++) {
        data.push( Math.floor( Math.random() * 10 ));
    }
    db.pull.insert( { data : data } );
}


