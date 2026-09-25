package drive

import (
	"context"

	"golang.org/x/oauth2"
)

// Repository persists the OAuth state, token, folder ID, and imported files for a connected Drive account.
type Repository interface {
	SaveState(ctx context.Context, state string) error
	ValidateState(ctx context.Context, state string) bool
	SaveToken(ctx context.Context, state string, token *oauth2.Token) error
	GetToken(ctx context.Context, state string) (*oauth2.Token, bool)
	GetLatestToken(ctx context.Context) (*oauth2.Token, string, bool)

	SaveFolderID(ctx context.Context, state, folderID string) error
	GetFolderID(ctx context.Context, state string) (string, bool)
	SaveImportedFiles(ctx context.Context, state string, files []DriveFile) error
	GetImportedFiles(ctx context.Context, state string) ([]DriveFile, bool)
}

