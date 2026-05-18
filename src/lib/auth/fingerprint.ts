export async function generateFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return 'server'

  const stored = localStorage.getItem('fengshuiming-fingerprint')
  if (stored) return stored

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (ctx) {
    canvas.width = 200
    canvas.height = 50
    ctx.textBaseline = 'top'
    ctx.font = "14px 'Arial'"
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('FengShuiMing', 2, 15)
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
    ctx.fillText('FengShuiMing', 4, 17)
  }

  const dataUrl = canvas.toDataURL()
  const hash = simpleHash(dataUrl + navigator.userAgent + screen.width + screen.height + navigator.language + Intl.DateTimeFormat().resolvedOptions().timeZone)

  const fingerprint = `fp_${hash}`
  localStorage.setItem('fengshuiming-fingerprint', fingerprint)
  return fingerprint
}

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return Math.abs(hash).toString(36).padStart(12, '0')
}
