## ISSUE

---
Issue reference in the log:
[22/08/2025, 21:55:16] [GenComponentService::GenComponentService():379]: resolveOutputFilePath:start

Below is the current implementation of sanitizeModuleData().
You can refactor it as proposed.
I have included the helpers you mentioned below for reference.

```ts
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

    // 1. Deduplicate original input
    const deduped: CdModuleDescriptor = {
      ...data,
      controllers: dedupe(data.controllers ?? []),
      services: dedupe(data.services ?? []),
      models: dedupe(data.models ?? []),
    };

    // 2. Apply counterpart rules + filenames
    const withCounterparts = this.ensureCounterparts(deduped);

    // 3. Final dedupe
    const result: CdModuleDescriptor = {
      ...withCounterparts,
      controllers: dedupe(withCounterparts.controllers ?? []),
      services: dedupe(withCounterparts.services ?? []),
      models: dedupe(withCounterparts.models ?? []),
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

```

---

## COMPLETED TASKS:

---

- create cd-ai ...done
- create isolated task for git commit ...done
- create isolated task for git push ...done
- the finishing for create cd-ai, has issues ...sorted
- find active versionControl for cd-ai and change the output directory from /workshop/cd-api to /worshop/cd-module
- remove hello-api.txt..done
- formulate how to set path in appCraft.GenEntityService methods..done
- confirm the right output folder for > create module ...done
- set cd-ai as cdObjName, cd-module as cdObjType, test-bed as environment ...done
- > create --cd-module --name cd-ai --o-env workshop --repo cd-ai; ...done
- > create --cd-module --name cd-ai --o-env test-bed --repo cd-ai; ...done
- test upgrade of cd-ai module to confirm version documents are updated...done
- when upgrading module, work on package.json that is resident to the module
- write a brief introductory documentation for corpdesk technical guide
- assess corpdesk service 'create' to try and identify sharable codes to simplify the services codes.
  - test current create to confirm is working ok
  - implement BaseService.serviceInputCRUD(serviceInstance: any): IServiceInput
  - test BaseService.serviceInputCRUD(serviceInstance: any): IServiceInput in CoopMemberService.create()
  - implement BaseService.logWithContext(thisArg: any, message: string, data?: any,level: "debug" | "info" | "warn" | "error" = "debug")
  - test BaseService.logWithContext(thisArg: any, message: string, data?: any,level: "debug" | "info" | "warn" | "error" = "debug") in CoopMemberService.create()
- 'create' upgrade contd:
  - implement BaseService.beforeCreateGeneric()
  - test BaseService.beforeCreateGeneric() in CoopMemberService.create()

23rd August 2025:
- privatize working chat-gpt
  - export history
  - save history
  - delete history
  - work out new ways of associating with chat-gpt without compromising IP info
- privacy migration suspended
- 'create' upgrade contd:
  - implement IBase/interface ValidationRules
  - test BaseService.beforeCreateGeneric() in CoopMemberService.create()
- test improved service and controller in the abcd for cd-app-craft workshop
- refine BaseService
  - validation
  - error reporting
- create method GenControllerController.GenerateAllControllersForCdObj() similar to GenEntityController.GenerateAllEntitiesForCdObj()
- create method GenServiceController.GenerateAllServicesForCdObj() similar to GenEntityController.GenerateAllEntitiesForCdObj()
- create task for GenerateAllControllersForCdObj() similar to GenerateAllEntitiesForCdObj in the workflow for cd-ai
- create task for GenerateAllServicesForCdObj() similar to GenerateAllEntitiesForCdObj in the workflow for cd-ai
- create method GenServiceController.GenerateAllServicesForCdObj() similar to GenEntityController.GenerateAllEntitiesForCdObj()
- run 'create' in cd-cli to test creation of controllers and services
- adjusted CdAutoGit.CommitAndPush() to display logs of actions including errors.
- added 'action' argument to CdAutoGit.CommitAndPush() to allow use of -f only when action=create.
- Implement PreCreateClear() to avoid git issues
- harmonize imports
  - check if app descriptor has dependancies
  - check if modules have dependancies
  - check if component have dependancies
  - create a list of dependancies for abcd.service.ts based on DependancyDescriptor[]
  - applying abcd as a dependancy and substituting the same during module development via DependancyDescriptor[]
  - update abcd.services.ts codes
  - - make sure the versionControl.repository.directories are named appropriately to enable searching: done
  - update templates codes
  - issue: the output directory seem to be cleaning up during or before PreCreateCleanup
    - cleanup seem to be targeting wrong directory
      [14/08/2025, 10:51:52] [AppCraftService::async():23]: Target directory exists before cleanup — {
      targetDir: '/home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-module/output/cd-ai',
      contents: [
      '.cd', '.git',
      '.gitignore', 'CHANGELOG.md',
      'LICENSE', 'README.md',
      'controllers', 'models',
      'package.json', 'services'
      ]
      }
  - confirm that the data for imports is being integrated in scafolding of services and controllers.
  - if path to template, path to output directory or path to app descriptor does not exists, abort: done
- make model descriptor an extension of component descritptor
- use ComponentType to administor controller, controller-type, model, model-view etc
- All component generate type files but only models produce 'view files'
- All component data should be marked with ComponentType
- To sort git commit and push method in a systematic, maintainable and scalable manner
- module descritpor json output being fed to code generators is now acceptable

## TASKS IN PROGRESS:

---



## TO DO:

---

- test cd-ai module
- correct import paths
- fine tune roadmap for cd-api for actuall testing
- test version auto update for CdApp (cd-api) and CdModule (cd-ai)
- package.json can be downgraded without warning but one should not be able to downgrade in comparison to git records
- package.json was update successfully
- changelog was not updated as expected

## COMMANDS PLANNING

---

```html
<DevModeAction>
  --<CdObjType>
    --name
    <CdObj>
      --type
      <CdObjType>
        <!--consider modifying to:-->
        <DevModeAction>
          --<ActonTarget as CdObjType.cdObjTypeName>
            --name
            <CdObj>
              --o-env
              <CdEnvName></CdEnvName></CdObj></ActonTarget></DevModeAction></CdObjType></CdObj></CdObjType
></DevModeAction>
```

```sh
create --cd-module --name cd-ai --o-env workshop --repo cd-ai;
create --cd-module --name cd-ai --o-env test-bed --repo cd-ai;
update --cd-module --name cd-ai --o-env test-bed --repo cd-ai;

# upgrade cd-api to version 0.8.0. then perform task test after the upgrade (tests would upgrade the project as per the roadmap based on successful tests)
upgrade --cd-app  --name cd-api --o-env test-bed  --repo cd-api --version 0.8.0 --test true;

#upgrade cd-ai module in the workshop to 0.1.0
upgrade --cd-module --name cd-ai --o-env workshop --repo cd-ai --version 0.1.0;

# upgrade cd-ai module to 0.1.1  then perform task test after the upgrade (tests would upgrade the project as per the roadmap based on successful tests)
upgrade --cd-module --name cd-ai --o-env test-bed --repo cd-ai --version 0.1.0 --test true;

```
