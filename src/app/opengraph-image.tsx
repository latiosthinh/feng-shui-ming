import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'FengShuiMing - Asian Baby Name Generator'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #f3e8ff 0%, #ffffff 50%, #fef3c7 100%)',
      }}
    >
      <div style={{ fontSize: 72, marginBottom: 16 }}>☯</div>
      <div style={{ fontSize: 48, fontWeight: 'bold', color: '#7c3aed', marginBottom: 8 }}>
        FengShuiMing
      </div>
      <div style={{ fontSize: 24, color: '#6b7280' }}>
        Asian Baby Name Generator with Feng Shui Analysis
      </div>
      <div style={{ fontSize: 18, color: '#9ca3af', marginTop: 16 }}>
        五格剖象 · 八字五行 · 风水起名
      </div>
    </div>,
    { ...size },
  )
}
