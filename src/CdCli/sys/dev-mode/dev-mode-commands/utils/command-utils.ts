import { createCommand } from '../subcommands/create.command.js';
import { exitCommand } from '../subcommands/exit.command.js';
import { showCommand } from '../subcommands/show.command.js';
import { syncCommand } from '../subcommands/sync.command.js';

const SUBCOMMANDS = {
  show: showCommand,
  sync: syncCommand,
  exit: exitCommand,
  create: createCommand,
};

export function getSubcommand(name: string) {
  return SUBCOMMANDS[name] || null;
}
