// hifi-kit.jsx — shared design primitives for the Hi-fi wizard
// Dark aubergine surface, translucent violet cards, violet accent, Outfit + JetBrains Mono.

/* ─── tokens ──────────────────────────────────────────────────────── */
const BG       = '#17111f';        // wizard surface
const CARD     = '#241a33';        // card base (gradient applied in <Card>)
const INK      = '#f5f1fb';        // primary text
const INK_2    = '#c9bedc';        // secondary text (9:1 on card)
const INK_3    = '#a99dbf';        // tertiary text (6.5:1 on card)
const RULE     = '#3a2e4b';
const SOFT     = '#30253f';        // raised/recessed chip surface
const SOFT_2   = '#352949';
const LIME     = '#6234c2';        // violet accent (name kept for compat) — 6.8:1 with INK
const LIME_D   = '#9a72ec';        // light violet for strokes/glows
const CHAR     = '#100b17';        // deepest panel
const PAPER    = '#f5f1fb';

/* ─── investment data (mirrors wf2-investments.jsx) ─────────────── */
const HIFI_INVESTMENTS = {
  low: {
    label: 'Low risk',
    description: 'Capital protected or near-protected. Beats inflation modestly.',
    options: [
      { id: 'cuenta-rem',  name: 'Cuenta remunerada',     rate: 0.025, blurb: 'High-yield savings, instant access.' },
      { id: 'letras',      name: 'Letras del Tesoro',     rate: 0.028, blurb: 'Spanish Treasury bills, 3–12 mo.' },
      { id: 'bonos-5y',    name: 'Bonos del Estado 5 yr', rate: 0.030, blurb: 'Government bonds, 5-year lock.' },
      { id: 'deposito',    name: 'Depósito a plazo 12 m', rate: 0.025, blurb: 'Fixed-term deposit, guaranteed.' },
      { id: 'monetario',   name: 'Fondo monetario',       rate: 0.027, blurb: 'Money-market fund. Liquid.' },
    ],
  },
  med: {
    label: 'Medium risk',
    description: 'Equity exposure. Bigger swings, higher long-run returns.',
    options: [
      { id: 'msci-world',  name: 'Fondo indexado MSCI World',     rate: 0.070, blurb: '~1,500 large-cap globals.' },
      { id: 'sp500',       name: 'ETF S&P 500',                   rate: 0.075, blurb: 'US large-cap. USD exposure.' },
      { id: 'ibex',        name: 'Fondo indexado IBEX 35',        rate: 0.055, blurb: 'Spanish equity index.' },
      { id: 'mixto',       name: 'Fondo mixto 60/40',             rate: 0.050, blurb: 'Balanced bonds + equities.' },
      { id: 'pension',     name: 'Plan de pensiones individual',  rate: 0.060, blurb: 'Tax-deductible to €1,500/yr.' },
      { id: 'socimi',      name: 'SOCIMI (Spanish REIT)',         rate: 0.060, blurb: 'Real-estate trust. Rent income.' },
    ],
  },
};
const HIFI_ALL_INV = [
  ...HIFI_INVESTMENTS.low.options.map(o => ({ ...o, risk: 'low'  })),
  ...HIFI_INVESTMENTS.med.options.map(o => ({ ...o, risk: 'med' })),
];
const hifiFind = (id) => HIFI_ALL_INV.find(o => o.id === id);

/* ─── Phosphor icon helper ────────────────────────────────────────── */
// weight: 'regular' | 'bold' | 'fill'. Renders the Phosphor web-font glyph.
const Icon = ({ name, weight = 'bold', size = 14, style }) => {
  const base = weight === 'regular' ? 'ph' : 'ph-' + weight;
  return (
    <i
      className={`${base} ph-${name}`}
      style={{ fontSize: size, lineHeight: 1, display: 'inline-flex', ...style }}
      aria-hidden="true"
    />
  );
};

