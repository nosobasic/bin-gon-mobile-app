## BinGone Backend API (Node.js + Express + MongoDB)

Production-ready REST API for the BinGone mobile app. Implements authentication, listings with geospatial search, categories, stories, admin analytics, profile image uploads, reward tiers system, and payment processing. Built with ES Modules.

### Tech Stack
- **Runtime**: Node.js, ES Modules
- **Framework**: Express
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT (bearer)
- **Security/HTTP**: bcrypt, cors, dotenv, morgan
- **Uploads**: multer (local disk); can be swapped for S3 in prod
- **Payments**: Stripe integration for premium upgrades

## Project Structure
```
src/
  index.js                       # Server entrypoint + Socket.IO setup
  infrastructure/
    env.js                       # Environment variables loader
    database.js                  # Mongoose connection
    seedRewardTiers.js           # Reward tiers seed data
  domain/                        # Mongoose models
    user.model.js                # User schema (auth, profiles, verification, rewards)
    category.model.js            # Category schema
    listing.model.js             # Donation listing schema (geospatial)
    story.model.js               # Community story schema
    thread.model.js              # Chat thread schema (donor-receiver)
    message.model.js             # Chat message schema (real-time messaging)
    rewardTier.model.js          # Reward tier schema (Free, Premium)
    payment.model.js             # Payment transaction schema (Stripe integration)
    referral.model.js            # Referral tracking schema
  application/                   # Business logic services
    auth.service.js              # Auth business logic and DTO mapping
    password-reset.service.js    # OTP generation, email sending (Nodemailer)
    email-verification.service.js # Email verification OTP logic
  presentation/
    http/                        # REST API layer
      app.js                     # Express app composition + static serving
      middleware/
        auth.js                  # JWT guard + admin guard
      routes/
        auth.js                  # /api/auth/* (login, register, password reset)
        listings.js              # /api/listings/* (geospatial search)
        categories.js            # /api/categories/*
        stories.js               # /api/stories/*
        admin.js                 # /api/admin/* (analytics, management)
        fallbacks.js             # /api/fallbacks (external charity links)
        uploads.js               # /api/uploads/profile (Multer file uploads)
        chats.js                 # /api/chats/* (REST chat endpoints)
        rewards.js               # /api/rewards/* (reward tiers, points, referrals)
        payments.js              # /api/payments/* (Stripe payment processing)
    websocket/                   # Real-time layer
      socket-handlers.js         # Socket.IO event handlers (chat, presence)
public/                          # Static test interfaces
  chat-test.html                 # WebSocket chat testing interface
uploads/                         # User uploaded files (profile images)
```

## Getting Started
### Prerequisites
- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)

### Setup
1) Clone and install
```
npm install
```
2) Configure environment (create `.env`)
```
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/bingone
JWT_SECRET=change-me
CORS_ORIGIN=*
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```
3) Start MongoDB
- Local: run `mongod --dbpath <your-path>` or use MongoDB service
- Atlas: set `MONGODB_URI` to your Atlas connection string

4) Start the API
```
npm run dev
```
Now available at `http://localhost:4000`

### Base and Health
- `GET /` → basic API info
- `GET /health` → `{ "ok": true }`

## Authentication
JWT bearer tokens (7d). The first registered user is auto-promoted to `admin`.

User fields include: `name`, `email`, `role` (`user|admin`), `accountType` (`donor|receiver`), `phoneNumber`, `profileImageUrl`, optional `location` (GeoJSON Point), `points`, `tier` (`Free|Premium`), `referralCode`, `badges`, `isPremium`, `subscriptionStartDate`, `subscriptionEndDate`.

Frontend response mapping (`roleId`): 1=donor, 2=receiver, 3=admin.

