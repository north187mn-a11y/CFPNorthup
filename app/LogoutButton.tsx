'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useState } from 'react';

export default function LogoutButton() {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return <button type="button" onClick={logout} disabled={busy}>{busy ? 'Logging out…' : 'Log Out'}</button>;
}
