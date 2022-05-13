<template>
    <div
        id="viewer"
        :class="{
            'viewer-container': true,
            ultrawide: store.settings.ultrawide,
        }"
    >
        <div ref="player" id="player">
            <div v-show="videoLoaded" id="video_container"></div>

            <div v-if="!videoLoaded" class="meme-bg">
                <div v-if="!videoLoaded" class="meme">
                    <img src="https://i.imgur.com/YmMUr7z.gif" rel="noreferrer" />
                </div>
            </div>

            <div v-if="store.settings.chatOverlay" id="comments" :class="commentsClass" :style="commentsStyle">
                <chat-message
                    v-for="message in commentQueue"
                    v-bind:message="message"
                    v-bind:key="message.gid"
                    :data-id="message.gid"
                ></chat-message>
            </div>

            <div id="osd">SYNC NOT STARTED</div>
        </div>
        <div v-if="!store.settings.chatOverlay" id="comments" :class="commentsClass" :style="commentsStyle">
            <chat-message
                v-for="message in commentQueue"
                v-bind:message="message"
                v-bind:key="message.gid"
                :data-id="message.gid"
            ></chat-message>
        </div>
        <video-controls :minimal="true" v-if="store.minimal" />
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

    <video-controls v-if="!store.minimal" />

</template>

<script lang="ts">
import { defineComponent } from "@vue/runtime-core";
import ChatMessage from "@/components/ChatMessage.vue";
import VideoControls from "@/components/VideoControls.vue";
import { useStore } from "@/store";
import { TwitchCommentDump, TwitchCommentProxy, TwitchUserBadge } from "@/defs";
import BaseEmoteProvider from "@/emoteproviders/base";
import BTTVChannelEmoteProvider from "@/emoteproviders/bttv_channel";
import BTTVGlobalEmoteProvider from "@/emoteproviders/bttv_global";
import FFZEmoteProvider from "@/emoteproviders/ffz";
import SevenTVEmoteProvider from "@/emoteproviders/seventv";
import DashboardVue from "./Dashboard.vue";

let chatLog: TwitchCommentDump[] = []; // decouple from vue for performance

export default defineComponent({
    name: "VODPlayer",
    setup() {
        const store = useStore();
        return { store };
    },
    // props: {
    //     dashboard: {
    //         type: DashboardVue,
    //     },
    // },
    data(): {
        videoLoaded: boolean;
        videoPosition: number;
        videoCurrentTime: number;
        videoDuration: number;
        videoChapters: any[];
        vodLength?: number;
        playback_text: string; // TODO: remove
        commentQueue: TwitchCommentProxy[];
        isPlaying: boolean;
        isPaused: boolean;
        isReady: boolean;
        embedPlayer: any; // TODO: remove
        automated: boolean;
        emotes: Record<string, BaseEmoteProvider>;
        badges: {
            global: Record<string, TwitchUserBadge>;
            channel: Record<string, TwitchUserBadge>;
        };
        tickDelay: number;
        commentLimit: number;
        archiveLength?: number;
        channelName: string;
    } {
        return {
            videoLoaded: false,
            videoPosition: 0,
            videoCurrentTime: 0,
            videoDuration: 0,
            videoChapters: [],
            vodLength: undefined,
            playback_text: "",
            commentQueue: [],
            isPlaying: false,
            isPaused: false,
            isReady: false,
            embedPlayer: null,
            automated: false,
            emotes: {},
            badges: {
                global: {},
                channel: {},
            },
            tickDelay: 0,
            commentLimit: 0,
            archiveLength: undefined,
            channelName: "",
        };
    },
    mounted() {
        this.setupVodPlayer();    
    },
    methods: {
        setupVodPlayer() {
            chatLog = [];
            this.automated = false;

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

            this.tickDelay = 50;
            // this.timeScale = 1;
            this.commentLimit = 50;

            this.vodLength = undefined;
            this.archiveLength = undefined;
            this.channelName = "";

            
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
    },
    components: {
        ChatMessage,
        VideoControls,
    },
});
</script>
