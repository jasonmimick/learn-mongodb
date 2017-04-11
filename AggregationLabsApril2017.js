// Lab 6.3
print("--- MongoDB Training Lab 6.3 & 6.4 ---");
print("\tApril 11,2017");

// Find the name of the person who made the most
// comments on a blog
print("\n----\nWho made the most blog comments?");
db = db.getSiblingDB("blog");

var unwind = { "$unwind" : "$comments" };
var group = { "$group" : { "_id" : "$comments.author",
                           "num_comments" : { "$sum" : 1 } } };

var sort = { "$sort" : { "num_comments" : -1 } };
var limit = { "$limit" : 1 };

var result = db.posts.aggregate([unwind,group,sort,limit]);
result.shellPrint(); 


// Repeated Aggregation Stages
// Consider together cities in the states 
// of California (CA) and New York (NY) with 
// populations over 25,000. Calculate the 
// average population of this sample of cities.
print("\n----\nAverage population of cities in CA or NY with \
 more than 25,000 people");
db = db.getSiblingDB("sample");

var match = { "$match" : { "state" : 
				{ "$in" : [ "NY", "CA" ] } } };
var group = { "$group" : { "_id" : { "city" : "$city",
                                     "st" : "$state" },
                           "pop" : { "$sum" : "$pop" } } };

var match = { "$match" : { "pop" : { "$gt" : 25000 } } };

var group2 = { "$group" : { "_id" : "average_population",
			    "value" : { "$avg" : "$pop" } } };

agg = [ match, group, match, group2 ];
var result = db.zips.aggregate( agg ); 
result.shellPrint();


// Exercise: Projection
// Calculate the total number of people 
// who live in a zip code in the US where 
// the city starts with a digit.
print("\n----\nTotal number of people living in a\
 city which starts with a digit");
var match = { "$match" : { "city" : 
				{ "$regex" : /^[0-9]/ } } };

var group = { "$group" : { "_id" : "total_pop",
 			   "population" : { "$sum" : "$pop" } } };

var agg = [ match, group ];
var result = db.zips.aggregate(agg);
result.shellPrint();

// Exercise: Descriptive Statistics
// From the grades collection, find the class
// with the highest average student performace
// on exams.
// First calculate the average score of each student
// in each class. Then determine the average
// class exam score using these values.
print("\n----\nHighest average of average exam score by class");

var unwind = { "$unwind" : "$scores" };
var match = { "$match" : { "scores.type" : "exam" } };
var group = { "$group" : { "_id" : { "class" : "$class_id",
				   "student" : "$student_id" },
			 "ave_exam_score" : {
				"$avg" : "$scores.score" } }
	    };
var group2 = { "$group" : { "_id" : "$_id.class",
			"ave_ave_exam_score" : {
				"$avg" : "$ave_exam_score" } }
	    };

var sort = { "$sort" : {  "ave_ave_exam_score" : -1 } };
var limit = { "$limit" : 1 };
var agg = [ unwind, match, group, group2, sort, limit ];
var results = db.grades.aggregate( agg );
results.shellPrint();

// 6.4 Lab: Using $graphLookup
// Exercise: Finding Airline Routes
// use $graphLookup to find Delta Airlines
// to find all routes from JFK to BOI

print("\n----\n $graphLookup\n1-stop routes from JFK to BOI");
var db = db.getSiblingDB("air");

var match = { "$match" : { "airline.name" : "Delta Air Lines",
			   "src_airport" : "JFK" } };

var graph = { "$graphLookup" : { 
	"from" : "routes",
	"startWith" : "$dst_airport",
	"connectFromField" : "dst_airport",
	"connectToField" : "src_airport",
	"as" : "connections",
	"maxDepth" : 0,
	"restrictSearchWithMatch" : { "dst_airport" : "BOI" }

} };
var unwind = { "$unwind" : "$connections" };

var project = { "$project" : {
		"_id" : 0,
		"start" : "$src_airport",
		/*"connection" : "dst_airport" is same! */
		"connection" : "$connections.src_airport",
		"end" : "$connections.dst_airport" }
};

var agg = [ match, graph, unwind, project ];
var result = db.routes.aggregate( agg );
result.shellPrint(); 

var count = { "$group" : 
		{ "_id" : "How many ways can you get to BOI from JFK",
		  "count" : { "$sum" : 1 } }
};
agg.push(count);
var result = db.routes.aggregate( agg );
result.shellPrint(); 


