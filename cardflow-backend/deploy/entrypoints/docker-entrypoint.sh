#!/bin/sh
# Update MAIN_PROCESS_SCRIPT if you rename the binary in Dockerfile.
MAIN_PROCESS_SCRIPT="/opt/app/server"

exec $MAIN_PROCESS_SCRIPT
