<template>
    <div>
        <VODPlayer
            ref="vodplayer"
            @ready="playerReady"
        />
        <!--<Dashboard v-if="!store.minimal" ref="dashboard" />-->

        <div id="controls" v-if="vodplayer && !store.minimal">
            <div class="option-row">
                <div v-if="!store.automated" v-bind:class="{ 'option-group': true, ok: vodplayer.videoLoaded }" class="option-group">
                    <div class="option-title">Video</div>
                    <div class="option-content">
                        <select class="fullsize" v-model="video_source">
                            <option value="file">Local video file</option>
                            <option value="file_http">Hosted video file</option>
                            <!-- // FIXME: add back these
                            <option value="youtube">YouTube</option>
                            <option value="twitch">Twitch VOD</option>
                            -->
                        </select>
                        <hr />
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
                <div v-if="!store.automated" class="option-group">
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

                        <div>
                            Chat align:
                            <label><input type="radio" name="comments-align" v-model="store.settings.chatAlign" /> Left</label>
                            <label><input type="radio" name="comments-align" v-model="store.settings.chatAlign" /> Right</label>
                        </div>

                        <div>
                            Text align:
                            <label><input type="radio" name="comments-textalign" v-model="store.settings.chatTextAlign" /> Left</label>
                            <label><input type="radio" name="comments-textalign" v-model="store.settings.chatTextAlign" /> Right</label>
                        </div>

                        <hr />

                        <label><input class="input-range" type="range" min="0" max="100" v-model="store.settings.chatTop" /> Top</label>
                        <label
                            ><input class="input-range" type="range" min="0" max="100" v-model="store.settings.chatBottom" style="direction: ltr" /> Bottom</label
                        >
                        <label><input class="input-range" type="range" min="0" max="100" v-model="store.settings.chatWidth" /> Width</label>
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
                                    <label><input type="checkbox" checked="checked" v-model="store.settings.chatStroke" /> Stroke + shadow</label>
                                </td>
                                <td>
                                    <label><input type="checkbox" checked="checked" v-model="store.settings.emotesEnabled" /> Emotes</label>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <label><input type="checkbox" checked="checked" v-model="store.settings.timestampsEnabled" /> Timestamps</label>
                                </td>
                                <td>
                                    <label><input type="checkbox" checked="checked" v-model="store.settings.badgesEnabled" /> Badges</label>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <label><input type="checkbox" checked="checked" v-model="store.settings.smallEmotes" /> Small emotes</label>
                                </td>
                                <td>
                                    <label><input type="checkbox" checked="checked" v-model="store.settings.showVODComments" /> VOD comments</label>
                                </td>
                            </tr>
                        </table>
                        <label><input type="range" min="10" max="42" v-model="store.settings.fontSize" /> Font size</label>
                    </div>
                </div>
            </div>

            <div class="option-group">
                <div class="option-content">
                    <button class="button" @click="apply">Apply timings</button>
                    <button class="button" @click="saveSettings">Save settings</button>
                    <button class="button" @click="resetSettings">Reset settings</button>
                    <button class="button" @click="generateLink">Generate link</button>
                    <button class="button" @click="store.minimal = true">Minimal mode</button>
                    <span> Nothing is uploaded, everything runs in your browser. </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "@vue/runtime-core";
import { nextTick } from "vue";
import ChatMessage from "./components/ChatMessage.vue";
import VideoControls from "./components/VideoControls.vue";
import { ChatSource, VideoSource } from "./defs";

import "./style/player.scss";

// import VODPlayer from "./vodplayer";
import VODPlayer from "./components/VODPlayer.vue";
// import Dashboard from "./components/Dashboard.vue";
import { useStore } from "./store";
import { Fonts } from "./value_defs";

console.log("app.vue init");

