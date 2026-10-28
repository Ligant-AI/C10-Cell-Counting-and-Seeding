import { e9, e7, e10, version } from '@ligant/bench-engines';
import { TEXT, CHAMBERS, FIELD_LABELS, WHY, fl02, fl05, x10Line, dilutionLine, viabilityLabel } from './text.js';
export const emptyInputs = () => ({
    chamber: '', square: '', A: '', d: '',
    sampleSource: '', borderRule: '', borderRuleText: '',
    live: [''], dead: [''],
    P: '', dyeName: '', dyeConc: '',
    method: '', methodDye: '', timeMin: '', timeLimit: '',
    timing: '', Vsusp: '', Valiquot: '',
    rho: '', Vfinal: '', N: '', Vnew: '',
    sampleId: '', initials: '', dateTime: '', checkedBy: '', equipmentId: '',
});
const blank = (v) => v === null || v === undefined || String(v).trim() === '';
const DEC = /^\d+(\.\d+)?$/;
export const isDec = (s) => typeof s === 'string' && DEC.test(s);
export const isZeroDec = (s) => /^0+(\.0+)?$/.test(s);
export function cmpDec(a, b) {
    const [ai, af = ''] = a.split('.');
    const [bi, bf = ''] = b.split('.');
    const x = ai.replace(/^0+(?=\d)/, '');
    const y = bi.replace(/^0+(?=\d)/, '');
    if (x.length !== y.length)
        return x.length < y.length ? -1 : 1;
    if (x !== y)
        return x < y ? -1 : 1;
    const w = Math.max(af.length, bf.length);
    const fa = af.padEnd(w, '0');
    const fb = bf.padEnd(w, '0');
    return fa === fb ? 0 : (fa < fb ? -1 : 1);
}
export function normalise(v) {
    if (blank(v))
        return null;
    const s = String(v).trim();
    const m = /^([+-]?)(\d+)(?:\.(\d+))?(?:[eE]|[xX]10\^)([+-]?\d+)$/.exec(s);
    if (!m)
        return s;
    const shift = Number(m[4]);
    if (Math.abs(shift) > 30)
        return s;
    const frac = m[3] || '';
    let digits = m[2] + frac;
    let point = m[2].length + shift;
    if (point <= 0) {
        digits = '0'.repeat(1 - point) + digits;
        point = 1;
    }
    if (point > digits.length)
        digits += '0'.repeat(point - digits.length);
    const whole = digits.slice(0, point).replace(/^0+(?=\d)/, '');
    const rest = digits.slice(point);
    return `${m[1] === '-' ? '-' : ''}${whole}${rest ? `.${rest}` : ''}`;
}
export const methodName = (i) => (i.method === 'flow viability dye' ? (blank(i.methodDye) ? 'flow viability dye' : i.methodDye) : i.method);
const row = (id, label, value, mode, unit, extra = {}) => ({
    id, label, unrounded: value, display: e9.display(mode, value), unit, mark: 'C', ...extra,
});
const withUnit = (r) => (r.unit ? `${r.display} ${r.unit}` : r.display);
function refusalFrom(res, where) {
    const fields = res.fields || [];
    const labels = fields.map((f) => (res.indices && res.indices.length && (f === 'live' || f === 'dead')
        ? `${FIELD_LABELS[f]} (square ${res.indices.map((x) => x + 1).join(', ')})` : (FIELD_LABELS[f] || f)));
    const why = (f) => (f === 'live' || f === 'dead' || f === 'sumLive' || f === 'sumDead' ? WHY.count
        : f === 'P' || f === 'N' ? WHY.parts : WHY.positive);
    const out = { code: res.code, fields, where, engine: res.engine };
    if (res.code === 'CCS-RF-03')
        out.sentence = fields.map((f, i) => `${labels[i]}: ${why(f)}`).join('; ');
    else if (res.code === 'CCS-RF-04')
        out.sentence = TEXT.rf04;
    else if (res.code === 'CCS-RF-06')
        out.sentence = TEXT.rf06;
    else if (res.code === 'CCS-RF-07')
        out.sentence = where === 'cv' ? TEXT.rf07cv : TEXT.rf07seed;
    else if (res.code === 'CCS-RF-05')
        out.sentence = null;
    return out;
}
const incompleteLabels = (res) => res.missing.map((m) => {
    const idxs = res.missingIndices || res.incompleteIndices || [];
    if ((m === 'live' || m === 'dead') && idxs.length)
        return `${FIELD_LABELS[m]} (square ${idxs.map((x) => x + 1).join(', ')})`;
    return FIELD_LABELS[m] || m;
});
const GATE_KEY = { chamber: 'chamber', square: 'square', sampleSource: 'sampleSource', borderRule: 'borderRule', borderRuleText: 'borderRule', method: 'viabilityMethod', methodDye: 'viabilityMethod', timing: 'timing' };
const KEY_ORDER = ['chamber', 'square', 'A', 'd', 'live', 'dead', 'borderRule', 'P', 'viabilityMethod', 'dyeName', 'timing', 'sampleSource'];
export function minusOne(p) {
    const [i, f] = p.split('.');
    const n = (BigInt(i) - 1n).toString();
    return f === undefined ? n : `${n}.${f}`;
}
function dilutionLineFor(typed, fac) {
    if (blank(typed))
        return null;
    if (fac.status === 'rejected') {
        return (fac.code === 'CCS-RF-03' && (fac.fields || []).includes('P')) ? `${FIELD_LABELS.P}: ${WHY.parts}` : null;
    }
    if (fac.status !== 'result')
        return null;
    const P = String(typed).trim();
    const plain = normalise(typed);
    if (!isDec(plain))
        return null;
    const pOne = cmpDec(plain, '1') === 0;
    const pm1 = pOne ? '0' : minusOne(plain);
    return dilutionLine(P, pm1, cmpDec(pm1, '1') === 0, pOne);
}
function computeCore(inp) {
    const out = {
        engine: version(),
        missingKeys: [],
        missing: [],
        pending: [],
        refusals: [], flags: [], sections: {}, derived: {},
    };
    const method = methodName(inp);
    const gate = [];
    if (!inp.chamber)
        gate.push('chamber');
    if (inp.chamber !== 'other' && !inp.square)
        gate.push('square');
    if (!inp.sampleSource)
        gate.push('sampleSource');
    if (!inp.borderRule)
        gate.push('borderRule');
    if (inp.borderRule === 'lab' && blank(inp.borderRuleText))
        gate.push('borderRuleText');
    if (!inp.method)
        gate.push('method');
    if (inp.method === 'flow viability dye' && blank(inp.methodDye))
        gate.push('methodDye');
    if (!inp.timing)
        gate.push('timing');
    out.missing.push(...gate.map((g) => FIELD_LABELS[g]));
    out.missingKeys.push(...gate.map((g) => GATE_KEY[g]));
    const area = inp.chamber === 'other' ? normalise(inp.A) : normalise(inp.square);
    const depth = normalise(inp.d);
    const sq = e9.squareVolume(area, depth);
    const live = inp.live.map(normalise);
    const dead = inp.dead.map(normalise);
    const mean = e9.meanPerSquare(live, dead);
    const dyeNamed = !blank(inp.dyeName);
    const fac = e10.strengthFactor(normalise(inp.P), dyeNamed);
    for (const [res, fieldsOnly] of [[sq], [mean], [fac]]) {
        if (res.status === 'incomplete') {
            const skip = new Set();
            if (!inp.chamber) {
                skip.add('A');
                skip.add('d');
            }
            if (inp.chamber && inp.chamber !== 'other' && !inp.square)
                skip.add('A');
            const still = res.missing.filter((m) => !skip.has(m));
            out.missing.push(...incompleteLabels({ ...res, missing: still }));
            out.missingKeys.push(...still);
        }
        if (res.status === 'rejected')
            out.refusals.push(refusalFrom(res, 'input'));
    }
    out.dilutionLine = dilutionLineFor(inp.P, fac);
    if (fac.status === 'result')
        for (const f of fac.flags)
            if (f === 'CCS-FL-01')
                out.flags.push({ code: f, text: TEXT.fl01 });
    const t = normalise(inp.timeMin);
    const lim = normalise(inp.timeLimit);
    for (const [k, v] of [['timeMin', t], ['timeLimit', lim]]) {
        if (v !== null && (!isDec(v) || isZeroDec(v))) {
            out.refusals.push({ code: 'CCS-RF-03', fields: [k], where: 'input', sentence: `${FIELD_LABELS[k]}: ${WHY.positive}` });
        }
    }
    if (isDec(t) && isDec(lim) && cmpDec(t, lim) > 0) {
        out.flags.push({ code: 'CCS-FL-02', text: fl02(inp.timeMin.trim(), inp.timeLimit.trim()) });
    }
    out.derived = {
        squareVolume: sq.status === 'result' ? row('Vsq', 'volume of one square', sq.Vsq, 'exact', 'µL') : null,
        area, depth,
    };
    if (sq.status === 'result')
        out.sections.square = { status: 'result', rows: [out.derived.squareVolume] };
    if (fac.status === 'result') {
        out.derived.f = e9.display('exact', fac.f);
        out.derived.fValue = fac.f;
    }
    if (sq.status === 'result') {
        const V = e9.display('exact', sq.Vsq);
        const x = e9.x10Comparison(V);
        if (x.status === 'result') {
            const k = e9.display('sig3trim', x.k);
            out.derived.x10 = { direction: x.direction, near: x.near, V, k, line: x10Line({ direction: x.direction, near: x.near, V, k }) };
        }
    }
    if (mean.status === 'result') {
        out.sections.counts = {
            status: 'result',
            rows: [
                row('nSq', 'squares counted (n)', mean.nSq, 'exact', ''),
                row('sumLive', 'live counted (sum)', mean.sumLive, 'exact', ''),
                row('sumDead', 'dead counted (sum)', mean.sumDead, 'exact', ''),
                row('Lbar', 'mean live per square', mean.Lbar, 'exact', ''),
                row('Dbar', 'mean dead per square', mean.Dbar, 'exact', ''),
            ],
        };
    }
    if (out.missing.length)
        return out;
    let conc = null;
    if (sq.status === 'result' && mean.status === 'result' && fac.status === 'result') {
        conc = e9.concentrations(mean.Lbar, mean.Dbar, fac.f, sq.Vsq, mean.sumLive, mean.sumDead);
        if (conc.status === 'rejected')
            out.refusals.push(refusalFrom(conc, 'conc'));
        if (conc.status === 'result') {
            out.sections.conc = {
                status: 'result',
                rows: [
                    row('Clive', `live cells/mL (${method})`, conc.Clive, 'sci3', 'cells/mL'),
                    row('Cdead', `dead cells/mL (${method})`, conc.Cdead, 'sci3', 'cells/mL'),
                    row('Ctotal', 'all cells/mL (live + dead)', conc.Ctotal, 'sci3', 'cells/mL'),
                ],
            };
        }
    }
    if (mean.status === 'result') {
        const via = e9.viability({ sumLive: mean.sumLive, sumDead: mean.sumDead });
        if (via.status === 'result') {
            out.sections.viability = { status: 'result', rows: [row('viability', viabilityLabel(method), via.viabilityPercent, 'fixed1', '%')] };
        }
        else if (via.status === 'rejected' && !out.refusals.some((r) => r.code === via.code))
            out.refusals.push(refusalFrom(via, 'viability'));
        const cv = e7.poissonCV({ sumLive: mean.sumLive, sumDead: mean.sumDead });
        if (cv.status === 'result') {
            const r = row('cvPercent', 'counting CV (Poisson, on live cells)', cv.cvPercent, 'fixed2', '%');
            out.sections.cv = { status: 'result', rows: [r], label: fl05(r.display, e9.display('exact', mean.sumLive)) };
        }
        else if (cv.status === 'rejected' && cv.code === 'CCS-RF-07')
            out.refusals.push(refusalFrom(cv, 'cv'));
    }
    if (conc && conc.status === 'result') {
        const vs = normalise(inp.Vsusp);
        const before = inp.timing === 'before';
        const va = before ? normalise(inp.Valiquot) : null;
        const tot = e9.totalCells(conc.Clive, conc.Ctotal, vs, inp.timing, va);
        if (tot.status === 'incomplete')
            out.pending.push(...incompleteLabels(tot).filter((x) => x !== 'timing'));
        else if (tot.status === 'rejected')
            out.refusals.push(refusalFrom(tot, 'totals'));
        else {
            const V = inp.Vsusp.trim();
            const rows = [
                row('liveCells', `live cells in ${V} mL`, tot.liveCells, 'sci3', 'cells'),
                row('allCells', `all cells (live + dead) in ${V} mL`, tot.allCells, 'sci3', 'cells'),
            ];
            if (tot.liveRemaining !== null)
                rows.push(row('liveRemaining', `live cells remaining after the ${inp.Valiquot.trim()} mL counting sample`, tot.liveRemaining, 'sci3', 'cells'));
            out.sections.totals = { status: 'result', rows };
        }
        const sd = e9.seedingVolumes(normalise(inp.rho), normalise(inp.Vfinal), conc.Clive);
        if (sd.status === 'incomplete')
            out.pending.push(...incompleteLabels(sd));
        else if (sd.status === 'rejected')
            out.refusals.push(refusalFrom(sd, 'seeding'));
        else {
            out.sections.seeding = {
                status: 'result',
                label: `seeding uses live cells/mL (${method})`,
                rows: [
                    row('cellsNeeded', 'cells needed', sd.cellsNeeded, 'sci3', 'cells'),
                    row('Vseed', 'volume of cell suspension to seed', sd.Vseed, 'sig3', 'mL'),
                    row('Vmed', 'medium to add', sd.Vmed, 'sig3', 'mL'),
                ],
            };
            if (sd.flags.includes('CCS-FL-06'))
                out.flags.push({ code: 'CCS-FL-06', text: TEXT.fl06 });
        }
    }
    else {
        const vs = normalise(inp.Vsusp);
        const va = inp.timing === 'before' ? normalise(inp.Valiquot) : null;
        const t2 = e9.totalCells('1', '1', vs, inp.timing, va);
        if (t2.status === 'rejected' && t2.code === 'CCS-RF-03')
            out.refusals.push(refusalFrom(t2, 'totals'));
        const s2 = e9.seedingVolumes(normalise(inp.rho), normalise(inp.Vfinal), '1');
        if (s2.status === 'rejected' && s2.code === 'CCS-RF-03')
            out.refusals.push(refusalFrom(s2, 'seeding'));
    }
    const sp = e10.splitVolumes(normalise(inp.Vnew), normalise(inp.N));
    if (sp.status === 'incomplete')
        out.pending.push(...incompleteLabels(sp));
    else if (sp.status === 'rejected')
        out.refusals.push(refusalFrom(sp, 'split'));
    else {
        out.sections.split = {
            status: 'result',
            rows: [
                row('Vtr', 'volume of your suspension to transfer', sp.Vtr, 'sig3', 'mL'),
                row('Vmedium', 'fresh medium to add', sp.Vmedium, 'sig3', 'mL'),
            ],
            lines: [TEXT.splitUsesVolumes, TEXT.noDoublings, TEXT.splitDivides],
        };
    }
    if (inp.timing === 'before' && !out.refusals.some((r) => r.code === 'CCS-RF-04')) {
        const vs = normalise(inp.Vsusp);
        const va = normalise(inp.Valiquot);
        if (isDec(vs) && isDec(va) && !isZeroDec(vs) && !isZeroDec(va) && cmpDec(va, vs) >= 0) {
            out.refusals.push(refusalFrom({ code: 'CCS-RF-04', fields: ['Vsusp', 'Valiquot'] }, 'totals'));
        }
    }
    return out;
}
function tableRow(r) {
    const f = r.fields || [];
    if (r.code === 'CCS-RF-06')
        return 4;
    if (r.code === 'CCS-RF-07')
        return 5;
    if (r.code === 'CCS-RF-04')
        return 6;
    if (r.code === 'CCS-RF-05')
        return 7;
    if (f.includes('timeMin') || f.includes('timeLimit'))
        return 9;
    if (f.includes('A') || f.includes('d') || f.includes('square'))
        return 1;
    if (f.includes('P'))
        return 2;
    if (r.where === 'split' || f.includes('N') || f.includes('Vnew'))
        return 8;
    if (r.where === 'totals' || f.includes('Vsusp') || f.includes('Valiquot'))
        return 6;
    if (r.where === 'seeding' || f.includes('rho') || f.includes('Vfinal'))
        return 7;
    return 3;
}
const G = {
    sq: ['Vsq'], conc: ['Clive', 'Cdead', 'Ctotal'], via: ['viabilityPercent'], cv: ['cvPercent'],
    totals: ['liveCells', 'allCells', 'liveRemaining'], seed: ['cellsNeeded', 'Vseed', 'Vmed'], split: ['Vtr', 'Vmedium'],
};
const BLOCKS = {
    1: ['sq', 'conc', 'totals', 'seed'], 2: ['conc', 'totals', 'seed'],
    3: ['conc', 'via', 'totals', 'cv', 'seed'], 4: ['conc', 'via', 'totals', 'cv', 'seed'],
    5: ['cv', 'seed'], 6: ['totals'], 7: ['seed'], 8: ['split'], 9: [],
};
const OUT_ORDER = ['sq', 'conc', 'via', 'cv', 'totals', 'seed', 'split'];
function blockedOf(inp, refusals) {
    const before = inp.timing === 'before';
    const relevant = {
        totals: !blank(inp.Vsusp) || (before && !blank(inp.Valiquot)),
        seed: !blank(inp.rho) || !blank(inp.Vfinal),
    };
    const list = [];
    for (const g of OUT_ORDER) {
        if (relevant[g] === false)
            continue;
        for (const name of G[g]) {
            if (name === 'liveRemaining' && !before)
                continue;
            const hit = refusals.find((r) => BLOCKS[tableRow(r)].includes(g));
            if (!hit)
                continue;
            const sentence = hit.code === 'CCS-RF-07' ? (g === 'cv' ? TEXT.rf07cv : TEXT.rf07seed) : hit.sentence;
            list.push({ name, code: hit.code, sentence: sentence ?? null });
        }
    }
    return list;
}
export function compute(inp) {
    const out = computeCore(inp);
    out.refusals = out.refusals.map((r, i) => ({ r, i })).sort((a, b) => tableRow(a.r) - tableRow(b.r) || a.i - b.i).map((x) => x.r);
    const keys = new Set(out.missingKeys);
    out.missingKeys = KEY_ORDER.filter((k) => keys.has(k));
    out.blocked = out.missing.length ? [] : blockedOf(inp, out.refusals);
    return out;
}
export { withUnit };
