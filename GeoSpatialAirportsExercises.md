# Special GeoSpatial Exercises

#### *Disconnect from any VPN or special network software which will prevent you from accessing the full internet.*


 Launch a mongo shell connected to a cloud server with some sample geo data:

```bash
mongo jmimick-demo1.mongodb-field.com:20187/geo -u student -p p0wer!
```

##### *or*

```bash
mongo --host jmimick-demo1.mongodb-field.com --port 20187 --authenticationDatabase geo -u student -p p0wer!
```

**Warmup-Challenge #1:** Can you explain what the arguments in the command above mean?

---

Look around at the collections: states, airports

**Warmup-Challenge #2:** How many airports are there?

---

## ```$geoWithin```
Now let's get going....

Find the airports in California - the [```$geoWithin```](https://docs.mongodb.org/manual/reference/operator/query/geoWithin/) operator

```javascript
>use geo
>var cal = db.states.findOne( { "code" : "CA" } )
>db.airports.find(
{ "loc" : { $geoWithin : { $geometry : cal.loc } } },
{ "name" : 1, "code" : 1, "type" : 1, "_id" : 0 } )
```

***Challenge #1:*** Find the international airports within New York.

Note - there is another collection called airports.noindex - try the above query against that collection. Does it work? Check the explain() output and note the use or no-use of indexes.

---

## ```$geoIntersects```

Another geographic operator is [```$geoIntersects```](https://docs.mongodb.org/manual/reference/operator/query/geoIntersects/) - this will tell you if 2 geoJSON polygons touch or overlap with each other.

Here's how to find all the states bordering California:

```javascript
>var cal = db.states.findOne( { "code" : "CA" } )
>db.states.find(
{ "loc" : { $geoIntersects : { $geometry : cal.loc } },
  "code" : { $ne : cal.code } },
{ "name" : 1, "code" : 1, "type" : 1, "_id" : 0 } )
```

***Challenge #2:*** Find all the non-international airports in states which border Nebraska.

---

## ```$near```
Another very useful operator is [```$near```](https://docs.mongodb.org/manual/reference/operator/query/near/). It's used to find things "close" to another thing - it deals with proximity, so to use this you need to supply a point and then some maximum distance.

Let's find all the international airports within 20km (~12.42 miles) of Central Park in New York City (The ```$near``` operator expects the distance in meters.)

```javascript
db.airports.find(
 {
   loc : {
     $near : {
       $geometry : { 
         type : "Point" , 
         coordinates : [-73.965355,40.782865]  
       }, 
       $maxDistance : 20000
     }
   }, 
   type : "International"
 },
 {
   name : 1,
   code : 1,
   _id : 0
 }
)
```

You should see: 

```javascript
{ "name" : "La Guardia", "code" : "LGA" }
{ "name" : "Newark Intl", "code" : "EWR" }
```

Seems JFK is a bit farther out. 

***Challenge #3:*** Find all the airports within 25km of the Washington monument in DC.

```javascript
db.airports.find(
 {
   loc : {
     $near : {
       $geometry : { 
         type : "Point" , 
         coordinates : [-77.0352,38.8895]  
       }, 
       $maxDistance : 25000
     }
   }},
 {
   name : 1,
   code : 1,
   _id : 0
 }
)
```

The ```geoNear``` command will return a document containing results sorted by proximity. This command is a little more complex, but basically the same.

***Challenge #4:*** What does the following code return? Try it out, break down the code and explain.

```javascript
var r = db.runCommand( 
  { geoNear : "airports", 
    near : {           
      type : "Point" ,           
      coordinates : [-73.965355,40.782865]         
    }, 
   spherical : true, maxDistance : 30000 } );
r.results.forEach( function(r) { print(r.obj.name+" "+r.dis/1000+"km") } )
```


If you are interested, you can download the state/airport dataset here: [geo.zip](https://www.dropbox.com/s/yui7shcud2xbxt7/geo.zip)

