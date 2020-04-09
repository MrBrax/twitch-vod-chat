<template>
  <div id="app">
    <div id="player">

				<video id="video"></video>

				<div id="comments" class="left has-gradient has-stroke">
					<!--<div class="comment">
						<span class="time">[00:00:00]</span>
						<span class="name">Username:</span>
						<span class="body">Body text</span>
					</div>
					-->
					<ChatMessage v-for="(message, id) in $root.vp.commentQueue" v-bind:message="message" v-bind:key="id"></ChatMessage>
				</div>

				<div id="osd">SYNC NOT STARTED</div>

			</div>

			<div id="timeline">
				00:00:00
			</div>

			<div id="controls">

				<div class="option-row">
					
					<div class="option-group" id="option-group-video">
						<h2>Video</h2>
						<input type="file" id="inputVideo" accept="video/*" @change="loadVideo" />
						<p class="help-text">
							These files will not be uploaded to anywhere, they're played on your device locally.
						</p>
					</div>

					<div class="option-group" id="option-group-chat">
						<h2>Chat</h2>
						<input type="file" id="inputChat" accept="application/json" @change="loadChat" />
						<p class="help-text">
							Chat logs may take a while to parse, don't worry.
						</p>
					</div>

					<div class="option-group">
						<strong>Video:</strong> <span id="status-text-video">Waiting</span><br>
						<strong>Comments:</strong> <span id="status-text-comments">Waiting</span><br>
						<strong>FFZ:</strong> <span id="status-text-ffz">Waiting</span><br>
						<strong>BTTV Channel:</strong> <span id="status-text-bttv_channel">Waiting</span><br>
						<strong>BTTV Global:</strong> <span id="status-text-bttv_global">Waiting</span>
					</div>

				</div>

				<div class="option-row">

					<div class="option-group">
						<h2>Chat offset in seconds</h2>
						<p class="help-text">
							Offset from the video, if recording started too late.
							It will be set automatically based on how long the chat dump is
							and the video length, remember to set it to 0 if you want it that way.
						</p>
						<input id="optionOffset" value="0">
					</div>

					<div class="option-group">
						<h2>Chat timescale</h2>
						<p class="help-text">
							1 is standard, 2 is twice as fast etc.
							Slow the captured video down with this amount to reduce live recording time
						</p>
						<input id="optionTimescale" value="1">
					</div>

					<div class="option-group">
						<h2>Update frequency in ms</h2>
						<p class="help-text">
							The lower the smoother. 16.67 - 60fps, 33.33 - 30fps.
							Missed ticks shouldn't matter, as the parser is dependent on system time.
						</p>
						<input id="optionTickDelay" value="50">
					</div>

					<div class="option-group">
						<h2>Chat location</h2>
						<div class="button-group">
							<button class="button is-small" @click="alignChat('left')">Left side</button>
							<button class="button is-small" @click="alignChat('right')">Right side</button>
						</div>
						<div class="button-group">
							<button class="button is-small" @click="alignText('left')">Left text</button>
							<button class="button is-small" @click="alignText('right')">Right text</button>
						</div>
						<label><input class="input-range" type="range" min="0" max="100" value="0" v-model="$root.vp.chatTop"> Top</label>
						<label><input class="input-range" type="range" min="0" max="100" value="0" v-model="$root.vp.chatBottom"> Bottom</label>
						<label><input class="input-range" type="range" min="0" max="100" value="0" v-model="$root.vp.chatWidth"> Width</label>
					</div>

					<div class="option-group">
						<h2>Chat style</h2>
						<select id="optionChatStyle">
							<option value="has-gradient">Gradient</option>
							<option value="has-fill">Fill</option>
							<option value="">None</option>
						</select><br>

						<label><input type="checkbox" checked="checked" v-model="$root.vp.chatStroke"> Stroke</label><br>
						<label><input type="checkbox" checked="checked" v-model="$root.vp.emotesEnabled"> Emotes</label><br>
						<label><input type="checkbox" checked="checked" v-model="$root.vp.timestampsEnabled"> Timestamps</label><br>
						<label><input type="checkbox" checked="checked" v-model="$root.vp.badgesEnabled"> Badges</label>

					</div>

				</div>

				<div class="option-group">
					<button class="button color-green" @click="play">Start</button>
					<button class="button" @click="apply">Apply</button>
					<button class="button" @click="fullscreen">Fullscreen</button>
				</div>

			</div>
  </div>
</template>

<script>

import HelloWorld from './components/HelloWorld.vue'

import ChatMessage from './components/ChatMessage.vue'

export default {
	name: 'App',
	components: {
		ChatMessage
	},
	methods: {
		loadVideo(event){
			this.$root.vp.load(event, 'video');
			event.preventDefault();
			return false;
		},
		loadChat(event){
			this.$root.vp.load(event, 'chat');
			event.preventDefault();
			return false;
		},
		alignChat(dir){
			this.$root.vp.alignChat(dir);
		},
		alignText(dir){
			this.$root.vp.alignText(dir);
		},
		play(){
			this.$root.vp.play();
		},
		apply(){
			this.$root.vp.apply();
		},
		fullscreen(){
			this.$root.vp.fullscreen();
	  	}
  	}
}
</script>
