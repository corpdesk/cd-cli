import { BaseService, CdFxReturn, CdFxStateLevel } from '../../base/index.js';
import {
  toCamelCase,
  toKebabCase,
  toPascalCase,
  toUniversalSnakeCase,
} from '../../utils/cd-naming.util.js';
import {
  CdControllerDescriptor,
  CdCtx,
  CdModelDescriptor,
  CdModuleDescriptor,
  CdServiceDescriptor,
  dependencies,
  DependencyDescriptorService,
  deriveExemptConfig,
  f,
  FieldDescriptor,
  getExtensionByLangProfile,
  getLanguageByName,
  LanguageName,
  languages,
  RelationshipDescriptor,
} from '../index.js';
import { basename, join } from 'path';
import { readFileSync } from 'fs';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { inspect } from 'util';
import { VersionService } from './version.service.js';
import { getParentDirectory } from '../../utils/fs.util.js';
import {
  MOD_CRAFT_WORKSHOP_DIR,
  ValidationPolicy,
} from '../../../app/app-craft/models/default.model.js';
import {
  ComponentAttributes,
  ComponentDescriptor,
  ComponentType,
  DerivedSuffix,
} from '../models/component-descriptor.model.js';
import { cdFx } from '../../base/cd-fx-return.util.js';
import { isModelComponent } from '../../utils/cd-descriptors.utils.js';
import { FunctionDescriptor } from '../models/function-descriptor.model.js';

export class CdModuleDescriptorService {
  b = new BaseService();
  svDependencyDescriptor = new DependencyDescriptorService();
  extension: string = '';
  private policyCtx: { base: CdModuleDescriptor; custom: CdModuleDescriptor } | null = null;

  /** Ordered list of policies (name + fn), all inside this class (no stray classes). */
  private validationPolicies: ValidationPolicy[] = [];
  // private policies: ValidationPolicy[] = [];
  constructor() {
    const extensionResult = getExtensionByLangProfile(
      LanguageName.TypeScript,
      languages,
      'tsSource',
    );
    if (extensionResult.state === false) {
      throw new Error(`Failed to get extension for TypeScript: ${extensionResult.message}`);
    }
    const language = getLanguageByName(LanguageName.TypeScript, languages);

    // Ensure extension is set early
    if (!this.extension || this.extension === '') {
      this.extension = extensionResult.data || '.ts';
      this.b.logWithContext(
        this,
        'constructor:extension-set',
        { extension: this.extension },
        'debug',
      );
    }

    // -----------------------------
    // Register validation policies in order
    // -----------------------------
    this.registerValidationPolicy(this.policyOverrideDefault);
    this.registerValidationPolicy(this.policyAssignEntitySuffixes); // ensure all entities have a suffix
    this.registerValidationPolicy(this.policyNamingValidation);
    this.registerValidationPolicy(this.policyEnsureSuffixCounterparts);
    this.registerValidationPolicy(this.policyDeduplicateEntities);
    this.registerValidationPolicy(this.policyDependencyValidation);

    this.b.logWithContext(this, 'constructor:end', null, 'debug');
  }

  public normalizeName(name: string, componentType: ComponentType): string {
    this.b.logWithContext(this, 'normalizeName:input', { name, componentType }, 'debug');
    if (!name) return name;

    switch (componentType) {
      case ComponentType.Controller:
      case ComponentType.Service:
      case ComponentType.Model:
        return this.ensureSingleSuffix(name); // primary → no suffix
      case ComponentType.ControllerType:
      case ComponentType.ServiceType:
      case ComponentType.ModelType:
        return this.ensureSingleSuffix(name, 'type');
      case ComponentType.ModelView:
        return this.ensureSingleSuffix(name, 'view');
      default:
        return name; // utilities, plugins, etc.
    }
  }

  /**
   * Normalize a file name based on its component type.
   */
  public normalizeFileName(fileName: string, componentType: ComponentType): string {
    if (!fileName) return fileName;
    switch (componentType) {
      case ComponentType.Controller:
      case ComponentType.ControllerType:
      case ComponentType.Service:
      case ComponentType.ServiceType:
      case ComponentType.Model:
      case ComponentType.ModelType:
        return this.appendSuffixToFileName(fileName, 'type') || fileName;
      case ComponentType.ModelView:
        return this.appendSuffixToFileName(fileName, 'view') || fileName;
      default:
        return fileName;
    }
  }

  /**
   * Ensure a single, correct suffix (type/view) for class names.
   */
  private ensureSingleSuffix(name: string, suffix?: DerivedSuffix): string {
    this.b.logWithContext(this, 'ensureSingleSuffix:input', { name, suffix }, 'debug');
    if (!name) return name;

    if (!suffix) return name; // primary component → no suffix needed

    // clean up repeated suffixes in the name
    let out = this.squashRepeatedSuffix(name, suffix);

    // check casing conventions
    const endsKebab = out.toLowerCase().endsWith(`-${suffix}`);
    const endsPascal = new RegExp(`${this.capitalize(suffix)}$`).test(out);

    if (endsKebab || endsPascal) {
      this.b.logWithContext(this, 'ensureSingleSuffix:already_has_suffix', out, 'debug');
      return out;
    }

    // add suffix depending on casing style
    const kebab = name.includes('-');
    const result = kebab ? `${out}-${suffix}` : `${out}${this.capitalize(suffix)}`;

    this.b.logWithContext(this, 'ensureSingleSuffix:output', result, 'debug');
    return result;
  }

  /**
   * Append suffix (type/view) to file names.
   */
  private appendSuffixToFileName(fileName: string, suffix: 'type' | 'view'): string | undefined {
    this.b.logWithContext(this, 'appendSuffixToFileName:input', fileName, 'debug');
    if (!fileName) return fileName;

    const dot = fileName.lastIndexOf('.');
    if (dot <= 0) {
      const result = `${this.removeDuplicateSuffixFromFileName(fileName, suffix)}-${suffix}`;
      this.b.logWithContext(this, 'appendSuffixToFileName:no_ext_output', result, 'debug');
      return result;
    }

    const base = this.removeDuplicateSuffixFromFileName(fileName.slice(0, dot), suffix);
    const ext = fileName.slice(dot);

    const baseHasSuffix =
      base.toLowerCase().endsWith(`-${suffix}`) ||
      new RegExp(`${this.capitalize(suffix)}$`).test(base);

    const newBase = baseHasSuffix
      ? base
      : base.includes('-')
        ? `${base}-${suffix}`
        : `${base}${this.capitalize(suffix)}`;
    const result = `${newBase}${ext}`;

    this.b.logWithContext(this, 'appendSuffixToFileName:output', result, 'debug');
    return result;
  }

  /**
   * Remove duplicate suffixes (type/view) from a file name.
   */
  private removeDuplicateSuffixFromFileName(fileName: string, suffix: 'type' | 'view'): string {
    this.b.logWithContext(this, 'removeDuplicateSuffixFromFileName:input', fileName, 'debug');
    if (!fileName) return fileName;

    const dot = fileName.lastIndexOf('.');
    if (dot <= 0) {
      const result = this.squashRepeatedSuffix(fileName, suffix);
      this.b.logWithContext(
        this,
        'removeDuplicateSuffixFromFileName:no_ext_output',
        result,
        'debug',
      );
      return result;
    }

    const base = this.squashRepeatedSuffix(fileName.slice(0, dot), suffix);
    const ext = fileName.slice(dot);
    const result = `${base}${ext}`;

    this.b.logWithContext(this, 'removeDuplicateSuffixFromFileName:output', result, 'debug');
    return result;
  }

  /**
   * Squash repeated suffixes like `Type` or `-type-type`.
   */
  private squashRepeatedSuffix(name: string, suffix: 'type' | 'view'): string {
    return name.replace(new RegExp(`(${this.capitalize(suffix)}|-${suffix})+$`, 'gi'), '');
  }

