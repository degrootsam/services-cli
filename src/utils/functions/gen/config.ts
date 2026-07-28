import path from "path";
import { AppDeps } from "../..";

export async function generateBbsConfigFile({
  deps,
  targetDir,
}: {
  deps: AppDeps;
  targetDir: string;
}): Promise<void> {
  const content = `import { createConfig } from "bbs-cli";

export default createConfig({
  app: {
    uuid: "",
    identifier: "",
    zone: "",
  },
});
`;
  const outputPath = path.resolve(targetDir, "bbs.config.ts");
  await deps.director.writeFile(outputPath, content);
}
