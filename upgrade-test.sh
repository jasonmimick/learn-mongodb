#!/bin/bash

# setup environment
mkdir data
m 2.4.10
mlaunch --sharded shard0 shard1 shard2 --replicaset --nodes 2 --config 3 --mongos 1

#mongo upgrade-test-client-cluster.js > upgrade.out &
#sleep 10
sleep 10

m shell 2.4.10 --eval 'sh.getBalancerState()'
m shell 2.4.10 --eval 'sh.setBalancerState(false)'

echo "upgrade mongos 2.6.11"
mlaunch stop mongos
m 2.6.11
mongos --logpath data/mongos.log --port 27017 --configdb `hostname`:27024,`hostname`:27025,`hostname`:27026 --logappend --fork --upgrade
mlaunch start mongos

sleep 5

echo "restart configsvr's at 2.6.11"
# in reality, this should follow last to first procedure
mlaunch stop config
mlaunch start config
sleep 5

echo "full upgrade of mongod's"
# in reality, this will be rolling with .setDown(), etc..
mlaunch stop shard 0
mlaunch start shard 0
mlaunch stop shard 1
mlaunch start shard 1
mlaunch stop shard 2
mlaunch start shard 2
echo "m 3.0.8, sleep 10, restart shards"
m 3.0.8
mlaunch stop shard 0
mlaunch start shard 0
mlaunch stop shard 1
mlaunch start shard 1
mlaunch stop shard 2
mlaunch start shard 2

sleep 10
echo "run mongos --upgrade and restart"
mlaunch stop mongos
mongos --logpath data/mongos.log --port 27017 --configdb `hostname`:27024,`hostname`:27025,`hostname`:27026 --logappend --fork --upgrade
mlaunch start mongos
sleep 10

echo "restart config's"
mlaunch stop config
mlaunch start config

