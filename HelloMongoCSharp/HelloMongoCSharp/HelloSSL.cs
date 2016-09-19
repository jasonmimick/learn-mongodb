using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Security.Cryptography.X509Certificates;
using System.Security.Authentication;
using System.Net.Security;
using System.Security.Cryptography;

namespace HelloMongoCSharp
{
	class HelloSSL
	{
		public static void Main (string[] args)
		{
			try {
				viewSystemCertInfo();
				var clientSettings = MongoClientSettings.FromUrl(new MongoUrl(args[0]));
				clientSettings.SslSettings = new SslSettings();
				clientSettings.UseSsl = true;
				clientSettings.SslSettings.EnabledSslProtocols = SslProtocols.Default;
				clientSettings.SslSettings.ServerCertificateValidationCallback =
					delegate (object s, X509Certificate certificate, X509Chain chain, SslPolicyErrors sslPolicyErrors)
					{
						Console.WriteLine("ServerCertificationValidationCallback\n-------------------------------------");
						viewCertInfo(chain, certificate);

						if ( sslPolicyErrors != SslPolicyErrors.None ) {
							Console.WriteLine("Got SslPolicyError: " + sslPolicyErrors );
							if ( sslPolicyErrors == SslPolicyErrors.RemoteCertificateNameMismatch ) {
								// log this? but ok
							} else {
								//return false;
							}
						}
						try {
							var c2 = new X509Certificate2(certificate);
							var isValid = c2.Verify();
							Console.WriteLine("isValid = " + isValid);
							return isValid;
						} catch (Exception ve) {
							Console.WriteLine(ve);
							Console.WriteLine("Log this error so can be fixed!");
							return false;
						}
					};
					//+= validationCallback;

				Console.WriteLine("Attempting connection to: " + args[0]);
				var client = new MongoClient(clientSettings);

				var dbs = client.GetServer().GetDatabaseNames();
				Console.WriteLine("Databases\n---------");
				foreach(var db in dbs) {
					Console.WriteLine(db);
				}
				Console.WriteLine("Press <return> to exit.");
				Console.ReadLine();
			} catch (Exception e) {
				Console.WriteLine("error--");
				Console.WriteLine(e.Message);
			}
		}

		private static void viewCertInfo(X509Chain chain, X509Certificate certificate) {
			Console.WriteLine("Server Certificate Info\n-----------------------");
			foreach (var item in chain.ChainElements) {
				foreach (var elemStatus in item.ChainElementStatus) {
					Console.WriteLine( item.Certificate.Subject + "->" + elemStatus.StatusInformation);
				}
			}
			String publickey = certificate.GetPublicKeyString();
			Console.WriteLine("Publickey=" + publickey);
			String hash = certificate.GetCertHashString();
			Console.WriteLine("Cert Hash=" + hash);
		}

		// List out all system cert info
		private static void viewSystemCertInfo() {
			Console.WriteLine("\nSystem Certificates\n-------------------");
			foreach(StoreLocation location in Enum.GetValues(typeof(StoreLocation))) {
				foreach(StoreName storeName in Enum.GetValues(typeof(StoreName))) {

					var certStore = new X509Store(storeName,location);
					Console.WriteLine("Certs in store: " + storeName + " location: " + location);
					certStore.Open(OpenFlags.ReadOnly);
					foreach(var cert in certStore.Certificates) {
						Console.WriteLine("Found cert:\n" + cert);
					}
				}
			}
		}
	}
}
