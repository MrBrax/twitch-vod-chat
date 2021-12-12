import EmbedPlayer from './base';
import { YouTubePlayer } from 'youtube-player/dist/types';

export default class EmbedYouTubePlayer extends EmbedPlayer {

    youtube_id: string;
    player: YouTubePlayer | null;

    YT_PLAY = 1;
    YT_PAUSE = 2;

    isReady: boolean;

    constructor(youtube_id: string) {
        super();
        this.youtube_id = youtube_id;
        this.player = null;
        this.isReady = false;
        console.log(`Created YouTube player with id ${youtube_id}`);
    }

    setup() {

        this.setStatusText('Set up YouTube player...');

        console.log("OnPlayerReady function");
        const onPlayerReady = (event: any) => {
            if(!this.vodplayer) return;
            this.setStatusText('YouTube Player ready!');
            console.log("player ready", event);
            this.isReady = true;
            this.vodplayer.videoLoaded = true;
            if (this.callbacks['ready']) {
                this.callbacks['ready']();
            }
            this.emit("ready");
        }

        console.log("OnPlayerStateChange function");
        const onPlayerStateChange = (event: any) => {
            console.log("state change", event);
            if (event == this.YT_PAUSE){
                this.callPause(true); // paused
                this.emit("pause");
            }
            if (event == this.YT_PLAY){
                this.callPause(true); // paused
                this.emit("play");
            }
        }

        console.log("OnError function");
        const onError = (event: any) => {
            console.log("error", event);
        }

        console.log("Create player div");
        const player_element = document.createElement('div');
        const video_container = document.getElementById('video_container');
        if(!video_container){
            console.error("No video container");
            return false;
        }
        video_container.appendChild(player_element);

        console.log("Access YouTube API");
        
        this.player = null;
        
        this.player = new (window as any).YT.Player(player_element, {
            width: '1280',
            height: '720',
            videoId: this.youtube_id,
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onError,
            }
        }) as YouTubePlayer;

    }

    play() {
        if (!this.player) return;
        this.player.playVideo();
    }

    pause() {
        if (!this.player) return false;
        this.player.pauseVideo();
        return true;
    }

    seek(seconds: number) {
        if (!this.player) return;
        this.player.seekTo(seconds, false);
    }

    getDuration() {
        if(!this.isReady || !this.player) return undefined;
        return this.player.getDuration();
    }

    getCurrentTime() {
        if(!this.isReady || !this.player) return undefined;
        return this.player.getCurrentTime();
    }

    get isPaused() {
        if(!this.isReady || !this.player) return undefined;
        return this.player.getPlayerState() == 2;
    }

}