<template>
	<div ref="app" id="app" v-if="vp">
		<div id="viewer" :class="{ 'viewer-container': true, 'ultrawide': vp.settings.ultrawide }">
			<div ref="player" id="player">

				<div v-show="vp.videoLoaded" id="video_container"></div>

				<div v-if="!vp.videoLoaded" class="meme-bg">
					<div v-if="!vp.videoLoaded" class="meme"><img src="https://i.imgur.com/YmMUr7z.gif" rel="noreferrer" /></div>
				</div>

				<div v-if="vp.settings.chatOverlay" id="comments" v-bind:class="commentsClass" v-bind:style="commentsStyle">
					<ChatMessage v-for="message in vp.commentQueue" v-bind:message="message" v-bind:vp="vp" v-bind:key="message.gid" :data-id="message.gid"></ChatMessage>
				</div>

				<div id="osd">SYNC NOT STARTED</div>

			</div>
			<div v-if="!vp.settings.chatOverlay" id="comments" v-bind:class="commentsClass" v-bind:style="commentsStyle">
				<ChatMessage v-for="message in vp.commentQueue" v-bind:message="message" v-bind:vp="vp" v-bind:key="message.gid" :data-id="message.gid"></ChatMessage>
			</div>
		</div>

		<div id="timeline" ref="timeline" @click="seek">
			<div id="timeline-seekbar" ref="seekbar" v-bind:style="{ width: ( vp.videoPosition * 100 ) + '%' }"></div>
			<!--<div id="timeline-auto">{{ vp.videoCurrentTime }}</div>-->
		</div>

		<div v-if="vp.videoChapters" id="timeline-markers">
			<div class="timeline-marker" v-for="(marker, id) in vp.videoChapters" v-bind:key="id" v-bind:style="{ left: ( ( marker.time / vp.vodLength ) * 100 ) + '%' }">
				{{ marker.label }}
			</div>
		</div>

		<!--
		<div id="playback_info">
			
		</div>
		-->

		<div id="video-controls">
			<div class="video-controls-buttons" v-if="!vp.isReady">
				<button class="pb-button is-submit" @click="startPlayback" v-if="!vp.isPlaying">Start playback</button>
			</div>
			<div class="video-controls-buttons" v-else>
				<button class="pb-button" @click="togglePause">
					{{ vp.embedPlayer.isPaused ? "▶" : "⏸" }}
				</button>
				<button class="pb-button" @click="fullscreen">Fullscreen</button>
				<button class="pb-button" @click="resetChat">Reset chat</button>
			</div>
			<div class="video-controls-text" id="playback_text">Playback text</div>
		</div>

		<div id="controls">

			<div class="option-row">
				
				<div v-if="!vp.automated" v-bind:class="{ 'option-group': true, 'ok': vp.videoLoaded }" class="option-group">
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
							<div class="control fullwidth">
								<label><input type="file" name="video-input" ref="video_input" accept="video/*" /></label>
							</div>
						</div>
						<div v-if="video_source == 'file_http'">
							<div class="control fullwidth">
								<label><input type="text" name="video-input" ref="video_input" placeholder="Video URL" /></label>
							</div>
						</div>
						<div v-if="video_source == 'youtube'">
							<div class="control fullwidth">
								<label><input type="text" name="video-input" ref="video_input" placeholder="YouTube URL" /></label>
							</div>
						</div>
						<div v-if="video_source == 'twitch'">
							<div class="control fullwidth">
								<label><input type="text" name="video-input" ref="video_input" placeholder="Twitch VOD URL" /></label>
							</div>
							<p class="help-text">
								Please proceed through the mature warning before clicking start, if it appears.<br />
								This feature requires Twitch API credentials.
							</p>
						</div>
						<hr>
						<button class="button is-submit" @click="submitVideo">Submit</button>
						<!--
						<select v-model="video_height">
							<option value="480">480p</option>
							<option value="720">720p</option>
							<option value="1080">1080p</option>
							<option value="1440">1440p</option>
							<option value="2160">2160p</option>
						</select>
						-->
					</div>
				</div>
				
				<div v-if="!vp.automated" v-bind:class="{ 'option-group': true, 'ok': vp.chatLoaded }" class="option-group">
					<div class="option-title">Chat</div>
					<div class="option-content">
						<select class="fullsize" v-model="chat_source">
							<option value="file">Local chat file</option>
							<option value="file_http">Hosted chat file</option>
							<option value="twitch">Twitch API VOD dump</option>
						</select>
						<hr>
						<div v-if="chat_source == 'file'">
							<div class="control fullwidth">
								<label><input type="file" name="chat-input" ref="chat_input" accept="application/json,.chatdump" placeholder="Chat" /></label>
							</div>
						</div>
						<div v-if="chat_source == 'file_http'">
							<div class="control fullwidth">
								<label><input type="url" name="chat-input" ref="chat_input" placeholder="Chat URL" /></label>
							</div>
						</div>
						<div v-if="chat_source == 'twitch'">
							<div class="control fullwidth">
								<label><input type="url" name="chat-input" ref="chat_input" placeholder="Twitch VOD URL" /></label>
							</div>
						</div>
						<hr>
						<button class="button is-submit" @click="submitChat">Submit</button>
						<p class="help-text">
							Chat logs may take a while to parse, don't worry.
						</p>
					</div>
				</div>
				
				<div v-if="twitchApiRequired" class="option-group">
					<div class="option-title">Twitch API</div>
					<div class="option-content">
						<label>
							<input type="password" placeholder="Client ID" v-model="vp.settings.twitchClientId" />
							Client ID
						</label>
						<label>
							<input type="password" placeholder="Secret" v-model="vp.settings.twitchSecret" />
							Secret
						</label>
						<br>
						<span class="is-error">{{ vp.settings.twitchToken ? 'Has token' : 'No token' }}</span>
						<br>
						<button class="button" @click="saveSettings">Save</button>
						<button class="button" @click="fetchTwitchToken">Fetch Twitch token</button>
						
					</div>
				</div>

				<div class="option-group">
					<div class="option-title">Status</div>
					<div class="option-content">
						<strong>Video:</strong> <span>{{ vp.status_video }}</span><br>
						<strong>Comments:</strong> <span>{{ vp.status_comments }}</span><br>
						<strong>FFZ:</strong> <span>{{ vp.emotes.ffz.status }}</span><br>
						<strong>BTTV Channel:</strong> <span>{{ vp.emotes.bttv_channel.status }}</span><br>
						<strong>BTTV Global:</strong> <span>{{ vp.emotes.bttv_global.status }}</span><br>
						<strong>SevenTV:</strong> <span>{{ vp.emotes.seventv.status }}</span>
					</div>
				</div>

			</div>

			<div class="option-row">

				<div v-if="!vp.automated" class="option-group">
					<div class="option-title">Chat offset in seconds</div>
					<div class="option-content">
						<p class="help-text">
							Offset from the video, if recording started too late.
							It will be set automatically based on how long the chat dump is
							and the video length, remember to set it to 0 if you want it that way.
						</p>
						<input name="chatOffset" v-model="vp.chatOffset">
					</div>
				</div>

				<div class="option-group">
					<div class="option-title">Update frequency in ms</div>
					<div class="option-content">
						<p class="help-text">
							The lower the smoother. 16.67 - 60fps, 33.33 - 30fps.
							Missed ticks shouldn't matter, as the parser is dependent on system time.
						</p>
						<input name="tickDelay" v-model="vp.tickDelay">
					</div>
				</div>

				<div class="option-group">
					<div class="option-title">Chat location</div>
					<div class="option-content">

						<div>
							<label><input type="checkbox" name="comments-overlay" v-model="vp.settings.chatOverlay"> Overlay</label>
							<label><input type="checkbox" name="ultrawide" v-model="vp.settings.ultrawide"> Ultrawide</label>
						</div>

						<div>
							Chat align:
							<label><input type="radio" name="comments-align" v-model="vp.settings.chatAlign"> Left</label>
							<label><input type="radio" name="comments-align" v-model="vp.settings.chatAlign"> Right</label>
						</div>

						<div>
							Text align:
							<label><input type="radio" name="comments-textalign" v-model="vp.settings.chatTextAlign"> Left</label>
							<label><input type="radio" name="comments-textalign" v-model="vp.settings.chatTextAlign"> Right</label>
						</div>

						<hr>

						<label><input class="input-range" type="range" min="0" max="100" v-model="vp.settings.chatTop"> Top</label>
						<label><input class="input-range" type="range" min="0" max="100" v-model="vp.settings.chatBottom" style="direction: ltr"> Bottom</label>
						<label><input class="input-range" type="range" min="0" max="100" v-model="vp.settings.chatWidth"> Width</label>
					
					</div>
				</div>

				<div class="option-group">
					<div class="option-title">Chat style</div>
					<div class="option-content">
						<select v-model="vp.settings.chatStyle">
							<option value="has-gradient">Gradient</option>
							<option value="has-fill40">Fill 40%</option>
							<option value="has-fill80">Fill 80%</option>
							<option value="">None</option>
						</select>
						<select v-model="vp.settings.fontName">
							<option
								v-for="v, k in vp.fonts"
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
								<td><label><input type="checkbox" checked="checked" v-model="vp.settings.chatStroke"> Stroke + shadow</label></td>
								<td><label><input type="checkbox" checked="checked" v-model="vp.settings.emotesEnabled"> Emotes</label></td>
							</tr>
							<tr>
								<td><label><input type="checkbox" checked="checked" v-model="vp.settings.timestampsEnabled"> Timestamps</label></td>
								<td><label><input type="checkbox" checked="checked" v-model="vp.settings.badgesEnabled"> Badges</label></td>
							</tr>
							<tr>
								<td><label><input type="checkbox" checked="checked" v-model="vp.settings.smallEmotes"> Small emotes</label></td>
								<td><label><input type="checkbox" checked="checked" v-model="vp.settings.showVODComments"> VOD comments</label></td>
							</tr>
						</table>
						<label><input type="range" min="10" max="42" v-model="vp.settings.fontSize"> Font size</label>
					</div>
				</div>

			</div>

			<div class="option-group">
				<div class="option-content">
					<button class="button" @click="apply">Apply timings</button>
					<button class="button" @click="saveSettings">Save settings</button>
					<button class="button" @click="resetSettings">Reset settings</button>
					<span>
						Nothing is uploaded, everything runs in your browser.
					</span>
				</div>
			</div>

		</div>

	</div>