/* ─── math ────────────────────────────────────────────────────────── */
function hifiFv(monthly, years, r) {
  const m = r/12, n = years*12;
  return m === 0 ? monthly*n : monthly * ((Math.pow(1+m,n)-1) / m);
}
const hEur  = (n) => '€' + Math.round(n || 0).toLocaleString('en-GB');
const hEurK = (n) => {
  n = n || 0;
  if (n >= 1e6) return '€' + (n/1e6).toFixed(2).replace(/\.?0+$/,'') + 'M';
  if (n >= 1e3) return '€' + (n/1e3).toFixed(0) + 'k';
  return '€' + Math.round(n);
};
function hSplit(n) {
  const safe = isFinite(n) ? n : 0;
  const whole = Math.floor(safe);
  const dec = Math.round((safe - whole) * 100);
  return { whole: whole.toLocaleString('en-GB'), dec: String(dec).padStart(2,'0') };
}

/* Income tax handling — Spain IRPF + employee social security.
 *
 * Two modes (state.taxMode):
 *   'auto'   → progressive IRPF computed from annualised gross + SS, then
 *              an effective monthly net is derived. Uses 2024 combined
 *              (state + default regional) brackets. Labelled an *estimate*.
 *   'manual' → user supplies an effective deduction rate (state.manualRate, 0–1).
 *
 * Region-specific scales, family/personal circumstances, and autónomo regimes
 * are NOT modelled — a production build should add a region selector and the
 * full deduction set, and have figures reviewed for compliance. */
const IRPF_BRACKETS = [
  { upTo: 12450,    rate: 0.19 },
  { upTo: 20200,    rate: 0.24 },
  { upTo: 35200,    rate: 0.30 },
  { upTo: 60000,    rate: 0.37 },
  { upTo: 300000,   rate: 0.45 },
  { upTo: Infinity, rate: 0.47 },
];
const SS_RATE        = 0.0635;   // employee contribution (contingencias + desempleo + formación)
const SS_ANNUAL_CAP  = 56646;    // approx 2024 max contribution base, annualised
const PERSONAL_MIN   = 5550;     // mínimo personal (credited at the lowest bracket)

function hifiIrpf(grossAnnual) {
  const ss = Math.min(grossAnnual, SS_ANNUAL_CAP) * SS_RATE;
  const taxable = Math.max(0, grossAnnual - ss);  // SS is deductible from the base
  let tax = 0, prev = 0;
  for (const b of IRPF_BRACKETS) {
    if (taxable > prev) {
      tax += (Math.min(taxable, b.upTo) - prev) * b.rate;
      prev = b.upTo;
    } else break;
  }
  tax = Math.max(0, tax - PERSONAL_MIN * IRPF_BRACKETS[0].rate); // personal-minimum credit
  return { ss, irpf: tax, total: ss + tax };
}

/* Full breakdown for a monthly gross figure (annualises, computes, re-monthlies). */
function hifiTaxBreakdown(grossMonthly) {
  const grossAnnual = grossMonthly * 12;
  const { ss, irpf, total } = hifiIrpf(grossAnnual);
  const netAnnual = grossAnnual - total;
  return {
    grossMonthly,
    netMonthly:  netAnnual / 12,
    ssMonthly:   ss / 12,
    irpfMonthly: irpf / 12,
    effectiveRate: grossAnnual > 0 ? total / grossAnnual : 0,
  };
}

const getNetIncome = (state) => {
  if (!state.incomeIsGross) return state.income;
  if (state.taxMode === 'manual') return state.income * (1 - (state.manualRate ?? 0.22));
  return hifiTaxBreakdown(state.income).netMonthly;
};
const getGrossIncome = (state) => {
  if (state.incomeIsGross) return state.income;
  // approximate inverse for display when user entered net
  if (state.taxMode === 'manual') return state.income / (1 - (state.manualRate ?? 0.22));
  return state.income / (1 - 0.24); // rough; net-entry users rarely need gross
};
const getEffectiveRate = (state) => {
  if (!state.incomeIsGross) return 0;
  if (state.taxMode === 'manual') return state.manualRate ?? 0.22;
  return hifiTaxBreakdown(state.income).effectiveRate;
};

