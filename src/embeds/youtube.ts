import EmbedPlayer from './base';
import { YouTubePlayer } from 'youtube-player/dist/types';

export default class EmbedYouTubePlayer extends EmbedPlayer {

    youtube_id: string;
    player: YouTubePlayer | null;

    YT_PLAY: number = 1;
    YT_PAUSE: number = 2;

    isReady: boolean;

    constructor(youtube_id: string) {
        super();
        this.youtube_id = youtube_id;
        console.log(`Created YouTube player with id ${youtube_id}`);
    }

    setup() {

        this.setStatusText('Set up YouTube player...');

        console.log("OnPlayerReady function");
        let onPlayerReady = (event: any) => {
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
        let onPlayerStateChange = (event: any) => {
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
        let onError = (event: any) => {
            console.log("error", event);
        }

        console.log("Create player div");
        let player_element = document.createElement('div');
        let video_container = document.getElementById('video_container');
        if(!video_container){
            console.error("No video container");
            return false;
        }
        video_container.appendChild(player_element);

        console.log("Access YouTube API");
        
        this.player = null;
        
        this.player = new (<any>window).YT.Player(player_element, {
            width: '1280',
            height: '720',
            videoId: this.youtube_id,
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onError,
            }
        });

    }

    play() {
        this.player.playVideo();
    }

    pause(){
        this.player.pauseVideo();
        return true;
    }

    seek(seconds: number) {
        this.player.seekTo(seconds, false);
    }

    getDuration() {
        if(!this.isReady) return;
        return this.player.getDuration();
    }

    getCurrentTime() {
        if(!this.isReady) return;
        return this.player.getCurrentTime();
    }

    get isPaused() {
        return this.player.getPlayerState() == 2;
    }

}