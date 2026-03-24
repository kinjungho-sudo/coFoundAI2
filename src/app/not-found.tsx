export const runtime = 'edge';

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0F0E17', color: '#E8E6F0', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 900, color: '#F0A500', margin: 0 }}>404</h1>
      <p style={{ fontSize: '1.125rem', color: '#8B89A0', marginTop: '0.5rem' }}>페이지를 찾을 수 없습니다.</p>
      <a href="/" style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', background: '#F0A500', color: '#0F0E17', fontWeight: 700, borderRadius: '0.75rem', textDecoration: 'none' }}>
        홈으로 돌아가기
      </a>
    </div>
  );
}
