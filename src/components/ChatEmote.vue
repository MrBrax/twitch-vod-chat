<template>
    <img v-if="emote" v-bind:class="classObject" v-bind:src="emote.url" >
</template>

<script lang="ts">
import VODPlayer from '@/vodplayer';
import { defineComponent } from '@vue/runtime-core';
import { ChatEmote } from '../defs';

export default defineComponent({
    name: 'ChatEmote',
    props: {
        vp: Object as () => VODPlayer,
        emote: Object as () => ChatEmote,
    },
    computed: {
        classObject(): Record<string, boolean> | null {
            if(!this.emote || !this.vp) return null;
            let c = {
                'emote': true,
                ['network-' + this.emote.network]: true,
                'is-small': this.vp.settings.smallEmotes
            };
            if(this.emote.class !== undefined) c[this.emote.class] = true;
            return c;
        }
    }
});
</script>