/* ─── primitives ──────────────────────────────────────────────────── */
const Card = ({ children, style, dark = false, lime = false, pad = 28, radius = 28 }) => (
  <div className="hifi-card" style={{
    background: lime ? 'linear-gradient(160deg, #4a2a94 0%, #2f1a63 100%)' : dark ? CHAR : 'linear-gradient(180deg, #2b2040 0%, #221830 100%)',
    color: dark ? PAPER : INK,
    borderRadius: radius, padding: pad,
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.07)',
    position: 'relative', overflow: 'hidden',
    ...style,
  }}>{children}</div>
);

const Eyebrow = ({ children, style }) => (
  <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: 1.2, textTransform: 'uppercase', color: INK_2, ...style }}>{children}</div>
);

const Pill = ({ children, active = false, onClick, dark = false, style }) => (
  <button onClick={onClick} style={{
    border: 'none',
    background: active ? LIME : dark ? 'rgba(255,255,255,0.08)' : SOFT,
    color: active ? INK : dark ? '#dcdcd2' : INK,
    padding: '8px 14px', borderRadius: 999,
    fontSize: 14, fontWeight: 400, fontFamily: 'inherit',
    display: 'inline-flex', alignItems: 'center', gap: 6,
    whiteSpace: 'nowrap', cursor: 'pointer',
    ...style,
  }}>{children}</button>
);

const IconBtn = ({ children, dark = false, style, ...rest }) => (
  <button {...rest} style={{
    width: 38, height: 38, borderRadius: 999,
    border: 'none', background: dark ? 'rgba(255,255,255,0.1)' : SOFT,
    color: dark ? PAPER : INK, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    ...style,
  }}>{children}</button>
);

const DarkCTA = ({ children, onClick, style, disabled = false }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled ? SOFT_2 : LIME, color: INK,
    boxShadow: disabled ? 'none' : '0 6px 20px rgba(98,52,194,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
    border: 'none', borderRadius: 999,
    padding: '13px 22px', fontSize: 14, fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
    display: 'inline-flex', alignItems: 'center', gap: 10,
    whiteSpace: 'nowrap',
    opacity: disabled ? 0.5 : 1,
    ...style,
  }}>{children}</button>
);

/* Auto-sizing inline input — grows/shrinks with content via grid hack */
const AutoInput = ({ value, onChange, fontSize = 28, fontWeight = 500, letterSpacing = -0.5, color = INK, style, inputMode = 'numeric', placeholder, ariaLabel }) => {
  const display = String(value);
  const sharedStyle = {
    fontFamily: 'inherit', fontSize, fontWeight, letterSpacing,
    lineHeight: 0.95, color,
  };
  return (
    <span style={{ display: 'inline-grid', alignItems: 'baseline', width: 'max-content', ...style }}>
      <span style={{ gridArea: '1 / 1', visibility: 'hidden', whiteSpace: 'pre', minWidth: '1ch', ...sharedStyle }}>{display || placeholder || ' '}</span>
      <input
        value={value}
        onChange={onChange}
        inputMode={inputMode}
        placeholder={placeholder}
        aria-label={ariaLabel}
        size={1}
        style={{
          gridArea: '1 / 1',
          border: 'none', outline: 'none', background: 'transparent', padding: 0,
          width: '100%',
          ...sharedStyle,
        }}
      />
    </span>
  );
};

/* Big chunky number with currency prefix + decimal subscript */
const BigAmount = ({ amount, size = 96, weight = 300, color = INK, decColor, prefix = '€', style }) => {
  const a = hSplit(amount);
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', color, ...style }}>
      <span style={{ fontSize: size * 0.3, fontWeight: 500, marginRight: 4 }}>{prefix}</span>
      <span style={{ fontSize: size, fontWeight: weight, letterSpacing: size * -0.035, lineHeight: 0.95 }}>{a.whole}</span>
      <span style={{ fontSize: size * 0.33, fontWeight: 500, letterSpacing: -0.5, color: decColor || color }}>.{a.dec}</span>
    </div>
  );
};