  /**
   * Capitalize helper.
   */
  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private async sanitizeModuleData(data: CdModuleDescriptor): Promise<CdModuleDescriptor> {
    this.b.logWithContext(this, 'sanitizeModuleData:input', data, 'debug');

    ////////////////////////////////////////////////////
    // 🔄 Generic recursive dedupe
    type DedupeConfig = {
      keyFn: (item: any) => string;
      sublists?: Record<string, DedupeConfig>;
    };

    const dedupeWithConfig = <T extends { name?: string; dbName?: string }>(
      list: T[],
      config: {
        keyFn: (item: T) => string;
        sublists?: Record<string, typeof config>;
      },
      ctx: string,
    ): T[] => {
      this.b.logWithContext(this, 'sanitizeModuleData:starting dedupeWithConfig()', {}, 'debug');
      const seenKeys = new Set<string>();
      const seenNames = new Set<string>();
      const seenDbNames = new Set<string>();
      const result: T[] = [];

      // this.b.logWithContext(this, `dedupeWithConfig/${ctx}:input`, { list, ctx }, 'debug');

      for (const item of list) {
        const key = config.keyFn(item);
        const nameDup = item.name && seenNames.has(item.name);
        const dbDup = item.dbName && seenDbNames.has(item.dbName);

        // this.b.logWithContext(
        //   this,
        //   `dedupeWithConfig/${ctx}:key/seen`,
        //   { key, nameDup, dbDup },
        //   'debug',
        // );

        if (seenKeys.has(key) || nameDup || dbDup) {
          // this.b.logWithContext(
          //   this,
          //   `${ctx}:duplicate_detected`,
          //   {
          //     duplicate: item,
          //     reason: [
          //       seenKeys.has(key) ? `key(${key})` : null,
          //       nameDup ? `name(${item.name})` : null,
          //       dbDup ? `dbName(${item.dbName})` : null,
          //     ].filter(Boolean),
          //   },
          //   'warn',
          // );
          continue;
        }

        seenKeys.add(key);
        if (item.name) seenNames.add(item.name);
        if (item.dbName) seenDbNames.add(item.dbName);

        // ──────────────────────────────
        // Handle sublists recursively
        // ──────────────────────────────
        const dedupedItem: any = { ...item };
        if (config.sublists) {
          for (const [sublistKey, subConfig] of Object.entries(config.sublists)) {
            if (Array.isArray(dedupedItem[sublistKey])) {
              dedupedItem[sublistKey] = dedupeWithConfig(
                dedupedItem[sublistKey],
                subConfig,
                `${ctx}.${(item as any).name ?? 'unknown'}.${sublistKey}`,
              );
            }
          }
        }

        result.push(dedupedItem);
      }

      this.b.logWithContext(
        this,
        `${ctx}:dedupe_result`,
        { kept: result.length, dropped: list.length - result.length },
        'debug',
      );

      return result;
    };

    ////////////////////////////////////////////////////
    // 🔧 Configs for recursive dedupe
    const modelConfig: DedupeConfig = {
      keyFn: (m) => `${m.name}:${m.type}`,
      sublists: {
        fields: {
          keyFn: (f) => f.dbName ?? f.name,
        },
        relationships: {
          keyFn: (r) => r.name,
        },
      },
    };

    const serviceConfig: DedupeConfig = {
      keyFn: (s) => `${s.name}:${s.type}`,
      sublists: {
        attributes: {
          keyFn: (a) => `${a.name}:${a.type}`,
        },
        methods: {
          keyFn: (m) => m.name,
        },
        dependencies: {
          keyFn: (d) => d.name,
        },
      },
    };

    const controllerConfig: DedupeConfig = {
      keyFn: (c) => `${c.name}:${c.type}`,
      sublists: {
        methods: {
          keyFn: (m) => m.name,
        },
        dependencies: {
          keyFn: (d) => d.name,
        },
      },
    };

    ////////////////////////////////////////////////////
    // 🔧 Normalize filenames
    const normalize = <T extends ComponentDescriptor>(list: T[]): T[] =>
      list.map((comp) => ({
        ...comp,
        fileName: this.buildFileName(comp.name, comp.type),
      }));

    ////////////////////////////////////////////////////
    // 1. Deduplicate original input
    this.b.logWithContext(
      this,
      'sanitizeModuleData:starting 1. Deduplicate original input',
      {},
      'debug',
    );
    const deduped: CdModuleDescriptor = {
      ...data,
      controllers: dedupeWithConfig(data.controllers ?? [], controllerConfig, 'controllers'),
      services: dedupeWithConfig(data.services ?? [], serviceConfig, 'services'),
      models: dedupeWithConfig(data.models ?? [], modelConfig, 'models'),
    };

    ////////////////////////////////////////////////////
    // 2. Apply counterpart rules
    this.b.logWithContext(
      this,
      'sanitizeModuleData:starting 2. Apply counterpart rules',
      {},
      'debug',
    );
    const withCounterparts = this.ensureCounterparts(deduped);
    // this.b.logWithContext(
    //   this,
    //   `sanitizeModuleData:withCounterparts.models[1]:`,
    //   { models: JSON.stringify(withCounterparts.models[1]) },
    //   'debug',
    // );
    this.b.logWithContext(
      this,
      `sanitizeModuleData:withCounterparts.services[1]:`,
      { models: JSON.stringify(withCounterparts.services[1]) },
      'debug',
    );

    ////////////////////////////////////////////////////
    // 3. Normalize filenames
    this.b.logWithContext(this, 'sanitizeModuleData:starting 3. Normalize filenames', {}, 'debug');
    const normalized: CdModuleDescriptor = {
      ...withCounterparts,
      controllers: normalize(withCounterparts.controllers ?? []),
      services: normalize(withCounterparts.services ?? []),
      models: normalize(withCounterparts.models ?? []),
    };
    this.b.logWithContext(
      this,
      `sanitizeModuleData:normalized.models[1]:`,
      { models: JSON.stringify(normalized.models[1]) },
      'debug',
    );

    ////////////////////////////////////////////////////
    // 4. Final dedupe pass (post-normalization)
    this.b.logWithContext(
      this,
      'sanitizeModuleData:starting 4. Final dedupe pass (post-normalization)',
      {},
      'debug',
    );
    const result: CdModuleDescriptor = {
      ...normalized,
      controllers: dedupeWithConfig(
        normalized.controllers ?? [],
        controllerConfig,
        'controllers-final',
      ),
      services: dedupeWithConfig(normalized.services ?? [], serviceConfig, 'services-final'),
      models: dedupeWithConfig(normalized.models ?? [], modelConfig, 'models-final'),
    };
    this.b.logWithContext(
      this,
      `sanitizeModuleData:result.models[1]:`,
      { models: JSON.stringify(result.models[1]) },
      'debug',
    );

    ////////////////////////////////////////////////////
    // 5. 🚨 Deduplicate fields inside models (column-safe)
    this.b.logWithContext(
      this,
      'sanitizeModuleData:starting 5. 🚨 Deduplicate fields inside models (column-safe)',
      {},
      'debug',
    );
    result.models = result.models.map((model) => {
      const seenFields = new Set<string>();
      const seenColumns = new Set<string>();

      const filteredFields = model.fields.filter((field) => {
        const fieldKey = field.name;
        const columnKey = toUniversalSnakeCase(field.name);

        if (seenFields.has(fieldKey) || seenColumns.has(columnKey)) {
          this.b.logWithContext(
            this,
            `sanitizeModuleData:duplicate-field-dropped`,
            { model: model.name, field: fieldKey, column: columnKey },
            'warn',
          );
          return false;
        }

        seenFields.add(fieldKey);
        seenColumns.add(columnKey);
        return true;
      });

      return {
        ...model,
        fields: filteredFields,
      };
    });

    ////////////////////////////////////////////////////
    // 6. 🔄 rebuild dependencies on the validated base
    this.b.logWithContext(
      this,
      'sanitizeModuleData:starting 6. 🔄 rebuild dependencies on the validated base',
      {},
      'debug',
    );
    let finalResult: CdModuleDescriptor | null = null;
    try {
      const rebuilt = await this.svDependencyDescriptor.rebuildDependencyData(result);
      if (rebuilt && rebuilt.data) {
        finalResult = rebuilt.data;
      } else {
        this.b.logWithContext(this, 'sanitizeModuleData:dependency-rebuild-null', rebuilt, 'warn');
      }
    } catch (err: any) {
      this.b.logWithContext(
        this,
        'sanitizeModuleData:dependency-rebuild-error',
        {
          error: err.message,
        },
        'error',
      );
    }

    ////////////////////////////////////////////////////
    // ✅ Always return something usable
    return finalResult ?? result;
  }

  private getBaseType(type: ComponentType): string {
    if (type.startsWith('controller')) return 'controller';
    if (type.startsWith('service')) return 'service';
    if (type.startsWith('model')) return 'model';
    if (type === 'utility') return 'utility';
    return type; // fallback
  }

