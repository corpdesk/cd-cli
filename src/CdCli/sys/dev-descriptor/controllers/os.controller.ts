/* eslint-disable style/operator-linebreak */

/* eslint-disable antfu/if-newline */

/* eslint-disable style/brace-style */
import type { CdFxReturn } from '../../base/i-base.js';
import type {
  OperatingSystemDescriptor,
  SshCredentials,
} from '../models/workstations.model.js';
import { NodeSSH } from 'node-ssh';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';

export class OsController {
  async detectOs(
    sshCredentials: SshCredentials,
  ): Promise<CdFxReturn<OperatingSystemDescriptor>> {
    CdLog.debug('detectOs()/sshCredentials:', sshCredentials);

    const ssh = new NodeSSH();
    try {
      // Establish SSH connection
      await ssh.connect({
        host: sshCredentials.host,
        username: sshCredentials.username,
        port: sshCredentials.port,
        privateKey: sshCredentials.privateKey,
        password: sshCredentials.password,
      });

      // Detect OS type
      const osTypeResult = await ssh.execCommand('uname -s || ver'); // Works for both Linux/macOS and Windows
      const osType = osTypeResult.stdout.trim();

      let osInfo: OperatingSystemDescriptor;

      if (osType.includes('Linux')) {
        osInfo = await this.detectLinux(ssh);
      } else if (osType.includes('Darwin')) {
        osInfo = await this.detectMacOS(ssh);
      } else if (osType.includes('Microsoft') || osType.includes('Windows')) {
        osInfo = await this.detectWindows(ssh);
      } else {
        throw new Error(`Unsupported OS detected: ${osType}`);
      }

      ssh.dispose(); // Close SSH connection

      return {
        data: osInfo,
        state: true,
        message: `OS detected successfully: ${osInfo.name} ${osInfo.version}`,
      };
    } catch (error) {
      CdLog.error(`detectOs()/error: ${error}`);
      return {
        data: null,
        state: false,
        message: `Failed to detect OS: ${(error as Error).message}`,
      };
    } finally {
      ssh.dispose();
    }
  }

