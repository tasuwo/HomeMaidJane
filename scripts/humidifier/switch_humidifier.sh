#!/bin/bash

source ./scripts/humidifier/config.ini

python ./scripts/humidifier/python-host/switchbot.py ${MAC_ADDR} Press