  private buildFileName(name: string, type: ComponentType): string {
    const baseType = this.getBaseType(type);
    return `${name}.${baseType}.ts`;
  }

  // -----------------------------
  // Utility: Register Policy
  // -----------------------------
  private registerValidationPolicy(policy: ValidationPolicy) {
    this.b.logWithContext(this, 'registerValidationPolicy:policy', policy.name, 'debug');
    this.validationPolicies.push(policy);
  }

  // -----------------------------
  // Validation entrypoint
  // -----------------------------
  // async validateDescriptor(
  //   base: CdModuleDescriptor,
  //   custom: CdModuleDescriptor,
  // ): Promise<CdFxReturn<CdModuleDescriptor>> {
  //   let merged: CdModuleDescriptor = { ...base, ...custom };

  //   for (const policy of this.validationPolicies) {
  //     this.b.logWithContext(this, `apply_policy:${policy.name}`, merged, 'debug');
  //     const result = await policy.applyValidationPolicy(base, merged);
  //     if (!result.state || !result.data) {
  //       return result; // stop immediately if a policy fails
  //     }
  //     merged = result.data;
  //   }

  //   return cdFx(CdFxStateLevel.Success, 'Validation successful', merged);
  // }
  async validateDescriptor(base: CdModuleDescriptor): Promise<CdFxReturn<CdModuleDescriptor>> {
    let merged: CdModuleDescriptor = { ...base }; // already merged before this call

    for (const policy of this.validationPolicies) {
      this.b.logWithContext(this, `apply_policy:${policy.name}`, merged, 'debug');

      const result = await policy.applyValidationPolicy(merged);
      if (!result.state || !result.data) {
        return result; // stop immediately if a policy fails
      }
      merged = result.data;
    }

    return cdFx(CdFxStateLevel.Success, 'Validation successful', merged);
  }

  // -----------------------------
  // Policy: Assign missing entity types
  // -----------------------------
  // private policyAssignEntitySuffixes: ValidationPolicy = {
  //   name: 'policyAssignEntitySuffixes',
  //   applyValidationPolicy: async (_, descriptor) => {
  //     descriptor.models = descriptor.models.map((entity) => {
  //       if (!entity.type) {
  //         entity.type = ComponentType.Model; // fallback default
  //       }
  //       return entity;
  //     });
  //     return cdFx(CdFxStateLevel.Success, 'Suffixes assigned', descriptor);
  //   },
  // };
  private policyAssignEntitySuffixes: ValidationPolicy = {
    name: 'policyAssignEntitySuffixes',
    applyValidationPolicy: async (descriptor) => {
      descriptor.models = descriptor.models.map((entity) => {
        if (!entity.type) {
          entity.type = ComponentType.Model; // fallback default
        }
        return entity;
      });
      return cdFx(CdFxStateLevel.Success, 'Suffixes assigned', descriptor);
    },
  };

  // -----------------------------
  // Policy: Override defaults
  // -----------------------------
  // private policyOverrideDefault: ValidationPolicy = {
  //   name: 'policyOverrideDefault',
  //   applyValidationPolicy: async (base, custom) => {
  //     const merged = { ...base, ...custom };
  //     return cdFx(CdFxStateLevel.Success, 'Default override applied', merged);
  //   },
  // };
  private policyOverrideDefault: ValidationPolicy = {
    name: 'policyOverrideDefault',
    applyValidationPolicy: async (descriptor) => {
      // previously merged base+custom, now just trust merged input
      return cdFx(CdFxStateLevel.Success, 'Default override applied', descriptor);
    },
  };

  // -----------------------------
  // Policy: Naming validation + normalization
  // -----------------------------
  // private policyNamingValidation: ValidationPolicy = {
  //   name: 'policyNamingValidation',
  //   applyValidationPolicy: async (_, descriptor) => {
  //     for (const entity of descriptor.models) {
  //       if (!entity.name || !entity.type) {
  //         return cdFx(
  //           CdFxStateLevel.NotFound,
  //           `Entity missing name or type: ${entity}`,
  //           descriptor, // return the descriptor, not null
  //         );
  //       }
  //     }
  //     return cdFx(CdFxStateLevel.Success, 'Naming validated', descriptor);
  //   },
  // };
  private policyNamingValidation: ValidationPolicy = {
    name: 'policyNamingValidation',
    applyValidationPolicy: async (descriptor) => {
      for (const entity of descriptor.models) {
        if (!entity.name || !entity.type) {
          return cdFx(
            CdFxStateLevel.NotFound,
            `Entity missing name or type: ${entity}`,
            descriptor,
          );
        }
      }
      return cdFx(CdFxStateLevel.Success, 'Naming validated', descriptor);
    },
  };

  private policyDependencyValidation: ValidationPolicy = {
    name: 'policyDependencyValidation',
    applyValidationPolicy: async (descriptor) => {
      // Check controllers
      for (const controller of descriptor.controllers ?? []) {
        for (const dep of controller.dependencies ?? []) {
          if (!dep.name || !dep.version) {
            return cdFx(
              CdFxStateLevel.NotFound,
              `Invalid dependency in controller ${controller.name}: ${JSON.stringify(dep)}`,
              descriptor,
            );
          }
        }
      }

      // Check models
      for (const model of descriptor.models ?? []) {
        for (const dep of model.dependencies ?? []) {
          if (!dep.name || !dep.version) {
            return cdFx(
              CdFxStateLevel.NotFound,
              `Invalid dependency in model ${model.name}: ${JSON.stringify(dep)}`,
              descriptor,
            );
          }
        }
      }

      // Check services
      for (const service of descriptor.services ?? []) {
        for (const dep of service.dependencies ?? []) {
          if (!dep.name || !dep.version) {
            return cdFx(
              CdFxStateLevel.NotFound,
              `Invalid dependency in service ${service.name}: ${JSON.stringify(dep)}`,
              descriptor,
            );
          }
        }
      }

      return cdFx(CdFxStateLevel.Success, 'Dependencies validated', descriptor);
    },
  };

  private policyNormalizeSuffix: ValidationPolicy = {
    name: 'policyNormalizeSuffix',
    applyValidationPolicy: async (descriptor) => {
      descriptor.models = descriptor.models.map((entity) => {
        // prevent double suffixing like ServiceService, ModelModel
        if (entity.name.toLowerCase().endsWith(entity.type.toLowerCase())) {
          entity.name = entity.name.replace(new RegExp(entity.type + '$', 'i'), entity.type);
        }
        return entity;
      });
      return cdFx(CdFxStateLevel.Success, 'Suffixes normalized', descriptor);
    },
  };

  private policyEnsureSuffixCounterparts: ValidationPolicy = {
    name: 'policyEnsureSuffixCounterparts',
    applyValidationPolicy: async (descriptor) => {
      const types = descriptor.models.map((e) => e.type);

      const counterpartRules: [ComponentType, ComponentType][] = [
        [ComponentType.Controller, ComponentType.Service],
        [ComponentType.ControllerType, ComponentType.Controller],
        [ComponentType.ServiceType, ComponentType.Service],
        [ComponentType.ModelView, ComponentType.Model],
        [ComponentType.ModelType, ComponentType.Model],
      ];

      for (const [source, target] of counterpartRules) {
        if (
          types.includes(source as ComponentType.Model) &&
          !types.includes(target as ComponentType.Model)
        ) {
          return cdFx(
            CdFxStateLevel.NotFound,
            `Missing counterpart: ${target} required for ${source}`,
            descriptor,
          );
        }
      }

      return cdFx(CdFxStateLevel.Success, 'Counterparts validated', descriptor);
    },
  };

  /**
   * Add missing type suffix to controllers and services
   */
  private policyAddSuffixIfMissing(current: CdModuleDescriptor): CdModuleDescriptor {
    const ensureType = <T extends { name?: string }>(items: T[], suffix: 'type' | 'view'): T[] =>
      items.map((item) => ({
        ...item,
        name: item.name ? this.ensureSingleSuffix(item.name, suffix) : item.name,
      }));

    return {
      ...current,
      controllers: ensureType(current.controllers ?? [], 'type'),
      services: ensureType(current.services ?? [], 'type'),
    };
  }

