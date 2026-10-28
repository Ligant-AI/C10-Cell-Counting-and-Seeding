import { WORKING, TEXT, DILUTION_NOTE } from './text.js';
import { methodName } from './model.js';
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const T = (v) => String(v ?? '').trim();
export function buildWorking(inp, st) {
    const rows = (sec) => Object.fromEntries(((st.sections[sec] || {}).rows || []).map((r) => [r.id, r]));
    const sq = rows('square');
    const ct = rows('counts');
    const cc = rows('conc');
    const vb = rows('viability');
    const cv = rows('cv');
    const tt = rows('totals');
    const sd = rows('seeding');
    const sp = rows('split');
    const u = (r) => (r.unit ? `${r.display} ${r.unit}` : r.display);
    const method = methodName(inp);
    const x10 = st.derived.x10 ? st.derived.x10.line : null;
    const items = [];
    if (sq.Vsq) {
        const A = inp.chamber === 'other' ? T(inp.A) : T(inp.square);
        items.push({
            id: 'square', title: cap(sq.Vsq.label),
            lines: ['V_sq (µL) = A (mm²) × d (mm)', `V_sq = ${A} mm² × ${T(inp.d)} mm = ${u(sq.Vsq)}`, WORKING.convMm3],
            quotes: [], x10: null,
        });
    }
    if (ct.Lbar) {
        items.push({
            id: 'means', title: 'Mean count per square',
            lines: ['L_bar = (sum of live counts) / n; D_bar = (sum of dead counts) / n',
                `L_bar = ${ct.sumLive.display} / ${ct.nSq.display} = ${ct.Lbar.display}`,
                `D_bar = ${ct.sumDead.display} / ${ct.nSq.display} = ${ct.Dbar.display}`],
            quotes: [], x10: null,
        });
    }
    if (st.derived.f) {
        items.push({
            id: 'factor', title: 'Dilution factor',
            lines: ['f = P', `1 part cell suspension in ${T(inp.P)} parts total: f = ${st.derived.f}`, DILUTION_NOTE],
            quotes: [], x10: null,
        });
    }
    if (cc.Clive && ct.Lbar && sq.Vsq && st.derived.f) {
        const f = st.derived.f;
        const V = sq.Vsq.display;
        items.push({
            id: 'concentration', title: `Concentrations (${method})`,
            lines: ['C = (mean count per square) × f × 1000 / V_sq (µL)',
                `${cc.Clive.label}: ${ct.Lbar.display} × ${f} × 1000 / ${V} = ${u(cc.Clive)}`,
                `${cc.Cdead.label}: ${ct.Dbar.display} × ${f} × 1000 / ${V} = ${u(cc.Cdead)}`,
                `${cc.Ctotal.label}: C_live + C_dead = ${cc.Clive.display} + ${cc.Cdead.display} = ${u(cc.Ctotal)}`,
                WORKING.convMl, WORKING.deadSentence],
            quotes: [], x10,
        });
    }
    if (vb.viability) {
        items.push({
            id: 'viability', title: cap(vb.viability.label),
            lines: ['Viability = 100 × (sum of live counts) / (sum of live counts + sum of dead counts)',
                `Viability = 100 × ${ct.sumLive.display} / (${ct.sumLive.display} + ${ct.sumDead.display}) = ${u(vb.viability)}`],
            quotes: [{ text: WORKING.quoteThermoViab, source: 'Thermo Fisher, Trypan blue exclusion' }], x10: null,
        });
    }
    if (cv.cvPercent) {
        items.push({
            id: 'cv', title: cap(cv.cvPercent.label),
            lines: ['CV (%) = 100 / √N, N = sum of the live counts', WORKING.cvDerivation,
                `CV = 100 / √${ct.sumLive.display} = ${u(cv.cvPercent)}`],
            quotes: [{ text: WORKING.quoteWikiCount, source: 'Wikipedia, Hemocytometer' }], x10: null,
        });
    }
    if (tt.liveCells && cc.Clive) {
        const lines = ['Total cells = concentration × volume',
            `${tt.liveCells.label}: ${cc.Clive.display} × ${T(inp.Vsusp)} = ${u(tt.liveCells)}`,
            `${tt.allCells.label}: ${cc.Ctotal.display} × ${T(inp.Vsusp)} = ${u(tt.allCells)}`];
        if (tt.liveRemaining)
            lines.push(`${tt.liveRemaining.label}: ${cc.Clive.display} × (${T(inp.Vsusp)} − ${T(inp.Valiquot)}) = ${u(tt.liveRemaining)}`);
        items.push({ id: 'totals', title: 'Total cells', lines, quotes: [], x10: null });
    }
    if (sd.cellsNeeded && cc.Clive) {
        items.push({
            id: 'seeding', title: `Seeding volumes (from live cells/mL, ${method})`,
            note: TEXT.rounding,
            lines: ['Cells needed = ρ × V_final; V_seed = cells needed / C_live; V_med = V_final − V_seed',
                `Cells needed = ${T(inp.rho)} × ${T(inp.Vfinal)} = ${u(sd.cellsNeeded)}`,
                `V_seed = ${sd.cellsNeeded.display} / ${cc.Clive.display} = ${u(sd.Vseed)}`,
                `V_med = ${T(inp.Vfinal)} − ${sd.Vseed.display} = ${u(sd.Vmed)}`],
            quotes: [{ text: WORKING.quoteThermoSeed, source: 'Thermo Fisher Gibco, Maintaining cultured cells' },
                { text: WORKING.quoteThermoMedium, source: 'Thermo Fisher Gibco, Maintaining cultured cells' }], x10: null,
        });
    }
    if (sp.Vtr) {
        items.push({
            id: 'split', title: 'Split by ratio',
            lines: ['V_tr = V_new / N; fresh medium = V_new − V_tr',
                `V_tr = ${T(inp.Vnew)} / ${T(inp.N)} = ${u(sp.Vtr)}`,
                `Fresh medium = ${T(inp.Vnew)} − ${sp.Vtr.display} = ${u(sp.Vmedium)}`],
            quotes: [], x10: null,
        });
    }
    return items;
}
