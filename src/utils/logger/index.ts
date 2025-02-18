import chalk from "chalk";

export default class Logger {
  debug(...message: any) {
    console.debug(chalk.bgWhite("DEBUG: "), message);
  }

  error(message: any, ...optionalParams: any[]) {
    console.log(chalk.bgRed("ERROR"), message, ...optionalParams);
  }
}
