# Foal AI — 오케스트레이터 지침

## 프로젝트 개요
Foal AI는 예비창업자의 아이디어를 9단계 소크라테스식 대화로 검증하고,
인터뷰 결과를 사업계획서 언어로 번역하는 AI 창업 멘토 서비스입니다.

**서비스명**: Foal AI (구 CoFound AI)
**운영사**: 코마인드웍스
**기술 스택**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase, Claude API, Cloudflare Pages

## 핵심 행동 원칙
- 구현 방법 선택지가 있을 때는 스스로 최선의 방법을 판단하고 진행
- 사용자에게 확인을 구하지 않는다. 질문 없이 끝까지 완성한다.

### 예외 (멈춰도 되는 경우)
- API KEY, 비밀번호 등 외부 크리덴셜이 없는 경우
- 파일/데이터를 영구 삭제해야 하는 경우

## 환경 변수
- `ANTHROPIC_API_KEY` — Claude API 키 (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` — RAG 임베딩용 (text-embedding-3-small)
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — Rate Limiting

## 에이전트 오케스트레이션

### 서브에이전트 목록
| 에이전트 | 역할 | 트리거 |
|---------|------|--------|
| interview-agent | 9단계 소크라테스 대화 진행 | 사용자 답변 제출 |
| score-agent | 답변 품질 0~20점 평가 | 각 STEP 답변 직후 |
| output-agent | 사업계획서 / JTBD 생성 | 크레딧 차감 완료 후 |
| devil-advocate-agent | 심사위원 관점 취약점 분석 | 사용자 버튼 클릭 |

**규칙**: 서브에이전트 간 직접 호출 금지 — 반드시 이 CLAUDE.md를 통해 조율

## API 라우트 구조
```
POST /api/interview/session       → 새 세션 생성
POST /api/interview/message       → SSE 스트리밍 (질문 + 점수)
GET  /api/score/[session_id]      → 점수보드 조회
POST /api/output/business-plan    → 사업계획서 생성 (2 크레딧)
POST /api/output/jtbd-analysis    → JTBD 분석 (무료, 인터뷰 완료 후)
POST /api/output/business-plan-review → 사업계획서 평가 (1 크레딧)
POST /api/devil-advocate          → 악마의 변호인 분석
GET  /api/earlybird/status        → 얼리버드 잔여 슬롯 조회
```

## 보안 규칙 (절대 위반 금지)
- 클라이언트에서 점수 계산 **금지** → `/api/score`에서만 서버사이드 처리
- PII 마스킹 없이 Claude API 호출 **금지** → `security.ts`의 `validateAndFilter()` 선행 필수
- 크레딧 차감 없이 유료 산출물 생성 **금지** → `deduct_credit` RPC 선행 필수
- API Key 클라이언트 번들 포함 **금지** → 서버사이드 환경변수로만 접근

## DB 구조 (Supabase)
- `credits` — 사용자 크레딧 잔액 (RLS, earlybird_expires_at 포함)
- `interview_sessions` — 인터뷰 세션 (messages JSONB, scores JSONB)
- `outputs` — 생성 산출물 (business_plan, jtbd_analysis, business_plan_review)
- `rag_documents` — pgvector 기반 RAG 문서 (embedding vector(1536))

## 얼리버드 정책
- 신규 가입자 선착순 500명: 3개월 전체 기능 무료 (`earlybird_expires_at` 설정)
- 얼리버드 기간 중 크레딧 차감 스킵 (`isEarlybird` 체크 후 분기)

## 결제 (현재 보류)
- 토스페이먼츠 연동 — 사업자등록 완료 후 활성화
- 관련 파일: `src/app/payment/`, `/api/payment/`

## 점수 레벨 (v5)
- 0~30점: need_work — 아직 검증이 필요합니다 (산출물 생성 불가)
- 31~60점: developing — 방향은 맞습니다. 구체화가 필요합니다 (산출물 생성 불가)
- 61~80점: good — 사업계획서 작성 가능한 수준입니다 (사업계획서 생성 가능)
- 81~100점: excellent — 정부지원사업 경쟁력 있는 수준입니다 (정부지원사업 매칭 추천)

## 인터뷰 단계 (v5)
- STEP 1: 아이스브레이킹 — 문제 탐색
- STEP 2: 한 줄 소개 도출 — 문제 정의
- STEP 3: 타겟 고객 좁히기
- STEP 4: JTBD 발견 (STEP 3-1) — Q1(과업) → Q2(의미) → Q3(핵심 한 마디) 3단계 질문
- STEP 5: 페인포인트 검증
- STEP 6: 차별점 발굴
- STEP 7: 창업자 강점 연결
- STEP 8: 리소스 파악
- STEP 9: 다음 1주일 액션
