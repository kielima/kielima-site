/* Cartão de visita digital — kielima.com/cartao */
(function () {
  'use strict';

  var EMAIL = 'kie@kielima.com';
  var PHONE = '+5519982666695';

  var COPY = {
    PT: {
      brand: 'ENGENHARIA CIVIL · PROJETOS · SUSTENTABILIDADE',
      name: 'Kiê Lima',
      role: 'Pesquisa e inovação em materiais sustentáveis para construção.',
      bio: 'Engenheira civil (PUC-Campinas, bolsa ProUni), com MBA em Gestão de Projetos pela FGV e mestranda em Sistemas de Infraestrutura Urbana (PUC-Campinas, bolsa CAPES). Pesquiso Avaliação de Ciclo de Vida de materiais cimentícios (concreto reciclado e UHPC) com artigo aceito no fib Congress 2026, em Lisboa.',
      mission: 'ES > G',
      addContact: 'Adicionar contato',
      seedNote: 'O cartão físico é impresso em papel semente.',
      seedLink: 'Instruções de plantio →',
      copied: EMAIL + ' copiado',
      themeToDark: 'Modo escuro',
      themeToLight: 'Modo claro'
    },
    EN: {
      brand: 'CIVIL ENGINEERING · PROJECTS · SUSTAINABILITY',
      name: 'Kiê Lima',
      role: 'Research and innovation in sustainable construction materials.',
      bio: 'Civil engineer (PUC-Campinas, ProUni scholarship), with an MBA in Project Management from FGV and an ongoing MSc in Urban Infrastructure Systems (PUC-Campinas, CAPES scholarship). My research focuses on Life Cycle Assessment of cementitious materials — recycled concrete and UHPC — with a paper accepted at fib Congress 2026, in Lisbon.',
      mission: 'Environmental and social impact, prioritized above all else.',
      addContact: 'Add contact',
      seedNote: 'The printed card is made of seed paper.',
      seedLink: 'Planting instructions →',
      copied: EMAIL + ' copied',
      themeToDark: 'Dark mode',
      themeToLight: 'Light mode'
    },
    ZH: {
      brand: '土木工程 · 项目管理 · 可持续发展',
      name: '霆宇',
      role: '可持续建筑材料的研究与创新。',
      bio: '土木工程师（坎皮纳斯天主教大学，ProUni奖学金），持有FGV项目管理MBA学位，目前在坎皮纳斯天主教大学攻读城市基础设施系统硕士学位（CAPES奖学金）。研究方向为水泥基材料的生命周期评估——再生混凝土与超高性能混凝土（UHPC）——论文已被2026年里斯本fib大会接受。',
      mission: '始终将环境与社会利益置于其他利益之上。',
      addContact: '添加联系人',
      seedNote: '实体名片使用种子纸印刷。',
      seedLink: '种植说明 →',
      copied: EMAIL + ' 已复制',
      themeToDark: '深色模式',
      themeToLight: '浅色模式'
    }
  };

  var PALETTE = {
    light: ['#1f5a3a', '#3ea568'],
    dark: ['#eaeee8', '#a8dcbd']
  };

  var toggle = document.getElementById('theme-toggle');
  var copied = document.getElementById('copied');
  var emailLink = document.getElementById('email-link');
  var addButton = document.getElementById('add-contact');

  /* ------------------------------------------------------------------ tema */

  var particles = window.KLParticles.init(document.getElementById('particles'), {
    particleColors: PALETTE[window.KLTheme.isDark() ? 'dark' : 'light'],
    particleCount: 200,
    particleSpread: 10,
    speed: 0.1,
    particleBaseSize: 100,
    moveParticlesOnHover: true,
    alphaParticles: false,
    disableRotation: false
  });

  /* ----------------------------------------------------------------- idioma */

  var themeCtl = null;

  var i18n = window.KLI18n.init({
    copy: COPY,
    select: document.getElementById('lang-select'),
    // Reetiqueta o botão de tema no idioma novo.
    onChange: function () {
      if (themeCtl) themeCtl.sync();
    }
  });

  function strings() {
    return i18n ? i18n.strings() : COPY.PT;
  }

  themeCtl = window.KLTheme.attach(document.getElementById('theme-toggle'), function (dark) {
    var s = strings();
    var label = dark ? s.themeToLight : s.themeToDark;
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
    if (particles) particles.setColors(PALETTE[dark ? 'dark' : 'light']);
  });

  /* --------------------------------------------------------- copiar e-mail */

  var copyTimer;
  emailLink.addEventListener('click', function () {
    // O mailto segue normalmente; copiar é só uma conveniência para quem
    // não tem cliente de e-mail configurado no dispositivo.
    try {
      if (navigator.clipboard) navigator.clipboard.writeText(EMAIL);
    } catch (e) {}
    copied.hidden = false;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(function () {
      copied.hidden = true;
    }, 2200);
  });

  /* ------------------------------------------------------------ vCard (.vcf) */

  addButton.addEventListener('click', function () {
    var role = strings().role.replace(/[.。]$/, '');
    var vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Lima;Kiê;;;',
      'FN:Kiê Lima',
      'TITLE:' + role,
      'EMAIL;TYPE=INTERNET:' + EMAIL,
      'URL:https://www.linkedin.com/in/kielima/',
      'URL:https://github.com/kielima',
      'TEL;TYPE=CELL,VOICE:' + PHONE,
      'IMPP:whatsapp:' + PHONE,
      'END:VCARD'
    ].join('\r\n');

    var blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'Kie-Lima.vcf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 3000);
  });

  /* ------------------------------- anel especular que segue o ponteiro */

  var raf = 0;
  window.addEventListener('pointermove', function (e) {
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      var rect = addButton.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right);
      var dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom);
      var dist = Math.sqrt(dx * dx + dy * dy);
      var t = Math.max(0, 1 - dist / 250);
      var prox = Math.round(t * t * (3 - 2 * t) * 100) / 100;
      var deg = Math.round((Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI + 90);

      addButton.style.setProperty('--spec-from', deg - 14 + 'deg');
      addButton.style.setProperty('--spec-a', (0.35 + 0.65 * prox).toFixed(2));
      addButton.style.setProperty('--spec-op', String(prox));
    });
  });

})();
