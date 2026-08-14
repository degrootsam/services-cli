import path from "path";
import { AppDeps } from "../index.js";
import { getFunctions } from "./get.js";
import { generateTest } from "./gen/test.js";

export async function bumpFunction({ deps }: { deps: AppDeps }): Promise<void> {
  const functions = await getFunctions({ deps });
  const functionNames = Object.keys(functions);

  const selectedFunctionName = await deps.prompter.select(
    functionNames.map((func) => ({
      value: func,
      name: func,
    })),
    "Please choose a function to bump",
  );

  const selectedFunction = functions[selectedFunctionName];
  const [currentMajorVersion, currentMinorVersion] =
    selectedFunction.latestVersion.split(".").map(Number);

  const newMajorVersion = Number(currentMajorVersion) + 1;
  const newMinorVersion = Number(currentMinorVersion) + 1;

  const newMajorVersionOption = {
    name: newMajorVersion.toString() + ".0",
    value: newMajorVersion.toString() + ".0",
    description: "Major version",
  };

  const newMinorVersionOption = {
    name: `${currentMajorVersion}.${newMinorVersion}`,
    value: `${currentMajorVersion}.${newMinorVersion}`,
    description: "Minor version",
  };

  const newVersion = await deps.prompter.select(
    [newMinorVersionOption, newMajorVersionOption],
    "Please choose a new version",
    newMinorVersion.toString(),
  );

  const sourceDir = path.resolve(
    selectedFunction.path,
    selectedFunction.latestVersion,
  );

  const targetDir = path.resolve(selectedFunction.path, newVersion);

  await deps.director.copyDir(sourceDir, targetDir);

  deps.spinner.success(
    `Successfully bumped function ${selectedFunctionName} from ${selectedFunction.latestVersion} to ${newVersion}`,
  );

  const createTests = await deps.prompter.confirm(
    "Would you like to create tests for this new version?",
    true,
  );

  if (createTests) {
    await generateTest({ deps, func: selectedFunction });
  }
}
