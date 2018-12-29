#!/bin/bash

source ./scripts/light/config.ini

case $1 in
  on)
    curl -i "http://${ADDRESS}/messages" -H "X-Requested-With: curl" -d ${ON_SIGNAL};;
  off)
    curl -i "http://${ADDRESS}/messages" -H "X-Requested-With: curl" -d ${OFF_SIGNAL};;
  *)
    echo "unknown command ${1}"
esac
