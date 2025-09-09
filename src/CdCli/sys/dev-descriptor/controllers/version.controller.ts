// import type { CdFxReturn } from './interfaces/cd-fx-return.interface.js';
// import type { CloudServiceDescriptor } from './interfaces/web-service-descriptor.interface.js';
// import type { ServiceService } from './service.service.js';
// import { Body, Controller, Post } from '@nestjs/common.js';

import type { CdFxReturn } from '../../base/i-base.js';
import type { BaseServiceDescriptor } from '../models/service-descriptor.model.js';
import { SemanticVersionObject } from '../models/version-control.model.js';
import { ServiceService } from '../services/service.service.js';
import { VersionService } from '../services/version.service.js';

export class VersionController {
  svVersion = new VersionService();

  async BeforeUpgrade(
    repoPath: string,
    version: SemanticVersionObject,
  ): Promise<CdFxReturn<string>> {
    return this.svVersion.beforeUpgrade(repoPath, version);
  }

  async Upgrade(repoPath: string, version: SemanticVersionObject): Promise<CdFxReturn<null>> {
    return this.svVersion.upgrade(repoPath, version);
  }

  async AfterUpgrade(repoPath: string, version: SemanticVersionObject): Promise<CdFxReturn<null>> {
    return this.svVersion.afterUpgrade(repoPath, version);
  }

  async IncrementPatch(
    repoPath: string,
    version: SemanticVersionObject,
    opts: { dryRun?: boolean; commitMessage?: string } = {},
  ): Promise<CdFxReturn<SemanticVersionObject>> {
    return this.svVersion.incrementPatch(repoPath, version, opts);
  }
}