  /**
   * Sanitize repeated suffixes (-type-type → -type)
   */
  private policySanitizeSuffixes(current: CdModuleDescriptor): CdModuleDescriptor {
    const sanitize = <T extends { name?: string }>(
      items: T[] | undefined,
      suffix: 'type' | 'view',
    ): T[] =>
      (items ?? []).map((item) => ({
        ...item,
        name: item.name ? this.squashRepeatedSuffix(item.name, suffix) : item.name,
      }));

    return {
      ...current,
      controllers: sanitize(current.controllers, 'type'),
      services: sanitize(current.services, 'type'),
      models: sanitize(current.models, 'type'),
    };
  }

  private policyDeduplicateEntities: ValidationPolicy = {
    name: 'policyDeduplicateEntities',
    applyValidationPolicy: async (descriptor) => {
      const seen = new Map<string, any>();
      descriptor.models = descriptor.models.filter((entity) => {
        const key = `${entity.name}-${entity.type}`;
        if (seen.has(key)) {
          return false;
        }
        seen.set(key, true);
        return true;
      });
      return cdFx(CdFxStateLevel.Success, 'Entities deduplicated', descriptor);
    },
  };

  // --- Helpers stay in-class ---

  private mergeWithOverrideByName<T extends { name?: string }>(
    base: T[] = [],
    custom: T[] = [],
  ): T[] {
    this.b.logWithContext(this, 'mergeWithOverrideByName:input', { base }, 'debug');
    const map = new Map<string, T>();
    const unnamed: T[] = [];
    for (const it of base) {
      if (it.name) {
        map.set(it.name, it);
      } else {
        unnamed.push(it);
      }
    }
    for (const it of custom) {
      if (it.name) {
        map.set(it.name, it);
      } else {
        unnamed.push(it);
      }
    }
    const result = [...Array.from(map.values()), ...unnamed];
    this.b.logWithContext(this, 'mergeWithOverrideByName:output', result, 'debug');
    return result;
  }

  async applyPolicies(base: CdModuleDescriptor): Promise<CdFxReturn<CdModuleDescriptor>> {
    this.b.logWithContext(this, 'applyPolicies:input', base, 'debug');

    let result: CdFxReturn<CdModuleDescriptor> = {
      state: true,
      data: base,
      message: 'initial',
    };

    for (const policy of this.validationPolicies) {
      this.b.logWithContext(this, 'applyPolicies:applying_policy', policy.name, 'debug');

      if (!result.data) {
        return {
          state: false,
          data: null,
          message: `Policy failed: ${policy.name} - result.data is null or undefined`,
        };
      }

      // 🟢 Refactored: policy now only receives "base"
      result = await policy.applyValidationPolicy(result.data);

      this.b.logWithContext(this, 'applyPolicies:result', result, 'debug');

      if (!result.state) {
        return {
          ...result,
          message: `Policy failed: ${policy.name} - ${result.message}`,
        };
      }
    }

    if (!result.data) {
      return {
        state: false,
        data: null,
        message: `There was an error processing policy validation`,
      };
    }

    // 🔄 rebuild dependencies on the validated base
    const rebuilt = await this.svDependencyDescriptor.rebuildDependencyData(result.data);
    this.b.logWithContext(this, 'applyPolicies:success', rebuilt, 'debug');
    this.b.logWithContext(
      this,
      'applyPolicies:rebuilt.data?.controllers[0].dependencies',
      rebuilt.data?.controllers[0].dependencies,
      'debug',
    );

    return rebuilt;
  }

  private normalizeNameLikeFields<T extends Record<string, any>>(obj: T): T {
    this.b.logWithContext(this, 'normalizeNameLikeFields:input', obj, 'debug');
    if (!obj) return obj;

    const keys = ['name', 'className', 'fileName', 'methodName', 'attributeName'];
    const out: any = { ...obj };

    for (const k of keys) {
      if (typeof out[k] === 'string') {
        const v: string = out[k];

        // Decide which suffix we want to squash/remove
        if (k === 'fileName') {
          // File names can end with -type.ts or .view.ts
          out[k] = this.removeDuplicateSuffixFromFileName(v, 'type');
          out[k] = this.removeDuplicateSuffixFromFileName(out[k], 'view');
        } else {
          // Names/classes/methods may repeat Type or View
          out[k] = this.squashRepeatedSuffix(v, 'type');
          out[k] = this.squashRepeatedSuffix(out[k], 'view');
        }

        this.b.logWithContext(
          this,
          'normalizeNameLikeFields:field_norm',
          { key: k, original: v, normalized: out[k] },
          'debug',
        );
      }
    }

    this.b.logWithContext(this, 'normalizeNameLikeFields:output', out, 'debug');
    return out;
  }

  private normalizeDescriptorTypeTokens(desc: CdModuleDescriptor): CdModuleDescriptor {
    this.b.logWithContext(this, 'normalizeDescriptorTypeTokens:input', desc, 'debug');
    const clone = { ...desc };
    const normArray = <T extends { name?: string; fileName?: string }>(arr?: T[]) =>
      (arr ?? []).map((x) => {
        let y = this.normalizeNameLikeFields(x);
        if (Array.isArray((y as any).methods)) {
          (y as any).methods = (y as any).methods.map((m: any) => this.normalizeNameLikeFields(m));
        }
        if (Array.isArray((y as any).attributes)) {
          (y as any).attributes = (y as any).attributes.map((a: any) =>
            this.normalizeNameLikeFields(a),
          );
        }
        if (Array.isArray((y as any).fields)) {
          (y as any).fields = (y as any).fields.map((f: any) => this.normalizeNameLikeFields(f));
        }
        return y;
      });

    clone.controllers = normArray(clone.controllers);
    clone.services = normArray(clone.services);
    clone.models = normArray(clone.models);

    return this.normalizeNameLikeFields(clone);
  }

