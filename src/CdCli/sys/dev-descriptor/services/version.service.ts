import { CdAutoGitService } from '../../../app/cd-auto-git/services/cd-auto-git.service.js';
import {
  SemanticVersionMap,
  SemanticVersionObject,
  VersionControlDescriptor,
  VersionControlTag,
} from '../models/version-control.model.js';
import { CD_FX_FAIL, CdFxReturn } from '../../base/IBase.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { toCamelCase } from '../../utilities/cd-naming.util.js';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';
import { MOD_CRAFT_WORKSHOP_DIR } from '../../../app/app-craft/models/app-craft.model.js';
import { inspect } from 'util';

export class VersionService {
  versionDescriptor?: VersionControlDescriptor;
  constructor(private svCdAutoGit = new CdAutoGitService()) {}

  async init(versionDescriptor: VersionControlDescriptor): Promise<void> {
    await this.svCdAutoGit.init();
    this.versionDescriptor = versionDescriptor;
  }

  async getVersionControl(
    cdObjName: string,
    cdObjTypeName: string,
  ): Promise<CdFxReturn<VersionControlDescriptor>> {
    CdLog.debug(`VersionService::getVersioncontrol()/01`);
    CdLog.debug(`VersionService::getVersioncontrol()/cdObjName:${cdObjName}`);
    CdLog.debug(`VersionService::getVersioncontrol()/cdObjTypeName:${cdObjTypeName}`);
    try {
      // Convert to dashedName, e.g. cdAi → cd-ai
      const dashedName = cdObjName.toLowerCase();
      const camelName = toCamelCase(cdObjName);

      // Absolute path to the model file
      //   const modelFilePath = resolve(
      //     process.env.HOME || '',
      //     'cd-cli',
      //     'dist',
      //     'CdCli',
      //     'app',
      //     'app-craft',
      //     'workshop',
      //     cdObjTypeName,
      //     'workflow',
      //     cdObjName,
      //     `${dashedName}-workshop.model.js`,
      //   );
      const modelFilePath = join(
        MOD_CRAFT_WORKSHOP_DIR,
        cdObjTypeName,
        'workflow',
        cdObjTypeName,
        `${dashedName}-workshop.model.js`,
      );
      CdLog.debug(`VersionService::getVersioncontrol()/02`);
      CdLog.debug(`VersionService::getVersioncontrol()/modelFilePath:${modelFilePath}`);
      const modelUrl = pathToFileURL(modelFilePath).href;
      CdLog.debug(`VersionService::getVersioncontrol()/modelUrl:${modelUrl}`);
      const importedModule = await import(modelUrl);
      CdLog.debug(`VersionService::getVersioncontrol()/03`);
      // The exported constant is expected to be named consistently, e.g. cdAiVersionControl
      const exportName = `${camelName}VersionControl`;
      CdLog.debug(`VersionService::getVersioncontrol()/04`);
      CdLog.debug(`VersionService::getVersioncontrol()/exportName:${exportName}`);
      const versionControl = importedModule[exportName] as VersionControlDescriptor;
      CdLog.debug(`VersionService::getVersioncontrol()/versionControl:${inspect(versionControl, {depth: 2})}`);
      if (!versionControl) {
        CdLog.debug(`VersionService::getVersioncontrol()/05`);
        return {
          state: false,
          message: `VersionControlDescriptor '${exportName}' not found in ${modelFilePath}`,
          data: null,
        };
      }

      CdLog.debug(`VersionService::getVersioncontrol()/06`);
      return {
        state: true,
        message: 'VersionControlDescriptor loaded successfully.',
        data: versionControl,
      };
    } catch (error: any) {
      CdLog.debug(`VersionService::getVersioncontrol()/07`);
      CdLog.debug(`VersionService::getVersioncontrol()/error.message: ${error.message}`);
      return {
        state: false,
        message: `Failed to load VersionControlDescriptor: ${error.message}`,
        data: null,
      };
    }
  }

