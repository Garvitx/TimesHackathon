// src/components/NavContent.tsx
import React, { useEffect } from 'react';
import type { Theme, SxProps, Breakpoint } from '@mui/material/styles';
import Box from '@mui/material/Box';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import Drawer, { drawerClasses } from '@mui/material/Drawer';
import { useTheme } from '@mui/material/styles';

import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';
import { Logo } from 'src/components/logo';
import { Scrollbar } from 'src/components/scrollbar';

import type { NavItem } from '../nav-config-dashboard';
import { useAuth } from 'src/context/AuthContext'; // adjust path as needed

export type WorkspacesPopoverProps = {
  data: any[];
};

export type NavContentProps = {
  data: NavItem[];
  slots?: {
    topArea?: React.ReactNode;
    bottomArea?: React.ReactNode;
  };
  workspaces: WorkspacesPopoverProps['data'];
  sx?: SxProps<Theme>;
};

// ───────────────────────────────────────────────────────────────
// NavDesktop: visible on md+ screens
// ───────────────────────────────────────────────────────────────

export function NavDesktop({
  sx,
  data,
  slots,
  workspaces,
  layoutQuery,
}: NavContentProps & { layoutQuery: Breakpoint }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        pt: 2.5,
        px: 2.5,
        top: 0,
        left: 0,
        height: 1,
        display: 'none',
        position: 'fixed',
        flexDirection: 'column',
        zIndex: 'var(--layout-nav-zIndex)',
        width: 'var(--layout-nav-vertical-width)',
        borderRight: `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
        [theme.breakpoints.up(layoutQuery)]: {
          display: 'flex',
        },
        ...sx,
      }}
    >
      <NavContent data={data} slots={slots} workspaces={workspaces} />
    </Box>
  );
}

// ───────────────────────────────────────────────────────────────
// NavMobile: visible below md (drawer sliding from left)
// ───────────────────────────────────────────────────────────────

export function NavMobile({
  sx,
  data,
  open,
  slots,
  onClose,
  workspaces,
}: NavContentProps & { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  useEffect(() => {
    if (open) {
      onClose();
    }
    // Close the drawer when route changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      sx={{
        [`& .${drawerClasses.paper}`]: {
          pt: 2.5,
          px: 2.5,
          overflow: 'unset',
          width: 'var(--layout-nav-mobile-width)',
          ...sx,
        },
      }}
    >
      <NavContent data={data} slots={slots} workspaces={workspaces} />
    </Drawer>
  );
}

// ───────────────────────────────────────────────────────────────
// NavContent: common layout for both Desktop & Mobile
// ───────────────────────────────────────────────────────────────

export function NavContent({
  data,
  slots,
  workspaces,
  sx,
}: NavContentProps) {
  const theme = useTheme();
  const pathname = usePathname();
  const { user, isAdmin, isEditor } = useAuth();

  // If not logged in yet, render nothing (or a placeholder)
  if (!user) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: theme.vars.palette.text.secondary }}>
        Please&nbsp;<RouterLink to="/sign-in">Sign In</RouterLink>
      </Box>
    );
  }

  // Filter nav items based on the user’s role
  const visibleItems = data.filter((item) => {
    // If the NavItem has no roles (e.g. Sign-in), skip it for logged‐in users
    if (item.roles.length === 0) {
      return false;
    }
    if (isAdmin && item.roles.includes('Admin')) {
      return true;
    }
    if (isEditor && item.roles.includes('Editor')) {
      return true;
    }
    return false;
  });

  return (
    <>
      <Logo />

      {slots?.topArea}

      <Scrollbar fillContent>
        <Box
          component="nav"
          sx={[
            {
              display: 'flex',
              flex: '1 1 auto',
              flexDirection: 'column',
            },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
        >
          <Box
            component="ul"
            sx={{
              gap: 0.5,
              display: 'flex',
              flexDirection: 'column',
              listStyle: 'none',
              m: 0,
              p: 0,
            }}
          >
            {visibleItems.map((item) => {
              const isActived = item.path === pathname;

              return (
                <ListItem disableGutters disablePadding key={item.title}>
                  <ListItemButton
                    disableGutters
                    component={RouterLink}
                    href={item.path}
                    sx={[
                      {
                        pl: 2,
                        py: 1,
                        gap: 2,
                        pr: 1.5,
                        borderRadius: 0.75,
                        typography: 'body2',
                        fontWeight: 'fontWeightMedium',
                        color: theme.vars.palette.text.secondary,
                        minHeight: 44,
                      },
                      isActived && {
                        fontWeight: 'fontWeightSemiBold',
                        color: theme.vars.palette.primary.main,
                        bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
                        '&:hover': {
                          bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.16),
                        },
                      },
                    ]}
                  >
                    <Box component="span" sx={{ width: 24, height: 24 }}>
                      {item.icon}
                    </Box>

                    <Box component="span" sx={{ flexGrow: 1 }}>
                      {item.title}
                    </Box>

                    {item.info && item.info}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </Box>
        </Box>
      </Scrollbar>

      {slots?.bottomArea}
    </>
  );
}

// We brought in varAlpha from your original utils
function varAlpha(color: string, alpha: number) {
  // (You can keep using your own implementation from `minimal-shared/utils`)
  // This is just a placeholder; replace it with your actual varAlpha import.
  return `rgba(${color}, ${alpha})`;
}
