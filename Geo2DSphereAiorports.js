// Airports Geo2DSphere stuff.
//

// helper
var dump_cursor = function(cur) {
    while ( cur.hasNext() ) {
        printjson( cur.next() );
    }
}

// use a 'geo' db and drop any point collection
db = db.getSiblingDB("travel");
db.airports.drop();

var airports = [
    { "_id" : "LaGuardia", "location" : { "type" : "Point", coordinates : [40.7772, -73.8726] } },
    { "name" 


db.point.insert({name : "Palo Alto", loc : { type : "Point" , coordinates : [-122.143019,37.441883] } });

