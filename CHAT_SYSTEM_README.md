# Two-Way Chat Communication System

This document describes the implementation of the two-way communication chat system between customers and admin support.

## Features Implemented

### 🔥 Customer Side
- **Mobile-first responsive design** - Chat works perfectly on mobile, tablet, and desktop
- **Order-specific support** - Users can get help for specific orders
- **Enhanced "Need Help" button** - Prominent, easy-to-find support button
- **Improved chat modal** - Beautiful, modern interface with animations
- **Category selection** - Users can categorize their issues (Order Issues, Food Quality, Delivery, Payment)
- **Real-time messaging** - Instant message delivery and receipt
- **Order context** - Chat includes order details for better support

### 👨‍💼 Admin Side
- **Dedicated Customer Support page** - Full admin interface at `/admin/support`
- **Real-time chat management** - See all active and resolved chats
- **Customer information** - Access to customer details and order history
- **Chat filtering and search** - Find specific chats quickly
- **Status management** - Mark chats as resolved
- **Message history** - Complete conversation history
- **Live notifications** - Get notified when new chats start

### 🔧 Technical Features
- **WebSocket real-time communication** - Powered by Socket.io
- **Supabase backend** - Reliable database storage
- **Mobile responsive** - Works on all screen sizes
- **Type-safe** - Full TypeScript implementation
- **Error handling** - Comprehensive error management
- **Loading states** - Smooth user experience with loading indicators

## File Structure

```
src/
├── components/
│   └── chat/
│       ├── SupportChat.tsx (Legacy - Responsive improved)
│       └── SupportChatModal.tsx (New - Mobile-first modal)
├── pages/
│   ├── OrderTracking.tsx (Updated with new chat button)
│   └── admin/
│       └── CustomerSupport.tsx (New admin interface)
├── hooks/
│   └── useSupportChat.ts (Chat logic hook)
└── context/
    └── SocketContext.tsx (WebSocket management)

server/
├── routes/
│   └── support-chat.js (REST API endpoints)
├── socket/
│   └── chatHandlers.js (WebSocket event handlers)
└── socket.js (Socket.IO setup)

pages/api/
└── support-chat/
    ├── [id].ts (Get single chat)
    ├── index.ts (List chats, create chat)
    ├── message.ts (Send message)
    ├── read-messages.ts (Mark messages as read)
    └── status.ts (Update chat status)
```

## How to Use

### For Customers
1. **From Order Tracking Page**: Click the prominent "Need Help? Start Chat" button
2. **Select Issue Category**: Choose from Order Issues, Food Quality, Delivery, or Payment
3. **Describe Problem**: Provide detailed description of the issue
4. **Chat in Real-time**: Exchange messages with support team
5. **Get Resolution**: Continue conversation until issue is resolved

### For Admins
1. **Access Support Dashboard**: Navigate to `/admin/support` in admin panel
2. **View Active Chats**: See all pending customer support requests
3. **Join Conversations**: Click on any chat to start helping the customer
4. **Review Context**: See customer details, order information, and issue description
5. **Resolve Issues**: Mark chats as resolved when done

## Database Schema

The chat system uses the `support_chats` table in Supabase with the following structure:

```sql
CREATE TABLE support_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  customer_id UUID REFERENCES customers(id),
  issue TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  messages JSONB[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  order_details JSONB,
  customer_details JSONB,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ
);
```

Each message in the messages array has the following structure:
```json
{
  "id": "uuid-string",
  "sender": "customer | admin",
  "sender_id": "uuid-string",
  "content": "message content",
  "timestamp": "ISO datetime string",
  "read": false
}
```

## API Endpoints

### REST API

#### Get All Chats
- **URL**: `/api/support-chat`
- **Method**: `GET`
- **Query Parameters**:
  - `role`: Set to 'admin' to get all chats (admin only)
  - `customerId`: Customer ID to get chats for a specific customer
- **Response**: Array of chat objects with customer and order details

#### Get Single Chat
- **URL**: `/api/support-chat/[id]`
- **Method**: `GET`
- **Response**: Single chat object with customer and order details

#### Create New Chat
- **URL**: `/api/support-chat`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "order_id": "uuid",
    "customer_id": "uuid",
    "issue": "string",
    "category": "string"
  }
  ```
- **Response**: Newly created chat object

#### Send Message
- **URL**: `/api/support-chat/message`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "chatId": "uuid",
    "content": "string",
    "sender": "customer | admin",
    "senderId": "uuid"
  }
  ```
- **Response**: Newly created message object

#### Update Chat Status
- **URL**: `/api/support-chat/status`
- **Method**: `PUT`
- **Body**:
  ```json
  {
    "status": "active | resolved",
    "resolvedBy": "uuid" // Only needed when resolving
  }
  ```
- **Response**: Updated chat object

