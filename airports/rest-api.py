import web
import json
import pymongo
urls = (
        '/', 'index'
)

class index:
    def GET(self):
        raise web.seeother('/static/airports.html')

    def POST(self):
        bounds = json.loads(web.data())
        print(bounds)
        mongo = pymongo.MongoClient("localhost:29009")
        airports = mongo['test']['airports']

        query = { "location" : { "$geoWithin" : {
            "$geometry" : {
                "type" : "Polygon",
                "coordinates" : [ [
                    [ bounds['east'], bounds['north'] ],
                    [ bounds['east'], bounds['south'] ],
                    [ bounds['west'], bounds['south'] ],
                    [ bounds['west'], bounds['north'] ],
                    [ bounds['east'], bounds['north'] ]
                ] ]
            }
        }}}
        project = { "_id" : 0 }
        print(query)
        airport_data = []
        results = airports.find(query,project)
        while results.alive:
            try:
                airport = results.next()
                print(airport)
                airport_data.append(airport)
            except StopIteration:
                print("cursor done")

        return json.dumps(airport_data)

if __name__ == "__main__":
    app = web.application(urls, globals())
    app.run()
