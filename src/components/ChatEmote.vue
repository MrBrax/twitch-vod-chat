<template>
    <img v-if="emote" v-bind:class="classObject" v-bind:src="emote.url" />
</template>

<script lang="ts">
import { useTVC } from "@/store";
import { defineComponent } from "vue";
import { ChatEmote } from "../defs";

export default defineComponent({
    name: "ChatEmote",
    props: {
        emote: Object as () => ChatEmote,
    },
    setup() {
        const store = useTVC();
        return { store };
    },
    computed: {
        classObject(): Record<string, boolean> | null {
            if (!this.emote) return null;
            let c = {
                emote: true,
                ["network-" + this.emote.network]: true,
                "is-small": this.store.settings.value.smallEmotes,
            };
            if (this.emote.class !== undefined) c[this.emote.class] = true;
            return c;
        },
    },
});
</script>
