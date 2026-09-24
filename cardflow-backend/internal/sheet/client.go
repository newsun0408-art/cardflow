package sheet

import (
	"context"

	drivefeat "github.com/bangdinh/cardflow-backend/internal/drive"
	"golang.org/x/oauth2"
	"google.golang.org/api/option"
	"google.golang.org/api/sheets/v4"
)

func newSheetsService(ctx context.Context, tok *oauth2.Token) (*sheets.Service, error) {
	client := drivefeat.NewOAuthClient(ctx, tok)
	return sheets.NewService(ctx, option.WithHTTPClient(client))
}
