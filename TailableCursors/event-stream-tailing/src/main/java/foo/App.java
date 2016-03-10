package foo;
import com.mongodb.*;
import com.mongodb.client.*;
import com.mongodb.client.model.*;
import org.bson.*;
import java.util.*;

import static com.mongodb.client.model.Filters.*;
import static java.util.Arrays.asList;
import org.apache.commons.cli.*;
/**
 * Hello world!
 *
 */
public final class App 
{
    
    public static int METRICS_PER_SECOND = 10;

    public static String DEFAULT_COLLECTION_NAME = "events";
    // size of events is ~60bytes, which means 100K docs will
    // be 6MB
    public static String DEFAULT_CAPPED_MAX_DOCS = "100000";
    public static String DEFAULT_CAPPED_SIZE_MB = "10";
    public static String DEFAULT_NUM_CONSUMER_THREADS = "1";

    public static boolean QUICK = false;
    public static void main( String[] args )
    {
        Option help = new Option("help","print help message");
        Option capped = new Option("capped","When present runs in capped mode");
        Option quick = new Option("quick","When present runs consumer in quick mode");
        Option createCollection = new Option("createCollection",
                "When present will drop and recreate colection");
        Option producer = OptionBuilder.withArgName("producer")
                                       .hasArg()
                                       .withDescription("Run in producer mode, specify name")
                                       .create("producer");

        Option consumer = OptionBuilder.withArgName("consumer")
                                      .hasArg()
                                      .withDescription("Run in consumer mode, specify <name>")
                                      .create("consumer");
        
        Option numConsumers = OptionBuilder.withArgName("numConsumers")
                                      .hasArg()
                                      .withDescription("Number of consumer theads to spin up")
                                      .create("numConsumers");
        Option mongodb = OptionBuilder.withArgName("mongodb")
                                      .hasArg()
                                      .withDescription("MongoDB connection string, with database")
                                      .create("mongodb");
        Option collection = OptionBuilder.withArgName("collection")
                                         .hasArg()
                                         .withDescription("The collection to contain the events")
                                         .create("collection");
        Option events = OptionBuilder.withArgName("events")
                                         .hasArg()
                                         .withDescription("Comma delimeted list of events")
                                         .create("events");
        Option cappedSizeMB = OptionBuilder.withArgName("cappedSizeMB")
                                         .hasArg()
                                         .withDescription("Size of capped collection MB")
                                         .create("cappedSizeMB");

        Option cappedSizeNumDocs= OptionBuilder.withArgName("cappedSizeNumDocs")
                                         .hasArg()
                                         .withDescription("Max num docs in capped collection")
                                         .create("cappedSizeNumDocs");

        Options options = new Options().addOption(help)
                                       .addOption(capped)
                                       .addOption(quick)
                                       .addOption(createCollection)
                                       .addOption(producer)
                                       .addOption(consumer)
                                       .addOption(numConsumers)
                                       .addOption(mongodb)
                                       .addOption(collection)
                                       .addOption(events)
                                       .addOption(cappedSizeMB)
                                       .addOption(cappedSizeNumDocs);

        CommandLineParser parser = new DefaultParser();
        try {
            CommandLine line = parser.parse(options,args);
            System.out.println("line="+line);
            Option[] opts = line.getOptions();
            for(int i=0;i<opts.length;i++) {
                System.out.println(opts[i].toString());
            }
            System.out.println( "To tail or not, that is the question." );
            if ( line.hasOption("quick") ) {
                App.QUICK = true;
            }
            if ( line.hasOption("producer") ) {

            //List<String> events = Arrays.asList("Buenos Aires", "Córdoba", "La Plata");
            List<String> eventlist = Arrays.asList(
                                  line.getOptionValue("events").split("\\s*,\\s*"));
            int maxDocs = Integer.parseInt(
                            line.getOptionValue("cappedSizeNumDocs",DEFAULT_CAPPED_MAX_DOCS));

            int maxSizeMB = Integer.parseInt(
                             line.getOptionValue("cappedSizeMB",DEFAULT_CAPPED_SIZE_MB));
        

            if ( line.hasOption("capped") ) {
                CappedEventProducer p = 
                    CappedEventProducer.createAndProduce(line.getOptionValue("mongodb"),
                            line.getOptionValue("producer"),
                            line.getOptionValue("collection",DEFAULT_COLLECTION_NAME),
                            maxSizeMB,maxDocs,
                            line.hasOption("createCollection"),eventlist);
            } else {
                 EventProducer p = 
                    EventProducer.createAndProduce(line.getOptionValue("mongodb"),
                            line.getOptionValue("producer"),
                            line.getOptionValue("collection",DEFAULT_COLLECTION_NAME),
                            line.hasOption("createCollection"),eventlist);

            }
         } else if ( line.hasOption("consumer") ) {
            int numberConsumers = Integer.parseInt(
                    line.getOptionValue("numConsumers",DEFAULT_NUM_CONSUMER_THREADS));
            
            List<String> eventlist = Arrays.asList(
                                  line.getOptionValue("events").split("\\s*,\\s*"));
            for (int i=0;i<numberConsumers;i++) {
                String name = line.getOptionValue("consumer");
                if ( i>0 ) { name += i; }   // append thead 'counter'
                if ( line.hasOption("capped") ) {
                    if ( line.hasOption("quick") ) {

                     CappedEventConsumerQuick c = 
                        CappedEventConsumerQuick.createAndConsume(name,
                                    line.getOptionValue("mongodb"),
                                    line.getOptionValue("collection"),
                                    eventlist);

                    } else {
                    CappedEventConsumer c = 
                        CappedEventConsumer.createAndConsume(name,
                                    line.getOptionValue("mongodb"),
                                    line.getOptionValue("collection"),
                                    eventlist);
                    }
                } else {
                    EventConsumer c = 
                        EventConsumer.createAndConsume(name,
                                    line.getOptionValue("mongodb"),
                                    line.getOptionValue("collection"),
                                    eventlist);
                }
            }
        }
        } catch (ParseException pe) {
            System.out.println("Error parsing command line: " + pe.getMessage());
        } catch (Exception e) {
            System.out.println(e);
            e.printStackTrace();
        }
    }
}
