import { CONFIG } from 'src/config-global';

import ReviewEditView from 'src/sections/summary/view/review-edit-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Review Page- ${CONFIG.appName}`}</title>

      <ReviewEditView />
    </>
  );
}
