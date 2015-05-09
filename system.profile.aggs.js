db = db.getSiblingDB("agg");

// insert data


var results = db.system.profile.aggregate( 
        [ { $group : 
            { "_id" : "$op", 
              "count" : { $sum : 1 },  
              "max response time" : { $max : "$millis" }, 
              "min response time" : { $min : "$millis" } 
            } 
        } ] 
);

while (results.hasNext()) {
    printjson(results.next());
}

