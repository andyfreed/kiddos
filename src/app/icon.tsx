import { ImageResponse } from 'next/og'

export const size = {
  width: 512,
  height: 512,
}

export const contentType = 'image/png'

export default function Icon() {
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
          borderRadius: 112,
        }}
      >
        <div
          style={{
            width: 380,
            height: 380,
            borderRadius: 96,
            background: 'rgba(255,255,255,0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}
        >
          <div
            style={{
              fontSize: 220,
              lineHeight: 1,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: -10,
              transform: 'translateY(-6px)',
            }}
          >
            K
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}

