import { ImageResponse } from 'next/og';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const runtime = 'nodejs';
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8');
  const base64 = css.split('data:image/jpeg;base64,')[1]?.split('"')[0];
  if (!base64) throw new Error('Login trophy image not found in globals.css');
  const image = Buffer.from(base64, 'base64');
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0c0b' }}>
      <img src={image.buffer.slice(image.byteOffset, image.byteOffset + image.byteLength) as unknown as string} width={508} height={508} style={{ objectFit: 'contain' }} alt="College Football Survivor trophy" />
    </div>,
    { ...size }
  );
}
