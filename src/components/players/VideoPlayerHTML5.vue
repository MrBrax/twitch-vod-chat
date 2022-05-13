<template>
    <video
        :src="videoUrl"
        :width="videoWidth"
        :height="videoHeight"
    ></video>
</template>

<script lang="ts">
import { defineComponent } from "@vue/runtime-core";

export default defineComponent({
    name: "VideoPlayerHTML5",
    data() {
        return {
            videoUrl: "",
            videoWidth: 0,
            videoHeight: 0,
        };
    },
});
</script>
