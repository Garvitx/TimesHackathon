import { CONFIG } from 'src/config-global';

import { BatchSummaryView } from 'src/sections/summary/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Batch Summary - ${CONFIG.appName}`}</title>

      <BatchSummaryView />
    </>
  );
}
