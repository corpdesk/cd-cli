import chalk from 'chalk';
import { CiCdService } from '../../../../sys/dev-descriptor/index.js';
import { CdFxReturn } from '../../../../sys/base/i-base.js';


// ✅ Shared post-execution handler
// export function handleCommandResponse(response: CdFxReturn<null>) {
//   const svCiCdService = new CiCdService();
//   console.log(`handleCommandResponse()/start`);

//   if (Array.isArray(response?.data)) {
//     console.log(`handleCommandResponse()/isArray-01`);
//     const { failCount } = svCiCdService.printTaskSummary(response.data);
//     if (failCount > 0) {
//       console.log(`handleCommandResponse()/isArray-02`);
//       console.error(chalk.red(`❌ Some tasks failed`));
//       process.exit(1);
//     } else {
//       console.log(`handleCommandResponse()/isArray-03`);
//       console.log(chalk.green(`✅ All tasks completed successfully`));
//     }
//   } else {
//     console.log(`handleCommandResponse()/isNotArray-01`);
//     if (response.state) {
//       console.log(response.message);
//     } else {
//       console.error(response.message);
//       process.exit(1);
//     }
//   }

//   console.log(`handleCommandResponse()/end`);
// }
export function handleCommandResponse(response: CdFxReturn<null>) {
  const svCiCdService = new CiCdService();
  console.log(`handleCommandResponse()/start`);

  if (Array.isArray(response?.data)) {
    console.log(`handleCommandResponse()/isArray-01`);
    const { failCount } = svCiCdService.printTaskSummary(response.data);
    if (failCount > 0) {
      console.log(`handleCommandResponse()/isArray-02`);
      console.error(chalk.red(`❌ Some tasks failed`));
      process.exit(1);
    } else {
      console.log(`handleCommandResponse()/isArray-03`);
      console.log(chalk.green(`✅ All tasks completed successfully`));
    }
  } else {
    console.log(`handleCommandResponse()/isNotArray-04`);
    if (response.state) {
      console.log(response.message);
    } else {
      console.error(response.message);
      process.exit(1);
    }
  }

  console.log(`handleCommandResponse()/end`);
}


