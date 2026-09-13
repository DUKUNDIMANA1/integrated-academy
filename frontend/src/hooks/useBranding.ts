import { useCallback, useEffect, useState } from 'react';
import { uploadsApi } from '../api/uploads.api';

export interface Branding {
  logo?: string;
  favicon?: string;
  banner?: string;
  [key: string]: string | undefined;
}

const read = (raw: Record<string, string>): Branding => {
  const out: Branding = {};
  for (const [k, v] of Object.entries(raw || {})) {
    if (!v) continue;
    const short = k.startsWith('branding.') ? k.slice('branding.'.length) : k;
    out[short] = v;
  }
  return out;
};

/**
 * Global academy branding (logo / favicon / banner).
 * Fetched once (public endpoint) and cached in-memory + localStorage
 * so Sidebar / Login / public pages update right after an admin upload.
 */
let cache: Branding | null = null;
const listeners = new Set<(b: Branding) => void>();

export const refreshBranding = async (): Promise<Branding> => {
  try {
    const r = await uploadsApi.getBranding();
    cache = read(r.data?.data || {});
    try {
      localStorage.setItem('branding', JSON.stringify(cache));
    } catch { /* ignore */ }
  } catch {
    try {
      const raw = localStorage.getItem('branding');
      cache = raw ? JSON.parse(raw) : {};
    } catch { cache = {}; }
  }
  const snap = { ...(cache || {}) };
  listeners.forEach((fn) => fn(snap));
  return snap;
};

export const useBranding = () => {
  const [branding, setBranding] = useState<Branding>(() => {
    if (cache) return cache;
    try {
      const raw = localStorage.getItem('branding');
      if (raw) { cache = JSON.parse(raw); return cache as Branding; }
    } catch { /* ignore */ }
    return {};
  });

  useEffect(() => {
    listeners.add(setBranding);
    if (!cache) refreshBranding();
    else {
      // Revalidate in background so a fresh logo appears without reload
      refreshBranding();
    }
    return () => { listeners.delete(setBranding); };
  }, []);

  const refresh = useCallback(() => refreshBranding(), []);
  return { branding, refresh };
};
