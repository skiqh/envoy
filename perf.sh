#!/bin/bash

if [[ -z "$1" ]]; then
  export USERCOUNT="10"
else
  export USERCOUNT="$1"
fi

#export LOG_FORMAT=combined
export ENVOY_ACCESS="id" 
export ENVOY_DATABASE_NAME="perftest_${USERCOUNT}_user"
export COUCH_HOST="$COUCH_URL"
export PORT=8000
export AUTH_STRATEGY=basic
#export NODE_OPTIONS=--max_old_space_size=16384
echo "Performance test with $USERCOUNT users. Using database $ENVOY_DATABASE_NAME"
node perf.js
