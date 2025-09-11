## ISSUE

---
I have a base service that is responsible for processing common tasks.
At the moment, after processing a number of database processes, it fails midway while trying to save and entity called DocModel.
I have extracted and shared:
1. the logs around where the process fails
2. the relevant methods in the BaseService class
3. the relevant methods in the DocService

Let me know if you can tell how the error: "ConnectionNotFoundError: Connection 'default' was not found." is eventually thrown when other database processes was done ahead of this error.

```ts
export class BaseService{
  async init(req, res) {
    this.logger.logDebug("BaseService::init()/01:");
    try {
      if (!this.db) {
        this.logger.logDebug("BaseService::init()/02:");
        this.db = new TypeOrmDatasource();
        this.ds = await this.db.getConnection(); // ✅ Store DataSource
      }
      this.logger.logDebug("BaseService::init()/this.models:", this.models);
    } catch (e) {
      this.logger.logDebug("BaseService::init()/03:");
      this.logger.logDebug(
        `BaseService::init() failed:${(e as Error).message}`
      );
      this.err.push(`BaseService::init() failed:${(e as Error).message}`);
    }
  }

  async setRepo(serviceInput: IServiceInput) {
    this.repo = this.ds.getRepository(serviceInput.serviceModel);
  }

  async read(req, res, serviceInput: IServiceInput): Promise<any> {
    this.logger.logDebug("BaseService::read()/01");
    await this.init(req, res);
    this.logger.logDebug("BaseService::read()/02");
    this.logger.logDebug(
      "BaseService::read()/serviceInput:",
      inspect(serviceInput, { depth: 2 })
    );
    // const repo: any = await this.repo(req, res, serviceInput.serviceModel);

    await this.setRepo(serviceInput);

    this.logger.logDebug("BaseService::read()/03");
    let r: any = null;
    switch (serviceInput.cmd.action) {
      case "find":
        try {
          this.logger.logDebug("BaseService::read()/031");
          this.logger.logDebug(
            "BaseService::read()/04/serviceInput.serviceModel:",
            serviceInput.serviceModel
          );
          this.logger.logDebug(
            "BaseService::read()/04/serviceInput.modelName:",
            {
              modelName: serviceInput.modelName,
            }
          );
          // await this.init(req, res);
          // await this.setRepo(serviceInput);
          this.logger.logDebug("BaseService::read()/041");
          this.logger.logDebug("BaseService::read()/this.repo:", inspect(this.repo, { depth: 2 }));
          r = await this.repo.find(serviceInput.cmd.query);
          this.logger.logDebug("BaseService::read()/04/r:", r);
          if (serviceInput.extraInfo) {
            this.logger.logDebug("BaseService::read()/05");
            return {
              result: r,
              fieldMap: await this.feildMap(serviceInput),
            };
          } else {
            this.logger.logDebug("BaseService::read()/06");
            return await r;
          }
        } catch (err) {
          this.logger.logDebug("BaseService::read()/07");
          return await this.serviceErr(req, res, err, "BaseService:read");
        }
        break;
      case "count":
        try {
          r = await this.repo.count(serviceInput.cmd.query);
          this.logger.logDebug("BaseService::read()/r:", r);
          return r;
        } catch (err) {
          return await this.serviceErr(req, res, err, "BaseService:read");
        }
        break;
    }

    // this.serviceErr(res, err, 'BaseService:read');
  }
}
```

```ts
export class DocService {
  async getDocTypeId(req, res): Promise<number> {
        this.logger.logDebug("DocService::getDocTypeId()/01");
        let ret = 0;
        const m = req.post.m;
        const c = req.post.c;
        const a = req.post.a;
        const result: DocTypeModel[] = await this.getDocTypeByName(req, res, `${c}_${a}`)
        this.logger.logDebug("DocService::getDocTypeId()/02");
        this.logger.logDebug("DocService::getDocTypeId()/result:", result);
        if (result.length > 0) {
            ret = result[0].docTypeId;
        } else {
            const r:any = await this.createDocType(req, res);
            ret = r.docTypeId;
        }
        return await ret;
    }

    async getDocTypeByName(req, res, docTypeName: string): Promise<DocTypeModel[]> {
        this.logger.logDebug("DocService::getDocTypeByName()/01");
        const serviceInput = {
            serviceInstance: this,
            serviceModel: DocTypeModel,
            docName: 'DocService::getDocTypeByName',
            cmd: {
                action: 'find',
                query: { where: { docTypeName: `${docTypeName}` } }
            },
            dSource: 1
        }
        return await this.b.read(req, res, serviceInput)
    }
}
```

