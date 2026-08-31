/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

/**
 * Client for the /admin routes (backend-addon/adminRoutes.js) on the
 * same backend the Agent/Free apps use. Auth is a single shared admin
 * key baked into this app at build time (EXPO_PUBLIC_ADMIN_KEY) — this
 * is what lets the Admin app skip a login screen entirely: possession
 * of this specific build (with the key compiled in) IS the "login".
 *
 * Do not reuse this build's key in the Agent/Free apps, and don't
 * distribute this app's install file outside people you trust with
 * full read/revoke access to every client's subscription.
 */
const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://webazi-digital-solutions.onrender.com';
const ADMIN_KEY = process.env.EXPO_PUBLIC_ADMIN_KEY || '';

export type AgentStatus = 'trial' | 'active' | 'expired' | 'revoked' | 'free';

export type Agent = {
  id: string;
  notificationNumber: string;
  buildVariant: 'agent' | 'free';
  isFreeAccess: boolean;
  revoked: boolean;
  firstLoginAt: string | null;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  lastPaidMonths: number | null;
  lastPaidAt: string | null;
  status: AgentStatus;
  createdAt: string;
  updatedAt: string;
};

type Ok<T> = { ok: true } & T;
type Err = { ok: false; reason: string };

async function call<T>(path: string, options?: RequestInit): Promise<Ok<T> | Err> {
  if (!ADMIN_KEY) {
    return { ok: false, reason: 'No admin key configured in this build (.env EXPO_PUBLIC_ADMIN_KEY).' };
  }
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_KEY,
        ...(options?.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      return { ok: false, reason: data.reason || `Server error (${res.status})` };
    }
    return { ok: true, ...data };
  } catch (e: any) {
    return { ok: false, reason: e?.message === 'Network request failed' ? 'offline' : String(e?.message ?? e) };
  }
}

export function listAgents() {
  return call<{ agents: Agent[] }>('/admin/agents');
}

export function revokeAgent(id: string, revoked: boolean) {
  return call<{ agent: Agent }>(`/admin/agents/${id}/revoke`, {
    method: 'POST',
    body: JSON.stringify({ revoked }),
  });
}

export function setFreeAccess(id: string, enabled: boolean) {
  return call<{ agent: Agent }>(`/admin/agents/${id}/free`, {
    method: 'POST',
    body: JSON.stringify({ enabled }),
  });
}

export function extendAgent(id: string, days: number) {
  return call<{ agent: Agent }>(`/admin/agents/${id}/extend`, {
    method: 'POST',
    body: JSON.stringify({ days }),
  });
}

export function deleteAgent(id: string) {
  return call<{}>(`/admin/agents/${id}`, { method: 'DELETE' });
}
