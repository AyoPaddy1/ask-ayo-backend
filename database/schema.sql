-- Ask AYO Backend Database Schema
-- PostgreSQL 14+

-- Users table (anonymous tracking via client_id from extension)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  client_id VARCHAR(255) UNIQUE NOT NULL,
  first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_lookups INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_client_id ON users(client_id);
CREATE INDEX idx_users_last_seen ON users(last_seen_at);

-- Term lookups table (track every term lookup)
CREATE TABLE IF NOT EXISTS term_lookups (
  id SERIAL PRIMARY KEY,
  client_id VARCHAR(255) NOT NULL,
  term_key VARCHAR(255) NOT NULL,
  term_display VARCHAR(255) NOT NULL,
  complexity_level VARCHAR(50) DEFAULT 'simple', -- simple, contextual, realTalk
  page_url TEXT,
  page_context TEXT, -- surrounding text where term was found
  found BOOLEAN DEFAULT true,
  lookup_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lookups_client_id ON term_lookups(client_id);
CREATE INDEX idx_lookups_term_key ON term_lookups(term_key);
CREATE INDEX idx_lookups_timestamp ON term_lookups(lookup_timestamp);
CREATE INDEX idx_lookups_found ON term_lookups(found);

-- Feedback table (thumbs up/down, "still confused" clicks)
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  client_id VARCHAR(255) NOT NULL,
  term_key VARCHAR(255) NOT NULL,
  feedback_type VARCHAR(50) NOT NULL, -- thumbs_up, thumbs_down, confused
  complexity_level VARCHAR(50), -- which level they were viewing
  comment TEXT, -- optional user comment
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_client_id ON feedback(client_id);
CREATE INDEX idx_feedback_term_key ON feedback(term_key);
CREATE INDEX idx_feedback_type ON feedback(feedback_type);
CREATE INDEX idx_feedback_created ON feedback(created_at);

-- AI rewrites table (ChatGPT API calls for confused users)
CREATE TABLE IF NOT EXISTS ai_rewrites (
  id SERIAL PRIMARY KEY,
  client_id VARCHAR(255) NOT NULL,
  term_key VARCHAR(255) NOT NULL,
  original_explanation TEXT NOT NULL,
  rewritten_explanation TEXT NOT NULL,
  model VARCHAR(100) DEFAULT 'gpt-3.5-turbo',
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rewrites_client_id ON ai_rewrites(client_id);
CREATE INDEX idx_rewrites_term_key ON ai_rewrites(term_key);
CREATE INDEX idx_rewrites_created ON ai_rewrites(created_at);

-- Missing terms table (terms users looked up but we don't have)
CREATE TABLE IF NOT EXISTS missing_terms (
  id SERIAL PRIMARY KEY,
  client_id VARCHAR(255) NOT NULL,
  missing_text VARCHAR(255) NOT NULL,
  page_url TEXT,
  page_context TEXT,
  lookup_count INTEGER DEFAULT 1,
  first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_missing_text ON missing_terms(missing_text);
CREATE INDEX idx_missing_lookup_count ON missing_terms(lookup_count);

-- Analytics aggregations table (daily/weekly/monthly stats)
CREATE TABLE IF NOT EXISTS analytics_daily (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  total_lookups INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  total_feedback INTEGER DEFAULT 0,
  thumbs_up INTEGER DEFAULT 0,
  thumbs_down INTEGER DEFAULT 0,
  confused_clicks INTEGER DEFAULT 0,
  ai_rewrites INTEGER DEFAULT 0,
  top_terms JSONB, -- array of {term_key, count}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_date ON analytics_daily(date);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_updated_at BEFORE UPDATE ON analytics_daily
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE OR REPLACE VIEW popular_terms AS
SELECT 
  term_key,
  term_display,
  COUNT(*) as lookup_count,
  COUNT(DISTINCT client_id) as unique_users,
  MAX(lookup_timestamp) as last_looked_up
FROM term_lookups
WHERE found = true
GROUP BY term_key, term_display
ORDER BY lookup_count DESC;

CREATE OR REPLACE VIEW confusing_terms AS
SELECT 
  f.term_key,
  COUNT(*) as confused_count,
  COUNT(DISTINCT f.client_id) as unique_users,
  MAX(f.created_at) as last_confused_at
FROM feedback f
WHERE f.feedback_type = 'confused'
GROUP BY f.term_key
ORDER BY confused_count DESC;

CREATE OR REPLACE VIEW user_engagement AS
SELECT 
  client_id,
  COUNT(DISTINCT term_key) as unique_terms_viewed,
  COUNT(*) as total_lookups,
  MIN(lookup_timestamp) as first_lookup,
  MAX(lookup_timestamp) as last_lookup,
  EXTRACT(EPOCH FROM (MAX(lookup_timestamp) - MIN(lookup_timestamp)))/86400 as days_active
FROM term_lookups
GROUP BY client_id
ORDER BY total_lookups DESC;

-- Comments
COMMENT ON TABLE users IS 'Anonymous user tracking via client_id from extension';
COMMENT ON TABLE term_lookups IS 'Every term lookup event with context';
COMMENT ON TABLE feedback IS 'User feedback (thumbs up/down, confused)';
COMMENT ON TABLE ai_rewrites IS 'ChatGPT API rewrites for confused users';
COMMENT ON TABLE missing_terms IS 'Terms users looked up but we don''t have definitions for';
COMMENT ON TABLE analytics_daily IS 'Daily aggregated analytics for dashboard';
