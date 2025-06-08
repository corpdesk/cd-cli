# CdCli Profile Setup Guide & Tutorial

This guide explains how to set up secure AI profiles for use with the `cd-cli` tool in the **Corpdesk** platform. Profiles enable secure and configurable access to AI services such as **Gemini**, **DeepSeek**, and others.

---

## 🔐 1. Prepare Your API Key

* Obtain your API key from the desired AI provider’s developer portal:

  * Gemini (via Google Cloud Console)
  * DeepSeek (via developer dashboard)
* Example:

  ```
  GEMINI_API_KEY=ya29.a0ARrdaM...
  ```

---

## 🧹 2. Save Profile Type in the Database

Before profile creation:

* Ensure the profile type (e.g., `gemini-ai`, `deepseek-ai`) exists in the database.
* Record its associated `typeId` (e.g., `12`, `13`).

---

## 🗂 3. Save API Key to `.bashrc`

To allow environment-based referencing in profile files:

```bash
echo 'export GEMINI_API_KEY=ya29.a0ARrdaM...' >> ~/.bashrc
source ~/.bashrc
```

This allows profile JSONs to reference keys as environment variables (e.g., `$GEMINI_API_KEY`).

---

## 📄 4. Save JSON File to `~/.cd-cli/<profile-type-name>.json`

* Use the same `<profile-type-name>` as defined in the DB.
* Example minimal profile for Gemini:

```json
{
  "apiKey": "$GEMINI_API_KEY",
  "projectId": "Gemini API",
  "defaultModel": "gemini-2.0-flash",
  "cryptFields": ["apiKey"]
}
```

---

## 🧠 5. Suggested Gemini Profile (Extended Version)

```json
{
  "apiKey": "$GEMINI_API_KEY",
  "projectId": "your-gcp-project-id",
  "defaultModel": "gemini-pro",
  "defaultRequestConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 1024,
    "topP": 0.9,
    "topK": 40
  },
  "safetySettings": [
    { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" },
    { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" },
    { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE" },
    { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE" }
  ],
  "cryptFields": ["apiKey"]
}
```

---

## 💬 6. Basic DeepSeek Profile

```json
{
  "apiKey": "dsk-xxxxxxxxxxxx",
  "baseUrl": "https://api.deepseek.com/v1",
  "defaultModel": "deepseek-chat",
  "cryptFields": ["apiKey"]
}
```

---

## 🗒 7. Advanced DeepSeek Profile (With Metadata)

```json
{
  "profileName": "deepseek-prod",
  "type": "deepseek",
  "description": "Production DeepSeek API access",
  "details": {
    "apiKey": "dsk-xxxxxxxxxxxxxxxxxxxxxxxx",
    "baseUrl": "https://api.deepseek.com/v1",
    "defaultModel": "deepseek-coder",
    "projectName": "CorpdeskAI-CodeGen",
    "usageTrackingId": "EmpDevServices",
    "cryptFields": ["apiKey"],
    "defaultParams": {
      "temperature": 0.5,
      "max_tokens": 4096,
      "top_p": 0.95,
      "frequency_penalty": 0.2
    }
  },
  "createdAt": "2024-03-15T10:00:00Z",
  "lastModified": "2024-03-15T10:00:00Z"
}
```

---

## 📁 8. Create Profile Templates

Save template JSON files at the following locations:

```
$HOME/cd-cli-nodejs/src/profileGeminiAiTemplate.json
$HOME/cd-cli-nodejs/src/profileDeepseekiAiTemplate.json
```

---

## 📦 9. Example Template with Permissions

```json
{
  "type": "gemini-ai",
  "typeId": 12,
  "owner": {
    "userId": 1010,
    "groupId": 0
  },
  "permissions": {
    "userPermissions": [
      {
        "userId": 1000,
        "field": "geminiAiKey",
        "hidden": true,
        "read": true,
        "write": true,
        "execute": false
      }
    ],
    "groupPermissions": [
      {
        "groupId": 0,
        "field": "geminiAiKey",
        "hidden": false,
        "read": true,
        "write": false,
        "execute": false
      }
    ]
  },
  "details": {}
}
```

---

## 🔧 10. Create Profile via CLI

Run the CLI with your template file:

```bash
cd-cli profile create --file /home/emp-12/cd-cli-nodejs/src/profileGeminiAiTemplate.json --debug 4
```

🧐 **Wizard Tips**:

* Use the same name as the template file (e.g., `gemini-ai`).
* Provide a clear description (e.g., *"Credentials for Gemini API access"*).

---

## 🩵 11. Debug Logs Example

