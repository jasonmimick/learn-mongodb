/*
 * ValidateIndexes.js
 *
 * Scans multiple nodes, gathers index information,
 * and compares across other nodes.
 *
 * Outputs:
 * 1. IndexValidationReport.<TIMESTAMP>.txt
 *      Human readable report of index discrepancies 
 * 2. IndexValidationFix.<TIMESTAMP>.js
 *      Script meant to run via mongo shell to
 *      actually fix up the index discrepancies
 *
 * Inputs:
 * Set the connection info below
 * NOTE: Wherever you run this from, it needs to be able to connect
 * to the mongod nodes
 *
 * the 'connections' array holds all the host information
 * the 'environmentMap' contains a mapping between different
 *   environments. This is used to check across, for example, 
 *   PROD, DEV and TEST.
 *
 * Usage:
 * $mongo -nodb ValidateIndexes.js > /dev/null
 *
 * To run the generated script:
 * $mongo --nodb 
 */

var checkAllReplSetMembers = true;
var connections = [
    {
        host : "",
        username : "",
        password : "",
        authenticationDatabase : "admin",
        dbsToCheck : [ "" ]
    }
    ,{
        host : "",
        username : "",
        password : "",
        authenticationDatabase : "admin",
        dbsToCheck : [ "" ]
    }
    ,{
        host : "",
        username : "",
        password : "",
        authenticationDatabase : "admin",
        dbsToCheck : [ "" ]
    }
    
];

// map across environments
// the indexes in the primaries for each host will be checked against
// the hosts for each host key
var environmentMap = 
    { "host1" : 
        [ "host2"
         ,"host3"
        ]
      ,"" : 
        [ ""
        ]
    };

var report = [];
var printReport = function(line) { report.push(line); }

var getIndexes = function(connection,database) {
    var out = {}
    out.database = database;
    out.indexes = [];
    connection.getDB(database).getCollectionNames().forEach( function(c) {
        var indexes = connection.getDB(database)[c].getIndexes();
        out.indexes.push( { collection : c, indexes : indexes } );
    });
    return out;
}

var analyzeHost = function(connection,connInfo) {
    var hostInfo = {}
    hostInfo.host = connection.host;
    hostInfo.databases = [];
    try {
        connInfo.dbsToCheck.forEach( function(database) {
            hostInfo.databases.push( getIndexes(connection,database) );
        });
    } catch(error) {
        //print("caught error = " + error);
        hostInfo.error = error;
    }
    return hostInfo;
}

// Could have conflicts in replSet.name
// maintain global map to enforce uniqueness
var replSetNameMap = {};
// Find other members
var checkReplSet = function(connInfo) {
    // need to connect to the 
    var conn = new Mongo(connInfo.host);
    conn.getDB( connInfo.authenticationDatabase ).auth( connInfo.username, connInfo.password );
    var rsInfo = conn.adminCommand({"replSetGetStatus":1});    
    if ( typeof(rsInfo.errmsg) !== 'undefined' ) {  // some error, probably auth
        printReport("Unable to run {replSetGetStatus : 1} on "+
               connInfo.host +"\bError:"+rsInfo.errmsg);
        return [];
    }
    conn.getDB( connInfo.authenticationDatabase ).logout();
    conn = null;
    var replSetInfo = [];
    rsInfo.members.forEach( function(rsMember) {
        if ( rsMember.stateStr==="ARBITER" ) {
            return; /* skip them*/
        }
        var ci = { host : rsMember.name }
        ci.username = connInfo.username;
        ci.password = connInfo.password;
        ci.authenticationDatabase = connInfo.authenticationDatabase;
        ci.dbsToCheck = connInfo.dbsToCheck;
        var i = connectAndCheckHost( ci ); 
        // if this is the primary, check if we've seen this rsInfo.set
        // =replset name before
        if ( rsMember.stateStr==="PRIMARY" ) {
            if ( typeof(replSetNameMap[rsInfo.set]) !== "undefined" ) {
                // we have already seen this replSet!
                replSetNameMap[rsInfo.set]++;   // increment counter
                // flip name
                rsInfo.set = rsInfo.set + "." + replSetNameMap[rsInfo.set];
            } else { 
                // initialize counter
                replSetNameMap[rsInfo.set]=1;
            }
            
        }
        i.replSet = rsInfo.set;  /* use this to correlate members */
        i.stateStr = rsMember.stateStr;
        replSetInfo.push(i);
    });
    return replSetInfo;
}

var connectAndCheckHost = function(connInfo) {
    var hostInfo = {}
    hostInfo.host = connInfo.host;
    hostInfo.databases = [];
    try {
        var conn = new Mongo(connInfo.host)
        conn.getDB( connInfo.authenticationDatabase )
            .auth( connInfo.username, connInfo.password );
        conn.slaveOk=true;
        var hostInfo = analyzeHost(conn,connInfo);
        conn.getDB( connInfo.authenticationDatabase ).logout();
    } catch(error ) {
        hostInfo.error = error;
    }
    return hostInfo;
}

// spin through connections and gather data
var output = { "report" : "IndexAnalysis", "ts" : new Date() };
output.hosts = [];
for(var i=0;i<connections.length;i++) {
    var connInfo = connections[i];
    try {
        if ( checkAllReplSetMembers ) {
            var replInfo = checkReplSet(connInfo );
            output.hosts.push.apply( output.hosts, replInfo );
        } else {
            var hostInfo = connectAndCheckHost(connInfo);
            output.hosts.push( hostInfo );
        }

    } catch(error) {
        output.hosts.push( { host : connInfo.host, error : error } );
    }
}

