<template>
    <div id="controls" v-if="(vodplayer && !store.minimal)">
        <div class="option-row">
            <div v-if="!store.automated" v-bind:class="{ 'option-group': true, ok: vodplayer.videoLoaded }" class="option-group">
                <div class="option-title">Video</div>
                <div class="option-content">
                    <select class="fullsize" v-model="video_source">
                        <option value="file">Local video file</option>
                        <option value="file_http">Hosted video file</option>
                        <option value="youtube">YouTube</option>
                        <option value="twitch">Twitch VOD</option>
                    </select>
                    <hr />
                    <div v-if="video_source == 'file'">
                        <div class="control fullwidth">
                            <label><input type="file" name="video-input" @change="handleVideoFile" accept="video/*" /></label>
                        </div>
                    </div>
                    <div v-if="video_source == 'file_http'">
                        <div class="control fullwidth">
                            <label><input type="text" name="video-input" v-model="input_video" placeholder="Video URL" /></label>
                        </div>
                    </div>
                    <div v-if="video_source == 'youtube'">
                        <div class="control fullwidth">
                            <label><input type="text" name="video-input" v-model="input_video" placeholder="YouTube URL" /></label>
                        </div>
                    </div>
                    <div v-if="video_source == 'twitch'">
                        <div class="control fullwidth">
                            <label><input type="text" name="video-input" v-model="input_video" placeholder="Twitch VOD URL" /></label>
                        </div>
                        <p class="help-text">
                            Please proceed through the mature warning before clicking start, if it appears.<br />
                            This feature requires Twitch API credentials.
                        </p>
                    </div>
                    <hr />
                    <button class="button is-submit" @click="submitVideo">Submit</button>
                </div>
            </div>

            <div v-if="!store.automated" v-bind:class="{ 'option-group': true, ok: vodplayer.chatLoaded }" class="option-group">
                <div class="option-title">Chat</div>
                <div class="option-content">
                    <select class="fullsize" v-model="chat_source">
                        <option value="file">Local chat file</option>
                        <option value="file_http">Hosted chat file</option>
                        <option value="twitch">Twitch API VOD dump</option>
                    </select>
                    <hr />
                    <div v-if="chat_source == 'file'">
                        <div class="control fullwidth">
                            <label><input type="file" name="chat-input" @change="handleChatFile" accept="application/json,.chatdump" placeholder="Chat" /></label>
                        </div>
                    </div>
                    <div v-if="chat_source == 'file_http'">
                        <div class="control fullwidth">
                            <label><input type="url" name="chat-input" v-model="input_chat" placeholder="Chat URL" /></label>
                        </div>
                    </div>
                    <div v-if="chat_source == 'twitch'">
                        <div class="control fullwidth">
                            <label><input type="url" name="chat-input" v-model="input_chat" placeholder="Twitch VOD URL" /></label>
                        </div>
                    </div>
                    <hr />
                    <button class="button is-submit" @click="submitChat">Submit</button>
                    <p class="help-text">Chat logs may take a while to parse, don't worry.</p>
                </div>
            </div>

            <div v-if="twitchApiRequired" class="option-group">
                <div class="option-title">Twitch API</div>
                <div class="option-content">
                    <label>
                        <input type="password" placeholder="Client ID" v-model="store.settings.twitchClientId" />
                        Client ID
                    </label>
                    <label>
                        <input type="password" placeholder="Secret" v-model="store.settings.twitchSecret" />
                        Secret
                    </label>
                    <br />
                    <span class="is-error">{{ store.settings.twitchToken ? "Has token" : "No token" }}</span>
                    <br />
                    <button class="button" @click="saveSettings">Save</button>
                    <button class="button" @click="fetchTwitchToken">Fetch Twitch token</button>
                </div>
            </div>

            <div class="option-group">
                <div class="option-title">Status</div>
                <div class="option-content">
                    <strong>Video:</strong> <span>{{ vodplayer.status_video }}</span>
                    <br />
                    <strong>Comments:</strong> <span>{{ vodplayer.status_comments }}</span>
                    <br />
                    <strong>Delay:</strong> <span>{{ vodplayer.chatOffset }}</span>
                    <br />
                    <strong>FFZ:</strong> <span>{{ vodplayer.emotes.ffz.status }}</span>
                    <br />
                    <strong>BTTV Channel:</strong> <span>{{ vodplayer.emotes.bttv_channel.status }}</span>
                    <br />
                    <strong>BTTV Global:</strong> <span>{{ vodplayer.emotes.bttv_global.status }}</span>
                    <br />
                    <strong>SevenTV:</strong> <span>{{ vodplayer.emotes.seventv.status }}</span>
                </div>
            </div>
        </div>

        <div class="option-row">
            <div class="option-group">
                <div class="option-title">Chat offset in seconds</div>
                <div class="option-content">
                    <p class="help-text">
                        Offset from the video, if recording started too late. It will be set automatically based on how long the chat dump is and the video
                        length, remember to set it to 0 if you want it that way.
                    </p>
                    <input name="chatOffset" v-model="vodplayer.chatOffset" />
                </div>
            </div>

            <div class="option-group">
                <div class="option-title">Chat location</div>
                <div class="option-content">
                    <div>
                        <label><input type="checkbox" name="comments-overlay" v-model="store.settings.chatOverlay" /> Overlay</label>
                        <label><input type="checkbox" name="ultrawide" v-model="store.settings.ultrawide" /> Ultrawide</label>
                    </div>

                    <div class="control">
                        <span>Chat align:</span>
                        <label><input type="radio" name="comments-align" v-model="store.settings.chatAlign" value="left" /> Left</label>
                        <label><input type="radio" name="comments-align" v-model="store.settings.chatAlign" value="right" /> Right</label>
                    </div>

                    <div class="control">
                        <span>Text align:</span>
                        <label><input type="radio" name="comments-textalign" v-model="store.settings.chatTextAlign" value="left" /> Left</label>
                        <label><input type="radio" name="comments-textalign" v-model="store.settings.chatTextAlign" value="right" /> Right</label>
                    </div>

                    <hr />
                    <div class="control">
                        <label class="label label-range">
                            <input class="input-range" type="range" min="0" max="100" v-model="store.settings.chatTop" />
                            <span>Top ({{ store.settings.chatTop }}%)</span>
                        </label>
                    </div>
                    <div class="control">
                        <label class="label label-range">
                            <input class="input-range" type="range" min="0" max="100" v-model="store.settings.chatBottom" style="direction: ltr" />
                            <span>Bottom ({{ store.settings.chatBottom }}%)</span>
                        </label>
                    </div>
                    <div class="control">
                        <label class="label label-range">
                            <input class="input-range" type="range" min="0" max="100" v-model="store.settings.chatWidth" />
                            <span>Width ({{ store.settings.chatWidth }}%)</span>
                        </label>
                    </div>
                </div>
            </div>

            <div class="option-group">
                <div class="option-title">Chat style</div>
                <div class="option-content">
                    <select v-model="store.settings.chatStyle">
                        <option value="has-gradient">Gradient</option>
                        <option value="has-fill40">Fill 40%</option>
                        <option value="has-fill80">Fill 80%</option>
                        <option value="">None</option>
                    </select>
                    <select v-model="store.settings.fontName">
                        <option v-for="(v, k) in fonts" :key="k" :value="k" :style="{ fontFamily: k }">
                            {{ v }}
                        </option>
                    </select>
                    <table>
                        <tr>
                            <td>
                                <label><input type="checkbox" v-model="store.settings.chatStroke" /> Stroke + shadow</label>
                            </td>
                            <td>
                                <label><input type="checkbox" v-model="store.settings.emotesEnabled" /> Emotes</label>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <label><input type="checkbox" v-model="store.settings.timestampsEnabled" /> Timestamps</label>
                            </td>
                            <td>
                                <label><input type="checkbox" v-model="store.settings.badgesEnabled" /> Badges</label>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <label><input type="checkbox" v-model="store.settings.smallEmotes" /> Small emotes</label>
                            </td>
                            <td>
                                <label><input type="checkbox" v-model="store.settings.showVODComments" /> VOD comments</label>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <label><input type="checkbox" v-model="store.settings.chatTransition" /> Transitions</label>
                            </td>
                            <td>
                                <label><input type="checkbox" v-model="store.settings.chatSelectable" /> Selectable</label>
                            </td>
                        </tr>
                    </table>
                    <label><input type="range" min="10" max="42" v-model="store.settings.fontSize" /> Font size ({{ store.settings.fontSize }}px)</label>
                </div>
            </div>
        </div>

        <div class="option-group">
            <div class="option-content">
                <button class="button" @click="apply">Apply timings</button>
                <button class="button" @click="saveSettings">Save settings</button>
                <button class="button" @click="resetSettings">Reset settings</button>
                <button class="button" @click="generateLink">Generate link</button>
                <button class="button" @click="store.minimal = true">
                    <span class="icon">{{ store.minimal ? '✓' : '✗' }}</span>
                    <span>Minimal mode</span>
                </button>
                <button class="button" @click="(store.unlockedWidth = !store.unlockedWidth)">
                    <span class="icon">{{ store.unlockedWidth ? '✓' : '✗' }}</span>
                    <span>Unlocked width</span>
                </button>
                <button class="button" @click="store.automated = !store.automated" v-if="store.automated">
                    <span class="icon">{{ store.automated ? '✓' : '✗' }}</span>
                    <span>Automated</span>
                </button>
                <span> Nothing is uploaded, everything runs in your browser. </span>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import VODPlayer from './VODPlayer.vue';