  async detectLinux(ssh: NodeSSH): Promise<OperatingSystemDescriptor> {
    const osResult = await ssh.execCommand('cat /etc/os-release');
    const archResult = await ssh.execCommand('uname -m');
    const timezoneResult = await ssh.execCommand(
      'timedatectl | grep "Time zone"',
    );
    // const cpuResult = await ssh.execCommand('nproc');
    // const memoryResult = await ssh.execCommand(
    //   "free -g | awk 'NR==2{print $2}'",
    // );
    // const storageResult = await ssh.execCommand(
    //   "df -h --total | grep 'total' | awk '{print $2}'",
    // );

    const osInfo: Record<string, string> = {};
    osResult.stdout.split('\n').forEach((line) => {
      const [key, value] = line.split('=');
      if (key && value) osInfo[key.trim()] = value.replace(/"/g, '').trim();
    });

    return {
      name: osInfo.NAME || 'Linux',
      version: osInfo.VERSION_ID || 'Unknown',
      //   architecture: archResult.stdout.trim(),
      architecture: this.mapArchitecture(archResult.stdout.trim()),
      timezone: timezoneResult.stdout.split(':')[1]?.trim() || 'Unknown',
      // systemResources: {
      //   cpuCores: Number.parseInt(cpuResult.stdout.trim(), 10) || 1,
      //   memory: {
      //     units: 'GB',
      //     value: Number.parseInt(memoryResult.stdout.trim(), 10) || 0,
      //   },
      //   storage: {
      //     units: 'TB',
      //     value:
      //       Number.parseFloat(storageResult.stdout.replace('G', '').trim()) /
      //         1000 || 0,
      //   },
      // },
    };
  }

  async detectMacOS(ssh: NodeSSH): Promise<OperatingSystemDescriptor> {
    const osResult = await ssh.execCommand('sw_vers');
    const archResult = await ssh.execCommand('uname -m');
    const timezoneResult = await ssh.execCommand('systemsetup -gettimezone');
    // const cpuResult = await ssh.execCommand('sysctl -n hw.ncpu');
    // const memoryResult = await ssh.execCommand('sysctl -n hw.memsize');
    // const storageResult = await ssh.execCommand(
    //   "df -h / | awk 'NR==2{print $2}'",
    // );

    const osInfo: Record<string, string> = {};
    osResult.stdout.split('\n').forEach((line) => {
      const [key, value] = line.split(':');
      if (key && value) osInfo[key.trim()] = value.trim();
    });

    return {
      name: osInfo.ProductName || 'macOS',
      version: osInfo.ProductVersion || 'Unknown',
      //   architecture: archResult.stdout.trim(),
      architecture: this.mapArchitecture(archResult.stdout.trim()),
      timezone: timezoneResult.stdout.split(': ')[1]?.trim() || 'Unknown',
      // allocatedResources: {
      //   cpuCores: Number.parseInt(cpuResult.stdout.trim(), 10) || 1,
      //   memory: {
      //     units: 'GB',
      //     value: Math.round(
      //       Number.parseInt(memoryResult.stdout.trim(), 10) /
      //         (1024 * 1024 * 1024),
      //     ),
      //   },
      //   storage: {
      //     units: 'TB',
      //     value:
      //       Number.parseFloat(storageResult.stdout.replace('G', '').trim()) /
      //         1000 || 0,
      //   },
      // },
    };
  }

  async detectWindows(ssh: NodeSSH): Promise<OperatingSystemDescriptor> {
    const osResult = await ssh.execCommand(
      'systeminfo | findstr /B /C:"OS Name" /C:"OS Version"',
    );
    const archResult = await ssh.execCommand('wmic os get OSArchitecture');
    const timezoneResult = await ssh.execCommand('wmic os get LocalDateTime');
    // const cpuResult = await ssh.execCommand('wmic cpu get NumberOfCores');
    // const memoryResult = await ssh.execCommand(
    //   'wmic OS get TotalVisibleMemorySize',
    // );
    // const storageResult = await ssh.execCommand(
    //   'wmic LogicalDisk where "DeviceID=\'C:\'" get Size',
    // );

    const osLines = osResult.stdout.split('\n');
    const osName =
      osLines
        .find((line) => line.includes('OS Name'))
        ?.split(':')[1]
        ?.trim() || 'Windows.js';
    const osVersion =
      osLines
        .find((line) => line.includes('OS Version'))
        ?.split(':')[1]
        ?.trim() || 'Unknown.js';

    return {
      name: osName,
      version: osVersion,
      //   architecture: archResult.stdout.trim(),
      architecture: this.mapArchitecture(archResult.stdout.trim()),
      timezone: timezoneResult.stdout.trim(),
      // allocatedResources: {
      //   cpuCores: Number.parseInt(cpuResult.stdout.trim(), 10) || 1,
      //   memory: {
      //     units: 'GB',
      //     value: Math.round(
      //       Number.parseInt(memoryResult.stdout.trim(), 10) / (1024 * 1024),
      //     ),
      //   },
      //   storage: {
      //     units: 'TB',
      //     value:
      //       Number.parseFloat(storageResult.stdout.trim()) /
      //         (1024 * 1024 * 1024 * 1024) || 0,
      //   },
      // },
    };
  }

  mapArchitecture(arch: string): 'x86_64' | 'x86' | 'x64' | 'ARM' | 'ARM64' {
    const normalized = arch.toLowerCase();

    if (normalized.includes('x86_64') || normalized.includes('amd64')) {
      return 'x86_64';
    } else if (normalized.includes('i386') || normalized.includes('i686')) {
      return 'x86';
    } else if (normalized.includes('x64')) {
      return 'x64';
    } else if (normalized.includes('arm64') || normalized.includes('aarch64')) {
      return 'ARM64';
    } else if (normalized.includes('arm')) {
      return 'ARM';
    }

    throw new Error(`Unknown architecture: ${arch}`);
  }
}
