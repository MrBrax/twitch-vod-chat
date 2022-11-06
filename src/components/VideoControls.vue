<template>
    <transition name="fade">
        <div :class="{ 'video-controls': true, minimal: store.minimal }" v-if="!store.minimal || minimalShow">
            <div id="timeline" ref="timeline" @click="seek" v-if="videoPosition">
                <div id="timeline-seekbar" ref="seekbar" v-bind:style="{ width: videoPosition * 100 + '%' }">
                    <div class="timeline-seekbar-time">{{ formattedVideoTime }}</div>
                </div>
                <!--<div id="timeline-auto">{{ vp.videoCurrentTime }}</div>-->
            </div>

            <div class="video-controls-buttons">
                <div class="video-controls-buttons-group" v-if="!isReady">
                    <button class="pb-button is-submit" @click="$emit('startPlayback')" v-if="!isPlaying" :disabled="!canStartPlayback">Start playback</button>
                </div>
                <div class="video-controls-buttons-group" v-else>
                    <button class="pb-button" @click="$emit('togglePause')">
                        {{ isPaused ? "▶" : "⏸" }}
                    </button>
                    <button class="pb-button" @click="$emit('fullscreen')">Fullscreen</button>
                    <button class="pb-button" @click="$emit('resetChat')">Reset chat</button>
                </div>
                <div class="video-controls-buttons-group" v-if="store.minimal">
                    <label><input type="checkbox" name="comments-overlay" v-model="store.settings.chatOverlay" /> Overlay</label>
                    <label><input type="checkbox" name="ultrawide" v-model="store.settings.ultrawide" /> Ultrawide</label>
                    <label><input type="checkbox" name="minimal" v-model="store.minimal" /> Minimal</label>
                </div>
                <!--<div class="video-controls-text">{{ vp.playback_text }}</div>-->
            </div>
        </div>
    </transition>
</template>

<script lang="ts">
import { useStore } from "@/store";
import { defineComponent } from "vue";

export default defineComponent({
    name: "VideoControls",
    emits: ["startPlayback", "togglePause", "fullscreen", "resetChat", "toggleMinimal", "seek"],
    props: {
        videoPosition: Number,
        videoDuration: Number,
        videoCurrentTime: Number,
        isPlaying: Boolean,
        isPaused: Boolean,
        isReady: Boolean,
        minimalShow: Boolean,
        canStartPlayback: Boolean,
    },
    setup() {
        const store = useStore();
        return { store };
    },
    mounted() {
        // this.$el.addEventListener("mousemove", (ev: MouseEvent) => {
        //     console.log("mouse move", ev);
        // });
    },
    methods: {
        async seek(ev: MouseEvent) {
            const timeline = this.$refs.timeline as HTMLDivElement;
            let duration = this.videoDuration || 0;
            let rect = timeline.getBoundingClientRect(); // @todo: what
            let percent = (ev.clientX - rect.left) / timeline.clientWidth;
            let seconds = Math.round(duration * percent);
            console.debug("seek", duration, percent, seconds);
            this.$emit('seek', seconds);
        },
    },
    computed: {
        formattedVideoTime(): string {
            if (!this.videoCurrentTime) return "";
            const hours = Math.floor(this.videoCurrentTime / 3600);
            const minutes = Math.floor((this.videoCurrentTime % 3600) / 60);
            const seconds = Math.floor(this.videoCurrentTime % 60);
            const _hours = hours < 10 ? "0" + hours : hours;
            const _minutes = minutes < 10 ? "0" + minutes : minutes;
            const _seconds = seconds < 10 ? "0" + seconds : seconds;
            return `${_hours}:${_minutes}:${_seconds}`;
        },
    },
});
</script>