  private ensureCounterparts(data: CdModuleDescriptor): CdModuleDescriptor {
    // ──────────────────────────────
    // Helpers
    // ──────────────────────────────
    this.b.logWithContext(this, 'ensureCounterparts:starting 1', {}, 'debug');
    const ensureFileName = (comp: ComponentDescriptor): string =>
      comp.fileName ?? `${comp.name}.${comp.type}.ts`;

    const kebabToPascal = (str: string): string =>
      str
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');

    const addTypeSuffix = (
      baseName: string,
      fields: FieldDescriptor[] | undefined,
    ): FieldDescriptor[] => {
      // this.b.logWithContext(this, 'addTypeSuffix:start:01', {}, 'debug');
      if (!fields || !Array.isArray(fields)) {
        this.b.logWithContext(this, 'addTypeSuffix:skipped_non_model', { baseName }, 'debug');
        return [];
      }

      const camelBase = toCamelCase(baseName);
      const pascalSuffix = kebabToPascal('type');

      return fields.map((f) => {
        // this.b.logWithContext(this, 'addTypeSuffix:start:02', {}, 'debug');
        let adjustedName = f.name;

        // ensure suffix
        const expectedPrefix = `${camelBase}${pascalSuffix}`;
        if (!f.name.startsWith(expectedPrefix)) {
          adjustedName = f.name.replace(new RegExp(`^${camelBase}`, 'i'), expectedPrefix);
        }

        // ✅ fix dbName for *_type_id safely
        let adjustedDbName = f.dbName;

        if (
          f.name.toLowerCase().endsWith('id') &&
          typeof f.dbName === 'string' &&
          f.dbName.endsWith('_id')
        ) {
          const modulePrefix = baseName.replace(/-/g, '_');
          const lowerDb = f.dbName.toLowerCase();

          if (
            (lowerDb.startsWith(modulePrefix) || lowerDb.startsWith(`${modulePrefix}_`)) &&
            !lowerDb.endsWith('_type_id')
          ) {
            adjustedDbName = `${modulePrefix}_type_id`;
          }
        }

        return { ...f, name: adjustedName, dbName: adjustedDbName };
      });
    };

    /**
     * Adds a default relationship (foreign key) between a base model and a target type
     */
    const addDefaultRelationship = (
      modelBase: CdModelDescriptor,
      typeName: string,
    ): CdModelDescriptor => {
      this.b.logWithContext(this, `addDefaultRelationship:start`, { modelBase }, 'debug');

      // ✅ Ensure fields list exists
      modelBase.fields = modelBase.fields ?? [];

      const fkField: FieldDescriptor = {
        name: `${toCamelCase(typeName)}Id`,
        dbName: `${modelBase.name.replace(/-/g, '_')}_type_id`,
        type: 'number',
        required: true,
      };

      // this.b.logWithContext(this, `addDefaultRelationship:fkField`, { fkField }, 'debug');

      // ✅ Prevent duplicate field addition
      if (!modelBase.fields.some((f) => f.name === fkField.name)) {
        modelBase.fields.push(fkField);
      }

      const rel: RelationshipDescriptor = {
        name: `${modelBase.name}_to_${typeName}`,
        type: 'foreign-key',
        relatedModel: typeName,
        foreignKey: fkField.name,
        sourceColumns: [fkField],
        // targetColumns: [{ name: `${toCamelCase(typeName)}Id`, type: 'number' }],
        targetColumns: [
          { name: `${toCamelCase(typeName)}Id`, type: 'number' },
          { name: `${toCamelCase(typeName)}Guid`, type: 'string' }, // 👈 added
        ],
        sourceTable: modelBase.tableName ?? modelBase.name.replace(/-/g, '_'),
        targetTable: typeName.replace(/-/g, '_'),
      };

      // ✅ Ensure relationships list exists & add new relationship
      modelBase.relationships = [...(modelBase.relationships ?? []), rel];

      return modelBase;
    };

    const processControllersOrServices = (
      list: ComponentDescriptor[] | undefined,
      type:
        | ComponentType.Controller
        | ComponentType.ControllerType
        | ComponentType.Service
        | ComponentType.ServiceType,
    ): ComponentDescriptor[] => {
      this.b.logWithContext(this, `processControllersOrServices:start/list:`, { list }, 'debug');
      if (!list) return [];
      const enriched: ComponentDescriptor[] = [];

      // 🔧 Helper: Adjust attributes for service-type
      const adjustServiceAttributesForType = (
        attrs: ComponentAttributes[] | undefined,
        baseName: string,
      ): ComponentAttributes[] => {
        this.b.logWithContext(this, `adjustServiceAttributesForType:start:`, { baseName }, 'debug');

        ////////////////////////////////////////////////////////////////
        // ✅ Adjust validation rules
        const rulesAttr = attrs?.find((a) => a.name === 'cRules');
        this.b.logWithContext(
          this,
          `adjustServiceMethodsForType:rulesAttr:`,
          { rulesAttr },
          'debug',
        );
        if (
          rulesAttr &&
          (typeof rulesAttr.value === 'object' || typeof rulesAttr.defaultValue === 'object')
        ) {
          const newRules = adjustServiceRulesForType(rulesAttr.defaultValue, baseName);
          this.b.logWithContext(
            this,
            `adjustServiceMethodsForType:newRules:`,
            { newRules },
            'debug',
          );
          attrs = attrs?.map((a) => (a.name === 'cRules' ? { ...a, value: newRules } : a));
        }

        //////////////////////////////////////////////////////////////
        if (!attrs) return [];
        return attrs.map((attr) => {
          if (attr.name === 'serviceModel') {
            return {
              ...attr,
              type: `${toPascalCase(baseName)}TypeModel`, // ✅ shift to TypeModel
            };
          }
          return attr;
        });
      };

      // 🔧 Helper: Adjust cRules for service-type
      const adjustServiceRulesForType = (rules: any, baseName: string): any => {
        this.b.logWithContext(this, `adjustServiceRulesForType:start`, { baseName }, 'debug');
        if (!rules) return rules;

        const pascal = toPascalCase(baseName); // e.g., CdAiUsageLogs
        const camel = toCamelCase(baseName); // e.g., cdAiUsageLogs
        const typeCamel = `${camel}Type`; // cdAiUsageLogsType

        const mapField = (f: string) => f.replace(camel, typeCamel);

        // ✅ map and then filter out non-Name fields
        const required = rules.required?.map(mapField).filter((f) => f.endsWith('Name')) ?? [];

        const noDuplicate =
          rules.noDuplicate?.map(mapField).filter((f) => f.endsWith('Name')) ?? [];

        return {
          ...rules,
          required,
          noDuplicate,
        };
      };

      const ensureTypeSuffix = (
        val: string | undefined,
        baseName: string,
        exemptConfig: string[] = [],
      ): string | undefined => {
        this.b.logWithContext(this, `ensureTypeSuffix:start:`, { baseName }, 'debug');
        if (!val) return val;
        if (exemptConfig.includes(val)) return val; // ✅ skip exempted methods

        const pascal = toPascalCase(baseName); // e.g., "CdAi"
        const camel = toCamelCase(baseName); // e.g., "cdAi"

        let newVal = val;

        const regexPascal = new RegExp(`${pascal}(?=[A-Z]|$)`, 'g');
        const regexCamel = new RegExp(`${camel}(?=[A-Z]|$)`, 'g');

        // this.b.logWithContext(this, `ensureTypeSuffix:start`, { val, pascal, camel }, 'debug');

        // Replace PascalCase
        if (regexPascal.test(newVal)) {
          newVal = newVal.replace(regexPascal, `${pascal}Type`);
          this.b.logWithContext(this, `ensureTypeSuffix:afterPascal`, { newVal }, 'debug');
        }

        // Replace camelCase
        if (regexCamel.test(newVal)) {
          newVal = newVal.replace(regexCamel, `${camel}Type`);
          this.b.logWithContext(this, `ensureTypeSuffix:afterCamel`, { newVal }, 'debug');
        }

        // Cleanup accidental double "TypeType"
        const cleanedVal = newVal.replace(/TypeType/g, 'Type');
        if (cleanedVal !== newVal) {
          this.b.logWithContext(
            this,
            `ensureTypeSuffix:cleanupDoubleType`,
            { before: newVal, after: cleanedVal },
            'debug',
          );
        }

        return cleanedVal;
      };

      const adjustServiceMethodsForType = (
        methods: FunctionDescriptor[] | undefined,
        baseName: string,
        exemptConfig: string[] = [], // ✅ new argument
      ): FunctionDescriptor[] => {
        this.b.logWithContext(this, `adjustServiceMethodsForType:start:`, { baseName }, 'debug');
        if (!methods) return [];
        return methods.map((m) => {
          // this.b.logWithContext(this, `adjustServiceMethodsForType:m:`, { m }, 'debug');

          const methodRet = {
            ...m,
            // ✅ Also apply to method name itself
            name: ensureTypeSuffix(m.name, baseName, exemptConfig) ?? m.name,

            parameters: m.parameters?.map((p) => ({
              ...p,
              type: ensureTypeSuffix(p.type, baseName, exemptConfig) ?? p.type,
            })),
            output: m.output
              ? {
                  ...m.output,
                  returnType:
                    ensureTypeSuffix(m.output.returnType, baseName, exemptConfig) ??
                    m.output.returnType,
                  observableInnerType:
                    ensureTypeSuffix(m.output.observableInnerType, baseName, exemptConfig) ??
                    m.output.observableInnerType,
                }
              : m.output,
            typeInfo: m.typeInfo
              ? {
                  ...m.typeInfo,
                  genericTypes: m.typeInfo.genericTypes?.map(
                    (t) => ensureTypeSuffix(t, baseName, exemptConfig) ?? t,
                  ),
                }
              : m.typeInfo,
          };

          // this.b.logWithContext(
          //   this,
          //   `adjustServiceMethodsForType:methodRet:`,
          //   { methodRet },
          //   'debug',
          // );
          return methodRet;
        });
      };

      this.b.logWithContext(this, `adjustServiceMethodsForType:list:`, { list }, 'debug');
      for (const comp of list) {
        const base = { ...comp, fileName: ensureFileName(comp) };
        /**
         * When setting suffix 'Type' for methods, exempt the following.
         * This part will need to be integrated as part of ComponentDescriptor so that each Component can set its own configuration
         */
        const exemptConfig = [
          `${toCamelCase(base.name)}Exists`,
          `get${toPascalCase(base.name)}QB`,
          `${toPascalCase(base.name)}ViewModel`,
        ];

        enriched.push(base);

        const typeName = base.name.endsWith('-type') ? base.name : `${base.name}-type`;

        this.b.logWithContext(this, `adjustServiceMethodsForType:typeName:`, { typeName }, 'debug');
        this.b.logWithContext(this, `adjustServiceMethodsForType:list:`, { list }, 'debug');
        if (!list.some((c) => c.name === typeName && c.type === `${type}-type`)) {
          this.b.logWithContext(this, `ensureCounterparts()/addingTypeComp`, { base }, 'debug');

          const typeComp: ComponentDescriptor = {
            ...base,
            name: typeName,
            type: `${type}-type` as ComponentType,
            fileName: `${typeName}.${type}-type.ts`,
          };

          // 🔑 Special case: adjust service-type attributes & methods
          if (type === ComponentType.Service) {
            typeComp.attributes = adjustServiceAttributesForType(base.attributes, base.name);
            typeComp.methods = adjustServiceMethodsForType(base.methods, base.name, exemptConfig);
          }

          enriched.push(typeComp);
        }
      }

      return enriched;
    };

    const processModels = (list: ComponentDescriptor[] | undefined): CdModelDescriptor[] => {
      if (!list) return [];
      const enriched: CdModelDescriptor[] = [];

      for (const comp of list) {
        const modelBase = {
          ...comp,
          fileName: ensureFileName(comp),
        } as CdModelDescriptor;

        enriched.push(modelBase);

        // Add -type counterpart
        const typeName = modelBase.name.endsWith('-type')
          ? modelBase.name
          : `${modelBase.name}-type`;

        if (
          modelBase.type === ComponentType.Model && // ✅ only act on models
          !list.some((c) => c.name === typeName && c.type === ComponentType.ModelType)
        ) {
          this.b.logWithContext(
            this,
            `ensureCounterparts()/addingModelTypeComp`,
            { modelBase },
            'debug',
          );

          enriched.push({
            ...modelBase,
            name: typeName,
            type: ComponentType.ModelType,
            fileName: `${typeName}.model-type.ts`,
            // ✅ safe: only models have fields
            fields: addTypeSuffix(modelBase.name, modelBase.fields),
          });
        }

        // Add default relationship to type
        addDefaultRelationship(modelBase, typeName);

        // Add -view counterpart
        const viewName = modelBase.name.endsWith('-view')
          ? modelBase.name
          : `${modelBase.name}-view`;
        if (!list.some((c) => c.name === viewName && c.type === 'model-view')) {
          enriched.push({
            ...modelBase,
            name: viewName,
            type: ComponentType.ModelView,
            fileName: `${viewName}.model-view.ts`,
          });
        }
      }
      return enriched;
    };

    // ──────────────────────────────
    // Enrichment process
    // ──────────────────────────────

    const enrichedModels = processModels(data.models);
    // const enrichedServices = processControllersOrServices(data.services, type);

    // this.b.logWithContext(
    //   this,
    //   `ensureCounterparts()`,
    //   { sampleModel: enrichedModels[0] },
    //   'debug',
    // );

    // this.b.logWithContext(
    //   this,
    //   `ensureCounterparts()/enrichedService:`,
    //   { enrichedService: enrichedServices },
    //   'debug',
    // );

    // this.b.logWithContext(
    //   this,
    //   `ensureCounterparts()/services:`,
    //   { services: data.services },
    //   'debug',
    // );

    return {
      ...data,
      controllers: processControllersOrServices(
        data.controllers,
        ComponentType.Controller,
      ) as CdControllerDescriptor[],
      services: processControllersOrServices(
        data.services,
        ComponentType.Service,
      ) as CdServiceDescriptor[],
      models: enrichedModels,
    };
  }

