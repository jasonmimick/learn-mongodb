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
            ConnectSSL(args);
		}

           private static String _PUBLICKEY = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3J9YFb7jQBIsUfyWZvYmnn2XWNdDnhZBp+l6eWJznP7yE8QNb8mARl0XS55TOXwap+wx3QQ8HxMUkJ2E+nyqvtqghlGmuzNvrPlasGYd01sN34R6mF/7Zg6P+VbfNt+KLTNPAKl7Vy6EAyTpDqEUW+YFecl8HeWZld3NBSc08uKDP687GoEKPZZ9XxLqLE+QrTkHxQ9NzTsN0qZu3hweYqUFxH7h3TP85hax2H0iJE0YoD0xcUHUA2+FRb609hxWmeIIAQgfo4vOAFuw1F6x80wnVLRcXVyc4qvrREGpeo3jKB52PXxQclasNS8lxqqKM8bkGELjv9SA5j0P+O0eWQIDAQAB";
        public async static void ConnectSSL(string[] args) {
            try {
                foreach(StoreName storeName in Enum.GetValues(typeof(StoreName))) {
                    Console.WriteLine("Certs in store: " + storeName);
                    var certStore = new X509Store(storeName,StoreLocation.CurrentUser);
                    certStore.Open(OpenFlags.ReadOnly);
                    foreach(var cert in certStore.Certificates) {
                        Console.WriteLine("Found cert: " + cert);
                    }
                }
                var clientSettings = MongoClientSettings.FromUrl(new MongoUrl(args[0]));
                clientSettings.SslSettings = new SslSettings();
                clientSettings.UseSsl = true;
                clientSettings.SslSettings.EnabledSslProtocols = SslProtocols.Default;
               //clientSettings.SslSettings.ServerCertificateValidationCallback = CertificateValidationCallBack;
               clientSettings.SslSettings.ServerCertificateValidationCallback = delegate (object s, X509Certificate certificate, X509Chain chain, SslPolicyErrors sslPolicyErrors)
                {
                    Console.WriteLine("chain:" + chain);
                    if ( sslPolicyErrors != SslPolicyErrors.None ) {
                        Console.WriteLine("Got SslPolicyError: " + sslPolicyErrors );
                        if ( sslPolicyErrors == SslPolicyErrors.RemoteCertificateNameMismatch ) {
                            // log this? but ok
                        } else {
                            return false;
                        } 
                    }
                    foreach (var item in chain.ChainElements)
                    {
                        foreach (var elemStatus in item.ChainElementStatus)
                        {
                            Console.WriteLine( item.Certificate.Subject + "->" + elemStatus.StatusInformation);
                        }
                    }
                    String publickey = certificate.GetPublicKeyString();
                    Console.WriteLine("Got server publickey=" + publickey);
                    String hash = certificate.GetCertHashString();
                    Console.WriteLine("Got server hash=" + hash);

                
                    try {
                        var c2 = new X509Certificate2(certificate);
                        var isValid = c2.Verify();
                        Console.WriteLine("isValid = " + isValid);
                        return true;
                    } catch (Exception ve) {
                        Console.WriteLine(ve);
                        Console.WriteLine("Log this error so can be fixed!");
                        return false;
                    }

                    // match certificate public key and allow communicate with authenticated servers.
                };
                //+= validationCallback;
                
                Console.WriteLine("Attempting connection to: " + args[0]);
                var client = new MongoClient(clientSettings);

                Console.WriteLine(client);
                var dbs = client.GetServer().GetDatabaseNames();
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



      private static bool CertificateValidationCallBack(
         object sender,
         System.Security.Cryptography.X509Certificates.X509Certificate certificate,
         System.Security.Cryptography.X509Certificates.X509Chain chain,
         System.Net.Security.SslPolicyErrors sslPolicyErrors)
    {
      // If the certificate is a valid, signed certificate, return true.
      if (sslPolicyErrors == System.Net.Security.SslPolicyErrors.None)
      {
        Console.WriteLine("No SslPolicyErrors - cert is good!");
        return true;
      }
      // If there are errors in the certificate chain, look at each error to determine the cause.
      if ((sslPolicyErrors & System.Net.Security.SslPolicyErrors.RemoteCertificateChainErrors) != 0)
      {
        if (chain != null && chain.ChainStatus != null)
        {
          foreach (System.Security.Cryptography.X509Certificates.X509ChainStatus status in chain.ChainStatus)
          {
            if ((certificate.Subject == certificate.Issuer) &&
               (status.Status == System.Security.Cryptography.X509Certificates.X509ChainStatusFlags.UntrustedRoot))
            {
               Console.WriteLine("Self-signed certificates with an untrusted root are valid.");
               continue;
            }
            else
            {
              if (status.Status != System.Security.Cryptography.X509Certificates.X509ChainStatusFlags.NoError)
              {
                Console.WriteLine("If there are any other errors in the certificate chain, the certificate is invalid, so the method returns false.");
                return false;
              }
            }
          }
        }
        // When processing reaches this line, the only errors in the certificate chain are
        // untrusted root errors for self-signed certificates. These certificates are valid
        // for default Exchange Server installations, so return true.
        Console.WriteLine("Untruster root error for self-signed cert: OK!");
        return true;
      }
      else
      {
     // In all other cases, return false.
        Console.WriteLine("All other cases: return false :(");
        return false;
      }
    }
    }
}