/* Inline editable number — looks like a chunky number, but click to edit */
const EditableAmount = ({ value, onChange, size = 96, prefix = '€', style, ariaLabel }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', ...style }}>
      <span style={{ fontSize: size * 0.3, fontWeight: 500, marginRight: 4 }}>{prefix}</span>
      <input
        type="text" inputMode="numeric"
        aria-label={ariaLabel}
        value={value.toLocaleString('en-GB')}
        onChange={e => {
          const v = parseInt(e.target.value.replace(/[^\d]/g,''), 10) || 0;
          onChange(v);
        }}
        style={{
          border: 'none', outline: 'none', background: 'transparent',
          fontFamily: 'inherit',
          fontSize: size, fontWeight: 300, letterSpacing: size * -0.04, lineHeight: 0.95,
          color: 'inherit',
          width: `${Math.max(3, String(value).length + 1)}ch`,
          padding: 0,
        }}
      />
    </div>
  );
};

/* Lime-fill slider for hi-fi (uses inline range with custom track) */
const LimeSlider = ({ value, onChange, min = 0, max = 100, step = 1, width = '100%', ariaLabel }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ position: 'relative', width, height: 28, display: 'flex', alignItems: 'center' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 6, marginTop: -3, background: 'rgba(255,255,255,0.14)', borderRadius: 999 }} />
      <div style={{ position: 'absolute', left: 0, top: '50%', height: 6, marginTop: -3, width: `${pct}%`, background: LIME_D, borderRadius: 999 }} />
      <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} aria-label={ariaLabel}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0 }} />
      <div style={{
        position: 'absolute', left: `calc(${pct}% - 9px)`, top: '50%',
        width: 18, height: 18, marginTop: -9,
        background: INK, border: `2px solid ${LIME_D}`, borderRadius: '50%',
        pointerEvents: 'none',
        boxShadow: '0 2px 10px rgba(0,0,0,0.45)',
      }} />
    </div>
  );
};

/* Tip / advisor callout */
const Note = ({ children, label = 'NOTE', tone = 'neutral', style }) => {
  const bg   = tone === 'warn'  ? '#3a2a1c' : tone === 'good' ? '#2f2354' : SOFT;
  const dot  = tone === 'warn'  ? '#f0b45a' : tone === 'good' ? '#cbbcf6' : LIME_D;
  return (
    <div style={{
      background: bg, borderRadius: 18, padding: '14px 16px',
      display: 'flex', gap: 12, alignItems: 'flex-start',
      ...style,
    }}>
      <div style={{ width: 8, height: 8, borderRadius: 999, background: dot, marginTop: 7, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: 1.2, textTransform: 'uppercase', color: INK, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 14, color: INK_2, fontWeight: 400, lineHeight: 1.45 }}>{children}</div>
      </div>
    </div>
  );
};

/* Single step pill — simple: solid ink background when active, transparent otherwise.
 * No morphing animation. */
function StepPill({ index, label, isActive, isDone, onClick }) {
  return (
    <button onClick={onClick} style={{
      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
      padding: '7px 13px', borderRadius: 999,
      fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap',
      background: isActive ? LIME : 'transparent',
      color: isActive ? INK : isDone ? INK : INK_2,
      display: 'inline-flex', alignItems: 'center', gap: 6,
      transition: 'background 160ms ease, color 160ms ease',
    }}>
      <span style={{ fontSize: 14, opacity: isActive ? 0.9 : 0.8 }}>{String(index+1).padStart(2,'0')}</span>
      <span>{label}</span>
      {isDone && (
        <span style={{ display: 'inline-flex' }}>
          <Icon name="check" weight="bold" size={11} />
        </span>
      )}
    </button>
  );
}

