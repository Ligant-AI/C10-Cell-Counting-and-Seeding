import { emptyInputs, compute } from './model.js';
import { exportAllowed, toNotebook, toCsv, toJson } from './exports.js';
import { TEXT, CHAMBERS, SAMPLE_SOURCES, METHODS, MSF_LINES, WHY_WE_ASK, WORKING, FR_ILLUSTRATION, BORDER_RULE_QUOTE, NEUBAUER_LINES, WIKI_SOURCE, CODE_URL } from './text.js';
import { buildWorking } from './working.js';
import { chamberVisual } from './chamber.js';
const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (k === 'class')
            n.className = v;
        else if (k === 'text')
            n.textContent = v;
        else
            n.setAttribute(k, v);
    }
    for (const c of kids)
        n.append(c);
    return n;
};
export const WORKED_EXAMPLE = Object.freeze({
    chamber: 'neubauer', square: '1', d: '0.1',
    live: ['86', '94', '90', '90'], dead: ['8', '12', '10', '10'],
    P: '2', method: 'trypan blue', timing: 'after', Vsusp: '5', rho: '2e5', Vfinal: '10', N: '5', Vnew: '10',
});
export function mount(root) {
    const inp = emptyInputs();
    const results = el('section', { class: 'panel', id: 'results', 'aria-live': 'polite' });
    const form = el('section', { class: 'panel', id: 'form' });
    const kept = el('div', { class: 'kept-in-view', id: 'kept-in-view' });
    root.append(el('div', { class: 'layout' }, form, el('div', { class: 'results-col' }, kept, results)));
    let dilutionP = null;
    const refresh = () => {
        render(results, inp, kept);
        if (dilutionP) {
            const l = compute(inp).dilutionLine;
            dilutionP.textContent = l || '';
            dilutionP.hidden = !l;
        }
    };
    const bind = (input, key) => { input.addEventListener('input', () => { inp[key] = input.value; refresh(); }); return input; };
    const field = (label, key, { unit = '', type = 'text', help = '' } = {}) => {
        const id = `f-${key}`;
        const input = el('input', { id, type, autocomplete: 'off', inputmode: 'decimal' });
        input.value = inp[key];
        bind(input, key);
        return el('div', { class: 'field' }, el('label', { for: id, text: label }), input, unit ? el('span', { class: 'unit', text: unit }) : '', help ? el('p', { class: 'help', text: help }) : '');
    };
    const select = (label, key, options, onChange) => {
        const id = `f-${key}`;
        const s = el('select', { id }, el('option', { value: '', text: 'Choose...' }));
        for (const [v, t] of options)
            s.append(el('option', { value: v, text: t }));
        s.value = inp[key];
        s.addEventListener('change', () => { inp[key] = s.value; if (onChange)
            onChange(); refresh(); });
        return el('div', { class: 'field' }, el('label', { for: id, text: label }), s);
    };
    const build = () => {
        form.replaceChildren();
        form.append(el('div', { class: 'panel-head' }, el('h2', { text: 'Your count' }), Object.assign(el('button', { type: 'button', id: 'load-example', text: 'Load worked example' }), {
            onclick: () => { Object.assign(inp, emptyInputs(), WORKED_EXAMPLE, { live: [...WORKED_EXAMPLE.live], dead: [...WORKED_EXAMPLE.dead] }); build(); refresh(); },
        })));
        form.append(el('p', { class: 'help', text: `Worked example: ${TEXT.illustration}.` }));
        form.append(select('Chamber', 'chamber', Object.entries(CHAMBERS).map(([k, c]) => [k, c.name]), () => {
            inp.square = '';
            inp.d = CHAMBERS[inp.chamber] ? CHAMBERS[inp.chamber].depth : '';
            build();
        }));
        const ch = CHAMBERS[inp.chamber];
        if (inp.chamber === 'other') {
            form.append(field('Square area (mm²)', 'A', { unit: 'mm²' }), field('Chamber depth (mm)', 'd', { unit: 'mm' }), el('p', { class: 'help', text: TEXT.otherChamber }));
        }
        else if (ch) {
            const labels = ch.squareLabels || {};
            form.append(select('Square counted', 'square', ch.squares.map((a) => [a, labels[a] || `${a} mm²`])));
            form.append(field('Chamber depth (mm)', 'd', { unit: 'mm', help: 'Read the depth engraved on your own chamber and confirm it against the preset.' }));
            if (inp.chamber === 'fuchs-rosenthal') {
                form.append(el('ul', { class: 'quote' }, ...MSF_LINES.map((l) => el('li', { text: l }))));
            }
            if (inp.chamber === 'neubauer') {
                form.append(el('ul', { class: 'quote', id: 'neubauer-quote' }, ...NEUBAUER_LINES.map((l) => el('li', { text: l }))), el('p', { class: 'help', text: WIKI_SOURCE }));
            }
        }
        form.append(el('p', { class: 'help why', 'data-why': 'chamber', text: WHY_WE_ASK.chamber }));
        form.append(select('Sample source', 'sampleSource', SAMPLE_SOURCES.map((s) => [s, s])));
        form.append(select('Border rule', 'borderRule', [['standard', 'cells touching the top and left lines counted, bottom and right excluded (as described in the source quoted)'], ['lab', 'my lab\'s rule']], build));
        form.append(el('blockquote', { class: 'quote-line', id: 'border-quote', text: BORDER_RULE_QUOTE }), el('p', { class: 'help', text: WIKI_SOURCE }));
        if (inp.borderRule === 'lab')
            form.append(field('Your lab\'s rule', 'borderRuleText'));
        form.append(el('h3', { text: 'Counts per square' }), el('p', { class: 'help', text: TEXT.oneLoading }));
        const grid = el('div', { class: 'counts' });
        inp.live.forEach((_, i) => {
            const l = el('input', { 'aria-label': `Live count, square ${i + 1}`, inputmode: 'numeric', autocomplete: 'off' });
            const d = el('input', { 'aria-label': `Dead count, square ${i + 1}`, inputmode: 'numeric', autocomplete: 'off' });
            l.value = inp.live[i];
            d.value = inp.dead[i];
            l.addEventListener('input', () => { inp.live[i] = l.value; refresh(); });
            d.addEventListener('input', () => { inp.dead[i] = d.value; refresh(); });
            grid.append(el('span', { text: `Square ${i + 1}` }), el('label', {}, 'live ', l), el('label', {}, 'dead ', d));
        });
        form.append(grid, Object.assign(el('button', { type: 'button', id: 'add-square', text: 'Add a square' }), { onclick: () => { inp.live.push(''); inp.dead.push(''); build(); refresh(); } }), Object.assign(el('button', { type: 'button', id: 'remove-square', text: 'Remove last square' }), { onclick: () => { if (inp.live.length > 1) {
                inp.live.pop();
                inp.dead.pop();
                build();
                refresh();
            } } }));
        dilutionP = el('p', { class: 'help', id: 'dilution-line', 'aria-live': 'polite', hidden: '' });
        form.append(el('h3', { text: 'Dilution' }), field('1 part cell suspension in ___ parts total', 'P', { unit: 'parts total' }), dilutionP, el('p', { class: 'help why', 'data-why': 'dilution', text: WHY_WE_ASK.dilution }), field('Dye name (optional)', 'dyeName'), field('Dye concentration (optional)', 'dyeConc'));
        form.append(el('p', { class: 'help why', 'data-why': 'method', text: WHY_WE_ASK.method }));
        form.append(select('Viability method', 'method', METHODS.map((m) => [m, m]), build));
        if (inp.method === 'flow viability dye')
            form.append(field('Name of the flow viability dye', 'methodDye'));
        form.append(field('Time from mixing to count (optional)', 'timeMin', { unit: 'min' }), field('Your own time limit (optional)', 'timeLimit', { unit: 'min' }));
        form.append(el('h3', { text: 'Suspension' }), field('Suspension volume (mL)', 'Vsusp', { unit: 'mL' }), select('This volume was measured', 'timing', [['before', 'before I took the counting sample'], ['after', 'after I took the counting sample']], build));
        form.append(el('p', { class: 'help why', 'data-why': 'aliquot', text: WHY_WE_ASK.aliquot }));
        if (inp.timing === 'before')
            form.append(field('Counting-sample volume (mL)', 'Valiquot', { unit: 'mL' }));
        form.append(el('h3', { text: 'Seeding' }), field('Target density (cells/mL)', 'rho', { unit: 'cells/mL', help: TEXT.densityUnits }), field('Final volume (mL)', 'Vfinal', { unit: 'mL' }));
        form.append(el('h3', { text: 'Split' }), field('1 part in ___ parts total (N)', 'N', { unit: 'parts total' }), field('New vessel total volume (mL)', 'Vnew', { unit: 'mL' }));
        form.append(el('h3', { text: 'Record' }), field('Sample ID', 'sampleId'), field('Analyst initials', 'initials'), field('Date and time', 'dateTime'), field('Checked by', 'checkedBy'), field('Chamber or equipment ID (optional)', 'equipmentId'));
    };
    build();
    refresh();
    return inp;
}
function workingPanel(inp, st) {
    const box = el('div', { class: 'working', id: 'working' }, el('h3', { text: WORKING.heading }));
    if (inp.chamber === 'fuchs-rosenthal')
        box.append(chamberVisual(inp.square), el('p', { class: 'working-line fr-illustration', text: FR_ILLUSTRATION }));
    for (const it of buildWorking(inp, st)) {
        const item = el('div', { class: 'working-item', 'data-working': it.id }, el('h4', { text: it.title }));
        for (const l of it.lines)
            item.append(el('p', { class: 'working-line', text: l }));
        if (it.note)
            item.append(el('p', { class: 'working-line working-note', text: it.note }));
        for (const q of it.quotes)
            item.append(el('blockquote', { class: 'quote-line', text: q.text }), el('p', { class: 'help', text: q.source }));
        if (it.x10)
            item.append(el('p', { class: 'x10-line', text: it.x10 }));
        box.append(item);
    }
    box.append(el('p', { class: 'engine', text: `Engine: ${st.engine.package} ${st.engine.version}.` }), el('p', { class: 'working-line' }, el('a', { href: CODE_URL, text: 'Read the code' })));
    return box;
}
function download(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = el('a', { href: url, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const INCOMPLETE_LEAD = 'No result is shown until these are entered or chosen:';
const figureKids = (r) => [`${r.label}: `, el('strong', { text: r.unit ? `${r.display} ${r.unit}` : r.display })];
const refusalKids = (r) => [el('strong', { text: r.code }), r.sentence ? ` ${r.sentence}` : ''];
function render(host, inp, kept) {
    const st = compute(inp);
    host.replaceChildren(el('div', { class: 'panel-head' }, el('h2', { text: 'Results' })));
    kept.replaceChildren();
    if (st.missing.length) {
        kept.append(el('p', { text: INCOMPLETE_LEAD }));
        host.append(el('p', { text: INCOMPLETE_LEAD }), el('ul', { id: 'incomplete' }, ...st.missing.map((m) => el('li', { text: m }))));
    }
    else {
        for (const sec of ['conc', 'viability', 'seeding']) {
            const s = st.sections[sec];
            if (!s)
                continue;
            for (const r of s.rows) {
                if (!['Clive', 'viability', 'Vseed'].includes(r.id))
                    continue;
                kept.append(el('p', { class: 'kept-line' }, ...figureKids(r)));
            }
        }
        for (const r of st.refusals)
            kept.append(el('p', { class: 'kept-line' }, ...refusalKids(r)));
        for (const f of st.flags)
            kept.append(el('p', { class: 'kept-line kept-flag', text: f.text }));
        const order = ['square', 'counts', 'conc', 'viability', 'cv', 'totals', 'seeding', 'split'];
        for (const k of order) {
            const s = st.sections[k];
            if (!s)
                continue;
            const box = el('div', { class: 'result', 'data-section': k });
            if (s.label && k !== 'cv')
                box.append(el('p', { class: 'label', text: s.label }));
            for (const r of s.rows)
                box.append(el('p', { 'data-id': r.id }, ...figureKids(r)));
            if (k === 'cv')
                box.append(el('p', { class: 'caveat', text: s.label }));
            for (const l of s.lines || [])
                box.append(el('p', { class: 'note', text: l }));
            host.append(box);
        }
        for (const f of st.flags)
            host.append(el('p', { class: 'flag', 'data-code': f.code, text: f.text }));
        for (const r of st.refusals) {
            host.append(el('p', { class: 'refusal', 'data-code': r.code }, ...refusalKids(r)));
        }
        if (st.pending.length)
            host.append(el('p', { class: 'pending', text: `Not yet entered: ${st.pending.join('; ')}` }));
        host.append(el('p', { class: 'declaration', text: TEXT.unitOfAnalysis }), el('p', { class: 'declaration', text: TEXT.liveDeadSorted }));
        host.append(workingPanel(inp, st));
    }
    const ok = exportAllowed(st);
    const bar = el('div', { class: 'exports' });
    for (const [label, fn, name, type] of [
        ['Notebook text', toNotebook, 'cell-count-record.txt', 'text/plain'],
        ['CSV', toCsv, 'cell-count-record.csv', 'text/csv'],
        ['JSON', toJson, 'cell-count-record.json', 'application/json'],
    ]) {
        const b = el('button', { type: 'button', text: `Export ${label}` });
        if (!ok)
            b.disabled = true;
        b.addEventListener('click', () => download(name, fn(inp, compute(inp)), type));
        bar.append(b);
    }
    host.append(bar);
}
