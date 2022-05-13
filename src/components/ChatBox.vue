<template>
    <TransitionGroup name="comment" tag="div" id="comments" ref="comments" v-if="commentQueue" :class="commentsClass" :style="commentsStyle">
        <ChatMessage
            v-for="message in commentQueue"
            v-bind:message="message"
            v-bind:key="message.gid"
            :data-id="message.gid"
        />
    </TransitionGroup>
</template>

<script lang="ts">
import ChatEmote from "./ChatEmote.vue";
import ChatBadge from "./ChatBadge.vue";
import { TwitchCommentProxy } from "../defs";
import { useStore } from "@/store";
import ChatMessage from "./ChatMessage.vue";
import { defineComponent } from "vue";

export default defineComponent({
    name: "ChatBox",
    props: {
        commentsClass: Object as () => Record<string, boolean>,
        commentsStyle: Object as () => Record<string, string>,
        commentQueue: Array as () => Array<TwitchCommentProxy>,
    },
    components: {
        ChatMessage,
    },
    methods: {
        scrollToBottom() {
            const comments = this.$refs.comments as HTMLDivElement;
            if (comments) {
                comments.scrollTop = comments.scrollHeight;
            } else {
                console.error("No comments element found");
            }
        },
    },
});
</script>
