/// <reference types="@figma/plugin-typings" />

figma.showUI(__html__, {
    width: 264,
    height: 552
})

figma.ui.onmessage = msg => {
    figma.closePlugin()
}

const setSvg = async () => {
    let payload: Uint8Array

    for (const node of figma.currentPage.selection) {
        if ((node.type === 'COMPONENT') || (node.type === 'INSTANCE')) {
            payload = await node.exportAsync({
                format: 'SVG',
                svgIdAttribute: true
            })
            break
        }
    }

    figma.ui.postMessage({ type: 'set-svg', payload })
}

setSvg()
figma.on('selectionchange', setSvg)
