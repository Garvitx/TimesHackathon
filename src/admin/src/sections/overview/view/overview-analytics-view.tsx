import { useEffect, useState } from 'react';
import axios from 'axios';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { DashboardContent } from 'src/layouts/dashboard';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';
import { AnalyticsWebsiteVisits } from '../analytics-website-visits';
import { AnalyticsCurrentVisits } from '../analytics-current-visits';
import { AnalyticsOrderTimeline } from '../analytics-order-timeline';
import { useAuth } from 'src/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalArticles: number;
  totalApiCalls: number;
  totalCost: number;
  dailySummaries: { date: string; count: number }[];
  avgTokens: number;
  successRate: number;
  topLanguages: { language: string; count: number }[];
  recentSummaries: { articleId: string; title: string; status: string; createdAt: string }[];
}

export function OverviewAnalyticsView() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalArticles: 0,
    totalApiCalls: 0,
    totalCost: 0,
    dailySummaries: [],
    avgTokens: 0,
    successRate: 0,
    topLanguages: [],
    recentSummaries: [],
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios
        .get('https://stingray-app-j7k4v.ondigitalocean.app/api/admin/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setStats(res.data))
        .catch((err) => console.error('Failed to fetch dashboard stats:', err));
    }
  }, []);

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Hi, Welcome back {user?.email} 👋
      </Typography>

     

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Total Articles Summarized"
            total={stats.totalArticles}
            icon={<img alt="Articles" src="/assets/icons/glass/ic-glass-bag.svg" />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Total API Calls"
            total={stats.totalApiCalls}
            color="secondary"
            icon={<img alt="API Calls" src="/assets/icons/glass/ic-glass-users.svg" />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Total Cost (USD)"
            total={Number(stats.totalCost.toFixed(2))}
            color="warning"
            icon={<img alt="Cost" src="/assets/icons/glass/ic-glass-buy.svg" />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Success Rate (%)"
            total={Number(stats.successRate)}
            color="error"
            icon={<img alt="Success Rate" src="/assets/icons/glass/ic-glass-message.svg" />}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 8 }}>
          <AnalyticsWebsiteVisits
            title="Daily Summaries"
            subheader="Number of articles summarized per day"
            chart={{
              categories: stats.dailySummaries.map((d) => d.date),
              series: [{ name: 'Summaries', data: stats.dailySummaries.map((d) => d.count) }],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <AnalyticsCurrentVisits
            title="Top Languages"
            chart={{
              series: stats.topLanguages.map((lang) => ({
                label: lang.language,
                value: lang.count,
              })),
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <AnalyticsOrderTimeline
            title="Recent Summaries"
            list={stats.recentSummaries.map((summary) => ({
              id: summary.articleId,
              title: summary.title || 'Untitled',
              type: summary.status,
              time: new Date(summary.createdAt),
            }))}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}