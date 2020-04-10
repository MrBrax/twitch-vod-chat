<template>
    <div class="comment">
        <span class="time" v-if="$root.vp.settings.timestampsEnabled">{{ message.time }}</span>
        <span class="badges" v-if="$root.vp.settings.badgesEnabled">
            <ChatBadge v-for="(badge, id) in message.badges" v-bind:key="id" v-bind:badge="badge"></ChatBadge>
        </span>
        <span class="name" v-bind:style="{ color: message.usernameColour }">{{ message.username }}:</span>
        <span class="body">
            <span v-for="(frag, id) in message.messageFragments" v-bind:key="id">
                <span v-if="frag.type == 'text'">{{ frag.data }}</span>
                <ChatEmote v-if="frag.type == 'emote' && $root.vp.settings.emotesEnabled" v-bind:emote="frag.data"></ChatEmote>
                <span v-if="frag.type == 'emote' && !$root.vp.settings.emotesEnabled">{{ frag.data.name }}</span>
            </span>
        </span>
    </div>
</template>

<script>

import ChatEmote from './ChatEmote.vue'
import ChatBadge from './ChatBadge.vue'

export default {
    name: 'ChatMessage',
    components: {
        ChatEmote,
        ChatBadge
	},
    props: {
        message: Object
    },

}
</script>