
var data = cat( ls()[0] ).split("\n");

data.forEach( function( line ) { 
    if ( line=="" ) { 
        return; 
    } 
    var q = line.split(" ").splice(1).join(" "); 
    db.quotes.en.insert( { "quote" : q  }); 
} );

