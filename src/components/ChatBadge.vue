<template>
    <img class="badge" v-bind:src="badge.url" >
</template>

<script>
export default {
    name: 'ChatBadge',
    props: {
        badge: Object
    }
}
</script>