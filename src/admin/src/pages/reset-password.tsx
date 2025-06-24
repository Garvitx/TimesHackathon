import { CONFIG } from 'src/config-global';

import ResetPassword from 'src/sections/auth/reset-password';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Reset Password- ${CONFIG.appName}`}</title>

      <ResetPassword />
    </>
  );
}
