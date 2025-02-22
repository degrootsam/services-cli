export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  Date: { input: any; output: any };
  DateTime: { input: any; output: any };
  Decimal: { input: any; output: any };
  FileReference: { input: any; output: any };
  Json: { input: any; output: any };
  Time: { input: any; output: any };
};

export type AuthenticationTokenPayload = {
  __typename?: "AuthenticationPayload";
  accessExpiresAt?: Maybe<Scalars["String"]["output"]>;
  accessExpiresIn?: Maybe<Scalars["Int"]["output"]>;
  isValid?: Maybe<Scalars["Boolean"]["output"]>;
  jwtToken?: Maybe<Scalars["String"]["output"]>;
  refreshExpiresAt?: Maybe<Scalars["String"]["output"]>;
  refreshExpiresIn?: Maybe<Scalars["Int"]["output"]>;
  refreshToken?: Maybe<Scalars["String"]["output"]>;
};

export type AuthenticationSuccessPayload = {
  login: AuthenticationTokenPayload;
};

export type GraphQLErrorPayload = {
  message: string;
  extensions?: {
    statusCode: number;
  };
};

export type GraphQLAccessToken = {
  jwtToken?: AuthenticationTokenPayload["jwtToken"];
  refreshToken?: AuthenticationTokenPayload["refreshToken"];
  accessExpiresAt?: Maybe<Scalars["Int"]["output"]>;
};
