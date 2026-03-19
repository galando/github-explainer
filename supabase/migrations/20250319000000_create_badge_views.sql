-- Create badge_views table for tracking badge impressions and installs
CREATE TABLE IF NOT EXISTS badge_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  repo_full_name TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_badge_views_repo ON badge_views(repo_full_name);
CREATE INDEX IF NOT EXISTS idx_badge_views_created ON badge_views(created_at);

-- Row Level Security (RLS) policy
ALTER TABLE badge_views ENABLE ROW LEVEL SECURITY;
```
