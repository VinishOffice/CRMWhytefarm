#!/bin/bash

if [ -z "$GITHUB_USERNAME" ] || [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_USERNAME or GITHUB_TOKEN environment variables are not set."
  exit 1
fi

REPO_URL="https://$GITHUB_USERNAME:$GITHUB_TOKEN@github.com/abhishekr4a/WhyteFarmsCrm.git"
REPO_DIR="/var/www/WhyteFarmsCrm"
FRONTEND_DIR="/var/www/WhyteFarmsCrm/frontend"
BUILD_DIR="/var/www/WhyteFarmsCrm/frontend/build"
HTML_DIR="/var/www/html"


if [ ! -d "$REPO_DIR/.git" ]; then
  git clone $REPO_URL $REPO_DIR
fi


cd $REPO_DIR
git pull $REPO_URL
cd $FRONTEND_DIR

npm i -g yarn
yarn install
npm run build

if [ -d "$BUILD_DIR" ]; then
  rm -rf $HTML_DIR
  mv $BUILD_DIR $HTML_DIR
else
  echo "Error: Build directory does not exist."
  exit 1
fi

echo "Deployment completed successfully."
