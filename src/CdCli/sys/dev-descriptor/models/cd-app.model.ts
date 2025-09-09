import type { CdRequest, ICdRequest } from '../../base/i-base.js';
import type { BaseDescriptor } from './base-descriptor.model.js';
import type { CdModuleDescriptor } from './cd-module-descriptor.model.js';
import type { CiCdDescriptor } from './cicd-descriptor.model.js';
import type { EnvironmentDescriptor } from './environment.model.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { LanguageDescriptor } from './language.model.js';
import { LicenseDescriptor } from './license.model.js';
import {
  CdControllerDescriptor,
  CdModelDescriptor,
  CdServiceDescriptor,
  ContributorDescriptor,
  VersionControlDescriptor,
} from '../index.js';

export interface CdAppDescriptor extends BaseDescriptor {
  $schema?: string;
  name: string;
  projectGuid?: string;
  parentProjectGuid: string | null;
  modules: CdModuleDescriptor[];
  cdCi?: CiCdDescriptor;
  description?: string;
  language?: LanguageDescriptor; // getLanguageByName(name: string,languages: LanguageDescriptor[],)
  environments?: EnvironmentDescriptor[]; // Development environment settings
  versionControl?: VersionControlDescriptor; // Version control details
}

export enum AppType {
  Frontend = 'frontend', // User-facing web or app interfaces
  Api = 'api', // Backend APIs
  CdApi = 'cd-api', // Corpdesk backend APIs
  CdApiModule = 'cd-module',
  PushServer = 'push-server', // Services for push notifications
  Cli = 'cli', // Command-line interfaces
  CdCli = 'cd-cli', // Corpdesk command-line interfaces
  Pwa = 'pwa', // Progressive Web Apps
  DesktopPwa = 'desktop-pwa', // PWAs optimized for desktop
  Mobile = 'mobile', // General mobile apps
  MobileHybrid = 'mobile-hybrid', // Hybrid apps using shared codebases
  MobileNative = 'mobile-native', // Fully native mobile apps
  Desktop = 'desktop', // Desktop applications
  Iot = 'iot', // Internet of Things services/devices
  Game = 'game', // Game applications
  Embedded = 'embedded', // Embedded systems or firmware
  Robotics = 'robotics', // Robotics and mechatronics
  Plugin = 'plugin', // Plugins or extensions
  Microservice = 'microservice', // Small, modular backend services
  SDN = 'sdn', // Software-Defined Networking applications
  CbO = 'cbo', // CloudBrix Orchestrator
}

export interface AppFrontendDescriptor extends BaseDescriptor {
  backendApp: { name: string; networkAddress: string }; // Defines the backend it connects to
  authenticationMethod?: string; // OAuth, JWT, SSO, etc.
  userInterface?: { framework: string; designSystem?: string }; // UI-related settings
}

export interface AppApiDescriptor extends BaseDescriptor {
  requestProcessing: { protocol: string; rateLimit?: number }; // CdWire, REST, GraphQL, gRPC etc.
  security?: { authentication: string; authorization?: string }; // e.g., JWT, OAuth
  dataSources: { database?: string; cache?: string; messageQueue?: string[] }; // Dependencies
  externalServices?: string[]; // APIs the backend depends on
}

export interface AppPushServerDescriptor extends CdAppDescriptor {
  pushProvider: string; // Firebase, OneSignal, etc.
  supportedPlatforms: string[]; // iOS, Android, Web
  messageFormat?: string; // FCM, APNs, MQTT
  retryMechanism?: boolean; // Whether it retries on failure
}

export interface AppCliDescriptor extends CdAppDescriptor {
  commands: string[]; // List of CLI commands
  inputHandling?: 'interactive' | 'scripted'; // Mode of operation
  outputFormat?: 'json' | 'yaml' | 'text'; // Output format support
}

export interface AppPwaDescriptor extends CdAppDescriptor {
  offlineSupport?: boolean; // Service worker usage
  storageMechanism?: string; // IndexedDB, LocalStorage
  installability?: boolean; // Whether it supports installation
}

export interface AppDesktopPwaDescriptor extends AppPwaDescriptor {
  systemIntegration?: string[]; // File system, Notifications, etc.
  autoUpdateSupport?: boolean; // Whether it can update automatically
}

export interface AppMobileDescriptor extends CdAppDescriptor {
  appStore: { platform: string; storeName?: string }; // Google Play, App Store
  notificationService?: string; // FCM, APNs, OneSignal
}

export interface AppMobileHybridDescriptor extends AppMobileDescriptor {
  hybridFramework?: string; // Ionic, Flutter, React Native
  webViewSupport?: boolean; // Whether it uses WebView for rendering
}

export interface AppMobileNativeDescriptor extends AppMobileDescriptor {
  nativeSdk?: string; // Swift, Kotlin, Objective-C
  deviceCapabilities?: string[]; // GPS, Camera, NFC, etc.
}

export interface AppDesktopDescriptor extends CdAppDescriptor {
  osSupport: string[]; // Windows, macOS, Linux
  nativeFeatures?: string[]; // File system, Bluetooth, USB, etc.
  distributionMethod?: string; // App Store, Standalone Installer
}

export interface AppIotDescriptor extends CdAppDescriptor {
  connectivity: string[]; // MQTT, LoRa, Bluetooth, etc.
  hardwareSupport: { board: string; chip: string }; // e.g., Raspberry Pi, ESP32
  powerSource?: 'battery' | 'mains' | 'solar'; // Power constraints
}

export interface AppGameDescriptor extends CdAppDescriptor {
  gameEngine: string; // Unity, Unreal, Godot
  multiplayerSupport?: boolean; // Whether it supports online play
  physicsEngine?: string; // Havok, PhysX, Bullet
  targetPlatform: string[]; // PC, Console, Mobile
}

export interface AppEmbeddedDescriptor extends CdAppDescriptor {
  realTimeOs?: string; // FreeRTOS, Zephyr
  hardwareConstraints?: { ram: string; storage: string }; // Memory and storage limitations
  connectivity?: string[]; // UART, I2C, SPI
}

export interface AppRoboticsDescriptor extends CdAppDescriptor {
  roboticsFramework: string; // ROS, OpenCV
  controlMethod?: 'autonomous' | 'remote-controlled'; // Mode of operation
  supportedHardware: string[]; // Arduino, Jetson Nano, etc.
}

export interface AppPluginDescriptor extends CdAppDescriptor {
  compatibleSoftware: string[]; // VSCode, Photoshop, Figma
  integrationType?: 'UI' | 'Middleware' | 'API Hook' | 'unknown'; // How it integrates
}

export interface AppMicroserviceDescriptor extends CdAppDescriptor {
  interServiceCommunication?: 'CdWire' | 'REST' | 'gRPC' | 'Message Queue' | 'unknown'; // How it talks to other services
  scalingMethod?:  'CloudBix'| 'Kubernetes' | 'Serverless'; // How it scales
  dependencies?: { databases?: string[]; messageQueues?: string[] }; // Services it relies on
}
