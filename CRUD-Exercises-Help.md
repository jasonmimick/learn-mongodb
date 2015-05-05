```
Load sampledata.zip per workbook

use sample


How many scores are there?
db.scores.count()  // note 3000

What are the different “kind”’s of scores and how many scores does each student have?
db.scores.findOne() // note how student is “id”
db.scores.find( { “student” : 0 } ) // note 3 scores, quiz/essay/exam
db.scores.find( { “type” : “exam” } ) // note 1000
db.scores.find( { “type” : “quiz” } ) // note 1000
db.scores.find( { “test” : “essay” } ) // note 1000
...therefore must be 3 types

How many students got at least a 90 on their exam?
> db.scores.find( { "kind" : "exam", "score" : { $gte : 90 } } ).count()
201

How many students got less than a 60 on their quiz?
> db.scores.find( { "kind" : "quiz", "score" : { $lt : 60 } } ).count()
196
> db.scores.find( { "kind" : "quiz", "score" : { $lte : 60 } } ).count()
213

> use students
switched to db students
> var cursor = db.scores.find()
> while ( cursor.hasNext() ) {
... var doc = cursor.next();
... db.temp.students.insert(doc);
... }

Insert some data into documents with array’s and do some queries:
> for (var i=0;i<100;i++) {
... var tags = [];
... var numTags = Math.floor(Math.random(1)*10);
... for (var j=0;j<numTags;j++) {
...   tags.push( Math.floor(Math.random(1)*100).toString(36) )
... }
... db.nums.insert( { _id : i, tags : tags } )
... }


Field Order Embedded Docs
For example,
> db.apples.find()
{ "_id" : "red delicious", "tags" : { "color" : "red", "taste" : "mildly tart" } }
{ "_id" : "honeycrisp", "tags" : { "color" : "green", "taste" : "sweet-tart" } }
{ "_id" : "empire", "tags" : { "taste" : "sweet-tart", "color" : "green" } }

​3 apples, the honeycrisp and empire tag's are logically the same but in different order.

If you try:

> db.apples.find( { "tags" : { "color" : "green", "taste" : "sweet-tart" } } )
{ "_id" : "honeycrisp", "tags" : { "color" : "green", "taste" : "sweet-tart" } }

You only get the embedded doc which matches in the exact order.

To do a more "logical match" you can use the dot-syntax to look inside the embedded document and match values like this,

> db.apples.find( { "tags.color" : "green", "tags.taste" : "sweet-tart" } )
{ "_id" : "honeycrisp", "tags" : { "color" : "green", "taste" : "sweet-tart" } }
{ "_id" : "empire", "tags" : { "taste" : "sweet-tart", "color" : "green" } }

So, to get around this use the dot-syntax. More info here​ if you are interested.






$elemMatch
> db.elems.find()
{ "_id" : 1, "a" : [ { "b" : 1, "c" : 2 }, { "b" : 3, "c" : 4 } ] }
{ "_id" : 2, "a" : [ { "b" : 1, "c" : 4 }, { "b" : 5, "c" : 6 } ] }

> db.elems.find( { "a.b" : 1, "a.c" : 4 } )
{ "_id" : 1, "a" : [ { "b" : 1, "c" : 2 }, { "b" : 3, "c" : 4 } ] }
{ "_id" : 2, "a" : [ { "b" : 1, "c" : 4 }, { "b" : 5, "c" : 6 } ] }

Huh? I wanted “a” = { “b”:1,”c”:4 } and did not get that.
Use $elemMatch - operates on arrays, and ensures at least one element matches all the selection criteria
> db.elems.find( { "a" : { "$elemMatch" :  { "b" : 1, "c" : 4 }  } })
{ "_id" : 2, "a" : [ { "b" : 1, "c" : 4 }, { "b" : 5, "c" : 6 } ] }


Aggregation

What is and which student got the highest exam score and the lowest quiz score?

> db.scores.aggregate( [ { $group : { _id : "$kind", max : { $max : "$score" }, min : { $min : "$score" } } } ] )
{ "_id" : "exam", "max" : 99, "min" : 50 }
{ "_id" : "essay", "max" : 99, "min" : 50 }
{ "_id" : "quiz", "max" : 99, "min" : 50 }

but who??

var maxOrMin = 1;
db.scores.aggregate( [
{
  $group : {
    _id : { kind : "$kind", "score" : "$score" },
    student : { "$addToSet" : "$student" }
  }
},
{
  $sort : { "_id.score" : maxOrMin }
},
{
  $limit : 1
}
]);
maxOrMin = -1;
db.scores.aggregate( [
{
  $group : {
    _id : { kind : "$kind", "score" : "$score" },
    student : { "$addToSet" : "$student" }
  }
},
{
  $sort : { "_id.score" : maxOrMin }
},
{
  $limit : 1
}
]);


/// modify this to just return the “first set” of max or min.
db.scores.aggregate( [ { $group : { "_id" : { "kind" : "$kind", "score" : "$score" }, "student" : { $addToSet : "$student" } } }, { $project : { "_id" : "$_id", "student" : { $size : "$student"} } }, { $sort : { "_id.score" : -1 }}, { $group : { "_id" : "$_id", "student" : { $first : "$student" }}  }] )

// store # of kinds in a variable??
~/work/MaxScoreStudentCount.js
db = db.getSiblingDB("training");

var numKinds = db.scores.distinct("kind").length;
// the 'aggregate' command returns a cursor
var p1 = db.runCommand(
    { "aggregate" : "scores",
      "pipeline" : [
    { $group : {
        "_id" : { "kind" : "$kind", "score" : "$score" },
        "student" : { $addToSet : "$student" },
        }
    }, {
      $project : {
        "_id" : "$_id",
        "student_count" : { $size : "$student"}
        }
    }, {
      $sort : { "_id.score" : -1 }
    }, {
      $limit : numKinds
    }
]});

printjson(p1);

$~/mongodbs/mongodb-osx-x86_64-3.0.1/bin/mongo MaxScoreStudentCount.js










$match & $unwind

$ ~/mongodbs/mongodb-osx-x86_64-3.0.1/bin/mongo training MatchCStudents.js
// aggregation which will find “C” students and the organize the results based upon how many “C” scores they got.

db = db.getSiblingDB("training");

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
    }, {
        $group : {
            _id : "$score",
            student : { $addToSet : "$student" }
        }
    }, {
        $unwind : "$student"
    }, {
        $group : {
            _id : "$student",
            C_score_count : { $sum : 1 }
        }
    }, {
        $match : { C_score_count : 3 }
    }, {
        $group : {
            _id : "$C_score_count",
            students : { $addToSet : "$_id" }
        }
    }
]});
printjson(p1);

Install as Windows Service
http://docs.mongodb.org/manual/tutorial/install-mongodb-on-windows/
GeoSpatial

http://tugdualgrall.blogspot.com/2014/08/introduction-to-mongodb-geospatial.html


http://www.fcc.gov/encyclopedia/degrees-minutes-seconds-tofrom-decimal-degrees

http://www.mongodb.com/blog/post/mongodb-30-features-big-polygon

http://www.satsig.net/lat_long.htm
http://docs.mongodb.org/manual/reference/operator/query/geoWithin/

Geo2DSpherePointDemo.js

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
        }
    }
}
});
print("East coast cities");
dump_cursor( eastCoast );
print("#East coast cities= " + eastCoast.count());


-----output-----
$ ~/mongodbs/mongodb-osx-x86_64-3.0.1/bin/mongo geo Geo2DSpherePointDemo.js
MongoDB shell version: 3.0.1
connecting to: geo
Places within 20000 'points' from Cupertino
{
	"_id" : ObjectId("5525eff36ee278be7844b3e5"),
	"name" : "Palo Alto",
	"loc" : {
		"type" : "Point",
		"coordinates" : [
			-122.143019,
			37.441883
		]
	}
}
{
	"_id" : ObjectId("5525eff36ee278be7844b3e6"),
	"name" : "Cupertino",
	"loc" : {
		"type" : "Point",
		"coordinates" : [
			-122.032182,
			37.322998
		]
	}
}
#Close to Apple HQ = 2
East coast cities
{
	"_id" : ObjectId("5525eff36ee278be7844b3ea"),
	"name" : "Washington, DC",
	"loc" : {
		"type" : "Point",
		"coordinates" : [
			-77.036366,
			38.895112
		]
	}
}
#East coast cities= 1

```
