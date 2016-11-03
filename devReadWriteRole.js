var devReadWriteRole = { "createRole" : "devReadWrite",
    privileges : [
        { resource : { "db" : "test", collection : "" },
          actions : [ "collStats", "find", "insert", "listCollections", "remove", "update" ]
        }, 
        { resource : { "db" : "sample", collection : "" },
          actions : [ "collStats", "find", "insert", "listCollections", "remove", "update" ]
        } 

    ],
    roles : [],
    writeConcern : { "w" : "majority" }
}

db = db.getSiblingDB("admin");

db.runCommand( { dropRole: "devReadWriteRole" } )
db.runCommand( devReadWriteRole );
