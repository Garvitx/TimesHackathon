import { CONFIG } from 'src/config-global';

import { RolePermissionsPage } from 'src/sections/user/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Roles- ${CONFIG.appName}`}</title>

      <RolePermissionsPage />
    </>
  );
}