import { defineComponent, ref } from 'vue';
import { store } from '@/store';
import type { ChatSource, VideoSource } from '@/defs';
import { Fonts } from "../value_defs";

export default defineComponent({
    name: "PlayerControls",
    setup() {
        // const store = useTVC();
        return { store, fonts: Fonts };
    },
    data(): {
        // vp: VODPlayer | undefined;
        video_source: VideoSource;
        chat_source: ChatSource;
        input_video: string;
        input_videofile?: File;
        input_chat: string;
        input_chatfile?: File;
        video_height: number;
        // eslint-disable-next-line indent
    } {
        return {
            video_source: "file",
            chat_source: "file",
            input_video: "",
            input_chat: "",
            video_height: 720,
        };
    },
    props: {
        vodplayer: {
            type: Object,
            required: true,
        },
    },
    emits: {
        "submitVideo": (video_source: VideoSource, input: string | File | undefined) => true,
        "submitChat": (chat_source: ChatSource, input: string | File | undefined) => true,
    },
    methods: {
        handleVideoFile(event: Event) {
            const target = event.target as HTMLInputElement;
            if (target.files) {
                this.input_videofile = target.files[0];
            }
        },
        handleChatFile(event: Event) {
            const target = event.target as HTMLInputElement;
            if (target.files) {
                this.input_chatfile = target.files[0];
            }
        },
        submitVideo() {
            this.$emit("submitVideo", this.video_source, this.video_source === "file" ? this.input_videofile : this.input_video);
        },
        submitChat() {
            this.$emit("submitChat", this.chat_source, this.chat_source === "file" ? this.input_chatfile : this.input_chat);
        },
        apply() {
            if (!this.vodplayer) return;
            this.vodplayer.applyTimings();
        },
        saveSettings() {
            if (!this.store) return;
            this.store.saveSettings();
        },
        resetSettings() {
            if (!this.store) return;
            this.store.resetSettings();
        },
        generateLink() {
            if (!this.vodplayer) return;
            alert(`${location.protocol}//${location.host}${location.pathname}${this.vodplayer.generateHash()}`);
        },
        async fetchTwitchToken(): Promise<string | boolean> {
            if (!this.store.settings.twitchClientId || !this.store.settings.twitchSecret) {
                alert("Missing either Twitch client id or secret");
                return false;
            }

            return fetch(
                `https://id.twitch.tv/oauth2/token?client_id=${this.store.settings.twitchClientId}&client_secret=${this.store.settings.twitchSecret}&grant_type=client_credentials`,
                {
                    method: "POST",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            )
                .then((resp) => {
                    return resp.json();
                })
                .then((json) => {
                    if (json.message) {
                        alert(json.message);
                    }

                    if (json.access_token) {
                        this.store.settings.twitchToken = json.access_token;
                        this.saveSettings();
                        return json.access_token;
                    }
                })
                .catch((reason) => {
                    console.error("tac error", reason);
                    return false;
                });
        },
    },
    computed: {
        twitchApiRequired(): boolean {
            return this.video_source == "twitch" || this.chat_source == "twitch";
        },
    },
});
</script>


<style lang="scss" scoped>

#controls {
	// width: $width;
	width: 100%;
}

