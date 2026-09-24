package config

import (
	"fmt"
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
)

var validate *validator.Validate

func init() {
	validate = validator.New(validator.WithRequiredStructEnabled())

	validate.RegisterTagNameFunc(func(fld reflect.StructField) string {
		if name := fld.Tag.Get("mapstructure"); name != "" && name != "-" {
			if idx := strings.Index(name, ","); idx != -1 {
				name = name[:idx]
			}
			return name
		}
		return fld.Name
	})
}

func Validate(cfg *Config) error {
	err := validate.Struct(cfg)
	if err == nil {
		return nil
	}
	validationErrors, ok := err.(validator.ValidationErrors)
	if !ok {
		return err
	}

	var msgs []string
	for _, e := range validationErrors {
		msgs = append(msgs, fmt.Sprintf(
			"  - '%s': failed '%s' validation (got: %v)",
			e.Namespace(), e.Tag(), e.Value(),
		))
	}
	return fmt.Errorf("config validation failed:\n%s", strings.Join(msgs, "\n"))
}
