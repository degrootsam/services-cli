import BaseScaffolder from "..";
import { CONFIG, logger } from "../..";

// Scaffolder for components projects and individual components
export default class ComponentsScaffolder extends BaseScaffolder {
  async generateProject(name: string, force: boolean) {
    const templateUrl = CONFIG.scaffolder.templates.components.javascript;
    await this.downloadTemplate(templateUrl, name, force);

    logger.info(
      `Components project "${name}" created!

  To start developing:
  - cd ${name}
  - npm install
  - npm run dev
    `,
    );
  }

  async generateComponent(name: string) {
    logger.info(`Creating a new component: ${name}`);
    // Implement component generation logic here
  }
}
