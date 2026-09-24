package observability

import (
	stderrors "errors"
	"net/http"

	apperrors "github.com/bangdinh/go-kit/errors"
	"github.com/labstack/echo/v4"
)

// HTTPStatusFromError trả status mà error handler của core SẼ render cho error
// này — tức là thứ client thật sự nhận được.
//
// Vì sao phải có một hàm riêng thay vì đọc `c.Response().Status`: Echo gọi
// HTTPErrorHandler trong ServeHTTP, tức là SAU KHI toàn bộ chuỗi middleware đã
// tháo xong. Mọi middleware muốn biết status — log, metric, audit, tracing —
// đều chạy TRƯỚC thời điểm đó, và đọc được mặc định 200 cho một request lỗi.
//
// Đặt ở đây vì đây là gói THẤP NHẤT mà cả `server/echo` lẫn middleware đo đạc
// đều với tới được (server/echo -> observability, không có chiều ngược lại).
//
// Ba nhánh, và nhánh AppError là nhánh hay bị quên nhất: nó là kiểu lỗi mà
// service thật sự dùng, nhưng không phải `*echo.HTTPError` nên rơi hết vào
// nhánh mặc định 500 nếu chỉ kiểm mỗi HTTPError (RPA-4825).
func HTTPStatusFromError(err error) int {
	if err == nil {
		return http.StatusOK
	}

	var appErr *apperrors.AppError
	if apperrors.As(err, &appErr) {
		return apperrors.ToProblemDetail(err, "").Status
	}

	var he *echo.HTTPError
	if stderrors.As(err, &he) {
		return he.Code
	}

	return http.StatusInternalServerError
}
