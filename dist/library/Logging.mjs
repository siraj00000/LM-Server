var _a;
import chalk from 'chalk';
export default class Logging {
}
_a = Logging;
Logging.log = (args) => _a.info(args);
Logging.info = (args) => console.log(chalk.blue(`[${new Date().toLocaleString()}] [INFO]`), typeof args === 'string' ? chalk.blueBright(args) : args);
Logging.warning = (args) => console.log(chalk.yellow(`[${new Date().toLocaleString()}] [WARN]`), typeof args === 'string' ? chalk.yellowBright(args) : args);
Logging.error = (args) => console.log(chalk.red(`[${new Date().toLocaleString()}] [ERROR]`), typeof args === 'string' ? chalk.redBright(args) : args);
//# sourceMappingURL=Logging.mjs.map