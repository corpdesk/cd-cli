// import type { CdFxReturn } from './interfaces/cd-fx-return.interface.js';
// import type { CloudServiceDescriptor } from './interfaces/web-service-descriptor.interface.js';
// import type { ServiceService } from './service.service.js';
// import { Body, Controller, Post } from '@nestjs/common.js';

import type { CdFxReturn } from '../../base/i-base.js';
import type { BaseServiceDescriptor } from '../models/service-descriptor.model.js';
import { ServiceService } from '../services/service.service.js';

export class ServiceController {
  svService: ServiceService;
  // constructor() {
  //   this.svService = new ServiceService();
  // }

  // async startService(
  //   service: CloudServiceDescriptor,
  // ): Promise<CdFxReturn<string>> {
  //   return this.svService.startService(service);
  // }

  // async restartService(
  //   service: CloudServiceDescriptor,
  // ): Promise<CdFxReturn<string>> {
  //   return this.svService.restartService(service);
  // }

  // async stopService(
  //   service: CloudServiceDescriptor,
  // ): Promise<CdFxReturn<string>> {
  //   return this.svService.stopService(service);
  // }
  constructor() {
    this.svService = new ServiceService();
  }

  async startService(
    service: BaseServiceDescriptor,
  ): Promise<CdFxReturn<string>> {
    return this.svService.startService(service);
  }

  async restartService(
    service: BaseServiceDescriptor,
  ): Promise<CdFxReturn<string>> {
    return this.svService.restartService(service);
  }

  async stopService(
    service: BaseServiceDescriptor,
  ): Promise<CdFxReturn<string>> {
    return this.svService.stopService(service);
  }
}