/* viewport hook — true below 1100px (phones, tablets, narrow windows) → stacked layout */
function useHifiMobile() {
  const Q = '(max-width: 1099px)';
  const [m, setM] = React.useState(() => typeof window !== 'undefined' && window.matchMedia(Q).matches);
  React.useEffect(() => {
    const mq = window.matchMedia(Q);
    const h = (e) => setM(e.matches);
    mq.addEventListener ? mq.addEventListener('change', h) : mq.addListener(h);
    return () => { mq.removeEventListener ? mq.removeEventListener('change', h) : mq.removeListener(h); };
  }, []);
  return m;
}

/* Top nav strip — left-aligned, no logo. Pills scroll horizontally on mobile.
 * The primary action (Continue / Download) always lives here, next to the nav. */
function HifiTopBar({ step, onStep, onReset, canReset, primaryLabel, primaryIcon, onPrimary }) {
  const isMobile = useHifiMobile();
  const steps = ['Income', 'Fixed costs', 'Dependents', 'Allocate', 'Invest', 'Plan'];

  // ── MOBILE: a real stepper. One step at a time, progress tracked with a
  // segmented bar; back lives here, forward is each step's own bottom CTA. ──
  if (isMobile) {
    const ResetBtn = onReset && canReset ? (
      <button onClick={onReset} title="Clear saved data and start over" style={{
        border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
        width: 40, height: 40, borderRadius: 999,
        background: 'rgba(255,255,255,0.06)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)', color: INK_2,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="arrow-counter-clockwise" weight="bold" size={15} />
      </button>
    ) : null;

    return (
      <div style={{
        marginBottom: 18,
        /* Sticky on mobile: outer padding is 14px so we full-bleed the bar
           with negative side margins, then pad it back. */
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--wizard-bg, #17111f)',
        margin: '-14px -14px 18px -14px',
        padding: '14px 14px 12px 14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <button
            onClick={() => step > 0 && onStep && onStep(step - 1)}
            disabled={step === 0}
            aria-label="Back"
            style={{
              border: 'none', fontFamily: 'inherit', flexShrink: 0,
              width: 40, height: 40, borderRadius: 999,
              background: 'rgba(255,255,255,0.06)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)', color: INK,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              cursor: step === 0 ? 'default' : 'pointer',
              opacity: step === 0 ? 0.35 : 1,
            }}>
            <Icon name="arrow-left" weight="bold" size={16} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: 1.4, textTransform: 'uppercase', color: INK }}>
              Step {String(step + 1).padStart(2, '0')} of {String(steps.length).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 22, fontWeight: 400, letterSpacing: -0.4, lineHeight: 1.1, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{steps[step]}</div>
          </div>
          {ResetBtn}
          {/* Primary action sits to the RIGHT of reset, icon-only on mobile to
             stay compact in this dense header row. */}
          {primaryLabel && (
            <DarkCTA onClick={onPrimary} aria-label={primaryLabel} style={{
              flexShrink: 0,
              width: 40, height: 40, padding: 0,
              borderRadius: 999, justifyContent: 'center',
            }}>
              <Icon name={primaryIcon || 'arrow-right'} weight="bold" size={16} />
            </DarkCTA>
          )}
        </div>
        {/* segmented progress — done = ink, current = lime, upcoming = light track */}
        <div style={{ display: 'flex', gap: 5 }}>
          {steps.map((s, i) => {
            const done = i < step, current = i === step;
            const reachable = i <= step;
            return (
              <button key={s} onClick={() => reachable && onStep && onStep(i)} aria-label={s} title={s} style={{
                flex: 1, height: 6, padding: 0, border: 'none', borderRadius: 999,
                background: done ? LIME_D : current ? INK : 'rgba(255,255,255,0.18)',
                cursor: reachable ? 'pointer' : 'default',
                transition: 'background 240ms cubic-bezier(0.4,0,0.2,1)',
              }} />
            );
          })}
        </div>
      </div>
    );
  }

  // ── DESKTOP: pill strip + reset on the left, primary action on the right. ──
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 22, flexWrap: 'nowrap' }}>
      {/* LEFT: nav pills + reset (reset only once the user has entered data) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: '0 1 auto' }}>
        <div className="hifi-pillstrip" style={{
          display: 'flex', gap: 4, alignItems: 'center',
          background: 'rgba(255,255,255,0.06)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)', padding: 4, borderRadius: 999,
          overflowX: 'auto', maxWidth: '100%',
          flex: '0 1 auto', minWidth: 0,
        }}>
          {steps.map((s, i) => (
            <StepPill key={s} index={i} label={s} isActive={i === step} isDone={i < step} onClick={() => onStep && onStep(i)} />
          ))}
        </div>
        {onReset && canReset && (
          <button onClick={onReset} title="Clear saved data and start over" style={{
            border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
            background: 'rgba(255,255,255,0.06)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)', color: INK_2,
            padding: '11px 14px', borderRadius: 999, fontSize: 14, fontWeight: 500,
            display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
          }}>
            <Icon name="arrow-counter-clockwise" weight="bold" size={13} />
            Reset
          </button>
        )}
      </div>

      {/* RIGHT: primary action */}
      {primaryLabel && (
        <div style={{ display: 'flex', alignItems: 'center', flex: '0 0 auto', justifyContent: 'flex-end' }}>
          <DarkCTA onClick={onPrimary} style={{ padding: '12px 20px', fontSize: 14, flex: '0 0 auto', justifyContent: 'center' }}>
            {primaryIcon === 'download-simple' && <Icon name="download-simple" weight="bold" size={14} />}
            {primaryLabel}
            {primaryIcon === 'arrow-right' && <Icon name="arrow-right" weight="bold" size={14} />}
          </DarkCTA>
        </div>
      )}
    </div>
  );
}

