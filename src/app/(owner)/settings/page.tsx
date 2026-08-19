import {
  OwnerAccountSettings,
} from "@/features/settings/components/owner-account-settings";

import {
  OperatorManagement,
} from "@/features/settings/components/operator-management";

import {
  getOperatorManagementData,
  getOwnerSettingsData,
} from "@/features/settings/queries/get-owner-settings";

export default async function SettingsPage() {
  const [
    ownerData,
    operatorData,
  ] = await Promise.all([
    getOwnerSettingsData(),

    getOperatorManagementData(),
  ]);

  return (
    <>
      <OwnerAccountSettings
        data={
          ownerData
        }
      />

      <OperatorManagement
        data={
          operatorData
        }
      />
    </>
  );
}