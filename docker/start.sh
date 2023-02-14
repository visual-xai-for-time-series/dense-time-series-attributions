#!/bin/sh

export LC_ALL=C.UTF-8
export LANG=C.UTF-8

cd /app && uvicorn app:app --host 0.0.0.0 --port 8000 &

nginx -g "daemon off;"
