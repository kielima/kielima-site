// Interactive widgets for the dissertation deck
// Mounted into containers by id

const { useState, useEffect, useRef, useMemo } = React;

/* ------------------------------------------------------------
   useFragmentNav — step through internal "fragments" (nodes)
   driven by the deck's ←/→ keys. Hooks into:
   • deck:advance (cancelable) on the owning <section>
   • slidechange on the deck-stage / document
   Forward entry resets to 0; backward entry resets to last.
   ------------------------------------------------------------ */
function useFragmentNav(count) {
  const [active, setActiveState] = useState(0);
  const activeRef = useRef(0);
  const containerRef = useRef(null);

  // Synchronous setter — keeps the ref in lockstep with state so rapid
  // key-presses can't read stale values before React commits.
  const setActive = (v) => {
    activeRef.current = v;
    setActiveState(v);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const slide = el.closest('section');
    if (!slide) return;
    const stage = slide.closest('deck-stage') || document;

    const onAdvance = (e) => {
      const dir = (e.detail && e.detail.dir) || 0;
      if (!dir) return;
      const cur = activeRef.current;
      const next = cur + dir;
      if (next >= 0 && next < count) {
        e.preventDefault();
        setActive(next);
      }
    };

    const onSlideChange = (e) => {
      const d = e.detail || {};
      if (d.slide !== slide) return;
      const prev = typeof d.previousIndex === 'number' ? d.previousIndex : -1;
      const curr = typeof d.index === 'number' ? d.index : -1;
      if (prev >= 0 && prev > curr) {
        setActive(count - 1);
      } else {
        setActive(0);
      }
    };

    slide.addEventListener('deck:advance', onAdvance);
    stage.addEventListener('slidechange', onSlideChange);
    return () => {
      slide.removeEventListener('deck:advance', onAdvance);
      stage.removeEventListener('slidechange', onSlideChange);
    };
  }, [count]);

  return [active, setActive, containerRef];
}

/* ============================================================
   1. TIMELINE OF CLIMATE CONFERENCES — anim on scroll position
   ============================================================ */
const COP_EVENTS = [
{ year: 1968, label: 'Conferência da Biosfera', doc: 'Programa MaB', loc: 'Paris · França', tone: 'mute' },
{ year: 1971, label: 'Convenção de Ramsar', doc: 'Convenção de Ramsar', loc: 'Ramsar · Irã', tone: 'mute' },
{ year: 1972, label: 'Conferência de Estocolmo', doc: 'Declaração de Estocolmo', loc: 'Estocolmo · Suécia', tone: 'mute' },
{ year: 1992, label: 'Rio 92', doc: 'Agenda 21 · CQNUMC', loc: 'Rio de Janeiro · Brasil', tone: 'accent' },
{ year: 1995, label: 'COP 1', doc: 'Mandato de Berlim', loc: 'Berlim · Alemanha', tone: 'mute' },
{ year: 1997, label: 'COP 3', doc: 'Protocolo de Kyoto', loc: 'Quioto · Japão', tone: 'accent' },
{ year: 2012, label: 'Rio+20', doc: 'ODS · Agenda 2030', loc: 'Rio de Janeiro · Brasil', tone: 'accent' },
{ year: 2015, label: 'COP 21', doc: 'Acordo de Paris', loc: 'Paris · França', tone: 'accent' },
{ year: 2025, label: 'COP 30', doc: 'TFFF · TAFF', loc: 'Pará · Brasil', tone: 'accent-hot' }];


function TimelineCOPs() {
  const [hover, setHover] = useState(null);
  const min = 1968,max = 2025;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Decades scale (top) */}
      <div style={{ position: 'relative', height: 48, flex: '0 0 auto' }}>
        <div style={{ position: 'absolute', left: 60, right: 60, top: 30, height: 1, background: 'rgba(15,20,16,0.18)' }}></div>
        {[1970, 1980, 1990, 2000, 2010, 2020].map((d) => {
          const pct = (d - min) / (max - min) * 100;
          return (
            <div key={d} style={{
              position: 'absolute', left: `calc(60px + ${pct}% - 60px * ${pct / 100} * 2)`,
              transform: 'translateX(-50%)', top: 0,
              fontFamily: 'JetBrains Mono, monospace', fontSize: 20,
              color: 'rgba(15,20,16,0.45)', letterSpacing: '0.08em'
            }}>{d}</div>);

        })}
      </div>
      {/* Events as vertical rows */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 12, minHeight: 0 }}>
        {COP_EVENTS.map((e, i) => {
          const color = e.tone === 'accent-hot' ? '#f0a04b' : e.tone === 'accent' ? '#1f5a3a' : 'rgba(15,20,16,0.55)';
          const isHover = hover === i;
          const isImportant = e.tone === 'accent' || e.tone === 'accent-hot';
          return (
            <div key={e.year}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            style={{
              display: 'flex', flexDirection: 'column',
              opacity: hover !== null && !isHover ? 0.35 : 1,
              transition: 'opacity 200ms ease',
              cursor: 'default',
              background: isImportant ? '#f1eee5' : 'transparent',
              border: '1px solid ' + (isImportant ? 'rgba(15,20,16,0.14)' : 'rgba(15,20,16,0.07)'),
              padding: 18,
              gap: 8,
              animation: `fadeUp 600ms ease ${i * 90}ms both`,
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute', top: -8, left: 18,
                width: e.tone === 'accent-hot' ? 18 : 12,
                height: e.tone === 'accent-hot' ? 18 : 12,
                background: color, borderRadius: 999,
                boxShadow: isHover ? `0 0 0 6px ${color}33` : 'none',
                transition: 'box-shadow 200ms ease'
              }}></div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 28, color,
                letterSpacing: '0.04em', fontWeight: 600, marginTop: 8
              }}>{e.year}</div>
              <div style={{
                fontFamily: 'Newsreader, serif', fontSize: 24, lineHeight: 1.18,
                color: '#0f1410', fontWeight: 400,
                minHeight: 'calc(24px * 1.18 * 2)',
                display: 'flex', alignItems: 'flex-start'
              }}>{e.label}</div>
              <div style={{
                marginTop: 10, paddingTop: 10,
                borderTop: '1px dashed ' + (isImportant ? 'rgba(15,20,16,0.22)' : 'rgba(15,20,16,0.14)'),
                display: 'flex', flexDirection: 'column', gap: 4,
                minHeight: 'calc(26px * 1.15 * 2 + 13px + 10px + 4px)'
              }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 20,
                  color: 'rgba(15,20,16,0.45)', letterSpacing: '0.16em', textTransform: 'uppercase'
                }}>documento</div>
                <div style={{
                  fontFamily: 'Newsreader, serif', fontStyle: 'italic',
                  fontSize: 26, lineHeight: 1.15,
                  color: isImportant ? color : '#0f1410',
                  fontWeight: 500
                }}>{e.doc}</div>
              </div>
              <div style={{ flex: 1 }}></div>
              <div style={{
                borderTop: '1px solid rgba(15,20,16,0.08)', paddingTop: 10,
                display: 'flex', flexDirection: 'column',
                minHeight: 'calc(20px * 1.2 * 3 + 10px)'
              }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 20, lineHeight: 1.2,
                  color: 'rgba(15,20,16,0.7)', letterSpacing: '0.02em'
                }}>{e.loc}</div>
              </div>
            </div>);

        })}
      </div>
    </div>);

}

