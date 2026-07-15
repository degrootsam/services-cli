import { mock } from "bun:test";

export const autoMock = (object: Object) => {
  const result: Record<string, any> = {};
  for (const key in object) {
    result[key] =
      typeof (object as any)[key] === "function"
        ? mock()
        : (object as any)[key];
  }
  return result;
};