.option-row {
	display: flex;
}

.option-row .option-group {
	flex-grow: 1;
	flex-basis: 33%;
}

.option-group {

	margin: 1px;

	border: 1px solid #666;
	background: #222;
	color: #ccc;

	box-shadow: inset 0 -1px 10px rgba(0, 0, 0, .2);

	&.ok {
		background: #3B5134;
		border-color: #5D963A;
		.option-title {
			background-image: linear-gradient(#445f3b, #34472e);
			border-color: #43642f;
		}
	}

	h2 {
		font-size: 16px;
		margin: 0;
		padding: 0 0 1px 0;
	}

	.option-title {
		color: #ddd;
		padding: 2px 4px;
		// background: #333;
		background-image: linear-gradient(#444, #333);
		font-weight: 700;
		font-size: 90%;
		letter-spacing: 0.05em;
		text-shadow: 0 1px 2px rgba(0, 0, 0, .6);
		border-bottom: 1px solid #555;
	}

	.option-content {
		padding: 5px;
	}

}

.control {
	&.fullwidth {
		input {
			width: 100%;
		}
	}
}

.help-text {
	color: #aaa;
	font-weight: 300;
	font-size: 90%;
	margin: 0 0 3px 0;
	padding: 0;
}

.is-error {
	color: #bd2525;
}


@import "../style/input";

</style>