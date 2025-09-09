// import { ValidationRules } from "./i-base";

import { ValidationRules } from "./i-base.js";

export class ValidationRulesBuilder {
  private rules: ValidationRules = {};
  private existenceMap: { [field: string]: any } = {};

  require(...fields: string[]) {
    this.rules.required = [...(this.rules.required || []), ...fields];
    return this;
  }

  noDuplicate(...fields: string[]) {
    this.rules.noDuplicate = [...(this.rules.noDuplicate || []), ...fields];
    return this;
  }

  allowedValues(field: string, values: any[]) {
    this.rules.allowedValues = {
      ...(this.rules.allowedValues || {}),
      [field]: values,
    };
    return this;
  }

  minLength(field: string, length: number) {
    this.rules.minLength = { ...(this.rules.minLength || {}), [field]: length };
    return this;
  }

  maxLength(field: string, length: number) {
    this.rules.maxLength = { ...(this.rules.maxLength || {}), [field]: length };
    return this;
  }

  regex(field: string, pattern: RegExp) {
    this.rules.regex = { ...(this.rules.regex || {}), [field]: pattern };
    return this;
  }

  mustExist(field: string, model: any) {
    this.existenceMap[field] = model;
    return this;
  }

  build() {
    return {
      rules: this.rules,
      existenceMap: this.existenceMap,
    };
  }
}