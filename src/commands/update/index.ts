import { Command } from "commander";
import { withErrorHandling, deps } from "../../utils/index.js";
import {
  checkSubmodulesForUpdate,
  updateSubmodules,
} from "../../utils/update/index.js";

const update = new Command("update");

update
  .command("install")
  .description("Update the CLI and it's submodules")
  .action(
    withErrorHandling(async () => {
      await updateSubmodules({ deps });
    }),
  );

update
  .command("check")
  .description("Check for new updates for the CLI and it's submodules")
  .action(
    withErrorHandling(async () => {
      await checkSubmodulesForUpdate({ deps });
    }),
  );

export default update;