  async parseVersionInput(input: string): Promise<CdFxReturn<SemanticVersionMap>> {
    if (!input) {
      return {
        state: false,
        data: null,
        message: '❌ Version input is required.',
      };
    }

    try {
      if (input.startsWith('v')) {
        const versionObj = this.parseVersionString(input);
        return {
          state: true,
          data: {
            version: input,
            roadmapId: String(versionObj.major),
            milestoneId: String(versionObj.minor),
            versionObject: versionObj,
          },
        };
      } else {
        const result = await this.resolveGitShaToSemanticVersion(input);
        return result;
      }
    } catch (err: any) {
      return {
        state: false,
        data: null,
        message: `❌ Failed to parse version input: ${err.message}`,
      };
    }
  }

  parseVersionString(semver: string): SemanticVersionObject {
    const version = semver.replace(/^v/, '');
    const [core, label] = version.split('-');
    const [major, minor, patch] = core.split('.').map(Number);

    return {
      major,
      minor,
      patch: patch ?? 0,
      label,
    };
  }

  async resolveGitShaToSemanticVersion(sha: string): Promise<CdFxReturn<SemanticVersionMap>> {
    try {
      await this.svCdAutoGit.init();
      const tagResult = await this.findTagByCommitSha(sha);
      if (!tagResult.state || !tagResult.data) {
        return {
          state: false,
          data: null,
          message: `❌ No tag found for SHA: ${sha}`,
        };
      }

      const tag = tagResult.data;
      if (!tag.name) {
        return {
          state: false,
          data: null,
          message: `❌ Tag name is missing for SHA: ${sha}`,
        };
      }

      const versionObj = this.parseVersionString(tag.name);
      return {
        state: true,
        data: {
          version: tag.name,
          roadmapId: tag.roadmapRef || String(versionObj.major),
          milestoneId: tag.milestoneRef || String(versionObj.minor),
          versionObject: versionObj,
        },
      };
    } catch (err: any) {
      return {
        state: false,
        data: null,
        message: `❌ Unable to resolve Git SHA to semantic version: ${err.message}`,
      };
    }
  }

  //   async findTagByCommitSha(sha: string): Promise<CdFxReturn<VersionControlTag>> {

  //     const repoUrl = this.versionDescriptor?.repository.url;
  //     if (!repoUrl) {
  //       throw new Error('Repository URL is undefined.');
  //     }
  //     const allTagsResult = await this.svCdAutoGit.getAllTags(repoUrl);
  //     if (!allTagsResult || !allTagsResult.state) {
  //         return {
  //           state: false,
  //           data: null,
  //           message: 'Failed to fetch tags from repository.',
  //         };
  //     }
  //     if(!allTagsResult.data || allTagsResult.data.length === 0) {
  //       return {
  //         state: false,
  //         data: null,
  //         message: 'No tags found in the repository.',
  //       };
  //     }
  //     const allTags = allTagsResult.data as VersionControlTag[];
  //     const matched = allTags.find((tag) => tag.commitHash?.startsWith(sha));
  //     if (!matched) throw new Error(`No tag found for SHA: ${sha}`);
  //     return matched;
  //   }
  async findTagByCommitSha(sha: string): Promise<CdFxReturn<VersionControlTag>> {
    const repoUrl = this.versionDescriptor?.repository.url;
    if (!repoUrl) {
      return {
        state: false,
        data: null,
        message: 'Repository URL is undefined.',
      };
    }

    const allTagsResult = await this.svCdAutoGit.getAllTags(repoUrl);
    if (!allTagsResult?.state || !allTagsResult.data?.length) {
      return {
        state: false,
        data: null,
        message: 'No tags found in the repository.',
      };
    }

    const matched = allTagsResult.data.find((tag) => tag.commitHash?.startsWith(sha));
    if (!matched) {
      return {
        state: false,
        data: null,
        message: `No tag found for SHA: ${sha}`,
      };
    }

    return { state: true, data: matched };
  }
}
