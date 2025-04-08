import { Command, program } from "commander";
import { withErrorHandling, director } from "../../utils";

const update = new Command("update");

update
  .command("install")
  .description("Update the CLI and it's submodules")
  .action(
    withErrorHandling(async () => {
      await director.updateSubmodules();
    }),
  );

update
  .command("check")
  .description("Check for new updates for the CLI and it's submodules")
  .action(
    withErrorHandling(async () => {
      await director.checkSubmodulesForUpdate();
    }),
  );

export default update;
