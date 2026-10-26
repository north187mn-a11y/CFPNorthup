import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1726', color: '#ffffff', fontFamily: 'sans-serif', fontWeight: 900, fontSize: 190, letterSpacing: -14, borderRadius: 90 }}>
      CF
    </div>,
    { ...size }
  );
}
