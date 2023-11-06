<template>
	<transition name="fade">
		<div class="video-controls" :class="{ minimal: store.minimal }" v-if="!store.minimal || minimalShow">
			<div id="timeline" ref="timeline" @click="seek" v-if="videoPosition"
				@mouseover="isHoveringTimeline = true"
				@mouseleave="isHoveringTimeline = false"
				@mousemove="updateHoverTime"
				>
				<div id="timeline-seekbar" ref="seekbar" v-bind:style="{ width: videoPosition * 100 + '%' }">
					<div class="timeline-seekbar-time">{{ formattedVideoTime }}</div>
				</div>
			</div>
			<div class="timeline-hover" v-if="isHoveringTimeline" v-bind:style="{ left: hoverX + 'px' }">
				<div class="timeline-hover-time">{{ hoverTime }}</div>
			</div>

			<div class="video-controls-buttons">
				<div class="video-controls-buttons-group" v-if="!isReady">
					<button class="pb-button is-submit" @click="$emit('startPlayback')" v-if="!isPlaying"
						:disabled="!canStartPlayback">Start playback</button>
				</div>
				<div class="video-controls-buttons-group" v-else>
					<button class="pb-button" @click="seekRelative(-10)">-10s</button>
					<button class="pb-button" @click="$emit('togglePause')">
						{{ isPaused ? "Play" : "Pause" }}
					</button>
					<button class="pb-button" @click="seekRelative(10)">+10s</button>
					<button class="pb-button" @click="$emit('fullscreen')">Fullscreen</button>
					<button class="pb-button" @click="$emit('resetChat')">Reset chat</button>
				</div>
				<div class="video-controls-buttons-group" v-if="store.minimal">
					<label><input type="checkbox" name="comments-overlay" v-model="store.settings.chatOverlay" />
						Overlay</label>
					<label><input type="checkbox" name="ultrawide" v-model="store.settings.ultrawide" /> Ultrawide</label>
					<label><input type="checkbox" name="minimal" v-model="store.minimal" /> Minimal</label>
				</div>
				<!--<div class="video-controls-text">{{ vp.playback_text }}</div>-->
			</div>
		</div>
	</transition>
</template>

<script lang="ts">
import { store } from "@/store";
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
	data() {
		return {
			isHoveringTimeline: false,
			hoverTime: "",
			hoverX: 0,
		};
	},
	setup() {
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
		seekRelative(seconds: number) {
			if (!this.videoCurrentTime) return;
			this.$emit('seek', this.videoCurrentTime + seconds);
		},
		updateHoverTime(ev: MouseEvent) {
			const timeline = this.$refs.timeline as HTMLDivElement;
			let duration = this.videoDuration || 0;
			let rect = timeline.getBoundingClientRect(); // @todo: what
			let percent = (ev.clientX - rect.left) / timeline.clientWidth;
			let seconds = Math.round(duration * percent);
			this.hoverTime = this.formatTime(seconds);
			this.hoverX = ev.clientX - rect.left;
		},
		formatTime(seconds: number): string {
			const hours = Math.floor(seconds / 3600);
			const minutes = Math.floor((seconds % 3600) / 60);
			const _seconds = Math.floor(seconds % 60);
			const _hours = hours < 10 ? "0" + hours : hours;
			const _minutes = minutes < 10 ? "0" + minutes : minutes;
			const _seconds2 = _seconds < 10 ? "0" + _seconds : _seconds;
			return `${_hours}:${_minutes}:${_seconds2}`;
		},
	},
	computed: {
		formattedVideoTime(): string {
			if (!this.videoCurrentTime) return "";
			return this.formatTime(this.videoCurrentTime);			
		},
	},
});
</script>

<style lang="scss" scoped>
#timeline {
	position: relative;
	overflow: hidden;
	height: 24px;
	font-size: 14px;
	font-weight: 700;
	// width: $width;
	width: 100%;
	background: #222;
	border-bottom: 1px solid #333;
	color: #fff;
	cursor: pointer;
}

#timeline-text {
	position: absolute;
	top: 0px;
	left: 0px;
	color: #fff;
	padding: 4px;
}

#timeline-seekbar {
	position: absolute;
	top: 0px;
	left: 0px;
	width: 50%;
	background: linear-gradient(#ad2020, #622);
	height: 24px;
	transition: width .5s ease;
}

.timeline-seekbar-time {
	text-align: right;
	color: #fff;
	font-size: 90%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	padding-right: 4px;
	text-shadow: 0 1px 2px rgba(0, 0, 0, .6);
}

#timeline-markers {
	position: relative;
	// width: $width;
	width: 100%;
	// height: 16px;
	pointer-events: none;
}

.timeline-marker {
	position: absolute;
	top: 0px;
	left: 0px;
	height: 16px;
	padding-left: 2px;
	border-left: 1px solid #555;
	font-family: 'Roboto Condensed';
	font-weight: 400;
	color: #ccc;
}

.timeline-hover {
	position: absolute;
	top: -25px;
	left: 0px;
	transform: translateX(-50%);
	background-color: rgba(0, 0, 0, .8);
	color: #fff;
	padding: 4px 8px;
	font-size: 0.9em;
	font-weight: 700;
	border-radius: 5px;
	pointer-events: none;
}


.video-controls {
	background-color: #151515;
	color: #aaa;

	position: relative;

	&.minimal {
		position: absolute;
		bottom: 0px;
		left: 0px;
		right: 0px;
	}

	label {
		padding: 0 0.5em;
	}
}

.video-controls-buttons {
	display: flex;
	align-items: center;
	padding: 4px;
	gap: 4px;
}

.video-controls-buttons-group {
	display: flex;
	align-items: center;
	gap: 4px;
}

.video-controls-text {
	padding-left: 5px;
	font-size: 1.3em;
}


.pb-button {
	font-family: inherit;
	font-size: 1.2em;
	padding: 3px 10px;
	background-color: #333;
	color: #fff;
	border: 1px solid #222;
	cursor: pointer;

	&:hover {
		background-color: #555;
	}

	&.is-submit {
		background-color: #219c21;
	}

	&:disabled {
		background-color: #6f6f6f;
		color: #acacac;
		border-color: #444;
		cursor: not-allowed;

		&:hover {
			background-color: #6f6f6f;
		}
	}
}</style>