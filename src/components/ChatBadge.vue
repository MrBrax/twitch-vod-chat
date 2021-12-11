<template>
    <img class="badge" v-bind:src="badge.url" >
</template>

<script lang="ts">
import { TwitchUserBadgeProxy } from '../defs';

export default {
    name: 'ChatBadge',
    props: {
        badge: Object as () => TwitchUserBadgeProxy
    }
}
</script>