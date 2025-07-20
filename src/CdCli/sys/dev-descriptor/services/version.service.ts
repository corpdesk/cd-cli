import { CdAutoGitService } from '../../../app/cd-auto-git/services/cd-auto-git.service.js';
import {
  SemanticVersionMap,
  SemanticVersionObject,
  VersionControlDescriptor,
  VersionControlTag,
  VersionParts,
} from '../models/version-control.model.js';
import { CD_FX_FAIL, CdFxReturn, CdFxStateLevel } from '../../base/IBase.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { toCamelCase } from '../../utilities/cd-naming.util.js';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';
import { MOD_CRAFT_WORKSHOP_DIR } from '../../../app/app-craft/models/app-craft.model.js';
import { inspect } from 'util';
import { cdFx } from '../../base/cd-fx-return.util.js';

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
      CdLog.debug(
        `VersionService::getVersioncontrol()/versionControl:${inspect(versionControl, { depth: 2 })}`,
      );
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

  /**
   * Start upgrade set of operations.
   * Following methods, beforeUpgrade, upgrade, afterUpgrade
   * relates to the upgrade process of CdObj items
   * Doc: <proj-root>/sdk/doc/cd_cli_version_upgrade_workflow.md
   */

  /**
   * Handle upgrade preparation by verifying the roadmap and milestone.
   * @param repoPath Path to the repository
   * @param roadmap Name of the roadmap
   * @param milestone Name of the milestone
   * @returns CdFxReturn with next version or error message
   */
  async beforeUpgrade(
    repoPath: string,
    version: SemanticVersionObject,
  ): Promise<CdFxReturn<string>> {
    CdLog.debug(`VersionService::beforeUpgrade()/version:${JSON.stringify(version)}`);

    const stageRes = VersionService.toPipelineStages(version);
    CdLog.debug(`VersionService::beforeUpgrade()/stageRes:${JSON.stringify(stageRes)}`);

    const { roadmap, milestone } = stageRes.data || {};

    CdLog.debug(`VersionService::beforeUpgrade()/roadmap:${roadmap}`);
    CdLog.debug(`VersionService::beforeUpgrade()/milestone:${milestone}`);

    if (!roadmap || !milestone) {
      return cdFx(
        CdFxStateLevel.LogicalFailure,
        'VersionService::beforeUpgrade()/error ❗ Invalid SemanticVersionObject: missing roadmap or milestone',
      );
    }

    const currentTagRes = await this.svCdAutoGit.getCurrentVersionTag(repoPath);
    CdLog.debug(`VersionService::beforeUpgrade()/currentTagRes:${JSON.stringify(currentTagRes)}`);

    if (!currentTagRes.state) {
      return { ...currentTagRes, data: currentTagRes.data ?? '' };
    }

    const roadmapValid = await this.svCdAutoGit.verifyRoadmap(roadmap);
    CdLog.debug(`VersionService::beforeUpgrade()/roadmapValid:${JSON.stringify(roadmapValid)}`);

    if (!roadmapValid.state || !roadmapValid.data) {
      return cdFx(
        CdFxStateLevel.LogicalFailure,
        'VersionService::beforeUpgrade()/error ❗ Invalid roadmap specified.',
      );
    }

    const milestoneValid = await this.svCdAutoGit.verifyMilestoneInRoadmap(roadmap, milestone);
    CdLog.debug(`VersionService::beforeUpgrade()/milestoneValid:${JSON.stringify(milestoneValid)}`);

    if (!milestoneValid.state || !milestoneValid.data) {
      return cdFx(
        CdFxStateLevel.LogicalFailure,
        'VersionService::beforeUpgrade()/error ❗ Milestone not found in roadmap.',
      );
    }

    const nextVersionRes = await this.svCdAutoGit.determineNextVersion(roadmap, milestone);
    CdLog.debug(`VersionService::beforeUpgrade()/nextVersionRes:${JSON.stringify(nextVersionRes)}`);

    if (!nextVersionRes.state) return nextVersionRes;

    return cdFx(CdFxStateLevel.Success, '✅ Ready for upgrade.', nextVersionRes.data || '');
  }

  async upgrade(repoPath: string, version: SemanticVersionObject): Promise<CdFxReturn<null>> {
    CdLog.debug(`VersionService::upgrade()/version:${JSON.stringify(version)}`);

    const versionStrRes = VersionService.toSemantic(version);
    CdLog.debug(`VersionService::upgrade()/versionStrRes:${JSON.stringify(versionStrRes)}`);

    if (!versionStrRes.state || !versionStrRes.data) {
      return cdFx(
        CdFxStateLevel.LogicalFailure,
        'VersionService::upgrade()/error ❗ Failed to format version tag.',
      );
    }

    const upgradeRes = await this.svCdAutoGit.performUpgrade(repoPath);
    CdLog.debug(`VersionService::upgrade()/upgradeRes:${JSON.stringify(upgradeRes)}`);
    if (!upgradeRes.state) return upgradeRes;

    const tagRes = await this.svCdAutoGit.tagProject(repoPath, versionStrRes.data);
    CdLog.debug(`VersionService::upgrade()/tagRes:${JSON.stringify(tagRes)}`);
    if (!tagRes.state) return tagRes;

    const pushRes = await this.svCdAutoGit.pushChangesWithTags(repoPath);
    CdLog.debug(`VersionService::upgrade()/pushRes:${JSON.stringify(pushRes)}`);
    if (!pushRes.state) return pushRes;

    return cdFx(CdFxStateLevel.Success, `✅ Upgrade to version ${versionStrRes.data} completed.`);
  }

  async afterUpgrade(repoPath: string, version: SemanticVersionObject): Promise<CdFxReturn<null>> {
    try {
      CdLog.debug(`VersionService::afterUpgrade()/version:${JSON.stringify(version)}`);

      const versionStrRes = VersionService.toSemantic(version);
      CdLog.debug(`VersionService::afterUpgrade()/versionStrRes:${JSON.stringify(versionStrRes)}`);

      if (!versionStrRes.state || !versionStrRes.data) {
        return cdFx(
          CdFxStateLevel.LogicalFailure,
          'VersionService::afterUpgrade()/error ❗ Failed to generate version string for file update.',
        );
      }

      const versionStr = versionStrRes.data;
      CdLog.debug(`VersionService::afterUpgrade()/versionStr:${versionStr}`);

      const filesToUpdate = [
        '.cd/roadmap.json',
        '.cd/changelog.json',
        '.cd/docs.json',
        'package.json',
      ];
      CdLog.debug(`VersionService::afterUpgrade()/filesToUpdate:${JSON.stringify(filesToUpdate)}`);

      for (const file of filesToUpdate) {
        const filePath = path.join(repoPath, file);
        CdLog.debug(`VersionService::afterUpgrade()/filePath:${filePath}`);

        const exists = await fs.promises
          .stat(filePath)
          .then(() => true)
          .catch(() => false);
        CdLog.debug(`VersionService::afterUpgrade()/exists:${exists}`);
        if (!exists) continue;

        const jsonData = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));
        CdLog.debug(`VersionService::afterUpgrade()/jsonDataBefore:${JSON.stringify(jsonData)}`);

        jsonData.version = versionStr;
        jsonData.lastUpdated = new Date().toISOString();

        await fs.promises.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf-8');
        CdLog.debug(`VersionService::afterUpgrade()/jsonDataAfter:${JSON.stringify(jsonData)}`);
      }

      return cdFx(CdFxStateLevel.Success, '✅ Post-upgrade file updates completed.');
    } catch (err: any) {
      return cdFx(
        CdFxStateLevel.SystemError,
        `VersionService::afterUpgrade()/error ❗ ${err.message}`,
      );
    }
  }

  /**
   * End upgrade set of operations.
   */

  /**
   * start version conversion methods
   * - toSemanticObject
   * - toSemantic
   * - toPipelineStages
   * - toDescriptorField
   */

  /**
   *
   * @param v Semantic version string, e.g. "1.0.0" or "1.0.0-alpha"
   * @returns
   */
  static toSemanticObject(v: string): CdFxReturn<SemanticVersionObject> {
    if (!v || typeof v !== 'string') {
      return cdFx(
        CdFxStateLevel.LogicalFailure,
        '❗ Input must be a non-empty semantic version string',
      );
    }

    const versionRegex = /^(\d+)\.(\d+)(?:\.(\d+))?(?:-([a-zA-Z0-9]+))?$/;
    const match = v.match(versionRegex);

    if (!match) {
      return cdFx(
        CdFxStateLevel.LogicalFailure,
        '❗ Invalid semantic version format. Expected format: MAJOR.MINOR[.PATCH][-LABEL]',
      );
    }

    try {
      const [, majorStr, minorStr, patchStr, label] = match;
      const major = parseInt(majorStr, 10);
      const minor = parseInt(minorStr, 10);
      const patch = patchStr ? parseInt(patchStr, 10) : undefined;

      const versionObj: SemanticVersionObject = {
        major,
        minor,
        ...(patch !== undefined ? { patch } : {}),
        ...(label ? { label } : {}),
      };

      return cdFx(CdFxStateLevel.Success, '✅ Semantic version parsed successfully', versionObj);
    } catch (e: any) {
      return cdFx(
        CdFxStateLevel.SystemError,
        `❗ Unexpected error while parsing semantic version: ${e.message}`,
      );
    }
  }

  static toSemantic(v: SemanticVersionObject): CdFxReturn<string> {
    try {
      let base = `${v.major}.${v.minor}`;
      if (v.patch !== undefined) base += `.${v.patch}`;
      if (v.label) base += `-${v.label}`;
      return { state: true, data: base };
    } catch (e) {
      return {
        state: false,
        message: `Failed to convert to semantic string: Error:${(e as Error).message}`,
      };
    }
  }

  static toPipelineStages(v: SemanticVersionObject): CdFxReturn<{
    roadmap: string;
    milestone: string;
    patchLevel?: number;
    label?: string;
  }> {
    try {
      return {
        state: true,
        data: {
          roadmap: v.major.toString(),
          milestone: v.minor.toString(),
          patchLevel: v.patch,
          label: v.label,
        },
      };
    } catch (e) {
      return {
        state: false,
        message: `Failed to convert to semantic string: Error:${(e as Error).message}`,
      };
    }
  }

  static toDescriptorField(v: SemanticVersionObject): CdFxReturn<{
    versionTag: string;
    orderId: string;
    patchId?: number;
    label?: string;
  }> {
    try {
      return {
        state: true,
        data: {
          versionTag: v.major.toString(),
          orderId: v.minor.toString(),
          patchId: v.patch,
          label: v.label,
        },
      };
    } catch (e) {
      return {
        state: false,
        message: `Failed to convert to semantic string: Error:${(e as Error).message}`,
      };
    }
  }

  static resolveVersionParts(version: SemanticVersionObject): CdFxReturn<VersionParts> {
    const semanticRes = this.toSemantic(version);
    const pipelineRes = this.toPipelineStages(version);

    if (!semanticRes.state || !pipelineRes.state) {
      return cdFx(
        CdFxStateLevel.LogicalFailure,
        '❗ Failed to resolve version parts from SemanticVersionObject.',
      );
    }

    const versionString = semanticRes.data!;
    const { roadmap, milestone, patchLevel } = pipelineRes.data!;
    if (!roadmap || !milestone) {
      return cdFx(
        CdFxStateLevel.LogicalFailure,
        '❗ Invalid SemanticVersionObject: missing roadmap or milestone',
      );
    }
    const patchLevelStr = patchLevel !== undefined ? patchLevel.toString() : '0';
    if (!patchLevelStr) {
      return cdFx(
        CdFxStateLevel.LogicalFailure,
        '❗ Invalid SemanticVersionObject: patch level is undefined',
      );
    }

    const pipelineStage = `Roadmap:${roadmap} > Milestone:${milestone}`;
    const tagComponents = [roadmap, milestone, patchLevelStr];

    return cdFx(CdFxStateLevel.Success, '✅ Resolved version components successfully.', {
      versionString,
      roadmap,
      milestone,
      patchLevel: patchLevelStr,
      pipelineStage,
      tagComponents,
    });
  }

  /**
   * End version conversion methods.
   */
}
