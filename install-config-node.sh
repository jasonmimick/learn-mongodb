curl -O http://downloads-distro.mongodb.org/repo/redhat/os/x86_64/RPMS/mongo-10gen-2.4.10-mongodb_1.x86_64.rpm
curl -O http://downloads-distro.mongodb.org/repo/redhat/os/x86_64/RPMS/mongo-10gen-server-2.4.10-mongodb_1.x86_64.rpm
sudo yum -y install mongo-10gen-2.4.10-mongodb_1.x86_64.rpm
sudo yum -y install mongo-10gen-server-2.4.10-mongodb_1.x86_64.rpm

sudo mkdir -p /data/configdb
sudo chown ec2-user:ec2-user /data/configdb
sudo chown ec2-user:ec2-user /data
mongod --logpath /data/configdb/monogd.log --fork --configsvr
