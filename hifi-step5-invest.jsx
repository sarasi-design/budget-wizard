// hifi-step5-invest.jsx
function StepInvest({ state, update, onNext }) {
  const isMobile = useHifiMobile();
  const fixedTotal = state.fixedItems.reduce((s, it) => {
    if (it.id === 'rent') return s + (it.amount * (it.sharedPct / 100));
    return s + it.amount;
  }, 0);
  const depTotal = state.dependents.reduce((s, d) => s + d.amount, 0);
  const leftover = Math.max(0, getNetIncome(state) - fixedTotal - depTotal);
  const longTerm = leftover * state.split.l / 100;

  const picks = state.picks;
  const setPick = (idx, id) => {
    const next = picks.slice();
    next[idx] = id;
    update({ picks: next });
  };
  const filled = picks.filter(Boolean);
  const slotMonthly = filled.length > 0 ? longTerm / filled.length : 0;
  const rates = filled.map(id => hifiFind(id).rate);
  const avgRate = rates.length ? rates.reduce((a,b) => a+b, 0) / rates.length : 0;
  const riskCount = { low: 0, med: 0 };
  filled.forEach(id => { riskCount[hifiFind(id).risk]++; });

  const proj30 = picks.map(id => id ? hifiFv(slotMonthly, 30, hifiFind(id).rate) : 0);
  const totalProj30 = proj30.reduce((a,b) => a+b, 0);
  const totalIn = slotMonthly * 12 * 30 * filled.length;

  return (
    <HifiStage gridTemplateRows="auto 1fr">
      {/* HERO (lime) */}
      <Card lime style={{ gridColumn: '1 / span 5', gridRow: '1 / span 2', padding: 32, display: 'flex', flexDirection: 'column' }}>
        <CardTitle kicker="Step 05 of 06" title="Where does the long-term money go?" subtitle="Up to 3 Spanish products. Low or medium risk only." accent />

        <div style={{ marginTop: 30 }}>
          <Eyebrow style={{ color: 'rgba(14,15,13,0.78)' }}>Each slot receives</Eyebrow>
          <BigAmount amount={slotMonthly} size={isMobile ? 48 : 70} style={{ marginTop: 6 }} />
          <div style={{ fontSize: 12, color: 'rgba(14,15,13,0.78)', marginTop: 8, fontWeight: 500 }}>
            of your {hEur(longTerm)}/mo long-term bucket, split across {filled.length || 0} {filled.length === 1 ? 'slot' : 'slots'}.
          </div>
        </div>

        {/* AVG rate */}
        <div style={{ marginTop: 26, padding: '18px 0', borderTop: '1px solid rgba(14,15,13,0.15)', borderBottom: '1px solid rgba(14,15,13,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <Eyebrow style={{ color: 'rgba(14,15,13,0.78)', whiteSpace: 'nowrap' }}>Blended rate</Eyebrow>
            <span className="mono" style={{ fontSize: 12, color: 'rgba(14,15,13,0.78)', fontWeight: 500, whiteSpace: 'nowrap' }}>historical avg</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 6, gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: isMobile ? 44 : 56, fontWeight: 700, letterSpacing: -2, lineHeight: 1 }}>{(avgRate * 100).toFixed(1)}</span>
            <span style={{ fontSize: 22, fontWeight: 600 }}>%</span>
            <span style={{ fontSize: 11, color: 'rgba(14,15,13,0.72)', fontWeight: 500, whiteSpace: 'nowrap' }}>per year, weighted equal</span>
          </div>
        </div>

        {/* Risk distribution */}
        <div style={{ marginTop: 22 }}>
          <Eyebrow style={{ color: 'rgba(14,15,13,0.78)' }}>Risk mix</Eyebrow>
          <div style={{ marginTop: 10, height: 16, display: 'flex', background: 'rgba(14,15,13,0.12)', borderRadius: 999, overflow: 'hidden' }}>
            {filled.length > 0 && (
              <>
                <div style={{ width: `${(riskCount.low / filled.length) * 100}%`, background: INK }} />
                <div style={{ width: `${(riskCount.med / filled.length) * 100}%`, background: 'rgba(14,15,13,0.45)' }} />
              </>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'rgba(14,15,13,0.7)', fontWeight: 600, gap: 8 }}>
            <span style={{ whiteSpace: 'nowrap' }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: INK, marginRight: 6 }} />{riskCount.low} low</span>
            <span style={{ whiteSpace: 'nowrap' }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'rgba(14,15,13,0.45)', marginRight: 6 }} />{riskCount.med} medium</span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: 'rgba(14,15,13,0.72)', fontWeight: 500, maxWidth: 200, lineHeight: 1.4 }}>
            Rates are historical averages. Past performance ≠ guarantees.
          </div>
          <DarkCTA onClick={onNext}>
            See plan
            <Icon name="arrow-right" weight="bold" size={14} />
          </DarkCTA>
        </div>
      </Card>

      {/* SLOTS row */}
      <div style={{ gridColumn: '6 / span 7', gridRow: '1', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 10 }}>
        {[0, 1, 2].map(i => (
          <InvSlotCard key={i} idx={i} pickId={picks[i]} setPick={(id) => setPick(i, id)} monthly={slotMonthly} highlight={i === 1} />
        ))}
      </div>

      {/* COMBINED projection */}
      <Card dark style={{ gridColumn: '6 / span 7', gridRow: '2', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(246,246,238,0.55)' }}>Combined projection</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>30-year growth of long-term bucket</div>
          </div>
          <div style={{ background: LIME, color: INK, padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
            +{hEurK(totalProj30 - totalIn)}
          </div>
        </div>

        {/* per-product mini bars */}
        <div style={{ marginTop: 22 }}>
          {picks.map((id, i) => {
            const inv = id ? hifiFind(id) : null;
            const w = totalProj30 > 0 ? (proj30[i] / totalProj30) * 100 : 0;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 10, gap: 12 }}>
                <div style={{ width: 130, fontSize: 12, fontWeight: 600, color: inv ? PAPER : 'rgba(246,246,238,0.4)' }}>
                  {inv ? inv.name.length > 22 ? inv.name.slice(0, 22) + '…' : inv.name : `Slot ${i+1} · empty`}
                </div>
                <div style={{ flex: 1, height: 22, background: 'rgba(246,246,238,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{
                    width: `${w}%`, height: '100%',
                    background: i === 1 ? LIME : 'rgba(246,246,238,0.55)',
                    borderRadius: 999,
                  }} />
                </div>
                <div className="mono" style={{ width: 70, textAlign: 'right', fontSize: 13, fontWeight: 600, color: inv ? PAPER : 'rgba(246,246,238,0.4)' }}>
                  {inv ? hEurK(proj30[i]) : '—'}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(246,246,238,0.12)' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: 'rgba(246,246,238,0.5)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Total at 30 yr</div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 2 }}>
              <span style={{ fontSize: 18, fontWeight: 600 }}>€</span>
              <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1 }}>{Math.round(totalProj30/1000).toLocaleString('en-GB')}</span>
              <span style={{ fontSize: 18, fontWeight: 600 }}>k</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: 'rgba(246,246,238,0.5)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>You'll contribute</div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 500, marginTop: 4, whiteSpace: 'nowrap' }}>{hEurK(totalIn)} over 30 yr</div>
          </div>
        </div>
      </Card>
    </HifiStage>
  );
}