```log
[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::read()/01 [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::init()/01: [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::init()/02: [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [DEBUG]: TypeOrmDatasource::getConnection()/01: [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [DEBUG]: TypeOrmDatasource::getConnection()/03: [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::init()/this.models: [CONTEXT] -> 

[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::read()/02 [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::read()/serviceInput: [CONTEXT] -> 
{
  serviceInstance: DocService {
    i: { messages: null, code: '', app_msg: '' },
    cRules: { required: [Array], noDuplicate: [] },
    b: BaseService {
      err: [],
      cuid: 1000,
      debug: true,
      i: [Object],
      isInvalidFields: [],
      isRegRequest: false,
      models: [],
      sqliteModels: [],
      ds: [DataSource],
      intersectionLegacy: [Function (anonymous)],
      intersectMany: [Function (anonymous)],
      entityAdapter: [EntityAdapter],
      cdResp: [Object],
      logger: [Logging],
      svRedis: [RedisService],
      db: [TypeOrmDatasource]
    },
    logger: Logging { _logger: [DerivedLogger] },
    docModel: DocModel {}
  },
  serviceModel: [class DocTypeModel],
  docName: 'DocService::getDocTypeByName',
  cmd: { action: 'find', query: { where: [Object] } },
  dSource: 1
}
[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::read()/03 [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::read()/031 [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::read()/04/serviceInput.serviceModel: [CONTEXT] -> 
class DocTypeModel {
}
[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::read()/04/serviceInput.modelName: [CONTEXT] -> 
[object Object]
[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::read()/041 [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::read()/this.repo: [CONTEXT] -> 
<ref *1> Repository {
  target: [class DocTypeModel],
  manager: <ref *2> EntityManager {
    '@instanceof': Symbol(EntityManager),
    repositories: Map(3) {
      [class SessionModel] => [Repository],
      [class CdAiModel] => [Repository],
      [class DocTypeModel] => [Circular *1]
    },
    treeRepositories: [],
    plainObjectToEntityTransformer: PlainObjectToNewEntityTransformer {},
    connection: DataSource {
      '@instanceof': Symbol(DataSource),
      migrations: [],
      subscribers: [],
      entityMetadatas: [Array],
      entityMetadatasMap: [Map],
      name: 'default',
      options: [Object],
      logger: [AdvancedConsoleLogger],
      driver: [MysqlDriver],
      manager: [Circular *2],
      namingStrategy: [DefaultNamingStrategy],
      metadataTableName: 'typeorm_metadata',
      queryResultCache: undefined,
      relationLoader: [RelationLoader],
      relationIdLoader: [RelationIdLoader],
      isInitialized: true
    }
  },
  queryRunner: undefined
}
query: SELECT `DocTypeModel`.`doc_type_id` AS `DocTypeModel_doc_type_id`, `DocTypeModel`.`doc_type_name` AS `DocTypeModel_doc_type_name`, `DocTypeModel`.`module_guid` AS `DocTypeModel_module_guid`, `DocTypeModel`.`doc_guid` AS `DocTypeModel_doc_guid`, `DocTypeModel`.`doc_id` AS `DocTypeModel_doc_id`, `DocTypeModel`.`doc_type_controller` AS `DocTypeModel_doc_type_controller`, `DocTypeModel`.`doc_type_action` AS `DocTypeModel_doc_type_action`, `DocTypeModel`.`doc_type_enabled` AS `DocTypeModel_doc_type_enabled`, `DocTypeModel`.`enable_notification` AS `DocTypeModel_enable_notification`, `DocTypeModel`.`nk_name` AS `DocTypeModel_nk_name`, `DocTypeModel`.`doc_type_icon` AS `DocTypeModel_doc_type_icon` FROM `doc_type` `DocTypeModel` WHERE ((`DocTypeModel`.`doc_type_name` = ?)) -- PARAMETERS: ["CdAi_Create"]
[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::read()/04/r: [CONTEXT] -> 

[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::read()/06 [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [DEBUG]: DocService::getDocTypeId()/02 [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [DEBUG]: DocService::getDocTypeId()/result: [CONTEXT] -> 

[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::setAppState()/01 [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::setAppState()/ss: [CONTEXT] -> 
[object Object]
[9/11/2025, 1:54:19 PM] [INFO]: BaseService::create()/06 [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::setAppState()/01 [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::setAppState()/02 [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::setAppState()/ss: [CONTEXT] -> 
[object Object]
[9/11/2025, 1:54:19 PM] [INFO]: BaseService::create()/07 [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [INFO]: BaseService::create()/08 [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [INFO]: BaseService::create()/09 [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [INFO]: BaseService::create()/10 [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [INFO]: BaseService::newDocData.docId: [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::setAppState()/01 [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::setAppState()/02 [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::setAppState()/ss: [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [DEBUG]: **********starting respond(res)********* [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::respond(res)/this.pl: [CONTEXT] -> 
[object Object]
[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::respond(res)/this.cdResp: [CONTEXT] -> 
[object Object]
[9/11/2025, 1:54:19 PM] [DEBUG]: **********starting preFlight(res)********* [CONTEXT] -> {}
[9/11/2025, 1:54:19 PM] [DEBUG]: BaseService::getPlData()/this.cdResp: [CONTEXT] -> 
{"app_state":{"success":false,"info":{"messages":["ConnectionNotFoundError: Connection \"default\" was not found."],"code":"BaseService:create","app_msg":""},"sess":null,"cache":{},"sConfig":{"usePush":true,"usePolling":true,"useCacheStore":true}},"data":[]}
```

