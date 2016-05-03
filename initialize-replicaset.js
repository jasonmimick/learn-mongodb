/*
* Generated script to initialize and configure a replica
* set to use FQDN's
* Must generate 'hosts' array with host:port's of the members
*
* *NOTE* this should be run from the FIRST host in the 
* hosts array!
*/

var hosts = [ "statrad-test.df2r030ykmxujk4j15f21p43cg.bx.internal.cloudapp.net:27017"
	     ,"statrad-test.df2r030ykmxujk4j15f21p43cg.bx.internal.cloudapp.net:27018"
	     ,"statrad-test.df2r030ykmxujk4j15f21p43cg.bx.internal.cloudapp.net:27019" 
];

db=db.getSiblingDB('admin');
var result = rs.initiate();
if ( result.ok != 1 ) {
	print("ERROR: Unable to initiate replica set.");
	printjson(result)
}

// make sure initiate is complete
load("check-replicaset-health.js"); 
var ok = checkReplicaSetHealth(true);
if ( !ok ) {
	print("ERROR: rs.initiate() failed.");
}

// create users
db.createUser({user:'nucleus', roles: ['root'], pwd: 'hF7NAEFig7M8dBkhk2CbJi'});
db.createUser({user:'oplog', roles: [{role: 'read', db: 'local'}], pwd: 'He2CljbmDmc09Be0IfBmij'});

// configure replica set to use FQDN's

var config = rs.conf();
config.members[0].host=hosts[0]
for(var i=1;i<hosts.length;i++) {
	config.members[i] = { "_id" : i, "host" : hosts[i] }
}

var result = rs.reconfig(config)
if ( result.ok != 1 ) {
	print("ERROR: Unable to initialize replica set.");
	printjson(result);
} else {
	print("Replica set initialization complete.");
}

// double check healthy status 
checkReplicaSetHealth(true);



