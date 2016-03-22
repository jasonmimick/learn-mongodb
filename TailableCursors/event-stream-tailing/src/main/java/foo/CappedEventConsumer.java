package foo;
import com.mongodb.*;
import com.mongodb.client.*;
import com.mongodb.client.model.*;
import org.bson.*;
import org.bson.conversions.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import static com.mongodb.client.model.Filters.*;
import static java.util.Arrays.asList;

public final class CappedEventConsumer { //extends EventConsumer {

        private CappedEventConsumer() {};
        public static CappedEventConsumer createAndConsume(String name,
                             String db,
                             String collection, 
                             List<String> events) {
            final CappedEventConsumer me = new CappedEventConsumer();
            me.name = name;
            me.db = db;
            me.coll = collection;
            me.events = events;
            Thread t = new Thread( new Runnable() {
                public void run() {
                    me.consume();
                }
            });
            t.start();
            return me;
        }

        private String name;
        private String db;
        private String coll;
        private List<String> events;
        private final AtomicLong cursorRestarts = new AtomicLong(0);
        private final AtomicLong numEvents = new AtomicLong(0);
        private final AtomicLong totalNumEvents = new AtomicLong(0);
        private final AtomicLong lastNumEvents = new AtomicLong(0);

        private void consume() {
            MongoClient client = null;
                        try {
                System.out.println(this.name + " consuming");
                MongoClientURI uri = new MongoClientURI(this.db);
                client = new MongoClient(uri);
                MongoDatabase db = client.getDatabase( uri.getDatabase() );
                MongoCollection<Document> coll = 
                    db.getCollection( this.coll );

                // TODO: Need to filter on only events
                // this consumer wants
                //BasicDBList evs = new BasicDBList();
                //evs.addAll( this.events );
                //System.out.println(evs);
                //System.console().readLine();
                //BasicDBObject query = new BasicDBObject("event",
                //                    new BasicDBObject("$in",evs));
                //query
                // To start only look for event newer than now
                Date now = new Date();
                // start looking for events
                // at some random time during the last 5 minutes
                int randomSetbackSeconds = (int )(Math.random() * (5*60));
                BsonTimestamp ts = new BsonTimestamp( 
                        ((int)((new Date()).getTime()/1000) - randomSetbackSeconds), 0 ); 
                System.out.format("(%s) initial seek query ts: %s %s\n"
                        ,this.name, ts.getTime(), ts.getInc() );
                Bson query = and(in("event",events),gte("ts", ts));

                Document projection = new Document();
                                    final String nnaammee = new String(this.name);
                Runnable statsRunnable = new Runnable() {
                    AtomicLong sumEventsPerSecond = new AtomicLong(0);
                    int callCount = 0;
                    AtomicLong numberCalls = new AtomicLong(0);
                        public void run() {
                            long num = numEvents.get();
                            long lastnum = lastNumEvents.get();
                            long evps = (num-lastnum)/App.METRICS_PER_SECOND;
                            lastNumEvents.set(num);
                            long sum = (long)sumEventsPerSecond.addAndGet(evps);
                            long nc = (long)numberCalls.incrementAndGet();
                            long ave = sum/nc;
                            System.out.format("(%s:%s:%s)\t%-16s%-16s%-10s\n",
                                nnaammee,(callCount++),cursorRestarts.get()
                                ,evps,ave,numEvents.get());
                                  
                        }
                };

                ScheduledExecutorService executor = Executors.newScheduledThreadPool(1);
                executor.scheduleAtFixedRate(statsRunnable, 0, 10, TimeUnit.SECONDS);

                long startTime = System.currentTimeMillis();

                MongoCursor<Document> cursor= coll.
                    find(query)
                    .batchSize(1000000)
                    .projection(projection)
                    .oplogReplay(true)
                    .cursorType(CursorType.TailableAwait).iterator();
                long stopTime = System.currentTimeMillis();

                System.out.format("(%s) First batch runtime: %s\n",this.name,
                    (stopTime - startTime) );

                while (cursor.hasNext()) {
                    Document doc = cursor.next();
                    //System.out.println("["+this.name+"]" + doc);
                    numEvents.incrementAndGet();
                    totalNumEvents.incrementAndGet();
                }
            } catch (Exception ee) {
                cursorRestarts.incrementAndGet();
                numEvents.set(0);
                System.out.println(ee);
                client.close();
                consume();      // keep consuming
            }
        }
}
