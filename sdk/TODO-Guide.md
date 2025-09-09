## ISSUE

---

Examing the information shared below and align your recommendations based on the existing structures.

For example in your first step, you recommend "extend the descriptor contract with db metadata:"

////////////////////////////////////////////////////////////

To integrate this in existing structures, the above 'attributes' is already represented by models[i].fields[] as per CdModelDescriptor(shared below)
We can align with your proposal by making sure FieldDescriptor(shared below) has the fields as per your proposal.
The method buildModel() can then be made to produce the data that is compliant to typeorm migration requrement.
Next, you can aligh MigrationInstruction to

Method used to produce model data for CdModuleDescriptor to CdModelDescriptor definitions to satisfy columns and relations property. Note that these are already considered in the CdModelDescriptor and its associate descritors.

Having considered the above in terms of systematic structures, you then consider how buildModel() needs to be updated.
From, my candid analysis so far, very little need to be done to make it compliant to expected migration data.

Do your analysis and let me know what you think.

Example for data produced by buildModel()
Note that it auto merges the custom and default data.
The result is then sanitized.



//////////////////////////////////////////
I have set up the above ingredients.
The only changes I have made is:

- becasue we already have gen-controller, gen-entity etc, I have created gen-schema
  /home/emp-12/cd-cli/src/CdCli/app/app-craft/services/gen-schema.service.ts
  So the class SchemaBuilderService becomes GenSchemaService.

So we have GenSchemaService.buildMigration() as the guy to call to produce the expected migration data.

Remember the method to execute will be called from a workflow. So assuming I have a method that can call the the GenSchemaService.buildMigration(), how should it executed the typeorm migration to work on with the data via typeorm configs.

///////////////////////////////////////////
Below are the set of configurations for typeorm.



---

## COMPLETED TASKS:

---

Milestone:

- imports developed from descriptors working ok
- file naming working ok with all the ComponentType's
- class names and headers working ok

## TASKS IN PROGRESS:

---

- auto generate initial methods
- test if imports are correct
  - imports still reading 'abcd'
  - how to configure native import: eg importing service to controller
- set queriable methods
- populate methods for controllers and services
- ensure attributes are included in the generated class
- include 'constructor' as a method, in fetched template for scafolding
- include 'constructor' as a method, in default items for both service and controller in scafolding descriptor data.
  Redessigning TemplateSnippetService.buildMethodStubSnippets() and GenControllerImplementationService.implementMethods()

1. to confirm that the input, finalCode, is ok

- confirm the markers are set properly
  ACTION 1:
  Do a helper method that is able to:
- validate and normalize the input stubs to confirm not have sytax errors
- validate and normalize the markers to confirm they are functional. ie there is proper start and end marking and non has an orphan or hanging head or tail.

2. If No 1 is successfull, then: develop Build take some meta data that can be used to assess the substitution progress and performance
   ACTION 2:

- Develop a new array that merges the template and the matching stubs. From this it should be possible to get analisis of stubs that do not have matching patners and template methods that are unutilized if any. This data can also be used later to verify the progress and identify problematic issues.
  ACTION 3:

3. Develop a substitution helper method.
4. Develop a post substiturion validator method.

- Confirm that we have a working formular for REPLACING a given stub. (Remember this is where we have been performing very poorly)

Strategic intervention:
All the procesess mentioned above should be organised within implementMethods() so as not to break the existing flow.
The new helper methods can be stitched inside in form of a converyor belt with proper comments for easy debuging and progressive development.

- correct import paths
- double 'type' in model files:



/////////////////////////////////////////////////
Hey Chase!. Look at the method buildService() below and see if you can set beforeUpdate() as one of the default methods.
Notice its signature.
Do no worry about the dependency. That is set in a different class and method.

/////////////////////////////////////////////////////////////////////////

I am currently experiencing the error below when I try to initiate typeorm to sync database.
What do you make of it?



//////////////////////////////////////////////////////////////////////
Adjust the following methods to do the scafold with Option 1 in place.
The methods are working very ok except that. So just focus on implementing Option 1 fix.
When you given your response, give me full version of the method with the correction.
You ca leave the rest of codes as is complet with the comments and logs.



////////////////////////////////////////////////////////
We have move foward a little. But hit a snug.

///////////////////////////////////////////////////////
This is how the entity configs are wired to allow configurability from the cd-cli to controll cd-api project entities.
You can commend on this based on your recommendations.
/home/emp-12/cd-cli/dist/configs/module-entities.json


