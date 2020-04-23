<template>
  <div id="app">
    <div id="player">

				<video id="video"></video>

				<div id="comments" v-bind:class="commentsClass" v-bind:style="commentsStyle">
					<!--<div class="comment">
						<span class="time">[00:00:00]</span>
						<span class="name">Username:</span>
						<span class="body">Body text</span>
					</div>
					-->
					<ChatMessage v-for="message in $root.vp.commentQueue" v-bind:message="message" v-bind:key="message.gid"></ChatMessage>
				</div>

				<div id="osd">SYNC NOT STARTED</div>

			</div>

			<div id="timeline" ref="timeline" @click="seek">
				<div id="timeline-seekbar" ref="seekbar" v-bind:style="{ width: ( $root.vp.videoPosition * 100 ) + '%' }"></div>
				<div id="timeline-text">Timeline</div>
				<div id="timeline-auto">{{ $root.vp.videoCurrentTime }}</div>
				<div id="timeline-markers">
					<div class="timeline-marker" v-for="(marker, id) in $root.vp.videoChapters" v-bind:key="id" v-bind:style="{ left: ( ( marker.time / $root.vp.vodLength ) * 100 ) + '%' }">
						{{ marker.label }}
					</div>
				</div>
			</div>

			<div id="controls">

				<div class="option-row">
					
					<div v-bind:class="{ 'option-group': true, 'ok': $root.vp.videoLoaded }" id="option-group-video">
						<div class="option-title">Video</div>
						<div class="option-content">
							<input type="file" id="inputVideo" accept="video/*" @change="loadVideo" /> or<br>
							<input type="password" placeholder="Client ID" v-model="$root.vp.settings.twitchClientId" />
							<input type="text" placeholder="VOD ID" ref="videoIdInput" style="width: 100px" />
							<button class="button" @click="loadOnline">load online</button>
						</div>
					</div>

					<div v-bind:class="{ 'option-group': true, 'ok': $root.vp.chatLoaded }" id="option-group-chat">
						<div class="option-title">Chat</div>
						<div class="option-content">
							<input type="file" id="inputChat" accept="application/json" @change="loadChat" />
							<p class="help-text">
								Chat logs may take a while to parse, don't worry.
							</p>
						</div>
					</div>

					<div class="option-group">
						<div class="option-content">
							<strong>Video:</strong> <span id="status-text-video">Waiting</span><br>
							<strong>Comments:</strong> <span id="status-text-comments">Waiting</span><br>
							<strong>FFZ:</strong> <span id="status-text-ffz">Waiting</span><br>
							<strong>BTTV Channel:</strong> <span id="status-text-bttv_channel">Waiting</span><br>
							<strong>BTTV Global:</strong> <span id="status-text-bttv_global">Waiting</span>
						</div>
					</div>

				</div>

				<div class="option-row">

					<div class="option-group">
						<div class="option-title">Chat offset in seconds</div>
						<div class="option-content">
							<p class="help-text">
								Offset from the video, if recording started too late.
								It will be set automatically based on how long the chat dump is
								and the video length, remember to set it to 0 if you want it that way.
							</p>
							<input id="optionOffset" value="0">
						</div>
					</div>

					<!--
					<div class="option-group">
						<div class="option-title">Chat timescale</div>
						<div class="option-content">
							<p class="help-text">
								1 is standard, 2 is twice as fast etc.
								Slow the captured video down with this amount to reduce live recording time
							</p>
							<input id="optionTimescale" value="1">
						</div>
					</div>
					-->

					<div class="option-group">
						<div class="option-title">Update frequency in ms</div>
						<div class="option-content">
							<p class="help-text">
								The lower the smoother. 16.67 - 60fps, 33.33 - 30fps.
								Missed ticks shouldn't matter, as the parser is dependent on system time.
							</p>
							<input id="optionTickDelay" value="50">
						</div>
					</div>

					<div class="option-group">
						<div class="option-title">Chat location</div>
						<div class="option-content">
							<!--
							<div class="button-group">
								<button class="button is-small" @click="alignChat('left')">Left side</button>
								<button class="button is-small" @click="alignChat('right')">Right side</button>
							</div>
							<div class="button-group">
								<button class="button is-small" @click="alignText('left')">Left text</button>
								<button class="button is-small" @click="alignText('right')">Right text</button>
							</div>-->
							<div>
								Chat align:
								<label><input type="radio" name="comments-align" v-model="$root.vp.settings.chatAlign" value="left"> Left</label>
								<label><input type="radio" name="comments-align" v-model="$root.vp.settings.chatAlign" value="right"> Right</label>
							</div>

							<div>
								Text align:
								<label><input type="radio" name="comments-textalign" v-model="$root.vp.settings.chatTextAlign" value="left"> Left</label>
								<label><input type="radio" name="comments-textalign" v-model="$root.vp.settings.chatTextAlign" value="right"> Right</label>
							</div>

							<hr>

							<label><input class="input-range" type="range" min="0" max="100" value="0" v-model="$root.vp.settings.chatTop"> Top</label>
							<label><input class="input-range" type="range" min="0" max="100" value="0" v-model="$root.vp.settings.chatBottom" style="direction: ltr"> Bottom</label>
							<label><input class="input-range" type="range" min="0" max="100" value="0" v-model="$root.vp.settings.chatWidth"> Width</label>
						
						</div>
					</div>

					<div class="option-group">
						<div class="option-title">Chat style</div>
						<div class="option-content">
							<select v-model="$root.vp.settings.chatStyle">
								<option value="has-gradient">Gradient</option>
								<option value="has-fill40">Fill 40%</option>
								<option value="has-fill80">Fill 80%</option>
								<option value="">None</option>
							</select>
							
							<!--
							<label><input class="input-range" type="range" min="0" max="100" value="70" v-model="$root.vp.chatBackgroundOpacity" style="width: 120px"> Opacity</label>
							-->
							<br>

							<label><input type="checkbox" checked="checked" v-model="$root.vp.settings.chatStroke"> Stroke + shadow</label><br>
							<label><input type="checkbox" checked="checked" v-model="$root.vp.settings.emotesEnabled"> Emotes</label><br>
							<label><input type="checkbox" checked="checked" v-model="$root.vp.settings.timestampsEnabled"> Timestamps</label><br>
							<label><input type="checkbox" checked="checked" v-model="$root.vp.settings.badgesEnabled"> Badges</label><br>
							<label><input type="checkbox" checked="checked" v-model="$root.vp.settings.smallEmotes"> Small emotes</label><br>
							<label><input type="checkbox" checked="checked" v-model="$root.vp.settings.showVODComments"> VOD comments</label>
						</div>
					</div>

				</div>

				<div class="option-group">
					<button class="button color-green" @click="play">Start</button>
					<button class="button" @click="apply">Apply</button>
					<button class="button" @click="fullscreen">Fullscreen</button>
					<button class="button" @click="saveSettings">Save settings</button>
					<button class="button" @click="resetSettings">Reset settings</button>
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
		loadOnline(){
			this.$root.vp.loadOnline( this.$refs.videoIdInput.value );
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
		},
		seek(ev){
			let percent = ev.clientX / timeline.clientWidth;
			this.$root.vp.seek( percent );
		},
		saveSettings(){
			this.$root.vp.saveSettings();
		},
		resetSettings(){
			this.$root.vp.resetSettings();
		}
	},
	computed: {
        videoPosition(){

			let vp = this.$root.vp;

			if( vp.embedPlayer ){
				return vp.embedPlayer.getCurrentTime() / vp.vodLength;
			}else if( vp.elements.video ){
				return vp.elements.video.currentTime / vp.vodLength;
			}else{
				return 0;
			}
            
		},
		commentsStyle(){
			return {
				'top': this.$root.vp.settings.chatTop + '%',
				'bottom': this.$root.vp.settings.chatBottom + '%',
				'width': this.$root.vp.settings.chatWidth + '%',
			}
		},
		commentsClass(){
			return {
				'align-left': this.$root.vp.settings.chatAlign == 'left',
				'align-right': this.$root.vp.settings.chatAlign == 'right',
				'text-left': this.$root.vp.settings.chatTextAlign == 'left',
				'text-right': this.$root.vp.settings.chatTextAlign == 'right',
				[this.$root.vp.settings.chatStyle]: true,
				'has-stroke': this.$root.vp.settings.chatStroke
			}
		},
		/*
		timelineText(){
			// console.log( "CURRENT TIME", this.$root.vp.videoCurrentTime );
			
			let vp = this.$root.vp;

			let seconds = 0;

			if( vp.embedPlayer ){
            	seconds = vp.embedPlayer.getCurrentTime();
			}else if( vp.elements.video && vp.elements.video.src ){
				seconds = vp.elements.video.currentTime;
			}
			
			let date = new Date(null);
			date.setSeconds( seconds );
			
			return date.toISOString().substr(11, 8);
			
		}
		*/
    }
}
</script>
