<template>
    <div class="comment" v-if="message">
        <span class="time" v-if="store.settings.timestampsEnabled">{{ message.time }}</span>
        <span class="badges" v-if="store.settings.badgesEnabled">
            <ChatBadge v-for="(badge, id) in message.badges" v-bind:key="id" v-bind:badge="badge"></ChatBadge>
        </span>
        <span class="name" v-bind:style="{ color: message.usernameColour }">{{ message.username }}:</span>
        <span class="body">
            <template v-for="(frag, id) in message.messageFragments" v-bind:key="id">
                <span v-if="frag.type == 'text'">{{ frag.data }}</span>
                <ChatEmote v-if="frag.type == 'emote' && store.settings.emotesEnabled" v-bind:emote="frag.data"></ChatEmote>
                <span v-if="frag.type == 'emote' && !store.settings.emotesEnabled">{{ frag.data.name }}</span>
            </template>
        </span>
    </div>
</template>

<script lang="ts">
import ChatEmote from "./ChatEmote.vue";
import ChatBadge from "./ChatBadge.vue";
import { TwitchCommentProxy } from "../defs";
import { store } from "@/store";
import { defineComponent } from "vue";

// TODO: make into render function
export default defineComponent({
    name: "ChatMessage",
    setup() {
        return { store };
    },
    components: {
        ChatEmote,
        ChatBadge,
    },
    props: {
        message: Object as () => TwitchCommentProxy,
    },
});
</script>

<style lang="scss" scoped>
@import "../style/animations";

.comment {
    // min-height: 20px;
    // flex-shrink: 0;

    // broken with vue, no animations supported
    // animation: slide 0.3s ease-out;
    // overflow: hidden;

    word-wrap: break-word;

    .time {
        color: #aaa;
        margin-right: 3px;
    }

    .badge {
        display: inline-block;
        margin: 0 3px;
        max-height: 18px;
    }

    .name {
        font-weight: 700;
        color: #ccc;
        padding-right: 0.3em;
    }

    // dirty hack
    .body {
        span {
            padding-right: 0.15rem; // padding between fragments
        }
    }

    .emote {

        max-height: 32px;

        &.is-small {
            max-height: 18px;
        }

    }

    img {
        vertical-align: middle;
    }

}
</style>
