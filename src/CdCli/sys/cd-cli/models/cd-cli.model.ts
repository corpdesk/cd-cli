import { CD_AUTO_GIT_CMD } from '../../../app/cd-auto-git/models/cd-auto-git.model.js';
import { LOGIN_CMD, LOGOUT_CMD } from '../../user/models/user.model.js';
import { PROFILE_CMD } from './cd-cli-profile.model.js';
import { DEV_MODE_COMMANDS } from '../../dev-mode/dev-mode-commands/index.js';
import { CD_AI_LOGS_CMD, CD_OPEN_AI_CMD } from '../../../app/cd-ai/index.js';
import {
  MODULE_CMD,
  TEMPLATE_CMD,
} from '../../../app/mod-craft/models/mod-craft.model.js';

export const CdCli = {
  commands: [
    LOGIN_CMD,
    LOGOUT_CMD,
    PROFILE_CMD,
    MODULE_CMD,
    TEMPLATE_CMD,
    CD_AUTO_GIT_CMD,
    DEV_MODE_COMMANDS,
    CD_OPEN_AI_CMD,
    CD_AI_LOGS_CMD,
  ] as any,
};
