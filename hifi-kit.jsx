// hifi-kit.jsx — shared design primitives for the Hi-fi wizard
// Lime accent, squircle white cards on warm gray, Onest + JetBrains Mono.

/* ─── tokens ──────────────────────────────────────────────────────── */
const BG       = '#ecede8';
const CARD     = '#ffffff';
const INK      = '#0e0f0d';
const INK_2    = '#4d4f48';
const INK_3    = '#62635c';
const RULE     = '#e3e3dd';
const SOFT     = '#f3f3ee';        // recessed surface
const SOFT_2   = '#eeeee7';
const LIME     = '#c5d6a1';        // sage green accent
const LIME_D   = '#a8bd8a';        // darker sage
const CHAR     = '#15170f';
const PAPER    = '#f6f6ee';

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
  <div style={{
    background: lime ? LIME : dark ? CHAR : CARD,
    color: dark ? PAPER : INK,
    borderRadius: radius, padding: pad,
    position: 'relative', overflow: 'hidden',
    ...style,
  }}>{children}</div>
);

const Eyebrow = ({ children, style }) => (
  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: INK_2, ...style }}>{children}</div>
);

const Pill = ({ children, active = false, onClick, dark = false, style }) => (
  <button onClick={onClick} style={{
    border: 'none',
    background: active ? LIME : dark ? 'rgba(255,255,255,0.08)' : SOFT,
    color: active ? INK : dark ? '#dcdcd2' : INK,
    padding: '8px 14px', borderRadius: 999,
    fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
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
    background: disabled ? '#5a5b54' : INK, color: LIME,
    border: 'none', borderRadius: 999,
    padding: '13px 22px', fontSize: 14, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
    display: 'inline-flex', alignItems: 'center', gap: 10,
    whiteSpace: 'nowrap',
    opacity: disabled ? 0.5 : 1,
    ...style,
  }}>{children}</button>
);

/* Auto-sizing inline input — grows/shrinks with content via grid hack */
const AutoInput = ({ value, onChange, fontSize = 28, fontWeight = 700, letterSpacing = -0.5, color = INK, style, inputMode = 'numeric', placeholder }) => {
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
const BigAmount = ({ amount, size = 96, color = INK, decColor, prefix = '€', style }) => {
  const a = hSplit(amount);
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', color, ...style }}>
      <span style={{ fontSize: size * 0.3, fontWeight: 600, marginRight: 4 }}>{prefix}</span>
      <span style={{ fontSize: size, fontWeight: 700, letterSpacing: size * -0.04, lineHeight: 0.95 }}>{a.whole}</span>
      <span style={{ fontSize: size * 0.33, fontWeight: 600, letterSpacing: -0.5, color: decColor || color }}>.{a.dec}</span>
    </div>
  );
};

/* Inline editable number — looks like a chunky number, but click to edit */
const EditableAmount = ({ value, onChange, size = 96, prefix = '€', style }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', ...style }}>
      <span style={{ fontSize: size * 0.3, fontWeight: 600, marginRight: 4 }}>{prefix}</span>
      <input
        type="text" inputMode="numeric"
        value={value.toLocaleString('en-GB')}
        onChange={e => {
          const v = parseInt(e.target.value.replace(/[^\d]/g,''), 10) || 0;
          onChange(v);
        }}
        style={{
          border: 'none', outline: 'none', background: 'transparent',
          fontFamily: 'inherit',
          fontSize: size, fontWeight: 700, letterSpacing: size * -0.04, lineHeight: 0.95,
          color: 'inherit',
          width: `${Math.max(3, String(value).length + 1)}ch`,
          padding: 0,
        }}
      />
    </div>
  );
};

/* Lime-fill slider for hi-fi (uses inline range with custom track) */
const LimeSlider = ({ value, onChange, min = 0, max = 100, step = 1, width = '100%' }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ position: 'relative', width, height: 28, display: 'flex', alignItems: 'center' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 10, marginTop: -5, background: SOFT, borderRadius: 999 }} />
      <div style={{ position: 'absolute', left: 0, top: '50%', height: 10, marginTop: -5, width: `${pct}%`, background: LIME, borderRadius: 999 }} />
      <input type="range" min={min} max={max} step={step} value={value} onChange={onChange}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0 }} />
      <div style={{
        position: 'absolute', left: `calc(${pct}% - 14px)`, top: '50%',
        width: 28, height: 28, marginTop: -14,
        background: INK, border: `3px solid ${LIME}`, borderRadius: '50%',
        pointerEvents: 'none',
        boxShadow: '0 2px 6px rgba(14,15,13,0.25)',
      }} />
    </div>
  );
};

/* Tip / advisor callout */
const Note = ({ children, label = 'NOTE', tone = 'neutral', style }) => {
  const bg   = tone === 'warn'  ? '#fff4d6' : tone === 'good' ? '#e8efd6' : SOFT;
  const dot  = tone === 'warn'  ? '#e6a13e' : tone === 'good' ? '#7a9456' : INK;
  return (
    <div style={{
      background: bg, borderRadius: 18, padding: '14px 16px',
      display: 'flex', gap: 12, alignItems: 'flex-start',
      ...style,
    }}>
      <div style={{ width: 8, height: 8, borderRadius: 999, background: dot, marginTop: 7, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: INK, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, color: INK_2, fontWeight: 500, lineHeight: 1.45 }}>{children}</div>
      </div>
    </div>
  );
};

/* Single step pill — the dark indicator morphs pill→capsule→fade out, then
 * fades in→grows back to pill on the newly-activated pill. The exit on the
 * old pill plays first (~250ms), then the entry on the new pill plays after
 * a matching delay, so the dot visually relays between buttons. */
