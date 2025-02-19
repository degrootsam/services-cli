interface GQLLoginResponse {
  jwtToken: string;
  refreshToken: string;
  accessExpiresIn: number;
}
