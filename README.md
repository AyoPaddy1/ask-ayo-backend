# Ask AYO Backend API

Backend API for Ask AYO Chrome Extension - Tracks user feedback, term lookups, and provides AI-powered rewrites for confused users.

## Features

- ✅ **Feedback Tracking** - Track term lookups, thumbs up/down, "still confused" clicks
- ✅ **AI Rewrites** - ChatGPT integration for on-demand explanation rewrites
- ✅ **Analytics Dashboard** - Comprehensive metrics and insights
- ✅ **Missing Terms** - Track terms users look up that we don't have
- ✅ **User Stats** - Anonymous user tracking and engagement metrics
- ✅ **Rate Limiting** - Protect API from abuse
- ✅ **PostgreSQL Database** - Scalable data storage

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **ORM**: Sequelize
- **AI**: OpenAI GPT-3.5-turbo
- **Security**: Helmet, CORS, Rate Limiting

## Installation

### 1. Install Dependencies

```bash
cd ask_ayo_backend
npm install
```

### 2. Set Up Database

Create a PostgreSQL database:

```bash
createdb ask_ayo
```

Run the schema:

```bash
psql ask_ayo < database/schema.sql
```

### 3. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `DB_PASSWORD` - Your PostgreSQL password
- `OPENAI_API_KEY` - Your OpenAI API key (get from https://platform.openai.com)

### 4. Start Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will start on `http://localhost:3000`

## API Endpoints

### Feedback Tracking

#### POST `/api/feedback/lookup`
Track a term lookup event.

**Request Body:**
```json
{
  "client_id": "uuid-v4-string",
  "term_key": "market_cap",
  "term_display": "Market Cap",
  "complexity_level": "simple",
  "page_url": "https://finance.yahoo.com/...",
  "page_context": "Apple's market cap reached...",
  "found": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "lookup_id": 123,
    "total_lookups": 5
  }
}
```

#### POST `/api/feedback/submit`
Submit user feedback (thumbs up/down, confused).

**Request Body:**
```json
{
  "client_id": "uuid-v4-string",
  "term_key": "market_cap",
  "feedback_type": "thumbs_up",
  "complexity_level": "simple",
  "comment": "Great explanation!"
}
```

**Feedback Types:**
- `thumbs_up` - User liked the explanation
- `thumbs_down` - User disliked the explanation
- `confused` - User clicked "Still confused?"

#### GET `/api/feedback/stats/:client_id`
Get user stats.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_lookups": 42,
    "unique_terms": 28,
    "days_active": 7,
    "first_seen": "2024-11-01T10:00:00Z",
    "last_seen": "2024-11-11T15:30:00Z"
  }
}
```

### AI Rewrites

#### POST `/api/ai/rewrite`
Get AI-powered rewrite for confused users.

**Request Body:**
```json
{
  "client_id": "uuid-v4-string",
  "term_key": "market_cap",
  "term_display": "Market Cap",
  "original_explanation": "Total value of all shares...",
  "complexity_level": "simple",
  "user_context": "I'm new to investing"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rewrite_id": 456,
    "rewritten_explanation": "Think of market cap like...",
    "tokens_used": 250,
    "cost_usd": 0.000375
  }
}
```

**Rate Limit:** 10 requests per hour per IP

#### GET `/api/ai/stats`
Get AI usage statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_rewrites": 150,
    "total_tokens": 37500,
    "total_cost": 0.05625,
    "rewrites_by_date": [...]
  }
}
```

### Analytics

#### GET `/api/analytics/overview`
Get overview statistics for admin dashboard.

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_users": 1250,
      "active_users": 320,
      "total_lookups": 5430,
      "total_feedback": 890
    },
    "popular_terms": [...],
    "confusing_terms": [...],
    "missing_terms": [...]
  }
}
```

#### GET `/api/analytics/daily?days=30`
Get daily analytics for the last N days.

#### GET `/api/analytics/term/:term_key`
Get detailed analytics for a specific term.

#### GET `/api/analytics/user-engagement`
Get user engagement metrics.

## Database Schema

### Tables

- **users** - Anonymous user tracking
- **term_lookups** - Every term lookup event
- **feedback** - User feedback (thumbs up/down, confused)
- **ai_rewrites** - ChatGPT API rewrites
- **missing_terms** - Terms we don't have definitions for
- **analytics_daily** - Daily aggregated stats

### Views

- **popular_terms** - Most looked-up terms
- **confusing_terms** - Terms with most "confused" feedback
- **user_engagement** - User engagement metrics

See `database/schema.sql` for full schema.

## Integration with Chrome Extension

### 1. Update Extension's content.js

Add API calls to track lookups and feedback:

```javascript
// Track lookup
fetch('https://api.askayo.com/api/feedback/lookup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: getClientId(), // UUID stored in chrome.storage
    term_key: termKey,
    term_display: termDisplay,
    complexity_level: currentLevel,
    page_url: window.location.href,
    page_context: getContext(),
    found: true
  })
});

// Track feedback
fetch('https://api.askayo.com/api/feedback/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: getClientId(),
    term_key: termKey,
    feedback_type: 'thumbs_up',
    complexity_level: currentLevel
  })
});
```

### 2. Add "Still Confused?" Button

When user clicks "Still confused?", call AI rewrite API:

```javascript
const response = await fetch('https://api.askayo.com/api/ai/rewrite', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: getClientId(),
    term_key: termKey,
    term_display: termDisplay,
    original_explanation: currentExplanation,
    complexity_level: currentLevel
  })
});

const data = await response.json();
// Display data.data.rewritten_explanation to user
```

## Deployment

### Option 1: Heroku

```bash
heroku create ask-ayo-backend
heroku addons:create heroku-postgresql:mini
heroku config:set OPENAI_API_KEY=sk-...
git push heroku main
```

### Option 2: Railway

1. Connect GitHub repo
2. Add PostgreSQL database
3. Set environment variables
4. Deploy

### Option 3: DigitalOcean App Platform

1. Create new app from GitHub
2. Add PostgreSQL database
3. Set environment variables
4. Deploy

## Cost Estimates

### Database (PostgreSQL)
- Heroku Postgres Mini: $5/month
- Railway: $5/month
- DigitalOcean: $7/month

### API Hosting
- Heroku Hobby: $7/month
- Railway: $5/month
- DigitalOcean: $5/month

### OpenAI API (GPT-3.5-turbo)
- Assuming 1000 rewrites/month
- ~250 tokens per rewrite
- Cost: ~$0.50/month

**Total: ~$15-20/month**

## Monitoring

- Check `/health` endpoint for server status
- Monitor database size and performance
- Track OpenAI API costs in `/api/ai/stats`
- Set up alerts for high error rates

## Security

- ✅ Helmet.js for security headers
- ✅ CORS configured for extension origin
- ✅ Rate limiting on all endpoints
- ✅ No personal data collected (anonymous client_id)
- ✅ Environment variables for secrets
- ✅ SQL injection prevention (Sequelize ORM)

## Future Enhancements

- [ ] Admin dashboard UI (React/Next.js)
- [ ] Email notifications for missing terms
- [ ] A/B testing for explanations
- [ ] Multi-language support
- [ ] Webhook integrations (Slack, Discord)
- [ ] Export analytics to CSV
- [ ] Real-time analytics with WebSockets

## Support

- **Issues**: GitHub Issues
- **Email**: support@askayo.com

## License

Proprietary - All rights reserved by Ask AYO

---

Made with 💚 by Ask AYO