function StepPill({ index, label, isActive, isDone, onClick }) {
  // visualActive = "is the dark bg layer currently mounted on this pill?"
  // It stays true through the exit animation so the morph completes before unmount.
  const [visualActive, setVisualActive] = React.useState(isActive);
  const btnRef = React.useRef(null);
  // circleX = the scaleX factor at which the pill becomes a true circle (height === width).
  // Each pill has a different width, so this is measured per-pill rather than a fixed guess.
  const [circleX, setCircleX] = React.useState(0.28);

  React.useLayoutEffect(() => {
    if (btnRef.current) {
      const { offsetWidth: w, offsetHeight: h } = btnRef.current;
      if (w > 0) setCircleX(h / w);
    }
  });

  React.useEffect(() => {
    if (isActive) {
      setVisualActive(true);
    } else if (visualActive) {
      const t = setTimeout(() => setVisualActive(false), 280); // matches pillExit duration
      return () => clearTimeout(t);
    }
  }, [isActive, visualActive]);

  return (
    <button ref={btnRef} onClick={onClick} style={{
      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
      padding: '7px 13px', borderRadius: 999,
      fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
      background: 'transparent',
      color: isActive ? LIME : isDone ? INK : INK_3,
      display: 'inline-flex', alignItems: 'center', gap: 6,
      position: 'relative',
      transition: 'color 240ms cubic-bezier(0.4, 0, 0.2, 1)',
      transitionDelay: isActive ? '320ms' : '0ms',
    }}>
      {/* the dark "indicator" layer that morphs between buttons.
          The collapsed state is a true circle because scaleX bottoms out at
          height/width (the --circle-x custom prop the keyframes read). */}
      {visualActive && (
        <span style={{
          position: 'absolute', inset: 0,
          background: INK, borderRadius: 999,
          ['--circle-x']: circleX,
          animation: isActive
            ? 'pillEnter 460ms 280ms cubic-bezier(0.34, 1.42, 0.64, 1) both'
            : 'pillExit 280ms cubic-bezier(0.5, 0, 0.75, 0) both',
          pointerEvents: 'none',
          zIndex: 0,
        }} />
      )}
      <span style={{ fontSize: 10, opacity: 0.55, position: 'relative', zIndex: 1 }}>{String(index+1).padStart(2,'0')}</span>
      <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
      {isDone && (
        <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex' }}>
          <Icon name="check" weight="bold" size={11} />
        </span>
      )}
    </button>
  );
}

/* viewport hook — true below 820px (phones + small tablets) */
function useHifiMobile() {
  const Q = '(max-width: 820px)';
  const [m, setM] = React.useState(() => typeof window !== 'undefined' && window.matchMedia(Q).matches);
  React.useEffect(() => {
    const mq = window.matchMedia(Q);
    const h = (e) => setM(e.matches);
    mq.addEventListener ? mq.addEventListener('change', h) : mq.addListener(h);
    return () => { mq.removeEventListener ? mq.removeEventListener('change', h) : mq.removeListener(h); };
  }, []);
  return m;
}

/* Top nav strip — left-aligned, no logo. Pills scroll horizontally on mobile. */
function HifiTopBar({ step, onStep, onReset }) {
  const isMobile = useHifiMobile();
  const steps = ['Income', 'Fixed costs', 'Dependents', 'Allocate', 'Invest', 'Plan'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: isMobile ? 8 : 14, marginBottom: isMobile ? 16 : 22 }}>
      <div className="hifi-pillstrip" style={{
        display: 'flex', gap: 4, alignItems: 'center',
        background: 'rgba(255,255,255,0.6)', padding: 4, borderRadius: 999,
        overflowX: isMobile ? 'auto' : 'visible', maxWidth: '100%',
        flex: isMobile ? '1 1 auto' : '0 0 auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {steps.map((s, i) => (
          <StepPill key={s} index={i} label={s} isActive={i === step} isDone={i < step} onClick={() => onStep && onStep(i)} />
        ))}
      </div>
      {onReset && (
        <button onClick={onReset} title="Clear saved data and start over" style={{
          border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
          background: 'rgba(255,255,255,0.6)', color: INK_2,
          padding: isMobile ? '9px 11px' : '9px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
        }}>
          <Icon name="arrow-counter-clockwise" weight="bold" size={13} />
          {!isMobile && 'Reset'}
        </button>
      )}
    </div>
  );
}

/* Stage wrapper: 12-col grid on desktop; single stacked column on mobile.
 * On mobile we clone children to strip their grid placement + fixed widths so
 * each card flows full-width in document order. */
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
      height: 'calc(900px - 32px - 32px - 22px - 36px)',
    }}>{children}</div>
  );
}

/* Generic "card title" used inside hero cards */
function CardTitle({ kicker, title, subtitle, dark = false, accent = false }) {
  const baseColor = dark ? PAPER : INK;
  const subColor  = dark ? 'rgba(246,246,238,0.6)' : (accent ? 'rgba(14,15,13,0.78)' : INK_2);
  const kickerColor = accent ? 'rgba(14,15,13,0.78)' : (dark ? 'rgba(246,246,238,0.55)' : INK_2);
  return (
    <div>
      {kicker && <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: kickerColor }}>{kicker}</div>}
      <h2 style={{ margin: kicker ? '6px 0 0' : 0, fontSize: 30, fontWeight: 700, letterSpacing: -0.8, lineHeight: 1.05, color: baseColor }}>{title}</h2>
      {subtitle && <div style={{ fontSize: 13, color: subColor, marginTop: 8, fontWeight: 500 }}>{subtitle}</div>}
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
