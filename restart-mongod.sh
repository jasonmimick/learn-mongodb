#!/bin/bash

pid=`ps -ef | grep mongod.conf | grep mongodb | awk '{print $2}'`
echo "mongod pid=$pid"
if [ -z "$pid" ]
then
	echo "no mongod running, attempting to start"
	sudo service mongod start
else
	sudo kill $pid
	echo "attempting to stop"
	sleep 5
	pid=`ps -ef | grep mongod.conf | grep mongodb | awk '{print $2}'`
	echo "pid=$pid"
	if [ -z "$pid" ]
	then
		echo "mongod stopped, attempting to start"
		sudo service mongod start
	else
		echo "unable to stop mongod"
	fi
fi

