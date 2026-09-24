#!/bin/sh

# WORKER_PROCESS_SCRIPT: câu lệnh khởi động worker (binary Go đã build sẵn
# trong image — xem deploy/Dockerfile). Args sau tên worker được entrypoint.sh
# chuyển tiếp nguyên vẹn: `docker run <image> worker --once` → `--once` tới đây.
#
# Để deploy worker lên K8S: báo DevOps tên worker ("worker") và câu lệnh chạy.
WORKER_PROCESS_SCRIPT="/opt/app/worker"

exec $WORKER_PROCESS_SCRIPT "$@"
