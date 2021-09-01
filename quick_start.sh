#!/bin/bash

# client
cd ./client
npm install
npm run build

# server
cd ../server
npm install
./start.sh

tmux rename-session vault