// output has all the index info
//printjson( output );

/*
 * Now the fun part - if we have replSet info
 * compare across and find any missing
 */
if ( !checkAllReplSetMembers ) {
    quit();
}

// global - map of hosts which need indexes fixed
var fixScripts = {};

var compareIndexes = function(i1,i2,i2Host) {
    if ( typeof(i2)=='undefined' ) { return; }
    // foreach indexes in i1, check there is an index in i2
    // with same 'name'
    i1.indexes.forEach( function(i) {
        var jj=i2.indexes.filter( function(ii) { return ii.name==i.name } );
        var gotName = i2.indexes.filter( function(ii) { return ii.name===i.name } ).length > 0;
        if ( !gotName ) {
            printReport("\tMISSING: " + i.name);
            var db=i.ns.split('.')[0];
            var coll = i.ns.split('.')[1];
            var s = "db.getSiblingDB(\""+db+"\")[\""+coll+"\"].createIndex(";
            var opts = { background : true, name : i.name };
            s += JSON.stringify( i.key ) + "," + JSON.stringify(opts) +");";
            if ( typeof(fixScripts[i2Host.host]) == 'undefined' ) {
                // first time we've seen this host
                fixScripts[i2Host.host] = []; 
            } 
            fixScripts[i2Host.host].push( s );
        }
    });
}

// return the indexes for a given namespace
// from the passed in host
var indexesForNamespace = function(database,coll,host) {
    return host.databases.filter( function(h) { return h.database===database})[0]
                         .indexes.filter( function(i) { return i.collection===coll; } )[0];
}

var compareDBIndexes = function(database,primary,secondaries) {
    var primaryCollections = primary.databases.filter( function(h) { 
        return h.database===database; } )[0]
        .indexes.map( function(i) { return i.collection; });
    primaryCollections.forEach( function(coll) {
        var pIndexes = indexesForNamespace(database,coll,primary);
        secondaries.forEach( function(secondary) {
            printReport(primary.host +"\t" + secondary.host + "\t"  +database +"." + coll);
            var sIndexes = indexesForNamespace(database,coll,secondary);
            compareIndexes(pIndexes,sIndexes,secondary);
        });
    });
}

// what replSet's are in the output
var replSets = output.hosts.map( function(host) { return host.replSet } )
                     .filter( function(val,idx,self) { 
                         return self.indexOf(val) === idx; 
                     });
// rs0 = { primary : host, secondary : host, ... }
printReport("MongoDB Index Validation:"+(new Date()));
printReport("Format:source\ttarget\tdb");
printReport("Section:ReplicaSet index validation");
replSets.forEach( function(replSet) {
    var setHosts = output.hosts.filter( function(host) { return host.replSet===replSet; });
    var primary = setHosts.filter( function(h) { return h.stateStr==="PRIMARY" } );
    if ( primary.length!=1 ) {
        printReport("ERROR: No primary found for replSet " + replSet);
        return;
    } else {
        primary = primary[0];
    }
    var secondaries = setHosts.filter( function(h) { 
        if ( typeof(h.error) !== 'undefined' ) {    // got error, move on
            return false;
        }
        return (h.stateStr==="SECONDARY");
    } );
    primary.databases.forEach( function(database) {
        compareDBIndexes(database.database,primary,secondaries);
    });
});

// If we need to check across environments
if ( Object.keys( environmentMap ).length == 0 ) {
    quit();
}

printReport("\nSection:Cross-environment index validation");
Object.keys( environmentMap ).forEach( function( source ) {

    sget = output.hosts.filter( function(s) { return s.host===source } )[0];
    environmentMap[ source ].forEach( function( target ) {
        // got target name, get target dataer
        tget = output.hosts.filter( function(h) { return h.host===target } );
        if ( tget.length > 1 ) {
            throw "Invalid environmentMap. More than one host called " + target + "found.";
        }
        sget.databases.forEach( function(database) {
            compareDBIndexes(database.database,sget,tget);
        });
    });

});

// write out fix script.
var ts = (new Date().toISOString());
var fix_script = "IndexValidationFix."+ts+".js";
Object.keys( fixScripts ).forEach( function(hostToFix) {
    // add connection info
    var connInfo = connections.filter( function(h) { return h.host === hostToFix } )[0]; 
    var connScript = "// Fixing indexes for " + connInfo.host + "\n";
    connScript+="var conn = new Mongo(\""+connInfo.host+"\");\n"; 
    connScript+="conn.getDB( \""+connInfo.authenticationDatabase +"\")";
    connScript+=".auth( \""+connInfo.username+"\",\""+connInfo.password+"\" );\n";
    connScript+="conn.slaveOk=true;\n"
    runProgram("sh","-c","echo '"+connScript+"' >> " + fix_script);
    // add createIndex commands
    fixScripts[hostToFix].forEach( function(s) {
        runProgram("sh","-c","echo '"+s+"' >> " + fix_script );
    });
    
    connScript = "conn.getDB( \""+connInfo.authenticationDatabase+"\").logout();\n";
    connScript += "// End " + connInfo.host + "\n";
    runProgram("sh","-c","echo '"+connScript+"' >> " + fix_script);

});
var reportOutput = "IndexValidationReport."+ts+".txt";
report.forEach( function(line) {
    run("bash","-c","echo '"+line+"' >> " + reportOutput);
});
