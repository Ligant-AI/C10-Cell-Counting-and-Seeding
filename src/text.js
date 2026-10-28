export const TEXT = Object.freeze({
    researchUse: 'Research use only. Not qualified for GxP decision-making.',
    oneLoading: 'One chamber loading per calculation. Counts from separate loadings or chambers are replicates; enter each as its own calculation. Replicate statistics come in the next release.',
    otherChamber: 'Chamber dimensions entered by you; this page has no preset for this chamber.',
    densityUnits: 'Target density in cells per mL of final culture volume. Seeding by cells per cm² of growth area is not in this version.',
    unitOfAnalysis: 'n = squares counted in one chamber loading. It is not a number of replicates; separate loadings are separate calculations.',
    liveDeadSorted: 'Live and dead are as your declared method sorts them.',
    splitUsesVolumes: 'a split by ratio uses volumes only; it does not use your count',
    noDoublings: 'This page does not compute population doublings. A 1-in-N split equals log2 N doublings only if the culture grows back to the same density.',
    splitDivides: 'This divides your suspension\'s concentration by N. It equals a 1-in-N split of the original culture only if your suspension volume equals the original culture volume.',
    fl01: 'You named a dye but entered 1 part in 1 part total, which means no dilution. If you mixed equal volumes of dye and cells, that is 1 part cell suspension in 2 parts total, a factor of 2. Without it, the concentration shown is half the true value.',
    fl06: 'no medium to add: the whole final volume is cell suspension',
    rf04: 'The counting sample cannot be as large as the suspension.',
    rf06: 'no cells counted',
    rf07cv: 'No live cells counted: a counting CV cannot be computed (it needs at least one live cell).',
    rf07seed: 'No live cells counted: seeding from live cells is not possible.',
    rounding: 'values rounded for display only; calculations use full precision',
    guardrail: 'This is a research calculation, not a batch record, and it carries no electronic signature or audit trail.',
    illustration: 'illustration (invented counts)',
});
export const EXPORT_STATEMENTS = Object.freeze({
    comparability: 'Results from different engine versions are not comparable.',
    notProduced: '12.32(viii) is not produced by this tool.',
});
export const DOES_NOT_DO = Object.freeze({
    heading: 'What it does not do',
    items: Object.freeze([
        'It does not work with automated counters, and has no counter mode.',
        'It does not give bead-based absolute counts.',
        'It has no Bürker preset: use Other chamber with the dimensions engraved on yours.',
        'It does not compute population doublings.',
        'It gives no optimal-density advice.',
        'It does not review the record.',
        'It does not detect clumps, debris or bad loading.',
        'It does not judge your viability against any threshold.',
        'It does not check your counts per square against a range.',
        'It does not judge whether a count, a viability value or a culture is acceptable; that judgement is yours.',
        'It is not for counting cells in blood, body fluids or other specimens taken from a person.',
        'It seeds by cells per mL of final culture volume only. Seeding by cells per cm² of growth area is not in this version.',
        'It is a research calculation, not a batch record: the exports are a count record you transcribe, and carry no electronic signature or audit trail.',
    ]),
    held: 'Not in this version: the printable bench sheet and the seeding and passage record (cell line, passage number, per-cm² seeding). They come in the next release.',
});
export const WHY_WE_ASK = Object.freeze({
    chamber: 'We ask because the same count means a different concentration in a different square: the square\'s volume sets the answer.',
    dilution: 'We ask because the dye dilutes the cells: leave it out and the concentration reads too low by that factor; apply it twice and it reads too high by the same factor.',
    method: 'We ask because \'live\' and \'dead\' are defined by the method that sorted the cells, so a viability is only complete with its method.',
    aliquot: 'We ask because cells taken out for counting are no longer in the suspension: if your volume was measured before you took them, the cells left are concentration times the smaller, remaining volume.',
});
export const x10Line = ({ direction, near, V, k }) => {
    if (direction === 'same')
        return 'Here × 10^4 gives the same answer: this square holds 0.1 µL.';
    if (near)
        return `× 10^4 does not apply exactly here: this square holds ${V} µL, not 0.1 µL. Using × 10^4 would give a result less than 0.5 % ${direction}.`;
    return `× 10^4 does not apply here: this square holds ${V} µL, not 0.1 µL. Using × 10^4 would give a result ${k}-fold ${direction}.`;
};
export const WORKING = Object.freeze({
    heading: 'Show the working',
    deadSentence: 'Dead cells/mL uses the same arithmetic as live cells/mL, applied to the cells counted as dead. It is not a separately published formula.',
    convMm3: '1 mm³ = 1 µL', convMl: '1 mL = 1000 µL',
    quoteThermoSeed: 'Volume of cell suspension = desired number of cells / cell concentration',
    quoteThermoMedium: 'Add the appropriate volume of complete growth medium to reach the final desired volume in the culture vessel.',
    quoteThermoViab: 'To find the % viable cells = [1.00 – (Number of blue cells ÷ Number of total cells)] × 100',
    quoteWikiCount: 'If they differ more than 2 times the counting error (square root of the count,',
    cvDerivation: 'CV = √N ÷ N = 1 ÷ √N',
});
export const FR_LABELS = Object.freeze({ large: '0.2 µL', small: '0.0125 µL' });
export const fl02 = (t, limit) => `Counted ${t} min after mixing, later than the ${limit} min you set.`;
export const fl05 = (value, n) => `if cell positions are random (Poisson), counting alone gives a CV of about 1/√N: ${value}% for your ${n} live cells counted. This is the counting error only; pipetting, dilution and chamber loading add their own.`;
export const viabilityLabel = (m) => `viability (${m}, % of cells counted)`;
export const viabilityDenominator = (m) => `Viability = cells counted as live ÷ (live + dead) cells counted, in this loading, by ${m}.`;
export const CHAMBERS = Object.freeze({
    neubauer: { name: 'Improved Neubauer', depth: '0.1', squares: ['1', '0.0625', '0.05', '0.04', '0.0025'] },
    'fuchs-rosenthal': {
        name: 'Fuchs-Rosenthal', depth: '0.2',
        squares: ['1', '0.0625'],
        squareLabels: { '1': 'large square, 1 mm² (0.2 µL at 0.2 mm)', '0.0625': 'small square, 0.0625 mm² (0.0125 µL at 0.2 mm)' },
    },
    other: { name: 'Other chamber', depth: '' },
});
export const SAMPLE_SOURCES = Object.freeze([
    'cell line',
    'primary cells from a healthy donor',
    'cell or gene therapy product or intermediate',
    'animal sample',
    'human tissue, research material',
]);
export const METHODS = Object.freeze(['trypan blue', 'AO/PI', 'flow viability dye']);
export const MSF_LINES = Object.freeze([
    'Depth of each square: 0.2 mm', '16 squares', 'Volume of each square: 0.2 µl (or 0.2 mm³)',
    'Surface: 0.0625 mm2', 'Volume: 3.2 mm³', 'Simple engraved grid',
]);
export const WIKI_SOURCE = 'Wikipedia, Hemocytometer';
export const BORDER_RULE_QUOTE = 'The cells that are on or touching the top and left lines are counted, but the ones on or touching the right or bottom lines are ignored.';
export const NEUBAUER_LINES = Object.freeze([
    'consists of nine 1 x 1 mm (1 mm2) squares',
    'hold the coverslip 0.1 mm off the marked grid',
]);
export const FR_ILLUSTRATION = 'Illustration (invented counts): the same mean of 90 cells per square, with 1 part cell suspension in 2 parts total, gives 9.00 × 10^5 cells/mL if the squares were Fuchs-Rosenthal large squares (0.2 µL each), and 1.44 × 10^7 cells/mL if they were small squares (0.0125 µL each). One large square holds 16 small squares, so the two answers are 16-fold apart: declare the square you counted.';
export const TIMING_RECORD = Object.freeze({
    before: 'before the counting sample was taken',
    after: 'after the counting sample was taken',
});
export const DILUTION_NOTE = '1 part cell suspension in 10 parts total is a factor of 10. 1 part cell suspension added to 10 parts of diluent is 11 parts total, a factor of 11. Enter the parts total.';
export const WORKED_EXAMPLE = 'Worked example on this page, illustration (invented counts): Improved Neubauer large square (0.1 µL), live 86, 94, 90, 90 and dead 8, 12, 10, 10 in four squares, 1 part cell suspension in 2 parts total, trypan blue: live 1.80 × 10^6 cells/mL, viability 90.0 %, counting CV 5.27 %. To re-check this page\'s arithmetic, load it, then choose the border rule and the sample source: the example leaves both to you, and no result appears until they are chosen.';
export const INDEPENDENT_VERIFICATION = 'For version 1.0 of this page, the calculation engine behind it, @ligant/bench-engines 0.1.0, was checked against two independent sources: expected values worked out in exact fractions by one author, and a second implementation written from the written specification by another, neither of whom saw the engine\'s code or results. All 313 test cases agreed in the final comparison, after one recorded correction to the second implementation where the specification had left a case unstated, and this page\'s own calculations agreed with the expected values in all 91 page test cases.';
export const CODE_URL = 'https://github.com/Ligant-AI/C10-Cell-Counting-and-Seeding';
export const SOURCES = Object.freeze([
    { name: 'Wikipedia, Hemocytometer', url: 'https://en.wikipedia.org/wiki/Hemocytometer' },
    { name: 'Thermo Fisher, Trypan blue exclusion', url: 'https://thermofisher.com/us/en/home/references/gibco-cell-culture-basics/cell-culture-protocols/trypan-blue-exclusion.html' },
    { name: 'Thermo Fisher Gibco, Maintaining cultured cells', url: 'https://www.thermofisher.com/us/en/home/references/gibco-cell-culture-basics/maintaining-cultured-cells.html' },
    { name: 'MSF catalogue, Fuchs-Rosenthal chamber', url: 'https://unicat.msf.org/cat/product/13058?page=585' },
]);
export const FIELD_LABELS = Object.freeze({
    chamber: 'Chamber', square: 'Square counted', A: 'Square area (mm²)', d: 'Chamber depth (mm)',
    sampleSource: 'Sample source', borderRule: 'Border rule', borderRuleText: 'Your lab\'s border rule',
    counts: 'Counts per square', live: 'Live count', dead: 'Dead count',
    P: 'Parts total (1 part cell suspension in ___ parts total)', method: 'Viability method', methodDye: 'Name of the flow viability dye',
    timing: 'Counting sample taken before or after the suspension volume was measured',
    Vsusp: 'Suspension volume (mL)', Valiquot: 'Counting-sample volume (mL)',
    rho: 'Target density (cells/mL)', Vfinal: 'Final volume (mL)', N: 'Split: parts total (N)', Vnew: 'New vessel total volume (mL)',
    timeMin: 'Time from mixing to count (min)', timeLimit: 'Your time limit (min)',
});
export const dilutionLine = (P, Pm1, one, pOne) => (pOne
    ? `${P} part total; factor ${P}`
    : `1 part cell suspension + ${Pm1} ${one ? 'part' : 'parts'} dye or diluent = ${P} parts total; factor ${P}`);
export const WHY = Object.freeze({
    count: 'enter a whole number, 0 or more',
    parts: 'enter a number, 1 or more',
    positive: 'enter a number greater than 0',
});
