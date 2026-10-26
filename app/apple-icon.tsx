import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1726', color: '#ffffff', fontFamily: 'sans-serif', fontWeight: 900, fontSize: 68, letterSpacing: -5 }}>
      CF
    </div>,
    { ...size }
  );
}
