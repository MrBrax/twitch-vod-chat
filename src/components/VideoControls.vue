<template>
    <div :class="{ 'video-controls': true, minimal: minimal }" v-if="vp">
        <div id="timeline" ref="timeline" @click="seek">
            <div id="timeline-seekbar" ref="seekbar" v-bind:style="{ width: vp.videoPosition * 100 + '%' }"></div>
            <!--<div id="timeline-auto">{{ vp.videoCurrentTime }}</div>-->
        </div>

        <div class="video-controls-buttons">
            <div class="video-controls-buttons-group" v-if="!vp.isReady">
                <button class="pb-button is-submit" @click="startPlayback" v-if="!vp.isPlaying">Start playback</button>
            </div>
            <div class="video-controls-buttons-group" v-else>
                <button class="pb-button" @click="togglePause">
                    {{ vp?.embedPlayer?.isPaused ? "▶" : "⏸" }}
                </button>
                <button class="pb-button" @click="fullscreen">Fullscreen</button>
                <button class="pb-button" @click="resetChat">Reset chat</button>
            </div>
            <div class="video-controls-buttons-group" v-if="vp.minimal">
                <label><input type="checkbox" name="comments-overlay" v-model="vp.settings.chatOverlay" /> Overlay</label>
                <label><input type="checkbox" name="ultrawide" v-model="vp.settings.ultrawide" /> Ultrawide</label>
                <label><input type="checkbox" name="minimal" v-model="vp.minimal" /> Minimal</label>
            </div>
            <div class="video-controls-text">{{ vp.playback_text }}</div>
        </div>
    </div>
</template>

<script lang="ts">
import VODPlayer from "@/vodplayer";
import { defineComponent } from "@vue/runtime-core";

export default defineComponent({
    name: "VideoControls",
    props: {
        vp: Object as () => VODPlayer,
        minimal: Boolean,
    },
    mounted() {
        // this.$el.addEventListener("mousemove", (ev: MouseEvent) => {
        //     console.log("mouse move", ev);
        // });
    },
    methods: {
        fullscreen() {
            if (!this.vp) return;
            this.vp.fullscreen();
        },
        seek(ev: MouseEvent) {
            if (!this.vp) return;
            if (!this.vp.embedPlayer) {
                console.error("trying to seek from gui with no embed player");
                return false;
            }
            const timeline = this.$refs.timeline as HTMLDivElement;
            let duration = this.vp.embedPlayer.getDuration() || 0;
            let rect = timeline.getBoundingClientRect(); // @todo: what
            let percent = (ev.clientX - rect.left) / timeline.clientWidth;
            let seconds = Math.round(duration * percent);
            this.vp.seek(seconds);
        },
        startPlayback() {
            if (!this.vp) return;
            this.vp.startPlayback();
        },
        togglePause() {
            if (!this.vp) return;
            this.vp.togglePause();
        },
        resetChat() {
            if (!this.vp) return;
            this.vp.reset();
        },
    },
});
</script>
