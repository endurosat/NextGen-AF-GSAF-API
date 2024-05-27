#!/bin/bash

# Assign the first input parameter as the app id
app_id="$1"
public_key="$2"
network_name="${app_id}-network"
gateway_image_name="${app_id}-gateway-image"
gateway_container_name="${app_id}-gateway-container"
esps_api_image_name="${app_id}-esps-api-image"
esps_api_container_name="${app_id}-esps-api-container"
payload_api_container_name="${app_id}-payload-api-container"
fpga_api_container_name="${app_id}-fpga-api-container"

if [ -z "$app_id" ]; then
    echo "No app id provided. Exiting."
    exit 1
fi

# Check if the network already exists
if ! docker network ls | grep -q $network_name; then
    docker network create $network_name
else
    echo "Network $network_name already exists."
fi

# Function to handle container and image operations
handle_container_and_image() {
    local container=$1
    local image=$2
    local path=$3

    # Check if the container exists, if so, kill and remove it
    if docker ps -a | grep -q $container; then
        docker rm -f $container
    fi

    # Check if the image exists, if so, remove it
    if docker images | grep -q $image; then
        docker rmi $image
    fi

    # Build the new image
    docker build -t $image $path
}

cd /Users/mario/nextgen/nextgen-obaf-api

git pull

npm run build



# Handle gateway container and image
handle_container_and_image $gateway_container_name $gateway_image_name "/Users/mario/nextgen/nextgen-obaf-api"

# Run the new container
docker run --name $gateway_container_name -d \
-p 7777:7777 \
-e ESPS_API_HOST=$esps_api_container_name \
-e PAYLOAD_API_HOST=$payload_api_container_name \
-e FPGA_API_HOST=$fpga_api_container_name \
-e JWT_PUBLIC_KEY=$public_key \
-e SERVER_PORT=7777 \
-e PRIVATE_NETWORK=$network_name \
-v /var/run/docker.sock:/var/run/docker.sock \
-v config_volume:/usr/src/app/config \
--network $network_name $gateway_image_name
# -v /home/es/nextgen/diffs:/host \

# Handle ESPS API container and image
handle_container_and_image $esps_api_container_name $esps_api_image_name "/Users/mario/nextgen/nextgen-playground-esps-api"

# Run the new container
docker run --name $esps_api_container_name -d \
-p 8080:8080 \
--network $network_name $esps_api_image_name
