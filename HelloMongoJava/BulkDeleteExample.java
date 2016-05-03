
import java.util.ArrayList;
import java.util.Random;

import com.mongodb.*;
import com.mongodb.client.*;


public class BulkDeleteExample {


    public static void main(String[] args) {

        if ( args.length != 2 ) {
            System.out.println( "Usage: BulkDeleteExample <regular|bulk> numberOfRuns=10");
            System.exit(0);
        }
        String regOrBulk = args[0];
        String numberOfRuns = args[1];

        MongoClient mongoClient = null;
        try {
            mongoClient = new MongoClient("localhost", 27017);
        } catch (Exception e) {
            System.out.println("Exception");
            System.exit(0);
        }
        DB db = mongoClient.getDB("test");
        DBCollection collection = db.getCollection("bulk.delete");

        collection.drop();
        
        collection.createIndex( new BasicDBObject( "in", 1 ) );
        collection.createIndex( new BasicDBObject( "out", 1 ) );
        System.out.println("-----BEGIN TEST---------------------------------------");

        // insert a bunch of data
        int numDocs = 50000;
        int i = 0;
        int numExecutes = 0;
        long start = System.currentTimeMillis();
        BulkWriteOperation bwo = collection.initializeUnorderedBulkOperation();
        while ( i++ < numDocs ) {
            bwo.insert( getSampleDoc() );
            if ( (i % BATCH_SIZE )==0 ) {
                bwo.execute();
                numExecutes++;
                bwo = collection.initializeUnorderedBulkOperation();
            }
        }
        System.out.println( (System.currentTimeMillis() - start ) + "ms to insert " + numDocs );
        System.out.println("i=" + i + " numExecutes=" + numExecutes );
        //bwo.execute();
        //
        /*
        int numRuns = Integer.parseInt( numberOfRuns );
        for(int j=0;j<numRuns;j++ ) {
            if ( regOrBulk.equals( "regular" ) ) {
                regularDelete(collection, "out", j);
            } else {
                bulkDelete(collection, "out", j);
            }
        }
        System.out.println("Average ms: " + (TIME_SUM/numRuns));
        System.out.println("Average num docs: " + (COUNT_SUM/numRuns));
        */

      
    }
    private static long TIME_SUM = 0;
    private static long COUNT_SUM = 0;
    private static void regularDelete(DBCollection collection, String key, int length) {
        System.out.println( "Deleting docs with { \""+key+"\" : { \"$size\" : "+length+" } " );
        DBObject deleteQ = getDeleteQuery(key,length);
        long n = collection.getCount( deleteQ );
        System.out.println( "Found " + n + " docs with \""+key+"\" $size="+length);
        
        long start = System.currentTimeMillis();
        WriteResult wr = collection.remove( deleteQ );
        long tms =(System.currentTimeMillis() - start ); 
        TIME_SUM += tms;
        COUNT_SUM += n;
        System.out.println( tms + "ms to remove() " + n );
        System.out.println(wr);

 
    }


    private static void bulkDelete(DBCollection collection, String key, int length) {
        BulkWriteOperation bwo = collection.initializeUnorderedBulkOperation();
        DBObject deleteQ = getDeleteQuery(key, length);
        long n = collection.getCount( deleteQ );
        System.out.println( "Found " + n + " docs with \""+key+"\" $size="+length);
        
        long start = System.currentTimeMillis();
        bwo.find( deleteQ ).remove();
        BulkWriteResult bwr = bwo.execute();
        long tms =(System.currentTimeMillis() - start ); 
        TIME_SUM += tms;
        COUNT_SUM += n;
        System.out.println( tms + "ms to remove() " + n );
        System.out.println(bwr);


    }

    private static DBObject getDeleteQuery(String key, int length) {
        return new BasicDBObject(key, new BasicDBObject( "$size", length ) );

    }
    private static int MAX_ARRAY_LENGTH = 25;
    private static int BATCH_SIZE = 500;
    private static DBObject getSampleDoc() {
        DBObject doc = new BasicDBObject( "abc", randomString() );
    
        doc.put( "in", randomIntArray() );
        doc.put( "out", randomIntArray() );
        doc.put( "ts", new java.util.Date() );
        return doc;

    }

    private static int[] randomIntArray() {
        int length = (int)Math.floor( Math.random() * MAX_ARRAY_LENGTH );
        int[] array = new int[length];
        for (int i=0;i<length;i++) {
            array[i] = (int)Math.floor( Math.random() * 1000 );
        }
        return array;
    }
    //private static String randomString(int length) {
    private static String randomString() {
        return Long.toHexString(Double.doubleToLongBits(Math.random()));
    }
}

