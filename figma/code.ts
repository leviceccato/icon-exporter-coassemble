/// <reference types="@figma/plugin-typings" />

figma.showUI(__html__, {
    width: 240,
    height: 600
})

figma.ui.onmessage = msg => {
    figma.closePlugin()
}

figma.on('selectionchange', async () => {
    const nodes = figma.currentPage.selection
    const type = 'set-svg'

    let payload: Uint8Array

    for (const node of nodes) {
        if (node.type === 'COMPONENT') {
            payload = await node.exportAsync({
                format: 'SVG',
                svgIdAttribute: true
            })
        }
    }

    figma.ui.postMessage({ type, payload })
})
