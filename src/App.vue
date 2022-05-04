<script setup lang="ts">
import { ref, watch } from 'vue'
import { state } from './store'

const count = ref(5)
const shouldRemoveStrokeAndFill = ref(true)
const iconName = ref('')

const create = () => {
    parent.postMessage({ pluginMessage: { type: 'create-rectangles', count: count.value } }, '*')
}

const cancel = () => {
    parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*')
}

watch(() => state.event, event => {
    console.log(event?.data.pluginMessage)
})
</script>

<template>
    <div :class="$style.container">
        <div class="type type--xlarge">Icon Exporter Coassemble</div>
        <div class="input input--with-icon">
            <div class="icon icon--angle" />
            <input type="input" class="input__field" placeholder="Placeholder">
        </div>
        <div class="label">Label</div>
        <div class="checkbox">
            <input id="uniqueId" type="checkbox" class="checkbox__box" v-model="shouldRemoveStrokeAndFill">
            <label for="uniqueId" class="checkbox__label">Remove fill and stroke</label>
        </div>
        <div :class="$style.row">
            <button class="button button--primary" @click="create">Copy as SVG</button>
            <button class="button button--secondary" @click="cancel">Cancel</button>
        </div>
    </div>
    <div :class="$style.canvas" />
</template>

<style>
@import 'figma-plugin-ds/dist/figma-plugin-ds.css';
</style>

<style module>
.container { padding: 8px; }
.row {
    display: flex;
    gap: 8px;
}
.divider {
    width: 100%;
    border-bottom: 1px solid var(--black1);
}
.canvas {
    --square-size: 25px;
    --square-colour: rgb(246, 246, 246);
    height: 200px;
    background-image:
        linear-gradient(45deg, var(--square-colour) 25%, transparent 25%),
        linear-gradient(135deg, var(--square-colour) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, var(--square-colour) 75%),
        linear-gradient(135deg, transparent 75%, var(--square-colour) 75%);
    background-size: var(--square-size) var(--square-size);
    background-position: 0 0, calc(0.5 * var(--square-size)) 0, calc(0.5 * var(--square-size)) calc(-0.5 * var(--square-size)), 0 calc(0.5 * var(--square-size));
}
</style>