// hifi-step2-fixed.jsx
const FixedIcon = ({ name, size = 18 }) => {
  // maps semantic category → Phosphor glyph
  const map = {
    home:   'house',
    bolt:   'lightning',
    phone:  'device-mobile',
    cart:   'shopping-cart',
    car:    'car',
    shield: 'shield-check',
    gym:    'barbell',
    flame:  'flame',
    plus:   'plus',
    edit:   'pencil-simple',
  };
  return <Icon name={map[name] || 'circle'} weight="bold" size={size} />;
};

function StepFixed({ state, update, onNext }) {
  const isMobile = useHifiMobile();
  const items = state.fixedItems;
  const totalRaw = items.reduce((s, it) => {
    if (it.id === 'rent') return s + (it.amount * (it.sharedPct / 100));
    return s + it.amount;
  }, 0);
  const depTotal = (state.dependents || []).reduce((s, d) => s + d.amount, 0);
  const total = totalRaw + depTotal;
  const ratio = total / getNetIncome(state);
  const ratioPct = Math.round(ratio * 100);
  const healthy = ratio <= 0.55;
  const warn = ratio > 0.70;

  const rentItem = items.find(it => it.id === 'rent');
  const listItems = items.filter(it => it.id !== 'rent'); // rent has its own card

  const [editingId, setEditingId] = React.useState(null);

  const setItem = (id, patch) => {
    update({ fixedItems: items.map(it => it.id === id ? { ...it, ...patch } : it) });
  };
  const addItem = () => {
    const id = 'fx' + Date.now();
    update({ fixedItems: [...items, { id, icon: 'cart', label: 'New item', amount: 50 }] });
    setEditingId(id);
  };
  const removeItem = (id) => {
    update({ fixedItems: items.filter(it => it.id !== id) });
    setEditingId(cur => cur === id ? null : cur);
  };

  const ICON_CHOICES = ['home','bolt','phone','cart','car','shield','gym','flame'];

  return (
    <HifiStage gridTemplateRows="auto 1fr">
      {/* HERO (lime) — total + ratio */}
      <Card lime style={{ gridColumn: '1 / span 8', gridRow: '1', padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <CardTitle kicker="Step 02 of 06" title="Your fixed monthly outgoings" subtitle="Everything you can't easily skip. Rent/mortgage handles sharing automatically." accent />
          <Pill style={{ background: 'rgba(14,15,13,0.08)', fontWeight: 600 }}>EUR · monthly</Pill>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 26, gap: 12, flexWrap: 'wrap' }}>
          <BigAmount amount={total} size={isMobile ? 52 : 80} />
          <div style={{ textAlign: 'right' }}>
            <Eyebrow style={{ color: 'rgba(14,15,13,0.78)' }}>Ratio to net income</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', marginTop: 4 }}>
              <span style={{ fontSize: isMobile ? 38 : 50, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1 }}>{ratioPct}</span>
              <span style={{ fontSize: 22, fontWeight: 600, marginLeft: 2 }}>%</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(14,15,13,0.78)', marginTop: 4, fontWeight: 500 }}>
              {healthy ? 'Healthy — under 55%.' : warn ? 'Tight — over 70% is risky.' : 'Workable — under 70%.'}
            </div>
          </div>
        </div>

        {/* ratio bar with thresholds */}
        <div style={{ marginTop: 22, position: 'relative', height: 22 }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 4, bottom: 4, background: 'rgba(14,15,13,0.12)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, ratioPct)}%`, height: '100%', background: INK, borderRadius: 999 }} />
          </div>
          {/* thresholds */}
          <div style={{ position: 'absolute', left: '55%', top: 0, bottom: 0, width: 2, background: 'rgba(14,15,13,0.45)' }} />
          <div style={{ position: 'absolute', left: '70%', top: 0, bottom: 0, width: 2, background: 'rgba(14,15,13,0.45)' }} />
          <div style={{ position: 'absolute', left: '55%', top: -16, transform: 'translateX(-50%)', fontSize: 9, fontWeight: 700, color: 'rgba(14,15,13,0.78)', letterSpacing: 0.5 }}>55%</div>
          <div style={{ position: 'absolute', left: '70%', top: -16, transform: 'translateX(-50%)', fontSize: 9, fontWeight: 700, color: 'rgba(14,15,13,0.78)', letterSpacing: 0.5 }}>70%</div>
        </div>
      </Card>

      {/* RENT / MORTGAGE */}
      <Card style={{ gridColumn: '9 / span 4', gridRow: '1', padding: 24 }}>
        <Eyebrow>Rent or mortgage</Eyebrow>
        <div style={{ display: 'inline-flex', marginTop: 12, background: SOFT, borderRadius: 999, padding: 4 }}>
          {['rent', 'mortgage', 'own'].map(t => (
            <button key={t} onClick={() => update({ rentType: t })} style={{
              border: 'none', background: state.rentType === t ? INK : 'transparent',
              color: state.rentType === t ? LIME : INK,
              padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}>{t === 'own' ? 'Owned' : t === 'rent' ? 'Rent' : 'Mortgage'}</button>
          ))}
        </div>

        {state.rentType !== 'own' ? (
          <>
            <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 600 }}>€</span>
              <AutoInput
                value={rentItem.amount.toLocaleString('en-GB')}
                onChange={e => {
                  const v = parseInt(e.target.value.replace(/[^\d]/g,''),10) || 0;
                  setItem('rent', { amount: v });
                }}
                fontSize={42} fontWeight={700} letterSpacing={-1} color={INK}
              />
              <span style={{ fontSize: 12, color: INK_3, fontWeight: 500 }}>/ mo {state.rentType === 'rent' ? 'rent' : 'mortgage'}</span>
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                <Eyebrow style={{ fontSize: 10, whiteSpace: 'nowrap' }}>Your share</Eyebrow>
                <span className="mono" style={{ fontSize: 12, color: INK_2, fontWeight: 500, whiteSpace: 'nowrap' }}>{rentItem.sharedPct}% = {hEur(rentItem.amount * rentItem.sharedPct / 100)}</span>
              </div>
              <LimeSlider value={rentItem.sharedPct} onChange={e => setItem('rent', { sharedPct: parseInt(e.target.value, 10) })} min={0} max={100} step={5} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: INK_3, fontWeight: 600 }}>
                <span>0% (split equally w/ many)</span><span>100% (you pay alone)</span>
              </div>
            </div>
          </>
        ) : (
          <Note label="OWN OUTRIGHT" tone="good" style={{ marginTop: 18 }}>
            We'll still count community fees, IBI, insurance under "other items" below.
          </Note>
        )}
      </Card>

      {/* ITEMS list */}
      <Card style={{ gridColumn: '1 / span 8', gridRow: '2', padding: 28, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <CardTitle kicker={`${listItems.length} items`} title="Itemised costs" />
          <Pill onClick={addItem} style={{ background: SOFT, fontWeight: 600, cursor: 'pointer' }}>
            <FixedIcon name="plus" size={14} />
            Add item
          </Pill>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 10, flex: 1, alignContent: 'start', overflowY: isMobile ? 'visible' : 'auto' }}>
          {listItems.map(it => {
            const editing = editingId === it.id;
            if (editing) {
              return (
                <div key={it.id} style={{
                  display: 'flex', flexDirection: 'column', gap: 10,
                  background: CARD, border: `1.5px solid ${INK}`, borderRadius: 18, padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {ICON_CHOICES.map(ic => (
                      <button key={ic} onClick={() => setItem(it.id, { icon: ic })} style={{
                        width: 30, height: 30, borderRadius: 9, cursor: 'pointer', border: 'none',
                        background: it.icon === ic ? INK : SOFT, color: it.icon === ic ? LIME : INK,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}><FixedIcon name={ic} size={15} /></button>
                    ))}
                  </div>
                  <input
                    value={it.label}
                    onChange={e => setItem(it.id, { label: e.target.value })}
                    placeholder="Label"
                    style={{ border: `1px solid ${RULE}`, borderRadius: 10, padding: '8px 10px', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: INK, outline: 'none', background: SOFT }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 4, border: `1px solid ${RULE}`, borderRadius: 10, padding: '8px 10px', background: SOFT }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>€</span>
                      <AutoInput
                        value={it.amount.toLocaleString('en-GB')}
                        onChange={e => setItem(it.id, { amount: parseInt(e.target.value.replace(/[^\d]/g,''),10) || 0 })}
                        fontSize={18} fontWeight={700} letterSpacing={-0.3} color={INK}
                      />
                    </div>
                    <button onClick={() => removeItem(it.id)} title="Delete" style={{ width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', background: SOFT, color: INK_2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="trash" weight="bold" size={14} />
                    </button>
                    <button onClick={() => setEditingId(null)} title="Done" style={{ width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', background: INK, color: LIME, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="check" weight="bold" size={14} />
                    </button>
                  </div>
                </div>
              );
            }
            return (
              <div key={it.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: SOFT, borderRadius: 18, padding: '14px 18px',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: CARD, color: INK,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <FixedIcon name={it.icon} size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: INK }}>{hEur(it.amount)}</div>
                </div>
                <button onClick={() => setEditingId(it.id)} style={{ background: 'transparent', border: 'none', color: INK_3, cursor: 'pointer', padding: 6 }}>
                  <FixedIcon name="edit" size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      {/* RIGHT — split-stack */}
      <div style={{ gridColumn: '9 / span 4', gridRow: '2', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card style={{ padding: 22, flex: 1 }}>
          <Eyebrow>Breakdown</Eyebrow>
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 8, fontSize: 12, color: INK_2, fontWeight: 500 }}>
              <span style={{ whiteSpace: 'nowrap' }}>Items + sharing</span>
              <span className="mono" style={{ color: INK, fontWeight: 600, whiteSpace: 'nowrap' }}>{hEur(totalRaw)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, fontSize: 12, color: INK_2, fontWeight: 500 }}>
              <span style={{ whiteSpace: 'nowrap' }}>Dependents (step 03)</span>
              <span className="mono" style={{ color: depTotal > 0 ? INK : INK_3, fontWeight: 600, whiteSpace: 'nowrap' }}>{hEur(depTotal)}</span>
            </div>
            <div style={{ height: 1, background: RULE, margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>Total fixed</span>
              <BigAmount amount={total} size={28} decColor={INK_3} />
            </div>
          </div>
          <Note tone={warn ? 'warn' : healthy ? 'good' : 'neutral'} label={warn ? 'TIGHT' : healthy ? 'HEALTHY' : 'OK'} style={{ marginTop: 18 }}>
            {warn ? 'Above 70% leaves little for savings. Consider trimming a category before continuing.' : healthy ? 'Plenty of room for emergency fund + long-term investing.' : 'Workable. You\'ll have leftover for at least one savings goal.'}
          </Note>
        </Card>

        <DarkCTA onClick={onNext} style={{ width: '100%', justifyContent: 'center', padding: '16px 22px', borderRadius: 24 }}>
          Continue to dependents
          <Icon name="arrow-right" weight="bold" size={14} />
        </DarkCTA>
      </div>
    </HifiStage>
  );
}

window.StepFixed = StepFixed;