  // ==== C. Deduplication =====================================================
  private keyForEntity(it: any): string {
    this.b.logWithContext(this, 'keyForEntity:input', it, 'debug');
    const name = (it?.name ?? '').toString().toLowerCase();
    const file = (it?.fileName ?? '').toString().toLowerCase();
    const result = `${name}::${file}`;
    this.b.logWithContext(this, 'keyForEntity:output', result, 'debug');
    return result;
  }

  private dedupeArray<T>(arr?: T[], keyFn?: (t: T) => string): T[] {
    this.b.logWithContext(this, 'dedupeArray:input', { arr, keyFn }, 'debug');
    if (!arr || arr.length === 0) return [];
    const key = keyFn ?? ((x: any) => this.keyForEntity(x));
    const map = new Map<string, T>();
    for (const item of arr) {
      this.b.logWithContext(this, 'dedupeArray:item_processing', item, 'debug');
      map.set(key(item), item);
    }
    const result = Array.from(map.values());
    this.b.logWithContext(this, 'dedupeArray:output', result, 'debug');
    return result;
  }

  private dedupeMembers<T extends { name?: string }>(arr?: T[]): T[] {
    this.b.logWithContext(this, 'dedupeMembers:input', arr, 'debug');
    if (!arr) return [];
    const key = (x: T) => (x?.name ?? '').toString().toLowerCase();
    const map = new Map<string, T>();
    for (const m of arr) {
      this.b.logWithContext(this, 'dedupeMembers:item_processing', m, 'debug');
      map.set(key(m), m);
    }
    const result = Array.from(map.values());
    this.b.logWithContext(this, 'dedupeMembers:output', result, 'debug');
    return result;
  }

  private dedupeDescriptor(desc: CdModuleDescriptor): CdModuleDescriptor {
    this.b.logWithContext(this, 'dedupeDescriptor:input', desc, 'debug');
    const clone: any = { ...desc };

    this.b.logWithContext(this, 'dedupeDescriptor:controllers_before', clone.controllers, 'debug');
    clone.controllers = this.dedupeArray(clone.controllers);
    this.b.logWithContext(this, 'dedupeDescriptor:controllers_after', clone.controllers, 'debug');

    this.b.logWithContext(this, 'dedupeDescriptor:services_before', clone.services, 'debug');
    clone.services = this.dedupeArray(clone.services);
    this.b.logWithContext(this, 'dedupeDescriptor:services_after', clone.services, 'debug');

    this.b.logWithContext(this, 'dedupeDescriptor:models_before', clone.models, 'debug');
    clone.models = this.dedupeArray(clone.models);
    this.b.logWithContext(this, 'dedupeDescriptor:models_after', clone.models, 'debug');

    clone.controllers = (clone.controllers ?? []).map((c: any) => ({
      ...c,
      methods: this.dedupeMembers(c.methods),
      attributes: this.dedupeMembers(c.attributes),
    }));

    clone.services = (clone.services ?? []).map((s: any) => ({
      ...s,
      methods: this.dedupeMembers(s.methods),
      attributes: this.dedupeMembers(s.attributes),
    }));

    clone.models = (clone.models ?? []).map((m: any) => ({
      ...m,
      fields: this.dedupeMembers(m.fields),
    }));

    this.b.logWithContext(this, 'dedupeDescriptor:final_output', clone, 'debug');
    return clone as CdModuleDescriptor;
  }

  // ==== D. Signatures for new controllers/services created by policy =========
  private ensureControllerSignature<T extends { classSignature?: any }>(c: T): T {
    this.b.logWithContext(this, 'ensureControllerSignature:input', c, 'debug');
    if (!c.classSignature) {
      (c as any).classSignature = { extends: 'CdController' };
      this.b.logWithContext(this, 'ensureControllerSignature:added_signature', c, 'debug');
    }
    return c;
  }

  private ensureServiceSignature<T extends { classSignature?: any }>(s: T): T {
    this.b.logWithContext(this, 'ensureServiceSignature:input', s, 'debug');
    if (!s.classSignature) {
      (s as any).classSignature = { extends: 'CdService', implements: [] };
      this.b.logWithContext(this, 'ensureServiceSignature:added_signature', s, 'debug');
    }
    return s;
  }

  private toTypeName(name: string): string {
    this.b.logWithContext(this, 'toTypeName:input', name, 'debug');
    if (name.endsWith('-type')) return name;
    const result = `${name}-type`;
    this.b.logWithContext(this, 'toTypeName:output', result, 'debug');
    return result;
  }

  // This service is responsible for managing module descriptors in the system.
  // It can include methods to create, update, delete, and retrieve module descriptors.

  // Example method to create a new module descriptor
  createModuleDescriptor(descriptor: any): void {
    // Implementation for creating a module descriptor
  }

  // Example method to update an existing module descriptor
  updateModuleDescriptor(id: string, descriptor: any): void {
    // Implementation for updating a module descriptor
  }

  // Example method to delete a module descriptor
  deleteModuleDescriptor(id: string): void {
    // Implementation for deleting a module descriptor
  }

  // Example method to retrieve a module descriptor by ID
  getModuleDescriptorById(id: string): any {
    // Implementation for retrieving a module descriptor by ID
    return {};
  }

