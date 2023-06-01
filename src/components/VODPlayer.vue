<template>
    <div
        id="viewer"
        ref="viewer"
        class="viewer-container"
        :class="{
            ultrawide: store.settings.ultrawide,
            ['chat-side-' + store.settings.chatAlign]: true,
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
                    @ready="onReady"
                    @seeked="seeked"
                />
                <VideoPlayerTwitch
                    v-if="video_source === 'twitch'"
                    :id="videoLoadSource"
                    ref="embedPlayer"
                    @pause="isPaused = true; isPlaying = false"
                    @play="isPaused = false; isPlaying = true"
                    @ready="onReady"
                    @seeked="seeked"
                />
                <VideoPlayerYouTube
                    v-if="video_source === 'youtube'"
                    :id="videoLoadSource"
                    ref="embedPlayer"
                    @pause="isPaused = true; isPlaying = false"
                    @play="isPaused = false; isPlaying = true"
                    @ready="onReady"
                    @seeked="seeked"
                />
            </div>
            <div v-else class="meme-bg">
                <div class="meme">
                    <!--<img src="https://i.imgur.com/YmMUr7z.gif" rel="noreferrer" />-->
                </div>
            </div>

            <ChatBox v-if="store.settings.chatOverlay" ref="chatbox" :commentsClass="commentsClass" :commentsStyle="commentsStyle" :commentQueue="commentQueue" />
            <!--<div id="osd">SYNC NOT STARTED</div>-->
        </div>
        <ChatBox v-if="!store.settings.chatOverlay" ref="chatbox" :commentsClass="commentsClass" :commentsStyle="commentsStyle" :commentQueue="commentQueue" />
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

    <div class="debug">
        Comment queue: {{ commentQueue.length }}<br />
        Comment amount: {{ commentAmount }}<br />
        Shown comments: {{ shownComments }}<br />
    </div>

    <video-controls
        :is-ready="isReady"
        :is-playing="isPlaying"
        :is-paused="isPaused"
        @start-playback="startPlayback"
        @toggle-pause="togglePause"
        @fullscreen="fullscreen"
        @reset-chat="resetChat"
        :video-duration="videoDuration"
        :video-position="videoPosition"
        :video-current-time="videoCurrentTime"
        :minimal-show="minimal_show"
        @seek="seek"
        :can-start-playback="canStartPlayback"
    />

</template>

<script lang="ts">
import { defineComponent, nextTick, ref } from "vue";
import ChatMessage from "@/components/ChatMessage.vue";
import VideoControls from "@/components/VideoControls.vue";
import { store } from "@/store";
import type { ChatSource, TwitchComment, TwitchCommentDump, TwitchCommentProxy, TwitchUserBadge, TwitchUserBadgeProxy, VideoSource } from "@/defs";
import BaseEmoteProvider from "@/emoteproviders/base";
import BTTVChannelEmoteProvider from "@/emoteproviders/bttv_channel";
import BTTVGlobalEmoteProvider from "@/emoteproviders/bttv_global";
import FFZEmoteProvider from "@/emoteproviders/ffz";
import SevenTVEmoteProvider from "@/emoteproviders/seventv";
import VideoPlayerHTML5 from "./players/VideoPlayerHTML5.vue";
import VideoPlayerTwitch from "./players/VideoPlayerTwitch.vue";
import VideoPlayerYouTube from "./players/VideoPlayerYouTube.vue";
import ChatBox from "./ChatBox.vue";

let chatLog: TwitchCommentDump | undefined; // decouple from vue for performance

// type AnyEmbedPlayer = EmbedPlayer | EmbedTwitchPlayer | EmbedYouTubePlayer | EmbedVideoPlayer;

const playbackPositionKeyName = "tvcPlaybackPosition";

