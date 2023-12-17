#!/bin/bash

# Define the hostnames and IP address
HOSTS="127.0.0.1 api.local.zetwerk.com api.local.intzetwerk.com"


# Check if the script is run with root privileges
if [[ $EUID -ne 0 ]]; then
    echo "This script must be run as root (sudo)."
    exit 1
fi

# Loop through the hostnames and add them to the hosts file
for HOST in $HOSTS; do
    if grep -q "$HOST" /etc/hosts; then
        echo "$HOST already exists in /etc/hosts. Skipping."
    else
        echo "Adding $HOST to /etc/hosts..."
        echo "127.0.0.1 $HOST" >> /etc/hosts
    fi
done

echo "Hosts added successfully."