/* eslint-disable node/prefer-global/process */
/* eslint-disable style/brace-style */
/* eslint-disable no-case-declarations */
import inquirer from 'inquirer';
import autocompletePrompt from 'inquirer-autocomplete-prompt';

// Register autocomplete prompt with Inquirer
inquirer.registerPrompt('autocomplete', autocompletePrompt);

export class DevModeController {
  private contextStack: string[] = []; // Stack to manage context (e.g., app → module → controller)

  // Mock data for demonstration
  private apps = ['cd-api', 'cd-frontend', 'cd-admin'];
  private modules = {
    'cd-api': ['users', 'orders', 'reports'],
    'cd-frontend': ['dashboard', 'analytics', 'settings'],
    'cd-admin': ['roles', 'permissions', 'logs'],
  };

  private controllers = {
    users: ['userController', 'profileController', 'authController'],
    orders: ['orderController', 'paymentController', 'deliveryController'],
    reports: ['reportController', 'chartController', 'exportController'],
  };

  executeCommand(
    moduleName: string,
    controllerName: string,
    actionName: string,
    options: any,
  ) {
    if (moduleName === 'dev' && !controllerName && !actionName) {
      // No additional arguments; launch REPL
      this.launchRepl();
    } else {
      // Process the command as usual
      this.processCommand(moduleName, controllerName, actionName, options);
    }
  }

  async processCommand(
    moduleName: string,
    controllerName: string,
    actionName: string,
    options: any,
  ) {
    const module = this.modules[moduleName];
    if (!module) {
      throw new Error(`Module "${moduleName}" not found.`);
    }

    const controller = module.controllers[controllerName];
    if (!controller) {
      throw new Error(
        `Controller "${controllerName}" not found in module "${moduleName}".`,
      );
    }

    const action = controller.actions[actionName];
    if (!action) {
      throw new Error(
        `Action "${actionName}" not found in controller "${controllerName}".`,
      );
    }

    // Execute the action with the provided options
    await action.execute(options);
  }

  async launchRepl() {
    console.log('Entering development mode...');
    console.log('Type `help` for a list of available commands.');

    const repl = (await import('node:repl')).start({
      prompt: '> ',
      eval: async (
        input: string,
        context: any,
        filename: string,
        callback: any,
      ) => {
        try {
          // Parse user input into tokens
          const [command, ...args] = input.trim().split(/\s+/);

          // Exit the REPL on 'exit' command
          if (command === 'exit') {
            console.log('Exiting development mode...');
            process.exit(0);
          }

          // Process commands dynamically
          await this.processReplCommand(command, args, callback);
        } catch (error) {
          callback(error);
        }
      },
    });

    repl.on('exit', () => {
      console.log('Exited development mode.');
      process.exit(0);
    });
  }

  async processReplCommand(command: string, args: string[], callback: any) {
    try {
      if (command === 'show') {
        const options = this.parseReplArgs(args); // Parse args like `--apps`
        await this.processCommand('dev', 'show', 'execute', options);
        callback(null, ''); // Clear REPL line after execution
      } else {
        callback(new Error(`Unknown command: ${command}`));
      }
    } catch (error) {
      callback(error);
    }
  }

  parseReplArgs(args: string[]): any {
    const options: any = {};
    for (let i = 0; i < args.length; i++) {
      if (args[i].startsWith('--')) {
        const key = args[i].slice(2);
        options[key] = true;
      }
    }
    return options;
  }

  // Auto-suggestion helper
  private async autoComplete(
    choices: string[],
    message: string,
  ): Promise<string> {
    const { selected } = await inquirer.prompt<{
      selected: string;
    }>([
      {
        type: 'autocomplete',
        name: 'selected',
        message,
        source: async (_answersSoFar, input: string | undefined) => {
          input = input || '';
          return choices.filter((choice) =>
            choice.toLowerCase().includes(input.toLowerCase()),
          );
        },
      },
    ]);

    return selected;
  }

  async showApps() {
    console.log('Available apps:');
    this.apps.forEach((app) => console.log(`- ${app}`));
  }

  async showModules() {
    if (this.contextStack.length < 1) {
      console.error('No app selected. Use "use <app>" to set an app context.');
      return;
    }
    const app = this.contextStack[0];
    console.log(`Modules in app "${app}":`);
    this.modules[app].forEach((module) => console.log(`- ${module}`));
  }

  async showControllers() {
    if (this.contextStack.length < 2) {
      console.error(
        'No module selected. Use "use <module>" to set a module context.',
      );
      return;
    }
    const module = this.contextStack[1];
    console.log(`Controllers in module "${module}":`);
    this.controllers[module].forEach((controller) =>
      console.log(`- ${controller}`),
    );
  }

  async useContext() {
    const level = this.contextStack.length;

    switch (level) {
      case 0:
        // Select an app
        const app = await this.autoComplete(this.apps, 'Select an app to use:');
        console.log(`Switched to app: ${app}`);
        this.contextStack.push(app);
        break;

      case 1:
        // Select a module
        const modules = this.modules[this.contextStack[0]] || [];
        const module = await this.autoComplete(
          modules,
          'Select a module to use:',
        );
        console.log(`Switched to module: ${module}`);
        this.contextStack.push(module);
        break;

      case 2:
        // Select a controller
        const controllers = this.controllers[this.contextStack[1]] || [];
        const controller = await this.autoComplete(
          controllers,
          'Select a controller to use:',
        );
        console.log(`Switched to controller: ${controller}`);
        this.contextStack.push(controller);
        break;

      default:
        console.error('Cannot go deeper. Maximum context level reached.');
    }
  }

  async exitContext() {
    if (this.contextStack.length === 0) {
      console.log('You are already at the top level.');
      return;
    }
    const exited = this.contextStack.pop();
    console.log(`Exited context: ${exited}`);
  }
}
