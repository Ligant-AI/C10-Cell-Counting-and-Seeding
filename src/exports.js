import { TEXT, CHAMBERS, SOURCES, MSF_LINES, viabilityDenominator, EXPORT_STATEMENTS, NEUBAUER_LINES, BORDER_RULE_QUOTE, WIKI_SOURCE, TIMING_RECORD, WORKED_EXAMPLE, INDEPENDENT_VERIFICATION } from './text.js';
const MSF_SOURCE = 'MSF catalogue, Fuchs-Rosenthal chamber';
import { methodName } from './model.js';
export const exportAllowed = (state) => state.missing.length === 0;
const engineLine = (state) => `${state.engine.package} ${state.engine.version}`;
function entered(inp) {
    const ch = CHAMBERS[inp.chamber];
    const t = (v) => (v ?? '').toString().trim();
    const list = [
        ['sampleSource', 'sample source', t(inp.sampleSource), ''],
        ['chamber', 'chamber', ch ? ch.name : '', ''],
        ['A', 'square area', t(inp.chamber === 'other' ? inp.A : inp.square), 'mm²'],
        ['d', 'chamber depth', t(inp.d), 'mm'],
        ['borderRule', 'border rule', inp.borderRule === 'lab' ? `my lab's rule: ${t(inp.borderRuleText)}` : 'cells touching the top and left lines counted, bottom and right excluded (as described in the source quoted)', ''],
        ...inp.live.map((v, i) => [`live[${i + 1}]`, `live count, square ${i + 1}`, t(v), 'cells']),
        ...inp.dead.map((v, i) => [`dead[${i + 1}]`, `dead count, square ${i + 1}`, t(inp.dead[i]), 'cells']),
        ['P', '1 part cell suspension in ___ parts total', t(inp.P), 'parts'],
        ['dyeName', 'dye name (optional)', t(inp.dyeName), ''],
        ['dyeConc', 'dye concentration (optional)', t(inp.dyeConc), ''],
        ['method', 'viability method', methodName(inp), ''],
        ['timeMin', 'time from mixing to count (optional)', t(inp.timeMin), 'min'],
        ['timeLimit', 'your own time limit (optional)', t(inp.timeLimit), 'min'],
        ['Vsusp', 'suspension volume', t(inp.Vsusp), 'mL'],
        ['timing', 'suspension volume measured', TIMING_RECORD[t(inp.timing)] || t(inp.timing), ''],
        ['Valiquot', 'counting-sample volume', t(inp.Valiquot), 'mL'],
        ['rho', 'target density (cells per mL of final culture volume)', t(inp.rho), 'cells/mL'],
        ['Vfinal', 'final volume', t(inp.Vfinal), 'mL'],
        ['N', 'split: 1 part in N parts total', t(inp.N), 'parts'],
        ['Vnew', 'new vessel total volume', t(inp.Vnew), 'mL'],
        ['sampleId', 'sample ID', t(inp.sampleId), ''],
        ['initials', 'analyst initials', t(inp.initials), ''],
        ['dateTime', 'date and time', t(inp.dateTime), ''],
        ['checkedBy', 'checked by', t(inp.checkedBy), ''],
        ['equipmentId', 'chamber or equipment ID', t(inp.equipmentId), ''],
    ];
    return list.map(([id, label, value, unit]) => ({ id, label, value, unit, mark: 'E' }));
}
const REMOVED = [
    ['viabilityPassFail', 'viability pass or fail'], ['secondPersonReview', 'second-person review'],
    ['clumpDebrisLoadingDetection', 'clump, debris or bad-loading detection'], ['defaultCountWindow', 'default count window'],
].map(([id, label]) => ({ id, label, value: '', unit: '', mark: 'X', note: 'not produced by this tool' }));
export function buildRecord(inp, state) {
    const results = [];
    for (const [key, sec] of Object.entries(state.sections))
        for (const r of sec.rows)
            results.push({ section: key, ...r });
    const blocked = state.refusals.map((r) => ({ code: r.code, fields: r.fields, sentence: r.sentence }));
    const declarations = [
        TEXT.unitOfAnalysis, TEXT.liveDeadSorted, viabilityDenominator(methodName(inp)), TEXT.oneLoading, TEXT.densityUnits,
        ...(inp.chamber === 'other' ? [TEXT.otherChamber] : []),
    ];
    const quotes = [
        ...(inp.chamber === 'fuchs-rosenthal' ? MSF_LINES.map((text) => ({ text, source: MSF_SOURCE })) : []),
        ...(inp.chamber === 'neubauer' ? NEUBAUER_LINES.map((text) => ({ text, source: WIKI_SOURCE })) : []),
        ...(inp.borderRule === 'standard' ? [{ text: BORDER_RULE_QUOTE, source: WIKI_SOURCE }] : []),
    ];
    return {
        engineVersionLine: engineLine(state),
        engine: state.engine,
        header: { sampleSource: inp.sampleSource, researchUse: TEXT.researchUse },
        entered: entered(inp), removed: REMOVED, results, blocked,
        flags: state.flags, pending: state.pending, declarations,
        sources: SOURCES, quotes,
        workedExample: WORKED_EXAMPLE, independentVerification: INDEPENDENT_VERIFICATION,
        cvLabel: state.sections.cv ? state.sections.cv.label : null,
        guardrail: TEXT.guardrail, rounding: TEXT.rounding,
    };
}
const unitOf = (x) => (x.unit ? ` ${x.unit}` : '');
export function toNotebook(inp, state) {
    const r = buildRecord(inp, state);
    const L = [];
    L.push('Ligant · Cell Counting and Seeding: cell count and viability record');
    L.push(`Sample source: ${r.header.sampleSource}`);
    L.push(`Engine: ${r.engineVersionLine}`);
    L.push(TEXT.researchUse, '');
    L.push('Inputs (E = entered)');
    for (const e of r.entered)
        if (e.value)
            L.push(`  [E] ${e.label}: ${e.value}${unitOf(e)}`);
    L.push('', 'Declarations');
    for (const d of r.declarations)
        L.push(`  ${d}`);
    L.push('', 'Results (C = computed)');
    for (const x of r.results)
        L.push(`  [C] ${x.label}: ${x.display}${unitOf(x)}`);
    if (r.cvLabel)
        L.push(`  ${r.cvLabel}`);
    for (const b of r.blocked)
        L.push(`  Not computed (${b.code}): ${b.sentence || b.fields.join(', ')}`);
    if (r.flags.length) {
        L.push('', 'Flags');
        for (const f of r.flags)
            L.push(`  ${f.text}`);
    }
    L.push('', 'Removed from this tool (X)');
    for (const x of r.removed)
        L.push(`  [X] ${x.label}: ${x.note}`);
    L.push('', 'Sources quoted');
    for (const s of r.sources)
        L.push(`  ${s.name}: ${s.url}`);
    for (const k of r.quotes)
        L.push(`  ${k.source}: "${k.text}"`);
    L.push(r.workedExample, r.independentVerification);
    L.push('', r.rounding, r.guardrail);
    L.push(EXPORT_STATEMENTS.comparability);
    L.push(EXPORT_STATEMENTS.notProduced);
    L.push(`Engine: ${r.engineVersionLine}`, TEXT.researchUse);
    return L.join('\n');
}
const q = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
export function toCsv(inp, state) {
    const r = buildRecord(inp, state);
    const lines = [['field', 'label', 'mark', 'unrounded', 'display', 'unit', 'note'].join(',')];
    const add = (...c) => lines.push(c.map(q).join(','));
    add('engine', 'engine version', 'C', '', r.engineVersionLine, '', 'results from different engine versions are not comparable');
    add('sampleSource', 'sample source', 'E', '', r.header.sampleSource, '', '');
    for (const e of r.entered)
        add(e.id, e.label, e.mark, e.value, e.value, e.unit, '');
    for (const x of r.results)
        add(x.id, x.label, 'C', x.unrounded, x.display, x.unit, x.id === 'cvPercent' && r.cvLabel ? r.cvLabel : '');
    for (const b of r.blocked)
        add(b.code, b.fields.join(' '), 'C', '', b.sentence || b.code, '', 'not computed');
    for (const f of r.flags)
        add(f.code, 'flag', 'C', '', f.text, '', '');
    for (const x of r.removed)
        add(x.id, x.label, 'X', '', '', '', x.note);
    add('researchUse', 'research use', '', '', TEXT.researchUse, '', '');
    for (const d of r.declarations)
        add('declaration', 'declaration', '', '', d, '', '');
    for (const s of r.sources)
        add('source', s.name, '', '', s.url, '', '');
    for (const k of r.quotes)
        add('quote', k.source, '', '', k.text, '', '');
    add('rounding', 'rounding', '', '', r.rounding, '', r.guardrail);
    add('notProduced', '12.32(viii)', '', '', EXPORT_STATEMENTS.notProduced, '', '');
    return lines.join('\n');
}
export function toJson(inp, state) {
    const r = buildRecord(inp, state);
    return JSON.stringify({
        engine: r.engine,
        researchUse: TEXT.researchUse,
        sampleSource: r.header.sampleSource,
        entered: r.entered.filter((e) => e.value !== ''),
        declarations: r.declarations,
        results: r.results.map(({ id, label, unrounded, display, unit, mark }) => (id === 'cvPercent' && r.cvLabel
            ? { id, label, mark, unrounded, display, unit, note: r.cvLabel }
            : { id, label, mark, unrounded, display, unit })),
        blocked: r.blocked, flags: r.flags, removed: r.removed.map(({ id, label, mark, note }) => ({ id, label, mark, note })),
        sources: r.sources, quotes: r.quotes, workedExample: r.workedExample, independentVerification: r.independentVerification, rounding: r.rounding, guardrail: r.guardrail,
        comparability: EXPORT_STATEMENTS.comparability, notProduced: EXPORT_STATEMENTS.notProduced,
    }, null, 2);
}
