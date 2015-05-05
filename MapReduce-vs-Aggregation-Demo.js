db = db.getSiblingDB("mrvagg");

// Load up some sample data
// users and clicks
// For the past 1 month, each day generate X 'users'
// and Y clicks for Z urls
//
// return an ISODate() for daysBack from today
var dateByBack = function(daysBack) {
    var d = new Date();
    d.setDate( d.getDate() - daysBack);
    return d;
}
var randomUrl = function() {
    return Math.floor(Math.random()*10000000000000000).toString(16);
}
var loadDemoData = function(numberUsers) {
  if ( typeof numberUsers === "undefined" ) {
      numberUsers = 100;
  }      
  var daysBack = 30;
  for (var i=0; i<daysBack; i++) {
    var date = dateByBack(i);
    var docs = [];
    for (var u=0; u<numberUsers; u++) {
        var user_id = "user_"+u;
        var clicksThisUserThisDay = Math.floor(Math.random()*100);
        for (var c=0; c<clicksThisUserThisDay; c++) {
          var clickDoc = {
            "user_id" : user_id,
            "date" : date,
            "url" : randomUrl() };
          docs.push(clickDoc);
        }
    }
    db.views.insert( docs );
  }
}

