package gateway

// MaxResourceIDs is the ceiling on ids in one bulk request.
//
// Not a number this package chose: it mirrors `max_resource_ids` in the plugin
// schema (schema.lua:59, default 200) and `FilterAllowedIn.resource_ids`
// max_length on the BRM side. Kong counts BEFORE the service is reached — over
// the cap it answers 413 TOO_MANY_RESOURCES and the handler never runs, so
// validating a larger number here would only produce a confusing error.
//
// Split into batches rather than raising it. The cap must also stay under
// Kong's `client_body_buffer_size`: past the buffer `get_body()` returns nil and
// the plugin answers 413 with no id ever counted.
const MaxResourceIDs = 200

// BulkRequest is the body contract for a bulk endpoint — a URL carrying
// `/type/{rtype}` but no `/id/{rid}` (kong-convention.md §2). Embed it:
//
//	type MoveRequest struct {
//	    Body struct {
//	        gateway.BulkRequest
//	        TargetGroupID string `json:"targetGroupId"`
//	    }
//	}
//
// Kong reads `resource_ids` out of the body itself and asks BRM whether the
// caller may act on every one of them, BEFORE forwarding. So this field is not
// the service's to name.
//
// ⚠️ `resource_ids` is snake_case ON PURPOSE — the one documented exception to
// the camelCase rule for JSON fields. The plugin looks up a fixed key
// (convention.lua:106); renaming it to `resourceIds` yields
// 400 RESOURCE_IDS_REQUIRED at the gateway, which reads like "the client forgot
// a field" rather than "we spelled it the house way".
//
// Three rules that follow from Kong, not from taste:
//
//  1. **POST always**, even when the operation is a read — the ids need a body.
//  2. **One resource_type per request.** Kong asks BRM about a single type.
//  3. **Every id needing a permission check goes in here.** Putting one id on
//     the path and another in a sibling body field means only the path one is
//     checked — see the #move example in kong-convention.md §2.
//
// Bulk is also the ONLY way to have more than one resource checked in a single
// request, even when there are exactly two and nothing about the operation is
// "bulk".
type BulkRequest struct {
	ResourceIDs []string `json:"resource_ids" jsonschema:"required,minItems=1,maxItems=200"`
}
