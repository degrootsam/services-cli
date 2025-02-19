import chalk from "chalk";

export default class Logger {
  debug(...message: any) {
    console.debug(chalk.bgWhite(chalk.black("DEBUG:")), ...message);
  }

  error(...message: any) {
    console.error(chalk.bgRed(chalk.black("ERROR:")), ...message);
  }
}
