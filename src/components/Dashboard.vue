<template>
    <div id="controls" v-if="vodplayer">
        <div class="option-row">
            <div v-if="!vodplayer.automated" v-bind:class="{ 'option-group': true, ok: vp.videoLoaded }" class="option-group">
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

            <div v-if="!vp.automated" v-bind:class="{ 'option-group': true, ok: vp.chatLoaded }" class="option-group">
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
                        <input type="password" placeholder="Client ID" v-model="vp.settings.twitchClientId" />
                        Client ID
                    </label>
                    <label>
                        <input type="password" placeholder="Secret" v-model="vp.settings.twitchSecret" />
                        Secret
                    </label>
                    <br />
                    <span class="is-error">{{ vp.settings.twitchToken ? "Has token" : "No token" }}</span>
                    <br />
                    <button class="button" @click="saveSettings">Save</button>
                    <button class="button" @click="fetchTwitchToken">Fetch Twitch token</button>
                </div>
            </div>

            <div class="option-group">
                <div class="option-title">Status</div>
                <div class="option-content">
                    <strong>Video:</strong> <span>{{ vp.status_video }}</span>
                    <br />
                    <strong>Comments:</strong> <span>{{ vp.status_comments }}</span>
                    <br />
                    <strong>FFZ:</strong> <span>{{ vp.emotes.ffz.status }}</span>
                    <br />
                    <strong>BTTV Channel:</strong> <span>{{ vp.emotes.bttv_channel.status }}</span>
                    <br />
                    <strong>BTTV Global:</strong> <span>{{ vp.emotes.bttv_global.status }}</span>
                    <br />
                    <strong>SevenTV:</strong> <span>{{ vp.emotes.seventv.status }}</span>
                </div>
            </div>
        </div>

        <div class="option-row">
            <div v-if="!vp.automated" class="option-group">
                <div class="option-title">Chat offset in seconds</div>
                <div class="option-content">
                    <p class="help-text">
                        Offset from the video, if recording started too late. It will be set automatically based on how long the chat dump is and the video
                        length, remember to set it to 0 if you want it that way.
                    </p>
                    <input name="chatOffset" v-model="vp.chatOffset" />
                </div>
            </div>

            <div class="option-group">
                <div class="option-title">Chat location</div>
                <div class="option-content">
                    <div>
                        <label><input type="checkbox" name="comments-overlay" v-model="vp.settings.chatOverlay" /> Overlay</label>
                        <label><input type="checkbox" name="ultrawide" v-model="vp.settings.ultrawide" /> Ultrawide</label>
                    </div>

                    <div>
                        Chat align:
                        <label><input type="radio" name="comments-align" v-model="vp.settings.chatAlign" /> Left</label>
                        <label><input type="radio" name="comments-align" v-model="vp.settings.chatAlign" /> Right</label>
                    </div>

                    <div>
                        Text align:
                        <label><input type="radio" name="comments-textalign" v-model="vp.settings.chatTextAlign" /> Left</label>
                        <label><input type="radio" name="comments-textalign" v-model="vp.settings.chatTextAlign" /> Right</label>
                    </div>

                    <hr />

                    <label><input class="input-range" type="range" min="0" max="100" v-model="vp.settings.chatTop" /> Top</label>
                    <label
                        ><input class="input-range" type="range" min="0" max="100" v-model="vp.settings.chatBottom" style="direction: ltr" /> Bottom</label
                    >
                    <label><input class="input-range" type="range" min="0" max="100" v-model="vp.settings.chatWidth" /> Width</label>
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
                        <option v-for="(v, k) in vp.fonts" :key="k" :value="k" :style="{ fontFamily: k }">
                            {{ v }}
                        </option>
                    </select>
                    <table>
                        <tr>
                            <td>
                                <label><input type="checkbox" checked="checked" v-model="vp.settings.chatStroke" /> Stroke + shadow</label>
                            </td>
                            <td>
                                <label><input type="checkbox" checked="checked" v-model="vp.settings.emotesEnabled" /> Emotes</label>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <label><input type="checkbox" checked="checked" v-model="vp.settings.timestampsEnabled" /> Timestamps</label>
                            </td>
                            <td>
                                <label><input type="checkbox" checked="checked" v-model="vp.settings.badgesEnabled" /> Badges</label>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <label><input type="checkbox" checked="checked" v-model="vp.settings.smallEmotes" /> Small emotes</label>
                            </td>
                            <td>
                                <label><input type="checkbox" checked="checked" v-model="vp.settings.showVODComments" /> VOD comments</label>
                            </td>
                        </tr>
                    </table>
                    <label><input type="range" min="10" max="42" v-model="vp.settings.fontSize" /> Font size</label>
                </div>
            </div>
        </div>

        <div class="option-group">
            <div class="option-content">
                <button class="button" @click="apply">Apply timings</button>
                <button class="button" @click="saveSettings">Save settings</button>
                <button class="button" @click="resetSettings">Reset settings</button>
                <button class="button" @click="generateLink">Generate link</button>
                <button v-if="vp != null" class="button" @click="vp ? (vp.minimal = true) : ''">Minimal mode</button>
                <span> Nothing is uploaded, everything runs in your browser. </span>
            </div>
        </div>
    </div>

</template>

<script lang="ts">
import { defineComponent, Ref } from "@vue/runtime-core";
import { useStore } from "@/store";
import VODPlayer from "./VODPlayer.vue";

export default defineComponent({
    name: "Dashboard",
    emits: ["update"],
    props: {
        vodplayer: {
            type: Object as () => typeof VODPlayer,
        }
    },
    setup() {
        const store = useStore();
        return { store };
    },
    mounted() {
        console.log("mounted", this.vodplayer);
    },
    created() {
        console.log("created", this.vodplayer);
    },
    methods: {

    },
});

</script>