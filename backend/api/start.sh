#!/bin/bash
# Get port from environment variable or default to 10000
PORT=${PORT:-10000}
echo "Starting server on port $PORT"
uvicorn zephra_api:app --host 0.0.0.0 --port $PORT