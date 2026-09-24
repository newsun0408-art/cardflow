#!/bin/sh

# Migration runner — chạy như K8S Job/init container trước khi rollout:
#   docker run <image> migrate [flags...]
# Flags được entrypoint.sh chuyển tiếp nguyên vẹn tới binary.
WORKER_PROCESS_SCRIPT="/opt/app/migrate"

exec $WORKER_PROCESS_SCRIPT "$@"