</template>

<script>
import ChatMessage from './components/ChatMessage.vue'

import EmbedVideoPlayer from './embeds/html5';
import EmbedTwitchPlayer from './embeds/twitch';
import EmbedYouTubePlayer from './embeds/youtube';

import './style/player.scss';

import VODPlayer from './vodplayer';

console.log("app.vue init");

export default {
	name: 'App',
	components: {
		ChatMessage
	},
	data: function(){
		return {
			vp: null,
			video_source: 'file',
			chat_source: 'file',
			input_video: '',
			input_chat: '',
			video_height: 720,
		};
	},
	mounted(){
		console.log("Vod player mounted", this.video_height);

		const vodplayer = new VODPlayer();
		this.vp = vodplayer;

		vodplayer.elements.viewer = document.getElementById('viewer');
		vodplayer.elements.player = document.getElementById('player');
		vodplayer.elements.video = document.getElementById('video');
		vodplayer.elements.comments = document.getElementById('comments');
		vodplayer.elements.osd = document.getElementById('osd');
		// vodplayer.elements.timeline = document.getElementById('timeline-text');
		vodplayer.elements.playback_text = document.getElementById('playback_text');

		vodplayer.hooks();

		const processHash = () => {

			console.debug("Process hash", window.location.hash);

			const query = window.location.hash;
			const query_param = query.split("&");
			const params = {};
			for (const param of query_param) {
				params[param.split("=")[0].replace("#", "")] = param.split("=")[1];
			}

			// twitch client id
			if(params.tci){
				vodplayer.settings.twitchClientId = params.tci;
			}

			// twitch secret
			if(params.ts){
				vodplayer.settings.twitchSecret = params.ts;
			}

			// token
			if(params.tk){
				vodplayer.settings.twitchToken = params.tk;
			}

			if(params.offset){
				vodplayer.chatOffset = parseInt(params.offset);
			}

			if(params.chapters){
				vodplayer.videoChapters = [];
				const ch = params.chapters.split(";");
				for( const c of ch ){
					const d = c.split(":");
					const chapter = {
						time: parseInt(d[0]),
						label: d[1]
					};
					console.log("add chapter", chapter);
					vodplayer.videoChapters.push(chapter);
				}
				console.log(vodplayer.videoChapters);
			}
			
			// automate it
			if (params.source) {
				
				console.debug("automate playback");
				vodplayer.automated = true;

				// load video
				if (params.source == "youtube") {
					window.onYouTubeIframeAPIReady = () => {
						vodplayer.embedPlayer = new EmbedYouTubePlayer(params.youtube_id);
					}
				} else if (params.source == "twitch") {
					vodplayer.embedPlayer = new EmbedTwitchPlayer(params.twitch_id);
				} else if (params.source == "file") {
					vodplayer.embedPlayer = new EmbedVideoPlayer(params.video_path);
				}else{
					alert("No video source set");
					return false;
				}

				// set up embed player
				if (vodplayer.embedPlayer) {
					vodplayer.embedPlayer.vodplayer = vodplayer;
					vodplayer.embedPlayer.setup();
				}

				// load chat
				if (params.chatdump && vodplayer.embedPlayer) {
					vodplayer.loadTwitchChat(params.chatdump).then( status => {
						console.log("auto chat load 1", status);
						if (params.offset) vodplayer.seek(params.offset);
					});
				} else if (params.chatfile && vodplayer.embedPlayer) {
					vodplayer.embedPlayer.setCallback('ready', () => {
						console.debug("player ready, load chat file");
						vodplayer.loadChatFileFromURL(params.chatfile).then( status => {
							console.log("auto chat load 2", status);
							if (params.offset) vodplayer.seek(params.offset);
						});
					});
				}else{
					alert("No chat source set");
					return false;
				}

				

			}
		}

		window.addEventListener("hashchange", () => processHash);

		processHash();

	},
	methods: {
		submitVideo(event){
			console.log( this.$refs );
			this.vp.loadVideo( this.video_source, this.$refs.video_input );
			event.preventDefault();
			return false;
		},
		submitChat(event){
			console.log( this.$refs );
			this.vp.loadChat( this.chat_source, this.$refs.chat_input );
			event.preventDefault();
			return false;
		},
		fetchTwitchToken(){
			this.vp.fetchTwitchToken();
		},	
		alignChat(dir){
			this.vp.alignChat(dir);
		},
		alignText(dir){
			this.vp.alignText(dir);
		},
		startPlayback(){
			this.vp.startPlayback();
		},
		togglePause(){
			this.vp.togglePause();
		},
		apply(){
			this.vp.applyTimings();
		},
		resetChat(){
			this.vp.reset();
		},
		fullscreen(){
			this.vp.fullscreen();
		},
		seek(ev){
			if(!this.vp.embedPlayer){
				console.error("trying to seek from gui with no embed player");
				return false;
			}
			let duration = this.vp.embedPlayer.getDuration();
			let rect = timeline.getBoundingClientRect();
			let percent = ( ev.clientX - rect.left ) / timeline.clientWidth;
			let seconds = Math.round(duration * percent);
			this.vp.seek( seconds );
		},
		saveSettings(){
			this.vp.saveSettings();
		},
		resetSettings(){
			this.vp.resetSettings();
		}
	},
	computed: {
        videoPosition(){

			return this.vp.embedPlayer.getCurrentTime() / this.vp.vodLength;
            
		},
		commentsStyle(){
			return {
				'top': this.vp.settings.chatTop + '%',
				'bottom': this.vp.settings.chatBottom + '%',
				'width': this.vp.settings.chatWidth + '%',
				'fontSize': this.vp.settings.fontSize + 'px',
				'fontFamily': this.vp.settings.fontName,
			}
		},
		commentsClass(){
			return {
				'align-left': this.vp.settings.chatAlign == 'left',
				'align-right': this.vp.settings.chatAlign == 'right',
				'text-left': this.vp.settings.chatTextAlign == 'left',
				'text-right': this.$root.vp.settings.chatTextAlign == 'right',
				[this.$root.vp.settings.chatStyle]: true,
				'has-stroke': this.$root.vp.settings.chatStroke,
				'is-overlay': this.$root.vp.settings.chatOverlay,
			}
		},
		twitchApiRequired(){
			return this.video_source == 'twitch' || this.chat_source == 'twitch';
		}

    },
	watch: {
		video_height(newVal, oldVal){
			console.log(newVal);
			this.$refs.player.style.width = "auto";
			this.$refs.player.style.height = `${newVal}px`;
			this.$refs.app.style.width = `auto`;
		}
	},
}
</script>
