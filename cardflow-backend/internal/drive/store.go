package drive

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sync"

	"golang.org/x/oauth2"
)

const sessionFilePath = "storage/google_session.json"

type persistedData struct {
	LatestState   string                  `json:"latestState"`
	Tokens        map[string]*oauth2.Token `json:"tokens"`
	FolderIDs     map[string]string       `json:"folderIDs"`
	ImportedFiles map[string][]DriveFile  `json:"importedFiles"`
}

// Store keeps OAuth state, tokens, folder IDs, and imported files in memory and persists to disk.
type Store struct {
	mu            sync.Mutex
	states        map[string]struct{}
	tokens        map[string]*oauth2.Token
	folderIDs     map[string]string
	importedFiles map[string][]DriveFile
	latestState   string
}

// NewStore creates a memory-backed repository and reloads persisted session if available.
func NewStore() *Store {
	s := &Store{
		states:        make(map[string]struct{}),
		tokens:        make(map[string]*oauth2.Token),
		folderIDs:     make(map[string]string),
		importedFiles: make(map[string][]DriveFile),
	}
	s.loadFromDisk()
	return s
}

func (s *Store) loadFromDisk() {
	data, err := os.ReadFile(sessionFilePath)
	if err != nil {
		return
	}
	var p persistedData
	if err := json.Unmarshal(data, &p); err == nil {
		if p.Tokens != nil {
			s.tokens = p.Tokens
		}
		if p.FolderIDs != nil {
			s.folderIDs = p.FolderIDs
		}
		if p.ImportedFiles != nil {
			s.importedFiles = p.ImportedFiles
		}
		s.latestState = p.LatestState
	}
}

func (s *Store) saveToDisk() {
	p := persistedData{
		LatestState:   s.latestState,
		Tokens:        s.tokens,
		FolderIDs:     s.folderIDs,
		ImportedFiles: s.importedFiles,
	}
	data, err := json.MarshalIndent(p, "", "  ")
	if err != nil {
		return
	}
	_ = os.MkdirAll(filepath.Dir(sessionFilePath), 0755)
	_ = os.WriteFile(sessionFilePath, data, 0644)
}


func (s *Store) SaveState(_ context.Context, state string) error {
	if state == "" {
		return errors.New("state is required")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.states[state] = struct{}{}
	return nil
}

func (s *Store) ValidateState(_ context.Context, state string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	_, ok := s.states[state]
	return ok
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
	s.tokens[state] = token
	s.latestState = state
	s.saveToDisk()
	return nil
}

func (s *Store) GetToken(_ context.Context, state string) (*oauth2.Token, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if state == "" {
		state = s.latestState
	}
	tok, ok := s.tokens[state]
	if !ok && s.latestState != "" {
		tok, ok = s.tokens[s.latestState]
	}
	return tok, ok
}

func (s *Store) GetLatestToken(_ context.Context) (*oauth2.Token, string, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.latestState == "" {
		return nil, "", false
	}
	tok, ok := s.tokens[s.latestState]
	return tok, s.latestState, ok
}

func (s *Store) SaveFolderID(_ context.Context, state, folderID string) error {
	if state == "" {
		return errors.New("state is required")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.folderIDs[state] = folderID
	s.saveToDisk()
	return nil
}

func (s *Store) GetFolderID(_ context.Context, state string) (string, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if state == "" {
		state = s.latestState
	}
	id, ok := s.folderIDs[state]
	if !ok && s.latestState != "" {
		id, ok = s.folderIDs[s.latestState]
	}
	return id, ok
}

func (s *Store) SaveImportedFiles(_ context.Context, state string, files []DriveFile) error {
	if state == "" {
		return errors.New("state is required")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	copied := make([]DriveFile, len(files))
	copy(copied, files)
	s.importedFiles[state] = copied
	s.saveToDisk()
	return nil
}

func (s *Store) GetImportedFiles(_ context.Context, state string) ([]DriveFile, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if state == "" {
		state = s.latestState
	}
	files, ok := s.importedFiles[state]
	if !ok && s.latestState != "" {
		files, ok = s.importedFiles[s.latestState]
	}
	if !ok {
		return nil, false
	}
	copied := make([]DriveFile, len(files))
	copy(copied, files)
	return copied, true
}

func (s *Store) keyForState(state string) string {
	return fmt.Sprintf("drive:state:%s", state)
}

