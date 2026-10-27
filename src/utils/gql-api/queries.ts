import type { ActionObject } from "../types.js";

export function loginQuery(
  username: string,
  password: string,
  authProfileUuid: string,
): string {
  // JSON string escaping is valid GraphQL string escaping
  return `
    mutation login {
      login(
        authProfileUuid: ${JSON.stringify(authProfileUuid)}
        username: ${JSON.stringify(username)}
        password: ${JSON.stringify(password)}
      ) {
        jwtToken
        refreshToken
        accessExpiresIn
      }
    }

  `;
}

export function refreshQuery(refreshToken: string): string {
  return `
    mutation refresh {
      refreshToken(token: ${JSON.stringify(refreshToken)}) {
        isValid
        jwtToken
        refreshToken
      }
    }
  `;
}

export function makeQuery(mutation: string, variables: ActionObject) {
  return {
    query: mutation,
    variables: {
      input: {
        ...variables,
      },
    },
  };
}
