// src/nav-config-dashboard.tsx
import type { ReactNode } from 'react';
import { Icon } from '@iconify/react';

export type NavItem = {
  title: string;
  path: string;
  icon: ReactNode;
  info?: ReactNode;
  roles: Array<'Admin' | 'Editor'>;
};

/**
 * Each NavItem now has a `roles` field. Only users
 * whose role is included here will see the item.
 *
 * We use Iconify’s `mdi:` icon set as an example.
 * You may swap any "mdi:..." to another Iconify icon.
 */
export const navData: NavItem[] = [
  // ── Common to BOTH Admin & Editor ──
  {
    title: 'Dashboard',
    path: '/',
    icon: <Icon icon="mdi:view-dashboard" width="24" height="24" />,
    roles: ['Admin', 'Editor'],
  },

  // ── Editor‐only items ──
  {
    title: 'Summaries',
    path: '/editor/summaries',
    icon: <Icon icon="mdi:file-document-box-multiple" width="24" height="24" />,
    roles: ['Editor'],
  },
  {
    title: 'Batch Summarization',
    path: '/editor/batch-summaries',
    icon: <Icon icon="mdi:file-multiple" width="24" height="24" />,
    roles: ['Editor'],
  },
  {
    title: 'Review & Edit',
    path: '/editor/review-edit',
    icon: <Icon icon="mdi:pencil-box-outline" width="24" height="24" />,
    roles: ['Editor'],
  },

  // ── Admin‐only items ──
  {
    title: 'Editor Management',
    path: '/admin/editors',
    icon: <Icon icon="mdi:account-multiple-cog" width="24" height="24" />,
    roles: ['Admin'],
  },
  {
    title: 'Role & Permissions',
    path: '/admin/roles',
    icon: <Icon icon="mdi:key-variant" width="24" height="24" />,
    roles: ['Admin'],
  },
  {
    title: 'System Settings',
    path: '/admin/settings',
    icon: <Icon icon="mdi:cog-outline" width="24" height="24" />,
    roles: ['Admin'],
  },
  {
    title: 'Analytics',
    path: '/admin/analytics',
    icon: <Icon icon="mdi:chart-box" width="24" height="24" />,
    roles: ['Admin'],
  },
  {
    title: 'Export Data',
    path: '/admin/export',
    icon: <Icon icon="mdi:export-variant" width="24" height="24" />,
    roles: ['Admin'],
  },

  // ── Unauthenticated / Fallback (optional) ──
  {
    title: 'Sign in',
    path: '/sign-in',
    icon: <Icon icon="mdi:lock-outline" width="24" height="24" />,
    roles: [], // no one sees this if logged in; you can optionally render it only if user==null
  },
 
];
