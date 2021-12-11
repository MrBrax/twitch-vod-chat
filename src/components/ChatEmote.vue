<template>
    <img v-bind:class="classObject" v-bind:src="emote.url" >
</template>

<script lang="ts">
import { ChatEmote } from '../defs';

export default {
    name: 'ChatEmote',
    props: {
        emote: Object as () => ChatEmote,
    },
    computed: {
        classObject(){
            return {
                'emote': true,
                ['network-' + this.emote.network]: true,
                [this.emote.class]: true,
                'is-small': this.$root.vp.settings.smallEmotes
            }
        }
    }
}
</script>