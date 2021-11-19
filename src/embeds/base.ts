import VODPlayer from '../vodplayer';

export default class EmbedPlayer {

    vodplayer: VODPlayer | null;
    callbacks: any;
    manualPause: boolean;
    listeners: Record<string, Function>;

    constructor() {
        this.vodplayer = null;
        this.manualPause = false;
        this.callbacks = {};
        this.listeners = {};
    }

    emit(method: string, payload: any = null) {
        const callback = this.listeners[method];
        if(typeof callback === 'function'){
            callback(payload);
        }
    }

    addEventListener(method: string, callback: Function) {
        this.listeners[method] = callback;
    }

    removeEventListener(method: string) {
        delete this.listeners[method];
    }

    html() {
        return '';
    }

    setup() {
        let e = document.getElementById("video_container");
        if(e){
            e.innerHTML = this.html();
            console.log("Set up embed player");
        }
    }

    play() {
        alert('no play implemented');
    }

    pause(): boolean {
        alert('no pause implemented');
        return false;
    }

    seek(seconds: number) {
        alert('no seek implemented');
    }

    getDuration() {
        alert('no duration implemented');
        return 0;
    }

    getCurrentTime() {
        alert('no current time implemented');
        return 0;
    }

    setCallback(key: string, callback: any) {
        this.callbacks[key] = callback;
    }

    callPause(state: boolean) {
        console.log("call pause", state);
        this.manualPause = state;
    }

    setStatusText( text: string ){
        this.vodplayer.status_video = text;
    }

    get isPaused() {
        return false;
    }

}