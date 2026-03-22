import { NextResponse } from "next/server";

export const runtime = "edge";

/* ─── 타입 ─── */
export interface LiveAnnouncement {
  id: string;
  title: string;
  org: string;
  category: string[];
  amount: string;
  count: string;
  deadline: string;
  deadlineDate: string;
  eligibility: string;
  method: string;
  description: string;
  url: string;
  isHot?: boolean;
}

/* ─── RSS 파서 (Edge 호환 — no Node.js deps) ─── */
function extractTag(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!m) return "";
  return m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim();
}

function extractAllBlocks(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) out.push(m[0]);
  return out;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/* ─── 텍스트에서 필드 추론 ─── */
function inferCategory(title: string, desc: string): string[] {
  const text = title + desc;
  const cats: string[] = [];
  if (/예비창업|예비 창업/.test(text)) cats.push("예비창업");
  if (/초기창업|초기 창업|업력\s*[1-3]년/.test(text)) cats.push("초기창업");
  if (/재도전|폐업/.test(text)) cats.push("재도전");
  if (/청년|만\s*[23]?\d세|대학생/.test(text)) cats.push("청년");
  if (/기술|R&D|딥테크|팁스|TIPS/.test(text)) cats.push("기술창업");
  return cats.length ? cats : ["예비창업"];
}

function inferAmount(desc: string): string {
  const m = desc.match(/(?:최대|최고|지원금액[^\d]*)?(\d[\d,]*(?:\.\d+)?)\s*만원/);
  if (m) return `최대 ${m[1]}만원`;
  const m2 = desc.match(/(?:최대|최고)?(\d[\d,]*(?:\.\d+)?)\s*억원/);
  if (m2) return `최대 ${m2[1]}억원`;
  return "-";
}

function inferEligibility(title: string, desc: string): string {
  const text = title + " " + desc;
  if (/예비창업/.test(text)) return "예비창업자 (창업 경험 없거나 1년 미만)";
  if (/재도전/.test(text)) return "폐업 후 재창업 준비 중인 자";
  if (/청년/.test(text)) return "만 39세 이하 예비창업자 또는 업력 3년 이내";
  if (/기술|R&D/.test(text)) return "기술 기반 창업기업 (업력 7년 이내)";
  if (/초기/.test(text)) return "업력 3년 이내 창업기업 대표자";
  return "공고 상세 내용 참조";
}

function inferOrg(desc: string): string {
  const m = desc.match(/(?:주관기관|지원기관|운영기관)\s*[:\s]\s*([^\n<&]{2,20})/);
  if (m) return m[1].trim().replace(/[.\s]+$/, "");
  if (/창업진흥원/.test(desc)) return "중소벤처기업부 · 창업진흥원";
  if (/중소기업진흥|중진공/.test(desc)) return "중소벤처기업부 · 중소기업진흥공단";
  if (/소상공인/.test(desc)) return "소상공인시장진흥공단";
  if (/TIPS|팁스/.test(desc)) return "중소벤처기업부 · TIPS운영사";
  return "창업진흥원";
}

function inferDeadline(desc: string, pubDate: string): { label: string; date: string } {
  // 접수기간: 2025.04.01 ~ 2025.04.30 형식 추출
  const rangeMatch = desc.match(
    /(?:접수기간|신청기간|공고기간|모집기간)[^\d]*(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})[^~\d]+~[^~\d]*(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/
  );
  if (rangeMatch) {
    const endDate = `${rangeMatch[4]}-${String(rangeMatch[5]).padStart(2, "0")}-${String(rangeMatch[6]).padStart(2, "0")}`;
    return { label: `${rangeMatch[4]}.${rangeMatch[5]}.${rangeMatch[6]}`, date: endDate };
  }
  // pubDate 기반으로 +30일 추정
  if (pubDate) {
    try {
      const base = new Date(pubDate);
      base.setDate(base.getDate() + 30);
      const y = base.getFullYear();
      const mo = base.getMonth() + 1;
      const d = base.getDate();
      return { label: `${y}년 ${mo}월 (예정)`, date: `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}` };
    } catch {/* ignore */}
  }
  return { label: "공고 확인 필요", date: "2099-12-31" };
}

/* ─── RSS 피드 URL 목록 ─── */
// bizinfo.go.kr 창업지원 RSS (feedsId 목록은 비즈인포 RSS 안내 페이지 참조)
const RSS_URLS = [
  "https://www.bizinfo.go.kr/uss/rss/bizSupportInfo.do?feedsId=PMAS0040", // 창업·벤처
];

async function fetchRss(url: string): Promise<LiveAnnouncement[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Accept": "application/xml, text/xml, */*",
        "User-Agent": "Mozilla/5.0 (compatible; FoalAI/1.0)",
      },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // 한글 인코딩 대응: EUC-KR / UTF-8
    const buf = await res.arrayBuffer();
    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(buf);
    } catch {
      text = new TextDecoder("euc-kr").decode(buf);
    }

    const items = extractAllBlocks(text, "item");
    return items.map((block, i) => {
      const title = extractTag(block, "title");
      const link = extractTag(block, "link") || extractTag(block, "guid");
      const descRaw = extractTag(block, "description");
      const desc = stripHtml(descRaw);
      const pubDate = extractTag(block, "pubDate");
      const { label: deadlineLabel, date: deadlineDate } = inferDeadline(desc, pubDate);

      return {
        id: `biz-${i}-${Date.now()}`,
        title,
        org: inferOrg(desc),
        category: inferCategory(title, desc),
        amount: inferAmount(desc),
        count: "-",
        deadline: deadlineLabel,
        deadlineDate,
        eligibility: inferEligibility(title, desc),
        method: "K-Startup 또는 공식 사이트 신청",
        description: desc.slice(0, 400),
        url: link || "https://www.bizinfo.go.kr",
        isHot: false,
      } satisfies LiveAnnouncement;
    }).filter((a) => a.title.length > 0);
  } finally {
    clearTimeout(timer);
  }
}

/* ─── GET /api/announcements ─── */
export async function GET() {
  try {
    const results = await Promise.allSettled(RSS_URLS.map(fetchRss));
    const all: LiveAnnouncement[] = results
      .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
      .slice(0, 30);

    if (all.length === 0) {
      return NextResponse.json(
        { data: [], source: "empty", error: "RSS 데이터 없음" },
        {
          status: 200,
          headers: { "Cache-Control": "public, max-age=300" },
        }
      );
    }

    return NextResponse.json(
      { data: all, source: "live", fetchedAt: new Date().toISOString() },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
        },
      }
    );
  } catch (err) {
    console.error("[announcements] fetch error:", err);
    return NextResponse.json(
      { data: [], source: "error", error: String(err) },
      {
        status: 200,
        headers: { "Cache-Control": "public, max-age=60" },
      }
    );
  }
}
