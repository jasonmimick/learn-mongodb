import java.util.List;
import java.util.ArrayList;
import com.mongodb.*;
import com.mongodb.client.*;
import com.mongodb.client.model.*;
import com.mongodb.async.*;
import com.mongodb.async.client.*;
import org.bson.*;
import org.bson.conversions.*;
import static com.mongodb.client.model.Filters.*;
import static com.mongodb.client.model.Aggregates.*;
import static com.mongodb.client.model.Projections.*;

final class DriverDemo32 {
    public static void main(String[] args) {
        if ( args.length != 1 ) {
            System.out.println("usage: java DriverDemo32 <mongodb://-connection-string>");
            System.exit(1);
        }
        MDB mdb = new MDB(args[0],"demo","demo");
        System.out.println("MongoDB Java Driver 3.2 Demo");
        simpleQuery.demo(mdb);
        validation.demo(mdb);
        lookup.demo(mdb);
        readConcern.demo(mdb);
    }

    private DriverDemo32() {
        // don't create one.
        throw new RuntimeException("Noone can create a DriverDemo32, sorry.");
    }

    public interface Demo {
        public void demo(MDB mdb);
    }

    /*
     * Helper class to handling connection and references to Mongo objects
     * to pass around
     */
    private static class MDB {
        private MongoClient client;
        public MongoClient getClient() { return this.client; }
        private MongoDatabase database;
        public MongoDatabase getDatabase() { return this.database; }
        public MongoDatabase getAndSetDatabase(String db) {
            this.database = this.client.getDatabase(db);
            return this.database;
        }
        private MongoCollection collection;
        public MongoCollection getCollection() { return this.collection; }
        public MongoCollection getAndSetCollection(String collection) { 
            this.collection = this.database.getCollection(collection);
            return this.collection;
        }

        public MDB(String connectionString,String database, String collection) {
            try {
                MongoClientURI uri = new MongoClientURI(connectionString);
                this.client = new MongoClient(uri);
                System.out.println("Connecting to: " + uri);
                this.database = this.client.getDatabase(database);
                this.collection = this.database.getCollection(collection);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }

    }

    static DriverDemo32.Demo simpleQuery = new DriverDemo32.Demo() {
        public void demo(MDB mdb) {
            try {
                MongoCollection<Document> collection = mdb.getAndSetCollection("simple");
                Document doc = new Document("name", "MongoDB")
                                   .append("type", "database")
                                   .append("count", 17)
                                   .append("info", new Document("x", 203).append("y", 102));
                collection.insertOne(doc);
                System.out.println("db.test.count()="+collection.count());
                System.out.println(" **** Query Filters **** ");
                System.out.println("static Helpers to build query documents");
                System.out.println("db.test.find{\"count\":17}).next()");
                System.out.println("becomes....");
                System.out.println("collection.find(eq(\"count\",17)).first()");
                doc = collection.find(eq("count", 17)).first();
                System.out.println(doc.toJson());
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    };
    static DriverDemo32.Demo validation = new DriverDemo32.Demo() {
        public void demo(MDB mdb) {
            mdb.getDatabase().getCollection("people").drop();
            Bson validator = and( type("phone","string"),
                                  regex("email","/@mongodb.com/"),
                                  in("status","Unknown","Uncomplete") ) ;
            ValidationOptions vo = new ValidationOptions().validator(validator)
                                    .validationAction( ValidationAction.ERROR);
            CreateCollectionOptions co = new CreateCollectionOptions();
            co.validationOptions(vo);
            mdb.getDatabase().createCollection("people",co);
            try {
                Document doc = new Document("phone",12)
                                    .append("email","jim@mongodb.com")
                                    .append("status","Unknown");
                mdb.getAndSetCollection("people").insertOne(doc);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    };

    static DriverDemo32.Demo lookup = new DriverDemo32.Demo() {

        public void demo(MDB mdb) {
            System.out.println(" ######## $lookup ######## ");
            System.out.println(" Generate sample data" );
            mdb.getDatabase().getCollection("colors").drop();
            mdb.getDatabase().getCollection("items").drop();
            mdb.getAndSetCollection("colors");
            List<Document> colors = new ArrayList<Document>();
            colors.add( new Document("_id",1).append("color","red") );
            colors.add( new Document("_id",2).append("color","yellow") );
            colors.add( new Document("_id",3).append("color","green") );
            colors.add( new Document("_id",4).append("color","blue") );
            colors.add( new Document("_id",5).append("color","brown") );
            mdb.getCollection().insertMany(colors);
                
            List<Document> items = new ArrayList<Document>();
            for(int i=0;i<1000;i++) {
            items.add( new Document("name","item"+i).append("color",i%5) );
            }
            mdb.getAndSetCollection("items").insertMany(items);
                /* Shell version
                [
                    { "$lookup": {
                        "from": "colors",
                        "localField": "color",
                        "foreignField": "_id",
                        "as": "color"
                    } },
                    { "$unwind": "$color" },
                    { "$project": {
                        "_id": 0,
                        "name": 1,
                        "color": "$color.color"
                    } }
                ]
                */
            List<Bson> pipeline = new ArrayList<Bson>();
            pipeline.add( lookup("colors","color","_id","color") );
            pipeline.add( unwind("$color") );
            pipeline.add( project( fields(include("name"),computed("color","$color.color"),excludeId() ) ) );
            AggregateIterable<Document> results = mdb.getCollection().aggregate( pipeline );
            for (Document result : results) {
                System.out.println(result.toJson());
            }
        }
    };

    static DriverDemo32.Demo readConcern = new DriverDemo32.Demo() {
        public void demo(MDB mdb) {
            MongoCollection coll = mdb.getDatabase().getCollection("items").withReadConcern( ReadConcern.MAJORITY );
            FindIterable<Document> docs = coll.find();
            for(Document doc : docs) {
                System.out.println(doc.toJson());
            }


        }
    }; 
   
    static DriverDemo32.Demo async1 = new DriverDemo32.Demo() {
        public void demo(MDB mdb) {
            
            com.mongodb.async.client.MongoCollection coll = 
                (com.mongodb.async.client.MongoCollection) mdb.getAndSetCollection("names");
            coll.drop();
            List<Document> folks = new ArrayList<Document>();
            for(int i=0;i<100;i++) {
                String name = "Jane";
                if ( i%2==1 ) { name = "Joe"; }
                folks.add( new Document("_id",i).append("name",name+i) );
            }
            coll.insertMany(folks);
            
            List<String> names = new ArrayList<String>();
            coll.find().map(new Function<Document, String>() {
                @Override
                public String apply(final Document document) {
                    return document.getString("name");
                }
            }).into(names, new SingleResultCallback<List<String>>() {
                @Override
                public void onResult(final List<String> names, final Throwable t) {
                    if (t != null) {
                        System.out.println("There was an error: " + t);
                    } else {
                        System.out.println("Names: " + names);
                    }
                }
            });
        }

    };
  
}

