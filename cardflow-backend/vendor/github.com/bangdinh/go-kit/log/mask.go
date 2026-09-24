package log

import (
	"strings"

	"go.uber.org/zap"
)

// MaskedValue is the replacement text for sensitive fields.
const MaskedValue = "***MASKED***"

var sensitiveKeys = map[string]struct{}{
	"password":      {},
	"passwd":        {},
	"secret":        {},
	"token":         {},
	"access_token":  {},
	"refresh_token": {},
	"authorization": {},
	"auth":          {},
	"otp":           {},
	"cvv":           {},
	"credit_card":   {},
	"card_number":   {},
	"private_key":   {},
}

// IsSensitiveKey checks whether a field key name corresponds to sensitive information.
func IsSensitiveKey(key string) bool {
	clean := strings.ToLower(strings.TrimSpace(key))
	clean = strings.ReplaceAll(clean, "-", "_")
	_, ok := sensitiveKeys[clean]
	return ok
}

// MaskField returns a zap.Field masked if its key is recognized as sensitive.
func MaskField(key string, val any) zap.Field {
	if IsSensitiveKey(key) {
		return zap.String(key, MaskedValue)
	}
	return zap.Any(key, val)
}

// MaskMap returns a copy of the map with sensitive values replaced by MaskedValue.
func MaskMap(m map[string]any) map[string]any {
	if m == nil {
		return nil
	}
	result := make(map[string]any, len(m))
	for k, v := range m {
		if IsSensitiveKey(k) {
			result[k] = MaskedValue
		} else if nestedMap, ok := v.(map[string]any); ok {
			result[k] = MaskMap(nestedMap)
		} else {
			result[k] = v
		}
	}
	return result
}
