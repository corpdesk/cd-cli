import { createCommand } from '../subcommands/create.command.js';
import { deleteCommand } from '../subcommands/delete.command.js';
import { deriveCommand } from '../subcommands/derive.command.js';
import { exitCommand } from '../subcommands/exit.command.js';
import { migrateCommand } from '../subcommands/migrate.command.js';
import { readCommand } from '../subcommands/read.command.js';
import { showCommand } from '../subcommands/show.command.js';
import { syncCommand } from '../subcommands/sync.command.js';
import { updateCommand } from '../subcommands/update.command.js';
import { upgradeCommand } from '../subcommands/upgrade.command.js';

const SUBCOMMANDS = {
  show: showCommand,
  sync: syncCommand,
  exit: exitCommand,
  create: createCommand,
  read: readCommand,
  update: updateCommand,
  delete: deleteCommand,
  upgrade: upgradeCommand,
  migrate: migrateCommand,
  derive: deriveCommand,
};

export function getSubcommand(name: string) {
  console.log(`sub-command name: ${name}`)
  return SUBCOMMANDS[name] || null;
}
