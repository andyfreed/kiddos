import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 55%, #7c3aed 100%)',
          borderRadius: 40,
        }}
      >
        <div
          style={{
            fontSize: 90,
            lineHeight: 1,
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: -4,
            transform: 'translateY(-2px)',
          }}
        >
          K
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}

