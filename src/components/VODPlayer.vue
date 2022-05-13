<template>
    <div
        id="viewer"
        ref="viewer"
        :class="{
            'viewer-container': true,
            ultrawide: store.settings.ultrawide,
        }"
    >
        <div ref="player" id="player">
            <div id="video_container" v-if="videoLoaded">
                <VideoPlayerHTML5
                    v-if="video_source === 'file' || video_source === 'file_http'"
                    :url="videoLoadSource"
                    ref="embedPlayer"
                    @pause="isPaused = true; isPlaying = false"
                    @play="isPaused = false; isPlaying = true"
                />
                <VideoPlayerTwitch
                    v-if="video_source === 'twitch'"
                    :id="videoLoadSource"
                    ref="embedPlayer"
                    @pause="isPaused = true; isPlaying = false"
                    @play="isPaused = false; isPlaying = true"
                />
            </div>
            <div v-else class="meme-bg">
                <div class="meme">
                    <img src="https://i.imgur.com/YmMUr7z.gif" rel="noreferrer" />
                </div>
            </div>

            <!--
            <div v-if="store.settings.chatOverlay" id="comments" :class="commentsClass" :style="commentsStyle">
                <chat-message
                    v-for="message in commentQueue"
                    v-bind:message="message"
                    v-bind:key="message.gid"
                    :data-id="message.gid"
                ></chat-message>
            </div>
            -->
            <ChatBox v-if="store.settings.chatOverlay" ref="chatbox" :commentsClass="commentsClass" :commentsStyle="commentsStyle" :commentQueue="commentQueue" />

            <!--<div id="osd">SYNC NOT STARTED</div>-->
        </div>
        <!--
        <div v-if="!store.settings.chatOverlay" id="comments" ref="comments" :class="commentsClass" :style="commentsStyle">
            <chat-message
                v-for="message in commentQueue"
                v-bind:message="message"
                v-bind:key="message.gid"
                :data-id="message.gid"
            ></chat-message>
        </div>
        -->
        <ChatBox v-if="!store.settings.chatOverlay" ref="chatbox" :commentsClass="commentsClass" :commentsStyle="commentsStyle" :commentQueue="commentQueue" />
        <!--<video-controls :minimal="true" v-if="store.minimal" />-->
    </div>

    <div v-if="videoChapters && vodLength" id="timeline-markers">
        <div
            class="timeline-marker"
            v-for="(marker, id) in videoChapters"
            v-bind:key="id"
            v-bind:style="{ left: ( ( marker.time / (vodLength ?? 0) ) * 100 ) + '%' }">
            {{ marker.label }}
        </div>
    </div>

    <video-controls
        v-if="!store.minimal"
        :is-ready="isReady"
        :is-playing="isPlaying"
        :is-paused="isPaused"
        @start-playback="startPlayback"
        @toggle-pause="togglePause"
        @fullscreen="fullscreen"
    />

</template>

<script lang="ts">
import { defineComponent, nextTick, ref } from "@vue/runtime-core";
import ChatMessage from "@/components/ChatMessage.vue";
import VideoControls from "@/components/VideoControls.vue";
import { useStore } from "@/store";
import { ChatSource, TwitchComment, TwitchCommentDump, TwitchCommentProxy, TwitchUserBadge, TwitchUserBadgeProxy, VideoSource } from "@/defs";
import BaseEmoteProvider from "@/emoteproviders/base";
import BTTVChannelEmoteProvider from "@/emoteproviders/bttv_channel";
import BTTVGlobalEmoteProvider from "@/emoteproviders/bttv_global";
import FFZEmoteProvider from "@/emoteproviders/ffz";
import SevenTVEmoteProvider from "@/emoteproviders/seventv";
import DashboardVue from "./Dashboard.vue";
import EmbedVideoPlayer from "@/embeds/html5";
import EmbedTwitchPlayer from "@/embeds/twitch";
import EmbedYouTubePlayer from "@/embeds/youtube";
import EmbedPlayer from "@/embeds/base";
import VideoPlayerHTML5 from "./players/VideoPlayerHTML5.vue";
import ChatBox from "./ChatBox.vue";
import VideoPlayerTwitch from "./players/VideoPlayerTwitch.vue";

let chatLog: TwitchCommentDump | undefined; // decouple from vue for performance

type AnyEmbedPlayer = EmbedPlayer | EmbedTwitchPlayer | EmbedYouTubePlayer | EmbedVideoPlayer;

