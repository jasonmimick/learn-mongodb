package foo.jason;
import com.mongodb.*;
import com.mongodb.async.*;
import com.mongodb.async.client.*;
import org.bson.Document;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.Date;

import static com.mongodb.client.model.Filters.and;
import static com.mongodb.client.model.Filters.eq;
import static com.mongodb.client.model.Filters.exists;
import static com.mongodb.client.model.Filters.gt;
import static com.mongodb.client.model.Filters.gte;
import static com.mongodb.client.model.Filters.lt;
import static com.mongodb.client.model.Filters.lte;
import static com.mongodb.client.model.Projections.excludeId;
import static com.mongodb.client.model.Sorts.descending;

/**
 * Hello world!
 *
 */
public class App 
{
    public static void main( String[] args )
    {
        System.out.println("HelloMongoAsync");
        MongoClient client = null;
        try { 
            client = MongoClients.create();
            MongoDatabase db = client.getDatabase("test.async");
            MongoCollection<Document> foo = 
                db.getCollection("foo");

            List<Document> docs = new ArrayList<Document>();
            for (int i=0;i<100;i++ ) {
                docs.add( new Document("i",i).
                             append("ts", new Date() ));
            }
            foo.insertMany( docs, new SingleResultCallback<Void>() {
                @Override
                public void onResult(final Void result, final Throwable t) {
                    System.out.println("Docs inserted");
                }
            });
        } catch (Exception e) {
            System.out.println(e);
        } finally {
            client.close();
        }

     }
}
