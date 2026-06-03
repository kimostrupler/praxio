import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{
        width: 32, height: 32,
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{
          color: '#ffffff',
          fontSize: 20,
          fontWeight: 700,
          fontFamily: 'system-ui, sans-serif',
          lineHeight: 1,
        }}>
          F
        </span>
      </div>
    ),
    { ...size }
  )
}
