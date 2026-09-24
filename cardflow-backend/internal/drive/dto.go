package drive

import "time"

// ConnectResponse is returned by the OAuth connect endpoint.
type ConnectResponse struct {
	State   string `json:"state"`
	AuthURL string `json:"authUrl"`
}

// CallbackResponse is returned after exchanging the Google code for a token.
type CallbackResponse struct {
	State         string      `json:"state"`
	TokenType     string      `json:"tokenType,omitempty"`
	Expiry        time.Time   `json:"expiry,omitempty"`
	Scope         string      `json:"scope,omitempty"`
	Message       string      `json:"message"`
	Connected     bool        `json:"connected"`
	AccessURL     string      `json:"accessUrl,omitempty"`
	RefreshURL    string      `json:"refreshUrl,omitempty"`
	FolderID      string      `json:"folderId,omitempty"`
	FolderName    string      `json:"folderName,omitempty"`
	ImportedFiles []DriveFile `json:"importedFiles,omitempty"`
}

// ListFilesRequest is the request payload for listing Drive files.
type ListFilesRequest struct {
	State string `json:"state"`
}

// SyncFilesResponse is returned when syncing files in the CardFlow folder.
type SyncFilesResponse struct {
	FolderID   string      `json:"folderId"`
	FolderName string      `json:"folderName"`
	Files      []DriveFile `json:"files"`
	Total      int         `json:"total"`
}

// UploadRequest is the request payload for uploading a file to Drive.
type UploadRequest struct {
	State    string `json:"state"`
	FileName string `json:"fileName"`
	Content  string `json:"content"`
	MimeType string `json:"mimeType,omitempty"`
}

// DriveFile is the public file representation returned by the API.
type DriveFile struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	MimeType   string `json:"mimeType,omitempty"`
	WebViewURL string `json:"webViewUrl,omitempty"`
	Size       string `json:"size,omitempty"`
}

