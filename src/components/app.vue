<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import copy from 'copy-text-to-clipboard'
import { state } from '../store'
import { optimize, OptimizeOptions } from 'svgo/dist/svgo.browser'
import testSvg from '../test-svg.svg?raw'

const MIN_ICON_PRECISION = 1
const MAX_ICON_PRECISION = 5
const DEFAULT_ICON_PRECISION = 2
const DEFAULT_SHOULD_REMOVE_STROKE_AND_FILL = true

const shouldRemoveStrokeAndFill = ref(DEFAULT_SHOULD_REMOVE_STROKE_AND_FILL)
const iconName = ref('')
const iconPrecision = ref(DEFAULT_ICON_PRECISION)
const svg = ref('')
const optimisedSvg = ref('')
const svgHost = ref<HTMLDivElement | null>(null)
const optimisedSvgHost = ref<HTMLDivElement | null>(null)
const optimisedSvgDefs = ref<HTMLDivElement | null>(null)
const showCopyNotification = ref(false)

let copyNotifcationTimer: ReturnType<typeof setTimeout>

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
    setIconName()
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
    svg.value = testSvg
}

const setIconName = () => {
    let newIconName = ''

    const idEl = svgHost.value?.querySelector('[id]')
    if (idEl) {
        newIconName = idEl.getAttribute('id') || ''
    }

    if (newIconName === '') return
    iconName.value = newIconName.replace(/icon/gi, '').trim()
}

const setOptimisedSvg = () => {
    let config: OptimizeOptions = {
        multipass: false,
        plugins: [
            'removeDoctype',
            'removeXMLNS',
            'removeDimensions',
            'removeComments',
            'removeMetadata',
            'removeEditorsNSData',
            'cleanupAttrs',
            'mergeStyles',
            'inlineStyles',
            'minifyStyles',
            'cleanupIDs',
            'removeUnusedNS',
            'convertColors',
            'removeUnknownsAndDefaults',
            'removeNonInheritableGroupAttrs',
            'cleanupEnableBackground',
            'removeHiddenElems',
            'removeEmptyText',
            'convertShapeToPath',
            'moveElemsAttrsToGroup',
            'moveGroupAttrsToElems',
            'collapseGroups',
            'convertEllipseToCircle',
            'convertTransform',
            'removeEmptyAttrs',
            'removeEmptyContainers',
            'mergePaths',
            'removeUnusedNS',
            'sortDefsChildren',
            'removeDesc',
            'removeTitle',
            {
                name: 'convertPathData',
                params: {
                    floatPrecision: iconPrecision.value
                }
            }
        ]
    }

    if (shouldRemoveStrokeAndFill.value) {
        config.plugins?.push({
            name: 'removeAttrs',
            params: {
                attrs: '(fill|stroke)'
            }
        })
    }

    const svgoOutput = optimize(svg.value, config);

    if (svgoOutput.error === undefined) {
        optimisedSvg.value = svgoOutput.data
        applyPostTransforms()
    }
}

const applyPostTransforms = async () => {
    await nextTick()

    const defs = optimisedSvgDefs.value
    if (!defs) return

    const svgEl = defs.querySelector('svg')
    if (!svgEl) return

    const symbolEl = document.createElementNS('http://www.w3.org/2000/svg', 'symbol')
    symbolEl.id = iconId.value
    symbolEl.setAttribute('role', 'img')
    symbolEl.setAttribute('aria-label', `${iconName.value} Icon`)
    symbolEl.setAttribute('viewBox', svgEl.getAttribute('viewBox') || '')
    symbolEl.innerHTML = svgEl.innerHTML

    const fill = svgEl.getAttribute('fill')
    if (fill) {
        symbolEl.setAttribute('fill', fill)
    }

    const stroke = svgEl.getAttribute('stroke')
    if (stroke) {
        symbolEl.setAttribute('stroke', stroke)
    }

    defs.replaceChild(symbolEl, svgEl)
}

const copyCode = async () => {
    const symbolEl = optimisedSvgDefs.value?.querySelector('symbol')
    if (!symbolEl) return

    copy(symbolEl.outerHTML)

    clearTimeout(copyNotifcationTimer)
    showCopyNotification.value = true
    copyNotifcationTimer = setTimeout(() => {
        showCopyNotification.value = false
    }, 1_500)
}

watch(svg, async () => {
    await nextTick()

    setIconName()
    setOptimisedSvg()
})

watch([iconPrecision, shouldRemoveStrokeAndFill], () => {
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
    <svg :class="$style.optimisedSvgDefs">
        <defs
            ref="optimisedSvgDefs"
            v-html="optimisedSvg"
        />
    </svg>
    <div :class="$style.canvas">
        <div
            v-if="svg"
            :class="$style.svgHost"
            ref="svgHost"
            v-html="svg"
        />
        <svg
            v-if="optimisedSvg"
            :class="$style.optimisedSvgHost"
        >
            <use :xlink:href="`#${iconId}`" />
        </svg>
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
            <div :class="[$style.resetButton, 'icon-button']" @click="reset">
                <div class="icon icon--reverse"></div>
            </div>
            <button
                class="button button--primary"
                :disabled="!isValid"
                @click="copyCode"
            >
                <span :class="[$style.copyButtonTextContainer, { [$style.notify]: showCopyNotification }]">
                    <span :class="$style.copyButtonTextMain">
                        Copy code
                    </span>
                    <span :class="$style.copyButtonTextTemp">
                        Copied!
                    </span>
                </span>
            </button>
            <button class="button button--secondary" @click="cancel">Cancel</button>
        </div>
    </div>
</template>

<style lang="scss">
@use 'figma-plugin-ds/dist/figma-plugin-ds.css';

@font-face {
    font-family: 'Roboto Mono';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url(https://fonts.gstatic.com/s/robotomono/v21/L0xuDF4xlVMF-BfR8bXMIhJHg45mwgGEFl0_3vq_ROW-AJi8SJQt.woff) format('woff');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

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
    height: 192px;
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
        start-colour: rgba(0 0 0 / 0.5),
        end-colour: rgba(0 0 0 / 0)
    ));
}
.svgHost {
    opacity: 0;
    position: absolute;
}
.optimisedSvgHost {
    width: 80%;
    height: 80%;
    fill: currentColor;
}
.optimisedSvgDefs { display: none; }
.copyButtonTextContainer {
    position: relative;
    &.notify {
        .copyButtonTextMain { opacity: 0; }
        .copyButtonTextTemp { opacity: 1; }
    }
}
.copyButtonTextTemp {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
}
.resetButton { margin-right: auto; }
</style>