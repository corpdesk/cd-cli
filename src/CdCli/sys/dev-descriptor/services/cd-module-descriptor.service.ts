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
  deriveExemptConfig,
  getExtensionByLangProfile,
  getLanguageByName,
  LanguageName,
  languages,
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
  ComponentDescriptor,
  ComponentType,
  DerivedSuffix,
} from '../models/component-descriptor.model.js';
import { cdFx } from '../../base/cd-fx-return.util.js';

export class CdModuleDescriptorService {
  b = new BaseService();
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
   * Squash repeated suffixes like `TypeType` or `-type-type`.
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

  
  private sanitizeModuleData(data: CdModuleDescriptor): CdModuleDescriptor {
    this.b.logWithContext(this, 'sanitizeModuleData:input', data, 'debug');

    const dedupe = <T extends ComponentDescriptor>(list: T[]): T[] => {
      const seen = new Set<string>();
      return list.filter((comp) => {
        const key = `${comp.name}:${comp.type}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    // Normalize fileName for each component
    const normalize = <T extends ComponentDescriptor>(list: T[]): T[] =>
      list.map((comp) => ({
        ...comp,
        fileName: this.buildFileName(comp.name, comp.type),
      }));

    // 1. Deduplicate original input
    const deduped: CdModuleDescriptor = {
      ...data,
      controllers: dedupe(data.controllers ?? []),
      services: dedupe(data.services ?? []),
      models: dedupe(data.models ?? []),
    };

    // 2. Apply counterpart rules
    const withCounterparts = this.ensureCounterparts(deduped);

    // 3. Normalize filenames
    const normalized: CdModuleDescriptor = {
      ...withCounterparts,
      controllers: normalize(withCounterparts.controllers ?? []),
      services: normalize(withCounterparts.services ?? []),
      models: normalize(withCounterparts.models ?? []),
    };

    // 4. Final dedupe
    const result: CdModuleDescriptor = {
      ...normalized,
      controllers: dedupe(normalized.controllers ?? []),
      services: dedupe(normalized.services ?? []),
      models: dedupe(normalized.models ?? []),
    };

    this.b.logWithContext(this, 'sanitizeModuleData:output', result, 'debug');
    return result;
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
  async validateDescriptor(
    base: CdModuleDescriptor,
    custom: CdModuleDescriptor,
  ): Promise<CdFxReturn<CdModuleDescriptor>> {
    let merged: CdModuleDescriptor = { ...base, ...custom };

    for (const policy of this.validationPolicies) {
      this.b.logWithContext(this, `apply_policy:${policy.name}`, merged, 'debug');
      const result = await policy.applyValidationPolicy(base, merged);
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
  private policyAssignEntitySuffixes: ValidationPolicy = {
    name: 'policyAssignEntitySuffixes',
    applyValidationPolicy: async (_, descriptor) => {
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
  private policyOverrideDefault: ValidationPolicy = {
    name: 'policyOverrideDefault',
    applyValidationPolicy: async (base, custom) => {
      const merged = { ...base, ...custom };
      return cdFx(CdFxStateLevel.Success, 'Default override applied', merged);
    },
  };

  
  // -----------------------------
  // Policy: Naming validation + normalization
  // -----------------------------
  private policyNamingValidation: ValidationPolicy = {
    name: 'policyNamingValidation',
    applyValidationPolicy: async (_, descriptor) => {
      for (const entity of descriptor.models) {
        if (!entity.name || !entity.type) {
          return cdFx(
            CdFxStateLevel.NotFound,
            `Entity missing name or type: ${entity}`,
            descriptor, // return the descriptor, not null
          );
        }
      }
      return cdFx(CdFxStateLevel.Success, 'Naming validated', descriptor);
    },
  };

  
  private policyDependencyValidation: ValidationPolicy = {
    name: 'policyDependencyValidation',
    applyValidationPolicy: async (_, descriptor) => {
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
    applyValidationPolicy: async (_, descriptor) => {
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
    applyValidationPolicy: async (_, descriptor) => {
      const types = descriptor.models.map((e) => e.type);

      const counterpartRules: [ComponentType, ComponentType][] = [
        [ComponentType.Controller, ComponentType.Service],
        [ComponentType.ControllerType, ComponentType.Controller],
        [ComponentType.ServiceType, ComponentType.Service],
        [ComponentType.ModelView, ComponentType.Model],
        [ComponentType.ModelType, ComponentType.Model],
      ];

      for (const [source, target] of counterpartRules) {
        if (types.includes(source as ComponentType.Model) && !types.includes(target as ComponentType.Model)) {
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
    applyValidationPolicy: async (_, descriptor) => {
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
    this.b.logWithContext(this, 'mergeWithOverrideByName:input', { base, custom }, 'debug');
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

  async applyPolicies(
    base: CdModuleDescriptor,
    custom: CdModuleDescriptor,
  ): Promise<CdFxReturn<CdModuleDescriptor>> {
    this.b.logWithContext(this, 'applyPolicies:input', { base, custom }, 'debug');
    this.policyCtx = { base, custom };
    let result: CdFxReturn<CdModuleDescriptor> = { state: true, data: base, message: 'initial' };
    this.b.logWithContext(this, 'applyPolicies:initial_result', result, 'debug');

    for (const policy of this.validationPolicies) {
      this.b.logWithContext(this, 'applyPolicies:applying_policy', policy.name, 'debug');
      if (!result.data) {
        this.b.logWithContext(
          this,
          'applyPolicies:data_null',
          { policy: policy.name, result },
          'error',
        );
        return {
          state: false,
          data: null,
          message: `Policy failed: ${policy.name} - result.data is null or undefined`,
        };
      }
      result = await policy.applyValidationPolicy(result.data, custom);
      this.b.logWithContext(this, 'applyPolicies:policy_result', result, 'debug');
      if (!result.state) {
        this.b.logWithContext(
          this,
          'applyPolicies:policy_failed',
          { policy: policy.name, message: result.message },
          'error',
        );
        return { ...result, message: `Policy failed: ${policy.name} - ${result.message}` };
      }
    }
    this.b.logWithContext(this, 'applyPolicies:success', result, 'debug');
    return result;
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
    // Helper: normalize filename for each component
    const ensureFileName = (comp: ComponentDescriptor): string => {
      // Example: "cd-ai" + "." + "controller" + ".ts"
      return `${comp.name}.${comp.type}.ts`;
    };

    const processList = (
      list: ComponentDescriptor[] | undefined,
      type: ComponentType,
    ): ComponentDescriptor[] => {
      if (!list) return [];

      const enriched: ComponentDescriptor[] = [];

      for (const comp of list) {
        const base: ComponentDescriptor = {
          ...comp,
          fileName: comp.fileName ?? ensureFileName(comp),
        };
        enriched.push(base);

        // --- Counterparts rules ---
        if (type === 'controller' || type === 'service') {
          // Add -type counterpart if missing
          const typeName = base.name.endsWith('-type') ? base.name : `${base.name}-type`;

          if (!list.some((c) => c.name === typeName && c.type === `${type}-type`)) {
            enriched.push({
              ...base,
              name: typeName,
              type: `${type}-type` as ComponentType,
              fileName: `${typeName}.${type}-type.ts`,
            });
          }
        }

        if (type === 'model') {
          // Add -type counterpart
          const typeName = base.name.endsWith('-type') ? base.name : `${base.name}-type`;

          if (!list.some((c) => c.name === typeName && c.type === 'model-type')) {
            enriched.push({
              ...base,
              name: typeName,
              type: ComponentType.ModelType,
              fileName: `${typeName}.model-type.ts`,
            });
          }

          // Add -view counterpart
          const viewName = base.name.endsWith('-view') ? base.name : `${base.name}-view`;

          if (!list.some((c) => c.name === viewName && c.type === 'model-view')) {
            enriched.push({
              ...base,
              name: viewName,
              type: ComponentType.ModelView,
              fileName: `${viewName}.model-view.ts`,
            });
          }
        }
      }

      return enriched;
    };

    return {
      ...data,
      controllers: processList(
        data.controllers,
        ComponentType.Controller,
      ) as CdControllerDescriptor[],
      services: processList(data.services, ComponentType.Service) as CdServiceDescriptor[],
      models: processList(data.models, ComponentType.Model) as CdModelDescriptor[],
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
    const cdObjTypeName = customModuleData.cdModuleType;
    const moduleCtx = customModuleData.ctx;

    const processedControllers = customModuleData.controllers.map((c, index) => {
      const controllerName = c.name;
      const controllerPascal = toPascalCase(controllerName);
      const controllerCamel = toCamelCase(controllerName);
      const controllerKebab = toKebabCase(controllerName);
      const controllerSnake = toUniversalSnakeCase(controllerName);

      const isMain = index === 0;

      // === CONTROLLER ===
      const controller = {
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
            name: 'http',
            type: 'express',
            isApiEntry: true,
            httpContextAware: true,
            routing: {
              baseRoute: `/${controllerName.toLowerCase()}`,
              authRequired: true,
              methods: {
                Create: { httpMethod: 'POST', route: '/' },
                Get: { httpMethod: 'GET', route: '/' },
                GetType: { httpMethod: 'GET', route: '/type' },
                GetCount: { httpMethod: 'GET', route: '/count' },
                Update: { httpMethod: 'PUT', route: '/' },
                Delete: { httpMethod: 'DELETE', route: '/' },
              },
            },
          },
        ],
        methods: ['Create', 'Get', 'GetType', 'GetCount', 'Update', 'Delete'].map((methodName) => ({
          name: methodName,
          isDefault: methodName === 'Create',
          scope: { visibility: 'public', static: false },
          output: {
            returnType: 'Promise<void>',
            description: `${methodName} operation for ${controllerPascal}`,
          },
          parameters: [
            { name: 'req', type: 'Request' },
            { name: 'res', type: 'Response' },
          ],
          behavior: { isAsync: true, isPure: false, returnsPromise: true },
        })),
      };

      // === MODEL ===
      const model = {
        name: `${controllerKebab}`,
        type: ComponentType.Model,
        parentController: controllerName,
        fileName: `${controllerKebab}.model.ts`,
        tableName: controllerSnake,
        fields: [
          {
            name: `${controllerCamel}Id`,
            type: 'number',
            required: true,
            default: true,
          },
          {
            name: `${controllerCamel}Guid`,
            type: 'string',
            required: true,
            default: true,
          },
          {
            name: `${controllerCamel}Name`,
            type: 'string',
            required: false,
            default: true,
          },
          {
            name: `${controllerCamel}Description`,
            type: 'string',
            required: true,
            default: true,
          },
          {
            name: `${controllerCamel}DocId`,
            type: 'number',
            required: false,
            default: true,
          },
          {
            name: `${controllerCamel}Enabled`,
            type: 'boolean',
            required: false,
            default: true,
          },
        ],
      };

      // === SERVICE ===
      const service = {
        type: ComponentType.Service,
        name: controllerName,
        classSignature: {
          extends: 'CdService',
          implements: [],
        },
        attributes: [
          { name: 'logger', type: 'Logging', isDefault: true },
          { name: 'b', type: 'BaseService', isDefault: true },
          { name: 'cdToken', type: 'string', isDefault: true },
          { name: 'uid', type: 'number', isDefault: true },
          {
            name: 'serviceModel',
            type: `${controllerPascal}Model`,
            isDefault: true,
          },
          { name: 'svSess', type: 'SessionService', isDefault: true },
          { name: 'validationCreateParams', type: 'any', isDefault: true },
          {
            name: 'cRules',
            type: 'object',
            isDefault: true,
            defaultValue: {},
          },
        ],
        methods: [
          'create',
          'validateCreate',
          `${controllerCamel}Exists`,
          `get${controllerPascal}Count`,
          'update',
          'delete',
          `get${controllerPascal}Profile`,
          `get${controllerPascal}ProfileByToken`,
          `getScoped${controllerPascal}`,
          `update${controllerPascal}Profile`,
          `activate${modulePascal}`,
        ].map((methodName) => ({
          name: methodName,
          isDefault: methodName === 'create',
          scope: { visibility: 'public', static: false },
          output: {
            returnType: methodName.includes('Exists')
              ? `Promise<${controllerPascal}Model[]>`
              : 'Promise<void>',
            description: `Performs ${methodName}`,
          },
          behavior: { isAsync: true, isPure: false, returnsPromise: true },
          parameters: [
            'get',
            'update',
            'delete',
            'create',
            'validateCreate',
            'getScoped',
            'getProfile',
            'updateProfile',
            'getCount',
            'getByToken',
            'activate',
          ].some((m) => methodName.toLowerCase().includes(m))
            ? [
                { name: 'req', type: 'Request' },
                { name: 'res', type: 'Response' },
              ]
            : undefined,
        })),
      };

      return { controller, model, service };
    });

    const finalControllers = processedControllers.map((e) => e.controller);
    const finalModels = processedControllers.map((e) => e.model);
    const finalServices = processedControllers.map((e) => e.service);

    return {
      ...customModuleData,
      controllers: finalControllers as CdModuleDescriptor['controllers'],
      models: finalModels as CdModuleDescriptor['models'],
      services: finalServices as CdModuleDescriptor['services'],
    };
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

      // 5) Validate + merge using registered policies
      const result = await this.applyPolicies(base, custom);
      if (!result.state) {
        return result; // already wrapped in CdFxReturn
      }

      this.b.logWithContext(this, 'cdApiModuleData:merged', result.data, 'debug');
      if (!result || !result.data) {
        return cdFx(
          CdFxStateLevel.LogicalFailure,
          'There was an error applying validation policies',
          null,
        );
      }

      // 6) Final cleanup/sanitization after policies
      const cdApiModuleData = await this.sanitizeModuleData(result.data);
      this.b.logWithContext(this, 'cdApiModuleData:sanitized', cdApiModuleData, 'debug');

      return {
        state: true,
        message: 'Descriptors merged successfully.',
        data: cdApiModuleData,
      };
    } catch (error: any) {
      return {
        state: false,
        message: `Failed to merge descriptors: ${error.message}`,
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
