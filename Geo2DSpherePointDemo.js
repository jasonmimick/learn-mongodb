// Basic Geo2DSphere stuff.
//

// helper
var dump_cursor = function(cur) {
    while ( cur.hasNext() ) {
        printjson( cur.next() );
    }
}

// use a 'geo' db and drop any point collection
db = db.getSiblingDB("geo");
db.point.drop();

// add some docs for cities
db.point.insert({name : "Palo Alto", loc : { type : "Point" , coordinates : [-122.143019,37.441883] } });
db.point.insert({name : "Cupertino", loc : { type : "Point" , coordinates : [-122.032182,37.322998] } });
db.point.insert({name : "San Jose", loc : { type : "Point" , coordinates : [-121.894955,37.339386] } });
db.point.insert({name : "San Francisco", loc : { type : "Point" , coordinates : [-122.419415,37.77493] } });
db.point.insert({name : "Los Angeles", loc : { type : "Point" , coordinates : [-118.243685,34.052234] } });
db.point.insert({name : "Washington, DC", loc : { type : "Point" , coordinates : [-77.036366,38.895112] } });

// index on 'loc'
db.point.ensureIndex({"loc":"2dsphere"});

// do some queries
var closeToCupertino = db.point.find( { "loc" : { 
    $near : { 
        $geometry : { 
            type : "Point" ,
            coordinates : [-122.143019,37.441883] 
        },
        $maxDistance : 20000
    } 
} 
});
print("Places within 20000 'points' from Cupertino");
dump_cursor( closeToCupertino );
print("#Close to Apple HQ = " + closeToCupertino.count());

var eastCoast = db.point.find( { "loc" : {
    $geoWithin : {
        $geometry : {
            type : "Polygon",
            coordinates: [[ 
                [ -71, 60 ],
                [ -71, 15 ],
                [ -80, 15 ],
                [ -80, 60 ],
                [ -71, 60 ]
            ]],
            crs: {
                      type: "name",
                  properties: { name: "urn:x-mongodb:crs:strictwinding:EPSG:4326" }
             }
        }
    }
}
});
print("East coast cities");
dump_cursor( eastCoast );
print("#East coast cities= " + eastCoast.count());
