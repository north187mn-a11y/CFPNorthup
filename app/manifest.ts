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
      { src: '/trophy-icon.jpg', sizes: 'any', type: 'image/jpeg', purpose: 'any' },
    ],
  };
}
