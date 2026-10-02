// hifi-step4-allocate.jsx
function StepAllocate({ state, update, onNext }) {
  // Derived: leftover (income - fixed - deps)
  const fixedTotal = state.fixedItems.reduce((s, it) => {
    if (it.id === 'rent') return s + (it.amount * (it.sharedPct / 100));
    return s + it.amount;
  }, 0);
  const depTotal = state.dependents.reduce((s, d) => s + d.amount, 0);
  const netIncome = getNetIncome(state);
  const leftover = Math.max(0, netIncome - fixedTotal - depTotal);

  const { e, l, f } = state.split;
  const setE = (v) => {
    const cap = 100 - 5; // keep at least 5% for the other two combined
    const ne = Math.max(0, Math.min(cap, v));
    // proportionally adjust l, keep f if possible
    const rem = 100 - ne;
    const ratio = (l + f) > 0 ? l / (l + f) : 0.66;
    const nl = Math.round(rem * ratio);
    const nf = rem - nl;
    update({ split: { e: ne, l: nl, f: nf } });
  };
  const setL = (v) => {
    const cap = 100 - e - 5;
    const nl = Math.max(0, Math.min(cap, v));
    const nf = 100 - e - nl;
    update({ split: { e, l: nl, f: nf } });
  };

  const buckets = [
    { key: 'e', label: 'Emergency',  pct: e, color: '#e2d8ff' },
    { key: 'l', label: 'Long-term',  pct: l, color: '#9a72ec' },
    { key: 'f', label: 'Fun money',  pct: f, color: '#6a45d4' },
  ];

  const presets = [
    { id: 'default',  label: 'Default',         e: 40, l: 40, f: 20, desc: 'A balanced starting point' },
    { id: 'fast',     label: 'Save fast',       e: 60, l: 30, f: 10, desc: 'Your job feels uncertain' },
    { id: 'steady',   label: 'Steady builder',  e: 40, l: 30, f: 30, desc: 'Stable income, want balance' },
    { id: 'ahead',    label: 'Get ahead',       e: 30, l: 50, f: 20, desc: 'You have 1–2 months saved' },
    { id: 'growth',   label: 'Growth-first',    e: 15, l: 65, f: 20, desc: 'You have 3+ months saved' },
    { id: 'goal',     label: 'Goal saver',      e: 70, l: 20, f: 10, desc: 'Saving for a deposit or big event' },
    { id: 'enjoy',    label: 'Enjoy now',       e: 30, l: 30, f: 40, desc: 'Prioritise life right now' },
  ];
  const activePreset = presets.find(p => p.e === e && p.l === l && p.f === f);

  const presetRef = React.useRef(null);
  const [presetAtEnd, setPresetAtEnd] = React.useState(false);
  const onPresetScroll = () => { const el = presetRef.current; if (el) setPresetAtEnd(el.scrollTop + el.clientHeight >= el.scrollHeight - 4); };
  const scrollPresets = () => { const el = presetRef.current; if (!el) return; el.scrollTo({ top: presetAtEnd ? 0 : el.scrollTop + 216, behavior: 'smooth' }); };
  const applyPreset = (p) => update({ split: { e: p.e, l: p.l, f: p.f } });

  const amt = (pct) => leftover * pct / 100;

  return (
    <HifiStage gridTemplateRows="1fr">
      {/* HERO (lime) — the sliders */}
      <Card lime style={{ gridColumn: '1 / span 7', gridRow: '1', padding: 32, display: 'flex', flexDirection: 'column' }}>
        <CardTitle kicker="Step 04 of 06" title={`Split your ${hEur(leftover)} leftover`} subtitle={`Net income ${hEur(netIncome)} − fixed ${hEur(fixedTotal + depTotal)} = ${hEur(leftover)} to allocate.`} accent />

        {/* sliders */}
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AllocSliderRow label="Emergency fund" pct={e} amount={amt(e)} onChange={v => setE(parseInt(v.target.value,10))} note="Easy-access savings" />
          <AllocSliderRow label="Long-term invest" pct={l} amount={amt(l)} onChange={v => setL(parseInt(v.target.value,10))} note="Goes to step 05 products" />
          <AllocAutoRow label="Fun money" pct={f} amount={amt(f)} note="Auto-balanced from the other two" />
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
          <div style={{ fontSize: 14, color: 'rgba(245,241,251,0.92)', fontWeight: 400, whiteSpace: 'nowrap' }}>
            Total: <span style={{ color: INK, fontWeight: 500 }}>{e + l + f}%</span> · {hEur(amt(e) + amt(l) + amt(f))} / mo
          </div>
        </div>
      </Card>

      {/* RIGHT column */}
      <div style={{ gridColumn: '8 / span 5', gridRow: '1', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* PRESETS */}
        <Card style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <Eyebrow>Pick a starting point</Eyebrow>
          <div style={{ position: 'relative', marginTop: 12 }}>
          <div ref={presetRef} onScroll={onPresetScroll} className="preset-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 6, height: 280, overflowY: 'auto', paddingRight: 6, marginRight: -6, paddingBottom: 8 }}>
            {presets.map(p => {
              const active = activePreset?.id === p.id;
              return (
                <button key={p.id} onClick={() => applyPreset(p)} style={{
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  background: active ? LIME : SOFT,
                  color: INK, padding: '12px 16px', borderRadius: 14, minWidth: 0,
                  display: 'grid', flexShrink: 0, gridTemplateColumns: 'minmax(0,1fr) 96px', alignItems: 'center', gap: 16,
                }} title={`Emergency ${p.e}% · Long-term ${p.l}% · Fun ${p.f}%`}>
                  <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>{p.label}</span>
                    <span style={{ fontSize: 14, color: active ? 'rgba(245,241,251,0.92)' : INK_2, fontWeight: 400, lineHeight: 1.35, textWrap: 'pretty' }}>{p.desc}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ height: 6, display: 'flex', gap: 2, borderRadius: 999, outline: active ? '1px solid rgba(255,255,255,0.5)' : 'none', outlineOffset: 1 }}>
                      {[[p.e, buckets[0].color], [p.l, buckets[1].color], [p.f, buckets[2].color]].map(([v, c], i) => (
                        <div key={i} style={{ flex: `${v} 1 0`, background: c, borderRadius: 999 }} />
                      ))}
                    </div>
                    <span className="mono" style={{ fontSize: 14, color: active ? 'rgba(245,241,251,0.92)' : INK_3, textAlign: 'right' }}>{p.e}·{p.l}·{p.f}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <button className="preset-arrow" onClick={scrollPresets} aria-label={presetAtEnd ? 'Scroll presets to top' : 'Show more presets'} style={{
            position: 'absolute', left: '50%', bottom: -6, transform: 'translateX(-50%)',
            width: 40, height: 40, borderRadius: 999, border: '1px solid rgba(190,165,255,0.35)', cursor: 'pointer',
            background: '#2a1f45', color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(10,4,24,0.55)',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: presetAtEnd ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }}><path d="M8 3v10M3.5 8.5L8 13l4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          </div>
        </Card>

        {/* LIVE PREVIEW */}
        <Card style={{ padding: 24, flex: 'none' }}>
          <Eyebrow>Where it goes</Eyebrow>

          {/* stacked bar */}
          <div style={{ marginTop: 16, height: 6, display: 'flex', gap: 4 }}>
            {buckets.filter(b => b.pct > 0).map(b => (
              <div key={b.key} style={{ flex: `${b.pct} 1 0`, background: b.color, borderRadius: 999, transition: 'flex-grow 300ms ease' }} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 10, gap: 4 }}>
            {buckets.map(b => (
              <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: INK_2, fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: b.color, flexShrink: 0 }} />
                <span>{b.label}</span>
                <span className="mono" style={{ color: INK, fontWeight: 500 }}>{b.pct}%</span>
              </div>
            ))}
          </div>

          {/* 3 bucket stats */}
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            {buckets.map(b => (
              <div key={b.key} style={{ flex: 1, background: SOFT, borderRadius: 18, padding: '11px 14px' }}>
                <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase', color: INK_3 }}>{b.label}</div>
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 14, fontWeight: 500, marginRight: 1 }}>€</span>
                  <span style={{ fontSize: 26, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1 }}>{Math.round(amt(b.pct)).toLocaleString('en-GB')}</span>
                  <span style={{ fontSize: 14, color: INK_3, fontWeight: 400, marginLeft: 3 }}>/mo</span>
                </div>
              </div>
            ))}
          </div>

          {/* projection hint */}
          <Note tone="good" label="AT THIS PACE" style={{ marginTop: 12 }}>
            Emergency 3-month target ({hEur((fixedTotal + depTotal) * 3)}) reached in <strong>{amt(e) > 0 ? Math.ceil(((fixedTotal + depTotal) * 3) / amt(e)) : '∞'} months</strong>. After that, you can switch to growth-first.
          </Note>
        </Card>
      </div>
    </HifiStage>
  );
}

function AllocSliderRow({ label, pct, amount, onChange, note }) {
  // Pointer-driven slider — native <input type="range"> with opacity:0 overlay
  // had broken click-to-position; this maps any pointer X directly to a value.
  const trackRef = React.useRef(null);
  const MAX = 95;
  const STEP = 1;
  const setFromX = (clientX) => {
    const el = trackRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const raw = ratio * MAX;
    const snapped = Math.round(raw / STEP) * STEP;
    onChange({ target: { value: String(snapped) } });
  };
  const onDown = (e) => {
    e.preventDefault();
    setFromX(e.clientX);
    const move = (ev) => setFromX(ev.clientX);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  const onKey = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); onChange({ target: { value: String(Math.max(0, pct - 5)) } }); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); onChange({ target: { value: String(Math.min(MAX, pct + 5)) } }); }
    else if (e.key === 'Home') { e.preventDefault(); onChange({ target: { value: '0' } }); }
    else if (e.key === 'End') { e.preventDefault(); onChange({ target: { value: String(MAX) } }); }
  };
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, marginBottom: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: INK, whiteSpace: 'nowrap' }}>{label}</div>
          <div style={{ fontSize: 14, color: 'rgba(245,241,251,0.92)', fontWeight: 400, marginTop: 1, whiteSpace: 'nowrap' }}>{note}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexShrink: 0 }}>
          <span className="mono" style={{ fontSize: 14, color: 'rgba(245,241,251,0.92)', fontWeight: 500, whiteSpace: 'nowrap' }}>{hEur(amount)}</span>
          <div style={{ display: 'flex', alignItems: 'baseline', background: INK, color: LIME, padding: '6px 12px', borderRadius: 999 }}>
            <span style={{ fontSize: 22, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1 }}>{pct}</span>
            <span style={{ fontSize: 14, fontWeight: 500, marginLeft: 2 }}>%</span>
          </div>
        </div>
      </div>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={label + ', percent of leftover'}
        aria-valuemin={0} aria-valuemax={MAX} aria-valuenow={pct}
        onPointerDown={onDown}
        onKeyDown={onKey}
        style={{ position: 'relative', height: 28, cursor: 'pointer', touchAction: 'none' }}
      >
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 6, marginTop: -3, background: 'rgba(245,241,251,0.18)', borderRadius: 999, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: 0, top: '50%', height: 6, marginTop: -3, width: `${(pct / MAX) * 100}%`, background: INK, borderRadius: 999, pointerEvents: 'none' }} />
        <div style={{
          position: 'absolute', left: `calc(${(pct / MAX) * 100}% - 9px)`, top: '50%',
          width: 18, height: 18, marginTop: -9,
          background: INK, border: `2px solid ${LIME}`, borderRadius: '50%',
          pointerEvents: 'none',
          boxShadow: '0 2px 6px rgba(0,0,0,0.45)',
        }} />
      </div>
    </div>
  );
}

function AllocAutoRow({ label, pct, amount, note }) {
  return (
    <div style={{ background: 'rgba(245,241,251,0.06)', borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: INK, whiteSpace: 'nowrap' }}>{label}</div>
          <div style={{ fontSize: 14, color: 'rgba(245,241,251,0.92)', fontWeight: 400, marginTop: 1, whiteSpace: 'nowrap' }}>{note}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexShrink: 0 }}>
          <span className="mono" style={{ fontSize: 14, color: 'rgba(245,241,251,0.92)', fontWeight: 500, whiteSpace: 'nowrap' }}>{hEur(amount)}</span>
          <span style={{ fontSize: 22, fontWeight: 500, letterSpacing: -0.5, color: INK }}>{pct}%</span>
        </div>
      </div>
    </div>
  );
}

window.StepAllocate = StepAllocate;
