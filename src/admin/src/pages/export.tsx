import { CONFIG } from 'src/config-global';

import { ExportDataPage } from 'src/sections/user/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Export- ${CONFIG.appName}`}</title>

      <ExportDataPage />
    </>
  );
}
