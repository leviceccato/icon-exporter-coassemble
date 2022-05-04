import { reactive, readonly } from 'vue'

const state = reactive<{ event: MessageEvent | null }>({
    event: null
})

window.onmessage = event => state.event = event

const actions = {}

export const store = readonly({ state, ...actions })