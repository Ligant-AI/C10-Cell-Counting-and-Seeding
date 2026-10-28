import { FR_LABELS } from './text.js';
const NS = 'http://www.w3.org/2000/svg';
const s = (tag, attrs = {}, text) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs))
        n.setAttribute(k, v);
    if (text !== undefined)
        n.textContent = text;
    return n;
};
export function chamberVisual(chosen) {
    const svg = s('svg', { class: 'fr-grid', viewBox: '0 0 330 180', role: 'img', 'aria-label': `Fuchs-Rosenthal grid: one large square of 16 small squares. Large square ${FR_LABELS.large}, small square ${FR_LABELS.small}.` });
    const x0 = 10;
    const y0 = 10;
    const cell = 40;
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const mark = chosen === '0.0625' && r === 0 && c === 0;
            svg.append(s('rect', { class: mark ? 'cell chosen' : 'cell', x: x0 + c * cell, y: y0 + r * cell, width: cell, height: cell }));
        }
    }
    svg.append(s('rect', { class: chosen === '1' ? 'big chosen' : 'big', x: x0, y: y0, width: cell * 4, height: cell * 4 }));
    svg.append(s('text', { class: chosen === '1' ? 'lbl chosen' : 'lbl', x: 185, y: 70 }, `large square: ${FR_LABELS.large}`));
    svg.append(s('text', { class: chosen === '0.0625' ? 'lbl chosen' : 'lbl', x: 185, y: 120 }, `small square: ${FR_LABELS.small}`));
    svg.append(s('line', { class: 'ptr', x1: 180, y1: 116, x2: 52, y2: 30 }));
    return svg;
}
