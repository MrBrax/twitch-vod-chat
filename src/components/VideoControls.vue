<template>
    <div :class="{ 'video-controls': true, minimal: minimal }">
        <div id="timeline" ref="timeline" @click="seek" v-if="videoPosition">
            <div id="timeline-seekbar" ref="seekbar" v-bind:style="{ width: videoPosition * 100 + '%' }"></div>
            <!--<div id="timeline-auto">{{ vp.videoCurrentTime }}</div>-->
        </div>

        <div class="video-controls-buttons">
            <div class="video-controls-buttons-group" v-if="!isReady">
                <button class="pb-button is-submit" @click="$emit('startPlayback')" v-if="!isPlaying">Start playback</button>
            </div>
            <div class="video-controls-buttons-group" v-else>
                <button class="pb-button" @click="$emit('togglePause')">
                    {{ isPaused ? "▶" : "⏸" }}
                </button>
                <button class="pb-button" @click="$emit('fullscreen')">Fullscreen</button>
                <button class="pb-button" @click="$emit('resetChat')">Reset chat</button>
            </div>
            <div class="video-controls-buttons-group" v-if="minimal">
                <label><input type="checkbox" name="comments-overlay" v-model="store.settings.chatOverlay" /> Overlay</label>
                <label><input type="checkbox" name="ultrawide" v-model="store.settings.ultrawide" /> Ultrawide</label>
                <label><input type="checkbox" name="minimal" @click="$emit('toggleMinimal')" /> Minimal</label>
            </div>
            <!--<div class="video-controls-text">{{ vp.playback_text }}</div>-->
        </div>
    </div>
</template>

<script lang="ts">
import { useStore } from "@/store";
import { defineComponent } from "@vue/runtime-core";

export default defineComponent({
    name: "VideoControls",
    emits: ["startPlayback", "togglePause", "fullscreen", "resetChat", "toggleMinimal", "seek"],
    props: {
        minimal: Boolean,
        videoPosition: Number,
        videoDuration: Number,
        isPlaying: Boolean,
        isPaused: Boolean,
        isReady: Boolean,
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
            this.$emit('seek', seconds);
        },
    },
});
</script>
