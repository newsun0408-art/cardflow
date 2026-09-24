package observability

import (
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
)

// unmatchedRoute là nhãn `path` dùng cho request không khớp route nào.
//
// Bắt buộc phải gộp: echo trả c.Path() rỗng khi không khớp, và nếu lấy URL thật
// làm nhãn thì bất kỳ ai gọi /aaa, /bbb, /ccc… cũng bơm được series mới vào
// Prometheus cho tới khi nó sập. Đây là bề mặt tấn công thật, không phải lo xa.
const unmatchedRoute = "<unmatched>"

// EchoMetricsMiddleware ghi http_requests_total và http_request_duration_seconds
// cho mọi request đi qua Echo.
//
// Không có middleware này thì Metrics chỉ là các collector đã đăng ký nhưng
// không ai ghi vào — /metrics trả 200 với toàn metric mặc định của Go runtime,
// không một series nào của ứng dụng. Alert theo tỷ lệ lỗi hay latency khi đó
// không dựng được, chỉ còn CPU/RAM.
//
// Nhãn `path` là ROUTE TEMPLATE (`/users/:id`) chứ không phải path thật
// (`/users/12345`) — path thật sinh một series cho mỗi ID.
//
// Mount sớm trong chain để bao được cả thời gian của middleware phía sau:
//
//	e.Use(observability.EchoMetricsMiddleware(metrics))
func EchoMetricsMiddleware(m *Metrics) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if m == nil {
				return next(c)
			}

			start := time.Now()
			err := next(c)

			// Status phải là thứ CLIENT THẬT SỰ NHẬN.
			//
			// Hai trường hợp, và thứ tự kiểm tra ở đây là quan trọng:
			//
			//  - Response ĐÃ ghi (Committed): giữ nguyên status đó. Handler được
			//    phép ghi rồi mới trả error — middleware/validation làm đúng vậy:
			//    c.JSON(422, problem) rồi `return echo.ErrBadRequest` (400). Lấy
			//    status từ error ở đây sẽ ghi 400 trong khi trên dây là 422, và
			//    không ai phát hiện vì cả hai đều là 4xx.
			//  - CHƯA ghi gì: echo sẽ render error sau middleware này, nên suy
			//    status từ error. Ghi 200 cho một request lỗi làm sai lệch đúng
			//    thứ mà alert tỷ lệ lỗi dựa vào.
			status := c.Response().Status
			if err != nil && !c.Response().Committed {
				status = HTTPStatusFromError(err)
			}

			route := c.Path()
			if route == "" {
				route = unmatchedRoute
			}

			method := c.Request().Method
			statusText := strconv.Itoa(status)

			m.RecordHTTPRequest(method, route, statusText)
			m.ObserveHTTPRequestDuration(method, route, statusText, time.Since(start).Seconds())

			return err
		}
	}
}
