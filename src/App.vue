<template>
	<div id="app">
    	<div id="player">

			<div id="video_container"></div>

			<div v-if="!$root.vp.videoLoaded" class="meme-bg"></div>
			<div v-if="!$root.vp.videoLoaded" class="meme"><img src="https://i.imgur.com/YmMUr7z.gif" rel="noreferrer" /></div>

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
			<!--<div id="timeline-auto">{{ $root.vp.videoCurrentTime }}</div>-->
		</div>

		<div v-if="$root.vp.videoChapters" id="timeline-markers">
			<div class="timeline-marker" v-for="(marker, id) in $root.vp.videoChapters" v-bind:key="id" v-bind:style="{ left: ( ( marker.time / $root.vp.vodLength ) * 100 ) + '%' }">
				{{ marker.label }}
			</div>
		</div>

		<div id="playback_info">
			<div id="playback_text">Playback text</div>
		</div>

		<div id="controls">

			<div class="option-row">
				
				<div v-if="!$root.vp.automated" v-bind:class="{ 'option-group': true, 'ok': $root.vp.videoLoaded }" class="option-group">
					<div class="option-title">Video</div>
					<div class="option-content">
						<select class="fullsize" v-model="video_source">
							<option value="file">Local video file</option>
							<option value="file_http">Hosted video file</option>
							<option value="youtube">YouTube</option>
							<option value="twitch">Twitch VOD</option>
						</select>
						<hr>
						<div v-if="video_source == 'file'">
							<div class="control">
								<label><input type="file" name="video-input" ref="video_input" accept="video/*" /> Video</label>
							</div>
						</div>
						<div v-if="video_source == 'file_http'">
							<div class="control">
								<label><input type="text" name="video-input" ref="video_input" /> Video URL</label>
							</div>
						</div>
						<div v-if="video_source == 'youtube'">
							<div class="control">
								<label><input type="text" name="video-input" ref="video_input" /> YouTube URL</label>
							</div>
						</div>
						<div v-if="video_source == 'twitch'">
							<div class="control">
								<label><input type="text" name="video-input" ref="video_input" /> Twitch VOD URL</label>
							</div>
							<p class="help-text">Please proceed through the mature warning before clicking start, if it appears.</p>
						</div>
						<hr>
						<button class="button" @click="submitVideo">Submit</button>
						<p class="help-text">
							Nothing is uploaded, everything runs in your browser.
						</p>
					</div>
				</div>
				
				<div v-if="!$root.vp.automated" v-bind:class="{ 'option-group': true, 'ok': $root.vp.chatLoaded }" class="option-group">
					<div class="option-title">Chat</div>
					<div class="option-content">
						<select class="fullsize" v-model="chat_source">
							<option value="file">Local chat file</option>
							<option value="file_http">Hosted chat file</option>
							<option value="twitch">Twitch VOD dump</option>
						</select>
						<hr>
						<div v-if="chat_source == 'file'">
							<div class="control">
								<label><input type="file" name="chat-input" ref="chat_input" accept="application/json,.chatdump" /> Chat</label>
							</div>
						</div>
						<div v-if="chat_source == 'file_http'">
							<div class="control">
								<label><input type="url" name="chat-input" ref="chat_input" /> Chat URL</label>
							</div>
						</div>
						<div v-if="chat_source == 'twitch'">
							<div class="control">
								<label><input type="url" name="chat-input" ref="chat_input" /> Twitch VOD URL</label>
							</div>
						</div>
						<hr>
						<button class="button" @click="submitChat">Submit</button>
						<p class="help-text">
							Chat logs may take a while to parse, don't worry.
						</p>
					</div>
				</div>
				
				<div v-if="twitchApiRequired" class="option-group">
					<div class="option-title">Twitch API</div>
					<div class="option-content">
						<label>
							<input type="password" placeholder="Client ID" v-model="$root.vp.settings.twitchClientId" />
							Client ID
						</label>
						<label>
							<input type="password" placeholder="Secret" v-model="$root.vp.settings.twitchSecret" />
							Secret
						</label>
						<br>
						{{ $root.vp.settings.twitchToken ? 'Has token' : 'No token' }}
						<br>
						<button class="button" @click="saveSettings">Save</button>
						<button class="button" @click="fetchTwitchToken">Fetch Twitch token</button>
						
					</div>
				</div>

				<div class="option-group">
					<div class="option-title">Status</div>
					<div class="option-content">
						<strong>Video:</strong> <span>{{ $root.vp.status_video }}</span><br>
						<strong>Comments:</strong> <span>{{ $root.vp.status_comments }}</span><br>
						<strong>FFZ:</strong> <span>{{ $root.vp.status_ffz }}</span><br>
						<strong>BTTV Channel:</strong> <span>{{ $root.vp.status_bttv_channel }}</span><br>
						<strong>BTTV Global:</strong> <span>{{ $root.vp.status_bttv_global }}</span><br>
						<strong>SevenTV:</strong> <span>{{ $root.vp.status_seventv }}</span>
					</div>
				</div>

			</div>

			<div class="option-row">

				<div v-if="!$root.vp.automated" class="option-group">
					<div class="option-title">Chat offset in seconds</div>
					<div class="option-content">
						<p class="help-text">
							Offset from the video, if recording started too late.
							It will be set automatically based on how long the chat dump is
							and the video length, remember to set it to 0 if you want it that way.
						</p>
						<input name="chatOffset" v-model="$root.vp.chatOffset">
					</div>
				</div>

				<div class="option-group">
					<div class="option-title">Update frequency in ms</div>
					<div class="option-content">
						<p class="help-text">
							The lower the smoother. 16.67 - 60fps, 33.33 - 30fps.
							Missed ticks shouldn't matter, as the parser is dependent on system time.
						</p>
						<input name="tickDelay" v-model="$root.vp.tickDelay">
					</div>
				</div>

				<div class="option-group">
					<div class="option-title">Chat location</div>
					<div class="option-content">

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
						<select v-model="$root.vp.settings.fontName">
							<option
								v-for="k, v in $root.vp.fonts"
								:key="k"
								:value="k"
								:style="{ fontFamily: k }"
							>{{ v }}</option>
							<!--
							<option value="Inter">Inter (Twitch)</option>
							<option>Arial</option>
							<option>Helvetica</option>
							<option>Open Sans</option>
							<option>Roboto</option>
							<option>Segoe UI</option>
							<option>Verdana</option>
							<optgroup label="Fixed width">
								<option>Consolas</option>
								<option>monospace</option>
							</optgroup>
							-->
						</select>
						<table>
							<tr>
								<td><label><input type="checkbox" checked="checked" v-model="$root.vp.settings.chatStroke"> Stroke + shadow</label></td>
								<td><label><input type="checkbox" checked="checked" v-model="$root.vp.settings.emotesEnabled"> Emotes</label></td>
							</tr>
							<tr>
								<td><label><input type="checkbox" checked="checked" v-model="$root.vp.settings.timestampsEnabled"> Timestamps</label></td>
								<td><label><input type="checkbox" checked="checked" v-model="$root.vp.settings.badgesEnabled"> Badges</label></td>
							</tr>
							<tr>
								<td><label><input type="checkbox" checked="checked" v-model="$root.vp.settings.smallEmotes"> Small emotes</label></td>
								<td><label><input type="checkbox" checked="checked" v-model="$root.vp.settings.showVODComments"> VOD comments</label></td>
							</tr>
						</table>
						<label><input type="range" min="10" max="42" v-model="$root.vp.settings.fontSize"> Font size</label>
					</div>
				</div>

			</div>

			<div class="option-group">
				<div class="option-content">
					<button class="button color-green is-flashing" @click="play">Play</button>
					<button class="button" @click="apply">Apply</button>
					<button class="button" @click="fullscreen">Fullscreen</button>
					<button class="button" @click="saveSettings">Save settings</button>
					<button class="button" @click="resetSettings">Reset settings</button>
				</div>
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
	data: function(){
		return {
			video_source: 'file',
			chat_source: 'file',
			input_video: '',
			input_chat: '',
		};
	},
	methods: {
		submitVideo(event){
			console.log( this.$refs );
			this.$root.vp.loadVideo( this.video_source, this.$refs.video_input );
			event.preventDefault();
			return false;
		},
		submitChat(event){
			console.log( this.$refs );
			this.$root.vp.loadChat( this.chat_source, this.$refs.chat_input );
			event.preventDefault();
			return false;
		},
		fetchTwitchToken(){
			this.$root.vp.fetchTwitchToken();
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
			let duration = this.$root.vp.embedPlayer.getDuration();
			let rect = timeline.getBoundingClientRect();
			let percent = ( ev.clientX - rect.left ) / timeline.clientWidth;
			let seconds = Math.round(duration * percent);
			this.$root.vp.seek( seconds );
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

			return vp.embedPlayer.getCurrentTime() / vp.vodLength;
            
		},
		commentsStyle(){
			return {
				'top': this.$root.vp.settings.chatTop + '%',
				'bottom': this.$root.vp.settings.chatBottom + '%',
				'width': this.$root.vp.settings.chatWidth + '%',
				'fontSize': this.$root.vp.settings.fontSize + 'px',
				'fontFamily': this.$root.vp.settings.fontName,
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
		twitchApiRequired(){
			return this.video_source == 'twitch' || this.chat_source == 'twitch';
		}

    }
}
</script>
