## ISSUE

---
I am getting the following mermaid error:
Parse error on line 34:
...dback| R1endnote right of SHELL  Gen
--------------------^
Expecting 'SEMI', 'NEWLINE', 'EOF', 'AMP', 'START_LINK', 'LINK', 'LINK_ID', got 'NODE_STRING'

What is the fix

```mermaid
graph TD

%% Clusters
subgraph A["Unified or Wide-Area Environment"]
  subgraph B["cd-sio Cluster (Redundant Nodes, Shared IP)"]
    S1["cd-sio Node 1"]
    S2["cd-sio Node 2"]
    S3["cd-sio Node 3"]
  end

  subgraph R["Redis Cluster (Message Routing & Sync)"]
    R1["Redis Node 1"]
    R2["Redis Node 2"]
    R3["Redis Node 3"]
  end

  S1 <-->|Pub/Sub| R1
  S2 <-->|Pub/Sub| R2
  S3 <-->|Pub/Sub| R3

  subgraph Clients["Connected Clients (cd-sio Consumers)"]
    IDE["IDE Client (dev-sync / IdeAgentService)"]
    SHELL["cd-shell / SidebarComponent"]
    USER["cd-user / SignInController"]
    AI["AI Orchestrator (Learning Layer)"]
  end

  %% Connections
  IDE -->|save-event| S1
  S1 -->|runtime-update| USER
  USER -->|ack-update| IDE
  SHELL -->|publish appId| USER
  SHELL -->|publish appId| IDE
  AI -->|adaptive coordination| S1
  AI -->|state feedback| R1

end

%% AppId notes
note right of SHELL
Generates new GUID appId on launch
Saves to LocalStorage/CdStorage
Shared with all modules in session
end

note right of IDE
Uses appId for session-level routing
Communicates save events & updates
end

note right of USER
Reacts to runtime updates
Notifies IDE of completion
end
```

---

## COMPLETED TASKS:



---

## TASKS IN PROGRESS:

- Set up pwa app for scafolding via cd-cli/app-craft
- Documentation based on test experience
  - Managed fields that do not need to be set for input values as part of cd-api request data.

- all cd-cli modules should have internal test that can be run everytime a new feature is added.
- set up user data via cd-cli wizard or cli
  - this can be done in registration session
- set up initial instruction via wizard or cli
- register cd-ai menu

---

- cd-api should also have a way of testing each module and system operations.

## TO DO:

---

- confirm module purge is working
- Make sure when new module is registered, correct message is: new module created
- test cd-ai module
- add to the delete process: remove test-bed files as the last task
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

- review PWA/cd-shell
- review PWA/cd-user
- automate scafolding of PWA/cd-module

## COMMANDS DESIGN AND DEVELOPMENT

---

Command structure

```sh
<DevModeAction> --<ActonTarget as CdObjType.cdObjTypeName> --name <CdObj.dObjName> --o-env <Env as CdObjType.cdObjTypeName> --repo <Repo as CdObj.dObjName>
```

```sh

# create a new module in cd-cli/app-craft
create --cd-module --name cd-ai --o-env workshop --repo cd-ai;

# create module in a cd-api instance (database objects are not set during this proces)
create --cd-module --name cd-ai --o-env test-bed --repo cd-ai;

# update module in cd-api instance then migrate all the required database objects
update --cd-module --name cd-ai --o-env test-bed --repo cd-ai;

# deregister from cd-ai instance and purge all module tables in the database
delete --cd-module --name cd-ai --o-env test-bed --repo cd-ai;

test --cd-module --name cd-ai --o-env test-bed --repo cd-ai;

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
8. Test application features

- login
- view auto built menu
- Manage user profile
- test module features

9. Test Admin features
10. Implement custom module features
    Review of How Corpdesk Work
11. Objectives
12. Features
13. Module Development Cycle
14. Output:

- workshop files
- git repository
- testbed version
- databse objects
- online package
- installed instance

5. Review testing standards
6. Review security issues
7. Review IP security