### Register
- `POST /api/auth/register`
Body:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Passw0rd!",
  "accountType": "donor",
  "phoneNumber": "+1-555-123-4567",
  "profileImageUrl": "https://cdn.example.com/profiles/jane.jpg",
  "location": { "type": "Point", "coordinates": [-122.4, 37.8] }
}
```
201 Response:
```json
{
  "token": "JWT_TOKEN",
  "user": {
    "id": "...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "donor",
    "roleId": 1,
    "phoneNumber": "+1-555-123-4567",
    "profileImageUrl": "https://cdn.example.com/profiles/jane.jpg"
  }
}
```

### Login
- `POST /api/auth/login`
Body:
```json
{ "email": "jane@example.com", "password": "Passw0rd!" }
```
200 Response (same shape as register)

### Me
- `GET /api/auth/me` (Bearer)
- `PUT /api/auth/me` (Bearer) – update any subset of fields (e.g., `name`, `accountType`, `phoneNumber`, `profileImageUrl`, `location`)

### Email Verification on Signup
On successful registration, the API generates a 4‑digit verification code and emails it to the user. The user’s `emailVerified` flag remains `false` until verification succeeds.

- `POST /api/auth/verify-email`
Body:
```json
{ "email": "jane@example.com", "optcode": "1234" }
```
Response:
```json
{ "status": "success" }
```
Notes:
- The verification code expires in 15 minutes.
- If SMTP is not configured, the code is logged to the server console in development: `[DEV] Registration OTP for email: 1234`.
- If SMTP is configured correctly, the code is emailed from `SMTP_FROM` to the registered email.

### Password Reset (OTP)
Public; no bearer required. OTP expires in 15 minutes.

- `POST /api/auth/forgot-password`
Body:
```json
{ "email": "user@example.com" }
```
Response:
```json
{ "status": "success", "emailSent": true }
```
In non-production, response also includes `devOtp` for local testing. If send fails you may see `emailSent: false` and `emailError` with provider details.

- `POST /api/auth/verify-otp`
Body:
```json
{ "email": "user@example.com", "optcode": "1234" }
```
Response:
```json
{ "status": "success" }
```

- `POST /api/auth/reset-password`
Body:
```json
{ "email": "user@example.com", "newPassword": "NewPass123!", "conformPasswrod": "NewPass123!" }
```
Response:
```json
{ "status": "success" }
```

## Categories
- `GET /api/categories` (public)
- `POST /api/categories` (admin)
```json
{ "name": "Clothes", "slug": "clothes" }
```
- `PUT /api/categories/:id` (admin)
- `DELETE /api/categories/:id` (admin)

## Listings (Geospatial)
Listings have a GeoJSON Point (`location`) and support geospatial search.

- `POST /api/listings` (Bearer)
```json
{
  "title": "Winter Coat",
  "description": "Warm and clean",
  "images": ["https://example.com/coat.jpg"],
  "categoryId": "<categoryId>",
  "location": { "type": "Point", "coordinates": [-122.4, 37.8] },
  "address": "123 Street"
}
```
201 Response: created listing document

- `GET /api/listings` (public)
Query params:
  - `q` (text search on title/description)
  - `categoryId`
  - `status` (`available|claimed|removed`)
  - `lng`, `lat`, `radius` (meters) – geospatial `$near`

- `GET /api/listings/:id` (public)
- `PUT /api/listings/:id` (Bearer, owner only)
- `DELETE /api/listings/:id` (Bearer, owner only)

## Stories
- `GET /api/stories` (public) – optional `?published=true|false`
- `POST /api/stories` (Bearer) – create story
```json
{ "title": "Great pickup", "body": "We helped a family.", "images": [] }
```
- `PUT /api/stories/:id` (Bearer, author only)
- `PUT /api/stories/:id/publish` (Bearer, admin) – publish a story
- `DELETE /api/stories/:id` (Bearer, author only)

## Admin
- `GET /api/admin/analytics/overview` (admin)
- `GET /api/admin/users` (admin)
- `PUT /api/admin/users/:id/role` (admin)
```json
{ "role": "admin" }
```

## Real-time Chat (WebSocket + REST)
Enables real-time messaging between donors and receivers about specific listings using Socket.IO and REST fallbacks.

### Data Models
- **Thread**: conversation between donor and receiver about a specific listing (one thread per listing-receiver pair)
- **Message**: individual messages with read receipts, typing indicators, and timestamps

### REST API Endpoints

- `GET /api/chats/threads` (Bearer)
Get user's chat threads with last message and unread counts
Response:
```json
[
  {
    "id": "thread_id",
    "listing": { "title": "Old TV", "images": [], "status": "available" },
    "donor": { "name": "John", "profileImageUrl": "..." },
    "receiver": { "name": "Jane", "profileImageUrl": "..." },
    "lastMessageAt": "2025-08-15T07:03:03.315Z",
    "unreadCount": 2,
    "lastMessage": {
      "content": "Is this still available?",
      "sender": { "name": "Jane" },
      "createdAt": "2025-08-15T07:03:03.315Z"
    }
  }
]
```

- `POST /api/chats/threads` (Bearer)
Create/get thread for a listing (receiver contacts donor)
Body:
```json
{ "listingId": "64f...abc" }
```
Response:
```json
{
  "id": "thread_id",
  "listing": { "title": "Old TV", ... },
  "donor": { "name": "John", ... },
  "receiver": { "name": "Jane", ... },
  "lastMessageAt": "2025-08-15T07:03:03.315Z",
  "unreadCount": 0
}
```

- `GET /api/chats/threads/:threadId/messages` (Bearer)
Get message history with pagination
Query params: `page=1`, `limit=50`
Response:
```json
{
  "messages": [
    {
      "id": "message_id",
      "content": "Hello!",
      "messageType": "text",
      "sender": { "name": "Jane", "profileImageUrl": "..." },
      "status": "read",
      "readAt": "2025-08-15T07:05:00.000Z",
      "createdAt": "2025-08-15T07:03:03.315Z"
    }
  ],
  "pagination": { "page": 1, "limit": 50, "hasMore": false }
}
```

- `POST /api/chats/threads/:threadId/messages` (Bearer)
Send message via REST (fallback)
Body:
```json
{
  "content": "Is this still available?",
  "messageType": "text",
  "attachmentUrl": "https://example.com/image.jpg"
}
```

### WebSocket Events (Socket.IO)

**Authentication**: Include JWT token in connection:
```javascript
const socket = io('http://localhost:4000', {
  auth: { token: 'your_jwt_token' }
});
```

**Thread Management**:
- Emit `join_thread`: `{ threadId: "thread_id" }`
- Emit `leave_thread`: `{ threadId: "thread_id" }`
- Listen `joined_thread`: `{ threadId: "thread_id" }`
- Listen `left_thread`: `{ threadId: "thread_id" }`

**Real-time Messaging**:
- Emit `send_message`: 
```json
{
  "threadId": "thread_id",
  "content": "Hello!",
  "messageType": "text",
  "attachmentUrl": "https://example.com/file.jpg"
}
```
- Listen `message_received`:
```json
{
  "id": "message_id",
  "threadId": "thread_id",
  "content": "Hello!",
  "sender": { "id": "user_id", "name": "Jane" },
  "status": "sent",
  "createdAt": "2025-08-15T07:03:03.315Z"
}
```

**Typing Indicators**:
- Emit `typing_start`: `{ threadId: "thread_id" }`
- Emit `typing_stop`: `{ threadId: "thread_id" }`
- Listen `user_typing`: `{ userId: "user_id", threadId: "thread_id", typing: true }`

**Read Receipts**:
- Emit `mark_messages_read`: `{ threadId: "thread_id" }`
- Listen `messages_read`: `{ userId: "user_id", threadId: "thread_id", readAt: "..." }`

**Presence Status**:
- Listen `user_status`: `{ userId: "user_id", status: "online|offline" }`
- Listen `user_joined_thread`: `{ userId: "user_id", threadId: "thread_id" }`
- Listen `user_left_thread`: `{ userId: "user_id", threadId: "thread_id" }`

**Error Handling**:
- Listen `error`: `{ message: "Error description" }`

### Testing the Chat System

**Browser Test Interface**:
Visit `http://localhost:4000/test/chat-test.html` for a complete WebSocket testing interface.