#### Mark Messages as Read
- **URL**: `/api/support-chat/read-messages`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "chatId": "uuid",
    "userId": "uuid"
  }
  ```
- **Response**: Success status

### WebSocket Events

#### Client Events (Emitted by Frontend)

- `chat:join`: Join a chat room
  ```javascript
  socket.emit('chat:join', chatId);
  ```

- `chat:leave`: Leave a chat room
  ```javascript
  socket.emit('chat:leave', chatId);
  ```

- `chat:start`: Start a new support chat
  ```javascript
  socket.emit('chat:start', { orderId, issue, category }, callback);
  ```

- `chat:send`: Send a message
  ```javascript
  socket.emit('chat:send', { chatId, content, senderId }, callback);
  ```

- `chat:markRead`: Mark messages as read
  ```javascript
  socket.emit('chat:markRead', chatId, callback);
  ```

- `chat:resolve`: Resolve a chat
  ```javascript
  socket.emit('chat:resolve', chatId, callback);
  ```

- `chat:getByOrder`: Get chat by order ID
  ```javascript
  socket.emit('chat:getByOrder', orderId, callback);
  ```

- `admin:getChats`: Admin only - get all chats
  ```javascript
  socket.emit('admin:getChats', callback);
  ```

#### Server Events (Received by Frontend)

- `chat:message`: New message received
  ```javascript
  socket.on('chat:message', ({ chatId, message }) => {
    // Handle new message
  });
  ```

- `chat:messagesRead`: Messages marked as read
  ```javascript
  socket.on('chat:messagesRead', ({ chatId, userId }) => {
    // Update read status
  });
  ```

- `chat:resolved`: Chat resolved
  ```javascript
  socket.on('chat:resolved', ({ chatId, resolvedBy }) => {
    // Handle chat resolution
  });
  ```

- `chat:new`: New chat created (admin only)
  ```javascript
  socket.on('chat:new', ({ chat }) => {
    // Handle new chat
  });
  ```

- `chat:started`: Chat started (response to chat:start)
  ```javascript
  socket.on('chat:started', (chat) => {
    // Handle chat started
  });
  ```

## Frontend Implementation

To use the chat system on the frontend:

1. Connect to the WebSocket server:
```javascript
import io from 'socket.io-client';
import { SOCKET_URL, SOCKET_OPTIONS } from '../config/socket';

const socket = io(SOCKET_URL, {
  ...SOCKET_OPTIONS,
  auth: {
    token: userId, // Customer ID or 'admin'
    user: userData // Optional user data
  }
});
```

2. Use the WebSocket events and REST APIs as needed for your chat UI

## Example: Starting a Chat and Sending Messages

```javascript
// Start a chat
socket.emit('chat:start', {
  orderId: 'order-uuid',
  issue: 'Missing items in my order',
  category: 'order-issue'
}, (err, chat) => {
  if (err) {
    console.error('Error starting chat:', err);
    return;
  }
  
  console.log('Chat started:', chat);
  
  // Join the chat room
  socket.emit('chat:join', chat.id);
  
  // Listen for messages
  socket.on('chat:message', ({ chatId, message }) => {
    if (chatId === chat.id) {
      console.log('New message:', message);
    }
  });
  
  // Send a message
  socket.emit('chat:send', {
    chatId: chat.id,
    content: 'Hello, I need help with my order',
    senderId: 'customer-uuid'
  });
});
```

## Mobile Responsiveness

### Breakpoints
- **Mobile**: < 768px - Full-screen chat modal
- **Tablet**: 768px - 1024px - Optimized spacing and touch targets
- **Desktop**: > 1024px - Standard interface

### Mobile Optimizations
- Full-screen chat interface on mobile devices
- Large touch-friendly buttons and inputs
- Optimized typography for small screens
- Smooth animations and transitions
- Proper keyboard handling

## Security Features

- **Row Level Security (RLS)** - Users can only access their own chats
- **Admin Authentication** - Admin-only access to support dashboard
- **Input Validation** - All inputs are validated and sanitized
- **Real-time Permissions** - Socket connections verify user permissions

## Performance Considerations

- **Efficient Queries** - Optimized database queries with proper indexing
- **Message Pagination** - Large message histories are paginated
- **Connection Management** - Proper WebSocket connection lifecycle
- **Caching** - Smart caching of frequently accessed data

## Future Enhancements

1. **File Attachments** - Allow customers to send images/documents
2. **Typing Indicators** - Show when someone is typing
3. **Message Reactions** - Quick emoji reactions
4. **Auto-responses** - AI-powered initial responses
5. **Chat History Export** - Download conversation history
6. **Push Notifications** - Browser notifications for new messages
7. **Multi-language Support** - Support for multiple languages
8. **Chat Analytics** - Response times, satisfaction ratings
