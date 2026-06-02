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
    { key: 'e', label: 'Emergency',  pct: e, color: '#7a9456' },
    { key: 'l', label: 'Long-term',  pct: l, color: INK },
    { key: 'f', label: 'Fun money',  pct: f, color: '#a86487' },
  ];

  const presets = [
    { id: 'default',  label: 'Default',         e: 40, l: 40, f: 20, desc: 'Balanced. Build emergency + invest in parallel.' },
    { id: 'fast',     label: 'Save fast',       e: 60, l: 30, f: 10, desc: 'Aggressive emergency fund. For job uncertainty.' },
    { id: 'steady',   label: 'Steady builder',  e: 40, l: 30, f: 30, desc: 'Equal fun + invest. Stable income, slow wealth-build.' },
    { id: 'ahead',    label: 'Get ahead',       e: 30, l: 50, f: 20, desc: 'Tilt to long-term once you have 1–2 mo buffer.' },
    { id: 'growth',   label: 'Growth-first',    e: 15, l: 65, f: 20, desc: 'Use when emergency buffer is already at 3+ months.' },
    { id: 'goal',     label: 'Goal saver',      e: 70, l: 20, f: 10, desc: 'Short-term target — house deposit, wedding, sabbatical.' },
    { id: 'enjoy',    label: 'Enjoy now',       e: 30, l: 30, f: 40, desc: 'Bigger fun bucket. Slower wealth-build.' },
  ];
  const activePreset = presets.find(p => p.e === e && p.l === l && p.f === f);

  const applyPreset = (p) => update({ split: { e: p.e, l: p.l, f: p.f } });

  const amt = (pct) => leftover * pct / 100;

  return (
    <HifiStage gridTemplateRows="1fr">
      {/* HERO (lime) — the sliders */}
      <Card lime style={{ gridColumn: '1 / span 7', gridRow: '1', padding: 32, display: 'flex', flexDirection: 'column' }}>
        <CardTitle kicker="Step 04 of 06" title={`Split your ${hEur(leftover)} leftover`} subtitle={`Net income ${hEur(netIncome)} − fixed ${hEur(fixedTotal + depTotal)} = ${hEur(leftover)} to allocate.`} accent />

        {/* sliders */}
        <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <AllocSliderRow label="Emergency fund" pct={e} amount={amt(e)} onChange={v => setE(parseInt(v.target.value,10))} note="Easy-access savings" />
          <AllocSliderRow label="Long-term invest" pct={l} amount={amt(l)} onChange={v => setL(parseInt(v.target.value,10))} note="Goes to step 05 products" />
          <AllocAutoRow label="Fun money" pct={f} amount={amt(f)} note="Auto-balanced from the other two" />
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
          <div style={{ fontSize: 12, color: 'rgba(14,15,13,0.78)', fontWeight: 500 }}>
            Total: <span style={{ color: INK, fontWeight: 700 }}>{e + l + f}%</span> · {hEur(amt(e) + amt(l) + amt(f))} / mo
          </div>
          <DarkCTA onClick={onNext}>
            Continue to invest
            <Icon name="arrow-right" weight="bold" size={14} />
          </DarkCTA>
        </div>
      </Card>

      {/* RIGHT column */}
      <div style={{ gridColumn: '8 / span 5', gridRow: '1', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* PRESETS */}
        <Card style={{ padding: 24 }}>
          <Eyebrow>Quick presets</Eyebrow>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
            {presets.map(p => {
              const active = activePreset?.id === p.id;
              return (
                <button key={p.id} onClick={() => applyPreset(p)} style={{
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  background: active ? LIME : SOFT,
                  color: INK, padding: '12px 14px', borderRadius: 16,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{p.label}</span>
                    <span className="mono" style={{ fontSize: 10, color: active ? 'rgba(14,15,13,0.7)' : INK_3, fontWeight: 600, whiteSpace: 'nowrap' }}>{p.e}/{p.l}/{p.f}</span>
                  </div>
                  <div style={{ fontSize: 11, color: active ? 'rgba(14,15,13,0.75)' : INK_2, marginTop: 4, fontWeight: 500, lineHeight: 1.35 }}>{p.desc}</div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* LIVE PREVIEW */}
        <Card style={{ padding: 24, flex: 1 }}>
          <Eyebrow>Where it goes</Eyebrow>

          {/* stacked bar */}
          <div style={{ marginTop: 14, height: 22, display: 'flex', background: SOFT, borderRadius: 999, overflow: 'hidden' }}>
            {buckets.map((b, i) => (
              <div key={b.key} style={{
                width: `${b.pct}%`, background: b.color,
                borderRight: i < buckets.length - 1 ? '2px solid #fff' : 'none',
              }} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 10, gap: 4 }}>
            {buckets.map(b => (
              <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: INK_2, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: b.color, flexShrink: 0 }} />
                <span>{b.label}</span>
                <span className="mono" style={{ color: INK, fontWeight: 600 }}>{b.pct}%</span>
              </div>
            ))}
          </div>

          {/* 3 bucket stats */}
          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            {buckets.map(b => (
              <div key={b.key} style={{ flex: 1, background: SOFT, borderRadius: 18, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: INK_3 }}>{b.label}</div>
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, marginRight: 1 }}>€</span>
                  <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.8, lineHeight: 1 }}>{Math.round(amt(b.pct)).toLocaleString('en-GB')}</span>
                </div>
                <div style={{ fontSize: 10, color: INK_3, fontWeight: 500, marginTop: 4 }}>per month</div>
              </div>
            ))}
          </div>

          {/* projection hint */}
          <Note tone="good" label="AT THIS PACE" style={{ marginTop: 18 }}>
            Emergency 3-month target ({hEur((fixedTotal + depTotal) * 3)}) reached in <strong>{amt(e) > 0 ? Math.ceil(((fixedTotal + depTotal) * 3) / amt(e)) : '∞'} months</strong>. After that, you can switch to growth-first.
          </Note>
        </Card>
      </div>
    </HifiStage>
  );
}

