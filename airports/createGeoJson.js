db = db.getSiblingDB("test");

var cursor = db.airports.raw.find();
db.airports.drop();

var convertDMSToDecimal = function(dms) {
    var parts = dms.split('.');
    var degrees = parts[0];
    var minutes = parts[1];
    var seconds = parts[2].substr(0,parts[2].length-1);
    var direction = dms.substr(dms.length-1);
    print("degrees="+degrees+" minutes="+minutes+" seconds="+seconds+" direction="+direction);
    var needToNegate = (direction == "W") || (direction == "S")

    var decimal = parseFloat(degrees) + parseFloat(minutes/60) + parseFloat(seconds/3600);

    if ( needToNegate ) {
        decimal = -decimal;
    }
    return decimal;
}
db.airports.createIndex({ location: "2dsphere" });
while ( cursor.hasNext() ) {

    var airportRaw = cursor.next();
    var airport = {};
    airport._id = airportRaw._id;
    airport.code = airportRaw.Code;
    airport.name = airportRaw.Name;
    airport.location = {
        "type" : "Point",
        "coordinates" : [ convertDMSToDecimal(airportRaw.Longitude)
                          ,convertDMSToDecimal(airportRaw.Latitude) ]
    };
    var result = db.airports.insert(airport);
    printjson(result);

}
