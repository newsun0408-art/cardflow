package domain

import (
	"errors"
	"strings"

	"github.com/google/uuid"
)

// Public identifiers: `<prefix>_<UUIDv7 in Crockford base32>`.
//
//	sub_01M2M85R5SFGWBXMWDJ7KJJX6E
//	plan_01M2M85R5SFER9RTHAGCBZ94KX
//
// This is the identifier a service puts in its API, its logs and its outbound
// calls. It is deliberately NOT the database primary key: keep a surrogate
// `id BIGINT GENERATED ALWAYS AS IDENTITY` for relationships, and a unique
// `public_id VARCHAR(40)` holding the value from NewID. Foreign keys then stay
// 8 bytes and stable, while nothing sequential ever leaves the service.
//
// Three choices, each fixing a specific problem:
//
//   - **Prefix.** Passing a plan id where a subscription id belongs fails at the
//     edge via ValidateID, instead of surfacing as a puzzling "not found" deep
//     in a query. It also makes a log line readable without context.
//
//   - **UUIDv7, not v4.** v7 carries a timestamp in its high bits, so ids sort
//     by creation time as plain strings. B-tree inserts land at the right edge
//     of the index instead of scattering page splits across the whole tree. This
//     is the main reason to prefer NewID over uuid.NewString().
//
//   - **Crockford base32, not the 36-char UUID string.** 128 bits pack into 26
//     characters, leaving room for a prefix inside VARCHAR(40); the plain UUID
//     text form already spends 36. Crockford's alphabet also omits I, L, O and
//     U, so an id re-typed by a human cannot silently turn 1 into l or 0 into O.
//
// Adopting this is a per-service decision — domain.Entity still lets a service
// choose its own ID type. See docs/adr/0002-public-identifiers.md.

const crockford = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

// IDEncodedLen is the fixed width of 128 bits in Crockford base32.
const IDEncodedLen = 26

// MaxIDLen is the column width a service should reserve for the identifier:
// `public_id VARCHAR(40)`. It leaves 13 characters for the prefix and the
// separator, which is ample — prefixes are meant to be short.
const MaxIDLen = 40

var (
	ErrEmptyID     = errors.New("domain: id is empty")
	ErrNoPrefix    = errors.New("domain: id has no prefix")
	ErrWrongPrefix = errors.New("domain: id has the wrong prefix")
	ErrBadEncoding = errors.New("domain: id is not valid Crockford base32")
)

// NewID returns a fresh identifier for the given prefix.
//
// It panics when the prefix is long enough to push the id past MaxIDLen. That is
// a programming error, caught the first time the code runs; returning an error
// would force every call site to handle a branch that cannot happen in correct
// code.
func NewID(prefix string) string {
	if len(prefix)+1+IDEncodedLen > MaxIDLen {
		panic(ErrWrongPrefix)
	}
	return prefix + "_" + encodeCrockford(uuid.Must(uuid.NewV7()))
}

// ParseID splits an identifier into its prefix and the original UUID.
//
// The UUID round-trips exactly, so an id can be traced back to the value that
// was generated — including the timestamp UUIDv7 embeds.
func ParseID(id string) (prefix string, u uuid.UUID, err error) {
	if id == "" {
		return "", uuid.Nil, ErrEmptyID
	}
	// LastIndex, not Index: a prefix may itself contain an underscore.
	i := strings.LastIndex(id, "_")
	if i <= 0 || i == len(id)-1 {
		return "", uuid.Nil, ErrNoPrefix
	}
	u, err = decodeCrockford(id[i+1:])
	if err != nil {
		return "", uuid.Nil, err
	}
	return id[:i], u, nil
}

// ValidateID checks that an id is well formed AND carries the expected prefix.
//
// Use it at the edge — handler, consumer — to reject an id belonging to another
// aggregate. It does not replace looking the id up: a well-formed id can still
// refer to nothing.
func ValidateID(id, wantPrefix string) error {
	got, _, err := ParseID(id)
	if err != nil {
		return err
	}
	if got != wantPrefix {
		return ErrWrongPrefix
	}
	return nil
}

// encodeCrockford packs 128 bits into 26 characters, most significant first.
func encodeCrockford(u uuid.UUID) string {
	var out [IDEncodedLen]byte
	// Read the 128 bits as two 64-bit halves so the shifts below cannot overflow.
	hi := uint64(u[0])<<56 | uint64(u[1])<<48 | uint64(u[2])<<40 | uint64(u[3])<<32 |
		uint64(u[4])<<24 | uint64(u[5])<<16 | uint64(u[6])<<8 | uint64(u[7])
	lo := uint64(u[8])<<56 | uint64(u[9])<<48 | uint64(u[10])<<40 | uint64(u[11])<<32 |
		uint64(u[12])<<24 | uint64(u[13])<<16 | uint64(u[14])<<8 | uint64(u[15])

	// 26 characters x 5 bits = 130 bits; the 2 spare bits sit at the front and
	// are always zero.
	for i := IDEncodedLen - 1; i >= 0; i-- {
		out[i] = crockford[lo&0x1F]
		lo = lo>>5 | hi<<59
		hi >>= 5
	}
	return string(out[:])
}

func decodeCrockford(s string) (uuid.UUID, error) {
	if len(s) != IDEncodedLen {
		return uuid.Nil, ErrBadEncoding
	}
	var hi, lo uint64
	for i := 0; i < IDEncodedLen; i++ {
		v := strings.IndexByte(crockford, s[i])
		if v < 0 {
			return uuid.Nil, ErrBadEncoding
		}
		hi = hi<<5 | lo>>59
		lo = lo<<5 | uint64(v)
	}
	var u uuid.UUID
	for i := 0; i < 8; i++ {
		u[i] = byte(hi >> (56 - 8*i))
		u[8+i] = byte(lo >> (56 - 8*i))
	}
	return u, nil
}
