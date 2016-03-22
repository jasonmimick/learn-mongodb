using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Driver;

namespace HelloMongoCSharp
{
	class MainClass
	{
		public static void Main (string[] args)
		{
            if ( args.Length > 0 && args[0]=="testConnectionString" ) {
                Console.WriteLine("foo");
                TestConnectionString(args);
                return;
            }
			Console.WriteLine ("Hello MongoDB with CSharp!");
			ValidateWriteResultNew ();
		}

        public async static void TestConnectionString(string[] args) {
            if ( args.Length <= 1 ) {
                Console.WriteLine("Invalid arguments");
                return;
            }
            var conn = args[1];
            try {
                var client = new MongoClient( conn );
                Console.WriteLine(client);
                var cursor = await client.ListDatabasesAsync();
                Console.WriteLine(cursor);
                await cursor.ForEachAsync( db => Console.WriteLine(db["name"])); 
                Console.ReadLine();
            } catch (Exception e ) {
                Console.WriteLine(e.Message);
                Console.ReadLine();
            }
            Console.WriteLine("foo");
        }

		public async static void ValidateWriteResultNew() {
            var connectionString = "mongodb://localhost:28010,localhost:28011,localhost:28012/foors";
			var client = new MongoClient ( connectionString );
			var db = client.GetDatabase ("test2");
			// throw a bunch of unacked writes.
			//var wc = WriteConcern.Unacknowledged;
			var settings = new MongoCollectionSettings ();
			//settings.WriteConcern = wc;
			//settings.ReadPreference = ReadPreference.Nearest;

            db.DropCollectionAsync("actions");
			var actions = db.GetCollection<BsonDocument> ("actions", settings);

			//db.DropCollectionAsync ("actions").GetAwaiter ().GetResult ();

			List<BsonDocument> docs = new List<BsonDocument> ();
			var random = new Random ();
			for (var i = 0; i < 1000; i++) {
				docs.Add (new BsonDocument (new Dictionary<String, Object> () {
					{ "_id", i },
					{ "ts", DateTime.UtcNow },
					{ "count", random.Next(100000) }
				}));
			}

			actions.InsertManyAsync(docs).GetAwaiter().GetResult ();
		
			try {
				var dup = new BsonDocument( new Dictionary<String, Object>() {
					{"_id", 1}
				});
				actions.InsertOneAsync( dup ).GetAwaiter().GetResult();
			} catch (Exception e) {
				/* Why don't we get an exception here -
				 * it's a duplicate _id !!!
				 */
				Console.WriteLine("Duplicate Exception??");
				Console.WriteLine(e.Message);
			}
			/* We didn't get an error above, since we were
			 * using WriteConcern.Unacknowledged.
			 * Let's change to something more durable!
			 */
			try {
				var dup = new BsonDocument( new Dictionary<String, Object>() {
					{"_id", 1}
				});
				actions.WithWriteConcern( WriteConcern.WMajority )
					.InsertOneAsync( dup ).GetAwaiter().GetResult();
			} catch (Exception e) {
				Console.WriteLine("Duplicate Exception??");
				Console.WriteLine(e.Message);
			}

			try {
				var filter = Builders<BsonDocument>.Filter.Eq("_id",1);
				var update = Builders<BsonDocument>.Update.Set ("x", 1);
				actions.UpdateOneAsync(filter, update).GetAwaiter().GetResult();
			} catch (Exception e) {
				Console.WriteLine("Update Exception??");
				Console.WriteLine(e.Message);
			}
			Console.WriteLine ("After dup test");
			Console.ReadLine ();
		}
		public static void ValidateWriteResultOld() {
			var client = new MongoClient();
			var server = client.GetServer();
			var db = server.GetDatabase("test");
			var majorityWriteConcern = WriteConcern.WMajority;
			var people = db.GetCollection<BsonDocument>("people"); //, majorityWriteConcern);

			var jimmy = new BsonDocument( new Dictionary<String, Object>()
				{
					{ "name", "Jill" },
					{ "age", 31 },
					{ "school", "Cornell" }
				}
			);

			try {
				var writeResult = people.Insert( jimmy, majorityWriteConcern );

				if ( writeResult.HasLastErrorMessage ) {
					Console.WriteLine( writeResult.LastErrorMessage );
				}

				var p1 = new Dictionary<String,Object>() 
				{
					{ "_id", "foo" },
					{ "ts", new DateTime() }
				};
				writeResult = people.Insert( p1, majorityWriteConcern );
				if ( writeResult.HasLastErrorMessage ) {
					Console.WriteLine( writeResult.LastErrorMessage );
				}

				writeResult = people.Insert( p1, majorityWriteConcern );
				if ( writeResult.HasLastErrorMessage ) {
					Console.WriteLine( writeResult.LastErrorMessage );
				}

			} catch( Exception e ) {
				Console.WriteLine ("EXCEPTION THROWN!");
				Console.WriteLine (e.Message);
			}
			Console.ReadLine ();
		}
	}


}
