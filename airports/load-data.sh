#!/bin/bash

# load raw airport data into a local MongoDB
# transform the data into geoJSON format

mongo --port 29009 -d test --eval "db.airports.raw.drop();db.airports.drop()"

mongoimport --port 29009 -d test -c airports.raw --headerline --type=csv United\ Airport\ List\ -\ Sheet1.csv

mongo --port 29009 createGeoJson.js

