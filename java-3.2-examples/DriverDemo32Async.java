import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.CountDownLatch;
import com.mongodb.Block;
import com.mongodb.Function;
import com.mongodb.async.*;
import com.mongodb.async.client.*;
import org.bson.*;
import org.bson.conversions.*;
import static com.mongodb.client.model.Filters.*;
import static com.mongodb.client.model.Aggregates.*;
import static com.mongodb.client.model.Projections.*;

final class DriverDemo32Async {
    public static void main(String[] args) {
        if ( args.length != 1 ) {
            System.out.println("usage: java DriverDemo32Async <mongodb://-connection-string>");
            System.exit(1);
        }
        try {
            int numberOfDemos = 2;
            final CountDownLatch latch = new CountDownLatch( numberOfDemos );
            MDB mdb = new MDB(args[0],"demo-async","demo-async");
            System.out.println("MongoDB Java Driver 3.2 Demo - Async");
            simpleQuery.demo(mdb,latch);
            mapIntoDemo.demo(mdb,latch);
            latch.await();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private DriverDemo32Async() {
        // don't create one.
        throw new RuntimeException("Noone can create a DriverDemo32Async, sorry.");
    }

    public interface Demo {
        public void demo(MDB mdb,CountDownLatch latch);
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
                this.client = MongoClients.create( connectionString );
                System.out.println("Connecting to: " + connectionString );
                this.database = this.client.getDatabase(database);
                this.collection = this.database.getCollection(collection);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }

    }

    
    

    static Block<Document> printDocument = new Block<Document>() {
        @Override
        public void apply(final Document document) {
            System.out.println(document.toJson());
        }
    };

    public static void checkThrowable(Throwable t) {
         if ( t != null ) {
            System.out.println(t);
            t.printStackTrace();
        }
    }


    static DriverDemo32Async.Demo simpleQuery = new DriverDemo32Async.Demo() {
        public void demo(MDB mdb,CountDownLatch latch) {
            try {
                MongoCollection<Document> collection = mdb.getAndSetCollection("simple");
                Document doc = new Document("name", "MongoDB")
                                   .append("type", "database")
                                   .append("count", 17)
                                   .append("info", new Document("x", 203).append("y", 102));
                collection.insertOne(doc, new SingleResultCallback<Void>() {
                    @Override
                    public void onResult(final Void result, final Throwable t) {
                        checkThrowable(t);
                        
                        collection.count( new SingleResultCallback<Long>() {
                            @Override
                            public void onResult(final Long count, final Throwable t) {
                                checkThrowable(t);
                                System.out.println("db.simple.count()="+count);
                                System.out.println(" **** Query Filters **** ");
                                System.out.println("static Helpers to build query documents");
                                System.out.println("db.simple.find{\"count\":17}).next()");
                                System.out.println("becomes....");
                                System.out.println("collection.find(eq(\"count\",17)).forEach(...)");
                                collection.find(eq("count", 17)).forEach(printDocument, new SingleResultCallback<Void>() {
                                    @Override
                                    public void onResult(final Void result, final Throwable t) {
                                        checkThrowable(t);
                                        latch.countDown();
                                    }
                                });
                            }
                        });
                    }
                });

            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    };

    /*
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
    */

    
    static DriverDemo32Async.Demo mapIntoDemo = new DriverDemo32Async.Demo() {
        public void demo(MDB mdb,CountDownLatch latch) {
            
            MongoCollection<Document> coll = mdb.getAndSetCollection("names");
            //coll.drop();
            List<Document> folks = new ArrayList<Document>();
            for(int i=0;i<100;i++) {
                String name = "Jane";
                if ( i%2==1 ) { name = "Joe"; }
                folks.add( new Document("i",i).append("name",name+i) );
            }
            coll.insertMany(folks, new SingleResultCallback<Void>() {
                @Override
                public void onResult(final Void result, final Throwable t) {
                    checkThrowable(t);
            
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
                            latch.countDown();
                        }
                    });
                }
            });
        }
    };
}

