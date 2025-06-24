import { CONFIG } from 'src/config-global';

import { AnalyticsPage } from 'src/sections/user/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Analytics - ${CONFIG.appName}`}</title>

      <AnalyticsPage />
    </>
  );
}
