import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'College Football Survivor',
    short_name: 'CF Survivor',
    description: 'College football picks, standings, and survivor league.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0b1726',
    theme_color: '#0b1726',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icon', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
