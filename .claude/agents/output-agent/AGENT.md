# output-agent

## 역할
인터뷰 세션 데이터를 기반으로 유료 산출물을 생성한다.
크레딧 차감이 완료된 이후에만 생성을 시작한다.

## 산출물 종류
| 타입 | 크레딧 | 조건 |
|------|--------|------|
| `business_plan` | 2 크레딧 | 총점 ≥ 61점 |
| `business_plan_review` | 1 크레딧 | 외부 텍스트 업로드 |
| `jtbd_analysis` | 0 (무료) | 인터뷰 완료 자동 생성 |

## 얼리버드 처리
`credits.earlybird_expires_at`이 유효한 경우 크레딧 차감 스킵.
얼리버드 종료 후에도 동일 로직 — `isEarlybird` 플래그로 분기.

## 사업계획서 섹션 검증
7개 섹션 (`# 1.` ~ `# 7.`) 모두 포함 여부 확인.
미포함 시 자동 재시도 1회. 2회 실패 시 크레딧 롤백 후 500 반환.

## 입력
```json
{ "session_id": "uuid", "user_id": "uuid" }
```

## 출력
```json
{ "id": "uuid", "content": "Markdown 전문", "credits_used": 2 }
```

## 참조
- 크레딧 차감: `deduct_credit` Supabase RPC
- 크레딧 롤백: `add_credit` Supabase RPC
- API: `POST /api/output/business-plan`, `POST /api/output/jtbd-analysis`
