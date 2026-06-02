// hifi-step1-income.jsx
function StepIncome({ state, update, onNext }) {
  const isMobile = useHifiMobile();
  const net = getNetIncome(state);
  const gross = getGrossIncome(state);
  const incAnnual = net * 12;
  const grossAnnual = gross * 12;
  const median = 1750; // ES median net monthly (illustrative)
  const ratio = net / median;
  const a = hSplit(state.income);
  const effRate = getEffectiveRate(state);
  const bd = state.incomeIsGross ? hifiTaxBreakdown(state.income) : null;

  const freqs = [
    { v: 'monthly',  label: 'Monthly' },
    { v: 'biweekly', label: 'Bi-weekly' },
    { v: 'variable', label: 'Variable' },
  ];
  const employs = [
    { v: 'salaried', label: 'Salaried' },
    { v: 'self',     label: 'Self-employed' },
    { v: 'mix',      label: 'Mix of both' },
  ];

  return (
    <HifiStage gridTemplateRows="1fr 1fr">
      {/* HERO (lime) */}
      <Card lime style={{ gridColumn: '1 / span 7', gridRow: '1 / span 2', padding: 36, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <CardTitle kicker="Step 01 of 06" title="What's your monthly income?" subtitle="Salary, freelance, rentals. We build everything else from this number." accent />
          {/* Net / Gross toggle */}
          <div style={{ display: 'inline-flex', background: 'rgba(14,15,13,0.08)', borderRadius: 999, padding: 4, flexShrink: 0 }}>
            {[{v:false,label:'Net'},{v:true,label:'Gross'}].map(o => (
              <button key={String(o.v)} onClick={() => update({ incomeIsGross: o.v })} style={{
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                background: state.incomeIsGross === o.v ? INK : 'transparent',
                color: state.incomeIsGross === o.v ? LIME : INK,
                padding: '8px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700,
              }}>{o.label}</button>
            ))}
          </div>
        </div>

        {/* big editable amount */}
        <div style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontSize: isMobile ? 22 : 30, fontWeight: 600, marginRight: 6 }}>€</span>
            <AutoInput
              value={state.income.toLocaleString('en-GB')}
              onChange={e => {
                const v = parseInt(e.target.value.replace(/[^\d]/g,''), 10) || 0;
                update({ income: v });
              }}
              fontSize={isMobile ? 58 : 104} fontWeight={700} letterSpacing={isMobile ? -2 : -4} color={INK}
            />
            <span style={{ fontSize: isMobile ? 20 : 32, fontWeight: 600, color: 'rgba(14,15,13,0.72)', letterSpacing: -1, marginLeft: 2 }}>.{a.dec}</span>
          </div>
          {state.incomeIsGross ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: INK, color: LIME, padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  ≈ {hEur(net)} net / mo
                </span>
                <span style={{ fontSize: 12, color: 'rgba(14,15,13,0.72)', fontWeight: 500 }}>
                  −{Math.round(effRate*100)}% deductions · {state.taxMode === 'manual' ? 'manual rate' : 'IRPF + SS estimate'}
                </span>
              </div>

              {/* tax mode control */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                <div style={{ display: 'inline-flex', background: 'rgba(14,15,13,0.08)', borderRadius: 999, padding: 3 }}>
                  {[{v:'auto',label:'IRPF estimate'},{v:'manual',label:'My own rate'}].map(o => (
                    <button key={o.v} onClick={() => update({ taxMode: o.v })} style={{
                      border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                      background: (state.taxMode || 'auto') === o.v ? INK : 'transparent',
                      color: (state.taxMode || 'auto') === o.v ? LIME : INK,
                      padding: '6px 13px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                    }}>{o.label}</button>
                  ))}
                </div>
                {state.taxMode === 'manual' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="range" min={0} max={50} step={1}
                      value={Math.round((state.manualRate ?? 0.22) * 100)}
                      onChange={e => update({ manualRate: parseInt(e.target.value,10) / 100 })}
                      style={{ width: 120, accentColor: INK, cursor: 'pointer' }} />
                    <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: INK, minWidth: 38 }}>{Math.round((state.manualRate ?? 0.22)*100)}%</span>
                  </div>
                )}
              </div>

              {/* auto breakdown chips */}
              {state.taxMode !== 'manual' && bd && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <div style={{ flex: 1, background: 'rgba(14,15,13,0.06)', borderRadius: 12, padding: '8px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'rgba(14,15,13,0.6)' }}>IRPF</div>
                    <div className="mono" style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>−{hEur(bd.irpfMonthly)}</div>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(14,15,13,0.06)', borderRadius: 12, padding: '8px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'rgba(14,15,13,0.6)' }}>Soc. Sec.</div>
                    <div className="mono" style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>−{hEur(bd.ssMonthly)}</div>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(14,15,13,0.06)', borderRadius: 12, padding: '8px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'rgba(14,15,13,0.6)' }}>Effective</div>
                    <div className="mono" style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{Math.round(effRate*100)}%</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'rgba(14,15,13,0.72)', marginTop: 8, fontWeight: 500 }}>Tap to edit · all figures EUR · {state.freq === 'monthly' ? 'every month' : state.freq === 'biweekly' ? 'every 2 weeks → normalised to monthly' : 'monthly average across the year'}</div>
          )}
        </div>

        {/* selectors */}
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(14,15,13,0.78)', marginBottom: 10 }}>Pay rhythm</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {freqs.map(f => (
              <Pill key={f.v}
                onClick={() => update({ freq: f.v })}
                style={{
                  background: state.freq === f.v ? INK : 'rgba(14,15,13,0.08)',
                  color: state.freq === f.v ? LIME : INK,
                  fontWeight: 600, padding: '10px 16px',
                }}>{f.label}</Pill>
            ))}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(14,15,13,0.78)', marginBottom: 10 }}>Employment</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {employs.map(e => (
              <Pill key={e.v}
                onClick={() => update({ employment: e.v })}
                style={{
                  background: state.employment === e.v ? INK : 'rgba(14,15,13,0.08)',
                  color: state.employment === e.v ? LIME : INK,
                  fontWeight: 600, padding: '10px 16px',
                }}>{e.label}</Pill>
            ))}
          </div>
        </div>

        {/* spacer */}
        <div style={{ flex: 1 }} />

        {/* median caption */}
        <div style={{ fontSize: 12, color: 'rgba(14,15,13,0.78)', fontWeight: 500 }}>
          <span style={{ color: INK, fontWeight: 700 }}>~{Math.round(ratio*100)}%</span> of Spain's median net wage (€1,750/mo, INE 2024).
        </div>
      </Card>

      {/* RIGHT column — stack annual + what-counts + CTA */}
      <div style={{ gridColumn: '8 / span 5', gridRow: '1 / span 2', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card style={{ padding: 28 }}>
          <CardTitle kicker="Annual view" title={state.incomeIsGross ? 'Gross / net per year' : 'Net per year'} subtitle={state.incomeIsGross ? 'What this looks like annualised, both before and after tax.' : 'What this monthly figure looks like annualised.'} />
          <div style={{ marginTop: 22 }}>
            {state.incomeIsGross && (
              <>
                <Eyebrow style={{ fontSize: 10 }}>Gross / year</Eyebrow>
                <BigAmount amount={grossAnnual} size={42} decColor={INK_3} style={{ marginTop: 2 }} />
                <div style={{ height: 1, background: RULE, margin: '14px 0' }} />
              </>
            )}
            <Eyebrow style={{ fontSize: 10 }}>Net / year</Eyebrow>
            <BigAmount amount={incAnnual} size={state.incomeIsGross ? 42 : 58} decColor={INK_3} style={{ marginTop: 2 }} />
            <div style={{ fontSize: 12, color: INK_2, marginTop: 8, fontWeight: 500 }}>{hEur(net * 14)} <span style={{ color: INK_3 }}>if 14 payments/yr (extras in Jun + Dec)</span></div>
          </div>

          {/* mini comparison bar */}
          <div style={{ marginTop: 22, padding: '16px 0 0', borderTop: `1px solid ${RULE}` }}>
            <Eyebrow>vs Spain median</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 6 }}>
              <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, lineHeight: 1 }}>{(ratio).toFixed(2)}×</span>
              <span style={{ fontSize: 12, color: INK_3, marginLeft: 10, fontWeight: 500 }}>median (€1,750/mo net)</span>
            </div>
            <div style={{ marginTop: 14, height: 16, background: SOFT, borderRadius: 999, position: 'relative', overflow: 'visible' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%', background: LIME, borderRadius: 999 }} />
              <div style={{ position: 'absolute', left: `${Math.min(98, ratio*50)}%`, top: -3, bottom: -3, width: 4, background: INK, borderRadius: 2 }} />
              <div style={{ position: 'absolute', left: `${Math.min(98, ratio*50)}%`, top: -20, transform: 'translateX(-50%)', fontSize: 10, fontWeight: 700, color: INK, whiteSpace: 'nowrap' }}>you</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: INK_3, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              <span>€0</span><span>median</span><span>2× median</span>
            </div>
          </div>
        </Card>

        <Card style={{ padding: 24, flex: 1 }}>
          <CardTitle kicker="What to include" title="Count everything regular" />
          <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['Salary / freelance income', true],
              ['Rental income from properties', true],
              ['Investment distributions if monthly', true],
              ['One-off bonuses (handle separately)', false],
              ['Side hustles under €100/mo', false],
            ].map(([txt, yes], i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 12.5, color: INK, fontWeight: 500 }}>
                <span style={{
                  width: 20, height: 20, borderRadius: 999, flexShrink: 0,
                  background: yes ? LIME : SOFT, color: INK,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                }}>{yes ? '✓' : '–'}</span>
                <span style={{ color: yes ? INK : INK_3 }}>{txt}</span>
              </li>
            ))}
          </ul>
        </Card>

        <DarkCTA onClick={onNext} style={{ width: '100%', justifyContent: 'center', padding: '16px 22px', borderRadius: 24 }}>
          Continue to fixed costs
          <Icon name="arrow-right" weight="bold" size={14} />
        </DarkCTA>
      </div>
    </HifiStage>
  );
}

window.StepIncome = StepIncome;
