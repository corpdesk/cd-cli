#!/usr/bin/env node
import { App } from './app.js';
import chalk from 'chalk';

const app = new App();
// Execute the run function
app.run().catch((error) => {
  console.error(`${chalk.red.bold('error')} ${error.message}`);
  // eslint-disable-next-line node/prefer-global/process
  process.exit(1);
});
