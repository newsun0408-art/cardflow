package drive

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"golang.org/x/oauth2"
)

// persistedData holds all serialisable store data.
type persistedData struct {
	CurrentState  string                      `json:"current_state,omitempty"`
	States        map[string]bool             `json:"states"`
	Tokens        map[string]*oauth2.Token    `json:"tokens"`
	FolderIDs     map[string]string           `json:"folder_ids"`
	ImportedFiles map[string][]DriveFile      `json:"imported_files"`
}

// Store keeps OAuth state, tokens, folder IDs, and imported files.
// Data is persisted to a JSON file on disk so it survives restarts.
type Store struct {
	mu       sync.Mutex
	filePath string
	data     persistedData
}

// NewStore creates a file-backed store. The JSON file is stored under the
// application-config directory so OAuth state and tokens survive backend restarts.
func NewStore() *Store {
	dir := strings.TrimSpace(os.Getenv("APPLICATION_CONFIG_DIR"))
	if dir == "" {
		if wd, err := os.Getwd(); err == nil {
			cand := filepath.Join(wd, "application-config")
			if _, statErr := os.Stat(cand); statErr == nil {
				dir = cand
			}
		}
	}
	if dir == "" {
		if wd, err := os.Getwd(); err == nil {
			cand := filepath.Join(filepath.Dir(wd), "application-config")
			if _, statErr := os.Stat(cand); statErr == nil {
				dir = cand
			}
		}
	}
	if dir == "" {
		if exe, err := os.Executable(); err == nil {
			cand := filepath.Join(filepath.Dir(exe), "application-config")
			if _, statErr := os.Stat(cand); statErr == nil {
				dir = cand
			}
		}
	}
	if dir == "" {
		dir = filepath.Join(os.TempDir(), "cardflow-application-config")
	}
	_ = os.MkdirAll(dir, 0o755)
	path := filepath.Join(dir, "drive_store.json")

	s := &Store{
		filePath: path,
		data: persistedData{
			States:        make(map[string]bool),
			Tokens:        make(map[string]*oauth2.Token),
			FolderIDs:     make(map[string]string),
			ImportedFiles: make(map[string][]DriveFile),
		},
	}
	s.load()
	return s
}

// load reads persisted data from disk (best-effort).
func (s *Store) load() {
	b, err := os.ReadFile(s.filePath)
	if err != nil {
		return // file doesn't exist yet – that's fine
	}
	_ = json.Unmarshal(b, &s.data)
	if s.data.States == nil {
		s.data.States = make(map[string]bool)
	}
	if s.data.Tokens == nil {
		s.data.Tokens = make(map[string]*oauth2.Token)
	}
	if s.data.FolderIDs == nil {
		s.data.FolderIDs = make(map[string]string)
	}
	if s.data.ImportedFiles == nil {
		s.data.ImportedFiles = make(map[string][]DriveFile)
	}
	if s.data.CurrentState == "" && len(s.data.Tokens) == 1 {
		for state := range s.data.Tokens {
			s.data.CurrentState = state
			break
		}
	}
}

// save flushes current state to disk (must be called with mu held).
func (s *Store) save() {
	b, err := json.MarshalIndent(s.data, "", "  ")
	if err != nil {
		return
	}
	_ = os.WriteFile(s.filePath, b, 0o644)
}

func (s *Store) SaveState(_ context.Context, state string) error {
	if state == "" {
		return errors.New("state is required")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data.States[state] = true
	s.data.CurrentState = state
	s.save()
	return nil
}

func (s *Store) ValidateState(_ context.Context, state string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.data.States[state]
}

func (s *Store) SaveToken(_ context.Context, state string, token *oauth2.Token) error {
	if state == "" {
		return errors.New("state is required")
	}
	if token == nil {
		return errors.New("token is required")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data.CurrentState = state
	s.data.Tokens[state] = token
	s.save()
	return nil
}

func (s *Store) GetToken(_ context.Context, state string) (*oauth2.Token, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if tok, ok := s.data.Tokens[state]; ok {
		return tok, true
	}
	if s.data.CurrentState != "" && s.data.CurrentState != state {
		if tok, ok := s.data.Tokens[s.data.CurrentState]; ok {
			return tok, true
		}
	}
	return nil, false
}

func (s *Store) SaveFolderID(_ context.Context, state, folderID string) error {
	if state == "" {
		return errors.New("state is required")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data.CurrentState = state
	s.data.FolderIDs[state] = folderID
	s.save()
	return nil
}

func (s *Store) GetFolderID(_ context.Context, state string) (string, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if id, ok := s.data.FolderIDs[state]; ok {
		return id, true
	}
	if s.data.CurrentState != "" && s.data.CurrentState != state {
		if id, ok := s.data.FolderIDs[s.data.CurrentState]; ok {
			return id, true
		}
	}
	return "", false
}

func (s *Store) SaveImportedFiles(_ context.Context, state string, files []DriveFile) error {
	if state == "" {
		return errors.New("state is required")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data.CurrentState = state
	copied := make([]DriveFile, len(files))
	copy(copied, files)
	s.data.ImportedFiles[state] = copied
	s.save()
	return nil
}

func (s *Store) GetImportedFiles(_ context.Context, state string) ([]DriveFile, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if files, ok := s.data.ImportedFiles[state]; ok {
		copied := make([]DriveFile, len(files))
		copy(copied, files)
		return copied, true
	}
	if s.data.CurrentState != "" && s.data.CurrentState != state {
		if files, ok := s.data.ImportedFiles[s.data.CurrentState]; ok {
			copied := make([]DriveFile, len(files))
			copy(copied, files)
			return copied, true
		}
	}
	return nil, false
}

func (s *Store) keyForState(state string) string {
	return fmt.Sprintf("drive:state:%s", state)
}
