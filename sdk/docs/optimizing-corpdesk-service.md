
# Optimizing Corpdesk Service Methods and Patterns

This document presents a unified approach to optimizing the `create()` and related service methods (`createI`, `createM`, `createSL`) in the Corpdesk framework. It distills common patterns, eliminates redundancy, and proposes reusable strategies that can be implemented in `BaseService` to simplify and streamline service logic across modules.

---

## ✅ Overview of Optimization Targets

| Concern                     | Strategy Summary                                     |
|----------------------------|------------------------------------------------------|
| Repeated create workflows  | Consolidate into `performCreate()` handler          |
| Validation logic           | Generic validation via `validateCreateGeneric()`    |
| beforeCreate hooks         | Config-driven `beforeCreateGeneric()` method        |
| Service input structure    | Standardize with `getDefaultServiceInput()`         |
| Batch create               | Abstract via `bulkCreate()`                         |
| Error handling             | Centralize using `handleError()`                    |
| Existence checks           | Use `validateExistence()` and `cdObjExist()`        |
| Response boilerplate       | Wrap with `finalizeCreateResponse()`                |
| Logging                    | Introduce `logCreateStep()` or standard wrappers    |

---

## 🧱 Shared Helper Functions (BaseService)

### 1. `getDefaultServiceInput(docName?)`

```ts
getDefaultServiceInput(docName = '') {
  return {
    serviceInstance: this,
    serviceModel: this.serviceModel.constructor,
    modelName: this.modelName,
    serviceModelInstance: this.serviceModel,
    docName: docName || `Create ${this.modelName}`,
    dSource: 1,
  };
}
```

---

### 2. `beforeCreateGeneric(req, fieldMap)`

```ts
async beforeCreateGeneric(req, fieldMap: Record<string, any>): Promise<boolean> {
  for (const [key, value] of Object.entries(fieldMap)) {
    const finalValue = value === 'GUID' ? this.getGuid() : value;
    this.setPlData(req, { key, value: finalValue });
  }
  return true;
}
```

---

### 3. `validateCreateGeneric(req, res, rules)`

```ts
async validateCreateGeneric(req, res, rules: ValidationRules): Promise<boolean> {
  const { required = [], noDuplicate = [] } = rules;

  for (let field of required) {
    if (!this.getPlValue(req, field)) {
      this.i.app_msg = `${field} is required`;
      return false;
    }
  }

  for (let field of noDuplicate) {
    const value = this.getPlValue(req, field);
    const exists = await this.exists({ [field]: value });
    if (exists) {
      this.i.app_msg = `Duplicate value for ${field}`;
      return false;
    }
  }

  return true;
}
```

---

### 4. `validateCreateI(req, res, params)`

```ts
async validateCreateI(req, res, params: CreateIParams): Promise<boolean> {
  const { required = [], customValidateFn, failMessage } = params;

  const missing = required.filter(key => !req.pl?.[key]);
  if (missing.length) {
    this.i.app_msg = `Missing fields: ${missing.join(', ')}`;
    return this.respond(req, res);
  }

  if (customValidateFn && !customValidateFn()) {
    this.i.app_msg = failMessage || 'Custom validation failed';
    return this.respond(req, res);
  }

  return true;
}
```

---

### 5. `cdObjExist<T>(req, res, params)`

```ts
async cdObjExist<T>(req, res, params: CdObjExistParams<T>): Promise<T[]> {
  const { model, filter, docName = 'cdObjExist()', dSource = 1 } = params;
  const serviceInput = {
    serviceInstance: this,
    serviceModel: model,
    docName,
    cmd: { action: 'find', query: { where: filter } },
    dSource,
  };

  try {
    return await this.read(req, res, serviceInput);
  } catch (error) {
    await this.handleError(req, res, error, docName);
    return [];
  }
}
```

---

### 6. `bulkCreate(req, res, items, factory, getParamsFn)`

```ts
async bulkCreate(req, res, items, factory, getParamsFn) {
  for (const item of items) {
    const service = factory();
    const params = getParamsFn(item);
    await service.createI(req, res, params);
  }
}
```

---

### 7. `handleError(req, res, error, context)`

```ts
async handleError(req, res, error, context = 'Error') {
  this.logError(`${context}: ${error?.message || error}`);
  this.setAppState(false, this.i);
  this.cdResp.error = error;
  return this.respond(req, res);
}
```

---

### 8. `finalizeCreateResponse(res, result, msg = '')`

```ts
finalizeCreateResponse(res, result, msg = '') {
  this.i.app_msg = msg;
  this.setAppState(true, this.i, new SessionService().sessResp);
  this.cdResp.data = result;
  return this.respond(null, res);
}
```

---

## ✅ Unified Entry Method for `create()`

```ts
async performCreate(req, res, {
  mode = 'default',
  beforeHook,
  validateFn
}: {
  mode?: 'default' | 'sqlite' | 'internal';
  beforeHook?: () => Promise<void>;
  validateFn?: () => Promise<boolean>;
}) {
  const svSess = new SessionService();
  await this.initSession(req, res);

  if (!(await (validateFn?.() ?? true))) return this.respond(req, res);
  await (beforeHook?.() ?? Promise.resolve());

  const input = this.getDefaultServiceInput();
  let result;

  switch (mode) {
    case 'sqlite':
      await this.b.initSqlite(req, res);
      result = await this.b.createSL(req, res, input);
      this.b.connSLClose();
      break;
    case 'internal':
      // handled via createI
      break;
    default:
      result = await this.b.create(req, res, input);
  }

  return this.finalizeCreateResponse(res, result);
}
```

---

## 🧭 Developer Implementation Checklist

| Task                                  | Base Method Used                  | Done? |
|---------------------------------------|-----------------------------------|-------|
| Replace repeated `serviceInput`       | `getDefaultServiceInput()`        | ☐     |
| Unify `beforeCreate` hooks            | `beforeCreateGeneric()`           | ☐     |
| Validate rules                        | `validateCreateGeneric()`         | ☐     |
| Simplify `create()` method            | `performCreate()`                 | ☐     |
| Support SQLite or batch create        | `bulkCreate()` / mode flag        | ☐     |
| Handle duplicate check logic          | `cdObjExist()` or `validateExistence()` | ☐     |
| Reduce catch blocks                   | `handleError()`                   | ☐     |
| Finalize responses uniformly          | `finalizeCreateResponse()`        | ☐     |

---

## 🚀 Next Phase: Automation via CLI or AI

With these refactors:

- You can generate services via a descriptor or model metadata.
- CLI tooling or AI agents can scaffold full CRUD workflows.
- Less boilerplate makes maintenance simpler and more consistent.
- Service behavior becomes declarative, predictable, and DRY.
