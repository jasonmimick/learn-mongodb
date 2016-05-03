!/bin/bash

# install deps
yum install cyrus-sasl-lib krb5-libs lm_sensors-libs net-snmp-agent-libs \
                net-snmp-libs openssl-libs rpm-libs tcp_wrappers-libs

echo "[mongodb-enterprise]
name=MongoDB Enterprise Repository
baseurl=https://repo.mongodb.com/yum/redhat/$releasever/mongodb-enterprise/stable/$basearch/
gpgcheck=0
enabled=1" | sudo tee -a /etc/yum.repos.d/mongodb.repo

[MongoDB]
name=MongoDB Repository
baseurl=http://downloads-distro.mongodb.org/repo/redhat/os/x86_64
gpgcheck=0
enabled=1

sudo yum install -y mongodb-enterprise
