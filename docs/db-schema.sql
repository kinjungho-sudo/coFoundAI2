-- CoFound AI 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요.

-- 크레딧 (RLS 필수)
CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인터뷰 세션 (RLS 필수)
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]',
  scores JSONB DEFAULT '{}',
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 산출물 (RLS 필수)
CREATE TABLE IF NOT EXISTS outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES interview_sessions(id),
  type TEXT NOT NULL CHECK (type IN ('business_plan', 'gov_match', 'interview_analysis', 'landing_copy')),
  content TEXT,
  credits_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 결제
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  order_id TEXT UNIQUE NOT NULL,
  package TEXT NOT NULL CHECK (package IN ('starter', 'basic', 'pro')),
  amount INTEGER NOT NULL,
  credits INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
  toss_payment_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE outputs ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY IF NOT EXISTS "users_own_credits" ON credits
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "users_own_sessions" ON interview_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "users_own_outputs" ON outputs
  FOR ALL USING (auth.uid() = user_id);

-- 신규 유저 크레딧 자동 생성 트리거
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO credits (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 크레딧 원자적 차감 함수 (중복 차감 방지)
CREATE OR REPLACE FUNCTION deduct_credit(p_user_id UUID, p_amount INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- 행 잠금 후 잔액 조회
  SELECT balance INTO current_balance
  FROM credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_balance IS NULL OR current_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  UPDATE credits
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RAG 시스템
-- ============================================================

-- pgvector 확장 활성화 (최초 1회)
CREATE EXTENSION IF NOT EXISTS vector;

-- RAG 문서 저장 테이블
CREATE TABLE IF NOT EXISTS rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('gov_official', 'methodology', 'case_study')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_summary TEXT,
  metadata JSONB DEFAULT '{}',
  embedding vector(1536),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 벡터 검색 인덱스 (ivfflat — 100만 건 미만 최적)
CREATE INDEX IF NOT EXISTS rag_documents_embedding_idx
  ON rag_documents USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 업데이트 이력 테이블
CREATE TABLE IF NOT EXISTS rag_update_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'no_change')),
  documents_added INTEGER DEFAULT 0,
  documents_updated INTEGER DEFAULT 0,
  documents_deleted INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 벡터 유사도 검색 함수
CREATE OR REPLACE FUNCTION search_rag_documents(
  query_embedding vector(1536),
  match_count INT DEFAULT 5,
  filter_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  source_id TEXT,
  category TEXT,
  title TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id, d.source_id, d.category, d.title, d.content, d.metadata,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM rag_documents d
  WHERE d.is_active = TRUE
    AND (filter_category IS NULL OR d.category = filter_category)
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================

-- 크레딧 충전 함수
CREATE OR REPLACE FUNCTION add_credit(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  INSERT INTO credits (user_id, balance)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = credits.balance + p_amount,
      updated_at = NOW()
  RETURNING balance INTO new_balance;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