/* ============================================================
   2. CO2 COUNTER — live counter from session start
   ============================================================ */
function CO2Counter() {
  // Global CO2 emissions: ~40.2 Gt CO2eq/year (Crippa et al. 2025, EDGAR/JRC). Per second: ~1274 tonnes
  const PER_SECOND = 40.2e9 / (365.25 * 24 * 3600); // tonnes
  const startRef = useRef(Date.now());
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 50);
    return () => clearInterval(id);
  }, []);
  const elapsed = (Date.now() - startRef.current) / 1000;
  const totalT = elapsed * PER_SECOND;
  // Concrete-equivalent: cement ≈ 8% of global CO2 — show that portion
  const cementT = totalT * 0.08 / 0.99;
  const construcaoT = totalT * 0.21 / 0.99;

  const fmt = (n) => Math.floor(n).toLocaleString('pt-BR');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 56, height: '100%', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, color: 'rgba(232,229,221,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Emissões globais de CO₂ <span style={{ color: '#3ea568' }}>·</span> toneladas
          </div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 192,
            color: '#3ea568',
            lineHeight: 1,
            letterSpacing: '-0.04em',
            marginTop: 16,
            fontVariantNumeric: 'tabular-nums'
          }}>
            {fmt(totalT)}
          </div>
          <div style={{ fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: 28, color: 'rgba(232,229,221,0.7)', marginTop: 12 }}>t CO₂ emitidos desde que esta apresentação começou.

          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, borderTop: '1px solid rgba(232,229,221,0.18)', paddingTop: 28, marginTop: 32 }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, color: 'rgba(232,229,221,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Construção civil (21%)</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 42, color: '#f0a04b', marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>{fmt(construcaoT)} t</div>
          </div>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, color: 'rgba(232,229,221,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Só do cimento (8%)</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 42, color: '#f0a04b', marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>{fmt(cementT)} t</div>
          </div>
        </div>
      </div>
      <div style={{ background: 'rgba(232,229,221,0.04)', border: '1px solid rgba(232,229,221,0.12)', borderRadius: 4, overflow: 'hidden', display: 'flex', flexDirection: 'column', marginTop: -100, height: 'calc(100% + 100px)' }}>
        <div style={{ background: 'rgba(232,229,221,0.05)', borderBottom: '1px solid rgba(232,229,221,0.12)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 20, color: 'rgba(232,229,221,0.7)' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <i style={{ width: 10, height: 10, borderRadius: 999, background: 'rgba(232,229,221,0.25)', display: 'block' }}></i>
            <i style={{ width: 10, height: 10, borderRadius: 999, background: 'rgba(232,229,221,0.25)', display: 'block' }}></i>
            <i style={{ width: 10, height: 10, borderRadius: 999, background: 'rgba(232,229,221,0.25)', display: 'block' }}></i>
          </div>
          <div style={{ flex: 1, padding: '4px 10px', background: 'rgba(232,229,221,0.06)', border: '1px solid rgba(232,229,221,0.12)', borderRadius: 4 }}>ourworldindata.org · CO₂ emissions</div>
          <a href="https://ourworldindata.org/co2-emissions" target="_blank" rel="noopener" style={{ color: '#3ea568', textDecoration: 'none', fontWeight: 500 }}>abrir ↗</a>
        </div>
        <iframe
          src="https://ourworldindata.org/grapher/annual-co-emissions-by-region?tab=chart"
          style={{ border: 0, flex: 1, background: '#fff' }}
          title="Our World in Data — CO2 emissions">
        </iframe>
      </div>
    </div>);

}

/* ============================================================
   3. CEMENT PROCESS — interactive diagram
   ============================================================ */
const CEMENT_STAGES = [
{ id: 'raw', label: 'Matérias\nPrimas', sub: 'Calcário + argila + areia + ferro', co2: 7, pct: '<1%', kind: 'minor', note: 'Extração e preparação das matérias-primas — calcário, argila, areia e óxido de ferro. Representa menos de 1% das emissões diretas.', x: 80 },
{ id: 'mill1', label: 'Moinho\n(cru)', sub: 'Moagem → farinha (cru)', co2: 0, pct: '—', kind: 'negligible', note: 'Moagem das matérias-primas até obter a farinha (cru). Emissões diretas de CO₂ desprezíveis — o impacto desta etapa é essencialmente energético.', x: 320 },
{ id: 'kiln', label: 'Forno\nrotativo', sub: '1450 °C · descarbonatação + combustão', co2: 918, pct: '~99%', kind: 'major', sub2: '553 kg descarb. + 365 kg comb.', note: 'Calcinação a 1450 °C. Responde por ~99% das emissões diretas. 60% vêm da descarbonatação do calcário e 39% da queima de combustível fóssil.', breakdown: [{ label: 'Descarbonatação', kg: 553, pct: '60%' }, { label: 'Combustão', kg: 365, pct: '39%' }], x: 600 },
{ id: 'mill2', label: 'Moinho\n(final)', sub: 'Clínquer + gesso + adições', co2: 4, pct: '<1%', kind: 'minor', note: 'Moagem do clínquer com gesso e adições até atingir a finura do cimento Portland. Contribuição direta inferior a 1%.\n', x: 940 },
{ id: 'cement', label: 'Cimento\nPortland', sub: '1 tonelada produzida · total acumulado', co2: 927, pct: '100%', kind: 'total', note: 'Total acumulado de 927 kg de CO₂ (~99%).\n\nNo Brasil, a média atual é de 580 kgCO₂/t e o Roadmap Net Zero da ABCP (2025) projeta meta de ~375 kgCO₂/t até 2050.\n', x: 1240 }];


