import { createConfig } from "../src/utils/config";
import type { LoggerAPI } from "../src/utils/logger";
import type { DirectorAPI } from "../src/utils/director";
import type { PrompterAPI } from "../src/utils/prompter";

const mockLogger: LoggerAPI = {
  debug: vi.fn() as any,
  error: vi.fn() as any,
  info: vi.fn() as any,
  warn: vi.fn() as any,
  toggleVerbose: vi.fn() as any,
  getValidationPrefix: vi.fn(() => "√") as any,
  getValidationColor: vi.fn() as any,
};

const mockDirector: Partial<DirectorAPI> = {
  exists: vi.fn(() => false) as any,
  readFile: vi.fn(() => "") as any,
  getTsConfig: vi.fn(() => null) as any,
};

const mockPrompter: Partial<PrompterAPI> = {
  input: vi.fn() as any,
};

const makeDeps = () => ({
  director: mockDirector as DirectorAPI,
  logger: mockLogger,
  prompter: mockPrompter as PrompterAPI,
});

describe("createConfig", () => {
  beforeEach(() => vi.clearAllMocks());

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