**Postman Workflow**:
1. Register two users (donor and receiver)
2. Donor creates a listing → get `listingId`
3. Receiver creates thread: POST `/api/chats/threads` with `{ "listingId": "..." }`
4. Get thread messages: GET `/api/chats/threads/:threadId/messages`
5. Send messages: POST `/api/chats/threads/:threadId/messages`

**WebSocket Test Workflow**:
1. Open browser test interface in two tabs
2. Connect both tabs with different user JWT tokens
3. Create/join the same thread in both tabs
4. Send real-time messages, test typing indicators
5. Verify read receipts and online/offline status

### Security & Features
- JWT authentication required for all chat operations
- Thread access control (only donor and receiver can access)
- Message validation (max 2000 characters)
- Automatic unread count management
- One thread per listing-receiver pair (prevents spam)
- Typing indicators with auto-timeout
- Online/offline presence tracking
- Message read receipts
- Pagination for message history

## Reward Tiers System
Comprehensive reward system with points, tiers, referrals, and premium upgrades. Supports both points-based and payment-based upgrades.

### Reward Tiers
- **Free (Community Member)**: Default tier with basic benefits
- **Premium**: $4.99/month or 200 points - Enhanced features and priority

### Get User Reward Status
- `GET /api/rewards/status` (Bearer)
Returns user's current points, tier, referral code, progress to next tier, and available benefits.
Response:
```json
{
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "points": 130,
    "tier": "Free",
    "referralCode": "ABC1234",
    "badges": [],
    "isPremium": false
  },
  "currentTier": {
    "name": "Free",
    "displayName": "Community Member",
    "benefits": [
      {
        "title": "Unlimited Donation Posts",
        "description": "Post as many donation items as you want",
        "type": "feature"
      }
    ]
  },
  "progressToNext": {
    "targetTier": "Premium",
    "targetPoints": 200,
    "currentPoints": 130,
    "progress": 65
  },
  "availableTiers": [...]
}
```

