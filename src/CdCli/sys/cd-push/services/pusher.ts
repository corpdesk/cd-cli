// src/pusher.ts
import Pusher from 'pusher';

const pusher = new Pusher({
    appId: "1813536",
    key: "d0a484e9f13f58c57476",
    secret: "1281499b5868057dc567",
    cluster: "ap2",
    useTLS: true
});

export default pusher;