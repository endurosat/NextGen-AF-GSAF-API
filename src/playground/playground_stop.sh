#!/bin/bash

# Assign the first input parameter as the app id
app_id="$1"

if [ -z "$app_id" ]; then
    echo "No app id provided. Exiting."
    exit 1
fi

gateway_image_name="${app_id}-gateway-image"
gateway_container_name="${app_id}-gateway-container"
esps_api_image_name="${app_id}-esps-api-image"
esps_api_container_name="${app_id}-esps-api-container"

stop() {
    local container=$1
    local image=$2

    if docker ps -a | grep -q $container; then
        docker rm -f $container
    fi

    if docker images | grep -q $image; then
        docker rmi $image
    fi
}

stop $gateway_container_name $gateway_image_name

stop $esps_api_container_name $esps_api_image_name