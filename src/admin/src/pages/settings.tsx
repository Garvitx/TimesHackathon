import { CONFIG } from 'src/config-global';

import { SystemSettingsPage } from 'src/sections/user/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Settings - ${CONFIG.appName}`}</title>

      <SystemSettingsPage />
    </>
  );
}
