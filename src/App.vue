<script setup lang="ts">
import { ref, watch } from 'vue'
import { store } from './store'

const count = ref(5)

const create = () => {
    parent.postMessage({ pluginMessage: { type: 'create-rectangles', count: count.value } }, '*')
}

const cancel = () => {
    parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*')
}

watch(() => store.state.event, event => {
    console.log(event?.data.pluginMessage)
})
</script>

<template>
    <h2>Rectangle Creator</h2>
    <p>Count: <input v-model="count" /></p>
    <div class="input input--with-icon">
        <div class="icon icon--angle" />
        <input type="input" class="input__field" placeholder="Placeholder">
    </div>
    <div class="label">Label</div>
    <div :class="$style.container">
        <button class="button button--primary" @click="create">Export</button>
        <button class="button button--secondary" @click="cancel">Cancel</button>
    </div>
</template>

<style>
@import 'figma-plugin-ds/dist/figma-plugin-ds.css';
</style>

<style module>
.container { display: flex; }
</style>