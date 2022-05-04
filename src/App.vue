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
    <div :class="$style.canvas" />
    <div :class="$style.divider" />
    <div :class="$style.container">
        <div :class="$style.form">
            <div :class="$style.input">
                <div class="type">Name</div>
                <div class="input">
                    <input
                        type="input"
                        class="input__field"
                        placeholder="Name"
                    >
                </div>
            </div>
            <div :class="$style.input">
                <div class="type">Options</div>
                <div class="checkbox">
                    <input
                        id="checkbox-remove-stroke-and-fill"
                        type="checkbox"
                        class="checkbox__box"
                        v-model="shouldRemoveStrokeAndFill"
                    >
                    <label 
                        for="checkbox-remove-stroke-and-fill"
                        class="checkbox__label"
                    >
                        Remove fill and stroke
                    </label>
                </div>
            </div>
            <div :class="$style.input">
                <div class="type">Precision</div>
                <div :class="$style.range">
                    <input
                        id="range-precision"
                        :class="$style.rangeMain"
                        type="range"
                    />
                </div>
            </div>
        </div>
    </div>
    <div :class="$style.divider" />
    <div :class="$style.container">
        <div :class="$style.row">
            <button class="button button--primary" @click="create">Copy code</button>
            <button class="button button--secondary" @click="cancel">Cancel</button>
        </div>
    </div>
</template>

<style>
@import 'figma-plugin-ds/dist/figma-plugin-ds.css';
</style>

<style module>
.container { padding: 16px; }
.row {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}
.divider {
    width: 100%;
    border-bottom: 1px solid var(--black1);
}
.form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.input {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.rangeMain {
    width: 100%;
}
.canvas {
    --square-size: 24px;
    --square-colour: rgb(246, 246, 246);
    height: 240px;
    background-image:
        linear-gradient(45deg, var(--square-colour) 25%, transparent 25%),
        linear-gradient(135deg, var(--square-colour) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, var(--square-colour) 75%),
        linear-gradient(135deg, transparent 75%, var(--square-colour) 75%);
    background-size: var(--square-size) var(--square-size);
    background-position: 0 0, calc(0.5 * var(--square-size)) 0, calc(0.5 * var(--square-size)) calc(-0.5 * var(--square-size)), 0 calc(0.5 * var(--square-size));
}
</style>