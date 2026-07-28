import path from "path";
import { parseName } from "..";
import { AppDeps } from "../..";
import { getFunctions } from "../get";
import { FunctionInfo } from "../types";

export async function generateTest({
  deps,
  func,
  force,
}: {
  deps: AppDeps;
  func?: FunctionInfo;
  force?: boolean;
}): Promise<string> {
  let parsedFunction: FunctionInfo = func as FunctionInfo;
  if (!parsedFunction) {
    const functions = await getFunctions({ deps });
    const functionNames = Object.keys(functions);
    const choices = functionNames.map((name) => ({
      name,
      value: name,
    }));
    const selectedFunction = await deps.prompter.select(choices);
    parsedFunction = functions[selectedFunction];
  }

  const { path: functionDir, latestVersion } = parsedFunction;

  const functionName = path.basename(functionDir);
  const parsedFunctionName = parseName({ name: functionName });

  const extension = deps.config.projectExtension;

  const targetFile = `index${extension}`;

  const targetDir = path.resolve(
    deps.config.srcDir,
    deps.config.scaffolder.tests.directory,
    functionName,
    latestVersion,
  );
  const targetPath = path.resolve(targetDir, targetFile);

  if ((await deps.director.exists(targetPath)) && !force) {
    throw new Error(
      `A test for ${parsedFunctionName}/${latestVersion} already exists! Use --force to overwrite`,
    );
  }

  await deps.director.createDir(targetDir);

  const templatePath = path.resolve(
    deps.director.resolveCLITemplatePath(deps.config.scaffolder.templates.path),
    deps.config.scaffolder.templates.functions.test,
    targetFile,
  );

  let templateContent = await deps.director.readFile(templatePath);

  const importDir = path.resolve(functionDir, latestVersion);
  const relativePath = path.relative(targetDir, importDir);

  templateContent = templateContent.replaceAll(
    "// $importFunction",
    `import {{ functionName }} from "${relativePath}"`,
  );

  templateContent = templateContent.replaceAll(
    "{{ functionName }}",
    parsedFunctionName,
  );

  templateContent = templateContent.replaceAll(
    "{{ functionVersion }}",
    latestVersion,
  );

  templateContent = templateContent.replaceAll(
    "// $callFunction",
    `await ${parsedFunctionName}()`,
  );

  await deps.director.writeFile(targetPath, templateContent);

  deps.spinner.success(`Successfully created test for ${functionName}`);

  return targetPath;
}
