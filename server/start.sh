#!/bin/bash

SERVER_HOSTNAME=vault.face26.com
SERVER_PORT=4000
export SERVER_URL=http://$SERVER_HOSTNAME:$SERVER_PORT


npm run dev -- --hostname $SERVER_HOSTNAME --port $SERVER_PORT
