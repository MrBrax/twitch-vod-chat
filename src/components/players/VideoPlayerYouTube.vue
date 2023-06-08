<template>
    <div ref="player_element"></div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import type { YouTubePlayer } from "youtube-player/dist/types";

export default defineComponent({
    name: "VideoPlayerYouTube",
    emits: ["ready", "play", "pause", "seeked"],
    props: {
        id: {
            type: String,
            required: true
        },
    },
    setup() {
        // const video = ref<HTMLVideoElement>();
        // return { video };
    },
    data(): {
        videoWidth: number;
        videoHeight: number;
        youtubePlayer: YouTubePlayer | undefined;
        YT_PLAY: number;
        YT_PAUSE: number;
    } {
        return {
            // videoUrl: "",
            videoWidth: 1280,
            videoHeight: 720,
            youtubePlayer: undefined,
            YT_PLAY: 1,
            YT_PAUSE: 2,
        };
    },
    watch: {
        id(newId) {
            // this.videoUrl = newUrl;
            console.debug("VideoPlayerYouTube: id changed to", newId);
            this.setupPlayer();
        }
    },
    mounted() {
        console.debug("VideoPlayerYouTube: mounted", this.id);
        if (this.id) {
            this.setupPlayer();
        }
    },
    unmounted() {
        console.debug("VideoPlayerYouTube: unmounted", this.id);
        this.destroyPlayer();
    },
    methods: {
        setupPlayer() {
            const player_element = this.$refs.player_element as HTMLDivElement;

            /*
            this.twitchPlayer = new window.Twitch.Player(player_element, {
                width: "100%",
                height: "100%",
                video: this.id,
                autoplay: false,
                controls: false,
            });

            this.twitchPlayer.addEventListener(window.Twitch.Player.READY, () => {
                if (!this.twitchPlayer) return;
                console.log("embed player ready");

                // prevent autoplay
                this.twitchPlayer.seek(0);
                this.twitchPlayer.pause();
                this.twitchPlayer.setMuted(false);

                // prevent autoplay #2
                setTimeout(() => {
                    if (!this.twitchPlayer) return;
                    this.twitchPlayer.seek(0);
                    this.twitchPlayer.pause();
                }, 500);

                this.$emit("ready");
            });

            this.twitchPlayer.addEventListener(window.Twitch.Player.PLAY, () => {
                if (!this.twitchPlayer) return;
                console.log("embed player play");
                /*
                if (!this.vodplayer.isPlaying && this.player) {
                    console.log("oops, player started without user wanting it");
                    this.twitchPlayer.seek(0);
                    this.twitchPlayer.pause();
                    return;
                }
                *
                this.$emit("play");
            });

            this.twitchPlayer.addEventListener(window.Twitch.Player.PAUSE, () => {
                this.$emit("pause");
            });

            this.twitchPlayer.addEventListener(window.Twitch.Player.SEEK, () => {
                if (!this.twitchPlayer) return;
                this.$emit("seeked", this.twitchPlayer.getCurrentTime());
            });
            */

            // console.log("OnPlayerReady function");
            const onPlayerReady = (event: Event) => {
                if (!this.youtubePlayer) return;
                // this.setStatusText("YouTube Player ready!");
                console.log("youtube player ready", event);
                // this.isReady = true;
                // this.vodplayer.videoLoaded = true;
                // if (this.callbacks['ready']) {
                //     this.callbacks['ready']();
                // }
                this.$emit("ready");
            };

            // console.log("OnPlayerStateChange function");
            const onPlayerStateChange = (payload: number) => {
                console.log("youtube player state change", payload);
                if (payload == this.YT_PAUSE) {
                    // this.callPause(true); // paused
                    this.$emit("pause");
                } else if (payload == this.YT_PLAY) {
                    // this.callPause(true); // wait why
                    this.$emit("play");
                }
            };

            // console.log("OnError function");
            const onError = (event: Event) => {
                console.log("youtube player error", event);
            };

            console.log("Access YouTube API");

            this.youtubePlayer = undefined;

            this.youtubePlayer = new window.YT.Player(player_element, {
                width: "100%",
                height: "100%",
                videoId: this.id,
                events: {
                    // supplied event names are broken, why?
                    // 'ready': onPlayerReady,
                    // 'stateChange': onPlayerStateChange,
                    // 'error': onError,
                    onReady: onPlayerReady,
                    onStateChange: onPlayerStateChange,
                    onError: onError,
                } as never,
            }) as YouTubePlayer;

        },
        destroyPlayer() {
            if (!this.youtubePlayer) return;
            this.youtubePlayer.destroy();
            this.youtubePlayer = undefined;
        },
        async play(): Promise<void> {
            if (!this.youtubePlayer) {
                console.error("VideoPlayerHTML5: video is not ready");
                return;
            }
            // console.debug("VideoPlayerHTML5: play");
            this.youtubePlayer.playVideo();
        },
        async pause(): Promise<void> {
            if (!this.youtubePlayer) {
                console.error("VideoPlayerHTML5: video is not ready");
                return;
            }
            // console.debug("VideoPlayerHTML5: pause");
            this.youtubePlayer.pauseVideo();
        },
        async getDuration(): Promise<number | undefined> {
            if (!this.youtubePlayer) {
                console.error("VideoPlayerHTML5: video is not ready");
                return;
            }
            // console.debug("VideoPlayerHTML5: getDuration");
            return await this.youtubePlayer.getDuration();
        },
        async isPaused(): Promise<boolean | undefined> {
            if (!this.youtubePlayer) {
                console.error("VideoPlayerHTML5: video is not ready");
                return;
            }
            // console.debug("VideoPlayerHTML5: isPaused");
            return await this.youtubePlayer.getPlayerState() == this.YT_PAUSE;
        },
        async getCurrentTime(): Promise<number | undefined> {
            if (!this.youtubePlayer) {
                console.error("VideoPlayerHTML5: video is not ready");
                return;
            }
            // console.debug("VideoPlayerHTML5: getCurrentTime");
            return await this.youtubePlayer.getCurrentTime();
        },
        async seek(time: number): Promise<void> {
            if (!this.youtubePlayer) {
                console.error("VideoPlayerHTML5: video is not ready");
                return;
            }
            // console.debug("VideoPlayerHTML5: seek");
            this.youtubePlayer.seekTo(time, true);
        },
    }
});
</script>