//////////////////////////////////////////////
I had to use const ext = isTs ? '' : 'js'; instead of const ext = isTs ? 'ts' : 'js';
That is how the projects is set.
We have then made some progress but still some issues to work on. See the log below:


////////////////////////////////////////////////
Having understood the issue, would embed this structural dimension in the descriptors definitions.
We can have something that allow us to do something similar to enum eg

fieldX: FieldType = f.mysql.int

The configuration should allow us to apply FieldType in variety of situations but data remains the same yet versetile and configurable.
I am just guiding on design.
I hope you are able to figure something along these line.
As you work on it, take below as your rationale:
Corpdesk aim to resolve issues that developers grapple with everyday and set varied solutions.
The solutions should be durable and easy to use.
You notice in this case we would have gone ahead and use some quick fix.
But embeding a versetile and configurable solution in the descriptors, we are resolving an issue in a manner that even if we start a new project, we can still reuse the descriptors as part of 'our' language.

//////////////////////////////////////////////////////////////
That has worked.
Assess for me these logs to properly document the actual issue.
I can then foloow up from the codes and get back to you.
Note. This issue was coming up when writing typeorm entity files.
Prettier could be detecting some type or syntax issue.

//////////////////////////////////////////////
We had worked on the issue below but the solution did not work very well.
This error is coming up from already developed files in the testbed.
Rather that start making corrections as we did earlier, I need us to appear to be correcting the developed file.
We will then work backwards knowing the exact solution required.
So look at the logs again and then compare with the entity file below.
Suggest specific correction on the entity file.
////////////////////////////////////////////////////
sample entity file for correction.


/////////////////////////////////////

I am still experiencing the same issue after updating the file.
At this stage, I am thinking it would be worth it to try and consider refactoring this method to allow us to see the content of the files being loaded.
Is this possible?

////////////////////////////////////////

I am thinking we need to start by brainstorming on definition of MigrationInstruction. Current definition:


When I think about a migration tool I see defferent ranges of migration:

- migrating model to database schema
  - syncing model with database schema eg change of field name or other properties
- migrating database to model for backup or snapshot
  - syncing database to model in terms of changes in the database detail properties (can be usefule for reverse engineering where necessary)
- Other extensions may include database to buckup or the reverse
- All the above may deal with different types of datbases sql and non-sql
- Other passive capacities should include structural querys for diagnosis and state queries.
  You can also assist me to brainstorm around this topic without veering out of context.


///////////////////////////////////////////
Below is the current setting of MigrationProfile.
I have condensed MigrationProfile so that both source and destination are just of DataSourceConfig type.


////////////////////////////////////////////

You declared private mysql!: DataSource;
At this point I assumed, you meant the DataSource we had just introduced.
At the same time I noticed it can conflict with a number of plugings related to sql.
So I changed the name to CdDataSource.

Related to this is also a line in the method applyMigration():
await this.mysql.query(sql);
We have not defined query as a property.
When I see this I ask myself, does a datasource have a query?
I think it is the migration that can have a query.
In this case, it we have to fit query in MigrationProfile.transformation.
You can even see, we already had a sql.
I think you can asses and sort this.
Let me know your recommendation on how to handl this in applyMigration()


//////////////////////////////////////////////
You can assist me to review the class DbMigrationService.
Especially the initialization.
I would like to believe once the class is initialized, one should be able to just call migrateFromModel().
In other words, can we say migrateFromModel() is ready for use in a workflow?


///////////////////////////////////////////
We need to make this method to be workflow compliant.
It needs to return Promise<CdFxReturn<null>>


////////////////////////////////////////////////////////////////////
Assist me to modify the method below so it can run instance.init() if available.
It also must be able to respond should there be an error. Perhaps via some try/catch.
The error must be captured and reported well.



///////////////////////////////////////////////////
We have made some progress. Now the codes are executing.
You can review the logs and recommend fix and any refinement.



/////////////////////////////////////////////////
Now below are the kind of issues that we must be able to deal with very carefully.
They are the tests that makes good and bad tools.
You must be having some reference that can guide though this.


/////////////////////////////////////////
I have corrected ColumnDescriptor to FieldDescriptor.
Then RelationDescriptor to RelationshipDescriptor
What I need you to assist me with is:

