<template>
    <div
        class="app-main"
        :class="{
            'unlocked': store.unlockedWidth.value,
        }
    ">
        <VODPlayer
            ref="vodplayer"
            @ready="playerReady"
        />
        <PlayerControls
            v-if="vodplayer"
            :vodplayer="vodplayer"
            @submit-video="submitVideo"
            @submit-chat="submitChat"
        />
    </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { nextTick } from "vue";
import ChatMessage from "./components/ChatMessage.vue";
import VideoControls from "./components/VideoControls.vue";
import { ChatSource, VideoSource } from "./defs";
import VODPlayer from "./components/VODPlayer.vue";
import PlayerControls from "./components/PlayerControls.vue";
import { useTVC } from "./store";
import "./style/player.scss";

console.log("app.vue init");

export default defineComponent({
    name: "App",
    components: {
        ChatMessage,
        VideoControls,
        VODPlayer,
        PlayerControls,
        // Dashboard
    },
    setup() {
        const store = useTVC();
        const vodplayer = ref<InstanceType<typeof VODPlayer>>();
        return { store, vodplayer };
    },
    data(): {
        video_source: VideoSource;
        chat_source: ChatSource;
        input_video: string;
        input_chat: string;
        video_height: number;
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
                this.store.settings.value.twitchClientId = params.tci;
            }

            // twitch secret
            if (params.ts) {
                this.store.settings.value.twitchSecret = params.ts;
            }

            // token
            if (params.tk) {
                this.store.settings.value.twitchToken = params.tk;
            }

            if (params.offset) {
                vodplayer.chatOffset = parseInt(params.offset);
            }

            this.store.minimal.value = params.minimal !== undefined && parseInt(params.minimal) > 0;

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
                this.store.automated.value = true;
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
        submitVideo(source: string, input: string | File | undefined) {
            if (!this.vodplayer) return;
            console.log(this.$refs);
            this.vodplayer.loadVideo(this.video_source, input);
        },
        submitChat(source: string, input: string | File | undefined) {
            if (!this.vodplayer) return;
            console.log(this.$refs);
            this.vodplayer.loadChat(this.chat_source, input);
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
        playerReady() {
            if (!this.vodplayer) return;
            this.vodplayer.embedPlayer?.getDuration().then((duration) => {
                if (!this.vodplayer) return;
                console.debug("player ready", duration);
                this.vodplayer.status_video = `Ready, ${duration} seconds`;
            });
        },
    },
	watch: {
		video_source() {
            console.log("video_source", this.video_source, this.input_video);
        },
        chat_source() {
            console.log("chat_source", this.chat_source, this.input_chat);
        },
        "store.settings.ultrawide"(newVal) {
            if (newVal) {
                this.store.settings.value.chatOverlay = false;
            }
        },
        "store.settings.chatOverlay"(newVal) {
            if (newVal) {
                this.store.settings.value.ultrawide = false;
            }
        },
	},
});
</script>