### Get All Reward Tiers
- `GET /api/rewards/tiers` (public)
Returns all available reward tiers with their benefits and requirements.
Response:
```json
[
  {
    "name": "Free",
    "displayName": "Community Member",
    "pointThreshold": 0,
    "monthlyPrice": 0,
    "pointUpgradeCost": null,
    "benefits": [...],
    "sortOrder": 1
  }
]
```

### Get Tier Benefits
- `GET /api/rewards/tiers/:tierName/benefits` (public)
Get benefits for a specific tier.
Example: `GET /api/rewards/tiers/Premium/benefits`

### Upgrade with Points
- `POST /api/rewards/upgrade/points` (Bearer)
Upgrade tier using accumulated points.
Body:
```json
{
  "targetTier": "Premium"
}
```
Response:
```json
{
  "message": "Upgrade successful",
  "user": {
    "points": 0,
    "tier": "Premium",
    "badges": ["Basic Donor Badge"]
  }
}
```

### Redeem Points for Listing Boost
- `POST /api/rewards/redeem/boost` (Bearer)
Premium users can redeem 50 points for listing boost.
Body:
```json
{
  "pointsToRedeem": 50,
  "listingId": "listing_id_here"
}
```

### Referral System

#### Get Referral Information
- `GET /api/rewards/referral` (Bearer)
Returns user's referral code and statistics.
Response:
```json
{
  "referralCode": "ABC1234",
  "totalReferrals": 5,
  "successfulReferrals": 3,
  "pointsEarned": 30
}
```

#### Process Referral Signup
- `POST /api/rewards/referral/signup` (public)
Record when a new user signs up with a referral code.
Body:
```json
{
  "referralCode": "ABC1234",
  "userId": "new_user_id"
}
```

### Points System

#### Award Points for Donation
- `POST /api/rewards/points/donation` (Bearer)
Award 5 points for each donated item.
Body:
```json
{
  "donationId": "donation_id_here"
}
```
Response:
```json
{
  "message": "Points awarded for donation",
  "pointsAwarded": 5,
  "totalPoints": 135
}
```

#### Award Points for Successful Referral
- `POST /api/rewards/points/referral` (Bearer)
Award 10 points for successful referral.
Body:
```json
{
  "referralId": "referral_id_here"
}
```

## Payment Processing (Stripe)
Premium upgrades and subscription management using Stripe payment gateway.

