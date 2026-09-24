package util

import (
	"net"
	"strconv"
)

func ParseHostPort(addr string) (host string, port int) {
	host, portStr, err := net.SplitHostPort(addr)
	if err != nil {
		return "0.0.0.0", 8080
	}
	port, _ = strconv.Atoi(portStr)
	return
}