function CementProcess() {
  const [active, setActive, containerRef] = useFragmentNav(CEMENT_STAGES.length);
  const cur = CEMENT_STAGES[active];
  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 28 }}>
      <div style={{ position: 'relative', height: 250, flex: '0 0 auto' }}>
        {/* Connector pipe — endpoints sit near the centres of the edge-anchored circles */}
        <div style={{
          position: 'absolute', left: 115, right: 115, top: 99,
          height: 2, background: 'rgba(15,20,16,0.15)'
        }}></div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          position: 'relative',
          height: '100%'
        }}>
        {CEMENT_STAGES.map((s, i) => {
            const isActive = active === i;
            const isFirst = i === 0;
            const isLast = i === CEMENT_STAGES.length - 1;
            const colAlign = isFirst ? 'flex-start' : isLast ? 'flex-end' : 'center';
            return (
              <div key={s.id}
              onMouseEnter={() => setActive(i)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: colAlign,
                cursor: 'pointer'
              }}>
              <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 16
                }}>
              <div style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 20,
                    letterSpacing: '0.15em',
                    color: 'rgba(15,20,16,0.5)'
                  }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{
                    width: 120, height: 120,
                    borderRadius: '50%',
                    background: isActive ? '#0f1410' : '#f1eee5',
                    border: '1px solid ' + (isActive ? '#0f1410' : 'rgba(15,20,16,0.2)'),
                    display: 'grid',
                    placeItems: 'center',
                    color: isActive ? '#e8e5dd' : '#0f1410',
                    fontFamily: 'Newsreader, serif',
                    fontSize: 26,
                    lineHeight: 1.05,
                    textAlign: 'center',
                    whiteSpace: 'pre',
                    transition: 'all 200ms ease',
                    boxShadow: isActive ? '0 12px 32px rgba(15,20,16,0.18)' : 'none'
                  }}>
                {s.label}
              </div>
              {(() => {
                    const isTotal = s.kind === 'total';
                    const isNegligible = s.kind === 'negligible';
                    const bgColor = isNegligible ? 'transparent' : '#f0a04b';
                    const fgColor = '#0f1410';
                    const borderStyle = isNegligible ? '1px dashed rgba(15,20,16,0.35)' : '1px solid #f0a04b';
                    const mainText = isNegligible ?
                    'desprezível · —' :
                    isTotal ? `${s.co2} kg CO₂ · ${s.pct}` : `+ ${s.co2} kg CO₂ · ${s.pct}`;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                          padding: '7px 16px',
                          background: bgColor,
                          border: borderStyle,
                          color: isNegligible ? 'rgba(15,20,16,0.55)' : fgColor,
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 22,
                          letterSpacing: '0.04em',
                          fontWeight: 500,
                          whiteSpace: 'nowrap'
                        }}>
                      {mainText}
                    </div>
                    {s.sub2 &&
                        <div style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 20,
                          letterSpacing: '0.04em',
                          color: 'rgba(15,20,16,0.6)',
                          whiteSpace: 'nowrap',
                          marginTop: 4
                        }}>
                        {s.sub2}
                      </div>
                        }
                  </div>);
                  })()}
              </div>
            </div>);

          })}
        </div>
      </div>

      {/* Detail panel */}
      <div style={{
        background: '#f1eee5',
        border: '1px solid rgba(15,20,16,0.14)',
        padding: 36,
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 48,
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.15em', color: 'rgba(15,20,16,0.5)', textTransform: 'uppercase', fontSize: "20px" }}>Etapa selecionada</div>
          <div style={{ fontFamily: 'Newsreader, serif', lineHeight: 1.05, marginTop: 12, whiteSpace: 'pre-line', fontSize: "60px" }}>{cur.label.replace('\n', ' ')}</div>
          <div style={{ fontFamily: 'Geist, sans-serif', color: 'rgba(15,20,16,0.65)', marginTop: 12, fontSize: "28px" }}>{cur.sub}</div>
        </div>
        <div>
          {(() => {
            const isTotal = cur.kind === 'total';
            const isNegligible = cur.kind === 'negligible';
            const numColor = isTotal ? '#1f5a3a' : isNegligible ? 'rgba(15,20,16,0.45)' : '#f0a04b';
            const eyebrow = isTotal ?
            'Contribuição · total' :
            isNegligible ? 'Contribuição · etapa' : 'Contribuição · etapa';
            const big = isNegligible ?
            '—' :
            isTotal ? `${cur.co2} kg` : `+ ${cur.co2} kg`;
            return (
              <React.Fragment>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, letterSpacing: '0.15em', color: 'rgba(15,20,16,0.5)', textTransform: 'uppercase' }}>{eyebrow}</div>
                <div style={{ fontFamily: 'Newsreader, serif', fontSize: 84, color: numColor, marginTop: 8, lineHeight: 1 }}>{big}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, letterSpacing: '0.08em', color: 'rgba(15,20,16,0.55)', marginTop: 6 }}>
                  {isNegligible ? 'desprezível · —' : `de CO₂ · ${cur.pct} do total`}
                </div>
                {cur.breakdown &&
                <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
                    {cur.breakdown.map((b) =>
                  <div key={b.label} style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: 'rgba(240,160,75,0.14)',
                    borderLeft: '2px solid #f0a04b'
                  }}>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, letterSpacing: '0.12em', color: 'rgba(15,20,16,0.6)', textTransform: 'uppercase' }}>{b.label}</div>
                        <div style={{ fontFamily: 'Newsreader, serif', fontSize: 28, color: '#0f1410', marginTop: 4, lineHeight: 1 }}>{b.kg} kg <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'rgba(15,20,16,0.55)', letterSpacing: '0.06em', fontSize: "20px" }}>· {b.pct}</span></div>
                      </div>
                  )}
                  </div>
                }
              </React.Fragment>);
          })()}
        </div>
        <div>
          <div style={{ fontFamily: 'Geist, sans-serif', color: 'rgba(15,20,16,0.7)', lineHeight: 1.45, fontSize: "30px", whiteSpace: 'pre-line' }}>{cur.note}</div>
        </div>
      </div>
    </div>);

}

/* ============================================================
   5. PRISMA FLOW
   ============================================================ */
const PRISMA_STAGES = [
{ tag: 'IDENTIFICAÇÃO', items: [
  { label: 'Bases de dados', n: '1.247', sub: 'Scopus · Web of Science · Compendex' },
  { label: 'Outras fontes', n: '32', sub: 'Listas de referências' }],
  total: 1279, color: '#0f1410' },
{ tag: 'TRIAGEM', items: [
  { label: 'Duplicados removidos', n: '−312', sub: 'Mendeley · automatizado', neg: true },
  { label: 'Triagem por título/resumo', n: '967', sub: 'Critérios de inclusão' }],
  total: 967, color: '#1f5a3a' },
{ tag: 'ELEGIBILIDADE', items: [
  { label: 'Excluídos pelo resumo', n: '−683', sub: 'Fora do escopo', neg: true },
  { label: 'Texto completo avaliado', n: '284', sub: 'Leitura crítica' }],
  total: 284, color: '#3ea568' },
{ tag: 'INCLUSÃO', items: [
  { label: 'Excluídos por critérios', n: '−212', sub: 'Sem dados de ACV', neg: true },
  { label: 'Estudos incluídos', n: '72', sub: 'Meta-análise final' }],
  total: 72, color: '#f0a04b' }];


