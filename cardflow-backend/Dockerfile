FROM golang:alpine AS builder

WORKDIR /app

RUN apk add --no-cache git ca-certificates tzdata

COPY go.mod go.sum ./
RUN go mod download || true

COPY internal/ ./internal/
COPY cmd/api/ ./cmd/api/

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/cardflow-api ./cmd/api

FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
COPY --from=builder /app/cardflow-api /app/cardflow-api

EXPOSE 8080

ENTRYPOINT ["/app/cardflow-api"]
