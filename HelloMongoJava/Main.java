package com.ghx;

import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.Random;

import org.bson.types.ObjectId;
import com.mongodb.*;
import com.mongodb.client.*;


public class Main {

    private static int good;
    private static int wasted;

    public static void main(String[] args) {


        //This is to generate some data for inserting
        int total = 100000;
        boolean cleanFlag = false;
        boolean insertFlag = false;
        boolean processFlag = true;
        String bulkSwitch = "bulk"; //"bulk",  "multi", "findAndModify", "modifyThenFind", "function"
        int batchSize = 50;
        int delay = 0;

        int i;
        long start;
        long end;
        Float duration;

        //Setup Required Mongo Stuff
        MongoClient mongoClient = null;
        try {
            mongoClient = new MongoClient("localhost", 27017);
        } catch (Exception e) {
            System.out.println("Exception");
            System.exit(0);
        }
        DB db = mongoClient.getDB("test");
        DBCollection diceRolls = db.getCollection("diceRolls");
        System.out.println("-----BEGIN TEST---------------------------------------");
        System.out.println(
                "-------------------------------" +
                        "\nSETUP" +
                        "\ntotal = " + total +
                        "\nclean = " + cleanFlag +
                        "\ninsert = " + insertFlag +
                        "\nbulkFlag = " + bulkSwitch +
                        "\nbatchSize = " + batchSize +
                        "\ndelay = " + delay +
                        "\n-------------------------------");


        if (cleanFlag) {
            clean(diceRolls);
        }


        if (insertFlag) {
            insert(diceRolls, total);


        }

        if (!processFlag) {
            System.out.println("No processing selected");
            System.exit(1);
        }

        start = System.currentTimeMillis();
        switch (bulkSwitch) {
            case "bulk":
                System.out.println("Going into bulkAssign");
                bulkAssign(diceRolls, total, batchSize, delay);
                break;
            case "multi":
                multiAssign(diceRolls, total, batchSize, delay);
                break;
            case "findAndModify":
                findAndModify(diceRolls, total, batchSize, delay);
                break;
            case "modifyThenFind":
                modifyThenFind(diceRolls, total, batchSize, delay);
                break;
            case "function":
                callFunction(db, diceRolls, total, batchSize, delay);
                break;
            default:
                System.out.println("bulkSwitch Invalid Value: " + bulkSwitch);
        }

        end = System.currentTimeMillis();
        duration = (float) (end - start);

        System.out.println(
                "-------------------------------" +
                        "\nRESULTS" +
                        "\nTotal time = " + duration +
                        "\nthroughput = " + ((good / duration) * 1000) + " doc per second" +
                        "\nGood =" + good +
                        "\nwasted =" + wasted +
                        "\n-------------------------------");
        System.out.println("-----END TEST-----------------------------------------");

    }

    private static void bulkAssign(DBCollection coll, int total, int batchSize, int delay) {
        ObjectId token;
        int i;
        i = 0;
        System.out.println("Updating...");
        while (i < total) {
            //bulk Update prep
            DBObject findObject;
            DBObject modifyObject;
            BulkWriteOperation builder = coll.initializeUnorderedBulkOperation();
            findObject = new BasicDBObject("processed", 0);
            modifyObject = new BasicDBObject();
            modifyObject.put("$inc", new BasicDBObject().append("processed", 1));
            token = new ObjectId();
            modifyObject.put("$set", new BasicDBObject("token", token));

            //do a single find first. If this returns nothing, we will skip the rest and save the load
            int findSize = coll.find(findObject).size();

            //if (findSize > 0) {
                //if single update works then create a batch
                for (int x = 1; x <= batchSize; x++) {
                    System.out.println( "findObject=" + findObject + " modifyObject=" + modifyObject );
                    builder.find(findObject).updateOne(modifyObject);
                }

                //execute the batch
                BulkWriteResult bulkResult = builder.execute();
                //System.out.println("modified: " + (bulkResult.getModifiedCount() + 1));

                //find the updated records by token
                DBObject q = new BasicDBObject("token", token);
                int resultSize = coll.find(q).size();

                good = good + bulkResult.getModifiedCount();
                wasted = wasted + ((batchSize) - bulkResult.getModifiedCount());
                i = i + bulkResult.getModifiedCount();

            //}

            /*
            //wait to helps with lock %
            try {
                if (delay > 0) {
                    Thread.sleep(delay);
                }
            } catch (Exception e) {
                System.out.println("whoops");
            }
            */

        }
    }


