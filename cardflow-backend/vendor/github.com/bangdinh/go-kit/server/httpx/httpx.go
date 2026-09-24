// Package httpx cung cấp các adapter gói sẵn "flow chuẩn" của một HTTP handler
// go-kit, để mọi endpoint tuân thủ cùng một trình tự mà không thể bỏ sót bước:
//
//	bind + validate (JSON Schema)  ->  map RequestModel -> Command
//	                               ->  gọi service                     ->  render
//
// Ba việc dễ quên đã được "bake in":
//   - Validate FORMAT ở cổng vào bằng middleware/validation.BindAndValidate.
//   - Lỗi: chỉ `return err`; central error handler (server/echo) render RFC 9457 ProblemDetail.
//   - Success: bọc trong envelope chuẩn của package response (Data / Page).
//
// Endpoint chỉ khai 3 mảnh khác nhau: cfg schema, hàm map RequestModel->Command,
// và service method. Compiler ép đủ tham số -> thiếu là không build được.
//
// Đây KHÔNG phải kế thừa (Go không có): là generic higher-order function. Endpoint
// đặc thù (upload, stream, webhook) cứ viết handler tường minh — đừng ép vào đây.
package httpx

import (
	"context"
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/bangdinh/go-kit/middleware/validation"
	"github.com/bangdinh/go-kit/response"
)

// Handle: bind+validate Req, map -> In (Command), gọi action -> Out,
// trả 200 với envelope {"data": Out}. Dùng cho GET/POST trả 1 resource.
func Handle[Req any, In any, Out any](
	cfg validation.Config,
	mapReq func(*Req) In,
	action func(ctx context.Context, in In) (Out, error),
) echo.HandlerFunc {
	return func(c echo.Context) error {
		req, err := validation.BindAndValidate[Req](c, cfg)
		if err != nil {
			return err
		}
		out, err := action(c.Request().Context(), mapReq(req))
		if err != nil {
			return err
		}
		return c.JSON(http.StatusOK, response.NewData(out))
	}
}

// HandleCreated: như Handle nhưng trả 201. Nếu location != nil, set header Location
// tính từ Out (vd func(d) string { return "/api/v1/products/" + d.ID }).
func HandleCreated[Req any, In any, Out any](
	cfg validation.Config,
	mapReq func(*Req) In,
	action func(ctx context.Context, in In) (Out, error),
	location func(Out) string,
) echo.HandlerFunc {
	return func(c echo.Context) error {
		req, err := validation.BindAndValidate[Req](c, cfg)
		if err != nil {
			return err
		}
		out, err := action(c.Request().Context(), mapReq(req))
		if err != nil {
			return err
		}
		if location != nil {
			c.Response().Header().Set(echo.HeaderLocation, location(out))
		}
		return c.JSON(http.StatusCreated, response.NewData(out))
	}
}

// HandleList: action trả về items + page meta; render 200 với envelope
// {"data": [...], "page": {...}}. Dùng cho endpoint collection + pagination.
func HandleList[Req any, In any, Out any](
	cfg validation.Config,
	mapReq func(*Req) In,
	action func(ctx context.Context, in In) ([]Out, response.PageMeta, error),
) echo.HandlerFunc {
	return func(c echo.Context) error {
		req, err := validation.BindAndValidate[Req](c, cfg)
		if err != nil {
			return err
		}
		items, meta, err := action(c.Request().Context(), mapReq(req))
		if err != nil {
			return err
		}
		return c.JSON(http.StatusOK, response.NewPage(items, meta))
	}
}

// HandleNoContent: action chỉ gây side-effect, không trả body; render 204.
// Dùng cho DELETE, ack, và các thao tác không có nội dung trả về.
func HandleNoContent[Req any, In any](
	cfg validation.Config,
	mapReq func(*Req) In,
	action func(ctx context.Context, in In) error,
) echo.HandlerFunc {
	return func(c echo.Context) error {
		req, err := validation.BindAndValidate[Req](c, cfg)
		if err != nil {
			return err
		}
		if err := action(c.Request().Context(), mapReq(req)); err != nil {
			return err
		}
		return c.NoContent(http.StatusNoContent)
	}
}
