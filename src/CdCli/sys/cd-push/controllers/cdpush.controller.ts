// import { io } from 'socket.io-client';
import { Observable } from 'rxjs';
import config from '../../../../config.js';

export class CdPushController {
    socket: any;
    readonly url: string = '';
    constructor() {
        // this.socket = io(`${environment.HOST}:` + environment.SOCKET_IO_PORT);
        // this.socket = io.connect('https://localhost', {secure: true});
        this.url = `${config.push.serverHost}:` + config.push.serverPort;
        // this.socket = io(this.url);
    }

    listen(eventName: string) {
        return new Observable(subscriber => {
            this.socket.on(eventName, data => {
                subscriber.next(data);
            });
        });
    }

    emit(eventName: string, data: any) {
        console.log(`starting CdPushController::emit()`);
        this.socket.emit(eventName, data);
    }

    // ////////////////////////////////////////////
    // public sendMessage(message) {
    //   this.socket.emit('new-message', message);
    // }

    // public getMessages = () => {
    //   return Observable.create((observer) => {
    //     this.socket.on('new-message', (message) => {
    //       observer.next(message);
    //     });
    //   });
    // }
}