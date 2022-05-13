<template>
    <img v-if="emote" v-bind:class="classObject" v-bind:src="emote.url" />
</template>

<script lang="ts">
import { useStore } from "@/store";
import VODPlayer from "@/vodplayer";
import { defineComponent } from "@vue/runtime-core";
import { ChatEmote } from "../defs";

export default defineComponent({
    name: "ChatEmote",
    props: {
        emote: Object as () => ChatEmote,
    },
    setup() {
        const store = useStore();
        return { store };
    },
    computed: {
        classObject(): Record<string, boolean> | null {
            if (!this.emote) return null;
            let c = {
                emote: true,
                ["network-" + this.emote.network]: true,
                "is-small": this.store.settings.smallEmotes,
            };
            if (this.emote.class !== undefined) c[this.emote.class] = true;
            return c;
        },
    },
});
</script>
