package sample

import (
	"context"

	"github.com/bangdinh/go-kit/database/postgres"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

// Store implements Repository using PostgreSQL.
type Store struct {
	pool  *pgxpool.Pool
	log   *zap.Logger
	cache *Cache
}

// NewStore creates a new PostgreSQL-backed repository.
func NewStore(pool *pgxpool.Pool, log *zap.Logger, cache *Cache) *Store {
	return &Store{pool: pool, log: log, cache: cache}
}

// Create inserts a new sample.
func (s *Store) Create(ctx context.Context, e Sample) error {
	s.log.Debug("SQL: insert sample", zap.String("id", e.ID))
	db := postgres.GetDBTX(ctx, s.pool)
	_ = db // TODO: db.Exec(ctx, "INSERT INTO samples (id, name) VALUES ($1,$2)", e.ID, e.Name)
	// On DB failure, return a typed error so the HTTP layer maps it correctly:
	//   import apperrors "github.com/bangdinh/go-kit/errors"
	//   return apperrors.InternalErrorWrap("insert sample failed", err)  // -> 500
	return nil
}

// GetByID fetches a sample by ID, checking cache first.
func (s *Store) GetByID(ctx context.Context, id string) (Sample, error) {
	// 1. Check cache (read-through)
	if s.cache != nil {
		if entry, ok := s.cache.Get(ctx, id); ok {
			return entry, nil
		}
	}

	// 2. Query DB
	s.log.Debug("SQL: select sample", zap.String("id", id))
	db := postgres.GetDBTX(ctx, s.pool)
	_ = db
	result := Sample{}
	// TODO: real query + typed-error pattern (imports: stderrors "errors", "github.com/jackc/pgx/v5",
	//       apperrors "github.com/bangdinh/go-kit/errors"):
	//   err := db.QueryRow(ctx, "SELECT id, name FROM samples WHERE id=$1", id).Scan(&result.ID, &result.Name)
	//   if stderrors.Is(err, pgx.ErrNoRows) {
	//       return Sample{}, apperrors.NotFound("sample not found")        // -> 404
	//   }
	//   if err != nil {
	//       return Sample{}, apperrors.InternalErrorWrap("select sample failed", err) // -> 500
	//   }

	// 3. Populate cache
	if s.cache != nil {
		s.cache.Set(ctx, id, result)
	}
	return result, nil
}