function AllocSliderRow({ label, pct, amount, onChange, note }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, marginBottom: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: INK, whiteSpace: 'nowrap' }}>{label}</div>
          <div style={{ fontSize: 11, color: 'rgba(14,15,13,0.78)', fontWeight: 500, marginTop: 1, whiteSpace: 'nowrap' }}>{note}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexShrink: 0 }}>
          <span className="mono" style={{ fontSize: 13, color: 'rgba(14,15,13,0.7)', fontWeight: 600, whiteSpace: 'nowrap' }}>{hEur(amount)}</span>
          <div style={{ display: 'flex', alignItems: 'baseline', background: INK, color: LIME, padding: '6px 12px', borderRadius: 999 }}>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1 }}>{pct}</span>
            <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 2 }}>%</span>
          </div>
        </div>
      </div>
      <div style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 12, marginTop: -6, background: 'rgba(14,15,13,0.15)', borderRadius: 999 }} />
        <div style={{ position: 'absolute', left: 0, top: '50%', height: 12, marginTop: -6, width: `${pct}%`, background: INK, borderRadius: 999 }} />
        <input type="range" min={0} max={95} step={5} value={pct} onChange={onChange}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', margin: 0, width: '100%', height: '100%' }} />
        <div style={{
          position: 'absolute', left: `calc(${pct}% - 14px)`, top: '50%',
          width: 28, height: 28, marginTop: -14,
          background: LIME, border: `3px solid ${INK}`, borderRadius: '50%',
          pointerEvents: 'none',
          boxShadow: '0 2px 6px rgba(14,15,13,0.25)',
        }} />
      </div>
    </div>
  );
}

function AllocAutoRow({ label, pct, amount, note }) {
  return (
    <div style={{ background: 'rgba(14,15,13,0.06)', borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: INK, whiteSpace: 'nowrap' }}>{label}</div>
          <div style={{ fontSize: 11, color: 'rgba(14,15,13,0.78)', fontWeight: 500, marginTop: 1, whiteSpace: 'nowrap' }}>{note}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexShrink: 0 }}>
          <span className="mono" style={{ fontSize: 13, color: 'rgba(14,15,13,0.7)', fontWeight: 600, whiteSpace: 'nowrap' }}>{hEur(amount)}</span>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: INK }}>{pct}%</span>
        </div>
      </div>
    </div>
  );
}

window.StepAllocate = StepAllocate;
