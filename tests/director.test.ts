import path from "path";
import { director } from "../src/utils";

describe("Director", () => {
  it("should resolve the path correctly if a single name is provided", () => {
    const result = director.resolvePath("test");
    expect(result).toBe(path.resolve(process.cwd(), "test"));
  });
});