---

## COMPLETED TASKS:

---

## TASKS IN PROGRESS:

```ts
MissingPrimaryColumnError: Entity "CdAiUsageLogsTypeModel" does not have a primary column. Primary column is required to have in all your entities. Use @PrimaryColumn decorator to add a primary column to your entity.
```

- after migration, auto add initial test data for testing validation...done
- initial test data should be automated and reported
  - The test should include internal and http crud tests
  - test should auto update changelog
- all cd-cli modules should have internal test that can be run everytime a new feature is added.
- set up user data via cd-cli wizard or cli
  - this can be done in registration session
- set up initial instruction via wizard or cli

---

- cd-api should also have a way of testing each module and system operations.

## TO DO:

---

- test cd-ai module
- add import for inspect to service
- uncomment logger in the service
- add Logging in the dependencies: // import { Logging } from "../../../sys/base/winston.log";
- comment on the service on line: // .mustExist("userId", CdAiModel)
- AiModel.doc_id' in 'field list'"
  - field cd_ai_doc_id being create instead of doc_id
  - {
      name: 'cdAiTypeDocId', // need to be corrected to DocId
      type: 'number',
      required: false,
      default: true,
      dbName: 'doc_id'
    },
- fine tune roadmap for cd-api for actuall testing
- test version auto update for CdApp (cd-api) and CdModule (cd-ai)
- package.json can be downgraded without warning but one should not be able to downgrade in comparison to git records
- package.json was update successfully
- changelog was not updated as expected

## COMMANDS DESIGN AND DEVELOPMENT

---

Command structure

```sh
<DevModeAction> --<ActonTarget as CdObjType.cdObjTypeName> --name <CdObj.dObjName> --o-env <Env as CdObjType.cdObjTypeName> --repo <Repo as CdObj.dObjName>
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

## Target Demos
1. Register multiple users
2. Create new application via cd-cli
3. Create testbed instance
4. Update testbed and database objects
5. Run confirmation tests
6. Create online package
7. Install on test phone
8. Output:
  - workshop files
  - git repository
  - testbed version
  - databse objects
  - online package
  - installed instance
9. Review testing standards
10. Review security issues
11. Review IP security
