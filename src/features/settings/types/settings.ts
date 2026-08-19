export const BUSINESS_TIMEZONE =
  "Asia/Jakarta" as const;

export type OwnerSettingsData = {
  name: string;
  email: string;
  role: "OWNER";
  farmName: string | null;
  timezone: typeof BUSINESS_TIMEZONE;
};

export type OwnerProfileInput = {
  name: string;
};

export type ChangeOwnerPasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type SettingsActionResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
    };