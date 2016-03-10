package foo;
import com.mongodb.*;
import com.mongodb.client.*;
import com.mongodb.client.model.*;
import org.bson.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import static com.mongodb.client.model.Filters.*;
import static java.util.Arrays.asList;

/**
* Initializing an instance will fire up a thread
* writing events to a new capped collection.*
*/
public final class CappedEventProducer { //extends EventProducer {

    private CappedEventProducer() {}

    public static CappedEventProducer createAndProduce(String db,
                             String name,
                             String collectionName,
                             int maxSizeMB,
                             int maxNumDocs,
                             boolean createCollection,
                             List<String> events) {
        final CappedEventProducer me = new CappedEventProducer();
        me.name = name;
        me.collectionName = collectionName;
        me.db = db;
        me.maxSizeMB = maxSizeMB;
        me.maxNumDocs = maxNumDocs;
        me.events = events;
        try {
            final MongoClientURI uri = new MongoClientURI(me.db);
            me.client = new MongoClient(uri);
            MongoDatabase mdb = me.client.getDatabase( uri.getDatabase() );
            if ( createCollection ) {
                mdb.getCollection( me.collectionName ).drop();
                mdb.createCollection(me.collectionName, 
                    new CreateCollectionOptions().capped(true).
                    sizeInBytes(me.maxSizeMB*1024*1024).
                    maxDocuments(me.maxNumDocs));
                if ( App.QUICK ) {  //optionally create index
                    mdb.getCollection( me.collectionName )
                        .createIndex( new Document("event",1)
                                .append("ts",1) );
                }
            }
            Thread pt = new Thread(new Runnable() {
                public void run() {
                    me.produce( uri.getDatabase() );
                }
            });
            pt.start();
            return me;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private String name;
    private String collectionName;
    private String db;
    private int maxSizeMB;
    private int maxNumDocs;
    private List<String> events;
    private MongoClient client;


    private boolean shouldRun = true;
    private void produce(String dbname) {
        MongoDatabase db = this.client.getDatabase( dbname );
        MongoCollection<Document> coll = 
        db.getCollection( this.collectionName );
        final AtomicLong batch = new AtomicLong(0);
        final AtomicLong numEvents = new AtomicLong(0);
        final String nnaammee = new String(this.name);
        final AtomicLong lastNumEvents = new AtomicLong(0);
        Runnable statsRunnable = new Runnable() {
            AtomicLong sumEventsPerSecond = new AtomicLong(0);
            AtomicLong numberCalls = new AtomicLong(0);
            public void run() {
                if ( numberCalls.intValue()==0 ) {
                    System.out.println("Producer:"+nnaammee+" "+new Date());
                    System.out.println("batch\tevents/sec\tave events/sec\tnum events");
                }
                // calculate events per seconds
                long num = (long)numEvents.get();
                long lastnum = (long)lastNumEvents.get();
                long evps = (num-lastnum)/App.METRICS_PER_SECOND;
                lastNumEvents.set(num);
                long sum = (long)sumEventsPerSecond.addAndGet(evps);
                long nc = (long)numberCalls.incrementAndGet();
                long ave = sum/nc;
                System.out.format("%-8s%-16s%-16s%-10s\n",batch.get(),
                        evps,ave,numEvents.get());
            }
        };

        ScheduledExecutorService executor = Executors.newScheduledThreadPool(1);
        executor.scheduleAtFixedRate(statsRunnable, 0, 10, TimeUnit.SECONDS);
        while ( this.shouldRun ) {
            // ?? 'randomly' insert events.
            // if you want to skew an event to occur
            // more often, then just add it to the
            // list more times.
            java.util.Collections.shuffle(this.events);
            List<Document> docs = new ArrayList<Document>();
            
            for(String event : this.events) {
                docs.add( new Document("event",event).
                              append("batch",batch).
                              append("ts", new BsonTimestamp() ));
                numEvents.incrementAndGet();

            }
            coll.insertMany( docs );
            batch.incrementAndGet();;
            // TODO: add a throttle 
            /*
            try {
                Thread.sleep(100);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }*/
        }
    }

    public void stop() {
        this.shouldRun = false;
    }
}


