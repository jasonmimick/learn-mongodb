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


