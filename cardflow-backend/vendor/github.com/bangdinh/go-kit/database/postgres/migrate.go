package postgres

import (
	"errors"
	"fmt"
	"io/fs"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

func MigrateUp(dsn string, migrations fs.FS, dir string) error {
	return runMigrate(dsn, migrations, dir, true)
}

func MigrateDown(dsn string, migrations fs.FS, dir string) error {
	return runMigrate(dsn, migrations, dir, false)
}

func runMigrate(dsn string, migrations fs.FS, dir string, up bool) error {
	source, err := iofs.New(migrations, dir)
	if err != nil {
		return fmt.Errorf("creating migration source: %w", err)
	}

	m, err := migrate.NewWithSourceInstance("iofs", source, dsn)
	if err != nil {
		return fmt.Errorf("creating migrator: %w", err)
	}
	defer m.Close()

	var migrateErr error
	if up {
		migrateErr = m.Up()
	} else {
		migrateErr = m.Down()
	}

	if migrateErr != nil && !errors.Is(migrateErr, migrate.ErrNoChange) {
		return fmt.Errorf("running migrations: %w", migrateErr)
	}

	return nil
}
