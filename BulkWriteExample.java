import com.mongodb.BasicDBObject;
import com.mongodb.BulkWriteOperation;
import com.mongodb.BulkWriteResult;
import com.mongodb.Cursor;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.MongoClient;
import com.mongodb.ParallelScanOptions;
import com.mongodb.ServerAddress;

import java.util.List;
import java.util.Set;

import static java.util.concurrent.TimeUnit.SECONDS;

public class BulkWriteExample {

    public static void main(String[] args) {
        MongoClient mongoClient = new MongoClient();
        DB db = mongoClient.getDB( "test" );
        DBCollection coll = db.getCollection("bulktest");

        BulkWriteOperation bulk = coll.initializeUnorderedBulkOperation();
        for (int i=0;i<2000;i++) {
            bulk.insert( new BasicDBObject("i",i) );
        }

        BulkWriteResult result = bulk.execute();



    }

}

