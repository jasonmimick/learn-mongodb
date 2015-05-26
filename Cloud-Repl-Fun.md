Replica Sets
=
Replica Sets are all about High Availability in MongoDB.
That means your data is always accessable, for both writes and reads.
In this exercise, we'll get into teams and spin up a Mongo replica set in the cloud.

First - you'll need a way to access your server in the cloud. The best practice here is to use
an SSH client. If you're using a *nix system, then you've already got one. If you're on a Windows system, 
then I recommend grabbing Putty from http://the.earth.li/~sgtatham/putty/latest/x86/putty.exe and installing.

Download the RL-Rocks.pem file to your laptop.
Find your EC2 node below, and use ssh to connect.

Team Name     | Amazon Node  
--- | ---
ONE | ec2-54-234-31-25.compute-1.amazonaws.com
TWO | ec2-107-21-143-52.compute-1.amazonaws.com
THREE | ec2-54-167-87-168.compute-1.amazonaws.com
FOUR | ec2-54-83-120-193.compute-1.amazonaws.com

Use putty to connect, grab the ppk from https://github.com/jasonmimick/learn-mongodb/blob/master/renaissance-learning-training-pem.ppk

Login as 'ec2-user'

There are 2 different versions of MongoDB located in ec2-user's home directory.

Get to page 149 in class book - fire up a replica set using the binaries in version 2.6.9.

NOTE!! check the output of the command ``hostname -f`` and use this for all hostnames when 
configuring your repl set - where you see <HOSTNAME>.

Do this INSTEAD of what's on page 150 "Configure the Replica Set"

    mongo localhost:27021
    > rs.help()
    > config = {
      _id: 'myReplSet',
      members: [
        { _id: 0, host: '<HOSTNAME>:27021' },
        { _id: 1, host: '<HOSTNAME>:27022' },
        { _id: 2, host: '<HOSTNAME>:27023' } ]
      }
    > rs.initiate(config)
    > rs.status()

What kind of repl set have you setup?

Continue the exercises.

Now, let's failover to a new primary. Adjust the priority on one of the secondaries and firgure out how to make that one become the new primary.

Connect and delete some data from the testcol.

Connect to the original primary, now a secondary, and make sure things are replicating.

Figure out how to upgrade your Replica Set to version 3.0.3 - hint: search "rolling upgrade mongodb"