function PrismaFlow() {
  const [active, setActive] = useState(0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 32 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, flex: 1 }}>
        {PRISMA_STAGES.map((s, i) => {
          const isActive = i === active;
          return (
            <div key={s.tag}
            onMouseEnter={() => setActive(i)}
            style={{
              display: 'flex', flexDirection: 'column', gap: 16,
              padding: 28,
              background: isActive ? s.color : '#f1eee5',
              color: isActive ? '#e8e5dd' : '#0f1410',
              border: '1px solid ' + (isActive ? s.color : 'rgba(15,20,16,0.14)'),
              transition: 'all 250ms ease',
              cursor: 'pointer',
              position: 'relative',
              animation: `slideUp 600ms ease ${i * 120}ms both`
            }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 20,
                letterSpacing: '0.18em', opacity: 0.7
              }}>{String(i + 1).padStart(2, '0')} · {s.tag}</div>

              <div style={{ borderTop: '1px solid currentColor', opacity: 0.2 }}></div>

              {s.items.map((it, k) =>
              <div key={k}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, letterSpacing: '0.12em', opacity: 0.6, textTransform: 'uppercase' }}>{it.label}</div>
                  <div style={{ fontFamily: 'Newsreader, serif', fontSize: 38, lineHeight: 1, marginTop: 4, color: it.neg ? isActive ? '#f0a04b' : '#c4654a' : 'currentColor' }}>{it.n}</div>
                  <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 20, opacity: 0.7, marginTop: 4 }}>{it.sub}</div>
                </div>
              )}

              <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid currentColor', opacity: 0.4 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.8 }}>Restantes</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 600 }}>n = {s.total.toLocaleString('pt-BR')}</div>
              </div>

              {i < PRISMA_STAGES.length - 1 &&
              <div style={{
                position: 'absolute',
                right: -24, top: '50%',
                transform: 'translateY(-50%)',
                width: 24, height: 1,
                background: 'rgba(15,20,16,0.3)',
                zIndex: 2
              }}>
                  <div style={{ position: 'absolute', right: 0, top: -4, width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '6px solid rgba(15,20,16,0.5)' }}></div>
                </div>
              }
            </div>);

        })}
      </div>

      <div style={{ display: 'flex', gap: 32, alignItems: 'center', padding: '20px 0', borderTop: '1px solid rgba(15,20,16,0.14)' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, color: 'rgba(15,20,16,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Bases utilizadas</div>
        {['Scopus', 'Web of Science', 'Compendex', 'ScienceDirect'].map((b) =>
        <div key={b} style={{
          padding: '8px 16px',
          border: '1px solid rgba(15,20,16,0.15)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 20,
          letterSpacing: '0.05em'
        }}>{b}</div>
        )}
      </div>
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>);

}

/* ============================================================
   6. ACV DIAGRAM — berço-túmulo
   ============================================================ */
const ACV_PHASES = [
{ id: 'a', code: 'A1—A3', label: 'Produto', sub: 'Matérias-primas, transporte interno, fabricação', color: '#1f5a3a', icon: '◐' },
{ id: 'a4', code: 'A4—A5', label: 'Construção', sub: 'Transporte ao canteiro + instalação', color: '#3ea568', icon: '◑' },
{ id: 'b', code: 'B1—B7', label: 'Uso', sub: 'Manutenção, reparos, energia operacional', color: '#0f1410', icon: '●' },
{ id: 'c', code: 'C1—C4', label: 'Fim de vida', sub: 'Desconstrução, transporte, deposição', color: '#f0a04b', icon: '◒' },
{ id: 'd', code: 'D', label: 'Além do ciclo', sub: 'Reuso, reciclagem, recuperação de energia', color: '#1f5a3a', icon: '◌' }];


function ACVDiagram() {
  const [active, setActive, containerRef] = useFragmentNav(ACV_PHASES.length);
  const cur = ACV_PHASES[active];
  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 36 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        {ACV_PHASES.map((p, i) => {
          const isActive = i === active;
          return (
            <div key={p.id}
            onMouseEnter={() => setActive(i)}
            style={{
              background: isActive ? p.color : '#f1eee5',
              color: isActive ? '#e8e5dd' : '#0f1410',
              padding: '28px 24px',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              position: 'relative',
              border: '1px solid ' + (isActive ? p.color : 'rgba(15,20,16,0.14)')
            }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, letterSpacing: '0.15em', opacity: 0.75 }}>{p.code}</div>
              <div style={{ fontFamily: 'Newsreader, serif', fontSize: 36, marginTop: 8 }}>{p.label}</div>
            </div>);

        })}
      </div>

      {/* Visual axis: cradle → gate → grave */}
      <div style={{ position: 'relative', height: 80, margin: '4px 0' }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'rgba(15,20,16,0.2)'
        }}></div>
        <div style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translate(-4px,-50%)',
          width: 18, height: 18, borderRadius: '50%', background: '#1f5a3a'
        }}></div>
        <div style={{
          position: 'absolute', right: 0, top: '50%', transform: 'translate(4px,-50%)',
          width: 18, height: 18, borderRadius: '50%', background: '#f0a04b'
        }}></div>
        <div style={{
          position: 'absolute', left: 0, top: 'calc(50% + 18px)',
          fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: 22, color: '#1f5a3a'
        }}>berço</div>
        <div style={{
          position: 'absolute', left: '25%', top: 'calc(50% + 18px)',
          transform: 'translateX(-50%)',
          fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: 22, color: 'rgba(15,20,16,0.5)',
          whiteSpace: 'nowrap'
        }}>(portão · gate)</div>
        <div style={{
          position: 'absolute', right: 0, top: 'calc(50% + 18px)',
          fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: 22, color: '#f0a04b'
        }}>túmulo</div>
        {/* Marker for active phase */}
        <div style={{
          position: 'absolute',
          left: `${active / (ACV_PHASES.length - 1) * 100}%`,
          top: 'calc(50% - 28px)',
          transform: 'translateX(-50%)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 20,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: cur.color,
          transition: 'left 350ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          ▼<br />
        </div>
      </div>

      {/* Detail */}
      <div style={{
        flex: 1, padding: 40,
        background: '#f1eee5',
        border: '1px solid rgba(15,20,16,0.14)',
        display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 56, alignItems: 'center'
      }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, letterSpacing: '0.15em', color: cur.color, textTransform: 'uppercase' }}>Módulo {cur.code}</div>
          <div style={{ fontFamily: 'Newsreader, serif', fontSize: 72, lineHeight: 1.05, marginTop: 8 }}>{cur.label}</div>
        </div>
        <div>
          <div style={{ fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: 38, color: 'rgba(15,20,16,0.85)', lineHeight: 1.25, letterSpacing: '-0.01em' }}>
            {cur.sub}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
            {ACV_PHASES.map((p, i) =>
            <div key={p.id} style={{
              flex: 1, height: 8,
              background: i === active ? p.color : 'rgba(15,20,16,0.12)',
              transition: 'background 200ms ease'
            }}></div>
            )}
          </div>
          <div style={{ marginTop: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 20, color: 'rgba(15,20,16,0.5)', letterSpacing: '0.12em' }}>
            EN 15978 · ISO 14040 / 14044
          </div>
        </div>
      </div>
    </div>);

}