    private static void multiAssign(DBCollection coll, int total, int batchSize, int delay) {
        ObjectId token;
        int i;
        i = 0;
        System.out.println("Updating...");
        while (i < total) {

            //STEPS: findIDs, Update docs with IDs, find token

            //get list of doc IDs
            DBObject findObject = new BasicDBObject("processed", 0);
            DBObject filter = new BasicDBObject("_id", 1);
            DBCursor idCursor = coll.find(findObject, filter).limit(batchSize);


            //if nothing found then delay and loop
            if (idCursor.size() == 0) {
                System.out.println("found IDs =" + idCursor.size());
                try {
                    if (delay > 0) {
                        Thread.sleep(delay);
                    }
                } catch (Exception e) {
                    System.out.println("whoops");
                }
                continue;
            }

            BasicDBList idList = new BasicDBList();
            while (idCursor.hasNext()) {
                idList.add(idCursor.next().get("_id"));
            }

            //update docs using IDs
            DBObject modifyObject = new BasicDBObject();
            findObject = new BasicDBObject("_id", new BasicDBObject("$in", idList));
            findObject.put("processed", 0);
            token = new ObjectId();
            modifyObject.put("$set", new BasicDBObject("token", token));
            modifyObject.put("$inc", new BasicDBObject().append("processed", 1));
            WriteResult updated = coll.update(findObject, modifyObject, false, true);

            //find the updated objects
            DBObject q = new BasicDBObject("token", token);
            int foundAfterUpdateCount = coll.find(q).size();

            //output if the size of idlist, updated and foundAfterUpdate not the same
          /*  if ((idList.size() != updated.getN()) || (idList.size() != foundAfterUpdateCount)
                    || (updated.getN() != foundAfterUpdateCount)) {

                System.out.println("  found IDs =" + idList.size() + "   Updated = " + updated.getN() +
                        "  Found after update = " + foundAfterUpdateCount);
            }

            */


            good = good + foundAfterUpdateCount;
            wasted = wasted + (idList.size() - foundAfterUpdateCount);
            i = i + foundAfterUpdateCount;

            //wait to helps with lock %
            try {
                if (delay > 0) {
                    Thread.sleep(delay);
                }
            } catch (Exception e) {
                System.out.println("whoops");
            }
        }

    }


    private static void findAndModify(DBCollection coll, int total, int batchSize, int delay) {
        ObjectId token;
        int i;
        int batchCount;
        BasicDBList returnList;
        i = 0;
        batchCount = 1;
        token = new ObjectId();
        returnList = new BasicDBList();

        System.out.println("Updating...");
        while (i < total) {
            //find and modify
            DBObject findObject = new BasicDBObject("processed", 0);
            DBObject modifyObject = new BasicDBObject();
            modifyObject.put("$inc", new BasicDBObject().append("processed", 1));
            modifyObject.put("$set", new BasicDBObject("token", token));

            DBObject modifiedDoc = coll.findAndModify(findObject, modifyObject);
            if (modifiedDoc == null) {
                wasted++;
            } else {
                good++;
                batchCount++;
            }
            returnList.add(modifiedDoc);


            //simulating batching
            if (batchCount == batchSize) {
                token = new ObjectId();
                returnList = new BasicDBList();
                batchCount = 1;
            }

            //wait to helps with lock %
            try {
                if (delay > 0) {
                    Thread.sleep(delay);
                }
            } catch (Exception e) {
                System.out.println("whoops");
            }
            i++;

        }
    }


