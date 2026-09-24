package util

import "strings"

func FirstAddr(addrs []string) string {
	if len(addrs) == 0 {
		return ""
	}
	return addrs[0]
}

func JoinAddrs(addrs []string) string {
	return strings.Join(addrs, ",")
}
