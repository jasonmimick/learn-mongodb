/*
 * ValidateIndexes.js
 *
 * Scans multiple nodes, gathers index information,
 * and compares across other nodes.
 *
 * Outputs:
 * Report of indexes.
 *
 * Inputs:
 * Set the connection info below
 * NOTE: Wherever you run this from, it needs to be able to connect
 * to the mongod nodes
 *
 * the 'connections' array holds all the host information
 *
 * Usage:
 * $mongo -nodb IndexReport.js 
 *
 */

var checkAllReplSetMembers = false;
var connections = [
    {
        host : "localhost:27000",
        username : "",
        password : "",
        authenticationDatabase : "",
        dbsToCheck : [ "test" ]
    }
    ,{
        host : "localhost:27001",
        username : "",
        password : "",
        authenticationDatabase : "",
        dbsToCheck : [ "test" ]
    }
    ,{
        host : "localhost:27002",
        username : "user",
        password : "password",
        authenticationDatabase : "admin",
        dbsToCheck : [ "test" ]
    } 
    
];

var outputReport = function(output) {
    print(output.report + "\t" + output.ts + "\n");
    output.hosts.forEach( function(host) {
        print("Host: " + host.host );
        host.databases.forEach( function( database ) {
            database.indexes.forEach( function(coll) {
                var numIndexes = coll.indexes.length;
                print( "Collection: " + database.database + "." + coll.collection
                        + " " + numIndexes + " indexes");
                coll.indexes.forEach( function(idx) {
                    print( "name: " +
                           ("'"+idx.name+"'").pad( 20, true ) 
                           + " key: " + tojson(idx.key) );
                });
                print();
            });
            print();
        });
    });
}
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
        hostInfo.error = error;
    }
    return hostInfo;
}

var connectAndCheckHost = function(connInfo) {
    var hostInfo = {}
    hostInfo.host = connInfo.host;
    hostInfo.databases = [];
    try {
        var conn = new Mongo(connInfo.host);
        var authOn = connInfo.username!="" && connInfo.password!="";
        if ( authOn ) {
            conn.getDB( connInfo.authenticationDatabase )
                .auth( connInfo.username, connInfo.password );
        }
        conn.slaveOk=true;
        var hostInfo = analyzeHost(conn,connInfo);
        if ( authOn ) {
            conn.getDB( connInfo.authenticationDatabase ).logout();
        }
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
        var hostInfo = connectAndCheckHost(connInfo);
        output.hosts.push( hostInfo );

    } catch(error) {
        output.hosts.push( { host : connInfo.host, error : error + 3} );
    }
}

outputReport( output );