export default defineComponent({
    name: "App",
    components: {
        ChatMessage,
        VideoControls,
        VODPlayer,
        // Dashboard
    },
    setup() {
        const store = useStore();
        // const dashboard = ref<InstanceType<typeof Dashboard>>();
        const vodplayer = ref<InstanceType<typeof VODPlayer>>();
        return { store, /* dashboard, */ vodplayer, fonts: Fonts };
    },
    data(): {
        // vp: VODPlayer | undefined;
        video_source: VideoSource;
        chat_source: ChatSource;
        input_video: string;
        input_chat: string;
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
    async mounted() {
        console.log("Vod player mounted", this.video_height);
        await nextTick();
        window.addEventListener("hashchange", this.processHash);
        this.processHash();
    },
    methods: {
        processHash(ev?: Event) {
            console.debug("Process hash", window.location.hash, ev);

            const vodplayer = this.vodplayer;
            if (!vodplayer) return;

            const query = window.location.hash;
            const query_param = query.split("&");
            const params = {} as Record<string, string>;
            for (const param of query_param) {
                params[param.split("=")[0].replace("#", "")] = param.split("=")[1];
            }

            // twitch client id
            if (params.tci) {
                this.store.settings.twitchClientId = params.tci;
            }

            // twitch secret
            if (params.ts) {
                this.store.settings.twitchSecret = params.ts;
            }

            // token
            if (params.tk) {
                this.store.settings.twitchToken = params.tk;
            }

            if (params.offset) {
                vodplayer.chatOffset = parseInt(params.offset);
            }

            this.store.minimal = params.minimal !== undefined && parseInt(params.minimal) > 0;

            if (params.chapters) {
                vodplayer.videoChapters = [];
                const ch = params.chapters.split(";");
                for (const c of ch) {
                    const d = c.split(":");
                    const chapter = {
                        time: parseInt(d[0]),
                        label: d[1],
                    };
                    console.log("add chapter", chapter);
                    vodplayer.videoChapters.push(chapter);
                }
                console.log(vodplayer.videoChapters);
            }

            // automate it
            if (params.source) {
                const video_source = params.source as VideoSource;
                console.debug("automate playback");
                this.store.automated = true;
                this.video_source = video_source;

                // load video
                if (video_source == "youtube") {
                    // window.onYouTubeIframeAPIReady = () => {
                    //     vodplayer.embedPlayer = new EmbedYouTubePlayer(params.youtube_id);
                    // };
                    vodplayer.video_source = "youtube";
                    vodplayer.video_id = params.youtube_id;
                    vodplayer.videoLoadSource = params.youtube_id;
                    this.input_video = params.youtube_id;
                } else if (video_source == "twitch") {
                    // vodplayer.embedPlayer = new EmbedTwitchPlayer(params.twitch_id);
                    vodplayer.video_source = "twitch";
                    vodplayer.video_id = params.twitch_id;
                    vodplayer.videoLoadSource = params.twitch_id;
                    this.input_video = params.twitch_id;
                } else if (video_source == "file_http") {
                    // vodplayer.embedPlayer = new EmbedVideoPlayer(params.video_path);
                    vodplayer.video_source = "file_http";
                    vodplayer.video_id = params.video_path;
                    vodplayer.videoLoadSource = params.video_path;
                    this.input_video = params.video_path;
                } else {
                    alert("No video source set");
                    return false;
                }

                // set up embed player
                // if (vodplayer.embedPlayer) {
                //     vodplayer.embedPlayer.vodplayer = vodplayer;
                //     vodplayer.embedPlayer.setup();
                // }

                if (params.chatdump) {
                    // load chat from api
                    this.chat_source = "twitch";
                    this.input_chat = params.chatdump;

                    /*
                    vodplayer.loadTwitchChat(params.chatdump).then((status) => {
                        console.log("auto chat load 1", status);
                        if (params.offset) vodplayer.seek(parseInt(params.offset));
                    });
                    */

                } else if (params.chatfile) {
                    // load chat from file
                    this.chat_source = "file_http";
                    this.input_chat = params.chatfile;

                    vodplayer.chat_source = "file_http";
                    vodplayer.chatLoadSource = params.chatfile;

                    /*
                    vodplayer.embedPlayer.addEventListener("ready", () => {
                        console.debug("player ready, load chat file");
                        vodplayer.loadChatFileFromURL(params.chatfile).then((status) => {
                            console.log("auto chat load 2", status);
                            if (params.offset) vodplayer.seek(parseInt(params.offset));
                        });
                    });
                    */

                } else {
                    alert("No chat source set");
                    return false;
                }
            }
        },
        submitVideo(event: Event) {
            if (!this.vodplayer) return;
            console.log(this.$refs);
            this.vodplayer.loadVideo(this.video_source, this.$refs.video_input as HTMLInputElement);
            event.preventDefault();
            return false;
        },
        submitChat(event: Event) {
            if (!this.vodplayer) return;
            console.log(this.$refs);
            this.vodplayer.loadChat(this.chat_source, this.$refs.chat_input as HTMLInputElement);
            event.preventDefault();
            return false;
        },
        /*
        alignChat(dir: string) {
            if (!this.vp) return;
            this.vp.alignChat(dir);
        },
        alignText(dir: string) {
            if (!this.vp) return;
            this.vp.alignText(dir);
        },
        */
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
        playerReady() {
            if (!this.vodplayer) return;

        },
    },
    computed: {
        /*
        async videoPosition(): Promise<number> {
            const currentTime = await this.vp?.embedPlayer?.getCurrentTime() || 0;
            // if (!this.vp || !this.vp.embedPlayer || this.vp.embedPlayer.getCurrentTime() == null || !this.vp.vodLength) return 0;
            return currentTime / (this.vp?.vodLength || 0);
        },
        commentsStyle(): Record<string, string> {
            if (!this.vp) return {};
            return {
                top: this.store.settings.chatTop + "%",
                bottom: this.store.settings.chatBottom + "%",
                width: this.store.settings.chatWidth + "%",
                fontSize: this.store.settings.fontSize + "px",
                fontFamily: this.store.settings.fontName,
            };
        },
        commentsClass(): Record<string, boolean> {
            if (!this.vp) return {};
            return {
                "align-left": this.store.settings.chatAlign == "left",
                "align-right": this.store.settings.chatAlign == "right",
                "text-left": this.store.settings.chatTextAlign == "left",
                "text-right": this.store.settings.chatTextAlign == "right",
                [this.store.settings.chatStyle]: true,
                "has-stroke": this.store.settings.chatStroke,
                "is-overlay": this.store.settings.chatOverlay,
            };
        },
        */
        twitchApiRequired(): boolean {
            return this.video_source == "twitch" || this.chat_source == "twitch";
        },
    },
	watch: {
		video_source() {
            console.log("video_source", this.video_source, this.input_video);
        },
        chat_source() {
            console.log("chat_source", this.chat_source, this.input_chat);
        },
	},
});
</script>
