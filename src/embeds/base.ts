import VODPlayer from '../vodplayer';

export default class EmbedPlayer {

    vodplayer: VODPlayer | null;
    callbacks: any;
    manualPause: boolean;

    constructor() {
        this.vodplayer = null;
        this.manualPause = false;
        this.callbacks = {};
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