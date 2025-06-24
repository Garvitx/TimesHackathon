import React, { lazy, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { varAlpha } from 'minimal-shared/utils';
import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import { AuthLayout } from 'src/layouts/auth';
import { DashboardLayout } from 'src/layouts/dashboard';
import { useAuth } from 'src/context/AuthContext';

export const DashboardPage = lazy(() => import('src/pages/dashboard'));
export const BlogPage = lazy(() => import('src/pages/blog'));
export const UserPage = lazy(() => import('src/pages/user'));
export const SignInPage = lazy(() => import('src/pages/sign-in'));
export const ProductsPage = lazy(() => import('src/pages/products'));
export const SummaryPage = lazy(() => import('src/pages/summary'));
export const BatchSummaryPage = lazy(() => import('src/pages/batch-summary'));
export const ReviewPage = lazy(() => import('src/pages/review-edit'));
export const ArticleDetail = lazy(() => import('src/pages/page-not-found'));
export const RolesPage = lazy(() => import('src/pages/role'));
export const Settings = lazy(() => import('src/pages/settings'));
export const Analytics = lazy(() => import('src/pages/analytics'));
export const Export = lazy(() => import('src/pages/export'));

// Lazy-load the new Forgot/Reset pages:
export const ResetPassword = lazy(() => import('src/pages/reset-password'));
export const ForgotPassword = lazy(() => import('src/pages/forgot-password'));

export const Page404 = lazy(() => import('src/pages/page-not-found'));

interface RouteObject {
  path?: string;
  element?: React.ReactElement;
  children?: RouteObject[];
  index?: boolean;
}

const renderFallback = () => (
  <Box
    sx={{
      display: 'flex',
      flex: '1 1 auto',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <LinearProgress
      sx={{
        width: 1,
        maxWidth: 320,
        bgcolor: (theme) => varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
        [`& .${linearProgressClasses.bar}`]: { bgcolor: 'text.primary' },
      }}
    />
  </Box>
);

/**
 * ProtectedRoute now waits for `loading` to finish.
 * While loading === true, return null (or a spinner).
 * When loading === false:
 *   - If user is non‐null, render children.
 *   - Otherwise, navigate to /sign-in.
 */
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, loading } = useAuth();

  if (loading) {
    // Still checking “/api/auth/me” → render nothing (or spinner)
    return null;
  }

  return user ? children : <Navigate to="/sign-in" />;
};

export const routesSection: RouteObject[] = [
  // ─────────────────────────── Dashboard & Protected Routes ───────────────────────────
  {
    element: (
      <DashboardLayout>
        <Suspense fallback={renderFallback()}>
          <Outlet />
        </Suspense>
      </DashboardLayout>
    ),
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/editors',
        element: (
          <ProtectedRoute>
            <UserPage />
          </ProtectedRoute>
        ),
      },
      {
  path: 'admin/roles',
  element: (
    <ProtectedRoute>
      <RolesPage />
    </ProtectedRoute>
  ),
},
 {
  path: 'admin/settings',
  element: (
    <ProtectedRoute>
      <Settings />
    </ProtectedRoute>
  ),
}, {
  path: 'admin/analytics',
  element: (
    <ProtectedRoute>
      <Analytics />
    </ProtectedRoute>
  ),
}, {
  path: 'admin/export',
  element: (
    <ProtectedRoute>
      <Export />
    </ProtectedRoute>
  ),
},

      {
        path: 'blog',
        element: (
          <ProtectedRoute>
            <BlogPage />
          </ProtectedRoute>
        ),
      },
       {
        path: 'editor/summaries',
        element: (
          <ProtectedRoute>
            <SummaryPage />
          </ProtectedRoute>
        ),
      },
       {
        path: 'editor/batch-summaries',
        element: (
          <ProtectedRoute>
            <BatchSummaryPage />
          </ProtectedRoute>
        ),
      },
       {
        path: 'editor/review-edit',
        element: (
          <ProtectedRoute>
            <ReviewPage />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // ───────────────────────────── Auth & Public Routes ─────────────────────────────
  {
    path: 'sign-in',
    element: (
      <AuthLayout>
        <SignInPage />
      </AuthLayout>
    ),
  },
  {
    path: 'forgot-password',
    element: (
      <AuthLayout>
        <ForgotPassword />
      </AuthLayout>
    ),
  },
  {
    path: 'reset-password',
    element: (
      <AuthLayout>
        <ResetPassword />
      </AuthLayout>
    ),
  },

  // ───────────────────────────────────── Fallback ────────────────────────────────────
  {
    path: '404',
    element: <Page404 />,
  },
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
];