/* ============================================================
   7. UHPC BARS COMPARISON
   ============================================================ */
function UHPCBars() {
  const data = [
  { label: 'Concreto convencional', val: 35, range: '20—50 MPa', color: '#a8a293' },
  { label: 'Concreto de alto desempenho (HPC)', val: 80, range: '60—100 MPa', color: '#5a8a6a' },
  { label: 'UHPC', val: 150, range: '> 100 MPa', color: '#1f5a3a', highlight: true }];

  const max = 220;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 36, height: '100%' }}>
      {data.map((d, i) =>
      <div key={d.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 24, fontWeight: d.highlight ? 600 : 400, color: d.highlight ? '#0f1410' : 'rgba(15,20,16,0.7)' }}>{d.label}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, color: 'rgba(15,20,16,0.5)' }}>{d.range}</div>
          </div>
          <div style={{ position: 'relative', height: 56, background: 'rgba(15,20,16,0.05)' }}>
            <div style={{
            height: '100%',
            width: `${d.val / max * 100}%`,
            background: d.color,
            animation: `growBar 1s cubic-bezier(0.4, 0, 0.2, 1) ${i * 200}ms both`,
            transformOrigin: 'left',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            paddingRight: 16
          }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, color: '#e8e5dd', fontWeight: 600 }}>{d.val} MPa</span>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', borderTop: '1px solid rgba(15,20,16,0.14)', paddingTop: 20, marginTop: 12 }}>
        <span style={{ padding: '4px 10px', background: '#0f1410', color: '#e8e5dd', fontFamily: 'JetBrains Mono, monospace', fontSize: 20, letterSpacing: '0.12em' }}>DURABILIDADE</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: 26 }}>UHPC dura <strong style={{ color: '#1f5a3a', fontStyle: 'normal' }}>5×</strong> mais que o convencional.</span>
          <span style={{ fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: 26 }}><strong style={{ color: '#1f5a3a', fontStyle: 'normal' }}>350 anos</strong> de vida útil no pilar de referência.</span>
        </div>
      </div>
      <style>{`
        @keyframes growBar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      `}</style>
    </div>);

}

/* ============================================================
   8. UHPC MIX COMPOSITION
   ============================================================ */
function UHPCMix() {
  const ingredients = [
  { name: 'Areia fina', pct: 41.1, color: '#c9bfa5', note: 'esqueleto granular' },
  { name: 'Cimento Portland', pct: 37.3, color: '#0f1410', note: 'alto teor de ligante' },
  { name: 'Sílica ativa', pct: 7.2, color: '#3ea568', note: 'reação pozolânica' },
  { name: 'Água', pct: 7.1, color: '#a3c4de', note: 'a/c = 0,19' },
  { name: 'Pó de quartzo', pct: 3.7, color: '#a8957a', note: 'fíler inerte' },
  { name: 'Fibras de aço', pct: 2.0, color: '#7a5a3a', note: 'ductilidade & ruptura controlada' },
  { name: 'Superplastificante', pct: 1.5, color: '#f0a04b', note: 'fluidez sem aumentar água' }];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{
        display: 'flex', height: 88,
        border: '1px solid rgba(15,20,16,0.14)'
      }}>
        {ingredients.map((ing, i) =>
        <div key={ing.name} style={{
          width: ing.pct + '%',
          background: ing.color,
          animation: `growHoriz 700ms ease ${i * 80}ms both`,
          position: 'relative',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          paddingBottom: 8
        }}>
            {ing.pct >= 5 && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 17, color: '#e8e5dd', fontWeight: 600, mixBlendMode: 'difference' }}>{ing.pct.toFixed(1).replace('.', ',')}%</span>}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflow: 'hidden' }}>
        {ingredients.map((ing, i) =>
        <div key={ing.name} style={{
          display: 'grid', gridTemplateColumns: '20px 1fr auto 1fr', gap: 18, alignItems: 'baseline',
          padding: '6px 0',
          borderBottom: '1px solid rgba(15,20,16,0.08)',
          animation: `fadeUp 500ms ease ${i * 70 + 200}ms both`
        }}>
            <div style={{ width: 18, height: 18, background: ing.color, borderRadius: 3 }}></div>
            <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 28 }}>{ing.name}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 26, fontWeight: 600 }}>{ing.pct.toFixed(1).replace('.', ',')}%</div>
            <div style={{ fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: 27, color: 'rgba(15,20,16,0.78)' }}>{ing.note}</div>
          </div>
        )}
      </div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 20,
        lineHeight: 1.55,
        color: 'rgba(15,20,16,0.62)',
        paddingTop: 6,
        animation: 'fadeUp 500ms ease 800ms both'
      }}>
        Adaptado de MANZATO <span style={{ fontStyle: 'italic' }}>et al.</span> (2023). Traço original: Santos (2023). Teor de fibras de aço ajustado para 2% em massa (MARVILA <span style={{ fontStyle: 'italic' }}>et al.</span>, 2021; SANTOS, 2025).
      </div>
      <style>{`
        @keyframes growHoriz { from { transform: scaleX(0); transform-origin: left; } to { transform: scaleX(1); } }
      `}</style>
    </div>);

}

/* ============================================================
   9. WORLD MAP — iconic UHPC works
   ============================================================ */
const UHPC_WORKS = [
{ name: 'Fondation Louis Vuitton', loc: 'Paris · França', year: 2014, lat: 48.86, lng: 2.30, type: 'Arquitetura', tone: 'green' },
{ name: 'Sakata Mirai Bridge', loc: 'Sakata · Japão', year: 2002, lat: 38.91, lng: 139.83, type: 'Ponte pedestre', tone: 'orange' },
{ name: 'Sherbrooke Bridge', loc: 'Sherbrooke · Canadá', year: 1997, lat: 45.40, lng: -71.89, type: 'Primeira ponte UHPC', tone: 'green' },
{ name: 'MUCEM (fachada)', loc: 'Marselha · França', year: 2013, lat: 43.30, lng: 5.36, type: 'Arquitetura', tone: 'green' },
{ name: 'Wapello County Bridge', loc: 'Iowa · EUA', year: 2006, lat: 41.06, lng: -92.45, type: 'Ponte rodoviária', tone: 'orange' },
{ name: 'Jiangsu Pedestrian Bridge', loc: 'Jiangsu · China', year: 2018, lat: 32.04, lng: 118.78, type: 'Ponte pedestre', tone: 'orange' },
{ name: 'Bourg-lès-Valence', loc: 'França', year: 2001, lat: 44.95, lng: 4.90, type: 'Ponte rodoviária', tone: 'orange' },
{ name: 'Stade Jean-Bouin', loc: 'Paris · França', year: 2013, lat: 48.84, lng: 2.25, type: 'Arquitetura', tone: 'green' }];


