db = db.getSiblingDB("sample");

// For all failed inspections, set fine to 100
db.inspections.updateMany(
	{ "result" : "Fail" },
	{ "$set" : { "fine" : 100 } } );

// update all inspections failed in city of ROSEDALE
// raising the fine by 150
db.inspections.updateMany( 
	{ "address.city" : "ROSEDALE", "result" : "Fail" },
	{ "$inc" : { "fine" : 150 } } );

// give pass to MONGODB
// set result to "AWESOME"

db.inspections.updateOne( 
	{ "business_name" : "MONGODB",
	  "address" : { "city" : "New York",
			"zip" : 10036,
			"street" : "43",
			"number" : 229 } },
	{ "$set" : { "result" : "AWESOME" } },
	{ "upsert" : true } );

// updating array elements
db.product_metrics.insertOne(
   { name: "backpack",
     purchasesPast7Days: [ 0, 0, 0, 0, 0, 0, 0] });

db.product_metrics.updateOne( 
	{ "name" : "backpack" },
	{ "$inc" : { "purchasePast7Days.4" : 200 } } );

