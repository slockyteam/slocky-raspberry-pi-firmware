#!/bin/sh

apt-get update
apt-get -y install pigpio

npm install forever -g

npm install bower -g

npm install --save

bower install --save