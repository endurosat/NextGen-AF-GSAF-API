#!/bin/bash

appName="$1"
appPath="$2"
tarFile="$3"
appVersion="$4"

# Save the current directory and change to appPath
pushd $appPath

# if images exist with the appName, remove them
existingImages=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "^$appName")

if [ ! -z "$existingImages" ]; then
  echo "Removing existing images for $appName"
  echo "$existingImages" | xargs -n 1 docker rmi
fi

cd $appPath
npm install --only=production
npm run build

# Return to the original directory
popd

echo "Building $appName from $appPath and saving to $tarFile"
docker build -t $appName:$appVersion $appPath || exit 1
# docker buildx build --platform linux/arm64 -t $appName $appPath --load

echo "Saving $appName to $tarFile"
docker save $appName > $tarFile