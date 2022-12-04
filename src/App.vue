<template>
    <Main />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Main from "./components/Main.vue";

export default defineComponent({
    name: "App",
    components: {
        Main,
    },
});
</script>

<style>
body.vodplayer-body {
    font: 12px 'Roboto', 'Open Sans', 'Arial';
	height: 100%;
	margin: 0;
	padding: 0;
	/* background: #0f0; */
	background: #111;
}
body.vodplayer-body * { box-sizing: border-box; }
</style>
