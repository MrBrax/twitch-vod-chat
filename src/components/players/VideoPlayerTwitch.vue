<template>
    <div ref="player_element"></div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { TwitchPlayer } from "@/defs";

export default defineComponent({
    name: "VideoPlayerTwitch",
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
        twitchPlayer: TwitchPlayer | undefined;
    } {
        return {
            // videoUrl: "",
            videoWidth: 1280,
            videoHeight: 720,
            twitchPlayer: undefined,
        };
    },
    watch: {
        id(newId) {
            // this.videoUrl = newUrl;
            console.debug("VideoPlayerTwitch: id changed to", newId);
            this.setupPlayer();
        }
    },
    mounted() {

    },
    methods: {
        setupPlayer() {
            const player_element = this.$refs.player_element as HTMLDivElement;

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
                */
                this.$emit("play");
            });

            this.twitchPlayer.addEventListener(window.Twitch.Player.PAUSE, () => {
                this.$emit("pause");
            });

            this.twitchPlayer.addEventListener(window.Twitch.Player.SEEK, () => {
                if (!this.twitchPlayer) return;
                this.$emit("seeked", this.twitchPlayer.getCurrentTime());
            });

        },
        async play(): Promise<void> {
            if (!this.twitchPlayer) {
                console.error("VideoPlayerHTML5: video is not ready");
                return;
            }
            // console.debug("VideoPlayerHTML5: play");
            this.twitchPlayer.play();
        },
        async pause(): Promise<void> {
            if (!this.twitchPlayer) {
                console.error("VideoPlayerHTML5: video is not ready");
                return;
            }
            // console.debug("VideoPlayerHTML5: pause");
            this.twitchPlayer.pause();
        },
        async getDuration(): Promise<number | undefined> {
            if (!this.twitchPlayer) {
                console.error("VideoPlayerHTML5: video is not ready");
                return;
            }
            // console.debug("VideoPlayerHTML5: getDuration");
            return this.twitchPlayer.getDuration();
        },
        async isPaused(): Promise<boolean | undefined> {
            if (!this.twitchPlayer) {
                console.error("VideoPlayerHTML5: video is not ready");
                return;
            }
            // console.debug("VideoPlayerHTML5: isPaused");
            return this.twitchPlayer.isPaused();
        },
        async getCurrentTime(): Promise<number | undefined> {
            if (!this.twitchPlayer) {
                console.error("VideoPlayerHTML5: video is not ready");
                return;
            }
            // console.debug("VideoPlayerHTML5: getCurrentTime");
            return this.twitchPlayer.getCurrentTime();
        },
        async seek(time: number): Promise<void> {
            if (!this.twitchPlayer) {
                console.error("VideoPlayerHTML5: video is not ready");
                return;
            }
            // console.debug("VideoPlayerHTML5: seek");
            this.twitchPlayer.seek(time);
        },
    }
});
</script>
