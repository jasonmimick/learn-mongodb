#!/bin/bash
#
# Cludgey script to show current MongoDB users.
# All complaints and remittence: jason.mimick@mongodb.com
#
# stop running if any errors
set -e  

# helper routines start
usage()
{
        cat << 'end-of-usage'
usage: currentUsers.sh <mongodb-logpath> <auth-db> <user> <pwd> <mongo-url>

All arguements except <mongo-url> are required, this tool does not make sense without --auth.
And don't run MongoDB without --auth!

mongodb-logpath:    It's not really a path, but the mongod
                    log to corrrelate operations to logged on users.

auth-db:            DB to authenticate against
user:               Um, user
pwd:                The password
endpoint:           host:port of mongod to connect to 
                    defaults to the default for the mongo shell
end-of-usage
}
if [ "$#" -ne 4 ] || [ "$1" = "--help" ]; then
    usage
    exit
fi

log=$1
auth=0
if [ -n "$2" ]
then
    auth=1
    db=$2
    user=$3
    pwd=$4
    mongohost=$5
fi
mongohost="localhost:27017"
if [ -n "$5" ]
then
    mongohost=$5
fi

opScript=$(cat << 'end-opScript'
db.currentOp(true).inprog.forEach( function(op) {
    if ( op.desc.indexOf('conn')===0 ) {
        print(op.desc+','+op.client)
    }
});
end-opScript
)

tempOutput="./.currentUsers.mongo"

# debugging, if not working for ya
#echo "host=$mongohost/$db user=$user, pwd=$pwd"
#echo "tempOutput=$tempOutput"
#echo "opScript=$opScript"

echo "$opScript" | mongo $mongohost/$db --quiet --norc -u $user -p $pwd > $tempOutput

echo "{ \"name\" : \"MongoDB Current User Report\","
echo "  \"host\" : \"$mongohost\","
echo "  \"timestamp\" : \"$(date)\","
echo "  \"users\" : ["
lineCount=$(wc -l < $tempOutput)
#echo "lineCount=$lineCount"
for line in $(cat $tempOutput)
do
    ((lineCounter++))
    #echo "lineCounter=$lineCounter"
    conn=$(echo $line | cut -d, -f 1)
    client=$(echo $line | cut -d, -f 2)
    g=$(grep "$conn" $log | grep "authenticated")
    if [ -n "$g" ]
    then
        db=$(echo $g | rev | cut -d' ' -f 1 | rev)
        uuu=$(echo $g| rev | cut -d' ' -f 3 | rev)

        outLine="{ \"user\": \"$uuu\", \"db\": \"$db\", \"client\" : \"$client\"}"
        if [ "$lineCounter" -lt "$lineCount" ]; then
            outLine="$outLine,"
        fi
        echo "      $outLine"
    fi
done
echo "  ]"
echo "}"
rm $tempOutput
