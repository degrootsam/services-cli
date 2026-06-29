import { jest } from "@jest/globals";
import { createConfig } from "../src/utils/config";
import type { LoggerAPI } from "../src/utils/logger";
import type { DirectorAPI } from "../src/utils/director";
import type { PrompterAPI } from "../src/utils/prompter";

const mockLogger: LoggerAPI = {
  debug: jest.fn() as any,
  error: jest.fn() as any,
  info: jest.fn() as any,
  warn: jest.fn() as any,
  toggleVerbose: jest.fn() as any,
  getValidationPrefix: jest.fn(() => "√") as any,
  getValidationColor: jest.fn() as any,
};

const mockDirector: Partial<DirectorAPI> = {
  exists: jest.fn(() => false) as any, // no config.json on disk
  readFile: jest.fn(() => "") as any,
  getTsConfig: jest.fn(() => null) as any, // JS project
};

const mockPrompter: Partial<PrompterAPI> = {
  input: jest.fn() as any,
};

const makeDeps = () => ({
  director: mockDirector as DirectorAPI,
  logger: mockLogger,
  prompter: mockPrompter as PrompterAPI,
});

describe("createConfig", () => {
  beforeEach(() => jest.clearAllMocks());

  it("defaults srcDir to 'functions'", () => {
    const config = createConfig({ force: false }, makeDeps());
    expect(config.srcDir).toBe("functions");
  });

  it("uses .js extension when no tsconfig found", () => {
    const config = createConfig({ force: false }, makeDeps());
    expect(config.projectExtension).toBe(".js");
  });

  it("uses .ts extension when tsconfig found", () => {
    const deps = makeDeps();
    (deps.director.getTsConfig as any).mockReturnValue({ compilerOptions: {} });
    const config = createConfig({ force: false }, deps);
    expect(config.projectExtension).toBe(".ts");
  });

  it("updateConfig mutates the internal state", () => {
    const config = createConfig({ force: false }, makeDeps());
    config.updateConfig({ app: { uuid: "abc-123", identifier: "", zone: "" } });
    expect(config.app.uuid).toBe("abc-123");
  });

  it("force flag is exposed on the config object", () => {
    const config = createConfig({ force: true }, makeDeps());
    expect(config.force).toBe(true);
  });
});