### Create Payment Intent
- `POST /api/payments/create-payment-intent` (Bearer)
Create Stripe payment intent for tier upgrade.
Body:
```json
{
  "targetTier": "Premium",
  "paymentMethodType": "card"
}
```
Response:
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentId": "payment_id",
  "amount": 499,
  "currency": "usd"
}
```

### Confirm Payment
- `POST /api/payments/confirm-payment` (Bearer)
Confirm successful payment and upgrade user tier.
Body:
```json
{
  "paymentId": "payment_id_from_previous_response",
  "paymentIntentId": "pi_xxx_from_stripe"
}
```
Response:
```json
{
  "message": "Payment confirmed and upgrade successful",
  "user": {
    "tier": "Premium",
    "isPremium": true,
    "badges": ["Super Donor Badge"],
    "subscriptionEndDate": "2025-02-15T00:00:00.000Z"
  },
  "payment": {
    "id": "payment_id",
    "amount": 499,
    "status": "completed"
  }
}
```

### Get Payment History
- `GET /api/payments/history` (Bearer)
Returns user's payment history with pagination.
Response:
```json
{
  "payments": [
    {
      "id": "payment_id",
      "amount": 499,
      "currency": "usd",
      "status": "completed",
      "paymentMethod": "card",
      "upgradeType": "premium_subscription",
      "targetTier": "Premium",
      "description": "Upgrade to Premium tier",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "paidAt": "2025-01-15T10:31:00.000Z"
    }
  ]
}
```

### Stripe Webhook
- `POST /api/payments/webhook`
Stripe webhook endpoint for payment confirmations and failures. Automatically processes successful payments and updates user tiers.

## Fallbacks
- `GET /api/fallbacks` (public)
Returns trusted external links for Salvation Army locator and 211 United Way.

## Uploads (Profile Image)
Local dev implementation (public static hosting via `/uploads`). For production, prefer S3 presigned uploads.

- `POST /api/uploads/profile` (Bearer, multipart/form-data)
  - Body (form-data): key `file` (type File), choose an image (jpeg/png/webp, <5MB)
  - Response `201`:
```json
{
  "url": "http://localhost:4000/uploads/<random>.jpg",
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "role": "donor",
    "roleId": 1,
    "phoneNumber": "...",
    "profileImageUrl": "http://localhost:4000/uploads/<random>.jpg"
  }
}
```

## Error Handling
- Standard JSON errors: `{ "message": "..." }`
- Common statuses: `400` (validation/invalid id), `401` (missing/invalid token), `403` (forbidden), `404` (not found), `500` (unexpected)

## Security & Production Notes
- Use a strong `JWT_SECRET` in production
- Restrict `CORS_ORIGIN` to your app domains
- Consider `helmet`, rate limiting, input validation (zod/joi)
- Prefer MongoDB Atlas for production
- Replace local multer disk storage with S3 presigned uploads

### Payment Processing (Stripe)
Environment variables for Stripe integration:
```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**Setup Instructions:**
1. Create a Stripe account at https://stripe.com
2. Get your test API keys from the Stripe dashboard
3. Set up webhook endpoint: `https://yourdomain.com/api/payments/webhook`
4. Configure webhook events: `payment_intent.succeeded`, `payment_intent.payment_failed`

**Testing Payments:**
- Use test card numbers: `4242424242424242` (Visa), `5555555555554444` (Mastercard)
- Use any future expiry date and any 3-digit CVC
- Test declined payments with: `4000000000000002`

### Email Delivery (Nodemailer)
Environment variables for SMTP (TLS v1.2 enforced):
```
SMTP_FROM=sender@yourdomain.com
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=465            # or 587
SMTP_SECURE=true         # true for 465, false for 587
SMTP_USER=sender@yourdomain.com
SMTP_PASS=********
SMTP_REQUIRE_TLS=true    # enforces TLS
SMTP_DEBUG=false         # set true to log SMTP debug
```

Examples:
- Gmail/Workspace (App Password required):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_FROM=you@yourdomain.com
SMTP_USER=you@yourdomain.com
SMTP_PASS=<16-char app password, no spaces>
```
- Office365/Outlook:
```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_FROM=you@yourdomain.com
SMTP_USER=you@yourdomain.com
SMTP_PASS=<password or app password>
```
- Mailtrap (testing):
```
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_SECURE=false
SMTP_FROM=no-reply@yourdomain.com
SMTP_USER=<mailtrap-user>
SMTP_PASS=<mailtrap-pass>
```

Forgot-password responses include `emailSent` and, in non-production, `devOtp` and possibly `emailError` to aid debugging.

## Scripts
```
npm run dev   # start with nodemon
npm start     # start with node
```

## Testing with Postman

### Complete API Flow
1. **Authentication**: register → login → me
2. **Core Features**: categories → listings → stories → uploads
3. **Reward System**: rewards/status → points/donation → upgrade/points → referral
4. **Admin Features**: admin/analytics → admin/users
5. **Chat System**: chats/threads → chats/messages
6. **Payment System**: payments/create-payment-intent → payments/confirm-payment (requires Stripe)

### Testing Without Stripe Keys
Most reward system endpoints work without Stripe:
- ✅ `/api/rewards/tiers` - Get all tiers
- ✅ `/api/rewards/status` - User reward status  
- ✅ `/api/rewards/points/donation` - Award points
- ✅ `/api/rewards/referral` - Referral system
- ✅ `/api/rewards/upgrade/points` - Points-based upgrades (if user has enough points)

### Testing With Stripe Keys
Payment endpoints require valid Stripe configuration:
- ❌ `/api/payments/create-payment-intent` - Create payment
- ❌ `/api/payments/confirm-payment` - Confirm payment
- ❌ `/api/payments/webhook` - Stripe webhooks

### Environment Variables for Testing
```json
{
  "baseUrl": "http://localhost:4000",
  "bearerToken": "your_jwt_token_here",
  "stripeSecretKey": "sk_test_...",
  "stripeWebhookSecret": "whsec_..."
}
```

## License
MIT


