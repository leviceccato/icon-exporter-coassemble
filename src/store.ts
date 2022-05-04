import { ref, readonly } from 'vue'

const _state = {
    event: ref<MessageEvent>()
}

window.onmessage = event => _state.event.value = event

export const state = readonly(_state)

export const actions = readonly({})