import chalk from 'chalk';
import Table from 'cli-table3';

interface TaskResult {
  stage: string;
  task: string;
  state: number | boolean; // numeric enum or boolean
  message: string;
}

export function printTaskSummary(tasks: TaskResult[]) {
  const table = new Table({
    head: ['Stage', 'Task', 'Status', 'Message'],
    colWidths: [30, 30, 12, 60],
    wordWrap: true,
  });

  let successCount = 0;
  let failCount = 0;

  tasks.forEach(t => {
    let status = '';
    if (t.state === true || t.state === 1) {
      status = chalk.green('✅ Success');
      successCount++;
    } else if (t.state === false || t.state === 0 || t.state === 2) {
      status = chalk.red('❌ Failed');
      failCount++;
    } else {
      status = chalk.yellow('⚠ Partial/Other');
    }

    table.push([t.stage, t.task, status, t.message]);
  });

  console.log('\n' + table.toString());
  console.log(
    chalk.bold(`\nSummary:`) +
    chalk.green(` ${successCount} succeeded`) + ', ' +
    chalk.red(`${failCount} failed`) + ', ' +
    chalk.yellow(`${tasks.length - successCount - failCount} warnings/other`) +
    '\n'
  );

  return { successCount, failCount, total: tasks.length };
}
