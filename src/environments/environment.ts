import type { EnvConfig } from '../CdCli/sys/base/IBase.js';

const API_HOST = 'https://cd-api.co.ke';
const API_ROUTE = '/api';
const API_PORT = '3001';
const SIO_PORT = '3002';
const PUSH_HOST = API_HOST;
// const SIO_ROUTE = '/sio';

// https://cd-api.co.ke:3001/api
export const environment: EnvConfig = {
  appId: '',
  production: false,
  apiEndpoint: `${API_HOST}:${API_PORT}${API_ROUTE}`,
  sioEndpoint: `${PUSH_HOST}:${SIO_PORT}`,
  wsEndpoint: 'ws://cd-api.co.ke:3000',
  wsMode: 'sio',
  pushConfig: {
    sio: {
      enabled: true,
    },
    wss: {
      enabled: false,
    },
    pusher: {
      enabled: true,
      apiKey: 'DtVRY9V5j41KwSxKrd8L_dRijUJh9gVcqwBH5wb96no',
      options: {
        cluster: 'ap2',
        forceTLS: true,
        userAuthentication: {
          // endpoint: "/pusher/user-auth",
          endpoint: 'https://cd-api.co.ke:3002/pusher/auth',
          transport: 'ajax',
          params: {},
          headers: {},
          includeCredentials: true,
          customHandler: null,
        },
        channelAuthorization: {
          endpoint: 'https://cd-api.co.ke:3002/pusher/auth',
        },
        authEndpoint: 'https://cd-api.co.ke:3002/pusher/auth',
      },
    },
  },
  CD_PORT: 3001,
  consumerToken: 'B0B3DA99-1859-A499-90F6-1E3F69575DCD', // current company consumer
  USER_RESOURCES: 'http://routed-93/user-resources',
  apiHost: 'https://cd-api.co.ke',
  sioHost: 'https://cd-api.co.ke',
  shellHost: 'https://asdap.net',
  consumer: '',
  clientAppGuid: 'ca0fe39f-92b2-484d-91ef-487d4fc462a2',
  clientContext: {
    entity: 'ASDAP', // context of client eg company, project or proramme eg ASDAP, MPEPZ...OR company name
    clientAppId: 2, // this client application identifies itself to the server with this id
    consumerToken: 'B0B3DA99-1859-A499-90F6-1E3F69575DCD', // current company consumer
  },
  clientAppId: 2, // this client application identifies itself to the server with this id: to depricate in favour of clientContex
  SOCKET_IO_PORT: 3002, // push server port
  defaultauth: 'cd-auth', // fckService | cd-auth | firebase
  initialPage: 'dashboard', // the default page, on successful login
  mfManifestPath: '/assets/mf.manifest.json',
  apiOptions: {
    headers: { 'Content-Type': 'application/json' },
  },
  // this.socket = io(`${this.env.sioEndpoint}`,this.env.sioOptions);
  sioOptions: {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    secure: true,
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 2000,
  },
  firebaseConfig: {
    apiKey: '',
    authDomain: '',
    databaseURL: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: '',
  },
};
