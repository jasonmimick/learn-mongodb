using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Driver;

namespace ConnectionStringTester 
{
	class MainClass
	{
		public static void Main (string[] args)
		{
            if ( args.Length != 1  ) {
                Console.WriteLine("Usage: TestConnectionString.exe <mongodb.uri>");
                return;
            }
            TestConnectionString(args[0]);
            Console.ReadKey();
		}

        public async static void TestConnectionString(string conn) {
            try {
                Console.WriteLine("Attempting connection & 'show dbs' to '" + conn + "'");
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("Do not press any key or test will end (asynchronous APIs are in use).");
                Console.ResetColor();
                Console.WriteLine("Note: this may seem to hang for awhile as the default timeout on connections is 30 seconds.");
                Console.WriteLine("Please see https://docs.mongodb.org/manual/reference/connection-string/ for full documentation.");
                var client = new MongoClient( conn );
                var cursor = await client.ListDatabasesAsync();
                await cursor.ForEachAsync( db => Console.WriteLine(db["name"])); 
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("Test successful :)");
                Console.ResetColor();
            } catch (Exception e ) {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine(e.Message);
                Console.WriteLine("Test failed :(");
                Console.ResetColor();
            } finally {
                Console.WriteLine("Test complete. Press any key to end.");
            }
        }
    }
		
}
