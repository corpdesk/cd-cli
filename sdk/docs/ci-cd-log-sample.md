# Ci/cd logs 

## Recommendations following the logs
The following are points that need to be considered for further action:
- The directory for local workspace seem wrong. It has been created inside the cd-cli workspace. The preferred would be at the root of home directory. Whichever way, it also needs to be configurable.
- Even though the process went from attempting to create a repository, finding existing repository and going ahead and creating a local workspace, there was an error that terminated the process:
- A warning was also issue towards the end: You appear to have cloned an empty repository. We need to get advise on how to handle this.

### Error Terminating the process:
```
result:{
  state: false,
  message: 'Task postCreateRepository failed after 1 attempts.'
}
```
We need to find out the cause and nature of the issue.


### Full Logs:
```
emp-12@emp-12 ~/cd-cli (main)> pnpm run build

> @corpdesk/cd-cli@0.1.2 build /home/emp-12/cd-cli
> tsc

emp-12@emp-12 ~/cd-cli (main)> cd-cli dev --debug 4
Log level set to: 4
CdLog::setDebugLevel()/log level: 4
CdLog::setDebugLevel()/03:
[dev-mode] Entering development mode...
[cd-ai] Initializing AI runtime...
[2025-06-16 10:41:31] 🛠️ [Open AI] Budget OK. Remaining: 90
[2025-06-16 10:41:31] 🛠️ [Gemini AI] Budget OK. Remaining: 90
[2025-06-16 10:41:31] 🛠️ [Deepseek AI] Budget OK. Remaining: 90
[dev-mode] AI services initialized.
cd dev  > create --module true --name cd-ai --type cd-api;
[2025-06-16 10:44:45] 🛠️ DevMode::eval()/input:create --module true --name cd-ai --type cd-api;

[2025-06-16 10:44:45] 🛠️ DevModeModel::handleInput()/input:create --module true --name cd-ai --type cd-api;
[2025-06-16 10:44:45] 🛠️ DevModeModel::executeCommand()/command:create --module true --name cd-ai --type cd-api
[2025-06-16 10:44:45] 🛠️ DevModeModel::executeCommand()/options:{"_":[],"module":"true","name":"cd-ai","type":"cd-api"}
[2025-06-16 10:44:45] 🛠️ createCommand::execute() → initializing session and model...
[2025-06-16 10:44:45] 🛠️ createCommand::execute() → loading descriptor and workflow for module: cd-ai, type: cd-api
[2025-06-16 10:44:45] 🛠️ Starting CICdRunnerService::loadModuleDescriptorAndWorkflow()
[2025-06-16 10:44:45] 🛠️ Model Path: /home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-api/model/cd-ai-module.model.js
[2025-06-16 10:44:45] 🛠️ Workflow Path: /home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-api/workflow/cd-ai.create.workflow.js
[2025-06-16 10:44:45] 🛠️ Starting CdAiWorkFlow::createWorkFlow()
[2025-06-16 10:44:45] 🛠️ Starting function workshopConfig()
[2025-06-16 10:44:45] 🛠️ Starting function workshopConfig()
[2025-06-16 10:44:45] 🛠️ DevDescriptorService::init()/starting...
[2025-06-16 10:44:45] 🛠️ starting loadCdCliConfig()
[2025-06-16 10:44:45] 🛠️ config file: /home/emp-12/.cd-cli/cd-cli.profiles.json
[2025-06-16 10:44:45] ℹ️ Valid session token found. Proceeding...
[2025-06-16 10:44:45] 🛠️ CdCliProfileController::getSessionData()/starting...
[2025-06-16 10:44:45] 🛠️ getProfileByName()/this.profiles: {}
[2025-06-16 10:44:45] 🛠️ The profile is not initialized. Trying to initialize...
[2025-06-16 10:44:45] 🛠️ starting loadCdCliConfig()
[2025-06-16 10:44:45] 🛠️ config file: /home/emp-12/.cd-cli/cd-cli.profiles.json
[2025-06-16 10:44:45] ℹ️ Valid session token found. Proceeding...
[2025-06-16 10:44:45] 🛠️ createCommand::execute() → creating module...
[2025-06-16 10:44:45] 🛠️ Starting CdModuleController::create()
[2025-06-16 10:44:45] 🛠️ Starting CdModuleService::create()
[2025-06-16 10:44:45] 🛠️ Starting CICdRunnerService::run()
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::run()/01
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::run()/03
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::run()/04
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::run()/04
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::run()/04
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::run()/03
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::run()/04
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::run()/03
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::run()/04
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::run()/05
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::run()/07
[2025-06-16 10:44:45] 🛠️ Starting CICdRunnerService::executeTaskWithPolicies()
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::executeTaskWithPolicies()/01
[2025-06-16 10:44:45] 🛠️ Starting CICdRunnerService::executeTask()
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::executeTask()/task:{"name":"createRepository","type":"method","executor":"cd-cli","status":"running","cdRequest":{"ctx":"app","m":"cd-auto-git","c":"CdAutoGit","a":"createGitHubRepoOctokit","dat":{"f_vals":[{"data":null}],"token":""},"args":{"repoName":"cd-ai","descript":"module for processing ai auto development of corpdesk module at the backend","isPrivate":false,"repoHost":"corpdesk"}},"onResult":[{"ifState":[1,2],"toTask":"postCreateRepository"},{"ifState":[12,11],"toTask":"notifyFailure"}]}
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::executeTask()/task.type:method
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::executeTask()/descriptor:{"ctx":"app","name":"cd-ai","cdModuleType":"cd-api","description":"module for processing ai auto development of corpdesk module at the backend","controllers":[{"name":"cd-ai","actions":[]},{"name":"cd-ai-usage-logs","actions":[]}],"services":[{"name":"cd-ai","methods":[]},{"name":"cd-ai-usage-logs","methods":[]}],"models":[{"name":"cd-ai","fields":[]},{"name":"cd-ai-usage-logs","fields":[]}],"projectGuid":"3857bf4c-3968-45ec-afff-5b434702f0c4","contributors":{"vendor":{"name":"emp services ltd"},"developers":[{"name":"g.oremo","contact":"george.oremo@gmail.com"}]}}
[2025-06-16 10:44:45] 🛠️ Running case: method
[2025-06-16 10:44:45] 🛠️ Starting CICdRunnerService::callMethodFromCdRequest()
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::callMethodFromCdRequest()/01
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::callMethodFromCdRequest()/03
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::callMethodFromCdRequest()/04
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::callMethodFromCdRequest()/ctlDashedName:cd-auto-git.controller.js
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::callMethodFromCdRequest()/05
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::callMethodFromCdRequest()/controllerPath:../../../app/cd-auto-git/controllers/cd-auto-git.controller.js
[2025-06-16 10:44:45] 🛠️ getProfileByName()/profileResult.data?.items: [{"cdCliProfileName":"devServer-ssh-profile","cdCliProfileData":{"owner":{"userId":1010,"groupId":0},"details":{"sshKey":null,"cdApiDir":"~/cd-api","devServer":"192.168.1.70","remoteUser":"devops"},"permissions":{"userPermissions":[{"read":true,"field":"sshKey","write":true,"hidden":false,"userId":1000,"execute":false}],"groupPermissions":[{"read":true,"field":"sshKey","write":false,"hidden":false,"execute":false,"groupId":0}]}},"cdCliProfileTypeId":2,"cdCliProfileGuid":"a9246764-f6b7-4b63-93c1-12fb24f88c8f","userId":1010,"cdCliProfileEnabled":1},{"cdCliProfileName":"cd-git-config","cdCliProfileData":{"owner":{"userId":1010,"groupId":0},"cdVault":[{"name":"gitHubToken","value":null,"description":"github access token","isEncrypted":true,"encryptedValue":"d0eec.....d","encryptionMeta":{"iv":"b7d74cca0555c3ea7da954ac78603aaa","name":"default","encoding":"hex","ivLength":16,"algorithm":"aes-256-cbc","encryptedAt":"2025-01-18T15:59:22.611Z"}}],"details":{"endpoint":"https://api.github.com/orgs/corpdesk/repos","gitRepos":[{"repoHost":"corpdesk","projName":"coop"},{"repoHost":"corpdesk","projName":"coop"}],"gitAccess":{"apiRepoUrl":"https://api.github.com","gitHubUser":"georemo","baseRepoUrl":"https://github.com","gitHubToken":"#cdVault['gitHubToken']"}},"permissions":{"userPermissions":[{"read":true,"field":"sshKey","write":true,"hidden":false,"userId":1000,"execute":false}],"groupPermissions":[{"read":true,"field":"sshKey","write":false,"hidden":false,"execute":false,"groupId":0}]}},"cdCliProfileTypeId":3,"cdCliProfileGuid":"3ff7f765-0bbf-4c6f-920c-14bcfa63da1d","userId":1010,"cdCliProfileEnabled":1},{"cdCliProfileName":"frontend-aws-prod","cdCliProfileData":{"owner":{"userId":1010,"groupId":0},"details":{"sshKey":"~/.ssh/aws_frontend.pem","cdApiDir":"~/","devServer":"asdap.net","remoteUser":"ubuntu"},"permissions":{"userPermissions":[{"read":true,"field":"sshKey","write":true,"hidden":false,"userId":1000,"execute":false}],"groupPermissions":[{"read":true,"field":"sshKey","write":false,"hidden":false,"execute":false,"groupId":0}]}},"cdCliProfileTypeId":3,"cdCliProfileGuid":"1baab097-4d34-4e12-a9c2-d5f8d1c73583","userId":1010,"cdCliProfileEnabled":1},{"cdCliProfileName":"cd-api-local","cdCliProfileData":{"owner":{"userId":1010,"groupId":0},"cdVault":[{"name":"cd_token","value":"d33bb2d3-f4d5-42b4-8e31-44fed3e29826","description":"cd-api token","isEncrypted":false,"encryptedValue":null,"encryptionMeta":null},{"name":"consumerToken","value":"B0B3DA99-1859-A499-90F6-1E3F69575DCD","description":"cd-api consumerToken","isEncrypted":false,"encryptedValue":null,"encryptionMeta":null}],"details":{"session":{"jwt":null,"ttl":600,"userId":1010,"cd_token":"#cdVault['cd_token']"},"cdEndpoint":"https://localhost:3001/api","permissions":{"userPermissions":[{"read":true,"field":"cdCliProfileData","write":true,"hidden":false,"userId":1000,"execute":false}],"groupPermissions":[{"read":true,"field":"cdCliProfileData","write":false,"hidden":false,"execute":false,"groupId":0}]},"consumerToken":"#cdVault['consumerToken']"}},"cdCliProfileTypeId":10,"cdCliProfileGuid":"7e972f45-528e-4cac-ad02-6bdb100f901f","userId":1010,"cdCliProfileEnabled":1},{"cdCliProfileId":6,"cdCliProfileGuid":"28c7e30f-f42b-47cd-811b-ba747cb0f83e","cdCliProfileName":"open-ai","cdCliProfileDescription":"open-ai access credetials","cdCliProfileData":{"type":"open-ai","typeId":11,"owner":{"userId":1010,"groupId":0},"permissions":{"userPermissions":[{"userId":1000,"field":"openAiKey","hidden":true,"read":true,"write":true,"execute":false}],"groupPermissions":[{"groupId":0,"field":"openAiKey","hidden":false,"read":true,"write":false,"execute":false}]},"details":{"profileName":"open-ai","description":"open-ai access credetials","apiKey":{"name":"apiKey","description":"Encrypted data","value":null,"encryptedValue":"df8d7c0782......43158f80","isEncrypted":true,"encryptionMeta":{"name":"default","algorithm":"aes-256-cbc","encoding":"hex","ivLength":16,"iv":"d183054d......8fda3","encryptedAt":"2025-05-20T18:58:00.637Z"}},"organizationId":"EmpServices","openAiProjectName":"CorpdeskAI","baseUrl":"https://api.openai.com/v1","defaultRequestConfig":{"model":"gpt-3.5-turbo","temperature":0.7,"max_tokens":500},"cryptFields":["apiKey"],"encrypted":true}},"cdCliProfileTypeId":11,"userId":1010,"docId":21753,"cdCliProfileEnabled":true}]
[2025-06-16 10:44:45] 🛠️ getSessionData()/profileResult: {"data":{"cdCliProfileName":"cd-api-local","cdCliProfileData":{"owner":{"userId":1010,"groupId":0},"cdVault":[{"name":"cd_token","value":"d33bb2d3-f4d5-42b4-8e31-44fed3e29826","description":"cd-api token","isEncrypted":false,"encryptedValue":null,"encryptionMeta":null},{"name":"consumerToken","value":"B0B3DA99-1859-A499-90F6-1E3F69575DCD","description":"cd-api consumerToken","isEncrypted":false,"encryptedValue":null,"encryptionMeta":null}],"details":{"session":{"jwt":null,"ttl":600,"userId":1010,"cd_token":"#cdVault['cd_token']"},"cdEndpoint":"https://localhost:3001/api","permissions":{"userPermissions":[{"read":true,"field":"cdCliProfileData","write":true,"hidden":false,"userId":1000,"execute":false}],"groupPermissions":[{"read":true,"field":"cdCliProfileData","write":false,"hidden":false,"execute":false,"groupId":0}]},"consumerToken":"#cdVault['consumerToken']"}},"cdCliProfileTypeId":10,"cdCliProfileGuid":"7e972f45-528e-4cac-ad02-6bdb100f901f","userId":1010,"cdCliProfileEnabled":1},"state":true,"message":"Profile 'cd-api-local' retrieved successfully."}
[2025-06-16 10:44:45] 🛠️ starting loadCdCliConfig()
[2025-06-16 10:44:45] 🛠️ config file: /home/emp-12/.cd-cli/cd-cli.profiles.json
[2025-06-16 10:44:45] ℹ️ Valid session token found. Proceeding...
[2025-06-16 10:44:45] ℹ️ Preset Axios instance for profile: cdApiLocal
[2025-06-16 10:44:45] 🛠️ starting loadCdCliConfig()
[2025-06-16 10:44:45] 🛠️ config file: /home/emp-12/.cd-cli/cd-cli.profiles.json
[2025-06-16 10:44:45] ℹ️ Valid session token found. Proceeding...
[2025-06-16 10:44:45] 🛠️ DevDescritorService::init()/ret:"https://localhost:3001/api"
[2025-06-16 10:44:45] 🛠️ DevDescritorService::init()/this.baseUrl:https://localhost:3001/api
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::callMethodFromCdRequest()/06
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::callMethodFromCdRequest()/controllerModule:[Module: null prototype] {
  CdAutoGitController: [class CdAutoGitController]
}
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::callMethodFromCdRequest()/c:CdAutoGitController
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::callMethodFromCdRequest()/{ctx:app,m:cd-auto-git,c:CdAutoGitController,a:createGitHubRepoOctokit,}
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::callMethodFromCdRequest()/08
[2025-06-16 10:44:45] 🛠️ starting loadCdCliConfig()
[2025-06-16 10:44:45] 🛠️ config file: /home/emp-12/.cd-cli/cd-cli.profiles.json
[2025-06-16 10:44:45] ℹ️ Valid session token found. Proceeding...
[2025-06-16 10:44:45] 🛠️ starting loadCdCliConfig()
[2025-06-16 10:44:45] 🛠️ config file: /home/emp-12/.cd-cli/cd-cli.profiles.json
[2025-06-16 10:44:45] ℹ️ Valid session token found. Proceeding...
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::callMethodFromCdRequest()/09
[2025-06-16 10:44:45] 🛠️ CICdRunnerService::callMethodFromCdRequest()/11
[2025-06-16 10:44:45] 🛠️ CdAutoGitController::createGitHubRepo()/start: {
  repoName: 'cd-ai',
  descript: 'module for processing ai auto development of corpdesk module at the backend',
  isPrivate: false,
  repoHost: 'corpdesk'
}
[2025-06-16 10:44:45] 🛠️ starting getGitHubProfile()
[2025-06-16 10:44:45] 🛠️ starting loadCdCliConfig()
[2025-06-16 10:44:45] 🛠️ config file: /home/emp-12/.cd-cli/cd-cli.profiles.json
[2025-06-16 10:44:45] ℹ️ Valid session token found. Proceeding...
[2025-06-16 10:44:45] 🛠️ starting loadCdCliConfig()
[2025-06-16 10:44:45] 🛠️ config file: /home/emp-12/.cd-cli/cd-cli.profiles.json
[2025-06-16 10:44:45] ℹ️ Valid session token found. Proceeding...
[2025-06-16 10:44:45] 🛠️ SessionController::getSession()/profileName: | Context: [object Object]
[2025-06-16 10:44:45] 🛠️ starting loadCdCliConfig()
[2025-06-16 10:44:45] 🛠️ config file: /home/emp-12/.cd-cli/cd-cli.profiles.json
[2025-06-16 10:44:45] ℹ️ Valid session token found. Proceeding...
[2025-06-16 10:44:45] 🛠️ starting loadCdCliConfig()
[2025-06-16 10:44:45] 🛠️ config file: /home/emp-12/.cd-cli/cd-cli.profiles.json
[2025-06-16 10:44:45] ℹ️ Valid session token found. Proceeding...
[2025-06-16 10:44:45] 🛠️ SessionController::getSession()/resultCliConfig: | Context: [object Object]
[2025-06-16 10:44:45] 🛠️ SessionController::getSession()/profile: | Context: [object Object]
[2025-06-16 10:44:45] 🛠️ SessionController::getSession()/profile: | Context: [object Object]
[2025-06-16 10:44:45] 🛠️ SessionController::getSession()/session1: | Context: [object Object]
[2025-06-16 10:44:45] 🛠️ starting CdCliValutController::decrypt()
[2025-06-16 10:44:45] 🛠️ CdCliValutController::decrypt()/encryptionMeta: | Context: [object Object]
[2025-06-16 10:44:45] 🛠️ CdCliValutController::decrypt()/encryptedValue: | Context: [object Object]
[2025-06-16 10:44:45] 🛠️ CdCliValutController::decrypt()/iv: | Context: [object Object]
[2025-06-16 10:44:45] 🛠️ CdCliValutController::decrypt()/decipher: | Context: [object Object]
[2025-06-16 10:44:45] 🛠️ CdCliValutController::decrypt()/07
[2025-06-16 10:44:45] 🛠️ CdAutoGitController::createGitHubRepo()/gitProfileData: {
  owner: { userId: 1010, groupId: 0 },
  cdVault: [
    {
      name: 'gitHubToken',
      value: null,
      description: 'github access token',
      isEncrypted: true,
      encryptedValue: 'd0eec.....d',
      encryptionMeta: {
        iv: 'b7d74cca0555c3ea7da954ac78603aaa',
        name: 'default',
        encoding: 'hex',
        ivLength: 16,
        algorithm: 'aes-256-cbc',
        encryptedAt: '2025-01-18T15:59:22.611Z'
      }
    }
  ],
  details: {
    endpoint: 'https://api.github.com/orgs/corpdesk/repos',
    gitRepos: [
      { repoHost: 'corpdesk', projName: 'coop' },
      { repoHost: 'corpdesk', projName: 'coop' }
    ],
    gitAccess: {
      apiRepoUrl: 'https://api.github.com',
      gitHubUser: 'georemo',
      baseRepoUrl: 'https://github.com',
      gitHubToken: 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    }
  },
  permissions: {
    userPermissions: [
      {
        read: true,
        field: 'sshKey',
        write: true,
        hidden: false,
        userId: 1000,
        execute: false
      }
    ],
    groupPermissions: [
      {
        read: true,
        field: 'sshKey',
        write: false,
        hidden: false,
        execute: false,
        groupId: 0
      }
    ]
  },
  type: 'api',
  typeId: 3
}
[2025-06-16 10:44:45] 🛠️ CdAutoGitController::createGitHubRepo()/endpoint: https://github.com
[2025-06-16 10:44:45] 🛠️ CdAutoGitController::createGitHubRepo()/gitHubToken: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
[2025-06-16 10:44:45] 🛠️ GitHub profile loaded successfully:{ endpoint: 'https://github.com' }
[2025-06-16 10:44:45] 🛠️ Payload prepared:{
  name: 'cd-ai',
  private: false,
  description: 'module for processing ai auto development of corpdesk module at the backend'
}
[2025-06-16 10:44:45] 🛠️ Attempting to create repository 'cd-ai' in organization 'corpdesk'...
[2025-06-16 10:44:45] 🛠️ Checking if repository 'cd-ai' exists in organization 'corpdesk'...
$ fetch https://api.github.com/repos/corpdesk/cd-ai {
  method: 'GET',
  body: undefined,
  redirect: undefined,
  headers: {
    accept: 'application/vnd.github.v3+json',
    'user-agent': 'octokit-rest.js/22.0.0 octokit-core.js/7.0.2 Node.js/18.20.1 (linux; x64)',
    authorization: 'token ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
  },
  signal: undefined
}
[2025-06-16 10:44:45] 🛠️ SessionController::getSession()/resolved: | Context: [object Object]
[2025-06-16 10:44:45] 🛠️ SessionController::getSession()/session2: | Context: [object Object]
[2025-06-16 10:44:45] ℹ️ cdToken has been set
[2025-06-16 10:44:46] 🛠️ Repository 'cd-ai' already exists.
[2025-06-16 10:44:46] 🛠️ Repository creation aborted: 'cd-ai' already exists.
[2025-06-16 10:44:46] 🛠️ Details of existing repository:
[2025-06-16 10:44:46] 🛠️   Name: cd-ai
[2025-06-16 10:44:46] 🛠️   URL: https://github.com/corpdesk/cd-ai
[2025-06-16 10:44:46] 🛠️   Created At: 2025-06-10T20:02:05Z
[2025-06-16 10:44:46] 🛠️   Last Updated At: 2025-06-10T20:02:05Z
[2025-06-16 10:44:46] 🛠️   Description: module for processing ai auto development of corpdesk module at the backend
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::callMethodFromCdRequest()/12
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::executeTaskWithPolicies()/result:{
  state: 2,
  message: "Repository creation aborted: 'cd-ai' already exists."
}
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::executeTaskWithPolicies()/02
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::run()/result:{
  state: 2,
  message: "Repository creation aborted: 'cd-ai' already exists."
}
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::run()/08
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::run()/nextRef:{
  pipelineName: 'Module Creation Pipeline',
  stageName: 'Create Module Repository',
  taskName: 'postCreateRepository'
}
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::run()/09
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::run()/05
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::run()/07
[2025-06-16 10:44:46] 🛠️ Starting CICdRunnerService::executeTaskWithPolicies()
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::executeTaskWithPolicies()/01
[2025-06-16 10:44:46] 🛠️ Starting CICdRunnerService::executeTask()
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::executeTask()/task:{"name":"postCreateRepository","type":"method","executor":"cd-cli","status":"running","cdRequest":{"ctx":"app","m":"cd-auto-git","c":"CdAutoGit","a":"performPostRepoCreationActions","dat":{"f_vals":[{"data":null}],"token":""},"args":{"repoName":"cd-ai","repoUrl":"https://github.com/corpdesk/cd-ai","moduleType":"cd-api","path":"~/cd-ai"}}}
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::executeTask()/task.type:method
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::executeTask()/descriptor:{"ctx":"app","name":"cd-ai","cdModuleType":"cd-api","description":"module for processing ai auto development of corpdesk module at the backend","controllers":[{"name":"cd-ai","actions":[]},{"name":"cd-ai-usage-logs","actions":[]}],"services":[{"name":"cd-ai","methods":[]},{"name":"cd-ai-usage-logs","methods":[]}],"models":[{"name":"cd-ai","fields":[]},{"name":"cd-ai-usage-logs","fields":[]}],"projectGuid":"3857bf4c-3968-45ec-afff-5b434702f0c4","contributors":{"vendor":{"name":"emp services ltd"},"developers":[{"name":"g.oremo","contact":"george.oremo@gmail.com"}]}}
[2025-06-16 10:44:46] 🛠️ Running case: method
[2025-06-16 10:44:46] 🛠️ Starting CICdRunnerService::callMethodFromCdRequest()
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::callMethodFromCdRequest()/01
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::callMethodFromCdRequest()/03
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::callMethodFromCdRequest()/04
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::callMethodFromCdRequest()/ctlDashedName:cd-auto-git.controller.js
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::callMethodFromCdRequest()/05
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::callMethodFromCdRequest()/controllerPath:../../../app/cd-auto-git/controllers/cd-auto-git.controller.js
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::callMethodFromCdRequest()/06
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::callMethodFromCdRequest()/controllerModule:[Module: null prototype] {
  CdAutoGitController: [class CdAutoGitController]
}
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::callMethodFromCdRequest()/c:CdAutoGitController
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::callMethodFromCdRequest()/{ctx:app,m:cd-auto-git,c:CdAutoGitController,a:performPostRepoCreationActions,}
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::callMethodFromCdRequest()/08
[2025-06-16 10:44:46] 🛠️ starting loadCdCliConfig()
[2025-06-16 10:44:46] 🛠️ config file: /home/emp-12/.cd-cli/cd-cli.profiles.json
[2025-06-16 10:44:46] ℹ️ Valid session token found. Proceeding...
[2025-06-16 10:44:46] 🛠️ starting loadCdCliConfig()
[2025-06-16 10:44:46] 🛠️ config file: /home/emp-12/.cd-cli/cd-cli.profiles.json
[2025-06-16 10:44:46] ℹ️ Valid session token found. Proceeding...
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::callMethodFromCdRequest()/09
[2025-06-16 10:44:46] 🛠️ CICdRunnerService::callMethodFromCdRequest()/11
[2025-06-16 10:44:46] 🛠️ 
--- Starting Git Post-Creation Actions for 'cd-ai' [cd-api] ---
[2025-06-16 10:44:46] 🛠️ SessionController::getSession()/profileName: | Context: [object Object]
[2025-06-16 10:44:46] 🛠️ starting loadCdCliConfig()
[2025-06-16 10:44:46] 🛠️ config file: /home/emp-12/.cd-cli/cd-cli.profiles.json
[2025-06-16 10:44:46] ℹ️ Valid session token found. Proceeding...
[2025-06-16 10:44:46] 🛠️ starting loadCdCliConfig()
[2025-06-16 10:44:46] 🛠️ config file: /home/emp-12/.cd-cli/cd-cli.profiles.json
[2025-06-16 10:44:46] ℹ️ Valid session token found. Proceeding...
[2025-06-16 10:44:46] 🛠️ SessionController::getSession()/resultCliConfig: | Context: [object Object]
[2025-06-16 10:44:46] 🛠️ SessionController::getSession()/profile: | Context: [object Object]
[2025-06-16 10:44:46] 🛠️ SessionController::getSession()/profile: | Context: [object Object]
[2025-06-16 10:44:46] 🛠️ SessionController::getSession()/session1: | Context: [object Object]
[2025-06-16 10:44:46] 🛠️ SessionController::getSession()/resolved: | Context: [object Object]
[2025-06-16 10:44:46] 🛠️ SessionController::getSession()/session2: | Context: [object Object]
[2025-06-16 10:44:46] ℹ️ cdToken has been set
$ git clone https://github.com/corpdesk/cd-ai .
Cloning into '.'...
warning: You appear to have cloned an empty repository.
$ git add hello-api.txt
$ git status --porcelain
A  hello-api.txt
$ git commit -m "chore(cd-api): Initial scaffolding"
[main (root-commit) bc7f328] chore(cd-api): Initial scaffolding
 1 file changed, 2 insertions(+)
 create mode 100644 hello-api.txt
$ git push origin main
To https://github.com/corpdesk/cd-ai
 * [new branch]      main -> main
[2025-06-16 10:44:50] 🛠️ 
--- Completed Post-Repo Setup for 'cd-ai' [cd-api] ---
[2025-06-16 10:44:50] 🛠️ Restored working directory: /home/emp-12/cd-cli
[2025-06-16 10:44:50] 🛠️ CICdRunnerService::callMethodFromCdRequest()/12
[2025-06-16 10:44:50] 🛠️ CICdRunnerService::executeTaskWithPolicies()/result:undefined
[2025-06-16 10:44:50] 🛠️ CICdRunnerService::executeTaskWithPolicies()/02
[2025-06-16 10:44:50] 🛠️ CICdRunnerService::executeTaskWithPolicies()/04
[2025-06-16 10:44:50] 🛠️ CICdRunnerService::executeTaskWithPolicies()/Task postCreateRepository failed with error: Cannot read properties of undefined (reading 'state')
[2025-06-16 10:44:50] 🛠️ CICdRunnerService::executeTaskWithPolicies()/05
[2025-06-16 10:44:50] 🛠️ CICdRunnerService::run()/result:{
  state: false,
  message: 'Task postCreateRepository failed after 1 attempts.'
}
[2025-06-16 10:44:50] 🛠️ CICdRunnerService::run()/08
[2025-06-16 10:44:50] 🛠️ CICdRunnerService::run()/nextRef:null
[2025-06-16 10:44:50] 🛠️ CICdRunnerService::run()/12
✔ Module "cd-ai" created successfully.
'✅ Executed 1 command(s).'
cd dev  > 
```