  async deriveCdModuleDescriptor(basePath: string): Promise<CdFxReturn<CdModuleDescriptor>> {
    CdLog.debug(`CdModuleDescriptorService::deriveCdModuleDescriptor()/01`);
    const ctxDir = getParentDirectory(basePath);
    CdLog.debug(`CdModuleDescriptorService::deriveCdModuleDescriptor()/basePath:${basePath}`);
    CdLog.debug(`CdModuleDescriptorService::deriveCdModuleDescriptor()/ctxDir:${ctxDir}`);

    if (!ctxDir) {
      return {
        state: false,
        data: null,
        message: `Failed to derive context from base path: ${basePath}`,
      };
    }

    const ctxStr = basename(ctxDir); // e.g. 'sys' or 'app'
    CdLog.debug(`CdModuleDescriptorService::deriveCdModuleDescriptor()/ctxStr:${ctxStr}`);
    CdLog.debug(
      `CdModuleDescriptorService::deriveCdModuleDescriptor()/CdCtx:${inspect(CdCtx, { depth: null })}`,
    );

    let ctx: CdCtx;
    if (Object.values(CdCtx).includes(ctxStr as CdCtx)) {
      ctx = ctxStr as CdCtx;
    } else {
      throw new Error(`❌ Invalid context directory: '${ctxStr}' is not a valid CdCtx`);
    }

    const descriptor: CdModuleDescriptor = {
      name: path.basename(basePath),
      cdModuleType: { typeName: 'cd-api' },
      ctx,
      controllers: [],
      models: [],
      services: [],
    };

    // Prepare config
    const exempt = deriveExemptConfig[ctx] || [];
    const skip = (section: string) => exempt.includes(section);

    try {
      const dirs = {
        controllers: path.join(basePath, 'controllers'),
        services: path.join(basePath, 'services'),
        models: path.join(basePath, 'models'),
      };

      if (!skip('controllers') && (await fs.pathExists(dirs.controllers))) {
        const controllerFiles = await fs.readdir(dirs.controllers);
        for (const file of controllerFiles) {
          if (!file.endsWith('.ts')) continue;
          const name = file.replace(/\..*$/, '');
          descriptor.controllers.push({
            name,
            type: ComponentType.Controller,
            fileName: file,
          } as CdControllerDescriptor);
        }
      }

      if (!skip('services') && (await fs.pathExists(dirs.services))) {
        const serviceFiles = await fs.readdir(dirs.services);
        for (const file of serviceFiles) {
          if (!file.endsWith('.ts')) continue;
          const name = file.replace(/\..*$/, '');
          descriptor.services.push({
            name,
            type: ComponentType.Service,
            fileName: file,
          } as CdServiceDescriptor);
        }
      }

      if (!skip('models') && (await fs.pathExists(dirs.models))) {
        const modelFiles = await fs.readdir(dirs.models);
        for (const file of modelFiles) {
          if (!file.endsWith('.ts')) continue;
          const name = file.replace(/\..*$/, '');
          descriptor.models.push({
            name,
            type: ComponentType.Model,
            fileName: file,
            fields: [],
          } as CdModelDescriptor);
        }
      }

      return {
        state: true,
        data: descriptor,
      };
    } catch (err: any) {
      return {
        state: false,
        data: null,
        message: `❌ Failed to derive module descriptor: ${err.message}`,
      };
    }
  }

  async getCtx(basePath): Promise<CdFxReturn<CdCtx>> {
    try {
      const ctxPath = join(basePath, 'ctx.json');
      const ctxData = readFileSync(ctxPath, 'utf-8');
      const ctx: CdCtx = JSON.parse(ctxData);
      return {
        state: true,
        data: ctx,
      };
    } catch (error: any) {
      return {
        state: false,
        data: null,
        message: `Failed to read context from ${basePath}: ${error.message}`,
      };
    }
  }

  defaultCdApiModuleData(customModuleData: CdModuleDescriptor): CdModuleDescriptor {
    const cdObjName = customModuleData.name;
    const modulePascal = toPascalCase(cdObjName);

    const processedControllers = customModuleData.controllers.map((c) => {
      const controllerName = c.name;
      const controllerPascal = toPascalCase(controllerName);
      const controllerCamel = toCamelCase(controllerName);
      const controllerKebab = toKebabCase(controllerName);
      const controllerSnake = toUniversalSnakeCase(controllerName);

      const mergedController = this.buildController(c, controllerName, controllerPascal);
      const mergedModel = this.buildModel(
        customModuleData,
        controllerName,
        controllerCamel,
        controllerKebab,
        controllerSnake,
      );
      const mergedService = this.buildService(
        c,
        controllerName,
        controllerCamel,
        controllerPascal,
        modulePascal,
      );

      this.b.logWithContext(this, `defaultCdApiModuleData:mergedService`, mergedService, 'debug');

      return { controller: mergedController, model: mergedModel, service: mergedService };
    });

    return {
      ...customModuleData,
      controllers: processedControllers.map((e) => e.controller),
      models: processedControllers.map((e) => e.model),
      services: processedControllers.map((e) => e.service),
    };
  }

  private buildController(customController: any, controllerName: string, controllerPascal: string) {
    const controllerCamel = toCamelCase(controllerName);
    const defaultController = {
      type: ComponentType.Controller,
      name: controllerName,
      classSignature: { extends: 'CdController' },
      attributes: [
        {
          name: 'b',
          type: 'BaseService',
          visibility: 'private',
          isDependency: true,
          isStateful: true,
        },
        {
          name: `sv${controllerPascal}`,
          type: `${controllerPascal}Service`,
          visibility: 'private',
          isDependency: true,
          isStateful: true,
        },
        {
          name: `sv${controllerPascal}Type`,
          type: `${controllerPascal}TypeService`,
          visibility: 'private',
          isDependency: true,
          isStateful: true,
        },
      ],
      methods: [
        {
          name: 'constructor',
          scope: { visibility: 'public', static: false },
          output: { returnType: 'void' },
          parameters: [],
          behavior: { isAsync: false, isPure: true, returnsPromise: false },
        },
        ...['Create', `Get`, `GetType`, 'GetCount', 'GetPaged', 'Update', 'Delete'].map((m) => ({
          name: m,
          isDefault: m === 'Create',
          scope: { visibility: 'public', static: false },
          output: {
            returnType: 'Promise<void>',
            description: `${m} operation for ${controllerPascal}`,
          },
          parameters: [
            { name: 'req', type: 'Request' },
            { name: 'res', type: 'Response' },
          ],
          behavior: { isAsync: true, isPure: false, returnsPromise: true },
        })),
      ],
    };

    return {
      ...defaultController,
      ...customController,
      attributes: this.mergeUnique(
        defaultController.attributes,
        customController.attributes,
        'name',
      ),
      methods: this.mergeUnique(defaultController.methods, customController.methods, 'name'),
    };
  }

  private buildModel(
    customModuleData: CdModuleDescriptor,
    controllerName: string,
    controllerCamel: string,
    controllerKebab: string,
    controllerSnake: string,
  ): CdModelDescriptor {
    this.b.logWithContext(this, `buildModel()/controllerName:`, { controllerName }, 'debug');

    const defaultModel: CdModelDescriptor = {
      name: controllerKebab,
      type: ComponentType.Model,
      parentController: controllerName,
      fileName: `${controllerKebab}.model.ts`,
      tableName: controllerSnake,
      fields: [
        {
          name: `${controllerCamel}Id`,
          type: 'number',
          required: true,
          primary: true,
          autoIncrement: true,
          dbName: `${controllerSnake}_id`,
          nullable: false,
          // 🚫 No default or defaultValue for autoIncrement
        },
        {
          name: `${controllerCamel}Guid`,
          type: 'string',
          required: true,
          unique: true,
          defaultValue: 'uuid', // ✅ only this matters
          dbName: `${controllerSnake}_guid`,
          nullable: true,
        },
        {
          name: `${controllerCamel}Name`,
          type: 'string',
          required: true,
          dbName: `${controllerSnake}_name`,
          nullable: true,
        },
        {
          name: `${controllerCamel}Description`,
          type: 'string',
          required: true,
          dbName: `${controllerSnake}_description`,
          nullable: true,
        },
        {
          name: `${controllerCamel}TypeId`,
          type: 'number',
          required: true,
          dbName: `${controllerSnake}_type_id`,
          nullable: true,
        },
        {
          name: `docId`,
          type: 'number',
          required: true,
          dbName: `doc_id`,
          nullable: true,
        },
        {
          name: `${controllerCamel}Enabled`,
          type: 'boolean',
          required: true,
          defaultValue: true, // ✅ correct: will normalize to 1
          dbName: `${controllerSnake}_enabled`,
          nullable: true,
        },
      ],
    };

    const customModel: Partial<CdModelDescriptor> =
      customModuleData.models.find((m) => m.name === controllerName) || {};

    const mergedFields = this.mergeUnique(
      defaultModel.fields,
      customModel.fields ?? [],
      'name',
    ).map((f) => ({
      ...f,
      dbName: f.dbName || toUniversalSnakeCase(f.name), // normalize dbName
    }));

    return {
      ...defaultModel,
      ...customModel,
      fields: mergedFields,
    };
  }

