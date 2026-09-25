package drive

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"golang.org/x/oauth2"
)

// Store keeps OAuth state, tokens, folder IDs, and imported files in memory for this app instance.
// In production, replace this with a persistent DB-backed implementation.
type Store struct {
	mu            sync.Mutex
	states        map[string]struct{}
	tokens        map[string]*oauth2.Token
	folderIDs     map[string]string
	importedFiles map[string][]DriveFile
	latestState   string
}

// NewStore creates a memory-backed repository.
func NewStore() *Store {
	return &Store{
		states:        make(map[string]struct{}),
		tokens:        make(map[string]*oauth2.Token),
		folderIDs:     make(map[string]string),
		importedFiles: make(map[string][]DriveFile),
	}
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

