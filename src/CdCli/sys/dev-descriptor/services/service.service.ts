/* eslint-disable style/brace-style */
/* eslint-disable style/operator-linebreak */
import { GenericService } from '../../base/generic-service.js';
import type { CdFxReturn } from '../../base/i-base.js';
import { CdObjModel } from '../../moduleman/models/cd-obj.model.js';
import type {
  BaseServiceDescriptor,
  CloudServiceDescriptor,
} from '../models/service-descriptor.model.js';

export class ServiceService extends GenericService<CdObjModel> {
  constructor() {
    super(CdObjModel);
  }
  async startService(
    service: BaseServiceDescriptor,
  ): Promise<CdFxReturn<string>> {
    try {
      // Logic for starting a service (Cloud or System)
      const result =
        service.serviceName === 'custom'
          ? this.startSystemService(service)
          : this.startCloudService(service);
      return {
        data: result,
        state: true,
        message: 'Service started successfully.',
      };
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Failed to start service: ${(error as Error).message}`,
      };
    }
  }

  async restartService(
    service: BaseServiceDescriptor,
  ): Promise<CdFxReturn<string>> {
    try {
      const result =
        service.serviceName === 'custom'
          ? this.restartSystemService(service)
          : this.restartCloudService(service);
      return {
        data: result,
        state: true,
        message: 'Service restarted successfully.',
      };
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Failed to restart service: ${(error as Error).message}`,
      };
    }
  }

  async stopService(
    service: BaseServiceDescriptor,
  ): Promise<CdFxReturn<string>> {
    try {
      const result =
        service.serviceName === 'custom'
          ? this.stopSystemService(service)
          : this.stopCloudService(service);
      return {
        data: result,
        state: true,
        message: 'Service stopped successfully.',
      };
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Failed to stop service: ${(error as Error).message}`,
      };
    }
  }

  private startSystemService(service: BaseServiceDescriptor): string {
    // Execute system command to start a service
    return `System service ${service.serviceName} started.`;
  }

  private restartSystemService(service: BaseServiceDescriptor): string {
    return `System service ${service.serviceName} restarted.`;
  }

  private stopSystemService(service: BaseServiceDescriptor): string {
    return `System service ${service.serviceName} stopped.`;
  }

  private startCloudService(service: BaseServiceDescriptor): string {
    return `Cloud service ${service.serviceName} started on ${service.serviceProvider?.providerName}.`;
  }

  private restartCloudService(service: BaseServiceDescriptor): string {
    return `Cloud service ${service.serviceName} restarted on ${service.serviceProvider?.providerName}.`;
  }

  private stopCloudService(service: BaseServiceDescriptor): string {
    return `Cloud service ${service.serviceName} stopped on ${service.serviceProvider?.providerName}.`;
  }
}
