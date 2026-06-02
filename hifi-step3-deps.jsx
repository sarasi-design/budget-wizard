// hifi-step3-deps.jsx
const DepIcon = ({ type, size = 22 }) => {
  const map = {
    child:   'baby',
    pet:     'paw-print',
    parent:  'user',
    partner: 'heart',
    other:   'users-three',
  };
  return <Icon name={map[type] || 'user'} weight="bold" size={size} />;
};

const DEP_TYPES = [
  { v: 'child',   label: 'Child' },
  { v: 'pet',     label: 'Pet' },
  { v: 'parent',  label: 'Parent' },
  { v: 'partner', label: 'Partner' },
  { v: 'other',   label: 'Other' },
];

function StepDeps({ state, update, onNext }) {
  const deps = state.dependents;
  const total = deps.reduce((s, d) => s + d.amount, 0);
  const [draftType, setDraftType] = React.useState('child');

  const addDep = () => {
    const id = 'd' + Date.now();
    const defaultName = { child: 'New child', pet: 'New pet', parent: 'Family member', partner: 'Partner', other: 'New' }[draftType];
    const defaultAmt  = { child: 200, pet: 50, parent: 150, partner: 0, other: 100 }[draftType];
    update({ dependents: [...deps, { id, type: draftType, name: defaultName, amount: defaultAmt }] });
  };
  const removeDep = (id) => update({ dependents: deps.filter(d => d.id !== id) });
  const editDep = (id, patch) => update({ dependents: deps.map(d => d.id === id ? { ...d, ...patch } : d) });

  return (
    <HifiStage gridTemplateRows="auto 1fr">
      {/* HERO (lime) */}
      <Card lime style={{ gridColumn: '1 / span 8', gridRow: '1', padding: 32 }}>
        <CardTitle kicker="Step 03 of 06" title="Who else depends on this income?" subtitle="Anyone you regularly pay for. Kids, pets, parents — your call." accent />

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 26 }}>
          <div>
            <Eyebrow style={{ color: 'rgba(14,15,13,0.78)' }}>Monthly cost for {deps.length} {deps.length === 1 ? 'person' : 'people / pets'}</Eyebrow>
            <BigAmount amount={total} size={80} style={{ marginTop: 6 }} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <Eyebrow style={{ color: 'rgba(14,15,13,0.78)' }}>Per year</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', marginTop: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 600, marginRight: 2 }}>€</span>
              <span style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1 }}>{Math.round(total*12).toLocaleString('en-GB')}</span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(14,15,13,0.72)', marginTop: 4, fontWeight: 500 }}>{deps.length > 0 ? `~${hEur(total/deps.length)}/mo each` : 'Add anyone you support'}</div>
          </div>
        </div>
      </Card>

      {/* ADD panel */}
      <Card style={{ gridColumn: '9 / span 4', gridRow: '1', padding: 24 }}>
        <Eyebrow>Add someone</Eyebrow>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {DEP_TYPES.map(t => (
            <button key={t.v} onClick={() => setDraftType(t.v)} style={{
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: draftType === t.v ? INK : SOFT,
              color: draftType === t.v ? LIME : INK,
              padding: '8px 12px', borderRadius: 999,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 600,
            }}>
              <DepIcon type={t.v} size={14} />
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={addDep} style={{
          marginTop: 18, width: '100%', padding: '14px 18px',
          background: LIME, color: INK, border: 'none', borderRadius: 18,
          fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Icon name="plus" weight="bold" size={14} />
          Add {DEP_TYPES.find(t => t.v === draftType).label.toLowerCase()}
        </button>
      </Card>

      {/* GRID + CTA */}
      <div style={{ gridColumn: '1 / span 12', gridRow: '2', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 14 }}>
        <Card style={{ gridColumn: '1 / span 8', padding: 28, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <CardTitle kicker={`${deps.length} entries`} title="Your dependents" />
            <Pill style={{ background: SOFT, fontWeight: 600 }}>Order by cost</Pill>
          </div>

          {deps.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: INK_3 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>No dependents added yet.</div>
              <div style={{ fontSize: 12 }}>Pick a type on the right →</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {deps.map(d => (
                <div key={d.id} style={{ background: SOFT, borderRadius: 22, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 14, background: CARD, color: INK,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <DepIcon type={d.type} size={22} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <input value={d.name} onChange={e => editDep(d.id, { name: e.target.value })} style={{
                        width: '100%', border: 'none', outline: 'none', background: 'transparent',
                        fontSize: 15, fontWeight: 700, color: INK, fontFamily: 'inherit', padding: 0,
                      }} />
                      <div style={{ fontSize: 11, color: INK_3, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 2 }}>{d.type}</div>
                    </div>
                    <button onClick={() => removeDep(d.id)} style={{ background: 'transparent', border: 'none', color: INK_3, cursor: 'pointer', padding: 4 }}>
                      <Icon name="trash" weight="bold" size={14} />
                    </button>
                  </div>
                  <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 16, fontWeight: 600, marginRight: 2 }}>€</span>
                      <AutoInput
                        value={d.amount.toLocaleString('en-GB')}
                        onChange={e => editDep(d.id, { amount: parseInt(e.target.value.replace(/[^\d]/g,''),10) || 0 })}
                        fontSize={32} fontWeight={700} letterSpacing={-0.5} color={INK}
                      />
                      <span style={{ fontSize: 11, color: INK_3, fontWeight: 500, marginLeft: 4 }}>/ mo</span>
                    </div>
                    <span style={{ fontSize: 10, color: INK_3, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{hEur(d.amount*12)}/yr</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* RIGHT — context + cta */}
        <div style={{ gridColumn: '9 / span 4', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card style={{ padding: 22, flex: 1 }}>
            <Eyebrow>Heads up</Eyebrow>
            <ul style={{ margin: '14px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Childcare, school, activities',
                'Pet food, vet, insurance',
                'Money sent to family',
                'Anyone you cover regularly',
              ].map((t, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: INK_2, fontWeight: 500 }}>
                  <span style={{ width: 5, height: 5, borderRadius: 999, background: INK, marginTop: 6, flexShrink: 0 }} />
                  {t}
                </li>
              ))}
            </ul>
            <Note tone="neutral" label="REMEMBER" style={{ marginTop: 16 }}>
              These add to fixed costs from step 02. The leftover gets smaller — that's expected and the maths still works.
            </Note>
          </Card>

          <DarkCTA onClick={onNext} style={{ width: '100%', justifyContent: 'center', padding: '16px 22px', borderRadius: 24 }}>
            Continue to allocate
            <Icon name="arrow-right" weight="bold" size={14} />
          </DarkCTA>
        </div>
      </div>
    </HifiStage>
  );
}

window.StepDeps = StepDeps;
