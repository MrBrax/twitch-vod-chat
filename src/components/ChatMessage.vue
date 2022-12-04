<template>
    <div class="comment" v-if="message">
        <span class="time" v-if="store.settings.value.timestampsEnabled">{{ message.time }}</span>
        <span class="badges" v-if="store.settings.value.badgesEnabled">
            <ChatBadge v-for="(badge, id) in message.badges" v-bind:key="id" v-bind:badge="badge"></ChatBadge>
        </span>
        <span class="name" v-bind:style="{ color: message.usernameColour }">{{ message.username }}:</span>
        <span class="body">
            <span v-for="(frag, id) in message.messageFragments" v-bind:key="id">
                <span v-if="frag.type == 'text'">{{ frag.data }}</span>
                <ChatEmote v-if="frag.type == 'emote' && store.settings.value.emotesEnabled" v-bind:emote="frag.data"></ChatEmote>
                <span v-if="frag.type == 'emote' && !store.settings.value.emotesEnabled">{{ frag.data.name }}</span>
            </span>
        </span>
    </div>
</template>

<script lang="ts">
import ChatEmote from "./ChatEmote.vue";
import ChatBadge from "./ChatBadge.vue";
import { TwitchCommentProxy } from "../defs";
import { useTVC } from "@/store";
import { defineComponent } from "vue";

export default defineComponent({
    name: "ChatMessage",
    setup() {
        const store = useTVC();
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
