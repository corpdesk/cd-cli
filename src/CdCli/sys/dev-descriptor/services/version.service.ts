import { CdAutoGitService } from '../../../app/cd-auto-git/services/cd-auto-git.service.js';
import {
  RepoDirectoryDescriptor,
  SemanticVersionMap,
  SemanticVersionObject,
  VersionControlDescriptor,
  VersionControlTag,
  VersionParts,
} from '../models/version-control.model.js';
import { CD_FX_FAIL, CdFxReturn, CdFxStateLevel } from '../../base/IBase.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { toCamelCase, toPascalCase } from '../../utils/cd-naming.util.js';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';
import { MOD_CRAFT_WORKSHOP_DIR } from '../../../app/app-craft/models/app-craft.model.js';
import { inspect } from 'util';
import { cdFx } from '../../base/cd-fx-return.util.js';
import { envCdApi, envCdCli, envFrontend, envPwa } from '../models/environment.model.js';
import { AppType } from '../models/cd-app.model.js';
import { CdCtx } from '../models/cd-module-descriptor.model.js';
import { CICdPipeline } from '../models/cicd-descriptor.model.js';
import { existsSync, readFileSync } from 'fs';

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
    appType: AppType,
    oEnv: string,
  ): Promise<CdFxReturn<VersionControlDescriptor>> {
    CdLog.debug(`VersionService::getVersioncontrol()/01`);
    CdLog.debug(`VersionService::getVersioncontrol()/cdObjName:${cdObjName}`);
    CdLog.debug(`VersionService::getVersioncontrol()/cdObjTypeName:${cdObjTypeName}`);
    CdLog.debug(`VersionService::getVersioncontrol()/appType:${appType}`);
    CdLog.debug(`VersionService::getVersioncontrol()/oEnv:${oEnv}`);
    try {
      // Convert to dashedName, e.g. cdAi → cd-ai
      const dashedName = cdObjName.toLowerCase();
      const camelName = toCamelCase(cdObjName);

      // const modelFilePath = join(
      //   MOD_CRAFT_WORKSHOP_DIR,
      //   cdObjTypeName,
      //   'workflow',
      //   cdObjTypeName,
      //   `${dashedName}-workshop.model.js`,
      // );

      let aType = '';
      if (oEnv === 'cd-app') {
        aType = 'cd-app';
      } else {
        aType = appType;
      }

      const modelFilePath = join(
        MOD_CRAFT_WORKSHOP_DIR,
        appType,
        'workflow',
        oEnv,
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

  async getVersionControlByName(
    cdObjName: string,
    repoRegistry: VersionControlDescriptor[],
  ): Promise<CdFxReturn<VersionControlDescriptor>> {
    try {
      const match = repoRegistry.find((r) => r.cdObjName === cdObjName);
      if (!match) {
        return {
          state: false,
          data: null,
          message: `VersionService:;getVersionControlByName: could not get results for ${cdObjName}`,
        };
      }
      return {
        state: true,
        data: match,
      };
    } catch (e) {
      return {
        state: false,
        data: null,
        message: `VersionService:;getVersionControlByName: Error: ${(e as Error).message}`,
      };
    }
  }

  getRepoDirectoryPath(
    versionControl: VersionControlDescriptor,
    name?: string,
    oEnv?: string,
  ): CdFxReturn<string> {
    if (!versionControl?.repository?.directories) {
      return { state: false, message: 'No directories found in version control', data: '' };
    }

    const dirs = versionControl.repository.directories;

    let match: RepoDirectoryDescriptor | undefined;

    // 1️⃣ Try match by name if provided
    if (name) {
      match = dirs.find((d) => d.name === name);
    }

    // 2️⃣ Try match by environment name if provided (and name match failed or not given)
    if (!match && oEnv) {
      match = dirs.find((d) => d.environment?.name === oEnv);
    }

    // 3️⃣ Fallback to default directory
    if (!match) {
      match = dirs.find((d) => d.isDefault);
    }

    // 4️⃣ Return result
    if (match?.path) {
      return { state: true, message: 'Directory found', data: match.path };
    }

    return { state: false, message: 'No matching directory found', data: '' };
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

  async getRoadMapData(
    versionControl: VersionControlDescriptor,
    appType: AppType,
    moduleMeta?: { ctx: CdCtx; moduleName: string },
  ): Promise<CdFxReturn<CICdPipeline>> {
    CdLog.debug('getRoadMapData(): Starting...');

    if (!versionControl?.repository.directories) {
      CdLog.debug('getRoadMapData(): No directories found in version control.');
      return cdFx(CdFxStateLevel.NotFound, 'No directories data found in version control.');
    }

    try {
      let appDir = '';
      CdLog.debug(`getRoadMapData(): appType received: ${appType}`);

      switch (appType) {
        case AppType.CdCli:
          appDir =
            versionControl.repository.directories.find((d) => d.environment === envCdCli)?.path ??
            '';
          break;
        case AppType.Frontend:
          appDir =
            versionControl.repository.directories.find((d) => d.environment === envFrontend)
              ?.path ?? '';
          break;
        case AppType.Pwa:
          appDir =
            versionControl.repository.directories.find((d) => d.environment === envPwa)?.path ?? '';
          break;
        case AppType.CdApi:
          appDir =
            versionControl.repository.directories.find((d) => d.environment === envCdApi)?.path ??
            '';
          break;
        default:
          CdLog.debug(`getRoadMapData(): Invalid app type: ${appType}`);
          return cdFx(CdFxStateLevel.LogicalFailure, 'Invalid app type specified.');
      }

      CdLog.debug(`getRoadMapData(): Resolved appDir: ${appDir}`);

      if (!appDir) {
        CdLog.debug(`getRoadMapData(): No directory found for appType: ${appType}`);
        return cdFx(CdFxStateLevel.NotFound, 'No app directory found for the given app type.');
      }

      let roadmapPath = '';

      if (!moduleMeta || !moduleMeta.ctx || !moduleMeta.moduleName) {
        CdLog.debug(`getRoadMapData(): moduleMeta not provided — using root roadmap`);
        roadmapPath = join(appDir, '.cd', 'roadmap.json');
      } else {
        const moduleDir = join(
          appDir,
          'src',
          toPascalCase(appType),
          moduleMeta.ctx,
          moduleMeta.moduleName,
        );
        roadmapPath = join(moduleDir, '.cd', 'roadmap.json');
        CdLog.debug(`getRoadMapData(): Constructed moduleDir: ${moduleDir}`);
      }

      CdLog.debug(`getRoadMapData(): Final roadmapPath: ${roadmapPath}`);

      if (!existsSync(roadmapPath)) {
        CdLog.debug(`getRoadMapData(): File does not exist at path: ${roadmapPath}`);
        return cdFx(CdFxStateLevel.NotFound, `Roadmap file not found at path: ${roadmapPath}`);
      }

      const fileContent = readFileSync(roadmapPath, 'utf-8');
      CdLog.debug(`getRoadMapData(): File read successfully.`);

      const roadmapData = JSON.parse(fileContent) as CICdPipeline;
      CdLog.debug(`getRoadMapData(): File parsed into CICdPipeline.`);

      return cdFx(CdFxStateLevel.Success, 'Roadmap data loaded successfully.', roadmapData);
    } catch (err: any) {
      CdLog.debug(`getRoadMapData(): Exception caught: ${err.message}`);
      return cdFx(CdFxStateLevel.SystemError, `Failed to load roadmap data: ${err.message}`);
    }
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

    // const currentTagRes = await this.svCdAutoGit.getCurrentVersionTag(repoPath);
    // CdLog.debug(`VersionService::beforeUpgrade()/currentTagRes:${JSON.stringify(currentTagRes)}`);

    // if (!currentTagRes.state) {
    //   return { ...currentTagRes, data: currentTagRes.data ?? '' };
    // }
    const currentTagRes = await this.svCdAutoGit.getCurrentVersionTag(repoPath);
    CdLog.debug(`VersionService::beforeUpgrade()/currentTagRes:${JSON.stringify(currentTagRes)}`);

    if (
      currentTagRes.state === CdFxStateLevel.SystemError ||
      currentTagRes.state === CdFxStateLevel.Fatal
    ) {
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

    // const tagRes = await this.svCdAutoGit.tagProject(repoPath, versionStrRes.data);
    // CdLog.debug(`VersionService::upgrade()/tagRes:${JSON.stringify(tagRes)}`);
    // if (!tagRes.state) return tagRes;

    const tagRes = await this.svCdAutoGit.tagProject(repoPath, versionStrRes.data);
    CdLog.debug(`VersionService::upgrade()/tagRes:${JSON.stringify(tagRes)}`);

    if (!tagRes.state) {
      const alreadyExists =
        tagRes.message?.includes('tag') && tagRes.message?.includes('already exists');
      if (alreadyExists) {
        CdLog.debug(
          'VersionService::upgrade()/warning: Tag already exists, skipping tagging phase.',
        );
        return cdFx(
          CdFxStateLevel.Warning,
          `⚠️ Tag '${versionStrRes.data}' already exists. Upgrade proceeded but tag step skipped.`,
        );
      }
    }

    // return cdFx(CdFxStateLevel.SystemError, tagRes.message ?? '❌ Unknown tagging error.');

    const pushRes = await this.svCdAutoGit.pushChangesWithTags(repoPath);
    CdLog.debug(`VersionService::upgrade()/pushRes:${JSON.stringify(pushRes)}`);
    if (!pushRes.state) return pushRes;

    return cdFx(CdFxStateLevel.Success, `✅ Upgrade to version ${versionStrRes.data} completed.`);
  }

  /**
   * Performs post-upgrade maintenance by updating version information across essential metadata files.
   *
   * ## Purpose
   * This method ensures that after a semantic version upgrade, key project metadata files are
   * synchronized with the new version. These files include:
   * - `.cd/roadmap.json`
   * - `.cd/changelog.json`
   * - `.cd/docs.json`
   * - `package.json`
   *
   * ## Policy
   * - This method works for both CdApps and CdModules assuming the `repoPath` is
   *   correctly resolved via version control metadata.
   * - If any of the above files do **not** exist at the time of execution, they are silently skipped.
   * - In the future, support for **auto-creation** of missing `.cd` files is expected, including
   *   developer notification and use of helper templates for initializing file content.
   * - Each existing file will have:
   *   - Its `version` field updated with the semantic version string.
   *   - A `lastUpdated` field set to the current ISO timestamp.
   *
   * ## Notes
   * - Debug logs are available at every stage of the operation for detailed tracing.
   * - Failures during version parsing or file I/O are reported with appropriate CdFxReturn values.
   *
   * @param repoPath Absolute path to the application or module root directory.
   * @param version Semantic version object representing the new version to be applied.
   * @returns A `CdFxReturn<null>` indicating success or the specific failure encountered.
   */
  async afterUpgrade(repoPath: string, version: SemanticVersionObject): Promise<CdFxReturn<null>> {
    try {
      CdLog.debug(`VersionService::afterUpgrade()/version: ${JSON.stringify(version)}`);

      const versionStrRes = VersionService.toSemantic(version);
      if (!versionStrRes.state || !versionStrRes.data) {
        return cdFx(
          CdFxStateLevel.LogicalFailure,
          '❗ Failed to generate version string for file update.',
        );
      }
      const versionStr = versionStrRes.data;

      const cdDirPath = path.join(repoPath, '.cd');
      const defaultFiles: Record<string, any> = {
        'roadmap.json': {
          version: versionStr,
          lastUpdated: new Date().toISOString(),
          steps: [],
          meta: {
            generatedBy: 'afterUpgrade',
            type: 'auto-generated roadmap',
          },
        },
        'changelog.json': {
          version: versionStr,
          lastUpdated: new Date().toISOString(),
          changes: [],
          meta: {
            generatedBy: 'afterUpgrade',
            type: 'auto-generated changelog',
          },
        },
        'docs.json': {
          version: versionStr,
          lastUpdated: new Date().toISOString(),
          documentation: [],
          meta: {
            generatedBy: 'afterUpgrade',
            type: 'auto-generated docs',
          },
        },
      };

      const createdFiles: string[] = [];

      // Ensure .cd directory exists
      const cdDirExists = await fs.promises
        .stat(cdDirPath)
        .then(() => true)
        .catch(() => false);
      if (!cdDirExists) {
        await fs.promises.mkdir(cdDirPath, { recursive: true });
        CdLog.info(`📁 Created missing directory: ${cdDirPath}`);
      }

      // Handle .cd files
      for (const [filename, defaultData] of Object.entries(defaultFiles)) {
        const filePath = path.join(cdDirPath, filename);
        let fileData: any;

        const exists = await fs.promises
          .stat(filePath)
          .then(() => true)
          .catch(() => false);

        if (exists) {
          fileData = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));
          fileData.version = versionStr;
          fileData.lastUpdated = new Date().toISOString();
        } else {
          fileData = defaultData;
          createdFiles.push(`.cd/${filename}`);
        }

        await fs.promises.writeFile(filePath, JSON.stringify(fileData, null, 2), 'utf-8');
        CdLog.debug(`🔧 Updated: ${filePath}`);
      }

      // Handle package.json
      const pkgPath = path.join(repoPath, 'package.json');
      const pkgExists = await fs.promises
        .stat(pkgPath)
        .then(() => true)
        .catch(() => false);
      if (pkgExists) {
        const pkgJson = JSON.parse(await fs.promises.readFile(pkgPath, 'utf-8'));
        pkgJson.version = versionStr;
        pkgJson.lastUpdated = new Date().toISOString();
        await fs.promises.writeFile(pkgPath, JSON.stringify(pkgJson, null, 2), 'utf-8');
        CdLog.debug(`🔧 Updated: package.json`);
      }

      // Developer Notification
      if (createdFiles.length > 0) {
        CdLog.info(
          `🆕 The following files were created during upgrade: ${createdFiles.join(', ')}`,
        );
      }

      return cdFx(CdFxStateLevel.Success, '✅ Post-upgrade operations completed successfully.');
    } catch (err: any) {
      return cdFx(
        CdFxStateLevel.SystemError,
        `❗ VersionService::afterUpgrade() failed: ${err.message}`,
      );
    }
  }

  /**
   *
   * In order to apply auto-increment patch level, you have to place increamentPatch() method
   * in the workflow as a task.
   * See the document: <proj-root>/sdk/doc/cd_cli_patch_level_auto_increment.md
   *
   * @param repoPath
   * @param version
   * @param opts
   * @returns
   */
  async incrementPatch(
    repoPath: string,
    version: SemanticVersionObject,
    opts: { dryRun?: boolean; commitMessage?: string } = {},
  ): Promise<CdFxReturn<SemanticVersionObject>> {
    CdLog.debug(`VersionService::incrementPatch()/version:${JSON.stringify(version)}`);

    const currentTagRes = await this.svCdAutoGit.getCurrentVersionTag(repoPath);
    CdLog.debug(`VersionService::incrementPatch()/currentTagRes:${JSON.stringify(currentTagRes)}`);

    if (!currentTagRes.state || !currentTagRes.data) {
      return cdFx(
        CdFxStateLevel.Warning,
        'VersionService::incrementPatch() ❗ No current tag found. Using base version.',
        version,
      );
    }

    const currentSemanticRes = VersionService.toSemanticObject(currentTagRes.data);
    CdLog.debug(
      `VersionService::incrementPatch()/currentSemanticRes:${JSON.stringify(currentSemanticRes)}`,
    );

    if (!currentSemanticRes.state || !currentSemanticRes.data) {
      return cdFx(CdFxStateLevel.LogicalFailure, '❗ Could not parse current semantic version.');
    }

    const current = currentSemanticRes.data;
    const newVersion: SemanticVersionObject = {
      major: current.major,
      minor: current.minor,
      patch: (current.patch ?? 0) + 1,
    };

    CdLog.debug(`VersionService::incrementPatch()/newVersion:${JSON.stringify(newVersion)}`);

    if (opts.dryRun) {
      return cdFx(CdFxStateLevel.Success, '✅ Dry run completed successfully.', newVersion);
    }

    // Format version string
    const versionStrRes = VersionService.toSemantic(newVersion);
    CdLog.debug(
      `VersionService::incrementPatch()/versionStrRes: ${inspect(versionStrRes, { depth: 2 })}`,
    );
    if (!versionStrRes.state || !versionStrRes.data) {
      return cdFx(
        CdFxStateLevel.LogicalFailure,
        '❗ Failed to convert semantic version to string.',
      );
    }

    const versionStr = versionStrRes.data;
    const commitMessage = opts.commitMessage ?? `🔧 Patch auto-incremented to ${versionStr}`;
    CdLog.debug(`VersionService::incrementPatch()/commitMessage:${commitMessage}`);
    CdLog.debug(`VersionService::incrementPatch()/versionStr:${versionStr}`);

    // Step 1: Update package.json
    const pkgPath = path.join(repoPath, 'package.json');
    try {
      const pkgRaw = await fs.promises.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(pkgRaw);
      pkg.version = versionStr;
      await fs.promises.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
      CdLog.debug(`VersionService::incrementPatch()/package.json updated.`);
    } catch (err: any) {
      return cdFx(CdFxStateLevel.SystemError, `❗ Failed to update package.json: ${err.message}`);
    }

    // Step 2: Update changelog.json
    await this.appendChangeLogEntry(repoPath, versionStr, 'Patch increment auto-applied');

    // Step 3: Update docs.json
    await this.appendDocUpdateEntry(repoPath, versionStr, 'Patch version updated');

    // Step 4: Commit and tag in Git
    const commitRes = await this.svCdAutoGit.commitAndTag(
      repoPath,
      commitMessage,
      `v${versionStr}`,
    );
    if (!commitRes.state) {
      return cdFx(
        commitRes.state as CdFxStateLevel,
        commitRes.message ?? '❗ Commit and tag failed.',
      );
    }

    return cdFx(CdFxStateLevel.Success, `✅ Patch incremented to ${versionStr}`, newVersion);
  }

  /**
   * Finds the AppType for a given repository name based on an array of VersionControlDescriptors.
   *
   * @param repoName - The name of the repository
   * @param versionControlDescriptors - An array of registered VersionControlDescriptors
   * @returns The associated AppType, or undefined if not found
   */
  getAppTypeFromRepoName(
    repoName: string,
    versionControlDescriptors: VersionControlDescriptor[],
  ): AppType | undefined {
    const matchedDescriptor = versionControlDescriptors.find(
      (vcd) => vcd.repository?.name === repoName,
    );

    return matchedDescriptor?.repository?.appType;
  }

  private async appendChangeLogEntry(repoPath: string, version: string, summary: string) {
    try {
      const filePath = path.join(repoPath, '.cd/changelog.json');
      const exists = await fs.promises
        .stat(filePath)
        .then(() => true)
        .catch(() => false);
      if (!exists) return;

      const changelog = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));
      changelog.entries = changelog.entries || [];

      changelog.entries.push({
        version,
        summary,
        date: new Date().toISOString(),
      });

      await fs.promises.writeFile(filePath, JSON.stringify(changelog, null, 2), 'utf-8');
    } catch (err: any) {
      CdLog.debug(`VersionService::appendChangeLogEntry()/error:${err.message}`);
    }
  }

  private async appendDocUpdateEntry(repoPath: string, version: string, summary: string) {
    try {
      const filePath = path.join(repoPath, '.cd/docs.json');
      const exists = await fs.promises
        .stat(filePath)
        .then(() => true)
        .catch(() => false);
      if (!exists) return;

      const docs = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));
      docs.entries = docs.entries || [];

      docs.entries.push({
        version,
        status: 'draft',
        updatedOn: new Date().toISOString(),
        summary,
      });

      await fs.promises.writeFile(filePath, JSON.stringify(docs, null, 2), 'utf-8');
    } catch (err: any) {
      CdLog.debug(`VersionService::appendDocUpdateEntry()/error:${err.message}`);
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
  // static toSemanticObject(v: string): CdFxReturn<SemanticVersionObject> {
  //   if (!v || typeof v !== 'string') {
  //     return cdFx(
  //       CdFxStateLevel.LogicalFailure,
  //       '❗ Input must be a non-empty semantic version string',
  //     );
  //   }

  //   const versionRegex = /^(\d+)\.(\d+)(?:\.(\d+))?(?:-([a-zA-Z0-9]+))?$/;
  //   const match = v.match(versionRegex);

  //   if (!match) {
  //     return cdFx(
  //       CdFxStateLevel.LogicalFailure,
  //       '❗ Invalid semantic version format. Expected format: MAJOR.MINOR[.PATCH][-LABEL]',
  //     );
  //   }

  //   try {
  //     const [, majorStr, minorStr, patchStr, label] = match;
  //     const major = parseInt(majorStr, 10);
  //     const minor = parseInt(minorStr, 10);
  //     const patch = patchStr ? parseInt(patchStr, 10) : undefined;

  //     const versionObj: SemanticVersionObject = {
  //       major,
  //       minor,
  //       ...(patch !== undefined ? { patch } : {}),
  //       ...(label ? { label } : {}),
  //     };

  //     return cdFx(CdFxStateLevel.Success, '✅ Semantic version parsed successfully', versionObj);
  //   } catch (e: any) {
  //     return cdFx(
  //       CdFxStateLevel.SystemError,
  //       `❗ Unexpected error while parsing semantic version: ${e.message}`,
  //     );
  //   }
  // }
  static toSemanticObject(v: string): CdFxReturn<SemanticVersionObject> {
    if (!v || typeof v !== 'string') {
      return cdFx(
        CdFxStateLevel.LogicalFailure,
        '❗ Input must be a non-empty semantic version string',
      );
    }

    const cleaned = this.cleanSemaVer(v);

    const versionRegex = /^(\d+)\.(\d+)(?:\.(\d+))?(?:-([a-zA-Z0-9]+))?$/;
    const match = cleaned.match(versionRegex);

    if (!match) {
      return cdFx(
        CdFxStateLevel.LogicalFailure,
        `❗ Invalid semantic version format after cleaning: '${cleaned}'. Expected MAJOR.MINOR[.PATCH][-LABEL]`,
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

  /**
   * Cleans and normalizes a raw semantic version string.
   * - Removes leading characters like `v`, `version-`, etc.
   * - Splits the string by `.` and ensures each part is numeric.
   * - Trims whitespace and removes any non-digit characters from MAJOR, MINOR, PATCH.
   */
  static cleanSemaVer(raw: string): string {
    if (!raw || typeof raw !== 'string') return '';

    // Remove leading `v`, `version-`, or similar
    let cleaned = raw
      .trim()
      .toLowerCase()
      .replace(/^v|^version-?/, '');

    // Normalize by splitting on `.`, cleaning each piece
    const parts = cleaned.split('.').map((part) => {
      return part.trim().replace(/[^0-9a-zA-Z\-]/g, ''); // Keep alphanumerics and hyphens only
    });

    // Ensure we only return the first three parts for MAJOR.MINOR.PATCH (label is handled separately)
    return parts.slice(0, 3).join('.');
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
