package foo.jason;
import com.mongodb.*;
import com.mongodb.client.*;
import com.mongodb.Block;
import com.mongodb.client.AggregateIterable;
import org.bson.*;
import java.util.List;
import java.util.ArrayList;
import java.util.Date;

import static com.mongodb.client.model.Filters.*;
import static java.util.Arrays.asList;
/**
 * Hello world!
 *
 */
public class App 
{
    public static void main( String[] args )
    {
        System.out.println( "Hello World!" );
        System.out.println("HelloMongo");
        try (MongoClient client = new MongoClient()) {
            MongoDatabase db = client.getDatabase("test");
            MongoCollection<Document> foo = 
                db.getCollection("foo");
            Document doc = foo.find().first();
            System.out.println( doc.toJson() );

            List<Document> docs = new ArrayList<Document>();
            for (int i=0;i<100;i++ ) {
                docs.add( new Document("i",i).
                             append("ts", new Date() ));
            }
            foo.insertMany( docs );
            
            try (MongoCursor<Document> cursor = 
                    foo.find().iterator()) {
                while (cursor.hasNext()) {
                  System.out.println(cursor.next().toJson());
                }
            } catch (Exception ee) {
                System.out.println(ee);
            }


            // now use a range query to get a larger subset
            Block<Document> printBlock = new Block<Document>() {
                @Override
                public void apply(final Document document) {
                    System.out.println("pb:"+document.toJson());
                }
            };
            foo.find( and( gt("i", 50), lte("i",55) ) ).forEach(printBlock);
            
            MongoDatabase hospital = client.getDatabase("MongoGeneral");
            AggregateIterable<Document> agg = 
                hospital.getCollection("admits").aggregate(
                        asList( new Document( "$group", new Document( "_id", "$PatientID")
                                .append( "count", new Document( "$sum", 1 ))),
                                new Document( "$match", new Document( "count",
                                        new Document( "$gte" , 5 ))),
                                new Document( "$sort", new Document( "count", -1 ))
                            ));

            agg.forEach(printBlock);

        } catch (Exception e) {
            System.out.println(e);
        } 
    }
}
