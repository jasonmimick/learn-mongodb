db = db.getSiblingDB("students");

var p1 = db.runCommand( 
{ "aggregate" : "scores",
    "pipeline" : [ 
    { 
        $match : { 
            $and : [ 
                { "score" : { $gte : 70 } }, 
                { "score" : { $lte : 79 } } 
            ]
        } 
    } , { 
        $group : {
            _id : "$score",
            student : { $addToSet : "$student" }
        }
    } , {
        $unwind : "$student"
    } , { 
        $group : {
            _id : "$student",
            C_score_count : { $sum : 1 }
        }
    } , {
        $match : { C_score_count : { $gte : 2 } }
    } , {
        $group : {
            _id : "$C_score_count",
            students : { $addToSet : "$_id" }
        }
    } 
]});
printjson(p1);


