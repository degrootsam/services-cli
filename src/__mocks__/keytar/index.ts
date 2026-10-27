import { mock } from "bun:test";

// In-memory Keychain, keyed by "service/account". Tests reset it with clear().
export const keytarStore = new Map<string, string>();

const key = (service: string, account: string) => `${service}/${account}`;

export const mockedKeytar = {
  setPassword: mock(async (service: string, account: string, value: string) => {
    keytarStore.set(key(service, account), value);
  }),
  getPassword: mock(
    async (service: string, account: string) =>
      keytarStore.get(key(service, account)) ?? null,
  ),
  deletePassword: mock(async (service: string, account: string) =>
    keytarStore.delete(key(service, account)),
  ),
};
