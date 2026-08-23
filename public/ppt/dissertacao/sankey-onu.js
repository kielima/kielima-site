/* Sankey ONU Brasil — financiadores → agências → ODS
 *
 * Renders a real Sankey diagram into #sankey-onu using d3 + d3-sankey.
 * Values are approximations matching the proportions of the original
 * ONU Brasil dashboard chart (brasil.un.org/pt-br/sdgs).
 *
 * Loads d3 + d3-sankey dynamically on first call so it doesn't slow
 * down the other slides.
 */
(function () {
  'use strict';

  const D3_URL = 'https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js';
  const SANKEY_URL = 'https://cdn.jsdelivr.net/npm/d3-sankey@0.12.3/dist/d3-sankey.min.js';

  // ── data ─────────────────────────────────────────────────────────────
  // Categories: f = funder, a = agency, o = ODS
  const NODES = [
    // Funders (left)
    { id: 'Brazil',  cat: 'f', color: '#E27A78' },
    { id: 'Itaipu',  cat: 'f', color: '#E27A78' },
    { id: 'GCF',     cat: 'f', color: '#E89C56' },
    { id: 'UNICEF·f',label: 'UNICEF', cat: 'f', color: '#5DC3D7' },
    { id: 'GEF',     cat: 'f', color: '#7BC56B' },
    { id: 'USA',     cat: 'f', color: '#9B6DBD' },
    { id: 'IFAD·f',  label: 'IFAD', cat: 'f', color: '#B66BB0' },
    { id: 'ABC',     cat: 'f', color: '#7C7C7C' },
    { id: 'Germany', cat: 'f', color: '#9DB35B' },
    { id: 'EU',      cat: 'f', color: '#5B8FD1' },
    { id: 'Japan',   cat: 'f', color: '#D26B6B' },
    { id: 'IDB',     cat: 'f', color: '#6BB39B' },
    { id: 'Other',   cat: 'f', color: '#B5B0A4' },

    // Agencies (middle)
    { id: 'UNDP',     cat: 'a', color: '#E07A65' },
    { id: 'UNOPS',    cat: 'a', color: '#4FB3D9' },
    { id: 'UNICEF·a', label: 'UNICEF', cat: 'a', color: '#6FCB5C' },
    { id: 'IFAD·a',   label: 'IFAD',   cat: 'a', color: '#E27A78' },
    { id: 'UNESCO',   cat: 'a', color: '#3F8FB8' },
    { id: 'IOM',      cat: 'a', color: '#9B6DBD' },
    { id: 'UNEP',     cat: 'a', color: '#5B8FD1' },
    { id: 'FAO',      cat: 'a', color: '#D26B6B' },
    { id: 'UNHCR',    cat: 'a', color: '#9B6DBD' },
    { id: 'ILO·a',    label: 'ILO',    cat: 'a', color: '#7C7C7C' },
    { id: 'UN Women', cat: 'a', color: '#D04E63' },

    // ODS (right) — UN official ODS colors
    { id: 'ODS01', label: '1. Erradicação da pobreza',     cat: 'o', color: '#E5243B' },
    { id: 'ODS02', label: '2. Fome zero',                  cat: 'o', color: '#DDA63A' },
    { id: 'ODS03', label: '3. Saúde e bem-estar',          cat: 'o', color: '#4C9F38' },
    { id: 'ODS04', label: '4. Educação de qualidade',      cat: 'o', color: '#C5192D' },
    { id: 'ODS05', label: '5. Igualdade de gênero',        cat: 'o', color: '#FF3A21' },
    { id: 'ODS06', label: '6. Água potável',               cat: 'o', color: '#26BDE2' },
    { id: 'ODS08', label: '8. Trabalho decente',           cat: 'o', color: '#A21942' },
    { id: 'ODS09', label: '9. Indústria, inovação',        cat: 'o', color: '#FD6925' },
    { id: 'ODS10', label: '10. Redução das desigualdades', cat: 'o', color: '#DD1367' },
    { id: 'ODS11', label: '11. Cidades sustentáveis',      cat: 'o', color: '#FD9D24' },
    { id: 'ODS12', label: '12. Consumo responsável',       cat: 'o', color: '#BF8B2E' },
    { id: 'ODS13', label: '13. Ação contra o clima',       cat: 'o', color: '#3F7E44' },
    { id: 'ODS14', label: '14. Vida na água',              cat: 'o', color: '#0A97D9' },
    { id: 'ODS15', label: '15. Vida terrestre',            cat: 'o', color: '#56C02B' },
    { id: 'ODS16', label: '16. Paz, justiça e instituições', cat: 'o', color: '#00689D' },
    { id: 'ODS17', label: '17. Parcerias e meios',         cat: 'o', color: '#19486A' },
  ];

  // Approximated flow values (millions USD-equivalent, qualitative).
  const LINKS = [
    // Brazil → many agencies (biggest funder)
    ['Brazil', 'UNDP', 14], ['Brazil', 'UNOPS', 10], ['Brazil', 'UNICEF·a', 3],
    ['Brazil', 'IOM', 2], ['Brazil', 'UNESCO', 3], ['Brazil', 'FAO', 1.5],
    ['Brazil', 'UNHCR', 1], ['Brazil', 'UN Women', 0.8], ['Brazil', 'ILO·a', 0.7],

    // Itaipu → mostly UNDP/UNOPS
    ['Itaipu', 'UNDP', 8], ['Itaipu', 'UNOPS', 5], ['Itaipu', 'UNEP', 1],

    // GCF → climate-heavy
    ['GCF', 'UNDP', 5], ['GCF', 'UNEP', 3], ['GCF', 'IFAD·a', 1.5],

    // UNICEF (funder) → UNICEF (agency)
    ['UNICEF·f', 'UNICEF·a', 5], ['UNICEF·f', 'UNESCO', 1.5],

    // GEF → environment
    ['GEF', 'UNDP', 2.5], ['GEF', 'UNEP', 2], ['GEF', 'UNOPS', 1.5],

    // USA → multilateral
    ['USA', 'UNDP', 2], ['USA', 'UNHCR', 1.5], ['USA', 'IOM', 1.5], ['USA', 'UNOPS', 0.5],

    // IFAD (funder) → IFAD (agency)
    ['IFAD·f', 'IFAD·a', 4], ['IFAD·f', 'FAO', 0.5],

    // ABC, Germany, EU, Japan, IDB → spread
    ['ABC', 'UNESCO', 1.5], ['ABC', 'UNOPS', 1], ['ABC', 'UNDP', 0.8],
    ['Germany', 'UNDP', 1.5], ['Germany', 'UNEP', 0.8], ['Germany', 'FAO', 0.5],
    ['EU', 'UNDP', 1], ['EU', 'UNOPS', 0.8],
    ['Japan', 'UNDP', 1], ['Japan', 'IOM', 0.8],
    ['IDB', 'UNOPS', 1.2], ['IDB', 'UNDP', 0.5],

    // Other (long tail)
    ['Other', 'UNDP', 2.5], ['Other', 'UNOPS', 2], ['Other', 'UNICEF·a', 1],
    ['Other', 'UNESCO', 1], ['Other', 'IOM', 0.8], ['Other', 'FAO', 0.7],
    ['Other', 'UNHCR', 0.5], ['Other', 'UN Women', 0.4], ['Other', 'ILO·a', 0.3],

    // Agencies → ODS
    // UNDP — broadest distribution
    ['UNDP', 'ODS01', 3], ['UNDP', 'ODS04', 4], ['UNDP', 'ODS05', 2.5],
    ['UNDP', 'ODS10', 3], ['UNDP', 'ODS11', 3], ['UNDP', 'ODS13', 3.5],
    ['UNDP', 'ODS15', 3], ['UNDP', 'ODS16', 6], ['UNDP', 'ODS17', 3],

    // UNOPS — infrastructure + cities
    ['UNOPS', 'ODS03', 3], ['UNOPS', 'ODS04', 3], ['UNOPS', 'ODS09', 1],
    ['UNOPS', 'ODS11', 4], ['UNOPS', 'ODS15', 3], ['UNOPS', 'ODS16', 3],
    ['UNOPS', 'ODS17', 2], ['UNOPS', 'ODS01', 1.5], ['UNOPS', 'ODS10', 1.5],
    ['UNOPS', 'ODS06', 0.8],

    // UNICEF agency → kids, education, health
    ['UNICEF·a', 'ODS03', 1.5], ['UNICEF·a', 'ODS04', 3.5],
    ['UNICEF·a', 'ODS05', 1.5], ['UNICEF·a', 'ODS16', 2.5],

    // IFAD agency → rural / hunger / land
    ['IFAD·a', 'ODS02', 2.5], ['IFAD·a', 'ODS15', 1.5], ['IFAD·a', 'ODS01', 1.5],

    // UNESCO → education
    ['UNESCO', 'ODS04', 4], ['UNESCO', 'ODS05', 1], ['UNESCO', 'ODS16', 1],
    ['UNESCO', 'ODS17', 1], ['UNESCO', 'ODS11', 0.5],

    // IOM → migration / peace
    ['IOM', 'ODS10', 2], ['IOM', 'ODS16', 1.5], ['IOM', 'ODS01', 0.5], ['IOM', 'ODS08', 1.1],

    // UNEP → climate / land / water
    ['UNEP', 'ODS13', 2.5], ['UNEP', 'ODS15', 1.8], ['UNEP', 'ODS14', 1],
    ['UNEP', 'ODS06', 0.8], ['UNEP', 'ODS12', 0.7],

    // FAO → hunger / land
    ['FAO', 'ODS02', 2], ['FAO', 'ODS15', 0.7], ['FAO', 'ODS12', 0.5],

    // UNHCR → refugees → peace, equality
    ['UNHCR', 'ODS10', 1.5], ['UNHCR', 'ODS16', 1.5],

    // ILO → trabalho decente
    ['ILO·a', 'ODS08', 0.9], ['ILO·a', 'ODS01', 0.1],

    // UN Women → gender
    ['UN Women', 'ODS05', 1.5], ['UN Women', 'ODS16', 0.7],
  ];

  // ── tiny script loader ───────────────────────────────────────────────
  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-src="${url}"]`);
      if (existing && existing.dataset.loaded) return resolve();
      if (existing) {
        existing.addEventListener('load', resolve);
        existing.addEventListener('error', reject);
        return;
      }
      const s = document.createElement('script');
      s.src = url;
      s.dataset.src = url;
      s.onload = () => { s.dataset.loaded = '1'; resolve(); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function ensureLibs() {
    if (typeof d3 === 'undefined') await loadScript(D3_URL);
    if (typeof d3.sankey === 'undefined') await loadScript(SANKEY_URL);
  }

  // ── render ───────────────────────────────────────────────────────────
  function render(container) {
    const W = container.clientWidth || 940;
    const H = container.clientHeight || 620;
    const M = { top: 12, right: 8, bottom: 12, left: 8 };

    const nodeIndex = new Map(NODES.map((n, i) => [n.id, i]));
    const nodes = NODES.map(n => ({ ...n, name: n.label || n.id }));
    const links = LINKS.map(([s, t, v]) => ({
      source: nodeIndex.get(s),
      target: nodeIndex.get(t),
      value: v,
    })).filter(l => l.source !== undefined && l.target !== undefined);

    const sankey = d3.sankey()
      .nodeWidth(14)
      .nodePadding(6)
      .nodeAlign(d3.sankeyJustify)
      .extent([[M.left, M.top], [W - M.right, H - M.bottom]]);

    const graph = sankey({
      nodes: nodes.map(d => ({ ...d })),
      links: links.map(d => ({ ...d })),
    });

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.display = 'block';
    svg.style.fontFamily = "'JetBrains Mono', ui-monospace, monospace";

    // Links
    const gLinks = document.createElementNS(ns, 'g');
    gLinks.setAttribute('fill', 'none');
    gLinks.setAttribute('stroke-opacity', '0.42');
    svg.appendChild(gLinks);

    const linkPath = d3.sankeyLinkHorizontal();
    for (const link of graph.links) {
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', linkPath(link));
      path.setAttribute('stroke', link.source.color || '#aaa');
      path.setAttribute('stroke-width', Math.max(0.6, link.width));
      gLinks.appendChild(path);
    }

    // Nodes
    const gNodes = document.createElementNS(ns, 'g');
    svg.appendChild(gNodes);

    for (const n of graph.nodes) {
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', n.x0);
      rect.setAttribute('y', n.y0);
      rect.setAttribute('width', n.x1 - n.x0);
      rect.setAttribute('height', Math.max(0.5, n.y1 - n.y0));
      rect.setAttribute('fill', n.color || '#888');
      gNodes.appendChild(rect);

      const h = n.y1 - n.y0;
      if (h < 6) continue; // skip labels for very thin slivers

      const text = document.createElementNS(ns, 'text');
      const isLeft = n.cat === 'f';
      const isRight = n.cat === 'o';
      const labelText = n.name;

      if (h >= 14) {
        // Label sits inside the node block on its anchored side
        if (isRight) {
          text.setAttribute('x', n.x0 - 6);
          text.setAttribute('y', (n.y0 + n.y1) / 2);
          text.setAttribute('text-anchor', 'end');
        } else if (isLeft) {
          text.setAttribute('x', n.x1 + 6);
          text.setAttribute('y', (n.y0 + n.y1) / 2);
          text.setAttribute('text-anchor', 'start');
        } else {
          text.setAttribute('x', n.x1 + 6);
          text.setAttribute('y', (n.y0 + n.y1) / 2);
          text.setAttribute('text-anchor', 'start');
        }
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', '#2b2a26');
        text.setAttribute('font-size', '11');
        text.setAttribute('font-weight', '500');
        text.textContent = labelText;
        // Truncate ODS labels for the right column
        if (isRight && labelText.length > 26) {
          text.textContent = labelText.slice(0, 24) + '…';
        }
      } else {
        // Thin nodes — small label outside
        text.setAttribute('x', isRight ? n.x0 - 6 : n.x1 + 6);
        text.setAttribute('y', (n.y0 + n.y1) / 2);
        text.setAttribute('text-anchor', isRight ? 'end' : 'start');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', '#5a5852');
        text.setAttribute('font-size', '11');
        text.textContent = labelText.length > 18 ? labelText.slice(0, 16) + '…' : labelText;
      }
      gNodes.appendChild(text);
    }

    container.innerHTML = '';
    container.appendChild(svg);
  }

  let rendered = false;

  function tryRender() {
    if (rendered) return true;
    const container = document.getElementById('sankey-onu');
    if (!container) return false;
    if (typeof d3 === 'undefined' || typeof d3.sankey !== 'function') return false;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w < 10 || h < 10) return false;
    try {
      render(container);
      rendered = true;
      return true;
    } catch (e) {
      container.innerHTML =
        '<div style="padding:24px;color:#a04;font-family:monospace;font-size:14px">Falha ao renderizar Sankey: ' +
        (e.message || e) + '</div>';
      rendered = true;
      return true;
    }
  }

  async function init() {
    const container = document.getElementById('sankey-onu');
    if (!container) return;
    try {
      await ensureLibs();
    } catch (e) {
      container.innerHTML =
        '<div style="padding:24px;color:#a04;font-family:monospace;font-size:14px">Falha ao carregar D3: ' +
        (e.message || e) + '</div>';
      return;
    }

    // Try right away — and keep retrying on a backoff until the container
    // has real dimensions (deck-stage may still be laying things out).
    const delays = [0, 50, 150, 350, 750, 1500, 3000];
    for (const d of delays) {
      setTimeout(() => { if (!rendered) tryRender(); }, d);
    }

    // Also re-attempt on resize until we succeed (deck-stage scales the
    // canvas after fonts load — the container's px size changes).
    const resizeObserver = new ResizeObserver(() => {
      if (!rendered) tryRender();
    });
    resizeObserver.observe(container);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  // Belt-and-braces — also kick off after window 'load' in case DCL
  // listener missed (e.g. script injected after DCL but before this IIFE
  // ran).
  window.addEventListener('load', init);
})();
