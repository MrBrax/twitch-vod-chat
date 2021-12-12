import { TwitchPlayer } from '@/defs';
import EmbedPlayer from './base';

export default class EmbedTwitchPlayer extends EmbedPlayer {

    vod_id: string;
    player: TwitchPlayer | null = null;

    constructor(vod_id: string) {
        super();
        this.vod_id = vod_id;
    }

    setup() {

        const player_element = document.createElement('div');
        const video_container = document.getElementById('video_container');
        if(!video_container){
            console.error("No video container");
            return false;
        }
        video_container.appendChild(player_element);

        this.setStatusText('Set up Twitch embed player...');

        this.player = new window.Twitch.Player(player_element, {
            width: '100%',
            height: '100%',
            video: this.vod_id,
            autoplay: false,
            controls: false
        });

        console.log("Embed player created", this.player);

        console.log("Add event listeners");

        this.player.addEventListener(window.Twitch.Player.READY, () => {
            if(!this.vodplayer || !this.player) return;

            console.log("embed player ready");

            this.setStatusText('Embed Twitch player ready!');

            this.player.seek(0);
            this.player.pause();
            this.player.setMuted(false);

            setTimeout(() => {
                if(!this.player) return;
                this.player.seek(0);
                this.player.pause();
            }, 500);

            this.vodplayer.videoLoaded = true;
            // if (this.callbacks['ready']) {
            //     this.callbacks['ready']();
            // }
            this.emit("ready");

        });

        this.player.addEventListener(window.Twitch.Player.PLAY, () => {
            if(!this.vodplayer) return;
            console.log("embed player play");
            if (!this.vodplayer.isPlaying && this.player) {
                console.log("oops, player started without user wanting it");
                this.player.seek(0);
                this.player.pause();
                return;
            }
            this.callPause(false);
            this.emit("play");
        });

        this.player.addEventListener(window.Twitch.Player.PAUSE, () => {
            this.callPause(true);
            this.emit("pause");
        });

        /*
        this.embedPlayer.addEventListener("play", () => {
            
            console.log("seek in embed player");

            this.reset();

            // offset chat
            this.timeStart = Date.now() - ( this.embedPlayer.getCurrentTime() * 1000 );

        });

        this.embedPlayer.addEventListener("pause", () => {
            
            console.log("pause in embed player");

        });

        this.embedPlayer.addEventListener("playing", () => {
            
            console.log("seek2 in embed player");

            this.reset();

            // offset chat
            this.timeStart = Date.now() - ( this.embedPlayer.getCurrentTime() * 1000 );

        });
        */

    }

    play() {
        if (!this.player) return;
        this.player.play();
        // let 
    }

    pause() {
        if (!this.player) return false;
        this.player.pause();
        return true;
    }

    seek(seconds: number) {
        if (!this.player) return;
        this.player.seek(seconds);
    }

    getDuration() {
        if (!this.player) return null;
        return this.player.getDuration();
    }

    getCurrentTime() {
        if (!this.player) return null;
        return this.player.getCurrentTime();
    }

    get isPaused() {
        if (!this.player) return false;
        return this.player.isPaused();
    }

}