function WorldMap() {
  const [hover, setHover] = useState(null);
  // Equirectangular: lng -180..180 → 0..100%, lat 90..-90 → 0..100%
  const proj = (lat, lng) => ({
    x: (lng + 180) / 360 * 100,
    y: (90 - lat) / 180 * 100
  });
  // Pre-rendered minimal continent outlines (very simplified paths in equirectangular)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: 36, height: '100%' }}>
      <div style={{
        position: 'relative',
        background: '#f1eee5',
        border: '1px solid rgba(15,20,16,0.14)',
        overflow: 'hidden'
      }}>
        <svg viewBox="0 0 360 180" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {/* Grid lines */}
          {[30, 60, 90, 120, 150].map((y) =>
          <line key={y} x1="0" y1={y} x2="360" y2={y} stroke="rgba(15,20,16,0.05)" strokeWidth="0.3" />
          )}
          {[60, 120, 180, 240, 300].map((x) =>
          <line key={x} x1={x} y1="0" x2={x} y2="180" stroke="rgba(15,20,16,0.05)" strokeWidth="0.3" />
          )}
          {/* Equator */}
          <line x1="0" y1="90" x2="360" y2="90" stroke="rgba(15,20,16,0.12)" strokeWidth="0.4" strokeDasharray="1.5 1.5" />
          {/* Continents – stylised dotted */}
          {Array.from({ length: 1600 }).map((_, i) => {
            // pseudo-randomly distribute dots over continent zones
            const seed = i * 2654435761 % 1000 / 1000;
            const seed2 = (i + 7) * 2654435769 % 1000 / 1000;
            // continents bands (approx):
            const zones = [
            { x: [10, 35], y: [40, 100] }, // N America
            { x: [60, 80], y: [95, 165] }, // S America
            { x: [165, 230], y: [40, 95] }, // Eurasia
            { x: [170, 220], y: [95, 160] }, // Africa
            { x: [255, 300], y: [40, 85] }, // China/Asia
            { x: [275, 305], y: [115, 145] }, // Australia
            { x: [150, 175], y: [10, 55] } // Europe
            ];
            const z = zones[i % zones.length];
            const x = z.x[0] + seed * (z.x[1] - z.x[0]);
            const y = z.y[0] + seed2 * (z.y[1] - z.y[0]);
            return <circle key={i} cx={x} cy={y} r="0.5" fill="rgba(15,20,16,0.18)" />;
          })}
        </svg>

        {/* Markers */}
        {UHPC_WORKS.map((w, i) => {
          const { x, y } = proj(w.lat, w.lng);
          const isHover = hover === i;
          const color = w.tone === 'orange' ? '#f0a04b' : '#1f5a3a';
          return (
            <div key={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            style={{
              position: 'absolute',
              left: x + '%', top: y + '%',
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer',
              zIndex: isHover ? 5 : 1
            }}>
              <div style={{
                width: isHover ? 22 : 14, height: isHover ? 22 : 14,
                borderRadius: '50%',
                background: color,
                border: '2px solid #f1eee5',
                boxShadow: isHover ? `0 0 0 8px ${color}33` : `0 0 0 0 ${color}33`,
                transition: 'all 200ms ease',
                animation: `pulse 2s ease ${i * 200}ms infinite`
              }}></div>
              {isHover &&
              <div style={{
                position: 'absolute', left: '120%', top: '50%',
                transform: 'translateY(-50%)',
                background: '#0f1410', color: '#e8e5dd',
                padding: '10px 14px',
                whiteSpace: 'nowrap',
                fontFamily: 'Geist, sans-serif',
                fontSize: 20,
                fontWeight: 500,
                boxShadow: '0 6px 18px rgba(0,0,0,0.2)'
              }}>{w.name}<div style={{ fontSize: 20, opacity: 0.7, marginTop: 2, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>{w.loc} · {w.year}</div></div>
              }
            </div>);

        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#1f5a3a' }}></div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, letterSpacing: '0.1em' }}>Arquitetura / fachada</span>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#f0a04b', marginLeft: 16 }}></div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, letterSpacing: '0.1em' }}>Ponte / infra</span>
        </div>
        <div style={{ borderTop: '1px solid rgba(15,20,16,0.14)' }}></div>
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {UHPC_WORKS.map((w, i) =>
          <div key={i}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
          style={{
            padding: '12px 14px',
            background: hover === i ? '#f1eee5' : 'transparent',
            borderLeft: '3px solid ' + (w.tone === 'orange' ? '#f0a04b' : '#1f5a3a'),
            transition: 'background 150ms ease',
            cursor: 'pointer'
          }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 20, fontWeight: 500 }}>{w.name}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, color: 'rgba(15,20,16,0.5)' }}>{w.year}</div>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, color: 'rgba(15,20,16,0.55)', letterSpacing: '0.05em', marginTop: 2 }}>
                {w.loc} · {w.type}
              </div>
            </div>
          )}
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, color: 'rgba(15,20,16,0.45)', marginTop: 'auto', lineHeight: 1.5 }}>
          TAYEH et al. (2023). <i>Ultra-High-Performance Concrete (UHPC) — Applications Worldwide: A State-of-the-Art Review.</i> J. Engineering Research and Technology, v.10, n.1.
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(31,90,58,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(31,90,58,0); }
        }
      `}</style>
    </div>);

}

/* ============================================================
   10. GANTT — schedule
   ============================================================ */
function Gantt() {
  const months = ['Jun 25', 'Jul 25', 'Ago 25', 'Set 25', 'Out 25', 'Nov 25', 'Dez 25'];
  const tasks = [
  { label: 'Qualificação', start: 0, end: 1, color: '#1f5a3a' },
  { label: 'Protocolo PRISMA + extração', start: 0, end: 1, color: '#3ea568' },
  { label: 'Meta-análise estatística', start: 0, end: 2, color: '#3ea568' },
  { label: 'Modelagem do sistema ACV', start: 1, end: 3, color: '#0f1410' },
  { label: 'Inventário do ciclo de vida', start: 2, end: 4, color: '#0f1410' },
  { label: 'Análise de impacto + sensibilidade', start: 3, end: 5, color: '#f0a04b' },
  { label: 'Comparações com outros materiais', start: 5, end: 6, color: '#f0a04b' },
  { label: 'Escrita da dissertação', start: 0, end: 6, color: '#5a8a6a' },
  { label: 'Defesa', start: 6, end: 7, color: '#1f5a3a' }];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '520px repeat(7, 1fr)', gap: 4 }}>
        <div></div>
        {months.map((m) =>
        <div key={m} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, color: 'rgba(15,20,16,0.55)', textAlign: 'center', letterSpacing: '0.05em' }}>{m}</div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        {tasks.map((t, i) =>
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '520px repeat(7, 1fr)', gap: 4,
          alignItems: 'center',
          borderTop: '1px solid rgba(15,20,16,0.08)',
          paddingTop: 10
        }}>
            <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 28, paddingRight: 16, whiteSpace: 'nowrap' }}>{t.label}</div>
            {months.map((_, mi) =>
          <div key={mi} style={{
            height: 24,
            background: mi >= t.start && mi < t.end ? t.color : 'transparent',
            borderRadius: 2,
            animation: mi >= t.start && mi < t.end ? `growHoriz 800ms ease ${i * 60 + (mi - t.start) * 30}ms both` : 'none',
            transformOrigin: 'left'
          }}></div>
          )}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(15,20,16,0.14)' }}>
        {[
        { c: '#1f5a3a', l: 'Marcos' },
        { c: '#3ea568', l: 'RSL' },
        { c: '#0f1410', l: 'ACV' },
        { c: '#f0a04b', l: 'Análises' },
        { c: '#5a8a6a', l: 'Escrita' }].
        map((g) =>
        <div key={g.l} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 20, height: 20, background: g.c }}></div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, color: 'rgba(15,20,16,0.7)' }}>{g.l}</span>
          </div>
        )}
      </div>
    </div>);

}
/* ============================================================
   11. RSL FLOW — fragment-stepped flowchart with meta-analysis reveal
   ============================================================ */
function RSLFlow() {
  const [step, , containerRef] = useFragmentNav(2);

  const CARDS = [
    { col: 3, num: '01', name: 'Planejamento',  text: 'Definição das palavras-chave iniciais, dos termos de busca (strings) e seleção dos bancos de dados.' },
    { col: 5, num: '02', name: 'Execução',      text: 'Coleta dos trabalhos e aplicação dos critérios de inclusão e exclusão.' },
    { col: 7, num: '03', name: 'Sumarização',   text: 'Avaliação e classificação completa dos artigos selecionados.' },
    { col: 9, num: '04', name: 'Apresentação',  text: 'Elaboração do documento (neste estudo, a dissertação) com os resultados encontrados na revisão.' },
  ];

  const hideOuter = step >= 1;

  return (
    <div ref={containerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      <div className="rsl-flow" style={{ flex: 1 }}>

        {/* Bracket */}
        <div className="rsl-bracket"></div>
        <div className="rsl-bracket-label">EMPACOTAMENTO</div>

        {/* Nodes + arrows */}
        <div className="rsl-node terminus" style={{ gridColumn: 1 }}>INÍCIO</div>
        <div className="rsl-arrow" style={{ gridColumn: 2 }}></div>
        <div className="rsl-node step" style={{ gridColumn: 3 }}>PLANEJAMENTO</div>
        <div className="rsl-arrow" style={{ gridColumn: 4 }}></div>
        <div className="rsl-node step" style={{ gridColumn: 5 }}>EXECUÇÃO</div>
        <div className="rsl-arrow" style={{ gridColumn: 6 }}></div>
        <div className="rsl-node step" style={{ gridColumn: 7 }}>SUMARIZAÇÃO</div>
        <div className="rsl-arrow" style={{ gridColumn: 8 }}></div>
        <div className="rsl-node step" style={{ gridColumn: 9 }}>APRESENTAÇÃO DOS RESULTADOS</div>
        <div className="rsl-arrow" style={{ gridColumn: 10 }}></div>
        <div className="rsl-node terminus" style={{ gridColumn: 11 }}>FIM</div>

        {/* Vertical tees — hide SUMAR + APRES when meta-analysis is shown */}
        <div className="rsl-tee" style={{ gridColumn: 3 }}></div>
        <div className="rsl-tee" style={{ gridColumn: 5 }}></div>
        <div className="rsl-tee" style={{ gridColumn: 7, opacity: hideOuter ? 0 : 1, transition: 'opacity 0.3s' }}></div>
        <div className="rsl-tee" style={{ gridColumn: 9, opacity: hideOuter ? 0 : 1, transition: 'opacity 0.3s' }}></div>

        {/* Detail cards */}
        {CARDS.map(c => (
          <div key={c.col} className="rsl-card" style={{
            gridColumn: c.col,
            opacity: (hideOuter && (c.col === 7 || c.col === 9)) ? 0 : 1,
            transition: 'opacity 0.3s',
          }}>
            <div className="rsl-card-hd">
              <div className="rsl-card-num">{c.num}</div>
              <div className="rsl-card-name">{c.name}</div>
            </div>
            <div className="rsl-card-text" style={{ fontSize: 24 }}>{c.text}</div>
          </div>
        ))}

        {/* Meta-analysis callout — revealed on step 1 */}
        <div style={{
          gridColumn: '7 / 10',
          gridRow: '3 / 5',
          zIndex: 5,
          opacity: step >= 1 ? 1 : 0,
          transform: step >= 1 ? 'translateY(0)' : 'translateY(14px)',
          transition: 'opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s',
          background: 'var(--bg-dark)',
          color: 'var(--bg-cream)',
          padding: '22px 28px 26px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          border: '2px solid var(--green-deep)',
          margin: '0 14px',
        }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 24,
            letterSpacing: '0.22em',
            color: 'var(--green)',
            fontWeight: 600,
            textTransform: 'uppercase',
            marginBottom: 2,
          }}>META-ANÁLISE</div>
          <p style={{
            fontFamily: 'Geist, sans-serif',
            fontSize: 24,
            color: 'rgba(232,229,221,0.85)',
            lineHeight: 1.5,
            margin: 0,
          }}>
            Técnica estatística que <strong style={{ color: 'var(--bg-cream)', fontWeight: 600 }}>combina os resultados quantitativos de múltiplos estudos independentes</strong> para produzir uma estimativa síntese mais robusta do que qualquer estudo isolado — aplicada aqui entre a sumarização e a apresentação dos resultados.
          </p>
        </div>

      </div>

      {/* Legend */}
      <div className="rsl-legend">
        <span><span className="swatch sw-term"></span>Marcos do processo</span>
        <span><span className="swatch sw-step"></span>Etapa metodológica</span>
        <span><span className="swatch sw-pkg"></span>Empacotamento — núcleo iterativo</span>
      </div>

    </div>
  );
}

/* ============================================================
   LIME CYCLE — LimeCycleSteps reveals each reaction of the
   calcination cycle (CaCO₃ ↔ CaO ↔ Ca(OH)₂) by highlighting the
   reagents and products of the active step. 5 viewers (CaCO₃,
   CO₂, CaO, H₂O, Ca(OH)₂), one fragment per reaction.
   ============================================================ */

const SDF_CACO3 = `caco3
  3Dmol hand-crafted

  5  4  0  0  0  0  0  0  0  0999 V2000
    3.6000    0.3000    0.5000 Ca  0  0  0  0  0  0  0  0  0  0  0  0
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.2700    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
   -0.6350    1.1000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
   -0.6350   -1.1000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
  2  3  2  0  0  0  0
  2  4  1  0  0  0  0
  2  5  1  0  0  0  0
  1  3  1  0  0  0  0
