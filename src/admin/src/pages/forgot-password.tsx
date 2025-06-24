import { CONFIG } from 'src/config-global';

import ForgotPassword from 'src/sections/auth/forgot-password';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Forgot Password- ${CONFIG.appName}`}</title>

      <ForgotPassword />
    </>
  );
}
