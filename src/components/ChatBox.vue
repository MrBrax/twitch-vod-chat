<template>
    <TransitionGroup
        :name="store.settings.chatTransition ? 'comment' : ''"
        tag="div"
        id="comments"
        ref="comments"
        v-if="commentQueue"
        :class="commentsClass"
        :style="commentsStyle"
    >
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
    setup() {
        const store = useStore();
        return { store };
    },
    props: {
        commentsClass: Object as () => Record<string, boolean>,
        commentsStyle: Object as () => Record<string, string>,
        commentQueue: Array as () => Array<TwitchCommentProxy>,
    },
    data() {
        return {
            isDragging: false,
        };
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
        /*
        mouseDown(event: MouseEvent) {
            this.isDragging = true;
        },
        mouseUp(event: MouseEvent) {
            this.isDragging = false;
        },
        mouseMove(event: MouseEvent) {
            if (this.isDragging) {
                const comments = this.$el as HTMLDivElement;
                const rect = comments.getBoundingClientRect();
                const offset_y = event.clientY - rect.top;
                const offset_x = event.clientX - rect.left;
                this.store.settings.chatPositionX = offset_x;
                this.store.settings.chatPositionY = offset_y;
                console.log(`Chat position: ${offset_x}, ${offset_y}`);
            }
        },
        */
    },
});
</script>
