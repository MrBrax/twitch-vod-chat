<template>
    <video
        :src="url"
        :width="videoWidth"
        :height="videoHeight"
        ref="video"
    ></video>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";

export default defineComponent({
    name: "VideoPlayerHTML5",
    emits: ["ready", "play", "pause", "seeked"],
    props: {
        url: {
            type: String,
            required: true
        },
    },
    setup() {
        const video = ref<HTMLVideoElement>();
        return { video };
    },
    data() {
        return {
            // videoUrl: "",
            videoWidth: 1280,
            videoHeight: 720,
        };
    },
    watch: {
        url(newUrl) {
            // this.videoUrl = newUrl;
            // console.debug("VideoPlayerHTML5: url changed to", newUrl);
        }
    },
    mounted() {
        // console.debug("VideoPlayerHTML5: mounted");

        const video = this.$refs.video as HTMLVideoElement;
        video.addEventListener("loadedmetadata", () => {
            console.debug("VideoPlayerHTML5: canplay");
            this.$emit("ready");
        });

        video.addEventListener("play", () => {
            console.debug("VideoPlayerHTML5: play");
            this.$emit("play");
        });

        video.addEventListener("pause", () => {
            console.debug("VideoPlayerHTML5: pause");
            this.$emit("pause");
        });

        video.addEventListener("seeked", async () => {
            console.debug("VideoPlayerHTML5: seeked");
            this.$emit("seeked", await this.getCurrentTime());
        });

    },
    methods: {
        async play(): Promise<void> {
            if (!this.video) {
                console.error("VideoPlayerHTML5: video is not ready");
                return;
            }
            // console.debug("VideoPlayerHTML5: play");
            this.video.play();
        },
        async pause(): Promise<void> {
            if (!this.video) {
                console.error("VideoPlayerHTML5: video is not ready");
                return;
            }
            // console.debug("VideoPlayerHTML5: pause");
            this.video.pause();
        },
        async getDuration(): Promise<number | undefined> {
            if (!this.video) {
                console.error("VideoPlayerHTML5: video is not ready");
                return;
            }
            // console.debug("VideoPlayerHTML5: getDuration");
            return this.video.duration;
        },
        async isPaused(): Promise<boolean | undefined> {
            if (!this.video) {
                console.error("VideoPlayerHTML5: video is not ready");
                return;
            }
            // console.debug("VideoPlayerHTML5: isPaused");
            return this.video.paused;
        },
        async getCurrentTime(): Promise<number | undefined> {
            if (!this.video) {
                console.error("VideoPlayerHTML5: video is not ready");
                return;
            }
            // console.debug("VideoPlayerHTML5: getCurrentTime");
            return this.video.currentTime;
        },
        async seek(time: number): Promise<void> {
            if (!this.video) {
                console.error("VideoPlayerHTML5: video is not ready");
                return;
            }
            console.debug(`VideoPlayerHTML5: seek to ${time}`);
            this.video.currentTime = time;
        },
    }
});
</script>
