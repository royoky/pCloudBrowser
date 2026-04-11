# File Upload System Documentation

## Overview

This document describes the file upload implementation in the pCloud Browser application, including the architecture, data flow, and component interactions.

## Architecture

```mermaid
flowchart TD
    A[Frontend: AppFileUpload] -->|multipart/form-data| B[Server: /api/pcloud/files/upload]
    B -->|OAuth2 + File Data| C[pCloud API: /uploadfile]
    C -->|Response| B
    B -->|JSON Response| A
    A -->|files-uploaded event| D[Frontend: AppFileExplorer]
    D -->|refresh()| E[useListFolder Composable]
    E -->|Updated Data| D
```

## Data Flow

### 1. Frontend Upload Process

**Component**: `AppFileUpload.vue`

```typescript
// Upload process
const uploadResponse = await new Promise<UploadResponse>((resolve, reject) => {
  const xhr = new XMLHttpRequest()
  xhr.open('POST', '/api/pcloud/files/upload', true)
  
  // Progress tracking
  xhr.upload.onprogress = (progressEvent: ProgressEvent) => {
    uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
  }
  
  // Send FormData with file and metadata
  const formData = new FormData()
  formData.append('folderId', currentFolderId.value.toString())
  formData.append('filename', file.name)
  formData.append('contentType', file.type)
  formData.append('nopartial', 'true')
  formData.append('file', file)
  
  xhr.send(formData)
})
```

### 2. Server-Side Processing

**Endpoint**: `server/api/pcloud/files/upload.post.ts`

```typescript
// Server receives multipart/form-data
const multipartData = await readMultipartFormData(event)

// Extract file and parameters
const folderId = multipartData.find(part => part.name === 'folderId')?.data?.toString()
const fileData = multipartData.find(part => part.name === 'file')?.data

// Forward to pCloud with OAuth2 authentication
const formData = new FormData()
formData.append('folderid', folderId)
formData.append('nopartial', '1')
formData.append('file', new Blob([fileData]), filename)

const response = await fetch(pcloudUrl, {
  method: 'POST',
  headers: { authorization: `Bearer ${token}` },
  body: formData
})

// Return generic cloud item to frontend
return {
  success: true,
  fileId: response.fileids[0],
  metadata: response.metadata[0]
}
```

### 3. Parent Component Refresh

**Component**: `AppFileExplorer.vue`

```typescript
// Listen for upload completion event
<AppFileUpload @files-uploaded="onFilesUploaded" />

// Handle refresh
const onFilesUploaded = async () => {
  try {
    await refresh() // Calls useListFolder's refresh method
  } catch (error) {
    console.error('Failed to refresh folder list:', error)
  }
}
```

## Component API

### AppFileUpload Props

| Prop | Type | Description |
|------|------|-------------|
| None | - | Self-contained upload component |

### AppFileUpload Events

| Event | Payload | Description |
|-------|---------|-------------|
| `files-uploaded` | None | Emitted when all files uploaded successfully |

### AppFileExplorer Events

| Event | Handler | Description |
|-------|---------|-------------|
| `files-uploaded` | `onFilesUploaded` | Refreshes file list after uploads |

## Error Handling

### Frontend Errors

- **Network Errors**: Handled with try/catch in uploadFiles()
- **JSON Parse Errors**: Caught in XMLHttpRequest onload
- **Validation Errors**: Displayed to user via console.error

### Server Errors

- **Authentication**: 401 errors from pCloud
- **Validation**: 400 errors for invalid parameters
- **Quota**: 402 errors when storage full
- **Not Found**: 404 errors for invalid folders

### Error Response Format

```json
{
  "error": true,
  "url": "/api/pcloud/files/upload",
  "statusCode": 400,
  "statusMessage": "Bad Request",
  "message": "Invalid folder ID - must be a number"
}
```

## Performance Considerations

### Current Implementation

- **Memory Usage**: Files loaded into memory (suitable for <50MB files)
- **Upload Speed**: Direct to pCloud after server auth
- **Refresh**: Only refreshes current folder, not entire tree

### Future Optimizations

1. **Chunked Uploads**: For files >50MB
2. **Server-Side Streaming**: Reduce memory usage
3. **Selective Refresh**: Only update affected parts of UI
4. **Caching**: Cache folder listings where appropriate

## Security

- **OAuth2 Tokens**: Never exposed to client
- **HTTPS**: All communications encrypted
- **Input Validation**: Server validates all parameters
- **File Types**: Content-Type validation

## Testing

### Manual Testing

1. **Small Files**: <1MB - ✅ Working
2. **Medium Files**: 1-50MB - ✅ Working
3. **Progress Tracking**: Visual progress bar - ✅ Working
4. **Error Handling**: Invalid folders, auth errors - ✅ Working
5. **Auto Refresh**: File list updates - ✅ Working

### Automated Testing (Future)

```typescript
// Example test case
test('uploads file successfully', async () => {
  const { uploadFile } = useUpload()
  const result = await uploadFile(testFile, '0')
  
  expect(result.success).toBe(true)
  expect(result.fileId).toBeDefined()
})
```

## Troubleshooting

### Common Issues

1. **Error 1101: Invalid request**
   - Cause: Missing or invalid folderId parameter
   - Solution: Ensure folderId is valid number

2. **Error 2008: User over quota**
   - Cause: pCloud storage limit reached
   - Solution: Show user-friendly message

3. **Upload hangs at 99%**
   - Cause: Large file hitting memory limits
   - Solution: Implement chunked uploads

4. **Files not appearing after upload**
   - Cause: Refresh event not handled
   - Solution: Check event emission/listening

## Best Practices

1. **Always validate inputs** before upload
2. **Show progress** to users for better UX
3. **Handle errors gracefully** with user-friendly messages
4. **Clean up resources** after upload completion
5. **Use events** for cross-component communication
6. **Keep components decoupled** for better maintainability

## Future Enhancements

1. **Drag and Drop**: Native drag/drop support
2. **Folder Upload**: Upload entire folders
3. **Resume Support**: Pause/resume large uploads
4. **Multiple Providers**: Google Drive, Dropbox support
5. **Background Uploads**: Web Workers for large files

## API Reference

### Frontend Components

```vue
<AppFileUpload @files-uploaded="handleUploadComplete" />
```

### Server Endpoints

- `POST /api/pcloud/files/upload` - Upload file
- `GET /api/pcloud/folders/{folderId}` - List folder contents

### Composable Functions

```typescript
const { useListFolder } = useFolder()
const { data, refresh } = useListFolder(folderId)
```

## Changelog

### v1.0 (Current)
- Basic file upload with progress
- Automatic refresh on completion
- Event-based communication
- Error handling

### v2.0 (Planned)
- Chunked uploads for large files
- Multiple provider support
- Background uploads
- Comprehensive test coverage

## Maintainers

- Primary: [Your Name]
- Review: [Team Name]

## License

MIT © [Your Company]
