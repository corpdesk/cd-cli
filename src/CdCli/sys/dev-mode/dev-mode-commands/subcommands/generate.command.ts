import chalk from 'chalk';
import CdLog from '../../../../sys/cd-comm/controllers/cd-logger.controller.js';
import { CdOpenAiController } from '../../../../app/cd-ai/index.js';

// let chalk: any;

export const generateCommand = {
  name: 'generate',
  description: 'Generate code or content using OpenAI.',
  options: [
    {
      flags: 'prompt',
      description: 'Prompt to generate code or content from.',
    },
    {
      flags: 'descriptor',
      description: 'Use internal descriptor to generate a controller.',
    },
    {
      flags: 'chat',
      description: 'Interact with OpenAI in chat mode.',
    },
  ],
  action: {
    execute: async (options: any) => {
      if (!options.prompt) {
        console.log(chalk.red('Error: Please provide a --prompt.'));
        return;
      }

      CdLog.debug(`generateCommand()/prompt: ${options.prompt}`);

      const ctlOpenAi = new CdOpenAiController();
      if (options.descriptor) {
        CdLog.debug(`generateCommand()/using descriptor`);
        await ctlOpenAi.generateCodeFromDescriptor();
        return;
      }

      if (!options.prompt) {
        console.log(
          chalk.red('Error: Please provide a --prompt or use --descriptor'),
        );
        return;
      }
      const result = await ctlOpenAi.generateFromPrompt(options.prompt);
      console.log(chalk.greenBright(`✔ Generated Output:\n\n${result}\n`));
    },
  },
};
