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
      bio: 'Engenheira civil (PUC-Campinas, bolsa ProUni), com MBA em Gestão de Projetos pela FGV e mestranda em Sistemas de Infraestrutura Urbana (PUC-Campinas, bolsa CAPES). Pesquiso Avaliação de Ciclo de Vida de materiais cimentícios (concreto reciclado e UHPC) com artigo publicado no fib Congress 2026, em Lisboa.',
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
      bio: 'Civil engineer (PUC-Campinas, ProUni scholarship), with an MBA in Project Management from FGV and an ongoing MSc in Urban Infrastructure Systems (PUC-Campinas, CAPES scholarship). My research focuses on Life Cycle Assessment of cementitious materials — recycled concrete and UHPC — with a paper published at fib Congress 2026, in Lisbon.',
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
      bio: '土木工程师（坎皮纳斯天主教大学，ProUni奖学金），持有FGV项目管理MBA学位，目前在坎皮纳斯天主教大学攻读城市基础设施系统硕士学位（CAPES奖学金）。研究方向为水泥基材料的生命周期评估——再生混凝土与超高性能混凝土（UHPC）——论文已发表于2026年里斯本fib大会。',
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

  // Em navegadores móveis, navegar o próprio separador para um recurso
  // real (não blob:) servido com Content-Type text/vcard -- sem
  // Content-Disposition: attachment -- faz o sistema interceptar e abrir
  // a tela nativa de "Adicionar Contato" na hora, sem passar pela pasta
  // Downloads. Funciona tanto no Safari/iOS quanto no Chrome/Android,
  // mas só de forma confiável com um arquivo real: um blob: não carrega
  // os headers HTTP que o Android usa pra decidir abrir com o app de
  // Contatos, e por isso baixa mesmo sem o atributo `download`. Os três
  // arquivos estáticos (um por idioma) ficam em public/assets/ e os
  // headers em public/_headers -- se o texto de TITLE mudar em algum
  // idioma aqui embaixo, atualizar os .vcf também.
  var VCF_POR_IDIOMA = { PT: 'kie-lima-pt.vcf', EN: 'kie-lima-en.vcf', ZH: 'kie-lima-zh.vcf' };

  function isIOS() {
    return (
      /iP(hone|od|iPad)/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  }

  function isAndroid() {
    return /Android/.test(navigator.userAgent);
  }

  function montarVCard() {
    var role = strings().role.replace(/[.。]$/, '');
    return [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Lima;Kiê;;;',
      'FN:Kiê Lima',
      'TITLE:' + role,
      'EMAIL;TYPE=INTERNET:' + EMAIL,
      'URL:https://kielima.com',
      'URL:https://www.linkedin.com/in/kielima/',
      'TEL;TYPE=CELL,VOICE:' + PHONE,
      'IMPP:whatsapp:' + PHONE,
      'END:VCARD'
    ].join('\r\n');
  }

  addButton.addEventListener('click', function () {
    if (isIOS() || isAndroid()) {
      var arquivo = VCF_POR_IDIOMA[i18n ? i18n.current() : 'PT'] || VCF_POR_IDIOMA.PT;
      window.location.href = '/assets/' + arquivo;
      return;
    }

    // Desktop (e qualquer navegador não reconhecido acima): não existe
    // integração nativa com um app de contatos, então baixar o arquivo
    // continua sendo o caminho mais previsível -- construído na hora,
    // com o texto de TITLE do idioma atual, igual sempre foi.
    var blob = new Blob([montarVCard()], { type: 'text/vcard;charset=utf-8' });
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

  window.KLSpecular.attach(addButton);

  /* ---- Botão de teste: vCard cru em data: URI, sem HTTP nenhum ------------
     QR code e tag NFC carregam o vCard como texto puro dentro do próprio
     código/chip -- não é um link pra buscar em servidor. Este botão testa
     se navegar direto pra um data: URI (mesma ideia: o conteúdo já vem
     embutido, sem round-trip de rede) muda o comportamento no Android/iOS
     em relação ao arquivo estático servido por HTTP. Remover depois do
     teste, junto com o botão em cartao/index.html. */
  var testButton = document.getElementById('test-vcard-datauri');
  if (testButton) {
    testButton.addEventListener('click', function () {
      var dataUri = 'data:text/vcard;charset=utf-8,' + encodeURIComponent(montarVCard());
      window.location.href = dataUri;
    });
  }
})();
