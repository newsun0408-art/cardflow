package drive

import (
	"context"
	"crypto/rand"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/drive/v3"
	"google.golang.org/api/option"
)

// Config is the Google Drive OAuth configuration for this service.
type Config struct {
	ClientID     string
	ClientSecret string
	RedirectURL  string
	Scopes       []string
}

func loadGoogleDriveEnv() {
	if strings.TrimSpace(os.Getenv("GOOGLE_DRIVE_CLIENT_ID")) != "" && strings.TrimSpace(os.Getenv("GOOGLE_DRIVE_CLIENT_SECRET")) != "" {
		return
	}

	seen := map[string]struct{}{}
	addCandidate := func(dir string) {
		dir = strings.TrimSpace(dir)
		if dir == "" {
			return
		}
		clean := filepath.Clean(dir)
		if _, ok := seen[clean]; ok {
			return
		}
		seen[clean] = struct{}{}

		envPath := filepath.Join(clean, ".env")
		if _, err := os.Stat(envPath); err == nil {
			_ = godotenv.Load(envPath)
		}
	}

	if dir := strings.TrimSpace(os.Getenv("APPLICATION_CONFIG_DIR")); dir != "" {
		addCandidate(dir)
	}
	if wd, err := os.Getwd(); err == nil {
		addCandidate(wd)
		addCandidate(filepath.Join(wd, "application-config"))
		addCandidate(filepath.Join(filepath.Dir(wd), "application-config"))
	}
	if _, file, _, ok := runtime.Caller(0); ok {
		pkgDir := filepath.Dir(file)
		addCandidate(pkgDir)
		addCandidate(filepath.Join(pkgDir, "..", "..", "application-config"))
		addCandidate(filepath.Join(pkgDir, "..", "application-config"))
	}
}

func readConfig() Config {
	loadGoogleDriveEnv()

	cfg := Config{
		ClientID:     strings.TrimSpace(os.Getenv("GOOGLE_DRIVE_CLIENT_ID")),
		ClientSecret: strings.TrimSpace(os.Getenv("GOOGLE_DRIVE_CLIENT_SECRET")),
		RedirectURL:  strings.TrimSpace(os.Getenv("GOOGLE_DRIVE_REDIRECT_URL")),
		Scopes: []string{
			"https://www.googleapis.com/auth/drive.file",
			"https://www.googleapis.com/auth/spreadsheets",
		},
	}
	if cfg.RedirectURL == "" {
		cfg.RedirectURL = "http://localhost:8080/cardflow-backend/v1/drive/actions/callback"
	}
	if scopes := strings.TrimSpace(os.Getenv("GOOGLE_DRIVE_SCOPES")); scopes != "" {
		cfg.Scopes = strings.FieldsFunc(scopes, func(r rune) bool { return r == ',' || r == ';' || r == ' ' })
	}
	return cfg
}

func newOAuthConfig() *oauth2.Config {
	cfg := readConfig()
	return &oauth2.Config{
		ClientID:     cfg.ClientID,
		ClientSecret: cfg.ClientSecret,
		RedirectURL:  cfg.RedirectURL,
		Scopes:       cfg.Scopes,
		Endpoint:     google.Endpoint,
	}
}

func randomState() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("drive-%d", time.Now().UnixNano())
	}
	return fmt.Sprintf("drive-%x", b)
}

// NewOAuthClient returns an HTTP client that automatically refreshes the OAuth token.
func NewOAuthClient(ctx context.Context, tok *oauth2.Token) *http.Client {
	cfg := newOAuthConfig()
	return cfg.Client(ctx, tok)
}

// NewDriveService creates a Google Drive API client using the given OAuth token.
func NewDriveService(ctx context.Context, tok *oauth2.Token) (*drive.Service, error) {
	client := NewOAuthClient(ctx, tok)
	return drive.NewService(ctx, option.WithHTTPClient(client))
}

func newDriveService(ctx context.Context, tok *oauth2.Token) (*drive.Service, error) {
	return NewDriveService(ctx, tok)
}

