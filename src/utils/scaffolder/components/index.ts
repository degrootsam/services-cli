import { downloadTemplate } from "..";
import { generateBbsConfigFile } from "../../functions/gen/config";
import type { AppDeps } from "../../types";

export async function generateProject({
  deps,
  name,
  force,
}: {
  deps: AppDeps;
  name: string;
  force: boolean;
}): Promise<void> {
  const templateUrl = deps.config.scaffolder.templates.components.project.url;
  await downloadTemplate({
    deps,
    url: templateUrl,
    cloneLocation: name,
    force,
  });
  await generateBbsConfigFile({ deps, targetDir: name });
  deps.logger.info(
    `Components project "${name}" created!

  To start developing:
  - cd ${name}
  - npm install
  - npm run dev
    `,
  );
}

export async function generateComponent({
  deps,
  name,
}: {
  deps: AppDeps;
  name: string;
}): Promise<void> {
  deps.logger.info(`Creating a new component: ${name}`);
}
