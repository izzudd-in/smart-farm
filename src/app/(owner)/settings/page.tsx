import {
  OwnerAccountSettings,
} from "@/features/settings/components/owner-account-settings";

import {
  getOwnerSettingsData,
} from "@/features/settings/queries/get-owner-settings";

export default async function SettingsPage() {
  const data =
    await getOwnerSettingsData();

  return (
    <OwnerAccountSettings
      data={data}
    />
  );
}