1. Given the definition of RelationshipDescriptor, harmonize the isRelationEqual() to fit existing definition or modify where value is gained.
   Where you make changes, also consider future usage.
2. We still dont have IndexDescriptor. So you can define one that can work with isIndexEqual. Also consider future usage.



/////////////////////////////////////////////
We had earlier developed a mechanism for backing up a table if one is existing.
At this point, there was a bug which was creating multiple tables in one process.
We then developed mitigation for this.
After creating the mitigation now we are back to where we started.
Try and find out the issue and resolve as per requirement.



/////////////////////////////////////////////////////////
The two lines in the method below have an error:
Object is possibly 'undefined'.ts(2532

I have shared the definition of the relevant interface: RelationshipDescriptor

//problematic lines:
relMap[rel.CONSTRAINT_NAME].sourceColumns.push(rel.COLUMN_NAME);
relMap[rel.CONSTRAINT_NAME].targetColumns.push(rel.REFERENCED_COLUMN_NAME);



///////////////////////////////////////////////
Assess the logs in relations to the method based on where the loging points are placed.
The method is meant to fetch tables from the mysql and process them based on requirement.
The connection is made via typeorm to mysql.
There seem to be some issue with how the loop is initiated.
Let me know how the code can be improved to fix the issue.



//////////////////////////////////////////////
Thanks that has worked.
We are now in the loop but some issue to fix.
See the logs.



/////////////////////////////////////////////
The class below is meant to:

1. Take in model from an app
2. Use the app to create requred database resources defined in the model.
   The entry method is migrateFromModel().
   While the process is running well, I am currently focusing on a proces that should happen when it finds existing say table.
   It should:
3. Backup the table
4. Delete the table
5. Create a new one
   I have tried to implement the above process in the applyMigration() method.
   Currently experiencing the log shown below.
   Assist me to not only clear the issue but to assess and recomend if any modifiction need to be done for it to achieve the above requrement.



////////////////////////////////////////////////////////////
For some reason, it is crating multiple(3 to be exact) backups in one go.
Are you able to tel how this is happening and how we can fix it.



/////////////////////////////////////////////////////////////////
Note that now instead of querying all the tables, we are just queryint where table_name = '<module-name>%'
This allow us to get only the tables associated with the module(if any exists)
Take a look at the codes and logs shared.
Note what is existing in

1. the database(see logs: igrateFromModel()/destSchemaResult:) and compare with
2. the model 'tables'(see logs: migrateFromModel()/sourceSchema) and
3. the output of compareSchemas(): see logs: migrateFromModel()/migrations:

I would like to understand how the migration data is supposed to work.
Given that

1. in this process, it does not seem like there was an attampt to drop, buckup or replace existing tables
2. Typeorm logs show create statements but some of those table where never created and there is not information as to why they were not created.



/////////////////////////////////////////////////////////////////////////
Below are the codes previous compareColumnsAndConstraints() and the new version.
In the new version the return has been formalised into an interface ColumnDiff.
But for us to maintain compatibility we may need to maintain the return interface.
But if introcuction of new properties are being helpful, it is ok to add the new interfaces eg 'type'.
What is not clear is the new method uses 'column' as object and actually hosts multiple columns.
This need to be clarified and how this is going to affect the consuming entity.
Are these changes part of solutions, or we can still resolve the normalization of names and maintain the return interface.
If you are to make correction, use the version contained here. Some errors were corrected in the version you produced.



/////////////////////////////////////////////////////////
Refactor the method compareColumnsAndConstraints() so that all the table names and columns for database are normalized via normalizeTableName() and normalizeColumnName().
Assume that the source input is build from model data and dest input is built from database data.
The model names are usualy in kebab case but the database table and field names are in snake case.
That s where normalizeTableName() and normalizeColumnName() are meant to assit.
When done give me the full verion of compareColumnsAndConstraints().


```ts
MissingPrimaryColumnError: Entity "CdAiUsageLogsTypeModel" does not have a primary column. Primary column is required to have in all your entities. Use @PrimaryColumn decorator to add a primary column to your entity.
```

- typeorm is not updating the view
- gen-entities are not setting id property correctly
- use migration instead of 'sycronization'
- migration should add initial test data for testing validation
- initial test data should be automated and reported
  - The test should include internal and http crud tests
- all cd-cli modules should have internal test that can be run everytime a new feature is added.
- cd-api should also have a way of testing each module and system operations.

## TO DO:

---

- test cd-ai module
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
