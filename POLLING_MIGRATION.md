# Migration from WebSocket to Polling for Support Chat

## Overview
This migration replaces WebSocket connections with HTTP polling for real-time communication between admins and clients in the support system.

## Changes Made

### Backend Changes

#### 1. New API Endpoints
Added polling endpoints in `backend/apps/support/views.py`:

- `GET /api/support/chats/my-chat/messages/` - User polling endpoint
- `GET /api/support/chats/{chat_id}/messages/` - Admin polling endpoint

Both endpoints support optional `since` parameter for incremental updates:
```
GET /api/support/chats/my-chat/messages/?since=2025-10-14T23:30:00.000Z
```

#### 2. Response Format
```json
{
  "messages": [
    {
      "id": "uuid",
      "message": "Hello",
      "is_from_admin": false,
      "created_at": "2025-10-14T23:30:00.000Z",
      "user_email": "user@example.com",
      "sender_name": "User Name",
      "attachment_url": null
    }
  ],
  "chat_status": "open",
  "last_updated": "2025-10-14T23:35:00.000Z"
}
```

### Frontend Changes

#### 1. Custom Polling Hook
Created `frontend/src/shared/hooks/usePolling.ts` with features:
- Configurable polling interval (default: 3 seconds)
- Enable/disable polling
- Error handling
- Automatic cleanup

#### 2. Updated Support Service
Modified `frontend/src/services/supportService.ts`:
- Added `pollMessages()` method
- Support for incremental updates with `since` parameter

#### 3. Updated Admin Service
Modified `frontend/src/services/adminService.ts`:
- Added `pollChatMessages()` method for specific chat polling

#### 4. Updated Components
- **SupportPage.tsx**: Replaced WebSocket with polling
- **AdminSupportPage.tsx**: Replaced WebSocket with polling, polls only selected chat

## How Polling Works

### User Side (SupportPage)
1. Initial load gets all messages via REST API
2. Starts polling every 3 seconds for new messages
3. Uses timestamp of last message for incremental updates
4. Only new messages are added to avoid duplicates

### Admin Side (AdminSupportPage)
1. Loads all chats initially
2. When a chat is selected, starts polling that specific chat
3. Stops polling when no chat is selected
4. Maintains separate timestamps for each chat

## Performance Considerations

### Polling Frequency
- **Current**: 3 seconds
- **Recommendation**: Can be adjusted based on server load
- **Smart polling**: Consider increasing interval when no new messages

### Database Optimization
- Messages are filtered by `created_at > since` timestamp
- Indexes on `created_at` field improve query performance
- Only new messages are transferred, reducing bandwidth

### Memory Management
- Polling automatically stops when components unmount
- Timestamps are stored in refs to prevent unnecessary re-renders
- Clean state management prevents memory leaks

## Migration Steps

1. **Deploy Backend Changes**
   ```bash
   cd backend
   python manage.py migrate  # If any new migrations
   python manage.py runserver
   ```

2. **Remove WebSocket Infrastructure** (if no longer needed)
   - Remove WebSocket URLs
   - Remove WebSocket consumers
   - Update Django settings

3. **Deploy Frontend Changes**
   ```bash
   cd frontend
   npm install  # If new dependencies
   npm run build
   ```

4. **Test the System**
   - Test user-admin communication
   - Verify real-time message delivery (within 3 seconds)
   - Test file attachments
   - Test admin chat management

## Advantages of Polling Over WebSocket

1. **Simpler Infrastructure**
   - No WebSocket server required
   - Uses existing HTTP infrastructure
   - Easier to scale horizontally

2. **Better Error Handling**
   - HTTP status codes for error handling
   - Automatic retry mechanisms
   - No connection drops

3. **Easier Debugging**
   - Standard HTTP requests in network tab
   - Clear request/response cycle
   - No persistent connection issues

4. **Load Balancer Friendly**
   - Works with any HTTP load balancer
   - No sticky sessions required
   - Better for microservices architecture

## Configuration Options

### Polling Interval
To change polling interval, modify the `usePolling` hook usage:

```typescript
usePolling(pollForMessages, {
  interval: 5000, // 5 seconds instead of 3
  enabled: !loading && !!user
});
```

### Error Handling
Add custom error handling:

```typescript
usePolling(pollForMessages, {
  interval: 3000,
  enabled: !loading && !!user,
  onError: (error) => {
    console.error('Polling failed:', error);
    // Custom error handling logic
  }
});
```

## Monitoring

Monitor these metrics after deployment:
- API response times for polling endpoints
- Database query performance
- Client-side error rates
- Message delivery latency (should be < 3 seconds)

## Rollback Plan

If issues occur, rollback is simple:
1. Revert frontend to previous WebSocket version
2. Re-enable WebSocket infrastructure
3. Backend polling endpoints can remain (no harm)

The polling endpoints are additive and don't break existing functionality.