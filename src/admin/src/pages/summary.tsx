import { CONFIG } from 'src/config-global';

import { SummaryView } from 'src/sections/summary/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Summary- ${CONFIG.appName}`}</title>

      <SummaryView />
    </>
  );
}