M  END
$$$$`;

const SDF_CO2 = `co2
  3Dmol hand-crafted

  3  2  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.1600    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
   -1.1600    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
  1  3  2  0  0  0  0
M  END
$$$$`;

const SDF_CAO = `cao
  3Dmol hand-crafted

  2  1  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 Ca  0  0  0  0  0  0  0  0  0  0  0  0
    2.4000    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
M  END
$$$$`;

const SDF_H2O = `h2o
  3Dmol hand-crafted

  3  2  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    0.7600    0.5900    0.1000 H   0  0  0  0  0  0  0  0  0  0  0  0
   -0.7600    0.5900   -0.1000 H   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  1  3  1  0  0  0  0
M  END
$$$$`;

const SDF_CAOH2 = `caoh2
  3Dmol hand-crafted

  5  4  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 Ca  0  0  0  0  0  0  0  0  0  0  0  0
   -2.3000    0.5000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    2.3000    0.5000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
   -2.9000    1.1000    0.6000 H   0  0  0  0  0  0  0  0  0  0  0  0
    2.9000    1.1000   -0.6000 H   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  1  3  1  0  0  0  0
  2  4  1  0  0  0  0
  3  5  1  0  0  0  0
M  END
$$$$`;

const CYCLE_MOLS = [
{ id: 'caco3', label: 'CaCO₃', name: 'calcário', sdf: SDF_CACO3 },
{ id: 'co2', label: 'CO₂', name: 'dióxido de carbono', sdf: SDF_CO2 },
{ id: 'cao', label: 'CaO', name: 'cal virgem', sdf: SDF_CAO },
{ id: 'h2o', label: 'H₂O', name: 'água', sdf: SDF_H2O },
{ id: 'caoh2', label: 'Ca(OH)₂', name: 'cal hidratada', sdf: SDF_CAOH2 }];


const CYCLE_STEPS = [
{ name: 'INÍCIO', eq: '3 reações, 3 transformações', active: [], color: 'rgba(15,20,16,0.55)' },
{ name: 'CALCINAÇÃO', eq: 'CaCO₃ + Calor → CaO + CO₂', active: ['caco3', 'co2', 'cao'], color: '#f0a04b' },
{ name: 'HIDRATAÇÃO', eq: 'CaO + H₂O → Ca(OH)₂ + Calor', active: ['cao', 'h2o', 'caoh2'], color: '#3ea568' },
{ name: 'CARBONATAÇÃO', eq: 'Ca(OH)₂ + CO₂ → CaCO₃ + H₂O', active: ['caoh2', 'co2', 'caco3'], color: '#1f5a3a' }];


function mountMolViewer(el, sdf) {
  if (!window.$3Dmol) return null;
  const v = $3Dmol.createViewer(el, { backgroundColor: 0xf8f8f8 });
  v.addModel(sdf, 'sdf');
  v.setStyle({}, { stick: { radius: 0.18, colorscheme: 'Jmol' }, sphere: { scale: 0.32, colorscheme: 'Jmol' } });
  v.zoomTo();
  v.zoom(1.15);
  v.spin(true);
  v.render();
  return v;
}

/* ---- V1: LimeCycleSteps — fragments reveal each reaction ---- */
function LimeCycleSteps() {
  const [step, , containerRef] = useFragmentNav(CYCLE_STEPS.length);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    const root = containerRef.current;
    if (!root || !window.$3Dmol) return;
    CYCLE_MOLS.forEach((mol) => {
      const el = root.querySelector('#viewer-steps-' + mol.id);
      if (el && !el.dataset.mounted) {
        mountMolViewer(el, mol.sdf);
        el.dataset.mounted = '1';
      }
    });
    mountedRef.current = true;
  }, []);

  const cur = CYCLE_STEPS[step];
  const isStart = step === 0;

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ flex: '0 0 auto', textAlign: 'center', marginBottom: 24, minHeight: 90 }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 28,
          letterSpacing: '0.16em', color: cur.color,
          textTransform: 'uppercase', transition: 'color 300ms ease'
        }}>{cur.name}</div>
        <div style={{
          fontFamily: 'Newsreader, serif', fontSize: 36, color: '#0f1410',
          marginTop: 12, transition: 'all 300ms ease',
          fontStyle: isStart ? 'italic' : 'normal'
        }}>{cur.eq}</div>
      </div>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 32, minHeight: 0
      }}>
        {CYCLE_MOLS.map((mol) => {
          const isActive = isStart || cur.active.indexOf(mol.id) >= 0;
          return (
            <div key={mol.id} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 12, opacity: isActive ? 1 : 0.2,
              transition: 'opacity 400ms ease'
            }}>
              <div style={{
                fontFamily: 'Newsreader, serif', fontSize: 40,
                lineHeight: 1, color: '#0f1410'
              }}>{mol.label}</div>
              <div style={{
                fontFamily: 'Geist, sans-serif', fontSize: 24,
                color: 'rgba(15,20,16,0.55)'
              }}>{mol.name}</div>
              <div
                id={'viewer-steps-' + mol.id}
                style={{
                  width: 260, height: 260, position: 'relative',
                  borderRadius: 10, overflow: 'hidden',
                  boxShadow: isActive && !isStart ?
                  '0 0 0 2px ' + cur.color + ', 0 0 32px ' + cur.color + '40' :
                  '0 0 0 1px rgba(15,20,16,0.08)',
                  transition: 'box-shadow 400ms ease'
                }}></div>
            </div>);

        })}
      </div>
      <div style={{
        flex: '0 0 auto', marginTop: 16, display: 'flex',
        justifyContent: 'center', gap: 12
      }}>
        {CYCLE_STEPS.map((s, i) => (
          <div key={i} style={{
            width: i === step ? 40 : 16, height: 4,
            background: i === step ? s.color : 'rgba(15,20,16,0.18)',
            borderRadius: 2, transition: 'all 300ms ease'
          }}></div>
        ))}
      </div>
    </div>);

}

/* ============================================================
   MOUNTING
   ============================================================ */
const mounts = [
['timeline-cops', TimelineCOPs],
['co2-counter', CO2Counter],
['cement-process', CementProcess],
['lime-cycle-steps', LimeCycleSteps],
['acv-diagram', ACVDiagram],
['uhpc-bars', UHPCBars],
['uhpc-mix', UHPCMix],
['world-map', WorldMap],
['gantt', Gantt],
['rsl-flow', RSLFlow]];


mounts.forEach(([id, Comp]) => {
  const el = document.getElementById(id);
  if (el) {
    ReactDOM.createRoot(el).render(<Comp />);
  }
});