    private static void modifyThenFind(DBCollection coll, int total, int batchSize, int delay) {
        ObjectId token;
        int i;
        int batchCount;
        BasicDBList returnList;
        i = 0;
        batchCount = 1;
        token = new ObjectId();
        returnList = new BasicDBList();

        System.out.println("Updating...");
        while (i < total) {
            //modify and then find
            DBObject findObject = new BasicDBObject("processed", 0);
            DBObject modifyObject = new BasicDBObject();
            modifyObject.put("$inc", new BasicDBObject().append("processed", 1));
            modifyObject.put("$set", new BasicDBObject("token", token));
            WriteResult wr = coll.update(findObject, modifyObject);
            if (wr.getN() < 1) {
                wasted++;
            } else {
                good++;
            }

            //simulating batching
            if (batchCount == batchSize) {
                DBObject q = new BasicDBObject("token", token);
                DBCursor result = coll.find(q);
                token = new ObjectId();
                returnList = new BasicDBList();
                batchCount = 1;
            }

            //wait to helps with lock %
            try {
                if (delay > 0) {
                    Thread.sleep(delay);
                }
            } catch (Exception e) {
                System.out.println("whoops");
            }
            i++;

        }

    }



    private static void callFunction(DB db, DBCollection coll, int total, int batchSize, int delay) {
        ObjectId token;
        int i;
        i = 0;
        System.out.println("Updating...");
        String functionCode = "function (tok, lim){db.diceRolls.find({\"processed\" : 0}).limit(lim).forEach(" +
                "function (e) {e.token = tok; e.processed = e.processed+1; db.diceRolls.save(e);}) }";
        System.out.println(functionCode);
        while (i < total) {

            //STEPS: eval, find, increment
           token = new ObjectId();

           ArrayList args = new ArrayList();
           args.add(token);
           args.add(batchSize);
           BasicDBObject cmd = new BasicDBObject("eval",functionCode).append("args",args).append("nolock",true);
          // System.out.println(cmd.toString());
           db.command(cmd);
          // db.doEval(functionCode ,token, batchSize);

            //find the updated objects
            DBObject q = new BasicDBObject("token", token);
            int foundAfterUpdateCount = coll.find(q).size();

            //output if the size of idlist, updated and foundAfterUpdate not the same
            if (foundAfterUpdateCount != batchSize) {

                System.out.println("  batchsize = " + batchSize +
                        "  Found after update = " + foundAfterUpdateCount);
            }


            good = good + foundAfterUpdateCount;
            wasted = wasted + (batchSize - foundAfterUpdateCount);
            i = i + foundAfterUpdateCount;

            //wait to helps with lock %
            try {
                if (delay > 0) {
                    Thread.sleep(delay);
                }
            } catch (Exception e) {
                System.out.println("whoops");
            }
        }

    }


    private static void insert(DBCollection coll, int total) {
        System.out.println("Inserting...");
        int d1;
        int d2;
        int sum;
        Random rand = new Random();
        for (int i = 1; i <= total; i++) {
            // inserts
            d1 = (int) (rand.nextInt(6) + 1);
            d2 = (int) (rand.nextInt(6) + 1);
            sum = d1 + d2;
            BasicDBObject doc = new BasicDBObject("roll", sum).append("ts",
                    System.currentTimeMillis()).append("Some other stuff that takes up space ",
                    "four score and 7 years ago today our founding fathers blah blah blah");
            doc.append("processed", 0);
            doc.append("token", -1);
            coll.insert(doc);
        }
        System.out.println("Inserted " + total);
    }


    public static void clean(DBCollection coll) {
        System.out.println("Cleaning...");
        coll.remove(new BasicDBObject());
        System.out.println("Cleaned");

    }
}
