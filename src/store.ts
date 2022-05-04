import { reactive, readonly } from 'vue'

interface State {
    event?: MessageEvent
}

const _state: State = reactive({
    event: undefined
})

window.onmessage = event => _state.event = event

export const state = readonly(_state)

export const actions = readonly({})