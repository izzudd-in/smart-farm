export const BUSINESS_TIMEZONE =
  "Asia/Jakarta" as const;

export type OwnerSettingsData = {
  name: string;
  email: string;
  role: "OWNER";

  farmName:
    | string
    | null;

  timezone:
    typeof BUSINESS_TIMEZONE;
};

export type OwnerProfileInput = {
  name: string;
};

export type ChangeOwnerPasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type OperatorKandangView = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
};

export type OperatorAssignmentOption = {
  id: string;
  code: string;
  name: string;
};

export type OperatorView = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;

  kandangs:
    OperatorKandangView[];
};

export type OperatorManagementData = {
  operators:
    OperatorView[];

  activeKandangs:
    OperatorAssignmentOption[];
};

export type CreateOperatorInput = {
  name: string;
  email: string;
  password: string;

  kandangIds:
    string[];
};

export type UpdateOperatorAssignmentsInput = {
  operatorId: string;

  kandangIds:
    string[];
};

export type SetOperatorActiveInput = {
  operatorId: string;
  isActive: boolean;
};

export type ResetOperatorPasswordInput = {
  operatorId: string;

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