  private buildService(
    customController: any,
    controllerName: string,
    controllerCamel: string,
    controllerPascal: string,
    modulePascal: string,
  ) {
    // just in case controller data overrides the service
    customController.type = ComponentType.Service;

    const defaultService = {
      type: ComponentType.Service,
      name: controllerName,
      classSignature: { extends: 'CdService', implements: [] },
      attributes: [
        { name: 'logger', type: 'Logging', isDefault: true },
        { name: 'b', type: 'BaseService', isDefault: true },
        { name: 'cdToken', type: 'string', isDefault: true },
        { name: 'uid', type: 'number', isDefault: true },
        { name: 'serviceModel', type: `${controllerPascal}Model`, isDefault: true },
        { name: 'svSess', type: 'SessionService', isDefault: true },
        { name: 'validationCreateParams', type: 'any', isDefault: true },
        {
          name: 'cRules',
          type: 'object',
          isDefault: true,
          defaultValue: {
            required: [`${controllerCamel}Name`, `${controllerCamel}TypeId`],
            noDuplicate: [`${controllerCamel}Name`, `${controllerCamel}TypeId`],
          },
        },
        // {
        //   name: 'uRules',
        //   type: 'object',
        //   isDefault: true,
        //   defaultValue: {},
        // },
        // {
        //   name: 'dRules',
        //   type: 'object',
        //   isDefault: true,
        //   defaultValue: {},
        // },
      ],
      methods: [
        {
          name: 'constructor',
          scope: { visibility: 'public', static: false },
          output: { returnType: 'void' },
          parameters: [],
          behavior: { isAsync: false, isPure: true, returnsPromise: false },
        },
        {
          name: 'beforeUpdate',
          scope: { visibility: 'private', static: false },
          output: { returnType: 'any', description: 'Hook to adjust query before update' },
          parameters: [{ name: 'q', type: 'any' }],
          behavior: { isAsync: false, isPure: false, returnsPromise: false },
          isDefault: true,
        },
        ...[
          'create',
          'validateCreate',
          `${controllerCamel}Exists`,
          `get`,
          `getCount`,
          `getPaged`,
          `getQB`,
          `getType`,
          `get${controllerPascal}Profile`,
          `get${controllerPascal}ProfileByToken`,
          `getScoped${controllerPascal}`,
          `update${controllerPascal}Profile`,
          'update',
          'delete',
          `activate${modulePascal}`,
        ].map((m) => ({
          name: m,
          isDefault: m === 'create',
          scope: { visibility: 'public', static: false },
          output: { returnType: 'Promise<void>', description: `Performs ${m}` },
          behavior: { isAsync: true, isPure: false, returnsPromise: true },
          parameters: ['create', 'update', 'delete', 'get', 'validateCreate'].some((k) =>
            m.toLowerCase().includes(k),
          )
            ? [
                { name: 'req', type: 'Request' },
                { name: 'res', type: 'Response' },
              ]
            : undefined,
        })),
      ],
    };

    return {
      ...defaultService,
      ...customController, // override if service defined in custom
      attributes: this.mergeUnique(defaultService.attributes, customController.attributes, 'name'),
      methods: this.mergeUnique(defaultService.methods, customController.methods, 'name'),
    };
  }

  /**
   * Merge two arrays of objects uniquely by a key.
   * Custom items override defaults if they share the same key.
   */
  // private mergeUnique<T extends Record<string, any>>(
  //   defaults: T[],
  //   customs: T[],
  //   key: keyof T,
  // ): T[] {
  //   const map = new Map<any, T>();

  //   // Add defaults first
  //   for (const d of defaults) {
  //     map.set(d[key], d);
  //   }

  //   // Override / add customs
  //   for (const c of customs) {
  //     map.set(c[key], { ...map.get(c[key]), ...c });
  //   }

  //   return Array.from(map.values());
  // }
  private mergeUnique<T>(defaults: T[] = [], customs: T[] = [], key: keyof T): T[] {
    const safeDefaults = Array.isArray(defaults) ? defaults : [];
    const safeCustoms = Array.isArray(customs) ? customs : [];

    const map = new Map<string | number, T>();

    for (const item of safeDefaults) {
      map.set(item[key] as any, item);
    }

    for (const item of safeCustoms) {
      map.set(item[key] as any, item);
    }

    return Array.from(map.values());
  }

  async cdApiModuleData(
    cdObjName: string,
    cdObjTypeName: string,
    extraParams?: any,
  ): Promise<CdFxReturn<CdModuleDescriptor | null>> {
    try {
      CdLog.debug('CdModuleDescritorService::cdApiModuleData()/01');
      CdLog.debug(
        'CdModuleDescritorService::cdApiModuleData()/extraParams: ' +
          inspect(extraParams, { depth: 2 }),
      );

      // 1) Build full path to the JSON descriptor
      const workflowPath = `${MOD_CRAFT_WORKSHOP_DIR}/${extraParams.appType}/workflow/${cdObjName}.create.module.json`;

      // 2) Read and parse custom module descriptor
      const fileContents = readFileSync(workflowPath, 'utf-8');
      const custom: CdModuleDescriptor = JSON.parse(fileContents);
      CdLog.debug('CdModuleDescritorService::cdApiModuleData()/02');

      // 3) Set version control for the module
      const svVersion = new VersionService();
      const vcResult = await svVersion.getVersionControl(
        cdObjName,
        cdObjTypeName,
        extraParams.appType,
        extraParams.oEnv,
      );
      if (!vcResult || !vcResult.state || !vcResult.data) {
        return {
          state: false,
          data: null,
          message: 'Could not get a valid version control for the module',
        };
      }
      custom.versionControl = vcResult.data;
      this.b.logWithContext(this, 'cdApiModuleData:custom', custom, 'debug');

      // 4) Derive base descriptor from custom
      const base: CdModuleDescriptor = await this.defaultCdApiModuleData(custom);
      this.b.logWithContext(this, 'cdApiModuleData:base', base, 'debug');
      this.b.logWithContext(
        this,
        'cdApiModuleData:base.controllers[1]:',
        base.controllers[1],
        'debug',
      );
      // CdLog.debug(`CdModuleDescriptorService::cdApiModuleData:${inspect(base.controllers, {depth: 3})}`, )

      // 5) Validate + merge using registered policies
      const result = await this.applyPolicies(base);
      if (!result.state) {
        return result; // already wrapped in CdFxReturn
      }

      this.b.logWithContext(
        this,
        'cdApiModuleData:result.data?.controllers[0].dependencies',
        result.data?.controllers[0].dependencies,
        'debug',
      );
      if (!result || !result.data) {
        return cdFx(
          CdFxStateLevel.LogicalFailure,
          'There was an error applying validation policies',
          null,
        );
      }

      // 6) Final cleanup/sanitization after policies
      const cdApiModuleData = await this.sanitizeModuleData(result.data);
      // check for counterparts...ok
      // this.b.logWithContext(this, 'cdApiModuleData:cdApiModuleData', cdApiModuleData, 'debug');
      // check for dependencies...ok
      // this.b.logWithContext(this, 'cdApiModuleData:cdApiModuleData.controllers[0].dependencies', cdApiModuleData.controllers[0].dependencies, 'debug');

      return {
        state: true,
        message: 'Descriptors merged successfully.',
        data: cdApiModuleData,
      };
    } catch (error: any) {
      return {
        state: false,
        message: `Failed to merge descriptors2: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * Look up a fileName by component name and type.
   * Uses existing fileName property in descriptor (no suffix guessing).
   */
  getFileNameFromDescriptor(
    componentDescriptor: CdControllerDescriptor | CdServiceDescriptor | CdModelDescriptor,
  ): string | undefined {
    return componentDescriptor.fileName;
  }
}