/* Stage wrapper: 12-col grid on desktop; single stacked column on mobile.
 * On mobile we clone children to strip their grid placement + fixed widths so
 * each card flows full-width in document order. */
const HIFI_STAGE_H = 680;
function HifiStage({ children, gridTemplateRows, gridTemplateColumns = 'repeat(12, 1fr)' }) {
  const isMobile = useHifiMobile();
  if (isMobile) {
    const stacked = React.Children.map(children, ch =>
      !React.isValidElement(ch) ? ch
        : React.cloneElement(ch, { style: { ...ch.props.style, gridColumn: 'auto', gridRow: 'auto', width: 'auto', minWidth: 0, height: 'auto' } })
    );
    return <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{stacked}</div>;
  }
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns,
      gridTemplateRows: gridTemplateRows || '1fr',
      gap: 14,
      flex: '0 0 auto',
      height: HIFI_STAGE_H,
    }}>{children}</div>
  );
}

/* Generic "card title" used inside hero cards */
function CardTitle({ kicker, title, subtitle, dark = false, accent = false }) {
  const baseColor = dark ? PAPER : INK;
  const subColor  = dark ? 'rgba(245,241,251,0.72)' : (accent ? 'rgba(245,241,251,0.92)' : INK_2);
  const kickerColor = accent ? 'rgba(245,241,251,0.92)' : (dark ? 'rgba(245,241,251,0.68)' : INK_2);
  return (
    <div>
      {kicker && <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: 1.2, textTransform: 'uppercase', color: kickerColor }}>{kicker}</div>}
      <h2 style={{ margin: kicker ? '6px 0 0' : 0, fontSize: 24, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, color: baseColor }}>{title}</h2>
      {subtitle && <div style={{ fontSize: 14, color: subColor, marginTop: 8, fontWeight: 400 }}>{subtitle}</div>}
    </div>
  );
}

Object.assign(window, {
  BG, CARD, INK, INK_2, INK_3, RULE, SOFT, SOFT_2, LIME, LIME_D, CHAR, PAPER,
  HIFI_INVESTMENTS, HIFI_ALL_INV, hifiFind,
  hifiFv, hEur, hEurK, hSplit,
  getNetIncome, getGrossIncome, getEffectiveRate, hifiTaxBreakdown,
  Card, Eyebrow, Pill, IconBtn, DarkCTA, BigAmount, EditableAmount, AutoInput, LimeSlider, Note, Icon,
  HifiTopBar, HifiStage, CardTitle, useHifiMobile,
});
