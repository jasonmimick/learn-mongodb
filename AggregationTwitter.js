db = db.getSiblingDB("sample")
var cursor = db.tweets.aggregate( [ 
    { $group : { 
        _id : "$user.screen_name", 
        "tweets" : { $sum : 1 } 
        } 
    }, { 
      $project : { 
          "tweeter" : "$_id", 
          "tweets" : "$tweets", 
        } 
    }, { 
       $match : { 
           "tweets" : { $gte : 2 } 
        } 
    }, { 
       $group : { 
           "_id" : "$tweets", 
           "tweeters" : { $sum : 1 } 
        } 
    }, { 
        $project : { 
            "tweets" : "$_id", 
            "tweeters" : "$tweeters", 
            "_id" : 0 
        } 
    }, { 
        $sort : { 
            "tweets" : -1 
        } 
    } 
])
while ( cursor.hasNext() ) { printjson(cursor.next()) }
