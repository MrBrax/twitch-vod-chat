<template>
  <img v-if="badge" class="badge" v-bind:src="badge.url" />
</template>

<script lang="ts">
import { defineComponent } from "@vue/runtime-core";
import { TwitchUserBadgeProxy } from "../defs";

export default defineComponent({
  name: "ChatBadge",
  props: {
    badge: Object as () => TwitchUserBadgeProxy,
  },
});
</script>
