<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { state } from './store'

const MIN_ICON_PRECISION = 0
const MAX_ICON_PRECISION = 8

const shouldRemoveStrokeAndFill = ref(true)
const iconName = ref('')
const iconPrecision = ref(2)
const svg = ref('')

const iconId = computed(() => {
    return `${kebab(iconName.value)}-icon`
})

const iconPrecisionProgress = computed(() => {
    return (iconPrecision.value - MIN_ICON_PRECISION) * (100 / (MAX_ICON_PRECISION - MIN_ICON_PRECISION));
})

const kebab = (str: string): string => {
    const match = str.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    if (match === null) {
        return ''
    }

    return match.map(c => c.toLowerCase()).join('-')
}

const setSvg = (arr: Uint8Array) => {
    svg.value = new TextDecoder().decode(arr)
}

const cancel = () => {
    parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*')
}

watch(() => state.event, event => {
    const data = event?.data.pluginMessage
    if (!data) return

    switch (data.type) {
        case 'set-svg':
            setSvg(data.payload)
    }
})
</script>

<template>
    <div
        :class="$style.canvas"
        v-html="svg"
    />
    <div :class="$style.divider" />
    <div :class="$style.container">
        <div :class="$style.input">
            <div class="type type--bold">Name</div>
            <div class="input">
                <input
                    type="input"
                    class="input__field"
                    placeholder="checkered-flag"
                    v-model="iconName"
                >
            </div>
            <div>
                <span class="type">ID:</span> <span class="type type--mono">{{ iconId }}</span>
            </div>
        </div>
    </div>
    <div :class="$style.divider" />
    <div :class="$style.container">
        <div :class="$style.input">
            <div class="type type--bold">Options</div>
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
    </div>
    <div :class="$style.divider" />
    <div :class="$style.container">
        <div :class="$style.input">
            <div class="type type--bold">Precision</div>
            <div :class="$style.range">
                <input
                    id="range-precision"
                    :class="$style.rangeMain"
                    :max="MAX_ICON_PRECISION"
                    :min="MIN_ICON_PRECISION"
                    type="range"
                    :style="{ '--progress-percentage': String(iconPrecisionProgress) }"
                    v-model="iconPrecision"
                />
                <div class="type type--small">
                    {{ iconPrecision }}
                </div>
            </div>
        </div>
    </div>
    <div :class="$style.divider" />
    <div :class="$style.container">
        <div :class="$style.row">
            <div class="icon-button">
                <div class="icon icon--reverse"></div>
            </div>
            <button class="button button--primary" @click="void 0">Copy code</button>
            <button class="button button--secondary" @click="cancel">Cancel</button>
        </div>
    </div>
</template>

<style>
@import 'figma-plugin-ds/dist/figma-plugin-ds.css';
@import 'https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap';

.type--fade { color: var(--black1); }
.type--mono { font-family: 'Roboto Mono', monospace; }
</style>

<style lang="scss" module>
.container {
    padding: 16px;
}
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
.range {
    display: flex;
    align-items: center;
    gap: 16px;
}
.rangeMain {
    width: 100%;
    display: flex;
    margin: 0;
    height: 32px;
    -webkit-appearance: none;
    background: transparent;
    appearance: none;
    cursor: default;
    &::-webkit-slider-runnable-track {
        border: 1px solid var(--black);
        border-radius: 500px;
        height: 5px;
        background-image: linear-gradient(var(--black), var(--black));
        background-size: calc(var(--progress-percentage, 0) * 1%) 100%;
        background-repeat: no-repeat;
    }
    &::-moz-range-track {
        border: 1px solid var(--black);
        border-radius: 500px;
        height: 5px;
        background-image: linear-gradient(var(--black), var(--black));
        background-size: calc(var(--progress-percentage, 0) * 1%) 100%;
        background-repeat: no-repeat;
    }
    &::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        margin-top: -4.5px;
        background-color: var(--white);
        border: 1px solid var(--black);
        height: 12px;
        width: 12px;
        border-radius: 500px;
    }
    &::-moz-range-thumb {
        border: 1px solid var(--black);
        border-radius: 500px;
        background-color: var(--white);
        height: 12px;
        width: 12px;
    }
    &:focus {
        outline: none;
    }
}
.canvas {
    display: flex;
    align-items: center;
    justify-content: center;
    --square-size: 24px;
    --square-colour: rgb(246, 246, 246);
    height: 144px;
    background-image:
        linear-gradient(45deg, var(--square-colour) 25%, transparent 25%),
        linear-gradient(135deg, var(--square-colour) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, var(--square-colour) 75%),
        linear-gradient(135deg, transparent 75%, var(--square-colour) 75%);
    background-size: var(--square-size) var(--square-size);
    background-position: 0 0, calc(0.5 * var(--square-size)) 0, calc(0.5 * var(--square-size)) calc(-0.5 * var(--square-size)), 0 calc(0.5 * var(--square-size));
}
</style>