export default defineComponent({
    name: "VODPlayer",
    emits: ["ready"],
    setup() {
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

        minimal_show: boolean;

        demo: boolean;

        viewedComments: Record<string, boolean>;

        lastSavedPlaybackPosition: number;

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

            minimal_show: false,

            demo: true,

            viewedComments: {},

            lastSavedPlaybackPosition: 0,
        };
    },
    mounted() {
        this.setupVodPlayer();

        const viewerDiv = this.$refs.viewer as HTMLDivElement;
        if (viewerDiv) {
            viewerDiv.addEventListener("mousemove", (ev) => {
                if (ev.clientY > viewerDiv.clientHeight - viewerDiv.clientHeight / 4) {
                    this.minimal_show = true;
                } else {
                    this.minimal_show = false;
                }
            });
        }
    },
    unmounted() {
        this.stopTicker();
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
                gid: "test1",
                time: "00:00:00",
                username: "braxen",
                usernameColour: "#ff0000",
                messageFragments: [{ type: "text", data: "welcome to my vod player! select video and chat below to begin!" }],
            } as TwitchCommentProxy);

            this.commentQueue.push({
                gid: "test2",
                time: "00:00:00",
                username: "braxen",
                usernameColour: "#fff000",
                messageFragments: [{ type: "text", data: "now rebuilt in vue!" }],
            } as TwitchCommentProxy);

            /**
             * Test comment
             */
            this.commentQueue.push({
                gid: "test3",
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

            // this.playerDemo();

        },

        playerDemo() {
            if (!this.demo) return;

            const lorem = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nulla ea dolor maxime voluptatem eaque ratione quasi, officia quam eos cum fuga expedita quo rem itaque delectus tenetur dolorem earum tempore!";

            const randomPhrase = lorem.split(" ").slice(0, Math.floor(Math.random() * lorem.split(" ").length)).join(" ");
            const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

            this.commentQueue.push({
                gid: "test" + Math.floor(Math.random() * 100000),
                time: "00:00:00",
                username: "braxen",
                usernameColour: randomColor,
                messageFragments: [{ type: "text", data: randomPhrase }],
            } as TwitchCommentProxy);

            // limit to 50 comments
            if (this.commentQueue.length > this.commentLimit) {
                this.commentQueue.shift();
            }

            setTimeout(() => {
                this.playerDemo();
            }, Math.floor(Math.random() * 5000));
        },

        loadVideo(source: VideoSource, input: string | File | undefined): boolean {
            console.debug("video input", source, input);

            this.demo = false;

            if (!input) {
                alert("No video selected");
                return false;
            }

            this.video_source = source;

            this.status_video = "Loading...";

            if (source === "file" && input instanceof File) {
                const file = input;

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

                this.video_id = file.name;
                this.videoLoadSource = fileURL;

                this.status_video = "Local video loaded";

                return true;
            } else if (source == "file_http" && typeof input === "string") {

                /*
                this.embedPlayer = new EmbedVideoPlayer(input.value);
                // this.embedPlayer.vodplayer = this;
                this.embedPlayer.setup();
                this.video_id = input.value;
                */

                this.video_id = input;
                this.videoLoadSource = input;

                return true;
            } else if (source == "twitch" && typeof input === "string") {
                const twitch_id = input.match(/\/videos\/([0-9]+)/);
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
            } else if (source == "youtube" && typeof input === "string") {
                const regex_1 = input.match(/v=([A-Za-z0-9-_]+)/);
                const regex_2 = input.match(/\.be\/([A-Za-z0-9-_]+)/);
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

                return true;

            }

            console.error("unhandled video input", source, input);

            this.status_video = "Unhandled video source";

            return false;
        },

        async loadChat(source: ChatSource, input: string | File | undefined): Promise<boolean> {
            console.debug("chat input", source, input);

            this.demo = false;

            if (!input) {
                alert("No chat selected");
                return false;
            }

            this.chat_source = source;

            if (source === "file" && input instanceof File) {
                console.debug("load chat file locally");
                const file = input;
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
            } else if (source == "file_http" && typeof input === "string") {
                console.debug("load chat file from http");
                const success = await this.loadChatFileFromURL(input);
                if (success) {
                    this.chat_id = input;
                    this.chatLoadSource = input;
                    return true;
                }
                return false;
            } else if (source == "twitch" && typeof input === "string") {
                const twitch_id = input.match(/\/videos\/([0-9]+)/);
                if (!twitch_id) {
                    alert("invalid twitch vod link");
                    return false;
                }
                this.loadTwitchChat(twitch_id[1]);
                this.chat_id = twitch_id[1];
                this.chatLoadSource = input;
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

            await nextTick();

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
                if ((json as any).chapters && (json as any).segments && (json as any).streamer_name) {
                    alert("Thanks for using TwitchAutomator! Seems like you selected the wrong file though.");
                    console.error("twitchautomator error", json);
                    this.status_comments = `Error!`;
                    return false;
                }
                console.error("loadChatFileFromURL json has no comments", json);
                this.status_comments = `Error!`;
                return false;
            }

            let tmp_id = 1;
            json.comments.forEach((comment: TwitchComment) => {
                if (!comment._id) {
                    comment._id = `tmp-id-${tmp_id}`;
                    tmp_id++;
                }
            });
            if (tmp_id > 1) {
                console.warn("loadChatFileFromURL: comments have no id");
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

            this.demo = false;

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

            const offsetInput = document.getElementById("optionOffset");
            if (offsetInput && offsetInput instanceof HTMLInputElement) {
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
            const button_start = document.getElementById("buttonStart");
            if (button_start && button_start instanceof HTMLInputElement) button_start.disabled = true;

            this.isPlaying = true;

            this.isReady = true;

            return true;
        },

        startTicker() {
            this.interval = window.setInterval(this.tick.bind(this), this.tickDelay);
        },

        stopTicker() {
            if (this.interval) window.clearInterval(this.interval);
        },

        async play() {
            if (!this.embedPlayer) return;
            console.log("Play executed");
            this.startTicker();
            await this.embedPlayer.play();
        },

        async pause() {
            if (!this.embedPlayer) return;
            console.log("Pause executed");
            this.stopTicker();
            await this.embedPlayer.pause();
            this.malformed_comments = 0;
        },

        async seek(seconds: number): Promise<void> {
            if (!this.embedPlayer) {
                console.error("No embed player");
                return;
            }
            console.debug("Custom timeline seek executed", seconds);
            await this.embedPlayer.seek(seconds);
        },

        async seeked(seconds: number): Promise<void> {
            if (!this.embedPlayer) return;
            console.debug("Seeked event executed");
            await this.resetChat();
        },

        async onReady(event: any): Promise<void> {
            this.$emit('ready');
            this.loadPlaybackPosition();
        },

        async togglePause(): Promise<void> {
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
                this.stopTicker();
                this.startTicker();
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

            // FIXME: better solution
            this.videoCurrentTime = videoTime;
            this.videoDuration = await this.embedPlayer.getDuration() ?? 0;
            this.videoPosition = videoTime / this.videoDuration;

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

            if (this.shownComments > this.commentAmount) {
                console.debug(`More comments than shown (${this.shownComments}/${this.commentAmount})`);
            }

            if (videoTime > this.lastSavedPlaybackPosition + 15) {
                await this.savePlaybackPosition();
                this.lastSavedPlaybackPosition = videoTime;
            }

            /**
             * Loop through all comments to insert into queue
             */
            for (let i = this.shownComments; i < this.commentAmount; i++) {
                const comment: TwitchComment = chatLog.comments[i];

                if (this.malformed_comments > 100) {
                    this.pause();
                    alert("Too many malformed comments, something is wrong with the chat log.");
                    return false;
                }

                /**
                 * Skip malformed comments, abort completely if too many found.
                 * Usually a case of formats changing.
                 */
                if (comment.content_offset_seconds === undefined || comment.content_offset_seconds < 0) {
                    console.error("Malformed comment", comment);
                    this.malformed_comments++;
                    continue;
                }

                /**
                 * Skip already displayed comments
                 */
                if (this.viewedComments[comment._id]) {
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
                    // comment.displayed = true;
                    this.viewedComments[comment._id] = true;
                    continue;
                }

                if (chatLog.comments[i + 1] && chatLog.comments[i + 1].content_offset_seconds > comment.content_offset_seconds + 600) {
                    this.pause();
                    alert("Next comment is over 10 minutes in the future, something is probably wrong with the file.");
                    return false;
                }

                const commentObj = {} as TwitchCommentProxy;

                if (!comment._id) {
                    console.warn(`No id on comment #${i} @ (${comment.content_offset_seconds})`, comment);
                    this.malformed_comments++;
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

                            if (this.emotes) {
                                for (const provider in this.emotes) {
                                    if (this.emotes[provider] && this.emotes[provider].parseComment && this.emotes[provider].parseComment(word, commentObj)) {
                                        found_emote = true;
                                    }
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

                // comment.displayed = true;
                this.viewedComments[comment._id] = true;

                this.shownComments++;
            }

            /**
             * Remove old comments from the queue to not waste drawing
             */
            if (this.commentQueue.length >= this.commentLimit) {
                this.commentQueue.splice(0, this.commentQueue.length - this.commentLimit);
                // console.debug( 'Comments overflowing, delete', this.commentQueue.length, this.commentQueue.length - this.commentLimit );
            }

            // if (Object.keys(this.viewedComments).length > this.commentLimit * 10) {
            //     this.viewedComments = {};
            // }

            /**
             * Scroll to bottom of chat window
             * @todo: check why this doesn't work anymore
             */
            // const commentsDiv = this.$refs.comments as HTMLElement;
            // if (commentsDiv) {
            //     commentsDiv.scrollTop = commentsDiv.scrollHeight;
            // }
            if (this.chatbox) {
                nextTick(() => {
                    if (this.chatbox){ 
                        this.chatbox.scrollToBottom();
                    } else {
                        console.warn('chatbox is null');
                    }
                });
            }

            // console.debug("Tick finished", Date.now() - tickStart, "Previous tick", Date.now() - this.previousTick);

            // this.previousTick = Date.now();

            // window.requestAnimationFrame(this.tick.bind(this));

            // this.shownComments++;

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
        },

        async resetChat(): Promise<void> {
            if (!chatLog) return;
            if (!this.embedPlayer) return;
            console.debug("Reset chat");

            // if (this.elements.comments) this.elements.comments.innerHTML = "";

            this.stopTicker();

            console.debug(`Resetting queue, still ${this.commentQueue.length} comments.`);
            this.commentQueue = [];

            console.debug(`Resetting viewed comments, ${this.shownComments} comments.`);
            this.viewedComments = {};
            this.shownComments = 0;

            const currentTime = await this.embedPlayer.getCurrentTime();
            if (!currentTime) return;

            console.debug(`Resetting chat, current time: ${currentTime}`);
            /*
            for (let i = 0; i < this.commentAmount; i++) {
                if (chatLog.comments[i].content_offset_seconds < currentTime) continue;
                this.shownComments = i;
                break;
                // this.viewedComments[comment._id] = true;
            }
            */
            const lastComment = chatLog.comments.findIndex((c) => c.content_offset_seconds >= currentTime);
            if (lastComment > 0) {
                this.shownComments = lastComment;
            }

            console.debug(`At ${currentTime} seconds, ${this.shownComments} comments viewed.`);

            this.startTicker();

            /*
            if (this.commentAmount) {
                console.debug(`Reset ${this.commentAmount} comments`);
                for (let i = 0; i < this.commentAmount; i++) {
                    const comment = chatLog.comments[i];
                    comment.displayed = false;
                }
            } else {
                console.debug(`No comment queue`);
            }
            */
        },

        async savePlaybackPosition(): Promise<void> {

            const currentTime = await this.embedPlayer?.getCurrentTime();
            if (!currentTime) {
                console.warn("Could not get current time");
                return;
            }

            const video = this.video_id;
            if (!video) {
                console.warn("Could not get video id");
                return;
            }

            const raw_data = localStorage.getItem(playbackPositionKeyName);

            let data: Record<string, number> = {};

            if (raw_data) {
                try {
                    data = JSON.parse(raw_data);
                } catch (e) {
                    console.error("Error parsing playbackPosition", e);
                }
            }

            data[video] = Math.floor(currentTime);

            localStorage.setItem(playbackPositionKeyName, JSON.stringify(data));

            console.debug("Saved playback position", currentTime, "for", video);

        },

        async loadPlaybackPosition(): Promise<void> {

            const video = this.video_id;
            if (!video) {
                console.warn("Could not get video id");
                return;
            }

            const raw_data = localStorage.getItem(playbackPositionKeyName);

            let data: Record<string, number> = {};

            if (raw_data) {
                try {
                    data = JSON.parse(raw_data);
                } catch (e) {
                    console.error("Error parsing playbackPosition", e);
                }
            }

            const currentTime = data[video];

            if (!currentTime) {
                console.debug("No playback position found for", video);
                return;
            }

            console.log("Loaded playback position", currentTime, "for", video);

            await this.seek(currentTime);

        },

    },
    computed: {
        commentsStyle(): Record<string, string> {
            return {
                top: `${this.store.settings.chatTop}%`,
                bottom: `${this.store.settings.chatBottom}%`,
                width: `${this.store.settings.chatWidth}%`,
                fontSize: `${this.store.settings.fontSize}px`,
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
                "selectable": this.store.settings.chatSelectable,
            };
        },
        videoLoaded(): boolean {
            return this.video_source !== null && this.videoLoadSource !== '';
        },
        canStartPlayback(): boolean {
            return this.videoLoaded && this.chatLoaded;
        },
        // shownComments(): number {
        //     return Object.keys(this.viewedComments).length;
        // },
    },
    components: {
        ChatMessage,
        VideoControls,
        VideoPlayerHTML5,
        ChatBox,
        VideoPlayerTwitch,
        VideoPlayerYouTube
    },
    watch: {
        chat_source() {
            console.log("chat_source on vodplayer changed", this.chat_source);
        },
        chatLoadSource() {
            console.log("chatLoadSource on vodplayer changed", this.chatLoadSource);
            if (this.chatLoadSource !== '' && this.chat_source === 'file_http') {
                this.loadChatFileFromURL(this.chatLoadSource);
            }
        }
    },
});
</script>

<style lang="scss" scoped>

.viewer-container {
	position: relative;
	display: flex;
	width: 100%;
	aspect-ratio: 16 / 9;
	overflow: hidden;
	&.ultrawide {
		aspect-ratio: 21 / 9;
		#comments {
			width: 31% !important;
		}
	}
	&.chat-side-left {
		flex-direction: row-reverse;
	}
}

#player {

	width: 100%;
	// height: $height;

	aspect-ratio: 16 / 9;

	position: relative;

	overflow: hidden;

	height: fit-content; // ?

	margin: auto;

	// pointer-events: none; // smart?

}

#player:fullscreen {
	width: 100%;
	height: 100%;
}

#video {
	width: 100%;
	height: 100%;
	/* background: #3D4470; */
	background: #f0f;
}

#video_container {
	width: 100%;
	aspect-ratio: 16 / 9;
	// height: 100%;
	video {
		width: 100%;
		height: 100%;
	}
	iframe {
		pointer-events: none; // maybe
	}
}

#osd {
	display: none;
	position: absolute;
	left: 640px;
	top: 360px;
	background: #f00;
	color: #fff;
	padding: 10px;
	font-family: Consolas, monospace;
}

#osd.running {
	background: #00f;
}


.debug {
	display: none;
	font-size: 80%;
	color: #fff;
	background-color: #980c0c;
	padding: 1em;
}

</style>