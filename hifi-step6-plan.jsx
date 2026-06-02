// hifi-step6-plan.jsx — final plan summary, driven by wizard state
function StepPlan({ state, update, onNext }) {
  const isMobile = useHifiMobile();
  const [horizon, setHorizon] = React.useState(30);

  const fixedTotal = state.fixedItems.reduce((s, it) => {
    if (it.id === 'rent') return s + (it.amount * (it.sharedPct / 100));
    return s + it.amount;
  }, 0);
  const depTotal = state.dependents.reduce((s, d) => s + d.amount, 0);
  const TOTAL_FX = fixedTotal + depTotal;
  const netIncome = getNetIncome(state);
  const LEFTOVER = Math.max(0, netIncome - TOTAL_FX);
  const E_AMT = LEFTOVER * state.split.e / 100;
  const L_AMT = LEFTOVER * state.split.l / 100;
  const F_AMT = LEFTOVER * state.split.f / 100;

  const picksData = state.picks.filter(Boolean).map(id => hifiFind(id));
  const slotMonthly = picksData.length ? L_AMT / picksData.length : 0;
  const avgRate = picksData.length ? picksData.reduce((s,p)=>s+p.rate,0) / picksData.length : 0.05;

  const onDownload = () => generatePlanPdf({
    state, netIncome, fixedTotal, depTotal, TOTAL_FX, leftover: LEFTOVER,
    eAmt: E_AMT, lAmt: L_AMT, fAmt: F_AMT, picksData, slotMonthly, avgRate, horizon,
  });

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 14, height: isMobile ? 'auto' : 'calc(900px - 32px - 32px - 22px - 36px)' }}>
      {/* LEFT column (7) */}
      <div style={{ flex: 7, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <PlanHero income={netIncome} leftover={LEFTOVER} eAmt={E_AMT} lAmt={L_AMT} horizon={horizon} setHorizon={setHorizon} />
        <PlanInvestmentMix picksData={picksData} slotMonthly={slotMonthly} lAmt={L_AMT} horizon={horizon} />
      </div>
      {/* RIGHT column (5) */}
      <div style={{ flex: 5, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <PlanAllocation eAmt={E_AMT} lAmt={L_AMT} fAmt={F_AMT} split={state.split} />
        <div style={{ display: 'flex', gap: 14 }}>
          <PlanDateChip />
          <PlanHealthChip totalFx={TOTAL_FX} income={netIncome} />
        </div>
        <PlanProjection eAmt={E_AMT} lAmt={L_AMT} avgRate={avgRate} horizon={horizon} />
        <PlanDownload onDownload={onDownload} />
      </div>
    </div>
  );
}

function PlanHero({ income, leftover, eAmt, lAmt, horizon, setHorizon }) {
  const isMobile = useHifiMobile();
  const a = hSplit(leftover);
  const wealthPct = income > 0 ? Math.round(((eAmt + lAmt) / income) * 100) : 0;
  return (
    <Card lime style={{ padding: 26 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 999,
            background: INK, color: LIME,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 700, flexShrink: 0,
          }}>BA</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap' }}>Your monthly plan</div>
            <div style={{ fontSize: 12, color: 'rgba(14,15,13,0.78)', fontWeight: 500, marginTop: 1 }}>Budget · May 2026</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {[10, 20, 30].map(y => (
            <button key={y} onClick={() => setHorizon(y)} style={{
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              padding: '6px 11px', borderRadius: 999, whiteSpace: 'nowrap',
              fontSize: 11, fontWeight: 700,
              background: horizon === y ? INK : 'rgba(14,15,13,0.08)',
              color: horizon === y ? LIME : INK,
            }}>{y}y</button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(14,15,13,0.78)' }}>This month, you can allocate</div>
        <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 4, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontSize: isMobile ? 18 : 24, fontWeight: 600, marginRight: 3 }}>€</span>
            <span style={{ fontSize: isMobile ? 54 : 80, fontWeight: 700, letterSpacing: isMobile ? -2 : -3, lineHeight: 0.95 }}>{a.whole}</span>
            <span style={{ fontSize: isMobile ? 20 : 26, fontWeight: 600, color: 'rgba(14,15,13,0.72)', letterSpacing: -0.5 }}>.{a.dec}</span>
          </div>
          <span style={{ fontSize: 12, color: 'rgba(14,15,13,0.72)', fontWeight: 500, whiteSpace: 'nowrap' }}>{income > 0 ? Math.round(leftover/income*100) : 0}% of net income</span>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, gap: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(14,15,13,0.78)', whiteSpace: 'nowrap' }}>Wealth-building · {wealthPct}%</span>
          <span className="mono" style={{ fontSize: 11, color: 'rgba(14,15,13,0.78)', whiteSpace: 'nowrap' }}>{hEur(eAmt + lAmt)} / {hEur(income)}</span>
        </div>
        <div style={{ height: 8, background: 'rgba(14,15,13,0.12)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${wealthPct}%`, height: '100%', background: INK }} />
        </div>
      </div>
    </Card>
  );
}

function PlanAllocation({ eAmt, lAmt, fAmt, split }) {
  const buckets = [
    { key: 'em',  label: 'Emergency', amount: eAmt, pct: split.e, note: '3-mo buffer' },
    { key: 'lt',  label: 'Long-term', amount: lAmt, pct: split.l, note: '3 products' },
    { key: 'fun', label: 'Fun money', amount: fAmt, pct: split.f, note: 'guilt-free' },
  ];
  const [active, setActive] = React.useState('lt');
  const cur = buckets.find(b => b.key === active);
  const a = hSplit(cur.amount);
  return (
    <Card style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <Eyebrow>Allocation</Eyebrow>
          <h2 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 700, letterSpacing: -0.6, lineHeight: 1.1 }}>{split.e} / {split.l} / {split.f}</h2>
        </div>
        <Pill style={{ background: SOFT, fontWeight: 600 }}>
          Edit
          <Icon name="caret-down" weight="bold" size={10} />
        </Pill>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        {buckets.map(b => (
          <button key={b.key} onClick={() => setActive(b.key)} style={{
            flex: 1, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: active === b.key ? LIME : SOFT,
            borderRadius: 16, padding: '12px 10px', textAlign: 'left', minWidth: 0,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: active === b.key ? 'rgba(14,15,13,0.78)' : INK_3 }}>{b.pct}%</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4, color: INK, whiteSpace: 'nowrap' }}>{b.label}</div>
            <div className="mono" style={{ fontSize: 11, marginTop: 2, color: active === b.key ? 'rgba(14,15,13,0.7)' : INK_2, fontWeight: 500, whiteSpace: 'nowrap' }}>{hEur(b.amount)}</div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16, padding: '14px 0 0', borderTop: `1px solid ${RULE}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <Eyebrow style={{ whiteSpace: 'nowrap' }}>{cur.label} · {cur.note}</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 16, fontWeight: 600, marginRight: 2 }}>€</span>
            <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.8, lineHeight: 1 }}>{a.whole}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: INK_3 }}>.{a.dec}</span>
            <span style={{ fontSize: 11, color: INK_3, marginLeft: 6, fontWeight: 500 }}>/ mo</span>
          </div>
        </div>
        <div style={{ marginTop: 10, display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', background: SOFT }}>
          {buckets.map(b => (
            <div key={b.key} style={{
              width: `${b.pct}%`,
              background: b.key === active ? INK : '#d8d8cf',
              borderRight: '2px solid #fff',
            }} />
          ))}
        </div>
      </div>
    </Card>
  );
}

function PlanInvestmentMix({ picksData, slotMonthly, lAmt, horizon }) {
  const proj30 = picksData.map(p => hifiFv(slotMonthly, horizon, p.rate));
  const maxProj = Math.max(...proj30, 1);
  const ticks = [Math.round(horizon/3), Math.round(2*horizon/3), horizon];
  return (
    <Card style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <Eyebrow>Investment mix</Eyebrow>
          <h2 style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 700, letterSpacing: -0.8, lineHeight: 1.05 }}>{horizon}-year roadmap</h2>
          <div style={{ fontSize: 12, color: INK_2, marginTop: 6, fontWeight: 500 }}>{picksData.length} products · {hEur(slotMonthly)} into each, monthly</div>
        </div>
        <Pill style={{ background: SOFT, fontWeight: 600 }}>
          <Icon name="plus" weight="bold" size={12} />
          Swap
        </Pill>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 22, paddingLeft: 130, fontSize: 10, color: INK_3, fontWeight: 600, letterSpacing: 0.4 }}>
        <span style={{ whiteSpace: 'nowrap' }}>Today</span><span style={{ whiteSpace: 'nowrap' }}>{ticks[0]}y</span><span style={{ whiteSpace: 'nowrap' }}>{ticks[1]}y</span><span style={{ whiteSpace: 'nowrap' }}>{ticks[2]}y</span>
      </div>
      <div style={{ position: 'relative', marginTop: 4 }}>
        <div style={{ position: 'absolute', inset: 0, marginLeft: 130, pointerEvents: 'none' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              position: 'absolute', top: 0, bottom: 0, left: `${(i/3)*100}%`,
              borderLeft: '1px dashed #d8d8cf',
            }} />
          ))}
        </div>

        {picksData.map((p, i) => {
          const w = (proj30[i] / maxProj) * 100;
          const isHero = p.rate === Math.max(...picksData.map(pp => pp.rate));
          const short = p.name.split(' ').slice(0, 2).join(' ').toUpperCase();
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', marginTop: 10 }}>
              <div style={{ width: 130, paddingRight: 12, flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{short}</div>
                <div style={{ fontSize: 10, color: INK_3, fontWeight: 600, marginTop: 1, whiteSpace: 'nowrap' }}>{p.risk === 'low' ? 'Low' : 'Med'} · {(p.rate*100).toFixed(1)}%</div>
              </div>
              <div style={{ flex: 1, height: 42, position: 'relative' }}>
                <div style={{
                  width: `${w}%`, height: '100%',
                  background: isHero ? LIME : SOFT_2,
                  borderRadius: 22,
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                  paddingRight: 14,
                }}>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: INK, whiteSpace: 'nowrap' }}>{hEurK(proj30[i])}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 18, paddingTop: 14, borderTop: `1px solid ${RULE}` }}>
        <div style={{ minWidth: 0 }}>
          <Eyebrow style={{ whiteSpace: 'nowrap' }}>Combined at {horizon} yr</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 600, marginRight: 2 }}>€</span>
            <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1.3, lineHeight: 1 }}>{Math.round(proj30.reduce((s,x)=>s+x,0)/1000).toLocaleString('en-GB')}</span>
            <span style={{ fontSize: 18, fontWeight: 600 }}>k</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Eyebrow style={{ whiteSpace: 'nowrap' }}>Growth</Eyebrow>
          <div className="mono" style={{ fontSize: 13, fontWeight: 500, color: INK_2, marginTop: 4, whiteSpace: 'nowrap' }}>{hEurK(lAmt * 12 * horizon)} in · +{lAmt > 0 && proj30.reduce((s,x)=>s+x,0) > 0 ? ((proj30.reduce((s,x)=>s+x,0) / (lAmt * 12 * horizon) - 1) * 100).toFixed(0) : 0}%</div>
        </div>
      </div>
    </Card>
  );
}

function PlanDateChip() {
  const d = new Date('2026-05-26');
  return (
    <Card style={{ flex: '0 0 auto', minWidth: 100 }} pad={18} radius={22}>
      <Eyebrow style={{ fontSize: 10 }}>Generated</Eyebrow>
      <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1, marginTop: 6 }}>{d.getDate()}</div>
      <div style={{ marginTop: 4, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>Tue, May</div>
    </Card>
  );
}

function PlanHealthChip({ totalFx, income }) {
  const fixedRatio = income > 0 ? Math.round(totalFx / income * 100) : 0;
  const tone = fixedRatio <= 55 ? 'healthy' : fixedRatio <= 70 ? 'okay' : 'tight';
  return (
    <Card style={{ flex: 1, minWidth: 0 }} pad={18} radius={22}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Eyebrow style={{ fontSize: 10, whiteSpace: 'nowrap' }}>Budget health</Eyebrow>
        <div style={{ width: 20, height: 20, borderRadius: 999, background: LIME, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: INK }}>
          <Icon name="check" weight="bold" size={11} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 6 }}>
        <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1 }}>{fixedRatio}</span>
        <span style={{ fontSize: 18, fontWeight: 600, color: INK_2 }}>%</span>
      </div>
      <div style={{ marginTop: 4, fontSize: 11, color: INK_2, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Fixed ratio · {tone}</div>
    </Card>
  );
}

function PlanProjection({ eAmt, lAmt, avgRate, horizon }) {
  const monthlyW = eAmt + lAmt;
  const N = horizon;
  const points = Array.from({length: N + 1}, (_, y) => {
    const inv = hifiFv(lAmt, y, avgRate);
    const sav = hifiFv(eAmt, y, 0.025);
    return inv + sav;
  });
  const max = points[points.length - 1] || 1;
  const W = 380, H = 110;
  const xs = (i) => (i / N) * W;
  const ys = (v) => H - (v / max) * (H - 16) - 4;
  const path = 'M' + points.map((v,i)=>`${xs(i)},${ys(v)}`).join(' L');
  const area = path + ` L ${W},${H} L 0,${H} Z`;
  return (
    <Card dark style={{ flex: 1, minHeight: 0 }} pad={22}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(246,246,238,0.55)', whiteSpace: 'nowrap' }}>Projection</div>
          <div style={{ fontSize: 17, fontWeight: 700, marginTop: 3, color: PAPER, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Wealth, next {horizon} yr</div>
        </div>
        <div style={{ background: LIME, color: INK, padding: '5px 11px', borderRadius: 999, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
          +{hEurK(max - monthlyW*12*N)}
        </div>
      </div>

      <div style={{ position: 'relative', marginTop: 12 }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block', height: H }}>
          <defs>
            <linearGradient id="planlimegrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c5d6a1" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#c5d6a1" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map(g => (
            <line key={g} x1="0" y1={H - g*(H-16) - 4} x2={W} y2={H - g*(H-16) - 4} stroke="rgba(246,246,238,0.08)" strokeWidth="1" />
          ))}
          <path d={area} fill="url(#planlimegrad)" />
          <path d={path} fill="none" stroke={LIME} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={xs(N)} cy={ys(max)} r="4" fill={LIME} />
          <circle cx={xs(N)} cy={ys(max)} r="8" fill={LIME} fillOpacity="0.2" />
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(246,246,238,0.5)', fontWeight: 600, whiteSpace: 'nowrap' }}>Today · {(avgRate*100).toFixed(1)}% avg</div>
          <div className="mono" style={{ fontSize: 12, color: PAPER, marginTop: 2, fontWeight: 500 }}>€0</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: 'rgba(246,246,238,0.5)', fontWeight: 600, whiteSpace: 'nowrap' }}>At year {horizon}</div>
          <div className="mono" style={{ fontSize: 12, color: LIME, marginTop: 2, fontWeight: 700, whiteSpace: 'nowrap' }}>{hEurK(max)}</div>
        </div>
      </div>
    </Card>
  );
}

function PlanDownload({ onDownload }) {
  return (
    <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flex: '0 0 auto' }} pad={18} radius={22}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{
          width: 44, height: 56, borderRadius: 6,
          background: SOFT, position: 'relative', flexShrink: 0,
          boxShadow: `inset 0 0 0 1px ${RULE}`,
        }}>
          <div style={{ position: 'absolute', top: 8, left: 6, right: 6, height: 3, background: INK, borderRadius: 1 }} />
          <div style={{ position: 'absolute', top: 16, left: 6, right: 12, height: 2, background: '#d8d8cf' }} />
          <div style={{ position: 'absolute', top: 22, left: 6, width: 12, height: 12, background: LIME, borderRadius: 2 }} />
          <div style={{ position: 'absolute', bottom: 6, left: 6, right: 6, height: 5, background: INK, borderRadius: 1 }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <Eyebrow style={{ fontSize: 10, whiteSpace: 'nowrap' }}>Deliverable</Eyebrow>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2, letterSpacing: -0.2, whiteSpace: 'nowrap' }}>Your plan · PDF</div>
        </div>
      </div>
      <DarkCTA onClick={onDownload} style={{ padding: '11px 18px', fontSize: 13 }}>
        <Icon name="download-simple" weight="bold" size={14} />
        Download
      </DarkCTA>
    </Card>
  );
}

/* ─── PDF generation ──────────────────────────────────────────────────
 * Opens a print-styled A4 window with the full plan and triggers the
 * browser's print dialog (user saves as PDF). No external libraries. */
function generatePlanPdf(d) {
  const { state, netIncome, fixedTotal, depTotal, TOTAL_FX, leftover,
          eAmt, lAmt, fAmt, picksData, slotMonthly, avgRate, horizon } = d;
  const gross = getGrossIncome(state);
  const effRate = getEffectiveRate(state);
  const fixedRatio = netIncome > 0 ? Math.round(TOTAL_FX / netIncome * 100) : 0;
  const proj = picksData.map(p => hifiFv(slotMonthly, horizon, p.rate));
  const combined = proj.reduce((s, x) => s + x, 0);
  const contrib = lAmt * 12 * horizon;
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const row = (label, val, strong) =>
    `<tr><td>${label}</td><td class="num${strong ? ' strong' : ''}">${val}</td></tr>`;

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Budget plan — ${today}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 18mm 16mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: 'Onest', system-ui, sans-serif; color: #0e0f0d; margin: 0; }
    .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
    h1 { font-size: 26px; letter-spacing: -0.8px; margin: 0; }
    .sub { color: #62635c; font-size: 12px; margin-top: 4px; }
    .hero { background: #c5d6a1; border-radius: 14px; padding: 20px 22px; margin: 20px 0; display:flex; justify-content:space-between; align-items:flex-end; }
    .hero .big { font-size: 46px; font-weight: 800; letter-spacing: -2px; line-height: 1; }
    .eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #62635c; margin: 22px 0 8px; }
    .heroeye { color: rgba(14,15,13,0.7); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    td { padding: 7px 0; border-bottom: 1px solid #e3e3dd; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.num.strong { font-weight: 800; }
    .two { display: flex; gap: 28px; }
    .two > div { flex: 1; }
    .chips { display: flex; gap: 10px; margin-top: 6px; }
    .chip { flex:1; background:#f3f3ee; border-radius:10px; padding:10px 12px; }
    .chip .k { font-size:9px; font-weight:700; letter-spacing:.5px; text-transform:uppercase; color:#62635c; }
    .chip .v { font-size:18px; font-weight:800; margin-top:3px; }
    .foot { margin-top: 28px; font-size: 10px; color: #8b8c83; line-height: 1.5; border-top: 1px solid #e3e3dd; padding-top: 12px; }
    .pill { display:inline-block; background:#0e0f0d; color:#c5d6a1; font-size:11px; font-weight:700; padding:3px 9px; border-radius:99px; }
  </style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div><h1>Your budget plan</h1><div class="sub">Generated ${today} · all figures EUR / month unless noted</div></div>
      <span class="pill">${horizon}-year horizon</span>
    </div>

    <div class="hero">
      <div>
        <div class="eyebrow heroeye" style="margin-top:0">Available to allocate each month</div>
        <div class="big">€${Math.round(leftover).toLocaleString('en-GB')}</div>
      </div>
      <div style="text-align:right" class="mono">
        <div style="font-size:11px;color:rgba(14,15,13,0.7)">${netIncome>0?Math.round(leftover/netIncome*100):0}% of net income</div>
      </div>
    </div>

    <div class="two">
      <div>
        <div class="eyebrow" style="margin-top:0">Income</div>
        <table>
          ${state.incomeIsGross ? row('Gross (entered)', '€'+Math.round(state.income).toLocaleString('en-GB')) : ''}
          ${state.incomeIsGross ? row('Deductions ('+Math.round(effRate*100)+'% · '+(state.taxMode==='manual'?'manual':'IRPF + SS est.')+')', '−€'+Math.round(state.income-netIncome).toLocaleString('en-GB')) : ''}
          ${row('Net income', '€'+Math.round(netIncome).toLocaleString('en-GB'), true)}
        </table>

        <div class="eyebrow">Fixed costs · ${fixedRatio}% of net (${fixedRatio<=55?'healthy':fixedRatio<=70?'okay':'tight'})</div>
        <table>
          ${state.fixedItems.map(it => row(it.label + (it.id==='rent' ? ` (${it.sharedPct}% share)` : ''),
              '€'+Math.round(it.id==='rent' ? it.amount*it.sharedPct/100 : it.amount).toLocaleString('en-GB'))).join('')}
          ${state.dependents.map(dep => row(dep.name + ' ('+dep.type+')', '€'+Math.round(dep.amount).toLocaleString('en-GB'))).join('')}
          ${row('Total fixed', '€'+Math.round(TOTAL_FX).toLocaleString('en-GB'), true)}
        </table>
      </div>

      <div>
        <div class="eyebrow" style="margin-top:0">Allocation of leftover · ${state.split.e}/${state.split.l}/${state.split.f}</div>
        <table>
          ${row('Emergency fund ('+state.split.e+'%)', '€'+Math.round(eAmt).toLocaleString('en-GB'))}
          ${row('Long-term invest ('+state.split.l+'%)', '€'+Math.round(lAmt).toLocaleString('en-GB'))}
          ${row('Fun money ('+state.split.f+'%)', '€'+Math.round(fAmt).toLocaleString('en-GB'))}
        </table>

        <div class="eyebrow">Long-term investments · €${Math.round(slotMonthly).toLocaleString('en-GB')} into each</div>
        <table>
          ${picksData.map((p,i) => row(p.name + ' ('+(p.risk==='low'?'low':'med')+' · '+(p.rate*100).toFixed(1)+'%)',
              '€'+Math.round(proj[i]).toLocaleString('en-GB'))).join('')}
        </table>
        <div class="chips">
          <div class="chip"><div class="k">In ${horizon} yr</div><div class="v">€${Math.round(contrib).toLocaleString('en-GB')}</div></div>
          <div class="chip"><div class="k">Projected value</div><div class="v">€${Math.round(combined).toLocaleString('en-GB')}</div></div>
          <div class="chip"><div class="k">Growth</div><div class="v">+${contrib>0?Math.round((combined/contrib-1)*100):0}%</div></div>
        </div>
      </div>
    </div>

    <div class="foot">
      Projections assume contributions compound monthly at each product's historical average rate (blended ${(avgRate*100).toFixed(1)}%). Past performance does not guarantee future results. Tax figures are an estimate and not financial or tax advice — confirm with a qualified adviser. Prepared with Budget Advisor.
    </div>
    <script>window.onload = function(){ (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function(){ setTimeout(function(){ window.print(); }, 250); }); };</script>
  </body></html>`;

  const w = window.open('', '_blank');
  if (!w) { alert('Please allow pop-ups to download your plan PDF.'); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

window.StepPlan = StepPlan;
