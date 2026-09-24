# ============================================================
# Build from cardflow-backend/:
#   docker build -f deploy/Dockerfile \
#     -t cardflow-backend:<tag> \
#     .
# ============================================================

FROM golang:1.25-bookworm AS build

# ============================================================
# KHONG THAY DOI: working directory chuan cua platform
# ============================================================
RUN mkdir -p /opt/app
WORKDIR /opt/app
ENV WORK_DIR=/opt/app
# ============================================================

COPY vendor/ vendor/
COPY . .
RUN CGO_ENABLED=0 go test -mod=vendor ./...
RUN CGO_ENABLED=0 GOOS=linux go build -mod=vendor -o /out/server ./cmd/server && \
    CGO_ENABLED=0 GOOS=linux go build -mod=vendor -o /out/worker ./cmd/worker && \
    CGO_ENABLED=0 GOOS=linux go build -mod=vendor -o /out/migrate ./cmd/migrate

FROM debian:bookworm-slim

# ============================================================
# KHONG THAY DOI: working directory chuan cua platform
# ============================================================
RUN mkdir -p /opt/app
WORKDIR /opt/app
ENV WORK_DIR=/opt/app
# ============================================================

RUN groupadd -g 10001 appgroup && \
    useradd -m -u 10001 -g appgroup -s /bin/sh appuser && \
    chown -R appuser:appgroup /opt/app

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --chown=10001:10001 --chmod=755 --from=build /out/server /opt/app/server
COPY --chown=10001:10001 --chmod=755 --from=build /out/worker /opt/app/worker
COPY --chown=10001:10001 --chmod=755 --from=build /out/migrate /opt/app/migrate
COPY --chown=10001:10001 --chmod=755 deploy /opt/app/deploy
COPY --chown=10001:10001 --chmod=755 application-config /opt/app/application-config
RUN chmod -R a+x /opt/app/deploy/entrypoints && \
    chmod a+x /opt/app/deploy/entrypoint.sh

USER 10001

# KHONG THAY DOI - ports va entrypoint chuan cua platform
EXPOSE 8080 10254
ENTRYPOINT ["/opt/app/deploy/entrypoint.sh"]
