import EmbedPlayer from "./base";

export default class EmbedVideoPlayer extends EmbedPlayer {
    player: HTMLVideoElement | null;
    video_path: string;
    isReady: boolean;

    constructor(video_path: string) {
        super();
        this.player = null;
        this.video_path = video_path;
        this.isReady = false;
    }

    setup() {
        this.setStatusText("Set up HTML5 video player...");

        if (!this.vodplayer) {
            console.error("No vodplayer assigned");
            return false;
        }

        this.player = document.createElement("video");
        const video_container = document.getElementById("video_container");
        if (!video_container) {
            console.error("No video container (html5)");
            return false;
        }
        video_container.appendChild(this.player);

        this.player.src = this.video_path;
        this.player.width = 1280;
        this.player.height = 720;
        this.manualPause = this.player.paused;

        this.player.addEventListener("canplay", () => {
            if (this.isReady || !this.vodplayer) return;
            console.log("html5 video player ready");
            this.setStatusText("HTML5 video player ready!");
            this.vodplayer.videoLoaded = true;
            this.emit("ready", true);
            // if (this.callbacks['ready']) {
            //     this.callbacks['ready']();
            // }
            this.isReady = true;
        });

        this.player.addEventListener("play", () => {
            this.callPause(false);
            this.emit("play", true);
        });

        this.player.addEventListener("pause", () => {
            this.callPause(true);
            this.emit("pause", true);
        });

        this.player.addEventListener("seeked", (ev: Event) => {
            /*
            if (this.callbacks['seeked']) {
                this.callbacks['seeked']();
            }*/
            console.debug("html5 player seeked", ev);
            this.emit("seeked", this.getCurrentTime());
        });
    }

    play() {
        if (!this.player) return;
        this.player.play();
    }

    pause() {
        if (!this.player) return false;
        this.player.pause();
        return true;
    }

    seek(seconds: number) {
        if (!this.player) return;
        this.player.currentTime = seconds;
    }

    getDuration() {
        if (!this.player) return 0;
        return this.player.duration;
    }

    getCurrentTime() {
        if (!this.player) return 0;
        return this.player.currentTime;
    }

    get isPaused() {
        if (!this.player) return false;
        return this.player.paused;
    }
}
