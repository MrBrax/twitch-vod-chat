<template>
    <div class="comment" v-if="vp && message">
        <span class="time" v-if="vp.settings.timestampsEnabled">{{ message.time }}</span>
        <span class="badges" v-if="vp.settings.badgesEnabled">
            <ChatBadge v-for="(badge, id) in message.badges" v-bind:key="id" v-bind:badge="badge" v-bind:vp="vp"></ChatBadge>
        </span>
        <span class="name" v-bind:style="{ color: message.usernameColour }">{{ message.username }}:</span>
        <span class="body">
            <span v-for="(frag, id) in message.messageFragments" v-bind:key="id">
                <span v-if="frag.type == 'text'">{{ frag.data }}</span>
                <ChatEmote v-if="frag.type == 'emote' && vp.settings.emotesEnabled" v-bind:emote="frag.data" v-bind:vp="vp"></ChatEmote>
                <span v-if="frag.type == 'emote' && !vp.settings.emotesEnabled">{{ frag.data.name }}</span>
            </span>
        </span>
    </div>
</template>

<script lang="ts">

import ChatEmote from './ChatEmote.vue';
import ChatBadge from './ChatBadge.vue';
import { TwitchCommentProxy } from '../defs';
import VODPlayer from '@/vodplayer';

export default {
    name: 'ChatMessage',
    components: {
        ChatEmote,
        ChatBadge
	},
    props: {
        vp: Object as () => VODPlayer,
        message: Object as () => TwitchCommentProxy
    },

}
</script>