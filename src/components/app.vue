<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import { state } from '../store'
import { optimize } from '../svgo'

const MIN_ICON_PRECISION = 1
const MAX_ICON_PRECISION = 5
const DEFAULT_ICON_PRECISION = 2
const DEFAULT_SHOULD_REMOVE_STROKE_AND_FILL = true

const TEST_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 7.00748C12.4142 7.00748 12.75 7.34327 12.75 7.75748V11.2501H16.2427C16.6569 11.2501 16.9926 11.5859 16.9927 12.0001C16.9926 12.4143 16.6569 12.7501 16.2427 12.7501H12.75V16.2428C12.75 16.657 12.4142 16.9928 12 16.9928C11.5858 16.9928 11.25 16.657 11.25 16.2428V12.7501H7.75737C7.34315 12.7501 7.00737 12.4143 7.00737 12.0001C7.00737 11.5859 7.34315 11.2501 7.75737 11.2501H11.25V7.75748C11.25 7.34327 11.5858 7.00748 12 7.00748Z" fill="#0F171F"/><path fill-rule="evenodd" clip-rule="evenodd" d="M5.10571 5.10583C1.2981 8.91344 1.2981 15.0868 5.10571 18.8944C8.91332 22.702 15.0867 22.702 18.8943 18.8944C22.7019 15.0868 22.7019 8.91344 18.8943 5.10583C15.0867 1.29822 8.91332 1.29822 5.10571 5.10583ZM6.16637 17.8338C2.94454 14.6119 2.94454 9.38832 6.16637 6.16649C9.38819 2.94467 14.6118 2.94467 17.8336 6.16649C21.0555 9.38832 21.0555 14.6119 17.8336 17.8338C14.6118 21.0556 9.38819 21.0556 6.16637 17.8338Z" fill="#0F171F"/></svg>`

const shouldRemoveStrokeAndFill = ref(DEFAULT_SHOULD_REMOVE_STROKE_AND_FILL)
const iconName = ref('')
const iconPrecision = ref(DEFAULT_ICON_PRECISION)
const svg = ref('')
const optimisedSvg = ref('')
const svgHost = ref<HTMLDivElement | null>(null)

const iconId = computed(() => {
    return `${kebab(iconName.value)}-icon`
})

const iconPrecisionProgress = computed(() => {
    return (iconPrecision.value - MIN_ICON_PRECISION) * (100 / (MAX_ICON_PRECISION - MIN_ICON_PRECISION));
})

const isValid = computed(() => {
    return (
        (iconName.value !== '') &&
        (optimisedSvg.value !== '')
    )
})

const reset = () => {
    iconPrecision.value = DEFAULT_ICON_PRECISION
    shouldRemoveStrokeAndFill.value = DEFAULT_SHOULD_REMOVE_STROKE_AND_FILL
}

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

const setTestSvg = () => {
    svg.value = TEST_SVG
}

const setIconName = () => {
    let newIconName = ''

    const idEl = svgHost.value?.querySelector('[id]')
    if (idEl) {
        newIconName = idEl.getAttribute('id') || ''
    }

    if (newIconName === '') return
    iconName.value = newIconName.replace(/icon/gi, '')
}

const setOptimisedSvg = () => {
    const svgoOutput = optimize(svg.value, {
        multipass: false
    });

    if (svgoOutput.error === undefined) {
        optimisedSvg.value = svgoOutput.data
    }
}

watch(svg, async () => {
    await nextTick()

    setIconName()
    setOptimisedSvg()
})

watch(() => state.event, event => {
    const data = event?.data.pluginMessage
    if (!data) return

    if (data.type === 'set-svg') {
        setSvg(data.payload)
    }
})
</script>

<template>
    <div :class="$style.canvas">
        <div
            v-if="svg"
            :class="$style.svgHost"
            ref="svgHost"
            v-html="svg"
        />
        <div
            v-if="optimisedSvg"
            :class="$style.optimisedSvgHost"
            ref="optimisedSvgHost"
            v-html="optimisedSvg"
        />
        <div
            v-if="!svg"
            :class="$style.canvasOverlay"
        >
            <div class="type type--inverse">Select an icon <br />component</div>
        </div>
    </div>
    <div :class="$style.divider" />
    <div :class="$style.container">
        <div :class="$style.input">
            <div class="type type--bold">Name</div>
            <div class="input">
                <input
                    type="input"
                    class="input__field"
                    placeholder="Checkered Flag"
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
            <div class="icon-button" @click="reset">
                <div class="icon icon--reverse"></div>
            </div>
            <button
                class="button button--primary"
                :disabled="!isValid"
                @click="void 0"
            >
                Copy code
            </button>
            <button class="button button--secondary" @click="setTestSvg">Cancel</button>
        </div>
    </div>
</template>

<style lang="scss">
@import 'figma-plugin-ds/dist/figma-plugin-ds.css';
@import 'https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap';

.type--fade { color: var(--black1); }
.type--mono { font-family: 'Roboto Mono', monospace; }
</style>

<style lang="scss" module>
@use '../styles/util.scss';

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
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
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
.canvasOverlay {
    text-align: center;
    color: var(--white);
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-repeat: no-repeat;
    background: util.eased-gradient((
        angle: 'circle at center',
        type: 'radial',
        start-colour: rgba(0 0 0 / 0.4),
        end-colour: rgba(0 0 0 / 0)
    ));
}
.svgHost { opacity: 0; }
</style>