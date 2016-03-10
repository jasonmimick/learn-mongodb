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

public final class EventConsumer { 
    
        private EventConsumer() {};
        public static EventConsumer createAndConsume(String name,
                             String db,
                             String collection, 
                             List<String> events) {
            final EventConsumer me = new EventConsumer();
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

                final String nnaammee = new String(this.name);
                Runnable statsRunnable = new Runnable() {
                    public void run() {
                    // calculate events per seconds
                    long num = numEvents.get();
                    long lastnum = lastNumEvents.get();
                    long evps = (num-lastnum)/App.METRICS_PER_SECOND;
                    lastNumEvents.set(num);
                    System.out.println("Consumer["+
                        nnaammee+"]: cursorRestarts="+cursorRestarts.get()
                        +" numEvents="+num
                        +" events/second="+evps
                        +" totalNumEvents="+totalNumEvents.get());
                    }
                };

                ScheduledExecutorService executor = Executors.newScheduledThreadPool(1);
                executor.scheduleAtFixedRate(statsRunnable, 0, 10, TimeUnit.SECONDS);

                Date ts = poll(coll,new Date());
                while ( true ) {
                    ts = poll(coll,ts);
                    try {
                        Thread.sleep(100);
                    } catch (InterruptedException ie) {
                        //eat it
                    }
                }
                
            } catch (Exception ee) {
                cursorRestarts.incrementAndGet();
                numEvents.set(0);
                System.out.println(ee);
                client.close();
                consume();      // keep consuming
            }
        }

        private Date poll(MongoCollection coll, Date ts) {
            Date lastDate = ts;
            Bson query = and(in("event",events),gte("ts", ts));
            Document projection = new Document();
            MongoCursor<Document> cursor= coll
                .find(query)
                .projection(projection).iterator();

            while (cursor.hasNext()) {
                Document doc = cursor.next();
                numEvents.incrementAndGet();
                totalNumEvents.incrementAndGet();
                lastDate = (Date)doc.get("ts");
            }
            return lastDate;
        }
}