export default defineComponent({
    name: "VODPlayer",
    setup() {
        const store = useStore();
        const embedPlayer = ref<InstanceType<typeof VideoPlayerHTML5>>();
        const chatbox = ref<InstanceType<typeof ChatBox>>();
        return { store, embedPlayer, chatbox };
    },
    // props: {
    //     dashboard: {
    //         type: DashboardVue,
    //     },
    // },
    data(): {
        // videoLoaded: boolean;
        videoPosition: number;
        videoCurrentTime: number;
        videoDuration: number;
        videoChapters: any[];
        chatLoaded: boolean;
        chatOffset: number;
        vodLength?: number;
        playback_text: string; // TODO: remove
        commentQueue: TwitchCommentProxy[];

        /**
         * Is video+chat playing?
         * @deprecated use embedPlayer instead
         */
        isPlaying: boolean;
        isPaused: boolean;
        isReady: boolean;
        // embedPlayer: AnyEmbedPlayer | null; // TODO: remove
        emotes: Record<string, BaseEmoteProvider>;
        badges: {
            global: Record<string, TwitchUserBadge>;
            channel: Record<string, TwitchUserBadge>;
        };
        tickDelay: number;
        commentLimit: number;
        archiveLength?: number;
        channelName: string;
        status_video: string;
        status_comments: string;

        commentAmount: number;

        chat_source: ChatSource | null,
        video_source: VideoSource | null,
        video_id: string,
        chat_id: string,

        chatlog_version: string;

        channelId: string;
        videoLoadSource: string;
        videoTitle: string;

        vod_id: string;

        chatLoadSource: string;

        lastCommentOffset: number;

        fetchChatRunning: boolean;
        lastCommentTime: number;
        allCommentsFetched: boolean;

        /**
         * timestamp of when video started
         * @todo: use seconds offset instead
         * @deprecated
         */
        timeStart: number | null;

        interval: number | null; // huh

        malformed_comments: number;

        previousTick: number;

        shownComments: number;

    } {
        return {
            // videoLoaded: false,
            videoPosition: 0,
            videoCurrentTime: 0,
            videoDuration: 0,
            videoChapters: [],
            chatLoaded: false,
            chatOffset: 0,
            vodLength: undefined,
            playback_text: "",
            commentQueue: [],
            isPlaying: false,
            isPaused: false,
            isReady: false,
            // embedPlayer: null,
            emotes: {},
            badges: {
                global: {},
                channel: {},
            },
            tickDelay: 0,
            commentLimit: 50,
            archiveLength: undefined,
            channelName: "",
            status_video: "Waiting...",
            status_comments: "Waiting...",

            commentAmount: 0,

            chat_source: null,
            chat_id: "",
            chatLoadSource: "",

            video_source: null,
            video_id: "",
            videoLoadSource: "",

            vod_id: "",

            chatlog_version: "",

            channelId: "",

            videoTitle: "",

            lastCommentOffset: 0,

            fetchChatRunning: false,
            lastCommentTime: 0,
            allCommentsFetched: false,

            timeStart: null,

            interval: null,

            malformed_comments: 0,

            previousTick: 0,

            shownComments: 0,
        };
    },
    mounted() {
        this.setupVodPlayer();    
    },
    methods: {
        setupVodPlayer() {
            chatLog = undefined;

            this.emotes = {
                ffz: new FFZEmoteProvider(),
                bttv_channel: new BTTVChannelEmoteProvider(),
                bttv_global: new BTTVGlobalEmoteProvider(),
                seventv: new SevenTVEmoteProvider(),
            };

            this.badges = {
                global: {},
                channel: {},
            };

            this.commentQueue = [];

            this.commentQueue.push({
                time: "00:00:00",
                username: "braxen",
                usernameColour: "#ff0000",
                messageFragments: [{ type: "text", data: "welcome to my vod player! select video and chat below to begin!" }],
            } as TwitchCommentProxy);

            /**
             * Test comment
             */
            this.commentQueue.push({
                time: "00:00:00",
                username: "helper",
                usernameColour: "#ffff00",
                messageFragments: [
                    { type: "text", data: "word" },
                    { type: "text", data: "spacing" },
                    { type: "text", data: "test" },
                    { type: "text", data: "and" },
                    { type: "text", data: "word" },
                    { type: "text", data: "wrapping" },
                    { type: "text", data: "test" },
                ],
            } as TwitchCommentProxy);

            this.tickDelay = 100; // 50 default
            // this.timeScale = 1;
            this.commentLimit = 50;

            this.vodLength = undefined;
            this.archiveLength = undefined;
            this.channelName = "";

            this.shownComments = 0;

        },

        loadVideo(source: VideoSource, input: HTMLInputElement): boolean {
            console.debug("video input", input, input.value, input.files);

            if (!input.value && !input.files) {
                alert("No video selected");
                return false;
            }

            this.video_source = source;

            this.status_video = "Loading...";

            if (input.files) {
                const file = input.files[0];

                if (!file) {
                    alert("No video selected");
                    return false;
                }

                const fileURL = URL.createObjectURL(file);

                /*
                this.embedPlayer = new EmbedVideoPlayer(fileURL);
                // this.embedPlayer.vodplayer = this;
                this.embedPlayer.setup();

                // this.createHash();

                this.video_id = "";
                */

                this.video_id = "";
                this.videoLoadSource = fileURL;

                this.status_video = "Local video loaded";

                return true;
            } else if (source == "file_http") {

                /*
                this.embedPlayer = new EmbedVideoPlayer(input.value);
                // this.embedPlayer.vodplayer = this;
                this.embedPlayer.setup();
                this.video_id = input.value;
                */

                this.video_id = input.value;
                this.videoLoadSource = input.value;

                return true;
            } else if (source == "twitch") {
                const twitch_id = input.value.match(/\/videos\/([0-9]+)/);
                if (!twitch_id) {
                    alert("invalid twitch vod link");
                    return false;
                }
                // this.embedPlayer = new EmbedTwitchPlayer(twitch_id[1]);
                // this.embedPlayer.vodplayer = this;
                // this.embedPlayer.setup();
                this.video_id = twitch_id[1];
                this.videoLoadSource = twitch_id[1];
                this.vod_id = twitch_id[1];

                this.status_video = "Twitch video loaded";

                return true;
            } else if (source == "youtube") {
                const regex_1 = input.value.match(/v=([A-Za-z0-9]+)/);
                const regex_2 = input.value.match(/\.be\/([A-Za-z0-9]+)/);
                let youtube_id;
                if (regex_1) youtube_id = regex_1[1];
                if (regex_2) youtube_id = regex_2[1];

                if (!youtube_id) {
                    alert("invalid youtube link");
                    return false;
                }

                /*
                this.embedPlayer = new EmbedYouTubePlayer(youtube_id);
                if (this.embedPlayer) {
                    // this.embedPlayer.vodplayer = this;
                    this.embedPlayer.setup();
                    this.video_id = youtube_id;
                    return true;
                } else {
                    return false;
                }
                */

                this.video_id = youtube_id;
                this.videoLoadSource = youtube_id;

                this.status_video = "YouTube video loaded";

            }

            console.error("unhandled video input");

            this.status_video = "Unhandled video source";

            return false;
        },

        async loadChat(source: ChatSource, input: HTMLInputElement): Promise<boolean> {
            console.debug("chat input", input, input.value, input.files);

            if (!input.value && !input.files) {
                alert("No chat selected");
                return false;
            }

            this.chat_source = source;

            if (input.files) {
                console.debug("load chat file locally");
                const file = input.files[0];
                let fileURL;

                try {
                    fileURL = URL.createObjectURL(file);
                } catch (error) {
                    alert("Invalid file selected");
                    return false;
                }

                const success = await this.loadChatFileFromURL(fileURL);
                if (success) {
                    console.log("loading chat from file success");
                    this.chat_id = "";
                    this.chatLoadSource = fileURL;
                    return true;
                }
                return false;
            } else if (source == "file_http") {
                console.debug("load chat file from http");
                const success = await this.loadChatFileFromURL(input.value);
                if (success) {
                    this.chat_id = input.value;
                    this.chatLoadSource = input.value;
                    return true;
                }
                return false;
            } else if (source == "twitch") {
                const twitch_id = input.value.match(/\/videos\/([0-9]+)/);
                if (!twitch_id) {
                    alert("invalid twitch vod link");
                    return false;
                }
                this.loadTwitchChat(twitch_id[1]);
                this.chat_id = twitch_id[1];
                this.chatLoadSource = input.value;
                return true;
            }

            console.error("unhandled chat input");

            return false;
        },

        /**
         * Load chat file from URL, either locally or remote
         * @todo return success
         * @param url
         */
        async loadChatFileFromURL(url: string): Promise<boolean> {
            this.status_comments = `Loading...`;

            let response;
            console.debug(`Load chat from url: ${url}`);
            try {
                response = await fetch(url);
            } catch (error) {
                alert(`HTTP error: ${error}`);
                console.error("HTTP error", error);
                this.status_comments = `Error!`;
                return false;
            }

            let json: TwitchCommentDump;
            console.debug(`Parse chat json...`);
            try {
                json = await response.json();
            } catch (error) {
                console.error("loadChatFileFromURL json error", error);
                this.status_comments = `Error!`;
                return false;
            }

            console.debug("Returned JSON for chat");

            if (!json.comments) {
                if ((<any>json).chapters && (<any>json).segments && (<any>json).streamer_name) {
                    alert("Thanks for using TwitchAutomator! Seems like you selected the wrong file though.");
                    console.error("twitchautomator error", json);
                    this.status_comments = `Error!`;
                    return false;
                }
                console.error("loadChatFileFromURL json has no comments", json);
                this.status_comments = `Error!`;
                return false;
            }

            chatLog = json;

            console.debug("Chat JSON stored in memory", chatLog);

            this.commentAmount = Object.values(chatLog.comments).length; // speed?
            console.debug(`Comment amount: ${this.commentAmount}`);

            // get duration, this changed in the new api. if you know of a better parsing solution, please fix this
            const rawDuration = chatLog.video.duration;

            if (!rawDuration) {
                /*
                alert("Chat log unsupported, it might be too old.");
                console.error("Chat log unsupported, it might be too old.");
                return false;
                */

                if (chatLog.video.length) {
                    this.vodLength = parseInt(chatLog.video.length);

                    this.chatlog_version = "twitch_v1";
                } else if (chatLog.video.end) {
                    this.vodLength = chatLog.video.end;

                    this.chatlog_version = "td_v1";
                } else {
                    alert("Chat log unsupported, it might be too old.");
                    console.error("Chat log unsupported, it might be too old.");
                    this.status_comments = `Error!`;
                    return false;
                }
            } else {
                this.chatlog_version = "twitch_v2";

                const rawHours = rawDuration.match(/([0-9]+)h/);
                const rawMinutes = rawDuration.match(/([0-9]+)m/);
                const rawSeconds = rawDuration.match(/([0-9]+)s/);

                const durHours = rawHours ? parseInt(rawHours[1]) : 0;
                const durMinutes = rawMinutes ? parseInt(rawMinutes[1]) : 0;
                const durSeconds = rawSeconds ? parseInt(rawSeconds[1]) : 0;

                console.debug("v2 date parse", durHours, durMinutes, durSeconds);

                this.vodLength = durHours * 60 * 60 + durMinutes * 60 + durSeconds;
            }

            // this.vodLength = this.chatLog.video.length;
            console.debug(`VOD length: ${this.vodLength}`);

            if (this.embedPlayer) {
                this.archiveLength = await this.embedPlayer.getDuration() || 0;
                console.debug(`embedPlayer length: ${this.archiveLength}`);
            } else {
                console.error("No embed player to set archive length from");
            }

            if (this.archiveLength && this.archiveLength > 0 && this.vodLength) {
                /*
                let offsetInput = (<HTMLInputElement>document.getElementById('optionOffset'));
                if (offsetInput) {
                    offsetInput.value = (this.vodLength - this.archiveLength).toString();
                }
                */
                this.chatOffset = this.vodLength - this.archiveLength;
            }

            if (this.chatlog_version == "td_v1") {
                // weird format
                this.channelName = chatLog.streamer.name;
                this.channelId = chatLog.streamer.id;
                this.vod_id = chatLog.comments[0].content_id;
            } else if (this.chatlog_version == "twitch_v2") {
                // 2019?-
                this.channelName = chatLog.video.user_name;
                this.channelId = chatLog.video.user_id;
                this.vod_id = chatLog.video.id;
                this.videoTitle = chatLog.video.title;

                // this.setTitle(`${this.channelName}: ${this.videoTitle}`);
            } else {
                // -2018
                this.channelName = chatLog.video.channel.display_name;
                this.channelId = chatLog.video.channel._id;
                this.vod_id = chatLog.video._id;
            }

            this.fetchBadges();
            this.fetchEmotes();

            if (this.store.settings.twitchClientId) {
                /*
                this.fetchMarkerInfo().then( (json) => {
                    console.log("marker info", json);
                    // let data = json.data[0];
                    // if(!data) return;
                    // console.log("Marker info from chat log", data);
                });
                */
                // this.fetchMarkerInfo();
            }

            this.lastCommentOffset = Math.round(chatLog.comments[this.commentAmount - 1].content_offset_seconds);

            this.status_comments = `OK (${this.chatlog_version}, ${this.channelName}, ${this.commentAmount}c, ${this.lastCommentOffset}o, ${this.vodLength}s)!`;

            if (this.vodLength && this.vodLength > this.lastCommentOffset + 90) {
                this.status_comments += " (end of comments don't sync up)";
            }

            this.chatLoaded = true;

            return true;
        },

        /**
         * Load twitch vod info and start dumping chat
         * @param videoId Twitch VOD id
         */
        async loadTwitchChat(videoId: string) {
            console.debug("load twitch chat", this);

            this.videoLoadSource = videoId;

            return this.fetchVideoInfo().then((json) => {
                if (json.error) {
                    alert("VOD loading error: " + json.message);
                    return false;
                }

                if (!json.data) {
                    alert("VOD loading error, probably deleted");
                    throw "VOD loading error, probably deleted";
                    return false;
                }

                const data = json.data[0];

                console.log("loadOnline", data);

                const dur = this.parseDuration(data.duration);
                if (!dur) {
                    console.error("invalid duration on video info");
                    return false;
                }

                this.vodLength = dur;
                this.channelName = data.user_name;
                this.channelId = data.user_id;

                console.log("LoadOnline length", this.vodLength);
                console.log("LoadOnline channel name", this.channelName);
                console.log("LoadOnline channel id", this.channelId);

                this.fetchBadges();
                this.fetchEmotes();

                this.fetchChat();

                this.chatLoaded = true;

                // this.fetchMarkerInfo();

                // this.setupEmbedPlayer();

                return true;
            });
        },

        /**
         * Fetch global and channel badges from twitch
         */
        async fetchBadges(): Promise<boolean> {
            if (!this.channelId) {
                console.error("No channel id for badges");
                return false;
            }

            // global badges
            await fetch("https://badges.twitch.tv/v1/badges/global/display")
                .then(function (response) {
                    return response.json();
                })
                .then((json2) => {
                    if (json2.badge_sets) {
                        this.badges.global = json2.badge_sets;
                        console.debug("twitch badges global", this.badges.global);
                    }
                });

            // channel badges
            await fetch(`https://badges.twitch.tv/v1/badges/channels/${this.channelId}/display`)
                .then(function (response) {
                    return response.json();
                })
                .then((json2) => {
                    if (json2.badge_sets) {
                        this.badges.channel = json2.badge_sets;
                        console.debug("twitch badges channel", this.badges.channel);
                    }
                });

            return true;
        },

        /**
         * Fetch emotes from multiple sources
         */
        async fetchEmotes(): Promise<void> {
            if (!this.channelName) {
                console.error("No channel name for emotes");
                return;
            }

            for (const provider in this.emotes) {
                await this.emotes[provider].fetchEmotes(this.channelId);
            }
        },

        /**
         * Video helper for twitch helix api
         * @returns {Object} Video JSON
         */
        async fetchVideoInfo(): Promise<any> {
            return fetch(`https://api.twitch.tv/helix/videos?id=${this.videoLoadSource}`, {
                headers: {
                    "Client-ID": this.store.settings.twitchClientId,
                    Authorization: "Bearer " + this.store.settings.twitchToken,
                },
            }).then((resp) => {
                return resp.json();
            });
        },

        /**
         * Parse the format twitch uses for duration (1h1m1s)
         * @param input 1h1m1s
         * @returns {number} Seconds
         */
        parseDuration(input: string): number | undefined {
            if (!input) return undefined;

            const matchHours = input.match(/([0-9]+)h/);
            const matchMinutes = input.match(/([0-9]+)m/);
            const matchSeconds = input.match(/([0-9]+)s/);

            const durHours = matchHours ? parseInt(matchHours[1]) : 0;
            const durMinutes = matchMinutes ? parseInt(matchMinutes[1]) : 0;
            const durSeconds = matchSeconds ? parseInt(matchSeconds[1]) : 0;

            return durHours * 60 * 60 + durMinutes * 60 + durSeconds;
        },

        /**
         * Format seconds to HH:MM:SS
         * @param seconds
         * @returns {string} HH:MM:SS
         */
        timeFormat(seconds: number): string {
            const date = new Date();
            date.setSeconds(seconds); // specify value for SECONDS here
            return date.toISOString().substring(11, 8);
        },

        /**
         * Continually fetch chat
         */
        async fetchChat() {
            if (!chatLog) return;
            chatLog.comments = [];

            const fragment = await this.fetchChatFragment(0);

            if (!fragment.comments) {
                console.error("could not fetch comments");
                return false;
            }

            let cursor = fragment._next;

            console.log("first fragment", fragment);
            chatLog.comments = chatLog.comments.concat(fragment.comments);

            this.fetchChatRunning = true;

            // for( let i = 0; i < 5; i++ ){
            while (cursor && this.fetchChatRunning) {
                const f = await this.fetchChatFragment(null, cursor);

                cursor = f._next;

                if (!f.comments) {
                    console.error("no comments with cursor");
                    continue;
                }

                chatLog.comments = chatLog.comments.concat(f.comments);

                console.log("Add messages to chat log", chatLog.comments.length, f.comments.length);

                console.log("Message info", f.comments[0].content_offset_seconds, f.comments[0].commenter.display_name);

                // TODO: don't spam server, throttle with this somehow
                if (f.comments[f.comments.length - 1]) {
                    this.lastCommentTime = f.comments[f.comments.length - 1].content_offset_seconds;
                } else {
                    console.error("no comment available");
                }

                this.commentAmount = chatLog.comments.length;

                this.lastCommentOffset = Math.round(chatLog.comments[this.commentAmount - 1].content_offset_seconds);

                this.status_comments = `OK (dump, ${this.channelName}, ${this.commentAmount}c, ${this.lastCommentOffset}o, ${this.vodLength}s)!`;

                if (this.vodLength && this.vodLength > this.lastCommentOffset + 90) {
                    this.status_comments += " (end of comments don't sync up)";
                }

                // debug stop
                /*
                if( chatLog.comments.length > 500 ){
                    console.info("stop downloading comments due to spam test")
                    break;
                }
                */

                // console.log('loop fragment', f);
            }

            this.allCommentsFetched = true;

            this.status_comments = `OK (dump, ${this.channelName}, ${this.commentAmount}c (complete), ${this.vodLength}s)!`;

            console.log("Chat fetching stopped");
        },

        async fetchChatFragment(start: number | null, cursor: string | null = null) {
            // unsupported by twitch
            let url = `https://api.twitch.tv/kraken/videos/${this.videoLoadSource}/comments`;

            // if(start) url += '?content_offset_seconds=' + start;

            if (cursor) url += `?cursor=${cursor}`;

            if (this.videoCurrentTime ?? 0 > 0) {
                url += (cursor ? "&" : "?") + `content_offset_seconds=${this.videoCurrentTime}`;
            }

            return fetch(url, {
                headers: {
                    "Client-ID": this.store.settings.twitchClientId,
                    Accept: "application/vnd.twitchtv.v5+json",
                },
            }).then((resp) => {
                return resp.json();
            });
            /*.then( (json) => {
                
                console.log("chat", json);

                let cursor = json._next;

            });
            */
        },

        /**
         * Start playing the video and chat. Can't run twice.
         * @returns {boolean} If started
         */
        async startPlayback(): Promise<boolean> {
            if (this.isPlaying) {
                alert("Already playing");
                return false;
            }

            console.debug("Started playback");

            if (!this.videoLoaded) {
                alert("No video loaded");
                return false;
            }

            if (!this.chatLoaded) {
                alert("No chat log added");
                return false;
            }

            if (!this.embedPlayer) {
                console.error("No embed player", this.embedPlayer, this);
                alert("No embed player has been created, can't play.");
                return false;
            }

            /*
            this.embedPlayer.addEventListener("play", () => {
                console.log("custom event play");
            });

            this.embedPlayer.addEventListener("pause", () => {
                console.log("custom event pause");
            });

            this.embedPlayer.addEventListener("seeked", (seconds: number) => {
                console.log(`custom event seeked: ${seconds}`);
            });
            */

            // clear comment queue, this will be populated and cleaned over time
            this.commentQueue = [];

            this.timeStart = Date.now();

            // this.embedPlayer.seek(0);
            await this.embedPlayer.play();

            const offsetInput = <HTMLInputElement>document.getElementById("optionOffset");
            if (offsetInput) {
                console.debug(`Offset: ${offsetInput.value}`);
            }

            this.applyTimings();

            // start chat fetching
            if (this.chat_source == "twitch") {
                // this.fetchChat();
            }

            // offset
            this.timeStart += this.chatOffset;

            this.play();

            // FIXME: vue
            const button_start = <HTMLInputElement>document.getElementById("buttonStart");
            if (button_start) button_start.disabled = true;

            this.isPlaying = true;

            this.isReady = true;

            return true;
        },

        async play() {
            if (!this.embedPlayer) return;
            console.log("Play executed");
            this.interval = setInterval(this.tick.bind(this), this.tickDelay);
            await this.embedPlayer.play();
        },

        async pause() {
            if (!this.embedPlayer) return;
            console.log("Pause executed");
            if (this.interval) clearInterval(this.interval);
            await this.embedPlayer.pause();
            this.malformed_comments = 0;
        },

        async seek(seconds: number) {
            if (!this.embedPlayer) return;
            console.log("Seek executed");
            await this.embedPlayer.seek(seconds);
        },

        async togglePause() {
            if (!this.embedPlayer) return;
            if (await this.embedPlayer.isPaused()) {
                this.play();
            } else {
                this.pause();
            }
        },

        /**
         * Update timing settings
         */
        applyTimings(): void {
            console.debug("Applying options");
            console.log(`TickDelay: ${this.tickDelay}`);
            if (this.interval) {
                console.debug("clear interval");
                clearInterval(this.interval);
                this.interval = setInterval(this.tick.bind(this), this.tickDelay);
                console.debug(`Interval set to ${this.tickDelay}`);
            }
        },

        /**
         * Runs in an interval to add messages to chat
         */
        async tick() {
            if (!this.vodLength) {
                throw new Error("No vod length in tick");
            }

            if (!this.embedPlayer) {
                throw new Error("No embed player in tick");
            }

            if (!chatLog){
                throw new Error("No chat log in tick");
            }

            // const tickStart = Date.now();
            // console.debug("Tick executed", tickStart);

            /**
             * Use current time of active playing video
             */
            const videoTime = await this.embedPlayer.getCurrentTime();
            const offsetTime = (videoTime ?? 0) + this.chatOffset;

            if (videoTime === undefined) {
                return false;
            }

            /**
             * If video has ended, pause (stop) the chat playback
             */
            if (videoTime >= this.vodLength) {
                this.pause();
                return false;
            }

            if (this.commentAmount == 0) {
                console.error("No comments to display");
            }

            /**
             * Loop through all comments to insert into queue
             */
            for (let i = this.shownComments; i < this.commentAmount - this.shownComments; i++) {
                const comment: TwitchComment = chatLog.comments[i];

                /**
                 * Skip malformed comments, abort completely if too many found.
                 * Usually a case of formats changing.
                 */
                if (comment.content_offset_seconds === undefined || comment.content_offset_seconds < 0) {
                    console.error("Malformed comment", comment);
                    this.malformed_comments++;
                    if (this.malformed_comments > 100) {
                        this.pause();
                        alert("Too many malformed comments, something is wrong with the chat log.");
                        return false;
                    }
                    continue;
                }

                /**
                 * Skip already displayed comments
                 */
                if (comment.displayed) {
                    // console.debug(`skip comment, already displayed: ${i}`);
                    continue;
                }

                if (comment.content_offset_seconds > offsetTime + 30) {
                    // console.debug(`skip comment, too far away: ${i}, ${comment.content_offset_seconds} (offset: ${offsetTime+30})`);
                    break; // stop looping
                }

                /**
                 * Skip VOD (archive) comments
                 */
                if (this.store.settings.showVODComments && comment.source && comment.source == "comment") {
                    console.debug(`skip comment, vod comment: ${i}`);
                    continue; // skip vod comments?
                }

                /**
                 * Don't show comment yet, its time has not passed current playback time yet
                 * @todo: implement chat offset again (?)
                 */
                if (offsetTime < comment.content_offset_seconds) {
                    // console.debug('skip comment, not displaying yet', i, timeRelative, ( comment.content_offset_seconds / this.timeScale ) );
                    continue;
                }

                /**
                 * If comment is older than 60 seconds, mark it as displayed in a last ditch effort.
                 */
                const commentAge = offsetTime - comment.content_offset_seconds;
                if (commentAge > 60 && !comment.displayed) {
                    // console.debug('skip comment, too old', i);
                    comment.displayed = true;
                    continue;
                }

                if (chatLog.comments[i + 1] && chatLog.comments[i + 1].content_offset_seconds > comment.content_offset_seconds + 600) {
                    this.pause();
                    alert("Next comment is over 10 minutes in the future, something is probably wrong with the file.");
                    return false;
                }

                const commentObj = {} as TwitchCommentProxy;

                if (!comment._id) {
                    console.warn(`No id on comment #${i} @ (${comment.content_offset_seconds})`);
                }

                commentObj.gid = comment._id ?? `tmp${i}`;

                // timestamp
                commentObj.time = this.timeFormat(comment.content_offset_seconds);

                commentObj.badges = [];

                /**
                 * Process and insert badges
                 */
                if (comment.message.user_badges && this.badges.global && this.badges.channel) {
                    for (const b of comment.message.user_badges) {
                        const badgeId = b._id;
                        const badgeVersion = b.version;

                        let imageSrc: string | null = null;

                        // global badge
                        if (this.badges.global[badgeId] && this.badges.global[badgeId].versions[badgeVersion])
                            imageSrc = this.badges.global[badgeId].versions[badgeVersion].image_url_1x;

                        // channel badge
                        if (this.badges.channel[badgeId] && this.badges.channel[badgeId].versions[badgeVersion])
                            imageSrc = this.badges.channel[badgeId].versions[badgeVersion].image_url_1x;

                        if (!imageSrc) {
                            console.error("no badge", badgeId, badgeVersion);
                            continue;
                        }

                        const badgeObj: TwitchUserBadgeProxy = {
                            id: b._id,
                            url: imageSrc,
                        };

                        commentObj.badges.unshift(badgeObj); // TODO: insert in what order?
                    }
                }

                // name
                commentObj.username = comment.commenter.display_name;
                commentObj.usernameColour = comment.message.user_color;

                /**
                 * Parse message fragments and add emotes
                 */
                commentObj.messageFragments = [];
                for (const f of comment.message.fragments) {
                    // official twitch emote
                    if (f.emoticon && this.store.settings.emotesEnabled) {
                        // console.debug(`Insert emote "${f.text}" from Twitch into comment #${commentObj.gid}`);
                        commentObj.messageFragments.push({
                            type: "emote",
                            data: {
                                network: "twitch",
                                name: f.text, // @todo: fix
                                url: `https://static-cdn.jtvnw.net/emoticons/v1/${f.emoticon.emoticon_id}/1.0`,
                            },
                        });
                    } else {
                        const fragWords = f.text.split(" ");

                        // let paragraph = "";

                        // const emotes = 0;

                        for (const word of fragWords) {
                            let found_emote = false;

                            for (const provider in this.emotes) {
                                if (this.emotes[provider].parseComment(word, commentObj)) {
                                    found_emote = true;
                                }
                            }

                            /*
                            if(!found_emote){
                                paragraph += word + " ";
                            }else{
                                commentObj.messageFragments.push({
                                    type: 'text',
                                    data: paragraph
                                });
                                paragraph = "";
                            }
                            */

                            /**
                             * If no emote found in word, insert the word as text instead
                             * @todo optimize this, currently makes a span for every word
                             */
                            if (!found_emote) {
                                commentObj.messageFragments.push({
                                    type: "text",
                                    data: word,
                                });
                            }
                        }
                    }
                }

                this.commentQueue.push(commentObj);

                comment.displayed = true;
            }

            /**
             * Remove old comments from the queue to not waste drawing
             */
            if (this.commentQueue.length >= this.commentLimit) {
                this.commentQueue.splice(0, this.commentQueue.length - this.commentLimit);
                // console.debug( 'Comments overflowing, delete', this.commentQueue.length, this.commentQueue.length - this.commentLimit );
            }

            /**
             * Scroll to bottom of chat window
             * @todo: check why this doesn't work anymore
             */
            // const commentsDiv = this.$refs.comments as HTMLElement;
            // if (commentsDiv) {
            //     commentsDiv.scrollTop = commentsDiv.scrollHeight;
            // }
            if (this.chatbox) {
                setTimeout(() => {
                    if (this.chatbox) this.chatbox.scrollToBottom();
                }, 10);
            }

            // console.debug("Tick finished", Date.now() - tickStart, "Previous tick", Date.now() - this.previousTick);

            // this.previousTick = Date.now();

            // window.requestAnimationFrame(this.tick.bind(this));

            this.shownComments++;

            return true;
        },

        fullscreen() {
            const viewer = this.$refs.viewer as HTMLElement;
            if (viewer){
                viewer.requestFullscreen();
            }
        },

        generateHash() {
            const q = new URLSearchParams();

            if (this.video_source) {
                q.append("source", this.video_source);
                if (this.video_source == "twitch") q.append("twitch_id", this.video_id);
                if (this.video_source == "youtube") q.append("youtube_id", this.video_id);
                if (this.video_source == "file_http") q.append("video_path", this.video_id);
            }

            if (this.chat_source == "file_http") q.append("chatfile", this.chat_id);

            console.log("generateHash", q);
            return `#${q.toString()}`;
        }

    },
    computed: {
        commentsStyle(): Record<string, string> {
            return {
                top: this.store.settings.chatTop + "%",
                bottom: this.store.settings.chatBottom + "%",
                width: this.store.settings.chatWidth + "%",
                fontSize: this.store.settings.fontSize + "px",
                fontFamily: this.store.settings.fontName,
            };
        },
        commentsClass(): Record<string, boolean> {
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
        videoLoaded(): boolean {
            return this.video_source !== null && this.videoLoadSource !== '';
        }
    },
    components: {
    ChatMessage,
    VideoControls,
    VideoPlayerHTML5,
    ChatBox,
    VideoPlayerTwitch
},
});
</script>
