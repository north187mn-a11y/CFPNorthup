import { ImageResponse } from 'next/og';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const runtime = 'nodejs';
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  // Reuse the exact trophy JPEG embedded in the login page stylesheet.
  const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8');
  const trophy = css.match(/\.login-trophy\s*\{[^}]*?url\("(data:image\/jpeg;base64,[^"]+)"\)/s)?.[1];
  if (!trophy) throw new Error('Login trophy image not found in globals.css');
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0c0b' }}>
      <img src={trophy} width={500} height={500} style={{ objectFit: 'contain' }} alt="College Football Survivor trophy" />
    </div>,
    { ...size }
  );
}