/* Slot card */
function InvSlotCard({ idx, pickId, setPick, monthly, highlight }) {
  const inv = pickId ? hifiFind(pickId) : null;
  const [open, setOpen] = React.useState(false);
  const proj = inv ? hifiFv(monthly, 30, inv.rate) : 0;

  // tiny sparkline
  const points = inv ? Array.from({length: 31}, (_, y) => hifiFv(monthly, y, inv.rate)) : [];
  const maxP = points.length ? points[points.length-1] : 1;

  return (
    <Card style={{
      padding: 22,
      background: highlight && inv ? LIME : CARD,
      height: '100%',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <Eyebrow style={{ color: highlight && inv ? 'rgba(14,15,13,0.78)' : INK_3, whiteSpace: 'nowrap' }}>Slot {idx + 1}</Eyebrow>
        {inv && (
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
            background: highlight ? INK : (inv.risk === 'low' ? '#e8efd6' : '#fff4d6'),
            color: highlight ? LIME : INK,
            padding: '4px 8px', borderRadius: 999, whiteSpace: 'nowrap',
          }}>{inv.risk === 'low' ? 'Low risk' : 'Med risk'}</span>
        )}
      </div>

      {inv ? (
        <>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 14, lineHeight: 1.2, letterSpacing: -0.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{inv.name}</div>
          <div style={{ fontSize: 11, color: highlight ? 'rgba(14,15,13,0.78)' : INK_2, marginTop: 6, fontWeight: 500, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{inv.blurb}</div>

          <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.8, lineHeight: 1 }}>{(inv.rate * 100).toFixed(1)}%</span>
            <span style={{ fontSize: 10, color: highlight ? 'rgba(14,15,13,0.78)' : INK_3, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>p.a. avg</span>
          </div>

          {/* mini sparkline */}
          <div style={{ marginTop: 10, height: 44, position: 'relative' }}>
            <svg width="100%" height="44" viewBox="0 0 100 44" preserveAspectRatio="none">
              <path
                d={'M' + points.map((v, i) => `${(i/30)*100},${44 - (v/maxP)*38 - 3}`).join(' L')}
                fill="none"
                stroke={highlight ? INK : INK_2}
                strokeWidth="1.8"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8, paddingTop: 12, borderTop: `1px solid ${highlight ? 'rgba(14,15,13,0.15)' : RULE}` }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, color: highlight ? 'rgba(14,15,13,0.78)' : INK_3, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>30 yr value</div>
              <div className="mono" style={{ fontSize: 17, fontWeight: 700, marginTop: 2, whiteSpace: 'nowrap' }}>{hEurK(proj)}</div>
            </div>
            <button onClick={() => setOpen(!open)} style={{
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
              background: highlight ? INK : SOFT, color: highlight ? LIME : INK,
              padding: '8px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
            }}>
              Swap
              <Icon name="caret-down" weight="bold" size={10} />
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: INK_3 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, border: `2px dashed ${INK_3}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="plus" weight="bold" size={20} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Empty slot</div>
          </div>
          <button onClick={() => setOpen(true)} style={{
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: INK, color: LIME, padding: '10px 14px', borderRadius: 999,
            fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>Pick product</button>
        </>
      )}

      {/* dropdown overlay */}
      {open && (
        <SwapOverlay
          current={pickId}
          onPick={(id) => { setPick(id); setOpen(false); }}
          onClear={() => { setPick(''); setOpen(false); }}
          onClose={() => setOpen(false)}
        />
      )}
    </Card>
  );
}

function SwapOverlay({ current, onPick, onClear, onClose }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: CARD, borderRadius: 28, padding: 18,
      display: 'flex', flexDirection: 'column', zIndex: 5,
      boxShadow: '0 12px 32px rgba(14,15,13,0.18)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Eyebrow>Pick a product</Eyebrow>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: INK_3, cursor: 'pointer', padding: 4 }}>
          <Icon name="x" weight="bold" size={14} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {Object.entries(HIFI_INVESTMENTS).map(([key, group]) => (
          <div key={key} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: INK_3, textTransform: 'uppercase', padding: '4px 6px' }}>{group.label}</div>
            {group.options.map(o => (
              <button key={o.id} onClick={() => onPick(o.id)} style={{
                width: '100%', textAlign: 'left',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: current === o.id ? LIME : 'transparent',
                color: INK, padding: '8px 10px', borderRadius: 12,
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                fontSize: 12, fontWeight: 600,
              }}>
                <span>{o.name}</span>
                <span className="mono" style={{ color: current === o.id ? INK : INK_2 }}>{(o.rate*100).toFixed(1)}%</span>
              </button>
            ))}
          </div>
        ))}
      </div>
      {current && (
        <button onClick={onClear} style={{
          background: 'transparent', color: INK_2, border: `1px solid ${RULE}`,
          padding: '8px 12px', borderRadius: 12, fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 6, fontFamily: 'inherit',
        }}>Clear slot</button>
      )}
    </div>
  );
}

window.StepInvest = StepInvest;