```log
emp-12@emp-12 ~/cd-cli-nodejs (main)> cd-cli profile create --file /home/emp-12/cd-cli-nodejs/src/profileGeminiAiTemplate.json --debug 4
Log level set to: 4
CdLog::setDebugLevel()/log level: 4
CdLog::setDebugLevel()/03:
CdCliProfileModel::PROFILE_CMD::action/execute()/options._optionValues.file: /home/emp-12/cd-cli-nodejs/src/profileGeminiAiTemplate.json
CdCliProfileModel::PROFILE_CMD::action/execute()/options.args: []
CdCliProfileModel::PROFILE_CMD::action/execute()/options.args[2]: undefined
[2025-05-25 13:21:58] 🛠️ starting loadCdCliConfig()
[2025-05-25 13:21:58] 🛠️ config file: /home/emp-12/.cd-cli/cd-cli.profiles.json
[2025-05-25 13:21:58] ℹ️ Valid session token found. Proceeding...
[2025-05-25 13:21:58] 🛠️ CdCliProfileController::createProfile()/profileFilePath:/home/emp-12/cd-cli-nodejs/src/profileGeminiAiTemplate.json
[2025-05-25 13:21:58] 🛠️ config file: /home/emp-12/.cd-cli/cd-cli.profiles.json
[2025-05-25 13:21:58] ℹ️ Valid session token found. Proceeding...
[2025-05-25 13:21:58] 🛠️ CdCliProfileController::createProfile()/profileTemplate: [object Object]
[2025-05-25 13:21:58] 🛠️ CdCliProfileController::createProfile()/PROFILE_DIRECTORY: /home/emp-12/.cd-cli
[2025-05-25 13:21:58] 🛠️ CdCliProfileController::createProfile()/profileType: gemini-ai
[2025-05-25 13:21:58] 🛠️ CdCliProfileController::createProfile()/filePath: /home/emp-12/.cd-cli/gemini-ai.json
[2025-05-25 13:21:58] 🛠️ starting CdCliVaultController::encrypt()
[2025-05-25 13:21:58] 🛠️ CdCliVaultController::encrypt()/meta: | Context: [object Object]
[2025-05-25 13:21:58] 🛠️ CdCliVaultController::encrypt()/iv: | Context: 7;@��3$d9簐,�=s
[2025-05-25 13:21:58] 🛠️ CdCliProfileController::loadProfileDetails: /home/emp-12/.cd-cli/gemini-ai.json
[2025-05-25 13:21:58] 🛠️ CdCliProfileController::createProfile()/profileDetails: [object Object]
? Enter profile name: gemini-ai
? Enter profile description: credentials for gemini api access
[2025-05-25 13:22:40] 🛠️ SessionController::getSession()/profileName: | Context: [object Object]
[2025-05-25 13:22:40] 🛠️ starting loadCdCliConfig()
[2025-05-25 13:22:40] 🛠️ config file: /home/emp-12/.cd-cli/cd-cli.profiles.json
[2025-05-25 13:22:40] ℹ️ Valid session token found. Proceeding...
[2025-05-25 13:22:40] 🛠️ starting loadCdCliConfig()
[2025-05-25 13:22:40] 🛠️ config file: /home/emp-12/.cd-cli/cd-cli.profiles.json
[2025-05-25 13:22:40] ℹ️ Valid session token found. Proceeding...
[2025-05-25 13:22:40] 🛠️ SessionController::getSession()/resultCliConfig: | Context: [object Object]
[2025-05-25 13:22:40] 🛠️ SessionController::getSession()/profile: | Context: [object Object]
[2025-05-25 13:22:40] 🛠️ SessionController::getSession()/profile: | Context: [object Object]
[2025-05-25 13:22:40] 🛠️ SessionController::getSession()/session1: | Context: [object Object]
[2025-05-25 13:22:40] 🛠️ SessionController::getSession()/resolved: | Context: [object Object]
[2025-05-25 13:22:40] 🛠️ SessionController::getSession()/session2: | Context: [object Object]
[2025-05-25 13:22:40] 🛠️ CdCliProfileController::createProfile()/sessResp: {"jwt":null,"ttl":600,"userId":1010,"cd_token":"d33bb2d3-f4d5-42b4-8e31-44fed3e29826"}
[2025-05-25 13:22:40] 🛠️ CdCliProfileController::createProfile()/this.cdToken: d33bb2d3-f4d5-42b4-8e31-44fed3e29826
[2025-05-25 13:22:40] 🛠️ starting loadCdCliConfig()
[2025-05-25 13:22:40] 🛠️ config file: /home/emp-12/.cd-cli/cd-cli.profiles.json
[2025-05-25 13:22:40] ℹ️ Valid session token found. Proceeding...
starting setEnvelopeCreateCdCliProfile()/d.data: {
  cdCliProfileName: 'gemini-ai',
  cdCliProfileDescription: 'credentials for gemini api access',
  cdCliProfileData: {
    type: 'gemini-ai',
    typeId: 12,
    owner: { userId: 1010, groupId: 0 },
    permissions: { userPermissions: [Array], groupPermissions: [Array] },
    details: {
      profileName: 'gemini-ai',
      description: 'credentials for gemini api access',
      apiKey: [Object],
      projectId: 'Gemini API',
      defaultModel: 'gemini-2.0-flash',
      cryptFields: [Array],
      encrypted: true
    }
  },
  cdCliProfileEnabled: true,
  cdCliProfileTypeId: 12,
  userId: 1010
}
createCdCliProfile()/this.postData: {"ctx":"Sys","m":"","c":"","a":"Create","dat":{"f_vals":[{"query":null,"data":{"userName":"","password":""}}],"token":null},"args":{}}
starting setEnvelopeCreateCdCliProfile()/d.data: {
  cdCliProfileName: 'gemini-ai',
  cdCliProfileDescription: 'credentials for gemini api access',
  cdCliProfileData: {
    type: 'gemini-ai',
    typeId: 12,
    owner: { userId: 1010, groupId: 0 },
    permissions: { userPermissions: [Array], groupPermissions: [Array] },
    details: {
      profileName: 'gemini-ai',
      description: 'credentials for gemini api access',
      apiKey: [Object],
      projectId: 'Gemini API',
      defaultModel: 'gemini-2.0-flash',
      cryptFields: [Array],
      encrypted: true
    }
  },
  cdCliProfileEnabled: true,
  cdCliProfileTypeId: 12,
  userId: 1010
}
[2025-05-25 13:22:40] 🛠️ starting loadCdCliConfig()
[2025-05-25 13:22:40] 🛠️ config file: /home/emp-12/.cd-cli/cd-cli.profiles.json
[2025-05-25 13:22:40] ℹ️ Valid session token found. Proceeding...
[2025-05-25 13:22:40] 🛠️ getProfileByName()/this.profiles: {}
[2025-05-25 13:22:40] 🛠️ The profile is not initialized. Trying to initialize...
[2025-05-25 13:22:40] 🛠️ starting loadCdCliConfig()
[2025-05-25 13:22:40] 🛠️ config file: /home/emp-12/.cd-cli/cd-cli.profiles.json
[2025-05-25 13:22:40] ℹ️ Valid session token found. Proceeding...
[2025-05-25 13:22:40] 🛠️ getProfileByName()/profileResult.data?.items: [{"cdCliProfileName":"devServer-ssh-profile","cdCliProfileData":{"owner":{"userId":1010,"groupId":0},"details":{"sshKey":null,"cdApiDir":"~/cd-api","devServer":"192.168.1.70","remoteUser":"devops"},"permissions":{"userPermissions":[{"read":true,"field":"sshKey","write":true,"hidden":false,"userId":1000,"execute":false}],"groupPermissions":[{"read":true,"field":"sshKey","write":false,"hidden":false,"execute":false,"groupId":0}]}},"cdCliProfileTypeId":2,"cdCliProfileGuid":"a9246764-f6b7-4b63-93c1-12fb24f88c8f","userId":1010,"cdCliProfileEnabled":1},{"cdCliProfileName":"cd-git-config","cdCliProfileData":{"owner":{"userId":1010,"groupId":0},"cdVault":[{"name":"gitHubToken","value":null,"description":"github access token","isEncrypted":true,"encryptedValue":"d0eec01aaaf28e5242fd1f698538501f4e2efafc862eadbc0ec9eb5be164b61c62e1b6f6aadbab023698edbe3fbdd42d","encryptionMeta":{"iv":"b7d74cca0555c3ea7da954ac78603aaa","name":"default","encoding":"hex","ivLength":16,"algorithm":"aes-256-cbc","encryptedAt":"2025-01-18T15:59:22.611Z"}}],"details":{"gitRepos":[{"repoHost":"corpdesk","projName":"coop"},{"repoHost":"corpdesk","projName":"coop"}],"gitAccess":{"apiRepoUrl":"https://api.github.com","gitHubUser":"georemo","baseRepoUrl":"https://github.com","gitHubToken":"#cdVault['gitHubToken']"}},"permissions":{"userPermissions":[{"read":true,"field":"sshKey","write":true,"hidden":false,"userId":1000,"execute":false}],"groupPermissions":[{"read":true,"field":"sshKey","write":false,"hidden":false,"execute":false,"groupId":0}]}},"cdCliProfileTypeId":3,"cdCliProfileGuid":"3ff7f765-0bbf-4c6f-920c-14bcfa63da1d","userId":1010,"cdCliProfileEnabled":1},{"cdCliProfileName":"frontend-aws-prod","cdCliProfileData":{"owner":{"userId":1010,"groupId":0},"details":{"sshKey":"~/.ssh/aws_frontend.pem","cdApiDir":"~/","devServer":"asdap.net","remoteUser":"ubuntu"},"permissions":{"userPermissions":[{"read":true,"field":"sshKey","write":true,"hidden":false,"userId":1000,"execute":false}],"groupPermissions":[{"read":true,"field":"sshKey","write":false,"hidden":false,"execute":false,"groupId":0}]}},"cdCliProfileTypeId":3,"cdCliProfileGuid":"1baab097-4d34-4e12-a9c2-d5f8d1c73583","userId":1010,"cdCliProfileEnabled":1},{"cdCliProfileName":"cd-api-local","cdCliProfileData":{"owner":{"userId":1010,"groupId":0},"cdVault":[{"name":"cd_token","value":"d33bb2d3-f4d5-42b4-8e31-44fed3e29826","description":"cd-api token","isEncrypted":false,"encryptedValue":null,"encryptionMeta":null},{"name":"consumerToken","value":"B0B3DA99-1859-A499-90F6-1E3F69575DCD","description":"cd-api consumerToken","isEncrypted":false,"encryptedValue":null,"encryptionMeta":null}],"details":{"session":{"jwt":null,"ttl":600,"userId":1010,"cd_token":"#cdVault['cd_token']"},"cdEndpoint":"https://localhost:3001/api","permissions":{"userPermissions":[{"read":true,"field":"cdCliProfileData","write":true,"hidden":false,"userId":1000,"execute":false}],"groupPermissions":[{"read":true,"field":"cdCliProfileData","write":false,"hidden":false,"execute":false,"groupId":0}]},"consumerToken":"#cdVault['consumerToken']"}},"cdCliProfileTypeId":10,"cdCliProfileGuid":"7e972f45-528e-4cac-ad02-6bdb100f901f","userId":1010,"cdCliProfileEnabled":1},{"cdCliProfileId":6,"cdCliProfileGuid":"28c7e30f-f42b-47cd-811b-ba747cb0f83e","cdCliProfileName":"open-ai","cdCliProfileDescription":"open-ai access credetials","cdCliProfileData":{"type":"open-ai","typeId":11,"owner":{"userId":1010,"groupId":0},"permissions":{"userPermissions":[{"userId":1000,"field":"openAiKey","hidden":true,"read":true,"write":true,"execute":false}],"groupPermissions":[{"groupId":0,"field":"openAiKey","hidden":false,"read":true,"write":false,"execute":false}]},"details":{"profileName":"open-ai","description":"open-ai access credetials","apiKey":{"name":"apiKey","description":"Encrypted data","value":null,"encryptedValue":"df8d7c0782fcabd69b0425fe6b3d1dc54a2d9764c74db29a99a094fa8b2a051b37fceb141bd6d6ab2257b8483b044c005b91a0037fadf1c4bd976f6a09ca92d6d8ba4c195a844d0f7afd4e1f8693d5dc83cc843685a633fcc96930e2751d2eb87d725461c31dae8562b1a5e758e753e005988cbc8241fa28f51ade24446d3c43e879371f046944b9ab7a35aaca39250034059c959aa7f36f2025285bd2ddcd5cdedbbff4ecb55b396f40e9f443158f80","isEncrypted":true,"encryptionMeta":{"name":"default","algorithm":"aes-256-cbc","encoding":"hex","ivLength":16,"iv":"d183054de1ded1dea33d576a8a88fda3","encryptedAt":"2025-05-20T18:58:00.637Z"}},"organizationId":"EmpServices","openAiProjectName":"CorpdeskAI","baseUrl":"https://api.openai.com/v1","defaultRequestConfig":{"model":"gpt-3.5-turbo","temperature":0.7,"max_tokens":500},"cryptFields":["apiKey"],"encrypted":true}},"cdCliProfileTypeId":11,"userId":1010,"docId":21753,"cdCliProfileEnabled":true}]
[2025-05-25 13:22:40] ℹ️ HttpService initialized with endpoint: https://localhost:3001/api
[2025-05-25 13:22:40] 🛠️ starting proc(): | Context: [object Object]
[2025-05-25 13:22:40] 🛠️ Sending request: | Context: [object Object]
[2025-05-25 13:22:43] ℹ✨ Profile 'gemini-ai' created successfully.
✨ Done in 45.52s.
```

---

> For more advanced automation, the CLI engine supports variable substitution and encrypted persistence of API keys using environment references (e.g., `$GEMINI_API_KEY`) to avoid plain-text exposure in the database.
