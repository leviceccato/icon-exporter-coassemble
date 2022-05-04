import { reactive, readonly } from 'vue'

const _state = reactive<{ event: MessageEvent | null }>({
    event: null
})

window.onmessage = event => _state.event = event

export const state = readonly(_state)

export const actions = readonly({})