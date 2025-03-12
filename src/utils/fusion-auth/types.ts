export interface User {
  active: boolean;
  breachedPasswordLastCheckedInstant: number;
  breachedPasswordStatus: string;
  connectorId: string;
  data: Record<string, any>; // Use more specific type if you know the structure of this object
  email: string;
  fullName: string;
  id: string;
  imageUrl: string;
  insertInstant: number;
  lastLoginInstant: number;
  lastUpdateInstant: number;
  memberships: any[]; // Type this array if you know the structure of the items
  passwordChangeRequired: boolean;
  passwordLastUpdateInstant: number;
  preferredLanguages: string[]; // Type this array as needed
  registrations: any[]; // Type this array if you know the structure of the items
  tenantId: string;
  twoFactor: Record<string, any>; // Use more specific type if you know the structure of this object
  usernameStatus: string;
  verified: boolean;
}

export interface AuthToken {
  token: string;
  tokenExpirationInstant: number;
  user: User;
  twoFactorId: string;
}

export type StoredFusionAuthToken = {
  token: string;
  expiresAt: number;
};
