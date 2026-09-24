// Package sample — feature "sample" (vertical slice / feature-first).
//
// Một feature = một package. Vai trò tách theo FILE + hướng phụ thuộc, KHÔNG tách folder:
//
//	Domain            entity.go       Sample (+ domain mixins)
//	Boundary types    dto.go          CreateRequest · GetRequest · CreateInput · Response
//	Application       service.go      use case, business rule, Entity→DTO
//	Port              repository.go   interface Repository
//	Inbound adapter   handler.go      HTTP (server/httpx) — lái app vào
//	Outbound adapter  store.go        impl Repository (Postgres)
//	Outbound adapter  cache.go        Redis read-through
//
// Quy tắc phụ thuộc: luôn hướng VÀO trong — handler → service → Repository (port).
// store implements Repository; service KHÔNG biết Postgres/Redis (Dependency Inversion).
package sample
