/* Metanálise ao vivo — kielima.com/metanalise

   Mesmo contrato do resto do site: texto em COPY, uma chave por idioma,
   HTML só marca onde entra via data-i18n. O que não é texto — dados,
   gráficos — é montado aqui, e reconstruído a cada troca de idioma porque
   os rótulos dos gráficos (eixos, categorias, tooltip) não são nós
   data-i18n comuns.

   DATA é o extrato de dados_fck (revisao-sistematica-literatura) filtrado
   a pares comparáveis por m³ (exclui totais de estrutura inteira, que não
   têm a mesma unidade de análise, e linhas cuja unidade de CO₂ ainda não
   foi confirmada em kg/m³ — ver UNIT_STATS). Cada item é
   [fck_MPa, co2_kg_m3, cat, estrato, citacao_curta_ou_null, base] — o 5º campo
   (adicionado 2026-09-12, pedido da Kie) é uma citação curta tipo
   "Sobrenome et al., Ano" usada só como rótulo de UI no forest plot por
   estudo (clique numa família em "ci por família de material" para
   expandir); null quando dados_fck.autores está vazio. O 6º campo
   (2026-09-28, pedido da Kie) é a base do ligante do traço: 'P' (cimento
   Portland como ligante principal), 'N' (sem clínquer Portland: geopolímero,
   álcali-ativado, CSA, magnésio, gesso, madeira) ou 'M' (linha mista que junta
   os dois) -- alimenta o filtro "Só cimento Portland" (baseFilter). UNIT_STATS é a
   contagem de linhas de dados_fck por tipo de unidade de CO₂ relatada —
   nativo (publicada assim pelo artigo), derivado (convertida por nós) ou
   pendente (ainda na unidade original do estudo, por família: m², tonelada,
   kg, elemento inteiro, metro linear, índice já normalizado por MPa,
   outro). Gerado por script Python a partir do banco em 2026-09-12 — ver
   metanalise-export.py no repositório da RSL para reproduzir; ambos os
   arrays são recalculados a cada corrida do script, sem manutenção manual. */
(function () {
  'use strict';

  var CATS = ['geopolimero', 'uhpc', 'scm', 'reciclado', 'opc', 'ligantes', 'biobase', 'concreto_armado'];

  /* Subfamílias do cimento Portland (2026-10-11, F12, pedido da Kie): dentro da família
     «Cimento Portland (referência)» o forest mostra primeiro as subfamílias (tipo de cimento tal como o
     artigo o escreve) e só depois os estudos. d[8] = código da subfamília (só na família opc). Cada uma tem
     um botão (i) com a definição e a referência normativa; as que dizem «por confirmar» ainda não foram
     verificadas no texto da norma. Fonte dos códigos: lotes_cimento/subfamilia.py (repositório da RSL). */
  var SUBFAM = {"cp_i": {"pt": "CP I", "en": "CP I", "zh": "CP I", "pt_i": "Cimento Portland comum brasileiro. Clínquer + sulfatos de cálcio 95–100 %, adições 0–5 % (CP I-S: 90–94 % e 6–10 % de material carbonático). Fonte: ABNT NBR 16697:2018, Tabela 2 «Limites de composição do cimento Portland (porcentagem de massa)», secção 4.1, p. 5.", "en_i": "Brazilian ordinary Portland cement. Clinker + calcium sulfates 95–100 %, additions 0–5 % (CP I-S: 90–94 % and 6–10 % carbonate material). Source: ABNT NBR 16697:2018, Table 2 \"Composition limits of Portland cement (percentage by mass)\", section 4.1, p. 5."}, "cp_ii": {"pt": "CP II (E ou F, não separados)", "en": "CP II (E or F, not separated)", "zh": "CP II（E或F，未区分）", "pt_i": "Cimento Portland composto brasileiro, quando o artigo junta CP II-E e CP II-F sem os separar. Limites de cada um na ABNT NBR 16697:2018, Tabela 2 «Limites de composição do cimento Portland (porcentagem de massa)», secção 4.1, p. 5.", "en_i": "Brazilian composite Portland cement, when the article reports CP II-E and CP II-F together. Limits of each in ABNT NBR 16697:2018, Table 2 \"Composition limits of Portland cement (percentage by mass)\", section 4.1, p. 5."}, "cp_ii_e": {"pt": "CP II-E", "en": "CP II-E", "zh": "CP II-E", "pt_i": "Cimento Portland composto com escória granulada de alto-forno. Clínquer + sulfatos 51–94 %, escória 6–34 %, material carbonático 0–15 %. Fonte: ABNT NBR 16697:2018, Tabela 2 «Limites de composição do cimento Portland (porcentagem de massa)», secção 4.1, p. 5.", "en_i": "Composite Portland cement with granulated blast-furnace slag. Clinker + sulfates 51–94 %, slag 6–34 %, carbonate material 0–15 %. Source: ABNT NBR 16697:2018, Table 2 \"Composition limits of Portland cement (percentage by mass)\", section 4.1, p. 5."}, "cp_ii_f": {"pt": "CP II-F", "en": "CP II-F", "zh": "CP II-F", "pt_i": "Cimento Portland composto com material carbonático (fíler calcário). Clínquer + sulfatos 75–89 %, material carbonático 11–25 %. Fonte: ABNT NBR 16697:2018, Tabela 2 «Limites de composição do cimento Portland (porcentagem de massa)», secção 4.1, p. 5.", "en_i": "Composite Portland cement with carbonate material (limestone filler). Clinker + sulfates 75–89 %, carbonate material 11–25 %. Source: ABNT NBR 16697:2018, Table 2 \"Composition limits of Portland cement (percentage by mass)\", section 4.1, p. 5."}, "cp_ii_z": {"pt": "CP II-Z", "en": "CP II-Z", "zh": "CP II-Z", "pt_i": "Cimento Portland composto com material pozolânico. Clínquer + sulfatos 71–94 %, pozolana 6–14 %, material carbonático 0–15 %. Fonte: ABNT NBR 16697:2018, Tabela 2 «Limites de composição do cimento Portland (porcentagem de massa)», secção 4.1, p. 5.", "en_i": "Composite Portland cement with pozzolanic material. Clinker + sulfates 71–94 %, pozzolan 6–14 %, carbonate material 0–15 %. Source: ABNT NBR 16697:2018, Table 2 \"Composition limits of Portland cement (percentage by mass)\", section 4.1, p. 5."}, "cp_iii": {"pt": "CP III", "en": "CP III", "zh": "CP III", "pt_i": "Cimento Portland de alto-forno. Clínquer + sulfatos 25–65 %, escória granulada de alto-forno 35–75 %, material carbonático 0–10 %. Fonte: ABNT NBR 16697:2018, Tabela 2 «Limites de composição do cimento Portland (porcentagem de massa)», secção 4.1, p. 5.", "en_i": "Blast-furnace Portland cement. Clinker + sulfates 25–65 %, granulated blast-furnace slag 35–75 %, carbonate material 0–10 %. Source: ABNT NBR 16697:2018, Table 2 \"Composition limits of Portland cement (percentage by mass)\", section 4.1, p. 5."}, "cp_v_ari": {"pt": "CP V-ARI", "en": "CP V-ARI", "zh": "CP V-ARI", "pt_i": "Cimento Portland de alta resistência inicial: ≥ 14 MPa a 1 dia (ABNT NBR 16697:2018, Tabela 1, nota d, p. 4). Clínquer + sulfatos 90–100 %, material carbonático 0–10 %. Fonte da composição: ABNT NBR 16697:2018, Tabela 2 «Limites de composição do cimento Portland (porcentagem de massa)», secção 4.1, p. 5.", "en_i": "High early-strength Portland cement: ≥ 14 MPa at 1 day (ABNT NBR 16697:2018, Table 1, note d, p. 4). Clinker + sulfates 90–100 %, carbonate material 0–10 %. Composition source: ABNT NBR 16697:2018, Table 2 \"Composition limits of Portland cement (percentage by mass)\", section 4.1, p. 5."}, "cem_i": {"pt": "CEM I", "en": "CEM I", "zh": "CEM I", "pt_i": "Cimento Portland europeu, praticamente só clínquer (constituintes minoritários até 5 %). Norma: EN 197-1 (e versões nacionais BS, UNE, SIST, TS EN 197-1). Referência exacta (tabela e página) por confirmar: a norma só é vendida pelo organismo de normalização e não foi encontrada cópia gratuita legítima.", "en_i": "European Portland cement, practically clinker only (minor constituents up to 5 %). Standard: EN 197-1 (and national versions BS, UNE, SIST, TS EN 197-1). Exact reference (table and page) to be confirmed: the standard is only sold by the standards body and no legitimate free copy was found."}, "cem_ii_a": {"pt": "CEM II/A", "en": "CEM II/A", "zh": "CEM II/A", "pt_i": "Cimento Portland composto europeu com a menor faixa de adições (letra A; ex.: -L/-LL calcário, -M mistura, -S escória). Norma: EN 197-1. Referência exacta (tabela e página) por confirmar: a norma só é vendida pelo organismo de normalização e não foi encontrada cópia gratuita legítima.", "en_i": "European composite Portland cement with the lower additions range (letter A; e.g. -L/-LL limestone, -M mixed, -S slag). Standard: EN 197-1. Exact reference (table and page) to be confirmed: the standard is only sold by the standards body and no legitimate free copy was found."}, "cem_ii_b": {"pt": "CEM II/B", "en": "CEM II/B", "zh": "CEM II/B", "pt_i": "Cimento Portland composto europeu com a faixa de adições mais alta (letra B; ex.: B-V cinza volante, B-M mistura). Norma: EN 197-1. Referência exacta (tabela e página) por confirmar: a norma só é vendida pelo organismo de normalização e não foi encontrada cópia gratuita legítima.", "en_i": "European composite Portland cement with the higher additions range (letter B; e.g. B-V fly ash, B-M mixed). Standard: EN 197-1. Exact reference (table and page) to be confirmed: the standard is only sold by the standards body and no legitimate free copy was found."}, "cem_ii": {"pt": "CEM II (sem /A ou /B)", "en": "CEM II (no /A or /B)", "zh": "CEM II（未注明A/B）", "pt_i": "O artigo escreve «CEM II» sem dizer se é /A ou /B, por isso não se sabe a faixa de adições. Norma: EN 197-1. Referência exacta (tabela e página) por confirmar: a norma só é vendida pelo organismo de normalização e não foi encontrada cópia gratuita legítima.", "en_i": "The article writes \"CEM II\" without /A or /B, so the additions range is unknown. Standard: EN 197-1. Exact reference (table and page) to be confirmed: the standard is only sold by the standards body and no legitimate free copy was found."}, "cem_iii": {"pt": "CEM III", "en": "CEM III", "zh": "CEM III", "pt_i": "Cimento de alto-forno europeu (escória como constituinte principal; subtipos A, B, C). Norma: EN 197-1. Referência exacta (tabela e página) por confirmar: a norma só é vendida pelo organismo de normalização e não foi encontrada cópia gratuita legítima.", "en_i": "European blast-furnace cement (slag as main constituent; subtypes A, B, C). Standard: EN 197-1. Exact reference (table and page) to be confirmed: the standard is only sold by the standards body and no legitimate free copy was found."}, "cem_iv": {"pt": "CEM IV", "en": "CEM IV", "zh": "CEM IV", "pt_i": "Cimento pozolânico europeu. Norma: EN 197-1. Referência exacta (tabela e página) por confirmar: a norma só é vendida pelo organismo de normalização e não foi encontrada cópia gratuita legítima.", "en_i": "European pozzolanic cement. Standard: EN 197-1. Exact reference (table and page) to be confirmed: the standard is only sold by the standards body and no legitimate free copy was found."}, "cem_v": {"pt": "CEM V", "en": "CEM V", "zh": "CEM V", "pt_i": "Cimento composto europeu (escória + pozolana/cinza). Norma: EN 197-1. Referência exacta (tabela e página) por confirmar: a norma só é vendida pelo organismo de normalização e não foi encontrada cópia gratuita legítima.", "en_i": "European composite cement (slag + pozzolan/fly ash). Standard: EN 197-1. Exact reference (table and page) to be confirmed: the standard is only sold by the standards body and no legitimate free copy was found."}, "astm_type_i": {"pt": "ASTM Type I", "en": "ASTM Type I", "zh": "ASTM I型", "pt_i": "Cimento Portland de uso geral norte-americano (Type I: «para uso quando não se exigem as propriedades especiais dos outros tipos»). Norma verificada: ASTM C150-07 (cópia oficial incorporada por referência na regulamentação federal dos EUA, 30 CFR 250.901, publicada pela Public.Resource.Org). Tipos de cimento: secção 1.1, p. 1; tipos combinados (ex.: «Type I/II»): Nota 1, p. 1; ingredientes permitidos: secção 5.1, p. 2 — clínquer, sulfato de cálcio e até 5,0 % de calcário (5.1.3); requisitos de composição: Tabela 1, p. 2. As edições mais recentes (até C150/C150M-24) não foram verificadas.", "en_i": "North American general-use Portland cement (Type I: \"for use when the special properties specified for any other type are not required\"). Standard verified: ASTM C150-07 (official copy incorporated by reference in US federal regulations, 30 CFR 250.901, posted by Public.Resource.Org). Cement types: section 1.1, p. 1; combined types (e.g. \"Type I/II\"): Note 1, p. 1; permitted ingredients: section 5.1, p. 2 — clinker, calcium sulfate and up to 5.0 % limestone (5.1.3); composition requirements: Table 1, p. 2. Later editions (up to C150/C150M-24) were not verified."}, "astm_type_ii": {"pt": "ASTM Type II", "en": "ASTM Type II", "zh": "ASTM II型", "pt_i": "Cimento Portland de resistência moderada a sulfatos ou calor de hidratação moderado (Type II). Norma verificada: ASTM C150-07 (cópia oficial incorporada por referência na regulamentação federal dos EUA, 30 CFR 250.901, publicada pela Public.Resource.Org). Tipos de cimento: secção 1.1, p. 1; tipos combinados (ex.: «Type I/II»): Nota 1, p. 1; ingredientes permitidos: secção 5.1, p. 2 — clínquer, sulfato de cálcio e até 5,0 % de calcário (5.1.3); requisitos de composição: Tabela 1, p. 2. As edições mais recentes (até C150/C150M-24) não foram verificadas.", "en_i": "Portland cement with moderate sulfate resistance or moderate heat of hydration (Type II). Standard verified: ASTM C150-07 (official copy incorporated by reference in US federal regulations, 30 CFR 250.901, posted by Public.Resource.Org). Cement types: section 1.1, p. 1; combined types (e.g. \"Type I/II\"): Note 1, p. 1; permitted ingredients: section 5.1, p. 2 — clinker, calcium sulfate and up to 5.0 % limestone (5.1.3); composition requirements: Table 1, p. 2. Later editions (up to C150/C150M-24) were not verified."}, "astm_type_i_ii": {"pt": "ASTM Type I/II", "en": "ASTM Type I/II", "zh": "ASTM I/II型", "pt_i": "Cimento que cumpre ao mesmo tempo os Types I e II (designação combinada). Norma verificada: ASTM C150-07 (cópia oficial incorporada por referência na regulamentação federal dos EUA, 30 CFR 250.901, publicada pela Public.Resource.Org). Tipos de cimento: secção 1.1, p. 1; tipos combinados (ex.: «Type I/II»): Nota 1, p. 1; ingredientes permitidos: secção 5.1, p. 2 — clínquer, sulfato de cálcio e até 5,0 % de calcário (5.1.3); requisitos de composição: Tabela 1, p. 2. As edições mais recentes (até C150/C150M-24) não foram verificadas.", "en_i": "Cement meeting both Type I and Type II (combined designation). Standard verified: ASTM C150-07 (official copy incorporated by reference in US federal regulations, 30 CFR 250.901, posted by Public.Resource.Org). Cement types: section 1.1, p. 1; combined types (e.g. \"Type I/II\"): Note 1, p. 1; permitted ingredients: section 5.1, p. 2 — clinker, calcium sulfate and up to 5.0 % limestone (5.1.3); composition requirements: Table 1, p. 2. Later editions (up to C150/C150M-24) were not verified."}, "astm_type_ii_v": {"pt": "ASTM Type II/V", "en": "ASTM Type II/V", "zh": "ASTM II/V型", "pt_i": "Cimento que cumpre os Types II e V (designação combinada; o Type V é de alta resistência a sulfatos). Norma verificada: ASTM C150-07 (cópia oficial incorporada por referência na regulamentação federal dos EUA, 30 CFR 250.901, publicada pela Public.Resource.Org). Tipos de cimento: secção 1.1, p. 1; tipos combinados (ex.: «Type I/II»): Nota 1, p. 1; ingredientes permitidos: secção 5.1, p. 2 — clínquer, sulfato de cálcio e até 5,0 % de calcário (5.1.3); requisitos de composição: Tabela 1, p. 2. As edições mais recentes (até C150/C150M-24) não foram verificadas.", "en_i": "Cement meeting Types II and V (combined designation; Type V is high sulfate resistance). Standard verified: ASTM C150-07 (official copy incorporated by reference in US federal regulations, 30 CFR 250.901, posted by Public.Resource.Org). Cement types: section 1.1, p. 1; combined types (e.g. \"Type I/II\"): Note 1, p. 1; permitted ingredients: section 5.1, p. 2 — clinker, calcium sulfate and up to 5.0 % limestone (5.1.3); composition requirements: Table 1, p. 2. Later editions (up to C150/C150M-24) were not verified."}, "astm_c150": {"pt": "ASTM C150 (tipo não indicado)", "en": "ASTM C150 (type not given)", "zh": "ASTM C150（未注明型号）", "pt_i": "O artigo cita a ASTM C150 mas não diz o tipo (I a V). Norma verificada: ASTM C150-07 (cópia oficial incorporada por referência na regulamentação federal dos EUA, 30 CFR 250.901, publicada pela Public.Resource.Org). Tipos de cimento: secção 1.1, p. 1; tipos combinados (ex.: «Type I/II»): Nota 1, p. 1; ingredientes permitidos: secção 5.1, p. 2 — clínquer, sulfato de cálcio e até 5,0 % de calcário (5.1.3); requisitos de composição: Tabela 1, p. 2. As edições mais recentes (até C150/C150M-24) não foram verificadas.", "en_i": "The article cites ASTM C150 but not the type (I to V). Standard verified: ASTM C150-07 (official copy incorporated by reference in US federal regulations, 30 CFR 250.901, posted by Public.Resource.Org). Cement types: section 1.1, p. 1; combined types (e.g. \"Type I/II\"): Note 1, p. 1; permitted ingredients: section 5.1, p. 2 — clinker, calcium sulfate and up to 5.0 % limestone (5.1.3); composition requirements: Table 1, p. 2. Later editions (up to C150/C150M-24) were not verified."}, "astm_il": {"pt": "Type IL — PLC (ASTM C595)", "en": "Type IL — PLC (ASTM C595)", "zh": "IL型——石灰石硅酸盐水泥（ASTM C595）", "pt_i": "Cimento Portland de calcário (portland-limestone cement). Norma: ASTM C595. Referência exacta (tabela e página) por confirmar: a norma só é vendida pelo organismo de normalização e não foi encontrada cópia gratuita legítima.", "en_i": "Portland-limestone cement. Standard: ASTM C595. Exact reference (table and page) to be confirmed: the standard is only sold by the standards body and no legitimate free copy was found."}, "astm_c1157": {"pt": "ASTM C1157 (GU / HE / MH)", "en": "ASTM C1157 (GU / HE / MH)", "zh": "ASTM C1157（GU / HE / MH）", "pt_i": "Cimento hidráulico especificado por desempenho (GU uso geral, HE alta resistência inicial, MH calor moderado), sem limites de composição. Norma: ASTM C1157 (no Equador NTE INEN 2380, na Colômbia NTC 121). Referência exacta (tabela e página) por confirmar: a norma só é vendida pelo organismo de normalização e não foi encontrada cópia gratuita legítima.", "en_i": "Performance-specified hydraulic cement (GU general use, HE high early strength, MH moderate heat), with no composition limits. Standard: ASTM C1157 (Ecuador NTE INEN 2380, Colombia NTC 121). Exact reference (table and page) to be confirmed: the standard is only sold by the standards body and no legitimate free copy was found."}, "is_opc_grau": {"pt": "OPC 43/53 grade (Índia)", "en": "OPC 43/53 grade (India)", "zh": "OPC 43/53级（印度）", "pt_i": "Cimento Portland comum indiano classificado pela resistência mínima aos 28 dias. Normas verificadas (edições citadas pelos artigos; cópias oficiais publicadas pela Public.Resource.Org): IS 8112:2013 (grau 43) e IS 12269:2013 (grau 53). Fabrico: cláusula 4.1 e 4.1.1, p. 1 — além de gesso, só «melhoradores de desempenho» (cinza volante, escória, sílica ativa, calcário, cinza de casca de arroz, metacaulino) até 5 % cada e 5 % no total (Tabela 1, p. 1). Resistência à compressão aos 28 dias (672 ± 4 h): mínimo 43 MPa (IS 8112) e 53 MPa (IS 12269), Tabela 3, p. 3. Desde 2015 as duas foram integradas na IS 269:2015 (não verificada).", "en_i": "Indian ordinary Portland cement graded by minimum 28-day strength. Standards verified (editions cited by the articles; official copies posted by Public.Resource.Org): IS 8112:2013 (grade 43) and IS 12269:2013 (grade 53). Manufacture: clauses 4.1 and 4.1.1, p. 1 — besides gypsum, only \"performance improvers\" (fly ash, slag, silica fume, limestone, rice husk ash, metakaolin) up to 5 % each and 5 % in total (Table 1, p. 1). Compressive strength at 28 days (672 ± 4 h): minimum 43 MPa (IS 8112) and 53 MPa (IS 12269), Table 3, p. 3. Since 2015 both were merged into IS 269:2015 (not verified)."}, "gb_po": {"pt": "P·O / P·I (China)", "en": "P·O / P·I (China)", "zh": "P·O / P·I（中国）", "pt_i": "Cimentos Portland chineses. Norma verificada: GB 175-2023 (texto oficial no portal openstd.samr.gov.cn), secção 5.1, p. 2. Tabela 1: P·I = 100 % clínquer + gesso; P·II = 95–100 % clínquer + gesso e 0–5 % de escória ou de calcário. Tabela 2: P·O (cimento Portland comum) = 80–94 % clínquer + gesso, 6–20 % de materiais principais (escória, cinza volante ou pozolana) e 0–5 % de calcário como material de substituição. A edição anterior, GB 175-2007, foi retirada e não foi verificada.", "en_i": "Chinese Portland cements. Standard verified: GB 175-2023 (official text on openstd.samr.gov.cn), section 5.1, p. 2. Table 1: P·I = 100 % clinker + gypsum; P·II = 95–100 % clinker + gypsum and 0–5 % slag or limestone. Table 2: P·O (ordinary Portland cement) = 80–94 % clinker + gypsum, 6–20 % main constituents (slag, fly ash or pozzolan) and 0–5 % limestone as substitute. The previous edition, GB 175-2007, is withdrawn and was not verified."}, "as_gp": {"pt": "GP (Austrália)", "en": "GP (Australia)", "zh": "GP（澳大利亚）", "pt_i": "Cimento Portland de uso geral australiano (General Purpose), com pequena quantidade de adições minerais permitida. Norma: AS 3972 (AS/NZS 3972). Referência exacta (tabela e página) por confirmar: a norma só é vendida pelo organismo de normalização e não foi encontrada cópia gratuita legítima.", "en_i": "Australian General Purpose Portland cement, with a small amount of mineral additions allowed. Standard: AS 3972 (AS/NZS 3972). Exact reference (table and page) to be confirmed: the standard is only sold by the standards body and no legitimate free copy was found."}, "nc_cuba": {"pt": "P-35 / PP-25 (Cuba)", "en": "P-35 / PP-25 (Cuba)", "zh": "P-35 / PP-25（古巴）", "pt_i": "Cimentos cubanos: P-35 Portland (NC 95:2011) e PP-25 Portland pozolânico (NC 96:2011). Referência exacta (tabela e página) por confirmar: as cópias existem em servidores cubanos, mas não foi possível aceder-lhes para verificação.", "en_i": "Cuban cements: P-35 Portland (NC 95:2011) and PP-25 pozzolanic Portland (NC 96:2011). Exact reference (table and page) to be confirmed: copies exist on Cuban servers but could not be reached for verification."}, "branco": {"pt": "Cimento branco", "en": "White cement", "zh": "白水泥", "pt_i": "Cimento Portland branco, de clínquer com baixo teor de óxidos corantes. O artigo usa o factor de uma EPD comercial e não cita norma. No Brasil: CPB, ABNT NBR 16697:2018, Tabela 2 (p. 5).", "en_i": "White Portland cement, from clinker low in colouring oxides. The article uses the factor of a commercial EPD and cites no standard. In Brazil: CPB, ABNT NBR 16697:2018, Table 2 (p. 5)."}, "portland_sem_tipo": {"pt": "Portland / OPC sem tipo declarado", "en": "Portland / OPC, type not stated", "zh": "硅酸盐水泥/OPC（未注明型号）", "pt_i": "O artigo diz que usa cimento Portland («OPC», «Portland cement», às vezes com a classe de resistência), mas não diz o tipo nem cita a norma. Não é possível atribuí-lo a uma das subfamílias acima.", "en_i": "The article says it uses Portland cement (\"OPC\", \"Portland cement\", sometimes with the strength class) but gives neither the type nor the standard. It cannot be assigned to any subfamily above."}, "nao_declarado": {"pt": "Cimento não declarado", "en": "Cement not stated", "zh": "未注明水泥", "pt_i": "O artigo não diz que cimento o betão leva: o CO₂ vem de um factor genérico de base de dados (Ecoinvent, ICE, EPD média, etc.) para o betão de uma dada classe.", "en_i": "The article does not say which cement the concrete contains: the CO₂ comes from a generic database factor (Ecoinvent, ICE, average EPD, etc.) for concrete of a given class."}};
  var CATCODE = { g: 'geopolimero', u: 'uhpc', s: 'scm', r: 'reciclado', o: 'opc', l: 'ligantes', b: 'biobase', c: 'concreto_armado' };
  var TIERCODE = { p: 'principal', s: 'sensibilidade' };

  var DATA = [[47.4,343.2,"o","p","Assunção, 2020","P",null,0,"nao_declarado",50.0,"d"],[26.91,379.4,"r","p","Chippagiri et al., 2023","P",null,0,null,50.0,"n"],[65.1,316.0,"s","p","De Schepper et al., 2014","P",250.6,0,null,100.0,"d"],[84.2,212.0,"s","p","De Schepper et al., 2014","P",146.2,0,null,100.0,"d"],[57.8,306.0,"o","p","De Schepper et al., 2014","P",339.3,0,"cem_i",100.0,"d"],[69.3,322.0,"o","p","De Schepper et al., 2014","P",358.3,0,"cem_i",100.0,"d"],[132.5,560.0,"u","p","Wagner et al., 2023","P",null,0,null,50.0,"n"],[40.0,271.9,"o","p","Borges et al., 2014","P",null,0,"cp_ii_e",50.0,"p"],[40.0,75.1,"g","p","Borges et al., 2014","N",null,0,null,50.0,"p"],[32.0,463.0,"r","p","Mello, 2018","P",null,0,null,50.0,"c"],[25.0,286.37,"o","s","Figueiredo, 2017","P",null,0,"cp_ii_z",50.0,"n"],[25.0,214.9,"o","p","Rezende, 2019","P",null,0,"nao_declarado",50.0,"d"],[35.0,352.29,"o","s","Medeiros, 2012","P",null,0,"nao_declarado",50.0,"n"],[20.0,256.88,"o","s","Medeiros, 2012","P",null,0,"nao_declarado",50.0,"n"],[25.0,501.56,"c","p","Medeiros, 2016","P",null,0,null,50.0,"d"],[25.0,224.6,"o","p","Bento, 2016","P",null,1,"cp_iii",50.0,"d"],[40.0,661.0,"c","p","Bento, 2016","P",648.6,0,null,50.0,"d"],[50.0,692.4,"c","p","Bento, 2016","P",679.0,0,null,50.0,"d"],[25.0,267.0,"o","p","Braga, 2018","P",null,0,"nao_declarado",50.0,"d"],[118.1,597.24,"o","p","Isaia, 2021","P",null,0,"cp_v_ari",100.0,"d"],[80.1,377.41,"s","p","Isaia, 2021","P",null,0,null,100.0,"d"],[56.3,325.09,"s","p","Isaia, 2021","P",null,0,null,100.0,"d"],[70.2,361.27,"s","p","Isaia, 2021","P",null,0,null,100.0,"d"],[28.0,212.83,"s","p","Isaia, 2021","P",null,0,null,4.0,"d"],[31.3,250.3,"s","p","Isaia, 2021","P",null,0,null,29.0,"d"],[25.0,265.22,"o","p","Navarro-Rubio et al., 2019","P",null,0,"nao_declarado",50.0,"d"],[29.34,379.22,"o","p","Ankur & Singh, 2024","P",null,0,"is_opc_grau",50.0,"p"],[26.03,303.06,"s","p","Ankur & Singh, 2024","P",null,0,null,50.0,"p"],[52.7,485.0,"o","p","Assunção, 2020","P",null,0,"nao_declarado",50.0,"d"],[48.4,417.6,"o","p","Assunção, 2020","P",null,0,"nao_declarado",50.0,"d"],[30.0,365.0,"o","p","Cong et al., 2024","P",364.19,0,"portland_sem_tipo",50.0,"d"],[40.0,352.31,"o","p","Cong et al., 2024","P",351.5,0,"portland_sem_tipo",50.0,"d"],[50.0,375.9,"o","p","Cong et al., 2024","P",375.09,0,"portland_sem_tipo",50.0,"d"],[30.0,478.3,"o","s","Corti & Muciaccia, 2023","P",null,0,"nao_declarado",50.0,"n"],[43.0,101.7,"l","p","Di Maria et al., 2020","N",-110.8,0,null,50.0,"n"],[43.0,71.8,"l","p","Di Maria et al., 2020","N",-140.7,0,null,50.0,"n"],[43.0,90.0,"l","p","Di Maria et al., 2020","N",-122.4,0,null,50.0,"n"],[33.9,380.0,"o","p","Habibi et al., 2024","P",null,0,"astm_type_ii",37.9,"d"],[33.4,297.0,"r","p","Habibi et al., 2024","P",null,0,null,53.7,"d"],[56.8,311.6,"o","p","Hafez et al., 2024","P",null,0,"cem_i",50.0,"d"],[65.8,386.6,"o","p","Hafez et al., 2024","P",null,0,"cem_i",50.0,"d"],[49.12,218.8,"s","p","Hafez et al., 2024","P",null,0,null,50.0,"d"],[57.9,290.7,"s","p","Hafez et al., 2024","P",null,0,null,50.0,"d"],[86.3,1100.0,"u","p","Choi et al., 2023","P",null,0,null,50.0,"p"],[90.1,1170.0,"u","p","Choi et al., 2023","P",null,0,null,50.0,"p"],[35.0,795.8,"c","p","Sahmenko et al., 2021","P",null,0,null,50.0,"n"],[46.44,96.2,"g","p","Sposito, 2024","N",null,0,null,50.0,"n"],[97.21,108.0,"g","p","Sposito, 2024","N",null,0,null,50.0,"n"],[28.0,296.2,"o","p","Guaygua et al., 2024","P",null,0,"nao_declarado",50.0,"d"],[28.0,298.1,"o","p","Guaygua et al., 2024","P",null,0,"nao_declarado",50.0,"d"],[28.0,299.7,"o","p","Guaygua et al., 2024","P",null,0,"nao_declarado",50.0,"d"],[28.0,294.8,"o","p","Guaygua et al., 2024","P",null,0,"nao_declarado",50.0,"d"],[24.0,309.0,"s","p","Kim & Tae, 2016","P",null,0,null,50.0,"p"],[29.6,342.28,"o","p","Kim et al., 2016","P",null,0,"portland_sem_tipo",50.0,"p"],[24.0,315.94,"s","p","Kim et al., 2016","P",null,0,null,50.0,"p"],[24.0,314.57,"s","p","Kim et al., 2016","P",null,0,null,50.0,"p"],[38.6,263.24,"s","p","Kim et al., 2016","P",null,0,null,50.0,"p"],[33.2,259.14,"s","p","Kim et al., 2016","P",null,0,null,50.0,"p"],[59.18,449.06,"o","s","Li et al., 2024","P",null,0,"gb_po",50.0,"p"],[56.71,325.07,"s","s","Li et al., 2024","P",null,0,null,50.0,"p"],[50.0,561.6,"o","s","Ma et al., 2021","P",null,0,"nao_declarado",100.0,"n"],[33.0,359.99,"s","p","Manan et al., 2025","P",null,0,null,50.0,"p"],[21.0,367.0,"o","p","Archila et al., 2018","P",null,0,"nao_declarado",50.0,"n"],[21.0,345.0,"o","p","Archila et al., 2018","P",null,0,"nao_declarado",50.0,"n"],[40.0,770.9,"c","p","Martinez-Munoz et al., 2021","P",770.9,1,null,100.0,"n"],[40.0,792.3,"c","p","Martinez-Munoz et al., 2021","P",792.3,1,null,100.0,"n"],[40.0,749.8,"c","p","Martinez-Munoz et al., 2021","P",749.8,1,null,100.0,"n"],[60.0,351.76,"o","p","Menegatti et al., 2022","P",null,0,"cem_i",50.0,"d"],[60.0,352.43,"r","p","Menegatti et al., 2022","P",333.45,0,null,50.0,"d"],[26.1,807.0,"o","p","Mir et al., 2022","P",null,0,"portland_sem_tipo",50.0,"p"],[30.0,1800.98,"g","p","Mir et al., 2022","N",null,0,null,50.0,"p"],[56.5,1631.9,"g","p","Mir et al., 2022","N",null,0,null,50.0,"p"],[52.3,1811.14,"g","p","Mir et al., 2022","N",null,0,null,50.0,"p"],[124.1,410.0,"u","s","Nassar et al., 2025","P",null,0,null,50.0,"p"],[121.3,399.0,"r","s","Nassar et al., 2025","P",null,0,null,50.0,"p"],[98.2,362.0,"r","s","Nassar et al., 2025","P",null,0,null,50.0,"p"],[123.4,414.0,"r","s","Nassar et al., 2025","P",null,0,null,50.0,"p"],[115.2,387.0,"r","s","Nassar et al., 2025","P",null,0,null,50.0,"p"],[48.41,574.03,"o","p","Onn et al., 2019","P",null,0,"astm_type_i",50.0,"p"],[35.61,209.0,"s","p","Onn et al., 2019","P",null,0,null,50.0,"p"],[38.29,573.21,"o","p","Onn et al., 2019","P",null,0,"astm_type_i",50.0,"p"],[26.05,207.0,"s","p","Onn et al., 2019","P",null,0,null,50.0,"p"],[25.0,420.0,"o","s","Paik et al., 2019","P",null,0,"nao_declarado",50.0,"n"],[25.0,420.0,"o","s","Paik et al., 2019","P",null,0,"nao_declarado",50.0,"n"],[24.0,420.0,"o","s","Paik & Na, 2019","P",null,0,"nao_declarado",50.0,"c"],[24.0,420.0,"o","s","Paik & Na, 2019","P",null,0,"nao_declarado",50.0,"c"],[24.0,432.0,"o","s","Paik & Na, 2019","P",null,0,"nao_declarado",30.0,"c"],[24.0,429.4,"o","s","Paik & Na, 2019","P",null,0,"nao_declarado",30.0,"c"],[24.0,427.0,"o","s","Paik & Na, 2019","P",null,0,"nao_declarado",30.0,"c"],[49.5,352.65,"o","p","Pavlu et al., 2019","P",null,0,"cem_i",50.0,"n"],[25.0,477.4,"o","p","Pedroso et al., 2024","P",null,0,"nao_declarado",50.0,"n"],[25.0,483.1,"o","p","Pedroso et al., 2024","P",null,0,"nao_declarado",50.0,"n"],[20.0,672.0,"c","p","Pujadas-Gispert et al., 2021","P",null,0,null,50.0,"d"],[35.0,494.0,"o","p","Sanchez-Pantoja et al., 2023","P",null,0,"cem_i",50.0,"p"],[40.0,248.95,"c","p","Sandagomika et al., 2024","P",null,0,null,50.0,"n"],[25.0,391.3,"o","p","Sbahieh et al., 2023","P",null,0,"portland_sem_tipo",50.0,"p"],[58.1,518.0,"s","p","Soltanzadeh et al., 2022","P",null,0,null,50.0,"p"],[55.54,491.0,"r","p","Soltanzadeh et al., 2022","P",null,0,null,50.0,"p"],[55.12,482.0,"r","p","Soltanzadeh et al., 2022","P",null,0,null,50.0,"p"],[52.03,466.0,"r","p","Soltanzadeh et al., 2022","P",null,0,null,50.0,"p"],[20.0,239.4,"o","p","Sombrio, 2015","P",null,0,"nao_declarado",50.0,"n"],[71.07,452.0,"r","s","Starczyk-Kolbyk, 2024","P",null,0,null,50.0,"n"],[71.9,318.0,"o","p","Teply et al., 2018","P",null,0,"cem_i",125.0,"d"],[47.2,312.0,"s","p","Teply et al., 2018","P",null,0,null,73.0,"d"],[70.5,344.0,"s","p","Teply et al., 2018","P",null,0,null,151.0,"d"],[150.0,700.0,"u","s","Rai & Wille, 2025","P",null,0,null,376.0,"d"],[150.0,743.0,"u","s","Rai & Wille, 2025","P",null,0,null,383.0,"d"],[150.0,610.0,"u","s","Rai & Wille, 2025","P",null,0,null,147.0,"d"],[30.0,246.0,"o","s","Simões et al., 2021","P",null,0,"portland_sem_tipo",50.0,"n"],[30.0,244.0,"r","s","Simões et al., 2021","P",null,0,null,50.0,"n"],[56.0,302.8,"s","p","Rathnarajan et al., 2025","P",null,0,null,50.0,"p"],[25.0,269.0,"o","s","Zhang et al., 2018","P",null,0,"cem_i",50.0,"n"],[35.0,306.0,"o","s","Zhang et al., 2018","P",null,0,"cem_i",50.0,"n"],[45.0,344.0,"o","s","Zhang et al., 2018","P",null,0,"cem_i",50.0,"n"],[80.0,284.0,"s","s","Zhang et al., 2018","P",null,0,null,50.0,"n"],[90.0,317.0,"s","s","Zhang et al., 2018","P",null,0,null,50.0,"n"],[100.0,350.0,"s","s","Zhang et al., 2018","P",null,0,null,50.0,"n"],[160.0,482.0,"u","s","Zhang et al., 2018","P",null,0,null,50.0,"n"],[170.0,511.0,"u","s","Zhang et al., 2018","P",null,0,null,50.0,"n"],[180.0,539.0,"u","s","Zhang et al., 2018","P",null,0,null,50.0,"n"],[54.82,460.1,"s","p","Cunningham et al., 2025","P",459.5,0,null,50.0,"p"],[53.9,569.0,"o","p","Celik et al., 2015","P",null,0,"astm_type_i_ii",50.0,"p"],[43.2,487.0,"s","p","Celik et al., 2015","P",null,0,null,50.0,"p"],[33.6,434.0,"s","p","Celik et al., 2015","P",null,0,null,50.0,"p"],[51.0,412.0,"s","p","Celik et al., 2015","P",null,0,null,50.0,"p"],[41.6,311.0,"s","p","Celik et al., 2015","P",null,0,null,50.0,"p"],[37.5,333.0,"s","p","Celik et al., 2015","P",null,0,null,50.0,"p"],[33.9,282.0,"s","p","Celik et al., 2015","P",null,0,null,50.0,"p"],[26.0,232.0,"s","p","Celik et al., 2015","P",null,0,null,50.0,"p"],[20.6,183.0,"s","p","Celik et al., 2015","P",null,0,null,50.0,"p"],[36.3,332.0,"s","p","Celik et al., 2015","P",null,0,null,50.0,"p"],[31.5,281.0,"s","p","Celik et al., 2015","P",null,0,null,50.0,"p"],[28.9,231.0,"s","p","Celik et al., 2015","P",null,0,null,50.0,"p"],[20.6,182.0,"s","p","Celik et al., 2015","P",null,0,null,50.0,"p"],[31.7,242.0,"s","p","Jin et al., 2025","P",null,0,null,50.0,"p"],[34.0,267.0,"s","p","Jin et al., 2025","P",null,0,null,50.0,"p"],[34.5,276.0,"s","p","Jin et al., 2025","P",null,0,null,50.0,"p"],[37.2,279.0,"s","p","Jin et al., 2025","P",null,0,null,50.0,"p"],[38.4,298.0,"s","p","Jin et al., 2025","P",null,0,null,50.0,"p"],[43.5,283.0,"s","p","Jin et al., 2025","P",null,0,null,50.0,"p"],[46.2,300.0,"s","p","Jin et al., 2025","P",null,0,null,50.0,"p"],[46.3,303.0,"s","p","Jin et al., 2025","P",null,0,null,50.0,"p"],[42.1,261.0,"s","p","Jin et al., 2025","P",null,0,null,50.0,"p"],[40.0,270.0,"s","p","Jin et al., 2025","P",null,0,null,50.0,"p"],[40.0,280.0,"s","p","Jin et al., 2025","P",null,0,null,50.0,"p"],[40.2,286.0,"s","p","Jin et al., 2025","P",null,0,null,50.0,"p"],[32.4,399.8,"o","p","Cordoba et al., 2023","P",null,0,"cem_i",50.0,"p"],[37.4,350.2,"s","p","Cordoba et al., 2023","P",null,0,null,50.0,"p"],[28.3,355.8,"s","p","Cordoba et al., 2023","P",null,0,null,50.0,"p"],[47.1,378.6,"s","p","Cordoba et al., 2023","P",null,0,null,50.0,"p"],[38.5,322.0,"s","p","Cordoba et al., 2023","P",null,0,null,50.0,"p"],[28.0,279.5,"s","p","Cordoba et al., 2023","P",null,0,null,50.0,"p"],[45.0,380.6,"s","p","Cordoba et al., 2023","P",null,0,null,50.0,"p"],[35.4,323.5,"s","p","Cordoba et al., 2023","P",null,0,null,50.0,"p"],[23.1,280.7,"s","p","Cordoba et al., 2023","P",null,0,null,50.0,"p"],[32.8,322.6,"s","p","Cordoba et al., 2023","P",null,0,null,50.0,"p"],[32.6,341.7,"s","p","Cordoba et al., 2023","P",null,0,null,50.0,"p"],[34.1,350.5,"s","p","Cordoba et al., 2023","P",null,0,null,50.0,"p"],[40.0,395.0,"o","s","Alsalman et al., 2021","P",null,0,"astm_type_i",50.0,"p"],[40.0,108.0,"g","s","Alsalman et al., 2021","N",null,0,null,50.0,"p"],[65.0,435.0,"s","s","Alsalman et al., 2021","P",null,0,null,50.0,"p"],[58.5,259.0,"g","s","Alsalman et al., 2021","N",null,0,null,50.0,"p"],[105.0,247.0,"s","s","Alsalman et al., 2021","P",null,0,null,50.0,"p"],[106.0,174.0,"g","s","Alsalman et al., 2021","N",null,0,null,50.0,"p"],[102.0,313.0,"g","s","Alsalman et al., 2021","N",null,0,null,50.0,"p"],[94.4,326.0,"g","p","Grengg et al., 2024","N",null,0,null,50.0,"p"],[35.9,215.4,"l","p","Abu-Ennab et al., 2022","N",null,0,null,50.0,"n"],[30.12,307.74,"r","p","Sharma & Singh, 2023","P",null,0,null,50.0,"p"],[51.0,273.81,"s","p","Thorne et al., 2024","P",null,0,null,50.0,"p"],[33.6,287.9,"s","p","Thorne et al., 2024","P",null,0,null,50.0,"p"],[53.9,498.87,"o","p","Thorne et al., 2024","P",null,0,"cem_i",50.0,"p"],[38.72,1200.0,"o","p","Du et al., 2024","P",null,0,"cem_i",50.0,"p"],[21.1,603.44,"r","p","Du et al., 2024","P",null,0,null,50.0,"p"],[32.0,770.9,"c","p","Villalba et al., 2024","P",null,0,null,50.0,"d"],[32.0,798.5,"c","p","Villalba et al., 2024","P",null,0,null,50.0,"d"],[27.9,184.8,"g","s","Narayanaswamy et al., 2020","N",null,0,null,50.0,"n"],[22.0,488.0,"g","p","Khan et al., 2023","N",null,0,null,50.0,"n"],[24.9,595.6,"o","p","Khan et al., 2023","P",null,0,"cem_ii",50.0,"n"],[20.0,328.0,"o","s","Luca et al., 2023","P",null,0,"portland_sem_tipo",50.0,"p"],[25.0,265.22,"o","p","Galan-Marin et al., 2015","P",null,0,"nao_declarado",50.0,"c"],[69.0,345.0,"o","p","Nath et al., 2018","P",null,0,"as_gp",18.0,"d"],[73.0,269.0,"s","p","Nath et al., 2018","P",null,0,null,29.0,"d"],[66.0,269.0,"s","p","Nath et al., 2018","P",null,0,null,29.0,"d"],[45.0,694.0,"o","p","Souto-Martinez et al., 2018","P",563.9,0,"branco",25.0,"d"],[25.0,475.2,"c","s","Moncaster et al., 2018","P",null,0,null,50.0,"n"],[40.0,432.0,"o","s","Moncaster et al., 2018","P",null,0,"nao_declarado",50.0,"n"],[31.0,585.5,"c","p","Amiri et al., 2021","P",null,0,null,50.0,"c"],[27.0,258.58,"o","p","Oh et al., 2023","P",null,0,"nao_declarado",50.0,"d"],[35.0,382.4,"o","p","Zhao et al., 2021","P",null,0,"portland_sem_tipo",100.0,"d"],[40.0,334.9,"o","p","Zhao et al., 2021","P",null,0,"portland_sem_tipo",100.0,"d"],[47.61,359.1,"o","p","Dadd et al., 2025","P",null,0,"as_gp",50.0,"p"],[34.7,314.1,"s","p","Smith & Durham, 2016","P",null,0,null,50.0,"n"],[38.3,296.1,"s","p","Smith & Durham, 2016","P",null,0,null,50.0,"n"],[36.5,278.0,"s","p","Smith & Durham, 2016","P",null,0,null,50.0,"n"],[31.7,241.8,"s","p","Smith & Durham, 2016","P",null,0,null,50.0,"n"],[32.9,413.83,"o","p","Di Sarno et al., 2024","P",null,0,"cem_i",50.0,"p"],[31.8,413.83,"o","p","Di Sarno et al., 2024","P",348.09,0,"cem_i",50.0,"p"],[33.0,175.0,"l","p","Grist et al., 2015","N",null,0,null,50.0,"p"],[33.0,135.0,"l","p","Grist et al., 2015","N",null,0,null,50.0,"p"],[33.0,95.0,"l","p","Grist et al., 2015","N",null,0,null,50.0,"p"],[33.0,265.0,"o","p","Grist et al., 2015","P",null,0,"cem_i",50.0,"p"],[33.0,160.0,"s","p","Grist et al., 2015","P",null,0,null,50.0,"p"],[49.0,195.0,"l","p","Grist et al., 2015","N",null,0,null,50.0,"p"],[49.0,345.0,"o","p","Grist et al., 2015","P",null,0,"cem_i",50.0,"p"],[49.0,235.0,"s","p","Grist et al., 2015","P",null,0,null,50.0,"p"],[40.5,260.4,"o","p","Marinkovic et al., 2017","P",null,0,"cem_ii_a",50.0,"d"],[42.0,197.1,"s","p","Marinkovic et al., 2017","P",null,0,null,50.0,"d"],[40.7,134.2,"g","p","Marinkovic et al., 2017","N",null,0,null,50.0,"d"],[42.1,266.3,"r","p","Marinkovic et al., 2017","P",null,0,null,50.0,"d"],[40.5,196.5,"r","p","Marinkovic et al., 2017","P",null,0,null,50.0,"d"],[50.0,345.0,"g","p","Teh et al., 2017","N",null,0,null,50.0,"p"],[50.0,291.0,"g","p","Teh et al., 2017","N",null,0,null,50.0,"p"],[50.0,508.9,"o","p","Teh et al., 2017","P",null,0,"portland_sem_tipo",50.0,"p"],[35.0,432.0,"o","p","Gutierreza et al., 2017","P",null,0,"astm_c150",36.4,"d"],[35.0,408.0,"o","p","Gutierreza et al., 2017","P",null,0,"nc_cuba",64.9,"d"],[25.0,301.0,"o","p","Gutierreza et al., 2017","P",null,0,"nc_cuba",100.0,"d"],[21.0,257.0,"o","p","DeRousseau et al., 2020","P",174.8,0,"portland_sem_tipo",50.0,"p"],[21.0,220.0,"s","p","DeRousseau et al., 2020","P",144.8,0,null,50.0,"p"],[32.0,651.2,"o","p","Abdulkareem et al., 2021","P",null,0,"nao_declarado",40.0,"d"],[25.0,370.0,"o","p","Haigh et al., 2024","P",null,0,"as_gp",50.0,"n"],[20.0,360.0,"r","p","Haigh et al., 2024","P",null,0,null,50.0,"n"],[21.0,343.0,"r","p","Haigh et al., 2024","P",null,0,null,50.0,"n"],[25.93,234.0,"s","s","Momotaz et al., 2023","P",null,0,null,40.0,"c"],[27.85,276.1,"r","s","Momotaz et al., 2023","P",238.0,0,null,40.0,"c"],[25.23,317.8,"r","s","Momotaz et al., 2023","P",244.0,0,null,40.0,"c"],[27.68,347.7,"r","s","Momotaz et al., 2023","P",236.0,0,null,40.0,"c"],[27.33,377.5,"r","s","Momotaz et al., 2023","P",228.0,0,null,40.0,"c"],[26.55,222.4,"r","s","Momotaz et al., 2023","P",65.7,0,null,40.0,"c"],[28.15,275.1,"r","s","Momotaz et al., 2023","P",88.3,0,null,40.0,"c"],[28.51,324.0,"r","s","Momotaz et al., 2023","P",109.0,0,null,40.0,"c"],[27.72,354.9,"r","s","Momotaz et al., 2023","P",110.0,0,null,40.0,"c"],[28.12,385.8,"r","s","Momotaz et al., 2023","P",111.0,0,null,40.0,"c"],[38.7,475.0,"o","p","Bayat et al., 2024","P",null,0,"cem_i",100.0,"d"],[38.1,457.0,"s","p","Bayat et al., 2024","P",null,0,null,100.0,"d"],[37.8,439.0,"s","p","Bayat et al., 2024","P",null,0,null,100.0,"d"],[36.4,422.0,"s","p","Bayat et al., 2024","P",null,0,null,100.0,"d"],[37.6,407.0,"s","p","Bayat et al., 2024","P",null,0,null,100.0,"d"],[37.5,371.0,"s","p","Bayat et al., 2024","P",null,0,null,100.0,"d"],[31.1,337.0,"s","p","Bayat et al., 2024","P",null,0,null,100.0,"d"],[36.0,370.0,"s","p","Bayat et al., 2024","P",null,0,null,100.0,"d"],[32.8,335.0,"s","p","Bayat et al., 2024","P",null,0,null,100.0,"d"],[30.6,300.0,"s","p","Bayat et al., 2024","P",null,0,null,100.0,"d"],[62.45,611.86,"o","s","Celikten & Baran, 2024","P",null,0,"cem_i",50.0,"p"],[62.95,582.59,"s","s","Celikten & Baran, 2024","P",null,0,null,50.0,"p"],[63.55,553.32,"s","s","Celikten & Baran, 2024","P",null,0,null,50.0,"p"],[68.65,524.04,"s","s","Celikten & Baran, 2024","P",null,0,null,50.0,"p"],[59.8,494.77,"s","s","Celikten & Baran, 2024","P",null,0,null,50.0,"p"],[57.85,465.5,"s","s","Celikten & Baran, 2024","P",null,0,null,50.0,"p"],[20.0,113.3,"s","s","Hafez et al., 2023","P",null,0,null,50.0,"p"],[30.0,132.6,"s","s","Hafez et al., 2023","P",null,0,null,50.0,"p"],[40.0,137.3,"s","s","Hafez et al., 2023","P",null,0,null,50.0,"p"],[50.0,155.2,"s","s","Hafez et al., 2023","P",null,0,null,50.0,"p"],[60.0,163.0,"s","s","Hafez et al., 2023","P",null,0,null,50.0,"p"],[70.0,173.6,"s","s","Hafez et al., 2023","P",null,0,null,50.0,"p"],[80.0,201.4,"s","s","Hafez et al., 2023","P",null,0,null,50.0,"p"],[143.0,709.9,"u","p","Joachim & Oettel, 2024","P",null,0,null,50.0,"p"],[133.6,914.72,"u","p","Joachim & Oettel, 2024","P",null,0,null,50.0,"p"],[114.4,713.7,"u","p","Joachim & Oettel, 2024","P",null,0,null,50.0,"p"],[106.4,716.65,"u","p","Joachim & Oettel, 2024","P",null,0,null,50.0,"p"],[105.2,715.48,"u","p","Joachim & Oettel, 2024","P",null,0,null,50.0,"p"],[36.08,365.87,"o","s","Raveendran & Krishnan, 2025","P",null,0,"is_opc_grau",50.0,"p"],[41.0,366.14,"s","s","Raveendran & Krishnan, 2025","P",null,0,null,50.0,"p"],[43.28,366.4,"s","s","Raveendran & Krishnan, 2025","P",null,0,null,50.0,"p"],[40.0,366.67,"s","s","Raveendran & Krishnan, 2025","P",null,0,null,50.0,"p"],[38.5,356.35,"s","s","Raveendran & Krishnan, 2025","P",null,0,null,50.0,"p"],[41.02,340.41,"s","s","Raveendran & Krishnan, 2025","P",null,0,null,50.0,"p"],[33.64,330.0,"s","s","Raveendran & Krishnan, 2025","P",null,0,null,50.0,"p"],[49.02,341.11,"s","s","Raveendran & Krishnan, 2025","P",null,0,null,50.0,"p"],[20.0,228.76,"o","s","Xu et al., 2024","P",null,0,"nao_declarado",25.0,"d"],[25.0,250.76,"o","s","Xu et al., 2024","P",null,0,"nao_declarado",25.0,"d"],[30.0,280.03,"o","s","Xu et al., 2024","P",null,0,"nao_declarado",25.0,"d"],[40.0,280.07,"o","s","Xu et al., 2024","P",null,0,"nao_declarado",25.0,"d"],[50.0,371.66,"o","s","Xu et al., 2024","P",null,0,"nao_declarado",25.0,"d"],[35.0,405.8,"r","p","Yu et al., 2024","P",null,0,null,50.0,"n"],[35.1,412.4,"r","p","Yu et al., 2024","P",null,0,null,50.0,"n"],[35.0,411.6,"r","p","Yu et al., 2024","P",null,0,null,50.0,"n"],[35.0,411.4,"r","p","Yu et al., 2024","P",null,0,null,50.0,"n"],[35.0,411.6,"r","p","Yu et al., 2024","P",null,0,null,50.0,"n"],[35.0,402.1,"s","p","Yu et al., 2024","P",null,0,null,50.0,"n"],[35.1,395.1,"s","p","Yu et al., 2024","P",null,0,null,50.0,"n"],[35.1,390.3,"s","p","Yu et al., 2024","P",null,0,null,50.0,"n"],[35.0,385.4,"s","p","Yu et al., 2024","P",null,0,null,50.0,"n"],[41.51,273.38,"s","s","Badgujar, 2023","P",null,0,null,50.0,"p"],[39.24,272.42,"r","s","Badgujar, 2023","P",271.45,0,null,50.0,"p"],[41.36,271.93,"r","s","Badgujar, 2023","P",270.48,0,null,50.0,"p"],[43.29,271.45,"r","s","Badgujar, 2023","P",269.51,0,null,50.0,"p"],[40.86,270.96,"r","s","Badgujar, 2023","P",268.54,0,null,50.0,"p"],[38.29,270.48,"r","s","Badgujar, 2023","P",267.57,0,null,50.0,"p"],[20.0,369.0,"o","p","Rondinel-Oviedo, 2024","P",369.0,1,"portland_sem_tipo",100.0,"d"],[35.0,466.4,"c","p","Horakova et al., 2019","P",null,0,null,46.8,"d"],[90.0,656.3,"c","p","Horakova et al., 2019","P",null,0,null,380.6,"d"],[90.0,594.2,"c","p","Horakova et al., 2019","P",null,0,null,380.4,"d"],[36.6,280.1,"o","p","Pesta et al., 2019","P",null,0,"cem_i",50.0,"n"],[25.4,271.1,"r","p","Pesta et al., 2019","P",null,0,null,50.0,"n"],[29.3,278.5,"r","p","Pesta et al., 2019","P",null,0,null,50.0,"n"],[37.8,254.2,"s","p","Pesta et al., 2019","P",null,0,null,50.0,"n"],[35.0,263.9,"r","p","Pesta et al., 2019","P",null,0,null,50.0,"n"],[32.2,304.4,"r","p","Pesta et al., 2019","P",null,0,null,50.0,"n"],[20.0,239.19,"o","p","Lu et al., 2019","P",null,0,"nao_declarado",50.0,"d"],[30.0,346.95,"o","p","Lu et al., 2019","P",null,0,"nao_declarado",50.0,"d"],[20.3,221.0,"o","p","Coral et al., 2025","P",null,0,"nao_declarado",50.0,"n"],[61.1,432.0,"o","p","Tian et al., 2024","P",null,0,"gb_po",50.0,"p"],[65.4,392.0,"s","p","Tian et al., 2024","P",null,0,null,50.0,"p"],[64.7,364.2,"o","p","Radovic et al., 2022","P",null,0,"cem_i",50.0,"d"],[25.0,463.1,"o","p","Salandin et al., 2022","P",null,0,"portland_sem_tipo",50.0,"n"],[27.6,313.72,"o","p","Acosta-Calderon et al., 2022","P",null,0,"astm_c1157",50.0,"p"],[29.3,313.74,"o","p","Acosta-Calderon et al., 2022","P",null,0,"astm_c1157",50.0,"p"],[27.2,315.08,"o","p","Acosta-Calderon et al., 2022","P",null,0,"astm_c1157",50.0,"p"],[30.0,295.0,"o","p","Wang et al., 2020","P",null,0,"nao_declarado",50.0,"d"],[140.0,600.0,"u","s","Eltantawi et al., 2024","P",null,0,null,50.0,"p"],[132.7,360.0,"g","s","Eltantawi et al., 2024","N",null,0,null,50.0,"p"],[43.2,274.0,"o","p","Pushkar et al., 2022","P",null,0,"portland_sem_tipo",50.0,"c"],[39.11,350.0,"g","s","Kanagaraj et al., 2022","N",null,0,null,50.0,"p"],[20.0,255.0,"o","p","Abouhamad & Abu-Hamd, 2021","P",null,0,"nao_declarado",50.0,"d"],[30.0,335.0,"o","p","Abouhamad & Abu-Hamd, 2021","P",null,0,"nao_declarado",50.0,"d"],[46.48,695.3,"s","s","Zhu et al., 2023","P",null,0,null,50.0,"p"],[43.86,694.6,"r","s","Zhu et al., 2023","P",null,0,null,50.0,"p"],[36.22,693.3,"r","s","Zhu et al., 2023","P",null,0,null,50.0,"p"],[30.48,693.2,"r","s","Zhu et al., 2023","P",null,0,null,50.0,"p"],[25.87,691.8,"r","s","Zhu et al., 2023","P",null,0,null,50.0,"p"],[25.0,231.4,"s","s","Momotaz et al., 2022","P",null,0,null,40.0,"c"],[25.0,222.4,"r","s","Momotaz et al., 2022","P",65.0,0,null,40.0,"c"],[25.0,377.5,"r","s","Momotaz et al., 2022","P",225.6,0,null,40.0,"c"],[25.0,385.8,"r","s","Momotaz et al., 2022","P",109.8,0,null,40.0,"c"],[25.0,199.92,"o","p","Huber et al., 2024","P",null,0,"nao_declarado",100.0,"d"],[30.0,219.12,"o","p","Huber et al., 2024","P",null,0,"nao_declarado",100.0,"d"],[30.0,321.3,"o","s","Zheng et al., 2023","P",null,0,"nao_declarado",50.0,"n"],[20.0,383.4,"c","p","Aryan et al., 2024","P",375.6,0,null,20.0,"d"],[52.1,3060.0,"l","p","Sinka et al., 2020","N",null,0,null,50.0,"p"],[75.2,1550.0,"l","p","Sinka et al., 2020","N",null,0,null,50.0,"p"],[88.6,1030.0,"l","p","Sinka et al., 2020","N",null,0,null,50.0,"p"],[30.0,138.24,"b","s","Ascione et al., 2024","N",-113.28,0,null,50.0,"n"],[42.25,437.0,"o","p","Islam et al., 2024","P",null,0,"astm_type_i",50.0,"p"],[33.8,366.0,"r","p","Islam et al., 2024","P",null,0,null,50.0,"p"],[48.25,419.0,"r","p","Islam et al., 2024","P",null,0,null,50.0,"p"],[20.0,247.69,"o","p","Huang et al., 2016","P",null,0,"nao_declarado",50.0,"n"],[25.0,267.69,"o","p","Huang et al., 2016","P",null,0,"nao_declarado",50.0,"n"],[30.0,287.69,"o","p","Huang et al., 2016","P",null,0,"nao_declarado",50.0,"n"],[35.0,307.69,"o","p","Huang et al., 2016","P",null,0,"nao_declarado",50.0,"n"],[40.0,327.69,"o","p","Huang et al., 2016","P",null,0,"nao_declarado",50.0,"n"],[50.0,367.69,"o","p","Huang et al., 2016","P",null,0,"nao_declarado",50.0,"n"],[80.0,685.7,"o","p","Bumanis et al., 2022","P",684.6,0,"cem_i",50.0,"p"],[25.0,525.0,"c","p","Dervishaj et al., 2024","P",505.3,0,null,50.0,"d"],[25.0,525.8,"c","p","Dervishaj et al., 2024","P",506.6,0,null,50.0,"d"],[32.0,420.0,"o","p","D'Orazio et al., 2023","P",null,0,"cem_ii_a",50.0,"n"],[32.0,418.0,"r","p","D'Orazio et al., 2023","P",310.0,0,null,50.0,"n"],[25.0,420.0,"o","p","D'Orazio et al., 2023","P",null,0,"cem_ii_a",50.0,"n"],[25.0,420.2,"r","p","D'Orazio et al., 2023","P",385.0,0,null,50.0,"n"],[58.0,791.67,"c","p","Haverkamp et al., 2025","P",791.67,1,null,100.0,"d"],[67.4,285.0,"o","p","Inman et al., 2017","P",null,0,"nao_declarado",60.0,"d"],[60.4,284.6,"o","p","Inman et al., 2017","P",null,0,"nao_declarado",60.0,"d"],[61.7,284.6,"o","p","Inman et al., 2017","P",null,0,"nao_declarado",60.0,"d"],[57.1,284.6,"o","p","Inman et al., 2017","P",null,0,"nao_declarado",60.0,"d"],[31.4,281.9,"o","p","Inman et al., 2017","P",null,0,"nao_declarado",60.0,"d"],[21.0,409.0,"o","s","Jang et al., 2022","P",null,0,"nao_declarado",50.0,"n"],[21.0,419.0,"o","s","Jang et al., 2022","P",null,0,"nao_declarado",50.0,"n"],[24.0,414.0,"o","s","Jang et al., 2022","P",null,0,"nao_declarado",50.0,"n"],[24.0,429.0,"o","s","Jang et al., 2022","P",null,0,"nao_declarado",50.0,"n"],[30.0,230.0,"o","p","Jayasinghe et al., 2021","P",null,0,"nao_declarado",50.0,"n"],[32.0,240.0,"o","p","Jayasinghe et al., 2021","P",null,0,"nao_declarado",50.0,"n"],[24.0,299.0,"s","p","Kim & Chae, 2016","P",null,0,null,50.0,"p"],[24.0,331.0,"o","p","Kim & Chae, 2016","P",null,0,"portland_sem_tipo",50.0,"p"],[24.0,300.0,"s","p","Kim & Chae, 2016","P",null,0,null,50.0,"p"],[24.0,269.0,"s","p","Kim & Chae, 2016","P",null,0,null,50.0,"p"],[24.0,239.0,"s","p","Kim & Chae, 2016","P",null,0,null,50.0,"p"],[24.0,340.9,"s","p","Kim et al., 2016","P",null,0,null,50.0,"p"],[24.0,225.7,"s","p","Kim et al., 2016","P",null,0,null,50.0,"p"],[30.0,134.59,"s","p","Kim et al., 2016","P",null,0,null,50.0,"n"],[30.0,247.83,"s","p","Kim et al., 2016","P",null,0,null,50.0,"n"],[45.5,178.7,"g","p","Kul et al., 2023","N",null,0,null,50.0,"n"],[66.2,251.4,"g","p","Kul et al., 2023","N",null,0,null,50.0,"n"],[61.9,302.8,"g","p","Kul et al., 2023","N",null,0,null,50.0,"n"],[51.1,258.9,"g","p","Li et al., 2024","N",null,0,null,50.0,"p"],[51.1,469.3,"o","p","Li et al., 2024","P",null,0,"cem_i",50.0,"p"],[36.21,362.02,"o","s","Li et al., 2024","P",null,0,"gb_po",50.0,"p"],[33.42,361.71,"r","s","Li et al., 2024","P",null,0,null,50.0,"p"],[26.81,361.39,"r","s","Li et al., 2024","P",null,0,null,50.0,"p"],[25.54,360.88,"r","s","Li et al., 2024","P",null,0,null,50.0,"p"],[23.51,360.51,"r","s","Li et al., 2024","P",null,0,null,50.0,"p"],[40.56,362.79,"o","s","Li et al., 2024","P",null,0,"gb_po",50.0,"p"],[37.43,362.48,"r","s","Li et al., 2024","P",null,0,null,50.0,"p"],[29.2,362.16,"r","s","Li et al., 2024","P",null,0,null,50.0,"p"],[27.61,361.65,"r","s","Li et al., 2024","P",null,0,null,50.0,"p"],[26.12,361.28,"r","s","Li et al., 2024","P",null,0,null,50.0,"p"],[42.22,363.17,"o","s","Li et al., 2024","P",null,0,"gb_po",50.0,"p"],[39.23,362.86,"r","s","Li et al., 2024","P",null,0,null,50.0,"p"],[30.28,362.55,"r","s","Li et al., 2024","P",null,0,null,50.0,"p"],[28.21,362.04,"r","s","Li et al., 2024","P",null,0,null,50.0,"p"],[26.92,361.66,"r","s","Li et al., 2024","P",null,0,null,50.0,"p"],[20.0,208.98,"o","p","Li et al., 2024","P",null,0,"nao_declarado",50.0,"n"],[25.0,247.46,"o","p","Li et al., 2024","P",null,0,"nao_declarado",50.0,"n"],[30.0,277.82,"o","p","Li et al., 2024","P",null,0,"nao_declarado",50.0,"n"],[35.0,314.77,"o","p","Li et al., 2024","P",null,0,"nao_declarado",50.0,"n"],[40.0,348.04,"o","p","Li et al., 2024","P",null,0,"nao_declarado",50.0,"n"],[45.0,390.16,"o","p","Li et al., 2024","P",null,0,"nao_declarado",50.0,"n"],[30.0,270.88,"o","p","Matias de Paula Filho et al., 2024","P",null,0,"nao_declarado",50.0,"d"],[40.0,355.83,"o","p","Matias de Paula Filho et al., 2024","P",null,0,"nao_declarado",50.0,"d"],[50.0,429.0,"o","p","Matias de Paula Filho et al., 2024","P",null,0,"nao_declarado",50.0,"d"],[25.0,521.5,"c","p","Pons et al., 2018","P",521.5,1,null,50.0,"d"],[25.0,213.7,"o","p","Pons et al., 2018","P",213.7,1,"nao_declarado",50.0,"d"],[25.0,134.9,"r","p","Sameer et al., 2020","P",null,0,null,50.0,"n"],[32.0,339.0,"o","p","Tait & Cheung, 2016","P",null,0,"cem_i",50.0,"c"],[32.0,227.0,"s","p","Tait & Cheung, 2016","P",null,0,null,50.0,"c"],[32.0,127.0,"s","p","Tait & Cheung, 2016","P",null,0,null,50.0,"c"],[45.0,528.38,"c","p","Zhang et al., 2023","P",468.22,0,null,60.0,"d"],[25.0,524.7,"o","p","Zhang et al., 2023","P",null,0,"portland_sem_tipo",100.0,"n"],[30.0,747.8,"c","s","Zhang & Zhang, 2023","P",null,0,null,50.0,"n"],[38.35,488.0,"o","p","Zheng et al., 2025","P",null,0,"portland_sem_tipo",100.0,"c"],[36.91,486.0,"r","p","Zheng et al., 2025","P",null,0,null,100.0,"c"],[33.0,485.0,"r","p","Zheng et al., 2025","P",null,0,null,100.0,"c"],[31.75,483.0,"r","p","Zheng et al., 2025","P",null,0,null,100.0,"c"],[32.13,473.0,"r","p","Zheng et al., 2025","P",null,0,null,100.0,"c"],[28.11,471.0,"r","p","Zheng et al., 2025","P",null,0,null,100.0,"c"],[26.95,470.0,"r","p","Zheng et al., 2025","P",null,0,null,100.0,"c"],[26.72,467.0,"r","p","Zheng et al., 2025","P",null,0,null,100.0,"c"],[26.04,468.0,"r","p","Zheng et al., 2025","P",null,0,null,100.0,"c"],[25.22,466.0,"r","p","Zheng et al., 2025","P",null,0,null,100.0,"c"],[25.37,465.0,"r","p","Zheng et al., 2025","P",null,0,null,100.0,"c"],[22.15,462.0,"r","p","Zheng et al., 2025","P",null,0,null,100.0,"c"],[52.0,314.0,"g","p","Almeida, 2024","N",null,0,null,50.0,"p"],[52.0,161.0,"g","p","Almeida, 2024","N",null,0,null,50.0,"p"],[52.0,281.0,"g","p","Almeida, 2024","N",null,0,null,50.0,"p"],[52.0,202.0,"g","p","Almeida, 2024","N",null,0,null,50.0,"p"],[52.0,317.0,"g","p","Almeida, 2024","N",null,0,null,50.0,"p"],[58.0,252.0,"g","p","Almeida, 2024","N",null,0,null,50.0,"p"],[58.0,232.0,"g","p","Almeida, 2024","N",null,0,null,50.0,"p"],[58.0,283.0,"g","p","Almeida, 2024","N",null,0,null,50.0,"p"],[58.0,235.0,"g","p","Almeida, 2024","N",null,0,null,50.0,"p"],[58.0,370.0,"g","p","Almeida, 2024","N",null,0,null,50.0,"p"],[50.0,133.0,"g","p","Almeida, 2024","N",null,0,null,50.0,"p"],[50.0,137.0,"g","p","Almeida, 2024","N",null,0,null,50.0,"p"],[50.0,200.0,"g","p","Almeida, 2024","N",null,0,null,50.0,"p"],[50.0,145.0,"g","p","Almeida, 2024","N",null,0,null,50.0,"p"],[50.0,312.0,"g","p","Almeida, 2024","N",null,0,null,50.0,"p"],[52.0,301.0,"o","p","Almeida, 2024","P",null,0,"cp_iii",50.0,"p"],[52.0,306.0,"o","p","Almeida, 2024","P",null,0,"cp_iii",50.0,"p"],[52.0,312.0,"o","p","Almeida, 2024","P",null,0,"cp_iii",50.0,"p"],[52.0,316.0,"o","p","Almeida, 2024","P",null,0,"cp_iii",50.0,"p"],[52.0,406.0,"o","p","Almeida, 2024","P",null,0,"cp_iii",50.0,"p"],[51.0,353.0,"o","p","Almeida, 2024","P",null,0,"cp_i",50.0,"p"],[51.0,359.0,"o","p","Almeida, 2024","P",null,0,"cp_i",50.0,"p"],[51.0,365.0,"o","p","Almeida, 2024","P",null,0,"cp_i",50.0,"p"],[51.0,369.0,"o","p","Almeida, 2024","P",null,0,"cp_i",50.0,"p"],[51.0,473.0,"o","p","Almeida, 2024","P",null,0,"cp_i",50.0,"p"],[35.0,502.18,"o","p","Rigon, 2015","P",null,0,"cp_ii_f",50.0,"p"],[35.0,381.88,"s","p","Rigon, 2015","P",null,0,null,50.0,"p"],[35.0,545.4,"o","p","Rigon, 2015","P",null,0,"cp_ii_f",50.0,"p"],[35.0,503.48,"s","p","Rigon, 2015","P",null,0,null,50.0,"p"],[40.18,556.6,"o","p","Lyra, 2023","P",null,0,"cp_v_ari",50.0,"d"],[33.82,554.6,"s","p","Lyra, 2023","P",null,0,null,50.0,"d"],[33.57,531.7,"s","p","Lyra, 2023","P",528.3,0,null,50.0,"d"],[39.51,491.0,"s","p","Lyra, 2023","P",482.9,0,null,50.0,"d"],[34.08,442.6,"s","p","Lyra, 2023","P",423.5,0,null,50.0,"d"],[34.53,529.3,"s","p","Lyra, 2023","P",518.8,0,null,50.0,"d"],[41.16,490.5,"s","p","Lyra, 2023","P",469.6,0,null,50.0,"d"],[35.14,440.3,"s","p","Lyra, 2023","P",395.5,0,null,50.0,"d"],[24.4,1308.47,"l","p","Sposito, 2024","N",null,0,null,50.0,"n"],[26.3,1154.5,"l","p","Sposito, 2024","N",null,0,null,50.0,"n"],[25.0,248.8,"o","p","Boros, 2023","P",null,0,"nao_declarado",100.0,"c"],[30.0,347.6,"c","s","Asensio et al., 2023","P",null,0,null,100.0,"n"],[35.0,415.9,"c","s","Asensio et al., 2023","P",null,0,null,100.0,"n"],[42.2,367.0,"o","p","Sirico et al., 2024","P",null,0,"cem_ii_a",50.0,"p"],[44.9,360.0,"s","p","Sirico et al., 2024","P",360.0,1,null,50.0,"p"],[41.1,357.0,"s","p","Sirico et al., 2024","P",357.0,1,null,50.0,"p"],[39.1,353.0,"s","p","Sirico et al., 2024","P",353.0,1,null,50.0,"p"],[78.0,983.0,"o","p","Jones & Li, 2024","P",null,0,"nao_declarado",25.0,"d"],[35.0,405.0,"o","p","Jones & Li, 2024","P",null,0,"nao_declarado",25.0,"d"],[25.0,366.3,"o","p","Abdelaal et al., 2024","P",null,0,"portland_sem_tipo",50.0,"n"],[25.0,304.4,"s","p","Abdelaal et al., 2024","P",null,0,null,50.0,"n"],[25.0,230.3,"s","p","Abdelaal et al., 2024","P",null,0,null,50.0,"n"],[61.0,484.6,"r","p","Gillani et al., 2023","P",null,0,null,50.0,"p"],[65.0,484.6,"r","p","Gillani et al., 2023","P",null,0,null,50.0,"p"],[60.0,565.0,"o","p","Gillani et al., 2023","P",null,0,"is_opc_grau",50.0,"p"],[71.3,628.5,"o","p","Ali et al., 2023","P",null,0,"is_opc_grau",50.0,"p"],[51.5,358.4,"s","s","Kina, 2024","P",null,0,null,50.0,"p"],[52.6,361.8,"s","s","Kina, 2024","P",null,0,null,50.0,"p"],[30.0,345.0,"c","p","Colangelo et al., 2020","M",345.0,1,null,50.0,"d"],[20.0,320.52,"o","s","Yu et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[25.0,358.56,"o","s","Yu et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[32.0,412.06,"o","s","Yu et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[40.0,496.12,"o","s","Yu et al., 2020","P",null,0,"portland_sem_tipo",50.0,"n"],[50.0,628.04,"o","s","Yu et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[65.0,797.69,"o","s","Yu et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[35.0,314.0,"o","p","Zieger et al., 2020","P",null,0,"portland_sem_tipo",50.0,"d"],[27.58,393.0,"s","p","Cai et al., 2022","P",null,0,null,60.0,"d"],[50.0,355.0,"g","s","Sandanayake et al., 2022","N",null,0,null,50.0,"p"],[20.0,250.0,"o","p","Li et al., 2023","P",112.5,0,"nao_declarado",50.0,"d"],[25.0,267.7,"o","p","Li et al., 2023","P",120.5,0,"nao_declarado",50.0,"d"],[30.0,287.7,"o","p","Li et al., 2023","P",129.5,0,"nao_declarado",50.0,"d"],[35.0,307.7,"o","p","Li et al., 2023","P",138.5,0,"nao_declarado",50.0,"d"],[40.0,327.7,"o","p","Li et al., 2023","P",147.5,0,"nao_declarado",50.0,"d"],[50.0,367.7,"o","p","Li et al., 2023","P",165.5,0,"nao_declarado",50.0,"d"],[30.0,334.9,"c","p","Habert et al., 2013","P",null,0,null,60.0,"d"],[50.0,445.23,"o","p","Garces et al., 2022","P",null,0,"cem_i",50.0,"n"],[50.0,344.75,"g","p","Garces et al., 2022","N",null,0,null,50.0,"n"],[50.0,333.93,"g","p","Garces et al., 2022","N",null,0,null,50.0,"n"],[50.0,380.43,"g","p","Garces et al., 2022","N",null,0,null,50.0,"n"],[50.0,369.62,"g","p","Garces et al., 2022","N",null,0,null,50.0,"n"],[45.4,1212.0,"o","p","Tefa et al., 2025","P",null,0,"cem_ii_b",50.0,"n"],[50.0,417.16,"g","p","Garces et al., 2021","N",null,0,null,50.0,"p"],[30.0,557.13,"c","p","Menna Barreto et al., 2021","P",546.95,0,null,27.35,"d"],[35.0,509.0,"o","p","Hussain et al., 2025","P",null,0,"nao_declarado",30.0,"c"],[35.2,403.0,"r","p","Jimenez et al., 2015","P",null,0,null,50.0,"p"],[44.0,566.0,"o","p","Teixeira et al., 2019","P",null,0,"cem_i",50.0,"p"],[29.1,381.8,"o","p","Oyebisi & Alomayri, 2022","P",null,0,"cem_ii",50.0,"p"],[34.5,427.2,"o","p","Oyebisi & Alomayri, 2022","P",null,0,"cem_ii",50.0,"p"],[45.9,540.6,"o","p","Oyebisi & Alomayri, 2022","P",null,0,"cem_ii",50.0,"p"],[134.2,768.4,"u","s","Guo et al., 2023","P",null,0,null,50.0,"p"],[127.6,771.0,"u","s","Guo et al., 2023","P",null,0,null,50.0,"p"],[118.3,656.0,"u","s","Guo et al., 2023","P",null,0,null,50.0,"p"],[28.0,331.36,"o","p","Lorika et al., 2023","P",null,0,"cem_ii_a",50.0,"p"],[29.1,298.84,"o","p","Lorika et al., 2023","P",null,0,"cem_ii_a",50.0,"p"],[46.5,356.0,"o","p","Kanagaraj et al., 2023","P",null,0,"portland_sem_tipo",50.0,"p"],[79.9,373.0,"s","p","Kanagaraj et al., 2023","P",null,0,null,50.0,"p"],[47.2,313.0,"g","p","Kanagaraj et al., 2023","N",null,0,null,50.0,"p"],[76.82,346.0,"g","p","Kanagaraj et al., 2023","N",null,0,null,50.0,"p"],[48.25,183.0,"s","p","Kanagaraj et al., 2023","P",null,0,null,50.0,"p"],[79.9,268.0,"s","p","Kanagaraj et al., 2023","P",null,0,null,50.0,"p"],[24.2,270.0,"o","p","Los Santos-Ortega et al., 2023","P",null,0,"cem_ii_a",50.0,"n"],[20.04,292.0,"r","p","Los Santos-Ortega et al., 2023","P",240.0,0,null,50.0,"n"],[57.06,412.0,"g","s","Kanagaraj et al., 2023","N",null,0,null,50.0,"d"],[52.9,253.0,"s","p","Mahdi et al., 2023","P",null,0,null,50.0,"p"],[29.8,267.0,"r","p","Mahdi et al., 2023","P",null,0,null,50.0,"p"],[20.7,268.0,"r","p","Mahdi et al., 2023","P",null,0,null,50.0,"p"],[28.6,813.06,"g","p","Gholampour et al., 2025","N",null,0,null,50.0,"p"],[44.1,848.53,"g","p","Gholampour et al., 2025","N",null,0,null,50.0,"p"],[62.9,914.0,"g","p","Gholampour et al., 2025","N",null,0,null,50.0,"p"],[30.6,923.63,"g","p","Gholampour et al., 2025","N",null,0,null,50.0,"p"],[47.5,959.11,"g","p","Gholampour et al., 2025","N",null,0,null,50.0,"p"],[65.6,1024.57,"g","p","Gholampour et al., 2025","N",null,0,null,50.0,"p"],[60.37,351.87,"g","s","Raj R et al., 2025","N",null,0,null,50.0,"p"],[59.23,511.0,"o","p","Hossain et al., 2021","P",null,0,"portland_sem_tipo",50.0,"p"],[63.0,446.0,"s","p","Hossain et al., 2021","P",null,0,null,50.0,"p"],[64.37,366.0,"s","p","Hossain et al., 2021","P",null,0,null,50.0,"p"],[70.7,429.0,"s","p","Hossain et al., 2021","P",null,0,null,50.0,"p"],[64.8,385.0,"s","p","Hossain et al., 2021","P",null,0,null,50.0,"p"],[44.79,184.0,"g","p","Irshidat et al., 2021","N",null,0,null,50.0,"p"],[21.94,559.69,"r","p","Luo et al., 2021","P",559.69,1,null,50.0,"n"],[50.13,483.25,"g","p","Luo et al., 2021","N",483.25,1,null,50.0,"n"],[23.0,612.9,"g","s","Damrongwiriyanupap et al., 2022","N",null,0,null,50.0,"p"],[46.0,612.92,"g","s","Damrongwiriyanupap et al., 2022","N",null,0,null,50.0,"p"],[31.0,365.71,"o","p","Goh et al., 2022","P",null,0,"portland_sem_tipo",50.0,"n"],[37.5,361.1,"r","p","Goh et al., 2022","P",null,0,null,50.0,"n"],[52.0,278.68,"s","p","Goh et al., 2022","P",null,0,null,50.0,"n"],[35.0,287.32,"g","p","Goh et al., 2022","N",null,0,null,50.0,"n"],[53.5,440.5,"s","s","Yu et al., 2022","P",null,0,null,50.0,"n"],[44.3,411.6,"s","s","Yu et al., 2022","P",null,0,null,50.0,"n"],[48.3,543.6,"r","s","Yu et al., 2022","P",null,0,null,50.0,"n"],[23.0,248.3,"s","s","Yu et al., 2022","P",null,0,null,50.0,"n"],[52.4,422.3,"r","s","Yu et al., 2022","P",null,0,null,50.0,"n"],[32.0,334.58,"s","p","Bediako & Valentini, 2022","P",null,0,null,50.0,"p"],[43.23,429.56,"o","s","Amran et al., 2022","P",null,0,"astm_type_i",50.0,"p"],[29.18,217.52,"s","s","Amran et al., 2022","P",null,0,null,50.0,"p"],[45.98,217.56,"s","s","Amran et al., 2022","P",null,0,null,50.0,"p"],[36.64,217.59,"s","s","Amran et al., 2022","P",null,0,null,50.0,"p"],[110.02,988.0,"u","s","Abdellatief et al., 2023","P",null,0,null,50.0,"p"],[89.9,623.0,"u","s","Abdellatief et al., 2023","P",null,0,null,50.0,"p"],[108.95,767.0,"u","s","Abdellatief et al., 2023","P",null,0,null,50.0,"p"],[25.0,207.5,"s","s","Shobeiri et al., 2023","P",null,0,null,50.0,"p"],[47.5,382.3,"o","p","Al Ghali et al., 2023","P",null,0,"astm_type_i",50.0,"n"],[30.1,266.59,"s","s","Yahyaee & Elize, 2024","P",null,0,null,50.0,"n"],[36.4,334.72,"s","s","Yahyaee & Elize, 2024","P",null,0,null,50.0,"n"],[31.85,439.26,"o","s","Yahyaee & Elize, 2024","P",null,0,"astm_type_ii",50.0,"n"],[92.36,1318.0,"u","s","Zhang et al., 2024","P",null,0,null,50.0,"p"],[107.14,1120.0,"u","s","Zhang et al., 2024","P",null,0,null,50.0,"p"],[98.29,715.0,"u","s","Zhang et al., 2024","P",null,0,null,50.0,"p"],[50.0,403.38,"o","p","Wu et al., 2024","P",null,0,"nao_declarado",100.0,"d"],[50.0,331.0,"r","p","Dacic et al., 2024","P",null,0,null,50.0,"p"],[27.8,410.01,"o","p","Manan et al., 2024","P",null,0,"astm_c150",50.0,"p"],[67.0,195.0,"l","p","Sun et al., 2025","N",null,0,null,50.0,"n"],[30.0,262.61,"o","p","Lin et al., 2025","P",null,0,"nao_declarado",50.0,"p"],[107.15,443.61,"u","s","Zhang et al., 2025","P",null,0,null,50.0,"p"],[65.0,611.7,"o","p","Jiang et al., 2025","P",null,0,"gb_po",100.0,"c"],[30.0,295.0,"o","s","Meng et al., 2023","P",null,0,"nao_declarado",100.0,"n"],[35.0,453.3,"o","p","Justo-Reinoso et al., 2023","P",null,0,"cem_ii_a",50.0,"d"],[206.9,824.0,"u","p","Kang et al., 2024","P",null,0,null,50.0,"p"],[35.0,383.1,"o","p","Huang et al., 2025","P",313.4,0,"portland_sem_tipo",50.0,"n"],[35.0,378.5,"r","p","Huang et al., 2025","P",295.6,0,null,50.0,"n"],[35.0,375.7,"r","p","Huang et al., 2025","P",279.4,0,null,50.0,"n"],[35.0,373.1,"r","p","Huang et al., 2025","P",263.5,0,null,50.0,"n"],[35.0,368.3,"r","p","Huang et al., 2025","P",245.5,0,null,50.0,"n"],[30.0,291.0,"o","p","Skullestad et al., 2016","P",231.0,0,"nao_declarado",60.0,"d"],[45.0,326.0,"o","p","Skullestad et al., 2016","P",276.0,0,"nao_declarado",60.0,"d"],[36.6,323.0,"o","p","Sabau et al., 2021","P",null,0,"cem_i",50.0,"n"],[36.3,296.0,"s","p","Sabau et al., 2021","P",null,0,null,50.0,"n"],[36.5,306.0,"r","p","Sabau et al., 2021","P",306.0,1,null,50.0,"n"],[29.3,466.77,"o","p","Yaseen et al., 2024","P",null,0,"astm_c150",50.0,"p"],[27.9,423.0,"s","p","Yaseen et al., 2024","P",null,0,null,50.0,"p"],[26.3,380.09,"s","p","Yaseen et al., 2024","P",null,0,null,50.0,"p"],[25.1,336.33,"s","p","Yaseen et al., 2024","P",null,0,null,50.0,"p"],[26.9,445.32,"s","p","Yaseen et al., 2024","P",null,0,null,50.0,"p"],[28.2,423.86,"s","p","Yaseen et al., 2024","P",null,0,null,50.0,"p"],[24.4,401.55,"s","p","Yaseen et al., 2024","P",null,0,null,50.0,"p"],[30.0,254.4,"o","s","Almulhim et al., 2024","P",null,0,"nao_declarado",50.0,"n"],[66.8,121.77,"g","p","Espuelas et al., 2018","N",null,0,null,50.0,"p"],[61.0,132.25,"g","p","Espuelas et al., 2018","N",null,0,null,50.0,"p"],[62.1,143.41,"g","p","Espuelas et al., 2018","N",null,0,null,50.0,"p"],[52.7,86.32,"g","p","Espuelas et al., 2018","N",null,0,null,50.0,"p"],[54.2,97.65,"g","p","Espuelas et al., 2018","N",null,0,null,50.0,"p"],[56.8,109.09,"g","p","Espuelas et al., 2018","N",null,0,null,50.0,"p"],[35.0,350.7,"o","p","Abdulkareem et al., 2019","P",null,0,"cem_i",50.0,"p"],[39.5,449.7,"o","p","Abdulkareem et al., 2019","P",null,0,"cem_i",50.0,"p"],[38.4,185.7,"g","p","Abdulkareem et al., 2019","N",null,0,null,50.0,"p"],[35.97,166.9,"g","p","Abdulkareem et al., 2019","N",null,0,null,50.0,"p"],[39.21,179.7,"g","p","Abdulkareem et al., 2019","N",null,0,null,50.0,"p"],[30.0,232.0,"o","p","Stoiber et al., 2021","P",null,0,"nao_declarado",70.0,"c"],[50.0,335.0,"o","p","Stoiber et al., 2021","P",null,0,"nao_declarado",70.0,"c"],[70.0,431.0,"o","p","Stoiber et al., 2021","P",null,0,"nao_declarado",70.0,"c"],[52.0,190.6,"g","p","Abdulkareem et al., 2021","N",null,0,null,50.0,"p"],[58.0,174.2,"g","p","Abdulkareem et al., 2021","N",null,0,null,50.0,"p"],[58.0,72.4,"g","p","Abdulkareem et al., 2021","N",null,0,null,50.0,"p"],[60.0,72.4,"g","p","Abdulkareem et al., 2021","N",null,0,null,50.0,"p"],[43.5,535.8,"o","p","Batuecas et al., 2021","P",null,0,"cem_i",50.0,"p"],[101.2,109.63,"g","p","Batuecas et al., 2021","N",-406.02,0,null,50.0,"p"],[42.0,138.64,"g","p","Batuecas et al., 2021","N",-253.26,0,null,50.0,"p"],[30.0,138.63,"g","p","Batuecas et al., 2021","N",-253.27,0,null,50.0,"p"],[30.2,469.8,"s","s","Li et al., 2022","P",null,0,null,75.0,"d"],[30.0,370.37,"o","s","Li et al., 2022","P",null,0,"portland_sem_tipo",75.0,"d"],[20.5,446.0,"o","p","Sandanayake et al., 2022","P",null,0,"portland_sem_tipo",50.0,"p"],[35.0,532.5,"c","p","Di Summa et al., 2022","P",null,0,null,50.0,"d"],[30.0,526.0,"c","p","Di Summa et al., 2022","P",null,0,null,50.0,"d"],[35.0,400.0,"s","p","Jones & Li, 2023","P",null,0,null,25.0,"d"],[78.0,979.0,"s","p","Jones & Li, 2023","P",null,0,null,25.0,"d"],[30.0,279.21,"o","s","Negrin et al., 2023","P",null,0,"portland_sem_tipo",215.0,"d"],[35.0,305.96,"o","s","Negrin et al., 2023","P",null,0,"portland_sem_tipo",50.0,"n"],[40.0,307.06,"o","s","Negrin et al., 2023","P",null,0,"portland_sem_tipo",50.0,"n"],[45.0,307.06,"o","s","Negrin et al., 2023","P",null,0,"portland_sem_tipo",50.0,"n"],[30.0,372.2,"c","s","Kuepfer et al., 2024","P",null,0,null,50.0,"n"],[21.0,297.0,"g","p","Huang & Wang, 2024","N",null,0,null,50.0,"n"],[30.0,322.0,"o","p","Driessen & Gronlund, 2024","P",null,0,"portland_sem_tipo",50.0,"p"],[50.46,285.5,"r","p","Manso-Morato et al., 2025","P",null,0,null,50.0,"p"],[167.0,703.15,"u","p","Khan et al., 2024","P",null,0,null,50.0,"p"],[150.0,571.33,"u","p","Khan et al., 2024","P",null,0,null,50.0,"p"],[39.42,397.24,"r","p","Frazao et al., 2022","P",null,0,null,50.0,"p"],[39.42,479.22,"s","p","Frazao et al., 2022","P",null,0,null,50.0,"p"],[40.0,850.0,"c","p","Alali et al., 2024","P",795.0,0,null,50.0,"n"],[40.2,639.0,"s","s","Teng et al., 2025","P",null,0,null,50.0,"p"],[45.8,581.0,"s","s","Teng et al., 2025","P",null,0,null,50.0,"p"],[44.2,522.0,"s","s","Teng et al., 2025","P",null,0,null,50.0,"p"],[34.2,463.0,"s","s","Teng et al., 2025","P",null,0,null,50.0,"p"],[41.5,415.0,"o","p","Fan et al., 2025","P",null,0,"astm_il",50.0,"p"],[21.2,253.0,"g","p","Fan et al., 2025","N",null,0,null,50.0,"p"],[34.7,308.0,"g","p","Fan et al., 2025","N",null,0,null,50.0,"p"],[38.8,353.8,"g","p","Nguyen et al., 2020","N",null,0,null,50.0,"p"],[33.3,284.4,"g","p","Nguyen et al., 2020","N",null,0,null,50.0,"p"],[38.1,288.5,"g","p","Nguyen et al., 2020","N",null,0,null,50.0,"p"],[47.0,903.0,"o","p","Anastasiou et al., 2017","P",null,0,"cem_i",50.0,"p"],[51.8,503.0,"r","p","Anastasiou et al., 2017","P",503.0,1,null,50.0,"p"],[46.2,190.3,"s","p","Kanagaraj et al., 2024","P",null,0,null,50.0,"p"],[38.6,228.0,"s","s","Berndt, 2015","P",null,0,null,20.0,"c"],[52.1,258.0,"s","s","Berndt, 2015","P",null,0,null,20.0,"c"],[45.4,246.0,"s","s","Berndt, 2015","P",null,0,null,20.0,"c"],[43.7,210.0,"r","s","Berndt, 2015","P",null,0,null,20.0,"c"],[40.0,310.0,"o","p","Yazdanbakhsh & Lagouin, 2019","P",null,0,"portland_sem_tipo",50.0,"p"],[40.0,323.0,"r","p","Yazdanbakhsh & Lagouin, 2019","P",280.2,0,null,50.0,"p"],[25.0,308.0,"r","p","Mostert et al., 2021","P",null,0,null,50.0,"n"],[25.0,315.0,"r","p","Mostert et al., 2021","P",null,0,null,50.0,"n"],[104.7,1194.0,"u","s","Du et al., 2022","P",null,0,null,50.0,"p"],[77.1,942.0,"u","s","Du et al., 2022","P",null,0,null,50.0,"p"],[121.5,651.0,"u","s","Du et al., 2022","P",null,0,null,50.0,"p"],[30.0,360.0,"o","p","Jungclaus et al., 2024","P",263.0,0,"astm_type_i",50.0,"p"],[45.0,505.0,"o","p","Jungclaus et al., 2024","P",395.0,0,"astm_type_i",50.0,"p"],[40.0,347.0,"o","p","Alkhawaldeh et al., 2024","P",null,0,"portland_sem_tipo",50.0,"p"],[40.0,169.0,"g","p","Alkhawaldeh et al., 2024","N",null,0,null,50.0,"p"],[40.0,234.0,"g","p","Alkhawaldeh et al., 2024","N",null,0,null,50.0,"p"],[40.0,245.0,"s","p","Alkhawaldeh et al., 2024","P",null,0,null,50.0,"p"],[24.52,168.0,"o","s","Lopez-Sosa et al., 2025","P",null,0,"nao_declarado",50.0,"n"],[20.0,349.37,"c","p","Tushar et al., 2023","P",null,0,null,50.0,"n"],[50.3,502.1,"o","p","Lei et al., 2024","P",null,0,"gb_po",50.0,"p"],[48.5,478.0,"r","p","Lei et al., 2024","P",459.6,0,null,50.0,"p"],[47.2,477.8,"r","p","Lei et al., 2024","P",441.2,0,null,50.0,"p"],[45.3,478.2,"r","p","Lei et al., 2024","P",422.8,0,null,50.0,"p"],[25.0,436.32,"o","p","Omar et al., 2014","P",null,0,"portland_sem_tipo",50.0,"n"],[30.0,502.13,"o","p","Omar et al., 2014","P",null,0,"portland_sem_tipo",50.0,"n"],[40.0,525.89,"o","p","Omar et al., 2014","P",null,0,"portland_sem_tipo",50.0,"n"],[25.0,266.25,"s","p","Elliot et al., 2024","P",251.25,0,null,60.0,"d"],[31.0,251.0,"s","p","Jin et al., 2024","P",null,0,null,50.0,"p"],[25.0,334.0,"o","p","Van Roijen et al., 2025","P",334.0,1,"portland_sem_tipo",50.0,"d"],[40.0,609.0,"o","p","Baykara et al., 2024","P",null,0,"astm_c1157",50.0,"p"],[38.2,543.0,"o","p","Cunningham et al., 2021","P",null,0,"astm_type_ii_v",50.0,"p"],[44.0,367.85,"o","p","Ro et al., 2024","P",null,0,"astm_type_ii_v",50.0,"p"],[37.5,312.88,"s","p","Ro et al., 2024","P",null,0,null,50.0,"p"],[24.18,697.0,"o","p","Cunningham & Miller, 2020","P",null,0,"astm_type_ii_v",50.0,"p"],[30.69,513.0,"s","p","Cunningham & Miller, 2020","P",null,0,null,50.0,"p"],[23.41,470.0,"s","p","Cunningham & Miller, 2020","P",null,0,null,50.0,"p"],[20.56,100.0,"g","p","Cunningham & Miller, 2020","N",null,0,null,50.0,"p"],[51.2,471.62,"o","p","Dehghani et al., 2024","P",null,0,"astm_type_ii",50.0,"n"],[65.7,380.62,"s","p","Dehghani et al., 2024","P",380.07,0,null,50.0,"n"],[40.0,388.0,"o","p","Chen et al., 2023","P",null,0,"nao_declarado",120.0,"d"],[48.28,660.4,"r","p","Ye et al., 2024","P",null,0,null,50.0,"n"],[42.27,669.9,"r","p","Ye et al., 2024","P",null,0,null,50.0,"n"],[131.0,466.83,"s","p","Ye et al., 2024","P",null,0,null,50.0,"n"],[40.0,318.13,"o","p","Ye et al., 2024","P",null,0,"portland_sem_tipo",50.0,"n"],[95.0,1069.0,"s","s","Mostafaei et al., 2025","P",null,1,null,50.0,"p"],[25.0,688.0,"r","s","Mostafaei et al., 2025","P",null,1,null,50.0,"p"],[89.0,993.0,"r","s","Mostafaei et al., 2025","P",null,1,null,50.0,"p"],[106.0,887.0,"r","s","Mostafaei et al., 2025","P",null,1,null,50.0,"p"],[45.43,352.0,"o","p","Kadawo et al., 2021","P",null,0,"cem_ii_a",50.0,"n"],[42.9,349.0,"r","p","Kadawo et al., 2021","P",null,0,null,50.0,"n"],[35.17,348.0,"r","p","Kadawo et al., 2021","P",null,0,null,50.0,"n"],[30.0,289.5,"o","p","Asare et al., 2024","P",null,0,"portland_sem_tipo",100.0,"d"],[40.0,348.8,"o","p","Asare et al., 2024","P",null,0,"portland_sem_tipo",100.0,"d"],[50.0,391.2,"o","p","Asare et al., 2024","P",null,0,"portland_sem_tipo",100.0,"d"],[56.4,520.0,"o","s","Miller et al., 2015","P",null,0,"portland_sem_tipo",50.0,"n"],[25.0,334.1,"s","p","Miller, 2021","P",null,0,null,100.0,"n"],[35.0,237.38,"o","p","Rønning et al., 2024","P",140.38,0,"nao_declarado",100.0,"d"],[35.0,227.79,"r","p","Rønning et al., 2024","P",107.23,0,null,100.0,"d"],[35.0,217.47,"r","p","Rønning et al., 2024","P",48.35,0,null,100.0,"d"],[25.0,196.0,"o","p","Silva et al., 2019","P",null,0,"cp_ii",50.0,"p"],[30.0,220.0,"o","p","Silva et al., 2019","P",null,0,"cp_ii",50.0,"p"],[35.0,248.0,"o","p","Silva et al., 2019","P",null,0,"cp_ii",50.0,"p"],[40.0,295.0,"o","p","Silva et al., 2019","P",null,0,"cp_ii",50.0,"p"],[24.1,120.0,"g","p","Meek & Elchalakani, 2019","N",null,0,null,50.0,"n"],[25.0,260.0,"s","p","Mostert et al., 2020","P",null,0,null,50.0,"n"],[30.0,801.0,"c","p","Larsen et al., 2017","P",null,0,null,100.0,"d"],[150.0,2123.8,"c","p","Larsen et al., 2017","P",null,0,null,200.0,"d"],[25.0,362.29,"o","p","Stepanek et al., 2018","P",null,0,"nao_declarado",100.0,"n"],[52.4,253.0,"o","s","Pavlik et al., 2019","P",null,0,"cem_i",50.0,"p"],[29.4,980.0,"c","p","Tran & Tran, 2020","P",null,0,null,100.0,"d"],[25.0,461.3,"o","p","Morsi et al., 2020","P",461.3,1,"astm_type_i",60.0,"d"],[30.0,401.3,"o","p","Jeong & Park, 2024","P",385.0,0,"nao_declarado",50.0,"d"],[40.0,242.0,"o","p","Amitani & Miller, 2024","P",null,0,"portland_sem_tipo",50.0,"p"],[40.0,391.0,"o","p","Amitani & Miller, 2024","P",null,0,"portland_sem_tipo",50.0,"p"],[20.0,253.44,"o","p","Neimark et al., 2024","P",null,0,"cem_i",100.0,"n"],[32.5,350.7,"o","p","Jiménez et al., 2018","P",null,0,"portland_sem_tipo",50.0,"p"],[31.6,349.9,"r","p","Jiménez et al., 2018","P",null,0,null,50.0,"p"],[30.8,349.0,"r","p","Jiménez et al., 2018","P",null,0,null,50.0,"p"],[29.8,348.2,"r","p","Jiménez et al., 2018","P",null,0,null,50.0,"p"],[29.8,347.4,"r","p","Jiménez et al., 2018","P",null,0,null,50.0,"p"],[23.7,264.7,"o","p","Jiménez et al., 2018","P",null,0,"portland_sem_tipo",50.0,"p"],[23.1,263.9,"r","p","Jiménez et al., 2018","P",null,0,null,50.0,"p"],[22.5,263.0,"r","p","Jiménez et al., 2018","P",null,0,null,50.0,"p"],[21.0,262.2,"r","p","Jiménez et al., 2018","P",null,0,null,50.0,"p"],[104.0,774.0,"r","p","Gursel & Ostertag, 2019","P",null,0,null,50.0,"p"],[35.0,472.0,"c","p","Mirdad et al., 2021","P",null,0,null,50.0,"n"],[50.0,510.94,"o","p","Li & Zhu, 2022","P",null,0,"nao_declarado",50.0,"d"],[50.0,364.0,"g","p","Teh et al., 2018","N",null,0,null,50.0,"p"],[55.0,178.63,"s","p","Lee et al., 2019","P",168.3,0,null,50.0,"d"],[52.0,220.29,"o","p","Masi et al., 2023","P",null,0,"cem_iii",50.0,"p"],[34.0,216.3,"r","p","Masi et al., 2023","P",209.43,0,null,50.0,"p"],[51.6,160.86,"g","s","Jiang et al., 2024","N",null,0,null,50.0,"p"],[50.7,134.08,"g","s","Jiang et al., 2024","N",null,0,null,50.0,"p"],[30.8,241.0,"o","p","Buffenbarger et al., 2023","P",null,0,"nao_declarado",50.0,"n"],[31.8,248.0,"o","p","Buffenbarger et al., 2023","P",null,0,"nao_declarado",50.0,"n"],[32.9,258.0,"o","p","Buffenbarger et al., 2023","P",null,0,"nao_declarado",50.0,"n"],[34.5,271.0,"o","p","Buffenbarger et al., 2023","P",null,0,"nao_declarado",50.0,"n"],[36.2,283.0,"o","p","Buffenbarger et al., 2023","P",null,0,"nao_declarado",50.0,"n"],[39.4,308.0,"o","p","Buffenbarger et al., 2023","P",null,0,"nao_declarado",50.0,"n"],[44.2,346.0,"o","p","Buffenbarger et al., 2023","P",null,0,"nao_declarado",50.0,"n"],[44.4,263.78,"r","s","Zhang et al., 2022","P",null,0,null,50.0,"p"],[30.0,535.0,"s","p","Passuello et al., 2019","P",null,0,null,50.0,"p"],[40.0,418.78,"o","p","Gomes et al., 2019","P",null,0,"cp_ii_e",50.0,"n"],[40.0,239.82,"g","p","Gomes et al., 2019","N",null,0,null,50.0,"n"],[27.82,304.9,"o","p","De Azevedo Sampaio et al., 2022","P",null,0,"cp_v_ari",50.0,"d"],[28.73,324.0,"r","p","De Azevedo Sampaio et al., 2022","P",null,0,null,50.0,"d"],[25.0,224.6,"o","p","Angelin et al., 2023","P",null,0,"cp_iii",50.0,"d"],[32.4,416.13,"o","p","Souza et al., 2024","P",null,0,"cp_v_ari",50.0,"p"],[30.0,347.4,"o","p","Bacelar et al., 2022","P",null,0,"portland_sem_tipo",50.0,"n"],[40.0,388.4,"o","p","Bacelar et al., 2022","P",null,0,"portland_sem_tipo",50.0,"n"],[50.0,424.0,"o","p","Bacelar et al., 2022","P",null,0,"portland_sem_tipo",50.0,"n"],[69.5,146.0,"g","p","Arce et al., 2023","N",null,0,null,50.0,"p"],[40.0,370.0,"s","s","Basavaraj et al., 2023","P",null,0,null,50.0,"p"],[70.0,569.0,"o","p","Sinoh et al., 2021","P",null,0,"portland_sem_tipo",50.0,"p"],[70.0,536.0,"s","p","Sinoh et al., 2021","P",null,0,null,50.0,"p"],[45.0,436.0,"o","p","Sinoh et al., 2021","P",null,0,"portland_sem_tipo",50.0,"p"],[45.0,432.0,"r","p","Sinoh et al., 2021","P",null,0,null,50.0,"p"],[45.0,434.0,"r","p","Sinoh et al., 2021","P",null,0,null,50.0,"p"],[25.0,159.46,"o","s","Mercader Moyano et al., 2019","P",null,0,"nao_declarado",50.0,"n"],[21.0,288.2,"o","p","Restrepo-Ramirez et al., 2024","P",null,0,"portland_sem_tipo",50.0,"p"],[21.0,243.7,"o","p","Restrepo-Ramirez et al., 2024","P",null,0,"portland_sem_tipo",50.0,"p"],[70.2,776.5,"o","s","Nasr et al., 2023","P",null,0,"cem_ii_a",50.0,"p"],[71.7,637.4,"s","s","Nasr et al., 2023","P",null,0,null,50.0,"p"],[41.5,414.0,"o","p","Li et al., 2020","P",null,0,"cem_i",100.0,"d"],[47.7,435.0,"o","p","Li et al., 2020","P",null,0,"cem_i",100.0,"d"],[176.7,761.0,"u","p","Glanz et al., 2023","P",null,0,null,50.0,"p"],[194.2,545.6,"g","p","Glanz et al., 2023","N",null,0,null,50.0,"p"],[211.8,459.6,"g","p","Glanz et al., 2023","N",null,0,null,50.0,"p"],[20.0,244.75,"s","p","Ranganath et al., 2024","P",null,0,null,61.0,"d"],[24.0,358.0,"o","p","Roh et al., 2020","P",null,0,"portland_sem_tipo",50.0,"p"],[37.48,475.0,"c","p","Guignone et al., 2022","P",null,0,null,100.0,"d"],[36.56,414.0,"c","p","Guignone et al., 2022","P",null,0,null,100.0,"d"],[20.7,334.1,"r","p","Bertoldo et al., 2024","P",320.0,0,null,50.0,"p"],[25.0,285.02,"o","p","Gao et al., 2024","P",78.52,0,"nao_declarado",50.0,"d"],[30.0,295.0,"o","p","Gao et al., 2024","P",88.5,0,"portland_sem_tipo",50.0,"d"],[40.0,321.4,"o","p","Gao et al., 2024","P",114.9,0,"portland_sem_tipo",50.0,"d"],[50.0,385.0,"o","p","Gao et al., 2024","P",178.5,0,"portland_sem_tipo",50.0,"d"],[60.0,416.76,"o","p","Gao et al., 2024","P",210.26,0,"portland_sem_tipo",50.0,"d"],[25.0,361.0,"o","s","Thamboo et al., 2021","P",null,0,"nao_declarado",50.0,"n"],[21.0,237.22,"o","p","Petroche & Ramirez, 2022","P",null,0,"astm_c1157",50.0,"p"],[24.0,256.08,"o","p","Petroche & Ramirez, 2022","P",null,0,"astm_c1157",50.0,"p"],[28.0,267.54,"o","p","Petroche & Ramirez, 2022","P",null,0,"astm_c1157",50.0,"p"],[30.0,290.85,"o","p","Petroche & Ramirez, 2022","P",null,0,"astm_c1157",50.0,"p"],[35.0,310.31,"o","p","Petroche & Ramirez, 2022","P",null,0,"astm_c1157",50.0,"p"],[40.0,355.38,"o","p","Petroche & Ramirez, 2022","P",null,0,"astm_c1157",50.0,"p"],[45.0,379.38,"o","p","Petroche & Ramirez, 2022","P",null,0,"astm_c1157",50.0,"p"],[50.0,382.03,"o","p","Petroche & Ramirez, 2022","P",null,0,"astm_c1157",50.0,"p"],[60.0,419.55,"o","p","Petroche & Ramirez, 2022","P",null,0,"astm_c1157",50.0,"p"],[80.0,442.14,"o","p","Petroche & Ramirez, 2022","P",null,0,"astm_c1157",50.0,"p"],[30.0,212.26,"o","p","Hegeir et al., 2022","P",null,0,"nao_declarado",50.0,"d"],[20.0,305.0,"o","p","Pushkar et al., 2022","P",null,0,"nao_declarado",60.0,"d"],[34.47,648.4,"c","p","Tushar et al., 2022","P",null,0,null,60.0,"d"],[20.68,627.6,"c","p","Tushar et al., 2022","P",null,0,null,60.0,"d"],[34.47,668.0,"c","p","Tushar et al., 2022","P",null,0,null,60.0,"d"],[20.7,293.75,"s","p","De Pedro et al., 2023","P",null,0,null,50.0,"n"],[20.0,267.19,"o","p","Mostafaei et al., 2023","P",null,0,"portland_sem_tipo",50.0,"n"],[30.0,332.57,"o","p","Mostafaei et al., 2023","P",null,0,"portland_sem_tipo",50.0,"n"],[40.0,417.82,"o","p","Mostafaei et al., 2023","P",null,0,"portland_sem_tipo",50.0,"n"],[40.0,361.8,"o","p","Huang & Wang, 2023","P",null,0,"nao_declarado",50.0,"d"],[38.27,416.0,"o","p","Almulhim & Al Masmoum, 2024","P",null,0,"portland_sem_tipo",50.0,"n"],[48.82,471.0,"o","p","Almulhim & Al Masmoum, 2024","P",null,0,"portland_sem_tipo",50.0,"n"],[59.82,518.0,"o","p","Almulhim & Al Masmoum, 2024","P",null,0,"portland_sem_tipo",50.0,"n"],[70.82,554.0,"o","p","Almulhim & Al Masmoum, 2024","P",null,0,"portland_sem_tipo",50.0,"n"],[81.82,592.0,"o","p","Almulhim & Al Masmoum, 2024","P",null,0,"portland_sem_tipo",50.0,"n"],[20.0,299.71,"o","p","Tran et al., 2025","P",null,0,"portland_sem_tipo",50.0,"p"],[20.0,268.95,"o","p","Tran et al., 2025","P",183.19,0,"portland_sem_tipo",50.0,"p"],[35.0,301.8,"o","p","Tran et al., 2025","P",null,0,"portland_sem_tipo",50.0,"p"],[35.0,270.82,"o","p","Tran et al., 2025","P",184.43,0,"portland_sem_tipo",50.0,"p"],[40.0,302.47,"o","p","Tran et al., 2025","P",null,0,"portland_sem_tipo",50.0,"p"],[40.0,271.42,"o","p","Tran et al., 2025","P",184.83,0,"portland_sem_tipo",50.0,"p"],[50.0,303.1,"o","p","Tran et al., 2025","P",null,0,"portland_sem_tipo",50.0,"p"],[50.0,271.98,"o","p","Tran et al., 2025","P",185.2,0,"portland_sem_tipo",50.0,"p"],[65.0,303.45,"o","p","Tran et al., 2025","P",null,0,"portland_sem_tipo",50.0,"p"],[65.0,272.3,"o","p","Tran et al., 2025","P",185.41,0,"portland_sem_tipo",50.0,"p"],[80.0,304.27,"o","p","Tran et al., 2025","P",null,0,"portland_sem_tipo",50.0,"p"],[80.0,273.03,"o","p","Tran et al., 2025","P",185.9,0,"portland_sem_tipo",50.0,"p"],[100.0,305.87,"o","p","Tran et al., 2025","P",null,0,"portland_sem_tipo",50.0,"p"],[100.0,274.46,"o","p","Tran et al., 2025","P",186.85,0,"portland_sem_tipo",50.0,"p"],[34.47,523.9,"c","p","Zahabi et al., 2025","P",null,0,null,60.0,"d"],[23.16,243.5,"g","p","Rojas-Duque et al., 2020","N",null,0,null,50.0,"n"],[21.0,377.8,"o","p","Rojas-Duque et al., 2020","P",null,0,"astm_c1157",50.0,"n"],[28.75,239.0,"o","p","Paula Junior et al., 2021","P",null,0,"cp_iii",50.0,"n"],[30.0,321.3,"o","s","Xu et al., 2021","P",null,0,"nao_declarado",50.0,"n"],[32.0,412.0,"o","p","Teodosio et al., 2021","P",371.44,0,"nao_declarado",50.0,"d"],[45.0,498.5,"o","p","Nasr et al., 2023","P",null,0,"portland_sem_tipo",50.0,"p"],[42.0,444.68,"s","p","Nasr et al., 2023","P",null,0,null,50.0,"p"],[38.0,390.87,"s","p","Nasr et al., 2023","P",null,0,null,50.0,"p"],[35.0,337.05,"s","p","Nasr et al., 2023","P",null,0,null,50.0,"p"],[27.0,283.23,"s","p","Nasr et al., 2023","P",null,0,null,50.0,"p"],[20.0,185.0,"o","p","Asdrubali et al., 2025","P",null,0,"nao_declarado",50.0,"n"],[25.0,205.9,"o","p","Asdrubali et al., 2025","P",null,0,"nao_declarado",50.0,"n"],[30.0,204.5,"o","p","Asdrubali et al., 2025","P",null,0,"nao_declarado",50.0,"n"],[37.0,237.0,"o","p","Asdrubali et al., 2025","P",null,0,"nao_declarado",50.0,"n"],[40.0,319.6,"o","p","Asdrubali et al., 2025","P",null,0,"nao_declarado",50.0,"n"],[45.0,326.1,"o","p","Asdrubali et al., 2025","P",null,0,"nao_declarado",50.0,"n"],[50.0,356.4,"o","p","Asdrubali et al., 2025","P",null,0,"nao_declarado",50.0,"n"],[55.0,385.4,"o","p","Asdrubali et al., 2025","P",null,0,"nao_declarado",50.0,"n"],[60.0,265.6,"o","p","Asdrubali et al., 2025","P",null,0,"nao_declarado",50.0,"n"],[75.0,292.6,"o","p","Asdrubali et al., 2025","P",null,0,"nao_declarado",50.0,"n"],[50.0,705.0,"s","p","Zhou et al., 2020","P",null,0,null,100.0,"d"],[40.0,608.0,"s","p","Zhou et al., 2020","P",null,0,null,100.0,"d"],[30.0,565.0,"s","p","Zhou et al., 2020","P",null,0,null,100.0,"d"],[20.0,306.19,"o","s","Hu et al., 2022","P",null,0,"nao_declarado",100.0,"n"],[25.0,336.68,"o","s","Hu et al., 2022","P",null,0,"nao_declarado",100.0,"n"],[30.0,371.65,"o","s","Hu et al., 2022","P",null,0,"nao_declarado",100.0,"n"],[35.0,389.57,"o","s","Hu et al., 2022","P",null,0,"nao_declarado",100.0,"n"],[40.0,419.6,"o","s","Hu et al., 2022","P",null,0,"nao_declarado",100.0,"n"],[50.0,502.82,"o","s","Hu et al., 2022","P",null,0,"nao_declarado",100.0,"n"],[60.0,549.34,"o","s","Hu et al., 2022","P",null,0,"nao_declarado",100.0,"n"],[30.0,157.65,"o","p","Tres Junior et al., 2023","P",null,0,"nao_declarado",100.0,"n"],[30.0,348.76,"o","p","Tres Junior et al., 2023","P",null,0,"nao_declarado",100.0,"n"],[45.0,194.7,"o","p","Tres Junior et al., 2023","P",null,0,"nao_declarado",100.0,"n"],[45.0,381.72,"o","p","Tres Junior et al., 2023","P",null,0,"nao_declarado",100.0,"n"],[50.0,225.78,"o","p","Tres Junior et al., 2023","P",null,0,"nao_declarado",100.0,"n"],[50.0,508.63,"o","p","Tres Junior et al., 2023","P",null,0,"nao_declarado",100.0,"n"],[22.2,659.0,"o","p","Ellingboe et al., 2019","P",578.8,0,"astm_type_i",10.75,"d"],[80.0,172.37,"g","s","Esparham et al., 2023","N",null,0,null,50.0,"p"],[80.0,742.88,"o","s","Esparham et al., 2023","P",null,0,"portland_sem_tipo",50.0,"p"],[28.0,150.0,"s","s","Pineda et al., 2025","P",null,0,null,50.0,"p"],[41.4,508.0,"o","s","Sahmenko et al., 2024","P",null,0,"cem_i",50.0,"p"],[43.4,380.0,"l","s","Sahmenko et al., 2024","N",null,0,null,50.0,"p"],[38.2,333.0,"l","s","Sahmenko et al., 2024","N",null,0,null,50.0,"p"],[38.6,318.0,"l","s","Sahmenko et al., 2024","N",null,0,null,50.0,"p"],[37.0,296.0,"l","s","Sahmenko et al., 2024","N",null,0,null,50.0,"p"],[83.77,343.98,"s","s","Huang et al., 2024","P",null,0,null,50.0,"p"],[73.64,317.1,"s","s","Huang et al., 2024","P",null,0,null,50.0,"p"],[64.34,295.4,"s","s","Huang et al., 2024","P",null,0,null,50.0,"p"],[54.83,250.42,"s","s","Huang et al., 2024","P",null,0,null,50.0,"p"],[45.0,215.16,"s","s","Huang et al., 2024","P",null,0,null,50.0,"p"],[150.0,1614.0,"u","p","Sameer et al., 2019","P",null,0,null,90.0,"d"],[150.0,1702.0,"u","p","Sameer et al., 2019","P",null,0,null,90.0,"d"],[35.0,352.0,"s","p","Sameer et al., 2019","P",null,0,null,90.0,"d"],[50.0,422.0,"s","p","Sameer et al., 2019","P",null,0,null,90.0,"d"],[38.01,513.0,"o","p","Vitale et al., 2021","P",null,0,"portland_sem_tipo",50.0,"p"],[27.76,450.5,"r","p","Vitale et al., 2021","P",null,0,null,50.0,"p"],[78.18,39.55,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[65.89,36.68,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[80.51,47.05,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[81.7,44.18,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[52.6,41.3,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[80.46,54.55,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[76.9,51.68,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[70.4,48.8,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[46.24,45.93,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[34.53,71.93,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[23.04,64.43,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[45.96,74.8,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[37.8,67.3,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[28.8,59.8,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[55.64,77.68,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[47.1,70.18,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[40.6,62.68,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[36.8,55.18,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[85.09,69.55,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[97.75,74.18,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[86.4,78.8,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[70.53,83.43,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[80.68,62.05,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[72.44,66.68,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[71.93,71.3,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[70.84,75.93,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[70.22,80.55,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[80.43,59.18,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[67.22,63.8,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[65.14,68.43,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[56.34,73.05,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[34.02,58.66,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[22.4,51.16,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[68.44,63.43,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[52.08,55.93,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[46.76,48.43,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[74.12,68.2,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[66.19,60.7,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[60.17,53.2,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[56.47,45.7,"g","p","Faridmehr et al., 2021","N",null,0,null,50.0,"p"],[46.1,168.66,"o","p","Koci et al., 2021","P",null,0,"cem_i",50.0,"n"],[56.8,168.57,"r","p","Koci et al., 2021","P",null,0,null,50.0,"n"],[54.5,165.68,"r","p","Koci et al., 2021","P",null,0,null,50.0,"n"],[39.2,260.05,"g","p","Shi et al., 2021","N",null,0,null,50.0,"p"],[52.6,271.75,"g","p","Shi et al., 2021","N",null,0,null,50.0,"p"],[58.0,280.2,"g","p","Shi et al., 2021","N",null,0,null,50.0,"p"],[59.1,289.27,"g","p","Shi et al., 2021","N",null,0,null,50.0,"p"],[43.6,283.95,"g","p","Shi et al., 2021","N",null,0,null,50.0,"p"],[64.2,280.65,"g","p","Shi et al., 2021","N",null,0,null,50.0,"p"],[48.6,304.83,"g","p","Shi et al., 2021","N",null,0,null,50.0,"p"],[71.0,300.63,"g","p","Shi et al., 2021","N",null,0,null,50.0,"p"],[37.2,311.71,"g","p","Shi et al., 2021","N",null,0,null,50.0,"p"],[40.8,324.78,"g","p","Shi et al., 2021","N",null,0,null,50.0,"p"],[73.5,305.19,"g","p","Shi et al., 2021","N",null,0,null,50.0,"p"],[76.2,317.88,"g","p","Shi et al., 2021","N",null,0,null,50.0,"p"],[24.2,341.31,"g","p","Shi et al., 2021","N",null,0,null,50.0,"p"],[38.7,335.34,"g","p","Shi et al., 2021","N",null,0,null,50.0,"p"],[59.2,332.18,"g","p","Shi et al., 2021","N",null,0,null,50.0,"p"],[63.2,329.83,"g","p","Shi et al., 2021","N",null,0,null,50.0,"p"],[70.0,1390.0,"c","p","Mostert et al., 2022","P",null,0,null,80.0,"d"],[35.0,611.0,"c","p","Mostert et al., 2022","P",null,0,null,80.0,"d"],[56.68,396.0,"o","p","Garcia-Troncoso et al., 2023","P",null,0,"astm_c1157",50.0,"p"],[53.48,346.0,"r","p","Garcia-Troncoso et al., 2023","P",346.0,1,null,50.0,"p"],[54.72,334.0,"r","p","Garcia-Troncoso et al., 2023","P",334.0,1,null,50.0,"p"],[54.16,421.0,"r","p","Garcia-Troncoso et al., 2023","P",244.0,0,null,50.0,"p"],[33.2,331.0,"c","p","Pavlu et al., 2023","P",null,0,null,50.0,"n"],[30.0,303.0,"c","p","Pavlu et al., 2023","P",null,0,null,50.0,"n"],[34.4,226.0,"c","p","Pavlu et al., 2023","P",226.0,1,null,50.0,"n"],[44.9,366.0,"c","p","Pavlu et al., 2023","P",null,0,null,50.0,"n"],[38.0,338.0,"c","p","Pavlu et al., 2023","P",null,0,null,50.0,"n"],[42.9,265.0,"c","p","Pavlu et al., 2023","P",265.0,1,null,50.0,"n"],[30.61,400.0,"o","p","Anh et al., 2023","P",null,0,"cem_ii_a",50.0,"p"],[32.72,362.0,"s","p","Anh et al., 2023","P",null,0,null,50.0,"p"],[30.33,362.0,"s","p","Anh et al., 2023","P",null,0,null,50.0,"p"],[43.6,337.1,"o","s","Boukhelf et al., 2023","P",null,0,"cem_i",50.0,"p"],[25.7,71.0,"o","s","Boukhelf et al., 2023","P",null,0,"cem_iii",50.0,"p"],[27.4,168.3,"s","s","Boukhelf et al., 2023","P",null,0,null,50.0,"p"],[35.51,239.5,"o","p","Los Santos-Ortega et al., 2023","P",null,0,"cem_ii_a",50.0,"p"],[33.85,252.2,"o","p","Los Santos-Ortega et al., 2023","P",null,0,"cem_ii_a",50.0,"p"],[28.26,240.0,"r","p","Los Santos-Ortega et al., 2023","P",225.0,0,null,50.0,"p"],[59.4,235.5,"g","p","Ji et al., 2024","N",null,0,null,50.0,"p"],[39.54,300.41,"o","p","Los Santos-Ortega et al., 2024","P",null,0,"nao_declarado",50.0,"p"],[31.21,296.99,"r","p","Los Santos-Ortega et al., 2024","P",null,0,null,50.0,"p"],[82.07,487.3,"s","p","Skibicki et al., 2024","P",null,0,null,50.0,"p"],[74.06,393.8,"s","p","Skibicki et al., 2024","P",null,0,null,50.0,"p"],[41.61,253.6,"s","p","Skibicki et al., 2024","P",null,0,null,50.0,"p"],[57.92,1303.7,"s","p","Lv et al., 2024","P",null,0,null,50.0,"p"],[51.48,475.78,"o","p","Agrela et al., 2024","P",null,0,"cem_ii",50.0,"n"],[49.74,358.91,"s","p","Agrela et al., 2024","P",null,0,null,50.0,"n"],[43.85,360.21,"s","p","Agrela et al., 2024","P",null,0,null,50.0,"n"],[55.7,258.89,"o","p","Agrela et al., 2024","P",null,0,"cem_ii",50.0,"n"],[49.1,229.43,"s","p","Agrela et al., 2024","P",null,0,null,50.0,"n"],[43.0,233.71,"s","p","Agrela et al., 2024","P",null,0,null,50.0,"n"],[74.0,64.0,"g","p","Lemesre et al., 2024","N",null,0,null,50.0,"p"],[40.38,432.4,"o","p","Yao et al., 2024","P",429.6,0,"gb_po",50.0,"d"],[38.46,400.4,"s","p","Yao et al., 2024","P",396.2,0,null,50.0,"d"],[39.9,368.5,"s","p","Yao et al., 2024","P",363.2,0,null,50.0,"d"],[37.44,397.2,"r","p","Yao et al., 2024","P",390.7,0,null,50.0,"d"],[62.3,608.08,"g","p","Luo et al., 2023","N",null,0,null,50.0,"p"],[57.0,554.6,"g","p","Luo et al., 2023","N",null,0,null,50.0,"p"],[28.9,1191.41,"g","p","Luo et al., 2023","N",null,0,null,50.0,"p"],[53.6,742.69,"s","p","Sambucci et al., 2023","P",null,0,null,50.0,"p"],[45.57,420.9,"o","p","Kim et al., 2018","P",null,0,"astm_type_i",50.0,"p"],[39.19,387.3,"s","p","Kim et al., 2018","P",null,0,null,50.0,"p"],[39.45,383.8,"s","p","Kim et al., 2018","P",null,0,null,50.0,"p"],[40.1,383.1,"s","p","Kim et al., 2018","P",null,0,null,50.0,"p"],[37.6,353.7,"s","p","Kim et al., 2018","P",null,0,null,50.0,"p"],[37.08,346.7,"s","p","Kim et al., 2018","P",null,0,null,50.0,"p"],[38.16,345.4,"s","p","Kim et al., 2018","P",null,0,null,50.0,"p"],[35.98,320.2,"s","p","Kim et al., 2018","P",null,0,null,50.0,"p"],[37.0,309.7,"s","p","Kim et al., 2018","P",null,0,null,50.0,"p"],[35.83,307.7,"s","p","Kim et al., 2018","P",null,0,null,50.0,"p"],[76.18,289.69,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[42.31,261.38,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[43.66,287.44,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[47.8,168.62,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[52.92,185.5,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[34.42,137.49,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[73.29,273.84,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[48.04,213.57,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[32.38,168.67,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[62.11,219.71,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[46.41,184.14,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[33.46,136.12,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[70.21,413.66,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[59.79,254.91,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[55.11,206.89,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[77.11,394.23,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[59.32,277.09,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[51.88,229.08,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[76.65,292.48,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[59.61,240.03,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[49.35,191.95,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[80.51,316.68,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[38.93,129.31,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[29.6,123.53,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[78.03,375.77,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[60.53,297.07,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[48.67,249.01,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[65.17,181.5,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[33.57,130.65,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[32.98,193.77,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[74.53,346.99,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[35.78,142.92,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[27.67,156.84,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[72.94,288.54,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[49.59,194.48,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[34.38,146.43,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[65.23,253.1,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[47.87,263.4,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[40.32,215.33,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[53.52,202.2,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[58.71,210.77,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[39.09,162.71,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[68.28,283.75,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[36.87,275.29,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[36.16,227.28,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[89.58,273.78,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[63.82,239.75,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[43.24,186.09,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[76.11,384.25,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[44.84,223.12,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[23.32,93.77,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[32.21,276.3,"s","s","Cen et al., 2019","P",null,0,null,50.0,"p"],[24.0,429.0,"o","s","Na & Paik, 2019","P",null,0,"nao_declarado",40.0,"c"],[25.0,224.34,"o","s","Yepes et al., 2020","P",null,0,"portland_sem_tipo",100.0,"n"],[30.0,224.94,"o","s","Yepes et al., 2020","P",null,0,"portland_sem_tipo",100.0,"n"],[35.0,265.28,"o","s","Yepes et al., 2020","P",null,0,"portland_sem_tipo",100.0,"n"],[40.0,265.28,"o","s","Yepes et al., 2020","P",null,0,"portland_sem_tipo",100.0,"n"],[45.0,265.91,"o","s","Yepes et al., 2020","P",null,0,"portland_sem_tipo",100.0,"n"],[50.0,265.95,"o","s","Yepes et al., 2020","P",null,0,"portland_sem_tipo",100.0,"n"],[28.0,357.3,"o","s","Almulhim et al., 2020","P",null,0,"cem_i",50.0,"c"],[35.0,430.8,"c","p","Cejuela et al., 2020","P",null,0,null,100.0,"d"],[35.0,407.7,"c","p","Cejuela et al., 2020","P",null,0,null,100.0,"d"],[35.0,110.0,"c","p","Cejuela et al., 2020","P",null,0,null,100.0,"d"],[30.0,376.0,"o","s","Kayabekir et al., 2020","P",null,0,"nao_declarado",100.0,"n"],[30.0,143.48,"o","s","Kayabekir et al., 2020","P",null,0,"nao_declarado",100.0,"n"],[40.0,373.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[30.0,220.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[35.0,244.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[30.0,219.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[20.0,301.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[25.0,310.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[30.0,341.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[35.0,385.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[40.0,410.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[32.0,371.0,"o","p","Palumbo et al., 2020","P",null,0,"cem_i",50.0,"n"],[28.0,213.0,"s","p","Palumbo et al., 2020","P",null,0,null,50.0,"n"],[25.0,197.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[20.0,178.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[45.0,286.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[50.0,254.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[50.0,300.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[85.0,466.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[21.0,410.0,"o","p","Park et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[21.0,420.0,"o","p","Park et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[24.0,415.0,"o","p","Park et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[24.0,430.0,"o","p","Park et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[24.0,436.8,"o","p","Park et al., 2020","P",null,0,"nao_declarado",30.0,"c"],[40.5,268.9,"s","p","Fort et al., 2020","P",null,1,null,50.0,"p"],[35.5,342.5,"o","p","Tosic et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[35.5,348.0,"r","p","Tosic et al., 2020","P",null,0,null,50.0,"n"],[35.5,346.0,"r","p","Tosic et al., 2020","P",null,0,null,50.0,"n"],[40.5,373.5,"o","p","Tosic et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[40.5,373.0,"r","p","Tosic et al., 2020","P",null,0,null,50.0,"n"],[40.5,364.5,"r","p","Tosic et al., 2020","P",null,0,null,50.0,"n"],[30.0,430.8,"o","p","Alzard et al., 2021","P",null,0,"astm_type_i",50.0,"p"],[30.0,429.3,"r","p","Alzard et al., 2021","P",null,0,null,50.0,"p"],[30.0,487.3,"r","p","Alzard et al., 2021","P",null,0,null,50.0,"p"],[30.0,624.2,"r","p","Alzard et al., 2021","P",null,0,null,50.0,"p"],[30.0,503.2,"r","p","Alzard et al., 2021","P",null,0,null,50.0,"p"],[30.0,516.3,"r","p","Alzard et al., 2021","P",null,0,null,50.0,"p"],[30.0,301.8,"s","p","Alzard et al., 2021","P",null,0,null,50.0,"p"],[30.0,364.6,"s","p","Alzard et al., 2021","P",null,0,null,50.0,"p"],[30.0,390.2,"s","p","Alzard et al., 2021","P",null,0,null,50.0,"p"],[64.56,473.0,"g","p","Tang et al., 2021","N",null,0,null,50.0,"p"],[35.5,699.0,"o","p","Tang et al., 2021","P",null,0,"astm_type_i",50.0,"p"],[38.3,727.0,"r","p","Tang et al., 2021","P",null,0,null,50.0,"p"],[30.0,213.48,"o","p","Bertola et al., 2021","P",null,0,"cem_i",80.0,"d"],[28.0,264.18,"o","p","Imtiaz et al., 2021","P",null,0,"portland_sem_tipo",50.0,"p"],[28.0,261.31,"r","p","Imtiaz et al., 2021","P",null,0,null,50.0,"p"],[30.0,112.74,"g","p","Imtiaz et al., 2021","N",null,0,null,50.0,"p"],[27.0,111.38,"g","p","Imtiaz et al., 2021","N",null,0,null,50.0,"p"],[25.0,354.0,"o","p","Mariakova et al., 2022","P",350.47,0,"nao_declarado",50.0,"d"],[25.0,295.0,"r","p","Mariakova et al., 2022","P",291.47,1,null,50.0,"d"],[25.0,259.0,"r","p","Mariakova et al., 2022","P",255.47,1,null,50.0,"d"],[55.0,204.0,"g","p","Rabie et al., 2022","N",null,0,null,50.0,"p"],[30.0,280.66,"o","s","Li et al., 2022","P",null,0,"portland_sem_tipo",50.0,"n"],[35.3,413.9,"o","p","Ji et al., 2022","P",null,0,"cem_ii",50.0,"n"],[35.87,439.56,"o","p","Onyelowe et al., 2022","P",null,0,"portland_sem_tipo",50.0,"p"],[21.89,372.62,"o","p","Onyelowe et al., 2022","P",null,0,"portland_sem_tipo",50.0,"p"],[25.93,390.88,"o","p","Onyelowe et al., 2022","P",null,0,"portland_sem_tipo",50.0,"p"],[57.92,342.2,"o","p","Onyelowe et al., 2022","P",null,0,"portland_sem_tipo",50.0,"p"],[50.07,433.9,"o","p","Onyelowe et al., 2022","P",null,0,"portland_sem_tipo",50.0,"p"],[43.5,259.7,"o","p","Zhao et al., 2022","P",null,0,"cem_i",40.0,"d"],[46.5,258.5,"r","p","Zhao et al., 2022","P",null,0,null,40.0,"d"],[48.0,257.4,"r","p","Zhao et al., 2022","P",null,0,null,40.0,"d"],[45.0,252.2,"s","p","Zhao et al., 2022","P",null,0,null,40.0,"d"],[43.0,245.8,"s","p","Zhao et al., 2022","P",null,0,null,40.0,"d"],[46.0,251.0,"s","p","Zhao et al., 2022","P",null,0,null,40.0,"d"],[44.0,244.7,"s","p","Zhao et al., 2022","P",null,0,null,40.0,"d"],[41.45,417.36,"o","s","Lei et al., 2022","P",413.21,0,"gb_po",50.0,"p"],[29.15,394.06,"r","s","Lei et al., 2022","P",387.84,0,null,50.0,"p"],[45.0,229.5,"o","p","Kvocka et al., 2022","P",null,0,"cem_ii_b",100.0,"n"],[49.0,127.4,"o","p","Kvocka et al., 2022","P",null,0,"cem_iii",100.0,"n"],[45.0,247.5,"o","p","Kvocka et al., 2022","P",null,0,"cem_ii_b",100.0,"n"],[49.0,137.2,"o","p","Kvocka et al., 2022","P",null,0,"cem_iii",100.0,"n"],[42.0,251.9,"r","p","Kvocka et al., 2022","P",205.8,0,null,100.0,"n"],[39.0,151.7,"r","p","Kvocka et al., 2022","P",105.3,0,null,100.0,"n"],[42.0,271.0,"r","p","Kvocka et al., 2022","P",226.8,0,null,100.0,"n"],[37.0,158.2,"r","p","Kvocka et al., 2022","P",114.7,0,null,100.0,"n"],[60.0,447.4,"o","s","Wang et al., 2023","P",null,0,"nao_declarado",100.0,"n"],[70.13,335.09,"r","s","Starczyk-Kolbyk & Malek, 2023","P",null,0,null,50.0,"n"],[58.0,767.4,"c","p","Backes et al., 2023","P",713.5,0,null,100.0,"d"],[58.0,914.9,"c","p","Backes et al., 2023","P",861.1,0,null,100.0,"d"],[35.0,427.1,"c","p","Backes et al., 2023","P",427.1,1,null,50.0,"d"],[47.6,393.09,"o","p","Moro, 2023","P",null,0,"portland_sem_tipo",50.0,"p"],[54.9,324.93,"s","p","Moro, 2023","P",null,0,null,50.0,"p"],[42.7,299.49,"s","p","Moro, 2023","P",null,0,null,50.0,"p"],[56.0,358.03,"s","p","Moro, 2023","P",null,0,null,50.0,"p"],[44.4,378.37,"r","p","Moro, 2023","P",369.73,0,null,50.0,"p"],[53.2,310.21,"r","p","Moro, 2023","P",301.57,0,null,50.0,"p"],[40.1,284.77,"r","p","Moro, 2023","P",276.13,0,null,50.0,"p"],[49.3,343.31,"r","p","Moro, 2023","P",334.67,0,null,50.0,"p"],[44.3,363.66,"r","p","Moro, 2023","P",346.38,0,null,50.0,"p"],[50.7,295.5,"r","p","Moro, 2023","P",278.22,0,null,50.0,"p"],[41.6,270.06,"r","p","Moro, 2023","P",252.78,0,null,50.0,"p"],[53.2,328.59,"r","p","Moro, 2023","P",311.31,0,null,50.0,"p"],[43.3,238.0,"g","p","Amari et al., 2024","N",null,0,null,50.0,"p"],[37.9,305.81,"o","p","Ma et al., 2024","P",null,0,"nao_declarado",100.0,"d"],[34.5,288.23,"o","p","Ma et al., 2024","P",null,0,"nao_declarado",100.0,"d"],[34.5,353.21,"o","p","Ma et al., 2024","P",null,0,"nao_declarado",100.0,"d"],[68.9,344.04,"o","p","Ma et al., 2024","P",null,0,"nao_declarado",100.0,"d"],[82.7,412.84,"o","p","Ma et al., 2024","P",null,0,"nao_declarado",100.0,"d"],[55.2,318.81,"o","p","Ma et al., 2024","P",null,0,"nao_declarado",100.0,"d"],[41.4,270.64,"o","p","Ma et al., 2024","P",null,0,"nao_declarado",100.0,"d"],[40.0,288.9,"o","s","Shi et al., 2024","P",null,0,"nao_declarado",100.0,"n"],[60.0,222.3,"o","s","Shi et al., 2024","P",null,0,"nao_declarado",100.0,"n"],[60.0,1165.0,"g","p","Roux et al., 2024","N",null,0,null,50.0,"p"],[44.0,528.0,"g","p","Roux et al., 2024","N",null,0,null,50.0,"p"],[41.7,489.7,"o","p","Ring et al., 2024","P",null,0,"cem_i",50.0,"p"],[41.5,478.1,"s","p","Ring et al., 2024","P",null,0,null,50.0,"p"],[37.2,466.4,"s","p","Ring et al., 2024","P",null,0,null,50.0,"p"],[37.0,443.1,"s","p","Ring et al., 2024","P",null,0,null,50.0,"p"],[34.6,419.8,"s","p","Ring et al., 2024","P",null,0,null,50.0,"p"],[20.0,237.32,"o","p","Zhao et al., 2024","P",null,0,"nao_declarado",50.0,"d"],[25.0,266.18,"o","p","Zhao et al., 2024","P",null,0,"nao_declarado",50.0,"d"],[30.0,295.0,"o","p","Zhao et al., 2024","P",null,0,"nao_declarado",50.0,"d"],[35.0,362.6,"o","p","Zhao et al., 2024","P",null,0,"nao_declarado",50.0,"d"],[50.0,511.0,"o","p","Zhao et al., 2024","P",null,0,"nao_declarado",50.0,"d"],[40.0,446.0,"c","p","Jolly et al., 2024","P",425.5,0,null,75.0,"d"],[30.0,420.2,"o","s","Ali et al., 2024","P",null,0,"nao_declarado",50.0,"d"],[72.9,196.0,"g","p","Almonayea et al., 2025","N",null,0,null,50.0,"p"],[70.0,185.0,"g","p","Almonayea et al., 2025","N",null,0,null,50.0,"p"],[71.0,230.0,"l","p","Roy et al., 2025","N",null,0,null,50.0,"n"],[50.0,92.0,"s","p","Cho & Chae, 2016","P",null,0,null,30.0,"d"],[50.0,145.0,"s","p","Cho & Chae, 2016","P",null,0,null,30.0,"d"],[50.0,149.0,"l","p","Cho & Chae, 2016","N",null,0,null,30.0,"d"],[24.0,253.6,"o","p","Cho & Chae, 2016","P",null,0,"nao_declarado",30.0,"d"],[24.0,329.37,"o","p","Baek et al., 2016","P",null,0,"nao_declarado",80.0,"d"],[27.0,353.02,"o","p","Baek et al., 2016","P",null,0,"nao_declarado",80.0,"d"],[30.0,383.77,"o","p","Baek et al., 2016","P",null,0,"nao_declarado",80.0,"d"],[35.0,406.71,"o","p","Baek et al., 2016","P",null,0,"nao_declarado",80.0,"d"],[40.0,429.65,"o","p","Baek et al., 2016","P",null,0,"nao_declarado",80.0,"d"],[50.0,508.39,"o","p","Baek et al., 2016","P",null,0,"nao_declarado",80.0,"d"],[25.0,432.8,"o","p","Abd Rashid et al., 2017","P",null,0,"nao_declarado",50.0,"d"],[35.0,451.4,"c","p","Penades-Pla et al., 2017","P",349.8,0,null,150.0,"d"],[50.0,558.3,"c","p","Penades-Pla et al., 2017","P",419.2,0,null,150.0,"d"],[24.0,364.9,"o","p","Kim et al., 2017","P",null,0,"portland_sem_tipo",50.0,"n"],[30.0,365.4,"s","p","Kim et al., 2017","P",null,0,null,50.0,"n"],[25.0,345.0,"o","p","Haigh, 2025","P",null,0,"as_gp",50.0,"n"],[29.0,315.0,"s","p","Haigh, 2025","P",null,0,null,50.0,"n"],[32.0,304.0,"s","p","Haigh, 2025","P",null,0,null,50.0,"n"],[25.0,264.62,"r","s","Kocak et al., 2024","P",null,0,null,50.0,"p"],[25.0,273.18,"o","s","Kocak et al., 2024","P",null,0,"cem_i",50.0,"p"],[25.0,302.39,"o","s","Mel et al., 2015","P",null,0,"portland_sem_tipo",50.0,"p"],[30.0,259.0,"o","p","Oh et al., 2023","P",null,0,"nao_declarado",50.0,"d"],[25.7,546.72,"g","s","Damrongwiriyanupap et al., 2022","N",null,0,null,50.0,"p"],[46.8,546.72,"g","s","Damrongwiriyanupap et al., 2022","N",null,0,null,50.0,"p"],[29.3,480.53,"g","s","Damrongwiriyanupap et al., 2022","N",null,0,null,50.0,"p"],[48.7,480.54,"g","s","Damrongwiriyanupap et al., 2022","N",null,0,null,50.0,"p"],[30.3,414.34,"g","s","Damrongwiriyanupap et al., 2022","N",null,0,null,50.0,"p"],[47.1,414.35,"g","s","Damrongwiriyanupap et al., 2022","N",null,0,null,50.0,"p"],[30.4,348.15,"g","s","Damrongwiriyanupap et al., 2022","N",null,0,null,50.0,"p"],[49.2,348.17,"g","s","Damrongwiriyanupap et al., 2022","N",null,0,null,50.0,"p"],[31.7,281.97,"g","s","Damrongwiriyanupap et al., 2022","N",null,0,null,50.0,"p"],[51.4,281.99,"g","s","Damrongwiriyanupap et al., 2022","N",null,0,null,50.0,"p"],[30.0,566.63,"c","p","Menna Barreto et al., 2021","P",553.05,0,null,48.6,"d"],[30.0,598.68,"c","p","Menna Barreto et al., 2021","P",581.71,0,null,76.0,"d"],[30.0,602.69,"c","p","Menna Barreto et al., 2021","P",582.32,0,null,109.5,"d"],[30.0,636.8,"c","p","Hajiesmaeili et al., 2019","P",null,0,null,100.0,"d"],[34.4,642.67,"c","p","Kontra et al., 2023","P",674.81,0,null,50.0,"n"],[35.0,364.0,"o","p","Jones & Li, 2024","P",null,0,"nao_declarado",25.0,"d"],[40.0,340.0,"o","s","Meng et al., 2023","P",null,0,"nao_declarado",100.0,"n"],[37.1,469.8,"s","p","Cunningham et al., 2021","P",null,0,null,50.0,"p"],[29.6,469.8,"s","p","Cunningham et al., 2021","P",null,0,null,50.0,"p"],[31.6,469.8,"s","p","Cunningham et al., 2021","P",null,0,null,50.0,"p"],[28.3,469.8,"s","p","Cunningham et al., 2021","P",null,0,null,50.0,"p"],[27.0,469.8,"s","p","Cunningham et al., 2021","P",null,0,null,50.0,"p"],[25.9,469.8,"s","p","Cunningham et al., 2021","P",null,0,null,50.0,"p"],[22.2,469.8,"s","p","Cunningham et al., 2021","P",null,0,null,50.0,"p"],[31.4,469.8,"s","p","Cunningham et al., 2021","P",null,0,null,50.0,"p"],[34.2,469.8,"s","p","Cunningham et al., 2021","P",null,0,null,50.0,"p"],[27.2,469.8,"s","p","Cunningham et al., 2021","P",null,0,null,50.0,"p"],[29.2,469.8,"s","p","Cunningham et al., 2021","P",null,0,null,50.0,"p"],[31.4,469.8,"s","p","Cunningham et al., 2021","P",null,0,null,50.0,"p"],[27.7,469.8,"s","p","Cunningham et al., 2021","P",null,0,null,50.0,"p"],[23.5,469.8,"s","p","Cunningham et al., 2021","P",null,0,null,50.0,"p"],[34.5,469.8,"s","p","Cunningham et al., 2021","P",null,0,null,50.0,"p"],[27.7,469.8,"s","p","Cunningham et al., 2021","P",null,0,null,50.0,"p"],[20.0,201.38,"o","p","Li & Zhu, 2022","P",null,0,"nao_declarado",50.0,"d"],[25.0,250.54,"o","p","Li & Zhu, 2022","P",null,0,"nao_declarado",50.0,"d"],[30.0,306.78,"o","p","Li & Zhu, 2022","P",null,0,"nao_declarado",50.0,"d"],[40.0,391.03,"o","p","Li & Zhu, 2022","P",null,0,"nao_declarado",50.0,"d"],[30.0,702.9,"c","s","Mitterpach et al., 2023","P",null,0,null,100.0,"n"],[30.0,493.3,"c","s","Mitterpach et al., 2023","P",null,0,null,100.0,"n"],[30.0,379.4,"c","s","Mitterpach et al., 2023","P",null,0,null,100.0,"n"],[25.0,230.5,"o","p","Sameer et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[25.0,137.9,"r","p","Sameer et al., 2020","P",null,0,null,50.0,"n"],[25.0,232.8,"o","p","Sameer et al., 2020","P",null,0,"nao_declarado",50.0,"n"],[25.0,238.2,"r","p","Sameer et al., 2020","P",null,0,null,50.0,"n"],[25.0,521.1,"r","p","Zhang et al., 2023","P",null,0,null,100.0,"n"],[25.0,514.7,"r","p","Zhang et al., 2023","P",null,0,null,100.0,"n"],[25.0,489.1,"r","p","Zhang et al., 2023","P",null,0,null,100.0,"n"],[25.0,477.5,"r","p","Zhang et al., 2023","P",null,0,null,100.0,"n"],[25.0,457.1,"r","p","Zhang et al., 2023","P",null,0,null,100.0,"n"],[25.0,409.9,"r","p","Zhang et al., 2023","P",null,0,null,100.0,"n"],[25.0,391.0,"r","p","Zhang et al., 2023","P",null,0,null,100.0,"n"],[25.0,519.6,"r","p","Zhang et al., 2023","P",null,0,null,100.0,"n"],[25.0,514.7,"r","p","Zhang et al., 2023","P",null,0,null,100.0,"n"],[25.0,519.6,"r","p","Zhang et al., 2023","P",null,0,null,100.0,"n"],[25.0,517.1,"r","p","Zhang et al., 2023","P",null,0,null,100.0,"n"],[25.0,489.1,"r","p","Zhang et al., 2023","P",null,0,null,100.0,"n"],[42.5,347.2,"o","p","Rathnarajan et al., 2025","P",null,0,"cem_i",50.0,"p"],[44.5,348.8,"o","p","Rathnarajan et al., 2025","P",null,0,"cem_i",50.0,"p"],[44.8,256.9,"s","p","Rathnarajan et al., 2025","P",null,0,null,50.0,"p"],[42.0,257.9,"s","p","Rathnarajan et al., 2025","P",null,0,null,50.0,"p"],[50.0,256.3,"s","p","Rathnarajan et al., 2025","P",null,0,null,50.0,"p"],[46.0,258.2,"s","p","Rathnarajan et al., 2025","P",null,0,null,50.0,"p"],[55.0,301.2,"s","p","Rathnarajan et al., 2025","P",null,0,null,50.0,"p"],[65.0,280.5,"s","p","Rathnarajan et al., 2025","P",null,0,null,50.0,"p"],[60.0,281.3,"s","p","Rathnarajan et al., 2025","P",null,0,null,50.0,"p"],[45.7,249.1,"s","p","Rathnarajan et al., 2025","P",null,0,null,50.0,"p"],[43.6,249.8,"s","p","Rathnarajan et al., 2025","P",null,0,null,50.0,"p"],[54.0,273.4,"s","p","Rathnarajan et al., 2025","P",null,0,null,50.0,"p"],[52.0,274.1,"s","p","Rathnarajan et al., 2025","P",null,0,null,50.0,"p"],[53.5,235.8,"s","p","Rathnarajan et al., 2025","P",null,0,null,50.0,"p"],[55.0,236.3,"s","p","Rathnarajan et al., 2025","P",null,0,null,50.0,"p"],[50.5,296.8,"s","p","Rathnarajan et al., 2025","P",null,0,null,50.0,"p"],[52.0,297.6,"s","p","Rathnarajan et al., 2025","P",null,0,null,50.0,"p"],[44.0,270.9,"s","p","Rathnarajan et al., 2025","P",null,0,null,50.0,"p"],[50.8,271.4,"s","p","Rathnarajan et al., 2025","P",null,0,null,50.0,"p"],[73.2,1080.0,"g","p","Abdel-Gawwad et al., 2024","N",null,0,null,50.0,"p"],[65.2,625.0,"g","p","Abdel-Gawwad et al., 2024","N",null,0,null,50.0,"p"],[30.3,606.0,"g","p","Abdel-Gawwad et al., 2024","N",null,0,null,50.0,"p"],[72.3,888.0,"g","p","Abdel-Gawwad et al., 2024","N",null,0,null,50.0,"p"],[68.6,613.0,"g","p","Abdel-Gawwad et al., 2024","N",null,0,null,50.0,"p"],[22.1,331.0,"g","p","Abdel-Gawwad et al., 2024","N",null,0,null,50.0,"p"],[34.8,580.0,"g","p","Abdel-Gawwad et al., 2024","N",null,0,null,50.0,"p"],[67.7,613.0,"g","p","Abdel-Gawwad et al., 2024","N",null,0,null,50.0,"p"],[85.0,867.0,"g","p","Abdel-Gawwad et al., 2024","N",null,0,null,50.0,"p"],[61.8,620.0,"g","p","Abdel-Gawwad et al., 2024","N",null,0,null,50.0,"p"],[35.9,360.0,"g","p","Abdel-Gawwad et al., 2024","N",null,0,null,50.0,"p"],[32.0,795.2,"c","p","Villalba et al., 2024","P",null,0,null,50.0,"d"],[58.7,438.0,"s","s","Kanagaraj et al., 2023","P",null,0,null,50.0,"d"],[57.0,289.5,"l","p","Spagnuolo & Meda, 2024","N",null,0,null,100.0,"n"],[48.0,297.7,"o","p","Spagnuolo & Meda, 2024","P",null,0,"cem_iv",100.0,"n"],[46.89,185.0,"g","p","Irshidat et al., 2021","N",null,1,null,50.0,"p"],[42.45,183.2,"g","p","Irshidat et al., 2021","N",null,1,null,50.0,"p"],[39.72,186.1,"g","p","Irshidat et al., 2021","N",null,1,null,50.0,"p"],[34.73,182.2,"g","p","Irshidat et al., 2021","N",null,1,null,50.0,"p"],[41.41,187.1,"g","p","Irshidat et al., 2021","N",null,1,null,50.0,"p"],[35.23,181.1,"g","p","Irshidat et al., 2021","N",null,1,null,50.0,"p"],[45.9,188.1,"g","p","Irshidat et al., 2021","N",null,1,null,50.0,"p"],[27.92,180.1,"g","p","Irshidat et al., 2021","N",null,1,null,50.0,"p"],[43.28,190.2,"g","p","Irshidat et al., 2021","N",null,1,null,50.0,"p"],[26.58,178.0,"g","p","Irshidat et al., 2021","N",null,1,null,50.0,"p"],[41.63,192.1,"g","p","Irshidat et al., 2021","N",null,1,null,50.0,"p"],[25.27,176.2,"g","p","Irshidat et al., 2021","N",null,1,null,50.0,"p"],[44.52,217.55,"s","s","Amran et al., 2022","P",null,0,null,50.0,"p"],[40.0,408.0,"o","p","Arruda Junior et al., 2023","P",null,0,"cem_i",50.0,"p"],[44.0,343.2,"o","p","Arruda Junior et al., 2023","P",null,0,"cem_ii",50.0,"p"],[57.0,279.3,"s","p","Arruda Junior et al., 2023","P",null,0,null,50.0,"p"],[52.0,275.6,"s","p","Arruda Junior et al., 2023","P",null,0,null,50.0,"p"],[49.0,274.4,"s","p","Arruda Junior et al., 2023","P",null,0,null,50.0,"p"],[44.0,228.8,"s","p","Arruda Junior et al., 2023","P",null,0,null,50.0,"p"],[42.0,222.6,"s","p","Arruda Junior et al., 2023","P",null,0,null,50.0,"p"],[39.0,216.4,"s","p","Arruda Junior et al., 2023","P",null,0,null,50.0,"p"],[53.9,417.9,"o","p","Vaclavik et al., 2024","P",null,0,"cem_i",50.0,"p"],[49.4,376.5,"s","p","Vaclavik et al., 2024","P",null,0,null,50.0,"p"],[38.0,335.2,"s","p","Vaclavik et al., 2024","P",null,0,null,50.0,"p"],[29.8,293.9,"s","p","Vaclavik et al., 2024","P",null,0,null,50.0,"p"],[56.2,342.3,"o","p","Vaclavik et al., 2024","P",null,0,"cem_ii_a",50.0,"p"],[47.0,308.5,"s","p","Vaclavik et al., 2024","P",null,0,null,50.0,"p"],[43.1,274.7,"s","p","Vaclavik et al., 2024","P",null,0,null,50.0,"p"],[34.8,241.0,"s","p","Vaclavik et al., 2024","P",null,0,null,50.0,"p"],[51.5,273.0,"o","p","Vaclavik et al., 2024","P",null,0,"cem_iii",50.0,"p"],[49.2,246.2,"s","p","Vaclavik et al., 2024","P",null,0,null,50.0,"p"],[36.0,219.3,"s","p","Vaclavik et al., 2024","P",null,0,null,50.0,"p"],[26.6,192.5,"s","p","Vaclavik et al., 2024","P",null,0,null,50.0,"p"],[52.4,307.2,"o","p","Vaclavik et al., 2024","P",null,0,"cem_v",50.0,"p"],[48.5,276.9,"s","p","Vaclavik et al., 2024","P",null,0,null,50.0,"p"],[40.3,246.6,"s","p","Vaclavik et al., 2024","P",null,0,null,50.0,"p"],[32.4,216.4,"s","p","Vaclavik et al., 2024","P",null,0,null,50.0,"p"],[56.8,377.2,"s","p","Vaclavik et al., 2024","P",null,0,null,50.0,"p"],[48.0,336.6,"s","p","Vaclavik et al., 2024","P",null,0,null,50.0,"p"],[44.0,295.9,"s","p","Vaclavik et al., 2024","P",null,0,null,50.0,"p"],[53.6,309.2,"s","p","Vaclavik et al., 2024","P",null,0,null,50.0,"p"],[45.1,276.1,"s","p","Vaclavik et al., 2024","P",null,0,null,50.0,"p"],[37.9,243.0,"s","p","Vaclavik et al., 2024","P",null,0,null,50.0,"p"],[47.5,246.9,"s","p","Vaclavik et al., 2024","P",null,0,null,50.0,"p"],[40.9,220.7,"s","p","Vaclavik et al., 2024","P",null,0,null,50.0,"p"],[34.3,194.5,"s","p","Vaclavik et al., 2024","P",null,0,null,50.0,"p"],[51.3,277.6,"s","p","Vaclavik et al., 2024","P",null,0,null,50.0,"p"],[42.5,248.0,"s","p","Vaclavik et al., 2024","P",null,0,null,50.0,"p"],[36.2,218.4,"s","p","Vaclavik et al., 2024","P",null,0,null,50.0,"p"],[40.0,322.14,"o","p","Wu et al., 2024","P",null,0,"nao_declarado",100.0,"d"],[35.0,292.45,"o","p","Wu et al., 2024","P",null,0,"nao_declarado",100.0,"d"],[30.0,273.29,"o","p","Wu et al., 2024","P",null,0,"nao_declarado",100.0,"d"],[25.0,243.04,"o","p","Wu et al., 2024","P",null,0,"nao_declarado",100.0,"d"],[20.0,211.45,"o","p","Wu et al., 2024","P",null,0,"nao_declarado",100.0,"d"],[35.0,341.8,"c","p","Almirall et al., 2019","P",null,0,null,50.0,"n"],[35.0,534.7,"c","p","Almirall et al., 2019","P",null,0,null,50.0,"n"],[55.5,372.5,"r","p","Dadd et al., 2025","P",null,0,null,50.0,"p"],[47.91,335.0,"r","p","Dadd et al., 2025","P",null,0,null,50.0,"p"],[48.26,350.4,"r","p","Dadd et al., 2025","P",null,0,null,50.0,"p"],[35.0,693.0,"o","p","Teixeira et al., 2016","P",null,0,"portland_sem_tipo",50.0,"p"],[37.5,520.0,"s","p","Teixeira et al., 2016","P",null,0,null,50.0,"p"],[25.0,248.0,"o","p","Zastrow et al., 2017","P",null,0,"portland_sem_tipo",100.0,"d"],[35.0,361.0,"o","p","Jones & Li, 2023","P",null,0,"nao_declarado",25.0,"d"],[30.0,370.0,"c","s","Kuepfer et al., 2024","P",null,0,null,50.0,"n"],[30.0,248.0,"s","p","Driessen & Gronlund, 2024","P",null,0,null,50.0,"p"],[30.0,211.0,"s","p","Driessen & Gronlund, 2024","P",null,0,null,50.0,"p"],[20.0,340.23,"c","p","Tushar et al., 2023","P",null,0,null,50.0,"n"],[20.0,347.59,"c","p","Tushar et al., 2023","P",null,1,null,50.0,"n"],[20.0,338.45,"c","p","Tushar et al., 2023","P",null,1,null,50.0,"n"],[20.0,275.28,"c","p","Tushar et al., 2023","P",null,0,null,50.0,"n"],[20.0,281.69,"c","p","Tushar et al., 2023","P",null,0,null,50.0,"n"],[20.0,272.66,"c","p","Tushar et al., 2023","P",null,1,null,50.0,"n"],[20.0,279.9,"c","p","Tushar et al., 2023","P",null,1,null,50.0,"n"],[40.0,316.0,"o","p","Malami et al., 2024","P",297.53,0,"cem_i",100.0,"d"],[40.0,249.8,"s","p","Malami et al., 2024","P",233.97,0,null,100.0,"d"],[40.0,132.61,"s","p","Malami et al., 2024","P",122.28,0,null,100.0,"d"],[26.81,720.0,"o","p","Cunningham & Miller, 2020","P",null,0,"astm_type_ii_v",50.0,"p"],[26.41,537.0,"s","p","Cunningham & Miller, 2020","P",null,0,null,50.0,"p"],[21.54,493.0,"s","p","Cunningham & Miller, 2020","P",null,0,null,50.0,"p"],[25.0,250.0,"r","p","Mostert et al., 2020","P",null,0,null,50.0,"n"],[48.9,375.0,"s","p","Tian et al., 2024","P",null,0,null,50.0,"p"],[31.5,352.0,"s","p","Tian et al., 2024","P",null,0,null,50.0,"p"],[36.5,352.0,"s","p","Tian et al., 2024","P",null,0,null,50.0,"p"],[25.0,308.0,"s","p","Tian et al., 2024","P",null,0,null,50.0,"p"],[29.5,332.0,"s","p","Tian et al., 2024","P",null,0,null,50.0,"p"],[49.5,373.9,"o","p","Radovic et al., 2022","P",null,0,"cem_i",50.0,"d"],[50.0,315.7,"s","p","Radovic et al., 2022","P",null,0,null,50.0,"d"],[45.4,279.6,"s","p","Radovic et al., 2022","P",null,0,null,50.0,"d"],[46.4,256.7,"s","p","Radovic et al., 2022","P",null,0,null,50.0,"d"],[50.1,315.8,"s","p","Radovic et al., 2022","P",null,0,null,50.0,"d"],[61.8,285.0,"s","p","Radovic et al., 2022","P",null,0,null,50.0,"d"],[56.5,345.0,"o","p","Radovic et al., 2022","P",null,0,"cem_i",50.0,"d"],[52.3,276.4,"s","p","Radovic et al., 2022","P",null,0,null,50.0,"d"],[43.7,310.6,"s","p","Radovic et al., 2022","P",null,0,null,50.0,"d"],[58.0,285.3,"s","p","Radovic et al., 2022","P",null,0,null,50.0,"d"],[55.1,313.4,"s","p","Radovic et al., 2022","P",null,0,null,50.0,"d"],[64.0,438.8,"o","p","Radovic et al., 2022","P",null,0,"cem_i",50.0,"d"],[53.6,392.4,"o","p","Radovic et al., 2022","P",null,0,"cem_i",50.0,"d"],[43.0,347.8,"o","p","Radovic et al., 2022","P",null,0,"cem_i",50.0,"d"],[53.9,392.0,"s","p","Radovic et al., 2022","P",null,0,null,50.0,"d"],[45.0,351.3,"s","p","Radovic et al., 2022","P",null,0,null,50.0,"d"],[36.9,313.0,"s","p","Radovic et al., 2022","P",null,0,null,50.0,"d"],[50.6,361.6,"s","p","Radovic et al., 2022","P",null,0,null,50.0,"d"],[58.7,380.5,"o","p","Radovic et al., 2022","P",null,0,"cem_i",50.0,"d"],[47.2,361.5,"o","p","Radovic et al., 2022","P",null,0,"cem_i",50.0,"d"],[49.7,337.2,"s","p","Radovic et al., 2022","P",null,0,null,50.0,"d"],[42.4,321.6,"s","p","Radovic et al., 2022","P",null,0,null,50.0,"d"],[47.5,395.6,"o","p","Radovic et al., 2022","P",null,0,"cem_i",50.0,"d"],[43.2,355.1,"s","p","Radovic et al., 2022","P",null,0,null,50.0,"d"],[35.6,327.6,"s","p","Radovic et al., 2022","P",null,0,null,50.0,"d"],[34.47,537.9,"c","p","Tushar et al., 2022","P",null,0,null,60.0,"d"],[34.47,515.9,"c","p","Tushar et al., 2022","P",null,0,null,60.0,"d"],[34.47,440.6,"c","p","Tushar et al., 2022","P",null,0,null,60.0,"d"],[34.47,650.6,"c","p","Tushar et al., 2022","P",null,0,null,60.0,"d"],[34.47,539.8,"c","p","Tushar et al., 2022","P",null,0,null,60.0,"d"],[34.47,517.6,"c","p","Tushar et al., 2022","P",null,0,null,60.0,"d"],[34.47,429.0,"c","p","Tushar et al., 2022","P",null,0,null,60.0,"d"],[20.68,536.1,"c","p","Tushar et al., 2022","P",null,0,null,60.0,"d"],[20.68,517.8,"c","p","Tushar et al., 2022","P",null,0,null,60.0,"d"],[20.68,444.7,"c","p","Tushar et al., 2022","P",null,0,null,60.0,"d"],[20.68,503.0,"c","p","Tushar et al., 2022","P",null,0,null,60.0,"d"],[20.68,561.3,"c","p","Tushar et al., 2022","P",null,0,null,60.0,"d"],[34.47,557.9,"c","p","Tushar et al., 2022","P",null,0,null,60.0,"d"],[34.47,535.9,"c","p","Tushar et al., 2022","P",null,0,null,60.0,"d"],[34.47,447.9,"c","p","Tushar et al., 2022","P",null,0,null,60.0,"d"],[34.47,507.0,"c","p","Tushar et al., 2022","P",null,0,null,60.0,"d"],[34.47,566.0,"c","p","Tushar et al., 2022","P",null,0,null,60.0,"d"],[27.4,287.0,"r","p","Pavlů et al., 2025","P",160.2,0,null,50.0,"n"],[28.0,270.0,"s","s","Pineda et al., 2025","P",null,0,null,50.0,"p"],[35.5,208.0,"r","p","Pushkar et al., 2022","P",null,0,null,50.0,"c"],[32.46,264.1,"o","p","Los Santos-Ortega et al., 2023","P",null,0,"cem_ii_a",50.0,"p"],[29.12,264.1,"o","p","Los Santos-Ortega et al., 2023","P",null,0,"cem_ii_a",50.0,"p"],[24.13,245.9,"o","p","Los Santos-Ortega et al., 2023","P",null,0,"cem_ii_a",50.0,"p"],[40.0,525.8,"c","p","Penadés-Plà et al., 2018","P",428.2,0,null,120.0,"d"],[20.0,234.64,"o","s","Li et al., 2022","P",null,0,"portland_sem_tipo",50.0,"n"],[25.0,245.98,"o","s","Li et al., 2022","P",null,0,"portland_sem_tipo",50.0,"n"],[35.0,326.62,"o","s","Li et al., 2022","P",null,0,"portland_sem_tipo",50.0,"n"],[40.0,363.03,"o","s","Li et al., 2022","P",null,0,"portland_sem_tipo",50.0,"n"],[45.0,399.45,"o","s","Li et al., 2022","P",null,0,"portland_sem_tipo",50.0,"n"],[39.39,412.71,"r","s","Lei et al., 2022","P",408.27,0,null,50.0,"p"],[36.78,408.03,"r","s","Lei et al., 2022","P",403.24,0,null,50.0,"p"],[34.15,403.38,"r","s","Lei et al., 2022","P",398.2,0,null,50.0,"p"],[35.03,398.7,"r","s","Lei et al., 2022","P",393.04,0,null,50.0,"p"],[30.0,540.0,"c","p","Bento, 2016","P",529.0,0,null,50.0,"d"],[35.0,602.4,"c","p","Bento, 2016","P",590.8,0,null,50.0,"d"],[45.0,680.0,"c","p","Bento, 2016","P",667.1,0,null,50.0,"d"],[25.0,295.0,"o","p","Lara, 2024","P",null,0,"nao_declarado",50.0,"c"],[35.0,283.5,"c","p","Studzinski et al., 2024","P",null,0,null,50.0,"n"],[35.0,278.7,"c","p","Studzinski et al., 2024","P",null,0,null,50.0,"n"],[35.0,322.1,"c","p","Studzinski et al., 2024","P",null,0,null,50.0,"n"],[35.0,311.7,"c","p","Studzinski et al., 2024","P",null,0,null,50.0,"n"],[60.15,1303.7,"s","p","Lv et al., 2024","P",null,0,null,50.0,"p"],[42.15,1246.9,"s","p","Lv et al., 2024","P",null,0,null,50.0,"p"],[26.6,293.0,"l","s","Sahmenko et al., 2024","N",null,0,null,50.0,"p"],[35.5,316.0,"r","p","Jimenez et al., 2015","P",null,0,null,50.0,"p"],[41.2,410.0,"o","p","Jimenez et al., 2015","P",null,0,"cem_i",50.0,"p"],[43.7,381.0,"r","p","Jimenez et al., 2015","P",null,0,null,50.0,"p"],[33.1,359.8,"s","p","Manan et al., 2024","P",null,0,null,50.0,"p"],[80.0,401.78,"o","p","Lin et al., 2025","P",null,0,"nao_declarado",50.0,"p"],[40.6,192.0,"g","p","Hussain et al., 2025","N",null,0,null,30.0,"c"],[42.2,192.0,"g","p","Hussain et al., 2025","N",null,0,null,30.0,"c"],[35.5,284.4,"g","p","Nguyen et al., 2020","N",null,0,null,50.0,"p"],[36.9,288.5,"g","p","Nguyen et al., 2020","N",null,0,null,50.0,"p"],[75.87,104.0,"g","p","Sposito, 2024","N",null,0,null,50.0,"n"],[90.38,112.0,"g","p","Sposito, 2024","N",null,0,null,50.0,"n"],[77.45,93.5,"g","p","Sposito, 2024","N",93.5,1,null,50.0,"n"],[86.35,93.9,"g","p","Sposito, 2024","N",93.9,1,null,50.0,"n"],[61.0,93.9,"g","p","Sposito, 2024","N",93.9,1,null,50.0,"n"],[47.5,250.2,"s","p","Buffenbarger et al., 2023","P",null,0,null,50.0,"n"],[61.7,310.7,"s","p","Buffenbarger et al., 2023","P",null,0,null,50.0,"n"],[45.7,222.1,"s","p","Buffenbarger et al., 2023","P",null,0,null,50.0,"n"],[51.2,245.7,"s","p","Buffenbarger et al., 2023","P",null,0,null,50.0,"n"],[48.89,482.2,"o","p","Cunningham et al., 2025","P",null,0,"portland_sem_tipo",50.0,"p"],[50.49,459.8,"s","p","Cunningham et al., 2025","P",457.1,0,null,50.0,"p"],[45.55,459.9,"s","p","Cunningham et al., 2025","P",456.3,0,null,50.0,"p"],[43.95,416.2,"s","p","Cunningham et al., 2025","P",408.0,0,null,50.0,"p"],[26.54,416.2,"s","p","Cunningham et al., 2025","P",405.3,0,null,50.0,"p"],[52.35,460.1,"s","p","Cunningham et al., 2025","P",459.5,0,null,50.0,"p"],[53.95,416.1,"s","p","Cunningham et al., 2025","P",414.4,0,null,50.0,"p"],[49.5,416.1,"s","p","Cunningham et al., 2025","P",414.4,0,null,50.0,"p"],[108.27,443.33,"u","s","Zhang et al., 2025","P",null,0,null,50.0,"p"],[108.93,443.05,"u","s","Zhang et al., 2025","P",null,0,null,50.0,"p"],[109.33,442.78,"u","s","Zhang et al., 2025","P",null,0,null,50.0,"p"],[109.53,442.5,"u","s","Zhang et al., 2025","P",null,0,null,50.0,"p"],[48.7,1193.0,"o","p","Tefa et al., 2025","P",null,0,"cem_iv",50.0,"n"],[45.9,895.0,"o","p","Tefa et al., 2025","P",null,0,"cem_iv",50.0,"n"],[35.8,458.0,"s","p","Tefa et al., 2025","P",null,0,null,50.0,"n"],[40.69,348.94,"g","s","Raj R et al., 2025","N",null,0,null,50.0,"p"],[47.07,349.67,"g","s","Raj R et al., 2025","N",null,0,null,50.0,"p"],[53.81,350.41,"g","s","Raj R et al., 2025","N",null,0,null,50.0,"p"],[58.14,351.14,"g","s","Raj R et al., 2025","N",null,0,null,50.0,"p"],[56.26,352.6,"g","s","Raj R et al., 2025","N",null,0,null,50.0,"p"],[37.7,168.6,"g","s","Kanagaraj et al., 2023","N",null,0,null,50.0,"p"],[39.5,168.6,"g","s","Kanagaraj et al., 2023","N",null,0,null,50.0,"p"],[41.2,315.3,"g","s","Kanagaraj et al., 2023","N",null,0,null,50.0,"p"],[42.9,315.3,"g","s","Kanagaraj et al., 2023","N",null,0,null,50.0,"p"],[43.9,461.2,"g","s","Kanagaraj et al., 2023","N",null,0,null,50.0,"p"],[46.7,461.2,"g","s","Kanagaraj et al., 2023","N",null,0,null,50.0,"p"],[20.0,362.8,"g","p","Abdulkareem et al., 2021","N",null,0,null,40.0,"d"],[24.9,604.8,"g","p","Abdulkareem et al., 2021","N",null,0,null,40.0,"d"],[20.0,330.9,"o","s","Ma et al., 2021","P",null,0,"nao_declarado",100.0,"n"],[25.0,388.5,"o","s","Ma et al., 2021","P",null,0,"nao_declarado",100.0,"n"],[30.0,425.3,"o","s","Ma et al., 2021","P",null,0,"nao_declarado",100.0,"n"],[35.0,477.8,"o","s","Ma et al., 2021","P",null,0,"nao_declarado",100.0,"n"],[40.0,509.2,"o","s","Ma et al., 2021","P",null,0,"nao_declarado",100.0,"n"],[45.0,530.2,"o","s","Ma et al., 2021","P",null,0,"nao_declarado",100.0,"n"],[25.0,224.5,"s","p","Miller, 2021","P",null,0,null,100.0,"n"]];

  var UNIT_STATS = [{"kind":"derivado","cat":"m3","n":500},{"kind":"excluido","cat":"m3","n":36},{"kind":"nativo","cat":"m3","n":999},{"kind":"pendente","cat":"elemento","n":25},{"kind":"pendente","cat":"energia","n":4},{"kind":"pendente","cat":"ja_mpa","n":6},{"kind":"pendente","cat":"kg","n":23},{"kind":"pendente","cat":"m2","n":33},{"kind":"pendente","cat":"metro_linear","n":9},{"kind":"pendente","cat":"tonelada","n":43}];

  var UNIT_EXCLUDED = [{"row_id":2681,"estudo":"Habibi et al., 2024","material":"Concreto circular (RCA + sílica ativa + GGBS) vs concreto convencional","fck":33.4,"co2":249.0,"unidade":"kg CO2-eq/m3","motivo":"HABIBI 2681: 249 = GWP do circular com fim de vida escalado para a vida util do convencional (Tab.3 'Circular (38-Y SL)'; 354 x 37,9/53,7); a mesma mistura (fck 33,4) ja esta na linha 131 (297, berco-a-porta) -> duplicado com outra fronteira"},{"row_id":5050,"estudo":"Braga, 2018","material":"Estrutura de concreto armado VC com alvenaria ceramica fck=25 MPa","fck":25.0,"co2":267.0,"unidade":"kg CO2-eq/m3 de concreto","motivo":"E2: mesmo factor generico da DAP Votorantim (25 MPa x 267) da linha 62, aplicado a outro sistema"},{"row_id":5055,"estudo":"Isaia, 2021","material":"Concreto REF (referencia s/ filler calcario)","fck":127.2,"co2":597.24,"unidade":"kgCO2eq/m3","motivo":"E2: mesmo traco e mesmo CO2 da linha 65, com o fck aos 91 d; fica o par aos 28 d"},{"row_id":5055,"estudo":"Isaia, 2021","material":"Concreto FC50 (50% filler calcario)","fck":87.8,"co2":377.41,"unidade":"kgCO2eq/m3","motivo":"E2: mesmo traco e mesmo CO2 da linha 67, com o fck aos 91 d; fica o par aos 28 d"},{"row_id":5055,"estudo":"Isaia, 2021","material":"Concreto FC60 (60% filler calcario)","fck":65.7,"co2":325.09,"unidade":"kgCO2eq/m3","motivo":"E2: mesmo traco e mesmo CO2 da linha 69, com o fck aos 91 d; fica o par aos 28 d"},{"row_id":5055,"estudo":"Isaia, 2021","material":"Concreto FC60CH10 (60% filler + 10% cal hidratada)","fck":88.6,"co2":361.27,"unidade":"kgCO2eq/m3","motivo":"E2: mesmo traco e mesmo CO2 da linha 71, com o fck aos 91 d; fica o par aos 28 d"},{"row_id":5055,"estudo":"Isaia, 2021","material":"Concreto FC70CV10 (70% filler + 10% cinza volante)","fck":51.8,"co2":212.83,"unidade":"kgCO2eq/m3","motivo":"E2: mesmo traco e mesmo CO2 da linha 73, com o fck aos 91 d; fica o par aos 28 d"},{"row_id":5055,"estudo":"Isaia, 2021","material":"Concreto FC70CV10CH10 (70% filler + 10% CV + 10% CH)","fck":43.5,"co2":250.3,"unidade":"kgCO2eq/m3","motivo":"E2: mesmo traco e mesmo CO2 da linha 75, com o fck aos 91 d; fica o par aos 28 d"},{"row_id":2611,"estudo":"Cong et al., 2024","material":"GGBS-A (geopolimero base escoria de alto-forno, 30 MPa, traco A1)","fck":30.0,"co2":19.944,"unidade":"kg CO2-eq/m3 [RELABEL 2026-09-13: unidade original ja e por 1m3 de concreto (Tabela 14, coluna \"OC (kg/m3)\") -- valor nao alterado]","motivo":"E1: 19,944 (Table 14) e o CO2 do GPC dividido por 18 ciclos de 50 anos em acido sulfurico; o valor por m3 so existe na Fig.8"},{"row_id":2703,"estudo":"Kim et al., 2016","material":"Betao 100% OPC, medido fisicamente (Type 1)","fck":29.6,"co2":342.28,"unidade":"kg-CO2 eq/m3","motivo":"E2: duplica a linha 154 (mesmo traco 100% OPC, mesmo fck e CO2)"},{"row_id":2703,"estudo":"Kim et al., 2016","material":"Betao OPC+BFS (30%), medido fisicamente (Type 2)","fck":33.2,"co2":259.14,"unidade":"kg-CO2 eq/m3 [CORRIGIDO 2026-09-24, lote CI_MPA: co2 estava trocado com a linha 153. Tabela 11 do artigo: Type2=OPC+BFS-geral(30%) pareia com Case5=259.14 (nao ","motivo":"E2: duplica a linha 158 (mesmo traco OPC+BFS 30%, mesmo fck e CO2)"},{"row_id":2703,"estudo":"Kim et al., 2016","material":"Betao OPC+W-BFS (30%, aditivo residuo), medido fisicamente (Type 3)","fck":38.6,"co2":263.24,"unidade":"kg-CO2 eq/m3 [CORRIGIDO 2026-09-24, lote CI_MPA: co2 estava trocado com a linha 152. Tabela 11 do artigo: Type3(rotulado 4)=OPC+W-BFS(30%) pareia com Case4=263.","motivo":"E2: duplica a linha 157 (mesmo traco OPC+W-BFS 30%, mesmo fck e CO2)"},{"row_id":2695,"estudo":"Jang et al., 2022","material":"Concreto pronto (RMC), fator de emissao LCI coreano (KEITI) - classe 24 MPa","fck":24.0,"co2":414.0,"unidade":"kg CO2/m3","motivo":"F34 2026-10-17: mesmo factor KEITI/LCI DB coreano (24 MPa, 414 kg CO2/m3) que a 2694 ja usa: o par conta-se uma so vez (F34, Kie 2026-10-17)"},{"row_id":2891,"estudo":"Asensio et al., 2023","material":"TRC (textile-reinforced concrete), baseado no footbridge de referencia de Albstadt-Ebingen","fck":60.0,"co2":1029.5,"unidade":"kg CO2-eq/m3 [DERIVADO 2026-09-11: total CO2 (Tab.6) dividido pelo volume de betao (Tab.5) -- ver observacoes]","motivo":"revisao 2026-09-27: o total 2584 kg (Tab.6) inclui o guarda-corpo de aco galvanizado (\"increases emissions by 10% due to the production of the galvanized steel railing\", p.7717), cuja parcela nao e publicada; massa implicita 7,6 t/2,51 m3 = 3.028 kg/m3 vs 2.500 declarado. O unico percentual (10%) e incoerente com a Tab.6 (TRC emite 13% MENOS que 3DPC). Antes: 1029,5"},{"row_id":3215,"estudo":"Mekky et al., 2024","material":"concreto de controlo (CM) + cenario de aterro de lama de esgoto","fck":33.35,"co2":10300.0,"unidade":"kg CO2 eq (GWP, cenario 1: CM + aterro de lama de esgoto)","motivo":"revisao 2026-09-27 (leitura integral do PDF): incoerente com o proprio inventario (10.300 kg/m3 com 380 kg de cimento; cenario inclui deposicao de lamas)"},{"row_id":3215,"estudo":"Mekky et al., 2024","material":"concreto com 5% biochar de lama de esgoto (ASB) substituindo cimento","fck":31.9,"co2":6980.0,"unidade":"kg CO2 eq (GWP, cenario 2: 5% ASB - biochar de lama de esgoto)","motivo":"revisao 2026-09-27 (leitura integral do PDF): incoerente com o proprio inventario (10.300 kg/m3 com 380 kg de cimento; cenario inclui deposicao de lamas)"},{"row_id":3237,"estudo":"Kanagaraj et al., 2023","material":"SCLGC - concreto geopolimerico autocompactavel leve com agregado de argila expandida (ECA)","fck":47.0,"co2":231.2,"unidade":"kg CO2/m3 (convertido de 0,2312 t-CO2/m3, texto sec.6.3.3)","motivo":"KANAGARAJ 3237: 231,2 kg/m3 e um GPC generico 'segundo a proposta' de Alsalman 2021, nao corresponde a nenhuma mistura da Tab.2 (as ECA0 dao 168,6/315,2/461,0); o fck 47 e de uma mistura SCLGC com argila expandida, sem factor de CO2 -> par mistura duas misturas"},{"row_id":3818,"estudo":"Ye et al., 2024","material":"RC (concreto armado convencional, referencia com armadura, impressao 3D vs. betonagem)","fck":40.0,"co2":885.13,"unidade":"kg CO2-eq/m3","motivo":"E2/D1: RC com aco (885,13 = 318,13 + 567,01 do varao); o mesmo traco sem aco ja esta na linha 1107 (RC-0)"},{"row_id":3881,"estudo":"Han et al., 2019","material":"Concreto estrutural (media de corpos de prova de laboratorio, 7 anos de dados, Indonesia)","fck":35.0,"co2":63000.0,"unidade":"[DERIVADO] kg CO2/ano (pico 2017; = 20 m3 cimento (Fig.4) x 3,15 t/m3 densidade padrao)","motivo":"revisao 2026-09-27 (leitura integral do PDF): PAR_NAO_CONVERTIVEL: fck 35 MPa = media das resistencias registadas em 7 anos (usada para estimar o teor de cimento pelo ACI). O CO2 so existe em 'm3' (Eq.1 aplica factor massa/massa a um VOLUME de cimento; Fig.4 eixo 'CO2 emission (m3)'). Conversao para kg exige a massa volumica do cimento, que o artigo nao imprime. Pela excepcao 5b ja autorizada pela Kie para esta linha (3,15 t/m3), a intensidade por m3 sai directamente das constantes impressas, sem leitura de grafico: 0,204 m3 cimento/m3 betao x 3,15 t/m3 x 0,95 (clinquer) x 0,5 tCO2/t = 0,305 t"},{"row_id":4263,"estudo":"Mostafaei et al., 2025","material":"Concreto de barragem, resistencia de projeto de 20 MPa","fck":20.0,"co2":304.7,"unidade":"kg CO2-eq/m3 [DERIVADO 2026-09-11: rotulo impresso Fig.11 (ton CO2eq/m largura) x1000 / volume por m de largura (Secao 4.4) -- ver observacoes]","motivo":"MOSTAFAEI 4263 (decisao da Kie 2026-10-09, opcao a): a Fig.11 (303/348/422/497 t CO2/m de barragem) nao tem fronteira identificavel - caso-base: construcao 355 t, betao >305 t (p.8, Tab.3), Fig.3 341,2 kg/m3 (=305 t/895 m3, classe 30 MPa por deducao), mas a Fig.11 da 348 t aos 30 MPa; total/volume nao e o CO2 do betao"},{"row_id":4263,"estudo":"Mostafaei et al., 2025","material":"Concreto de barragem, resistencia de projeto de 30 MPa","fck":30.0,"co2":388.7,"unidade":"kg CO2-eq/m3 [DERIVADO 2026-09-11: rotulo impresso Fig.11 (ton CO2eq/m largura) x1000 / volume por m de largura (Secao 4.4) -- ver observacoes]","motivo":"MOSTAFAEI 4263 (decisao da Kie 2026-10-09, opcao a): a Fig.11 (303/348/422/497 t CO2/m de barragem) nao tem fronteira identificavel - caso-base: construcao 355 t, betao >305 t (p.8, Tab.3), Fig.3 341,2 kg/m3 (=305 t/895 m3, classe 30 MPa por deducao), mas a Fig.11 da 348 t aos 30 MPa; total/volume nao e o CO2 do betao"},{"row_id":4263,"estudo":"Mostafaei et al., 2025","material":"Concreto de barragem, resistencia de projeto de 40 MPa","fck":40.0,"co2":473.9,"unidade":"kg CO2-eq/m3 [DERIVADO 2026-09-11: rotulo impresso Fig.11 (ton CO2eq/m largura) x1000 / volume por m de largura (Secao 4.4) -- ver observacoes]","motivo":"MOSTAFAEI 4263 (decisao da Kie 2026-10-09, opcao a): a Fig.11 (303/348/422/497 t CO2/m de barragem) nao tem fronteira identificavel - caso-base: construcao 355 t, betao >305 t (p.8, Tab.3), Fig.3 341,2 kg/m3 (=305 t/895 m3, classe 30 MPa por deducao), mas a Fig.11 da 348 t aos 30 MPa; total/volume nao e o CO2 do betao"},{"row_id":4263,"estudo":"Mostafaei et al., 2025","material":"Concreto de barragem, resistencia de projeto de 50 MPa","fck":50.0,"co2":560.2,"unidade":"kg CO2-eq/m3 [DERIVADO 2026-09-11: rotulo impresso Fig.11 (ton CO2eq/m largura) x1000 / volume por m de largura (Secao 4.4) -- ver observacoes]","motivo":"MOSTAFAEI 4263 (decisao da Kie 2026-10-09, opcao a): a Fig.11 (303/348/422/497 t CO2/m de barragem) nao tem fronteira identificavel - caso-base: construcao 355 t, betao >305 t (p.8, Tab.3), Fig.3 341,2 kg/m3 (=305 t/895 m3, classe 30 MPa por deducao), mas a Fig.11 da 348 t aos 30 MPa; total/volume nao e o CO2 do betao"},{"row_id":4476,"estudo":"Faridmehr et al., 2021","material":"AAM argamassa alcali-ativada Mix 28: FA50%+GBFS50%","fck":80.46,"co2":54.55,"unidade":"kg CO2/m3","motivo":"E2: o proprio artigo repete a Mix 6 como Mix 28 (mesma composicao, fck e CO2) - fica a linha 1396"},{"row_id":4476,"estudo":"Faridmehr et al., 2021","material":"AAM argamassa alcali-ativada Mix 33: GBFS50%+POFA50%","fck":55.64,"co2":77.68,"unidade":"kg CO2/m3","motivo":"E2: o proprio artigo repete a Mix 15 como Mix 33 (mesma composicao, fck e CO2) - fica a linha 1405"},{"row_id":4706,"estudo":"Passoni et al., 2022","material":"Concreto C25/30 -- fundacoes do exoesqueleto de reforco sismico, solucoes Timber Shell e Steel Diagrid (67.29 m3)","fck":25.0,"co2":1297.4,"unidade":"[DERIVADO] kg CO2eq/m3 (concreto C25/30 das fundacoes, modulos A1-A3)","motivo":"revisao 2026-09-27 (leitura integral do PDF): PAR_NAO_CONVERTIVEL: Confirma a decisao da Kie de 2026-09-26. fck: betao C25/30 (classe de projecto) nas fundacoes (67,29 m3 Timber/Diagrid; 95,31 m3 Steel/RC Walls) e superestrutura RC Walls (70,88 m3) - Tab.A1 p.29. CO2 so em totais por solucao (GWP A1-A3: 0,21/1,07/1,64/2,27 x10^5 kgCO2eq, p.17) e na Fig.9(ii), onde a parcela 'concrete C25/30' e uma barra empilhada SEM rotulo proprio; os rotulos '8.73x10^4' e '8.54x10^4' estao no painel PERT (MJ), nao no GWP. O eixo GWP tem escala, mas a leitura da barra verde do betao da ~1,0x10^3 kgCO2eq/m3 (e"},{"row_id":4706,"estudo":"Passoni et al., 2022","material":"Concreto C25/30 -- fundacoes do exoesqueleto de reforco sismico, solucoes Steel Walls e RC Walls (95.31 m3)","fck":25.0,"co2":896.0,"unidade":"[DERIVADO] kg CO2eq/m3 (concreto C25/30 das fundacoes, modulos A1-A3)","motivo":"revisao 2026-09-27 (leitura integral do PDF): PAR_NAO_CONVERTIVEL: Confirma a decisao da Kie de 2026-09-26. fck: betao C25/30 (classe de projecto) nas fundacoes (67,29 m3 Timber/Diagrid; 95,31 m3 Steel/RC Walls) e superestrutura RC Walls (70,88 m3) - Tab.A1 p.29. CO2 so em totais por solucao (GWP A1-A3: 0,21/1,07/1,64/2,27 x10^5 kgCO2eq, p.17) e na Fig.9(ii), onde a parcela 'concrete C25/30' e uma barra empilhada SEM rotulo proprio; os rotulos '8.73x10^4' e '8.54x10^4' estao no painel PERT (MJ), nao no GWP. O eixo GWP tem escala, mas a leitura da barra verde do betao da ~1,0x10^3 kgCO2eq/m3 (e"},{"row_id":4754,"estudo":"Maury-Ramirez & De Belie, 2023","material":"Eco-concreto com 50% escoria de alto-forno (BFS) — vigas aereas e de fundacao, casa sustentavel, Santiago de Cali","fck":28.0,"co2":15.8,"unidade":"kg CO2/m3","motivo":"E1: 15,8 kg CO2/m3 impossivel para 182,6 kg de cimento/m3; o eixo da Fig.4 nao tem unidade"},{"row_id":4754,"estudo":"Maury-Ramirez & De Belie, 2023","material":"Eco-concreto com 50% escoria de alto-forno (BFS) — colunas, casa sustentavel, Santiago de Cali","fck":28.0,"co2":20.1,"unidade":"kg CO2/m3","motivo":"E1: 20,1 kg CO2/m3 impossivel para 182,6 kg de cimento/m3; o eixo da Fig.4 nao tem unidade"},{"row_id":4766,"estudo":"Ma et al., 2024","material":"Concreto estrutural — Mild Reinforced Beams and Slabs (edificio alto hibrido aco-concreto, Chicago, 60 andares)","fck":37.9,"co2":305.81,"unidade":"kg CO2eq/m3 (A-D, cradle-to-grave, base GaBi/NRMCA EPD via Tally)","motivo":"E2: mesma classe 5500 psi e mesmo factor da linha 1758 (dois elementos do mesmo edificio)"},{"row_id":5029,"estudo":"Hora, 2021","material":"Concreto usinado (cimento CP II-F, referencia) para pavimento de ciclovia -- producao apenas","fck":20.0,"co2":190.7,"unidade":"kg CO2-eq/m3 [PAR NOVO 2026-09-11, nao capturado nas extracoes anteriores por truncagem do read_file_content -- ver nota da linha 606 do mesmo row_id]. Valor im","motivo":"E1: as Tabelas 27-29 dao totais da ciclovia (588 m3) com os valores uma linha acima do rotulo; o numero gravado e a eutrofizacao, nao o GWP por m3"},{"row_id":5029,"estudo":"Hora, 2021","material":"Concreto usinado com cimento CP IV (menor teor de clinquer) para pavimento de ciclovia -- producao apenas","fck":20.0,"co2":112.3,"unidade":"kg CO2-eq/m3 [PAR NOVO 2026-09-11, nao capturado nas extracoes anteriores por truncagem do read_file_content -- ver nota da linha 606 do mesmo row_id]. Valor im","motivo":"E1: as Tabelas 27-29 dao totais da ciclovia (588 m3) com os valores uma linha acima do rotulo; o numero gravado e a eutrofizacao, nao o GWP por m3"},{"row_id":5029,"estudo":"Hora, 2021","material":"Concreto usinado com cimento CP V ARI (maior teor de clinquer) para pavimento de ciclovia -- producao apenas","fck":20.0,"co2":200.1,"unidade":"kg CO2-eq/m3 [PAR NOVO 2026-09-11, nao capturado nas extracoes anteriores por truncagem do read_file_content -- ver nota da linha 606 do mesmo row_id]. Valor im","motivo":"E1: as Tabelas 27-29 dao totais da ciclovia (588 m3) com os valores uma linha acima do rotulo; o numero gravado e a eutrofizacao, nao o GWP por m3"},{"row_id":5029,"estudo":"Hora, 2021","material":"Concreto usinado com 50% do agregado graudo substituido por reciclado de concreto (ARC-50%) -- producao+transporte","fck":20.0,"co2":175.0,"unidade":"kg CO2-eq/m3 [PAR NOVO 2026-09-11, nao capturado nas extracoes anteriores por truncagem do read_file_content -- ver nota da linha 606 do mesmo row_id]. Valor im","motivo":"E1: as Tabelas 27-29 dao totais da ciclovia (588 m3) com os valores uma linha acima do rotulo; o numero gravado e a eutrofizacao, nao o GWP por m3"},{"row_id":5029,"estudo":"Hora, 2021","material":"Concreto usinado com 100% do agregado graudo substituido por reciclado de concreto (ARC-100%) -- producao+transporte","fck":20.0,"co2":158.2,"unidade":"kg CO2-eq/m3 [PAR NOVO 2026-09-11, nao capturado nas extracoes anteriores por truncagem do read_file_content -- ver nota da linha 606 do mesmo row_id]. Valor im","motivo":"E1: as Tabelas 27-29 dao totais da ciclovia (588 m3) com os valores uma linha acima do rotulo; o numero gravado e a eutrofizacao, nao o GWP por m3"},{"row_id":5029,"estudo":"Hora, 2021","material":"Concreto 'Ideal' (cimento CP IV + 100% agregado graudo reciclado, combinados) -- producao+transporte","fck":20.0,"co2":79.81,"unidade":"kg CO2-eq/m3 [PAR NOVO 2026-09-11, nao capturado nas extracoes anteriores por truncagem do read_file_content -- ver nota da linha 606 do mesmo row_id]. Valor im","motivo":"E1: as Tabelas 27-29 dao totais da ciclovia (588 m3) com os valores uma linha acima do rotulo; o numero gravado e a eutrofizacao, nao o GWP por m3"}];
  /* Resultados do modelo multinível (rma.mv REML, metafor) para o forest por
     família — F28, Kiê 2026-10-16. Gerado no repositório da RSL por
     metanalise/exportar_forest_site.R (metanalise/resultados/forest_site.json):
     um ajuste por combinação de filtros, chave 'estrato|base|co2|indicador'
     (estrato ps/p/s, base todos/portland, co2 sem/com, indicador ci/cit). */
  var MODELO = {"gerado":"2026-11-21","metodo":"rma.mv REML, random = ~1 | estudo/obs_id (metafor)","pares":1498,"cenarios":{"ps|todos|sem|ci":{"k":1449,"estudos":388,"global":{"mu":10.1917,"lb":9.63698,"ub":10.7464,"pi_lb":0.544842,"pi_ub":19.8385,"i2":99.9333},"familias":{"biobase":{"mu":4.608,"lb":-10.501,"ub":19.717,"k":1,"estudos":1},"concreto_armado":{"mu":15.5856,"lb":13.7686,"ub":17.4026,"k":91,"estudos":39},"geopolimero":{"mu":5.39331,"lb":4.23549,"ub":6.55113,"k":202,"estudos":56},"ligantes":{"mu":10.9927,"lb":8.19957,"ub":13.7857,"k":22,"estudos":10},"opc":{"mu":10.7888,"lb":10.1435,"ub":11.4342,"k":499,"estudos":245},"reciclado":{"mu":11.2716,"lb":10.3678,"ub":12.1754,"k":181,"estudos":68},"scm":{"mu":9.27,"lb":8.52604,"ub":10.014,"k":414,"estudos":110},"uhpc":{"mu":8.08146,"lb":6.17961,"ub":9.9833,"k":39,"estudos":16}}},"p|todos|sem|ci":{"k":1113,"estudos":302,"global":{"mu":10.5356,"lb":9.8709,"ub":11.2004,"pi_lb":0.319125,"pi_ub":20.7521,"i2":99.9528},"familias":{"concreto_armado":{"mu":15.5293,"lb":13.4782,"ub":17.5804,"k":82,"estudos":34},"geopolimero":{"mu":5.15979,"lb":3.80395,"ub":6.51562,"k":166,"estudos":45},"ligantes":{"mu":11.6684,"lb":8.46473,"ub":14.8722,"k":17,"estudos":9},"opc":{"mu":11.1628,"lb":10.3911,"ub":11.9346,"k":401,"estudos":197},"reciclado":{"mu":11.4008,"lb":10.2885,"ub":12.513,"k":131,"estudos":54},"scm":{"mu":9.70294,"lb":8.83056,"ub":10.5753,"k":302,"estudos":85},"uhpc":{"mu":7.50493,"lb":3.75033,"ub":11.2595,"k":14,"estudos":7}}},"s|todos|sem|ci":{"k":336,"estudos":86,"global":{"mu":8.96282,"lb":8.10821,"ub":9.81743,"pi_lb":1.92832,"pi_ub":15.9973,"i2":98.5798},"familias":{"biobase":{"mu":4.608,"lb":-5.989,"ub":15.205,"k":1,"estudos":1},"concreto_armado":{"mu":16.1436,"lb":12.1778,"ub":20.1093,"k":9,"estudos":5},"geopolimero":{"mu":6.14284,"lb":4.22837,"ub":8.0573,"k":36,"estudos":11},"ligantes":{"mu":7.46762,"lb":2.31787,"ub":12.6174,"k":5,"estudos":1},"opc":{"mu":9.7097,"lb":8.63867,"ub":10.7807,"k":98,"estudos":48},"reciclado":{"mu":10.677,"lb":9.35971,"ub":11.9943,"k":50,"estudos":14},"scm":{"mu":7.5305,"lb":6.20291,"ub":8.85809,"k":112,"estudos":25},"uhpc":{"mu":7.7627,"lb":5.98239,"ub":9.543,"k":25,"estudos":9}}},"ps|portland|sem|ci":{"k":1224,"estudos":350,"global":{"mu":10.4679,"lb":9.9856,"ub":10.9503,"pi_lb":2.60583,"pi_ub":18.3301,"i2":99.8833},"familias":{"concreto_armado":{"mu":15.6957,"lb":14.2255,"ub":17.166,"k":91,"estudos":39},"opc":{"mu":10.3595,"lb":9.83406,"ub":10.8849,"k":499,"estudos":245},"reciclado":{"mu":10.8956,"lb":10.1561,"ub":11.6351,"k":181,"estudos":68},"scm":{"mu":8.72216,"lb":8.11264,"ub":9.33168,"k":414,"estudos":110},"uhpc":{"mu":7.85691,"lb":6.24152,"ub":9.47231,"k":39,"estudos":16}}},"p|portland|sem|ci":{"k":930,"estudos":272,"global":{"mu":10.7758,"lb":10.2232,"ub":11.3283,"pi_lb":2.86247,"pi_ub":18.6891,"i2":99.9084},"familias":{"concreto_armado":{"mu":15.6485,"lb":14.0499,"ub":17.247,"k":82,"estudos":34},"opc":{"mu":10.6204,"lb":10.019,"ub":11.2217,"k":401,"estudos":197},"reciclado":{"mu":10.9176,"lb":10.0427,"ub":11.7924,"k":131,"estudos":54},"scm":{"mu":9.02421,"lb":8.33953,"ub":9.7089,"k":302,"estudos":85},"uhpc":{"mu":7.32251,"lb":4.20395,"ub":10.4411,"k":14,"estudos":7}}},"s|portland|sem|ci":{"k":294,"estudos":78,"global":{"mu":9.39762,"lb":8.46488,"ub":10.3304,"pi_lb":2.10961,"pi_ub":16.6856,"i2":98.7696},"familias":{"concreto_armado":{"mu":16.2069,"lb":12.2208,"ub":20.1929,"k":9,"estudos":5},"opc":{"mu":9.71408,"lb":8.62333,"ub":10.8048,"k":98,"estudos":48},"reciclado":{"mu":10.6857,"lb":9.34011,"ub":12.0313,"k":50,"estudos":14},"scm":{"mu":7.47892,"lb":6.10407,"ub":8.85378,"k":112,"estudos":25},"uhpc":{"mu":7.69299,"lb":5.86409,"ub":9.52189,"k":25,"estudos":9}}},"ps|todos|com|ci":{"k":1498,"estudos":398,"global":{"mu":10.0244,"lb":9.46478,"ub":10.584,"pi_lb":0.176697,"pi_ub":19.872,"i2":99.9387},"familias":{"biobase":{"mu":-3.776,"lb":-19.5881,"ub":12.0361,"k":1,"estudos":1},"concreto_armado":{"mu":15.5582,"lb":13.8025,"ub":17.3139,"k":104,"estudos":43},"geopolimero":{"mu":4.53958,"lb":3.35231,"ub":5.72685,"k":218,"estudos":57},"ligantes":{"mu":10.6342,"lb":7.76,"ub":13.5084,"k":22,"estudos":10},"opc":{"mu":10.7536,"lb":10.0946,"ub":11.4127,"k":504,"estudos":250},"reciclado":{"mu":10.9434,"lb":10.028,"ub":11.8588,"k":191,"estudos":73},"scm":{"mu":9.20757,"lb":8.45197,"ub":9.96318,"k":419,"estudos":113},"uhpc":{"mu":7.96248,"lb":5.98688,"ub":9.93809,"k":39,"estudos":16}}},"p|todos|com|ci":{"k":1158,"estudos":311,"global":{"mu":10.383,"lb":9.7125,"ub":11.0535,"pi_lb":-0.09098,"pi_ub":20.8569,"i2":99.9569},"familias":{"concreto_armado":{"mu":15.6115,"lb":13.6407,"ub":17.5823,"k":95,"estudos":38},"geopolimero":{"mu":4.03992,"lb":2.64933,"ub":5.43051,"k":182,"estudos":46},"ligantes":{"mu":11.2072,"lb":7.906,"ub":14.5084,"k":17,"estudos":9},"opc":{"mu":11.1621,"lb":10.3738,"ub":11.9505,"k":406,"estudos":202},"reciclado":{"mu":11.1324,"lb":10.0062,"ub":12.2586,"k":138,"estudos":58},"scm":{"mu":9.64625,"lb":8.75954,"ub":10.533,"k":306,"estudos":87},"uhpc":{"mu":7.37932,"lb":3.40647,"ub":11.3522,"k":14,"estudos":7}}},"s|todos|com|ci":{"k":340,"estudos":87,"global":{"mu":8.65498,"lb":7.82312,"ub":9.48683,"pi_lb":1.93455,"pi_ub":15.3754,"i2":98.4256},"familias":{"biobase":{"mu":-3.776,"lb":-15.487,"ub":7.93496,"k":1,"estudos":1},"concreto_armado":{"mu":15.9105,"lb":11.6852,"ub":20.1358,"k":9,"estudos":5},"geopolimero":{"mu":6.10992,"lb":4.21095,"ub":8.00889,"k":36,"estudos":11},"ligantes":{"mu":7.33272,"lb":2.21849,"ub":12.447,"k":5,"estudos":1},"opc":{"mu":9.43692,"lb":8.35449,"ub":10.5193,"k":98,"estudos":48},"reciclado":{"mu":10.1086,"lb":8.81347,"ub":11.4038,"k":53,"estudos":15},"scm":{"mu":7.52793,"lb":6.21312,"ub":8.84274,"k":113,"estudos":26},"uhpc":{"mu":7.57732,"lb":5.80459,"ub":9.35004,"k":25,"estudos":9}}},"ps|portland|com|ci":{"k":1256,"estudos":359,"global":{"mu":10.3037,"lb":9.82007,"ub":10.7874,"pi_lb":2.38624,"pi_ub":18.2212,"i2":99.8832},"familias":{"concreto_armado":{"mu":15.5853,"lb":14.1693,"ub":17.0012,"k":103,"estudos":42},"opc":{"mu":10.1769,"lb":9.6474,"ub":10.7065,"k":504,"estudos":250},"reciclado":{"mu":10.4623,"lb":9.72635,"ub":11.1983,"k":191,"estudos":73},"scm":{"mu":8.59696,"lb":7.98771,"ub":9.20622,"k":419,"estudos":113},"uhpc":{"mu":7.74509,"lb":6.11217,"ub":9.37801,"k":39,"estudos":16}}},"p|portland|com|ci":{"k":958,"estudos":280,"global":{"mu":10.6388,"lb":10.0824,"ub":11.1953,"pi_lb":2.58676,"pi_ub":18.6909,"i2":99.9099},"familias":{"concreto_armado":{"mu":15.6149,"lb":14.0839,"ub":17.1459,"k":94,"estudos":37},"opc":{"mu":10.4547,"lb":9.84872,"ub":11.0608,"k":406,"estudos":202},"reciclado":{"mu":10.5184,"lb":9.64735,"ub":11.3895,"k":138,"estudos":58},"scm":{"mu":8.88531,"lb":8.19999,"ub":9.57063,"k":306,"estudos":87},"uhpc":{"mu":7.30266,"lb":4.12879,"ub":10.4765,"k":14,"estudos":7}}},"s|portland|com|ci":{"k":298,"estudos":79,"global":{"mu":9.11713,"lb":8.20905,"ub":10.0252,"pi_lb":2.15314,"pi_ub":16.0811,"i2":98.634},"familias":{"concreto_armado":{"mu":15.999,"lb":11.8235,"ub":20.1744,"k":9,"estudos":5},"opc":{"mu":9.4415,"lb":8.33926,"ub":10.5437,"k":98,"estudos":48},"reciclado":{"mu":10.0947,"lb":8.76992,"ub":11.4196,"k":53,"estudos":15},"scm":{"mu":7.4929,"lb":6.13245,"ub":8.85335,"k":113,"estudos":26},"uhpc":{"mu":7.50298,"lb":5.68228,"ub":9.32368,"k":25,"estudos":9}}},"ps|todos|sem|cit":{"k":1449,"estudos":388,"global":{"mu":0.189543,"lb":0.177594,"ub":0.201492,"pi_lb":-0.0121134,"pi_ub":0.3912,"i2":99.9285},"familias":{"biobase":{"mu":0.09216,"lb":-0.295538,"ub":0.479858,"k":1,"estudos":1},"concreto_armado":{"mu":0.241858,"lb":0.200113,"ub":0.283604,"k":91,"estudos":39},"geopolimero":{"mu":0.0983153,"lb":0.0732772,"ub":0.123353,"k":202,"estudos":56},"ligantes":{"mu":0.215557,"lb":0.154735,"ub":0.276379,"k":22,"estudos":10},"opc":{"mu":0.208878,"lb":0.194484,"ub":0.223273,"k":499,"estudos":245},"reciclado":{"mu":0.217302,"lb":0.197479,"ub":0.237125,"k":181,"estudos":68},"scm":{"mu":0.177826,"lb":0.161452,"ub":0.1942,"k":414,"estudos":110},"uhpc":{"mu":0.152028,"lb":0.112311,"ub":0.191745,"k":39,"estudos":16}}},"p|todos|sem|cit":{"k":1113,"estudos":302,"global":{"mu":0.194725,"lb":0.180514,"ub":0.208937,"pi_lb":-0.0172752,"pi_ub":0.406725,"i2":99.9487},"familias":{"concreto_armado":{"mu":0.24168,"lb":0.195192,"ub":0.288167,"k":82,"estudos":34},"geopolimero":{"mu":0.0921861,"lb":0.063017,"ub":0.121355,"k":166,"estudos":45},"ligantes":{"mu":0.23039,"lb":0.160766,"ub":0.300014,"k":17,"estudos":9},"opc":{"mu":0.216067,"lb":0.199011,"ub":0.233123,"k":401,"estudos":197},"reciclado":{"mu":0.21713,"lb":0.192778,"ub":0.241482,"k":131,"estudos":54},"scm":{"mu":0.184852,"lb":0.165739,"ub":0.203965,"k":302,"estudos":85},"uhpc":{"mu":0.136921,"lb":0.0646614,"ub":0.209181,"k":14,"estudos":7}}},"s|todos|sem|cit":{"k":336,"estudos":86,"global":{"mu":0.171723,"lb":0.152611,"ub":0.190835,"pi_lb":0.0168642,"pi_ub":0.326582,"i2":98.8213},"familias":{"biobase":{"mu":0.09216,"lb":-0.148878,"ub":0.333198,"k":1,"estudos":1},"concreto_armado":{"mu":0.244384,"lb":0.151276,"ub":0.337491,"k":9,"estudos":5},"geopolimero":{"mu":0.119843,"lb":0.0757693,"ub":0.163917,"k":36,"estudos":11},"ligantes":{"mu":0.139774,"lb":0.0202544,"ub":0.259293,"k":5,"estudos":1},"opc":{"mu":0.183528,"lb":0.158625,"ub":0.208431,"k":98,"estudos":48},"reciclado":{"mu":0.214513,"lb":0.184914,"ub":0.244113,"k":50,"estudos":14},"scm":{"mu":0.152642,"lb":0.122244,"ub":0.183039,"k":112,"estudos":25},"uhpc":{"mu":0.157053,"lb":0.116861,"ub":0.197245,"k":25,"estudos":9}}},"ps|portland|sem|cit":{"k":1224,"estudos":350,"global":{"mu":0.192834,"lb":0.18215,"ub":0.203517,"pi_lb":0.026552,"pi_ub":0.359115,"i2":99.8799},"familias":{"concreto_armado":{"mu":0.23996,"lb":0.20418,"ub":0.27574,"k":91,"estudos":39},"opc":{"mu":0.198807,"lb":0.186517,"ub":0.211096,"k":499,"estudos":245},"reciclado":{"mu":0.208826,"lb":0.191972,"ub":0.225681,"k":181,"estudos":68},"scm":{"mu":0.165336,"lb":0.151328,"ub":0.179344,"k":414,"estudos":110},"uhpc":{"mu":0.147655,"lb":0.112653,"ub":0.182657,"k":39,"estudos":16}}},"p|portland|sem|cit":{"k":930,"estudos":272,"global":{"mu":0.196919,"lb":0.184877,"ub":0.208962,"pi_lb":0.0321922,"pi_ub":0.361647,"i2":99.9029},"familias":{"concreto_armado":{"mu":0.239373,"lb":0.201162,"ub":0.277583,"k":82,"estudos":34},"opc":{"mu":0.203692,"lb":0.189836,"ub":0.217548,"k":401,"estudos":197},"reciclado":{"mu":0.206086,"lb":0.186225,"ub":0.225946,"k":131,"estudos":54},"scm":{"mu":0.169261,"lb":0.153672,"ub":0.184849,"k":302,"estudos":85},"uhpc":{"mu":0.134648,"lb":0.0730463,"ub":0.19625,"k":14,"estudos":7}}},"s|portland|sem|cit":{"k":294,"estudos":78,"global":{"mu":0.179305,"lb":0.157998,"ub":0.200613,"pi_lb":0.0158194,"pi_ub":0.342791,"i2":99.0162},"familias":{"concreto_armado":{"mu":0.245864,"lb":0.150217,"ub":0.341511,"k":9,"estudos":5},"opc":{"mu":0.1825,"lb":0.156551,"ub":0.208448,"k":98,"estudos":48},"reciclado":{"mu":0.214234,"lb":0.183434,"ub":0.245034,"k":50,"estudos":14},"scm":{"mu":0.151223,"lb":0.118977,"ub":0.183468,"k":112,"estudos":25},"uhpc":{"mu":0.155978,"lb":0.114014,"ub":0.197943,"k":25,"estudos":9}}},"ps|todos|com|cit":{"k":1498,"estudos":398,"global":{"mu":0.186288,"lb":0.174459,"ub":0.198117,"pi_lb":-0.0164516,"pi_ub":0.389028,"i2":99.9324},"familias":{"biobase":{"mu":-0.07552,"lb":-0.471027,"ub":0.319987,"k":1,"estudos":1},"concreto_armado":{"mu":0.246097,"lb":0.20681,"ub":0.285384,"k":104,"estudos":43},"geopolimero":{"mu":0.0818733,"lb":0.0565581,"ub":0.107188,"k":218,"estudos":57},"ligantes":{"mu":0.207549,"lb":0.145958,"ub":0.26914,"k":22,"estudos":10},"opc":{"mu":0.208109,"lb":0.193663,"ub":0.222555,"k":504,"estudos":250},"reciclado":{"mu":0.210376,"lb":0.190605,"ub":0.230147,"k":191,"estudos":73},"scm":{"mu":0.176823,"lb":0.160454,"ub":0.193193,"k":419,"estudos":113},"uhpc":{"mu":0.149354,"lb":0.108323,"ub":0.190386,"k":39,"estudos":16}}},"p|todos|com|cit":{"k":1158,"estudos":311,"global":{"mu":0.191739,"lb":0.177629,"ub":0.205848,"pi_lb":-0.0229064,"pi_ub":0.406384,"i2":99.952},"familias":{"concreto_armado":{"mu":0.249039,"lb":0.205448,"ub":0.292631,"k":95,"estudos":38},"geopolimero":{"mu":0.0706882,"lb":0.0411981,"ub":0.100178,"k":182,"estudos":46},"ligantes":{"mu":0.220069,"lb":0.149239,"ub":0.290898,"k":17,"estudos":9},"opc":{"mu":0.215913,"lb":0.19875,"ub":0.233076,"k":406,"estudos":202},"reciclado":{"mu":0.211956,"lb":0.187657,"ub":0.236255,"k":138,"estudos":58},"scm":{"mu":0.183805,"lb":0.164654,"ub":0.202956,"k":306,"estudos":87},"uhpc":{"mu":0.133483,"lb":0.0569166,"ub":0.210049,"k":14,"estudos":7}}},"s|todos|com|cit":{"k":340,"estudos":87,"global":{"mu":0.166277,"lb":0.148119,"ub":0.184436,"pi_lb":0.0206052,"pi_ub":0.311949,"i2":98.6534},"familias":{"biobase":{"mu":-0.07552,"lb":-0.318331,"ub":0.167291,"k":1,"estudos":1},"concreto_armado":{"mu":0.239203,"lb":0.146905,"ub":0.3315,"k":9,"estudos":5},"geopolimero":{"mu":0.12015,"lb":0.0770659,"ub":0.163234,"k":36,"estudos":11},"ligantes":{"mu":0.138662,"lb":0.0215844,"ub":0.255739,"k":5,"estudos":1},"opc":{"mu":0.177919,"lb":0.153574,"ub":0.202264,"k":98,"estudos":48},"reciclado":{"mu":0.202377,"lb":0.173871,"ub":0.230883,"k":53,"estudos":15},"scm":{"mu":0.152982,"lb":0.123552,"ub":0.182412,"k":113,"estudos":26},"uhpc":{"mu":0.151231,"lb":0.111812,"ub":0.190651,"k":25,"estudos":9}}},"ps|portland|com|cit":{"k":1256,"estudos":359,"global":{"mu":0.189429,"lb":0.179031,"ub":0.199828,"pi_lb":0.026329,"pi_ub":0.35253,"i2":99.8737},"familias":{"concreto_armado":{"mu":0.240119,"lb":0.206887,"ub":0.273351,"k":103,"estudos":42},"opc":{"mu":0.195117,"lb":0.18305,"ub":0.207184,"k":504,"estudos":250},"reciclado":{"mu":0.199898,"lb":0.183465,"ub":0.216331,"k":191,"estudos":73},"scm":{"mu":0.163253,"lb":0.149567,"ub":0.176939,"k":419,"estudos":113},"uhpc":{"mu":0.144977,"lb":0.110005,"ub":0.179949,"k":39,"estudos":16}}},"p|portland|com|cit":{"k":958,"estudos":280,"global":{"mu":0.193879,"lb":0.182079,"ub":0.20568,"pi_lb":0.0304134,"pi_ub":0.357345,"i2":99.8999},"familias":{"concreto_armado":{"mu":0.241222,"lb":0.205846,"ub":0.276599,"k":94,"estudos":37},"opc":{"mu":0.200061,"lb":0.186407,"ub":0.213716,"k":406,"estudos":202},"reciclado":{"mu":0.198215,"lb":0.178811,"ub":0.217619,"k":138,"estudos":58},"scm":{"mu":0.16669,"lb":0.151398,"ub":0.181982,"k":306,"estudos":87},"uhpc":{"mu":0.133823,"lb":0.0719315,"ub":0.195714,"k":14,"estudos":7}}},"s|portland|com|cit":{"k":298,"estudos":79,"global":{"mu":0.174418,"lb":0.154313,"ub":0.194524,"pi_lb":0.021375,"pi_ub":0.327462,"i2":98.8633},"familias":{"concreto_armado":{"mu":0.242193,"lb":0.149291,"ub":0.335095,"k":9,"estudos":5},"opc":{"mu":0.17723,"lb":0.151986,"ub":0.202474,"k":98,"estudos":48},"reciclado":{"mu":0.202086,"lb":0.172486,"ub":0.231686,"k":53,"estudos":15},"scm":{"mu":0.151929,"lb":0.120855,"ub":0.183003,"k":113,"estudos":26},"uhpc":{"mu":0.15014,"lb":0.109059,"ub":0.191222,"k":25,"estudos":9}}},"ps|todos|sem|citf":{"k":1449,"estudos":388,"global":{"mu":0.171677,"lb":0.159837,"ub":0.183518,"pi_lb":-0.0333976,"pi_ub":0.376752,"i2":99.9551},"familias":{"biobase":{"mu":0.0710234,"lb":-0.244934,"ub":0.386981,"k":1,"estudos":1},"concreto_armado":{"mu":0.19275,"lb":0.155843,"ub":0.229657,"k":91,"estudos":39},"geopolimero":{"mu":0.120391,"lb":0.098189,"ub":0.142594,"k":202,"estudos":56},"ligantes":{"mu":0.303131,"lb":0.247831,"ub":0.358431,"k":22,"estudos":10},"opc":{"mu":0.178007,"lb":0.164846,"ub":0.191169,"k":499,"estudos":245},"reciclado":{"mu":0.212248,"lb":0.19497,"ub":0.229525,"k":181,"estudos":68},"scm":{"mu":0.158321,"lb":0.143687,"ub":0.172955,"k":414,"estudos":110},"uhpc":{"mu":0.0856423,"lb":0.0538241,"ub":0.11746,"k":39,"estudos":16}}},"p|todos|sem|citf":{"k":1113,"estudos":302,"global":{"mu":0.179299,"lb":0.164823,"ub":0.193774,"pi_lb":-0.0431509,"pi_ub":0.401748,"i2":99.9679},"familias":{"concreto_armado":{"mu":0.192618,"lb":0.149779,"ub":0.235458,"k":82,"estudos":34},"geopolimero":{"mu":0.113624,"lb":0.0868703,"ub":0.140377,"k":166,"estudos":45},"ligantes":{"mu":0.309858,"lb":0.24518,"ub":0.374537,"k":17,"estudos":9},"opc":{"mu":0.188152,"lb":0.171888,"ub":0.204416,"k":401,"estudos":197},"reciclado":{"mu":0.217356,"lb":0.195846,"ub":0.238867,"k":131,"estudos":54},"scm":{"mu":0.168923,"lb":0.151206,"ub":0.186641,"k":302,"estudos":85},"uhpc":{"mu":0.0519428,"lb":-0.0109002,"ub":0.114786,"k":14,"estudos":7}}},"s|todos|sem|citf":{"k":336,"estudos":86,"global":{"mu":0.145581,"lb":0.128746,"ub":0.162417,"pi_lb":0.00625587,"pi_ub":0.284907,"i2":99.6532},"familias":{"biobase":{"mu":0.0710234,"lb":-0.111545,"ub":0.253591,"k":1,"estudos":1},"concreto_armado":{"mu":0.200207,"lb":0.129296,"ub":0.271117,"k":9,"estudos":5},"geopolimero":{"mu":0.132862,"lb":0.102506,"ub":0.163218,"k":36,"estudos":11},"ligantes":{"mu":0.266332,"lb":0.16869,"ub":0.363974,"k":5,"estudos":1},"opc":{"mu":0.150115,"lb":0.131087,"ub":0.169143,"k":98,"estudos":48},"reciclado":{"mu":0.197154,"lb":0.174556,"ub":0.219752,"k":50,"estudos":14},"scm":{"mu":0.122932,"lb":0.100219,"ub":0.145645,"k":112,"estudos":25},"uhpc":{"mu":0.0787346,"lb":0.0520569,"ub":0.105412,"k":25,"estudos":9}}},"ps|portland|sem|citf":{"k":1224,"estudos":350,"global":{"mu":0.165549,"lb":0.15754,"ub":0.173558,"pi_lb":0.0321959,"pi_ub":0.298902,"i2":99.8986},"familias":{"concreto_armado":{"mu":0.195875,"lb":0.172568,"ub":0.219182,"k":91,"estudos":39},"opc":{"mu":0.167443,"lb":0.158966,"ub":0.17592,"k":499,"estudos":245},"reciclado":{"mu":0.201258,"lb":0.189356,"ub":0.213161,"k":181,"estudos":68},"scm":{"mu":0.145489,"lb":0.135699,"ub":0.15528,"k":414,"estudos":110},"uhpc":{"mu":0.0673037,"lb":0.0431388,"ub":0.0914687,"k":39,"estudos":16}}},"p|portland|sem|citf":{"k":930,"estudos":272,"global":{"mu":0.171507,"lb":0.162751,"ub":0.180263,"pi_lb":0.0442264,"pi_ub":0.298787,"i2":99.9063},"familias":{"concreto_armado":{"mu":0.195776,"lb":0.170644,"ub":0.220909,"k":82,"estudos":34},"opc":{"mu":0.173113,"lb":0.163461,"ub":0.182766,"k":401,"estudos":197},"reciclado":{"mu":0.203161,"lb":0.189169,"ub":0.217153,"k":131,"estudos":54},"scm":{"mu":0.151858,"lb":0.140883,"ub":0.162833,"k":302,"estudos":85},"uhpc":{"mu":0.0373154,"lb":-0.00900872,"ub":0.0836394,"k":14,"estudos":7}}},"s|portland|sem|citf":{"k":294,"estudos":78,"global":{"mu":0.145606,"lb":0.128104,"ub":0.163109,"pi_lb":0.00460793,"pi_ub":0.286605,"i2":99.7004},"familias":{"concreto_armado":{"mu":0.201796,"lb":0.135784,"ub":0.267808,"k":9,"estudos":5},"opc":{"mu":0.151611,"lb":0.133562,"ub":0.169661,"k":98,"estudos":48},"reciclado":{"mu":0.195707,"lb":0.173909,"ub":0.217505,"k":50,"estudos":14},"scm":{"mu":0.121064,"lb":0.0988986,"ub":0.14323,"k":112,"estudos":25},"uhpc":{"mu":0.0738214,"lb":0.0468633,"ub":0.10078,"k":25,"estudos":9}}},"ps|todos|com|citf":{"k":1498,"estudos":398,"global":{"mu":0.168704,"lb":0.156824,"ub":0.180584,"pi_lb":-0.0397341,"pi_ub":0.377142,"i2":99.9567},"familias":{"biobase":{"mu":-0.0581998,"lb":-0.387427,"ub":0.271027,"k":1,"estudos":1},"concreto_armado":{"mu":0.196507,"lb":0.160903,"ub":0.232112,"k":104,"estudos":43},"geopolimero":{"mu":0.097965,"lb":0.0744767,"ub":0.121453,"k":218,"estudos":57},"ligantes":{"mu":0.293648,"lb":0.236048,"ub":0.351248,"k":22,"estudos":10},"opc":{"mu":0.178903,"lb":0.165318,"ub":0.192487,"k":504,"estudos":250},"reciclado":{"mu":0.207198,"lb":0.189391,"ub":0.225005,"k":191,"estudos":73},"scm":{"mu":0.158252,"lb":0.143138,"ub":0.173366,"k":419,"estudos":113},"uhpc":{"mu":0.0809408,"lb":0.0457154,"ub":0.116166,"k":39,"estudos":16}}},"p|todos|com|citf":{"k":1158,"estudos":311,"global":{"mu":0.176111,"lb":0.161568,"ub":0.190653,"pi_lb":-0.0509824,"pi_ub":0.403204,"i2":99.9693},"familias":{"concreto_armado":{"mu":0.199208,"lb":0.158207,"ub":0.240209,"k":95,"estudos":38},"geopolimero":{"mu":0.0837814,"lb":0.0557557,"ub":0.111807,"k":182,"estudos":46},"ligantes":{"mu":0.298656,"lb":0.231051,"ub":0.366261,"k":17,"estudos":9},"opc":{"mu":0.189474,"lb":0.172676,"ub":0.206273,"k":406,"estudos":202},"reciclado":{"mu":0.21344,"lb":0.191256,"ub":0.235624,"k":138,"estudos":58},"scm":{"mu":0.168582,"lb":0.150293,"ub":0.186872,"k":306,"estudos":87},"uhpc":{"mu":0.0431167,"lb":-0.0261417,"ub":0.112375,"k":14,"estudos":7}}},"s|todos|com|citf":{"k":340,"estudos":87,"global":{"mu":0.141822,"lb":0.125337,"ub":0.158308,"pi_lb":0.00729579,"pi_ub":0.276349,"i2":99.6226},"familias":{"biobase":{"mu":-0.0581998,"lb":-0.254893,"ub":0.138493,"k":1,"estudos":1},"concreto_armado":{"mu":0.198025,"lb":0.124126,"ub":0.271925,"k":9,"estudos":5},"geopolimero":{"mu":0.135869,"lb":0.103277,"ub":0.168461,"k":36,"estudos":11},"ligantes":{"mu":0.264498,"lb":0.167963,"ub":0.361033,"k":5,"estudos":1},"opc":{"mu":0.145836,"lb":0.126716,"ub":0.164956,"k":98,"estudos":48},"reciclado":{"mu":0.186158,"lb":0.163891,"ub":0.208426,"k":53,"estudos":15},"scm":{"mu":0.124555,"lb":0.101458,"ub":0.147652,"k":113,"estudos":26},"uhpc":{"mu":0.0732294,"lb":0.0444742,"ub":0.101985,"k":25,"estudos":9}}},"ps|portland|com|citf":{"k":1256,"estudos":359,"global":{"mu":0.162912,"lb":0.154991,"ub":0.170833,"pi_lb":0.0309965,"pi_ub":0.294828,"i2":99.8946},"familias":{"concreto_armado":{"mu":0.195257,"lb":0.172849,"ub":0.217666,"k":103,"estudos":42},"opc":{"mu":0.16449,"lb":0.155953,"ub":0.173027,"k":504,"estudos":250},"reciclado":{"mu":0.193264,"lb":0.181436,"ub":0.205092,"k":191,"estudos":73},"scm":{"mu":0.143667,"lb":0.133875,"ub":0.153458,"k":419,"estudos":113},"uhpc":{"mu":0.066322,"lb":0.0410325,"ub":0.0916116,"k":39,"estudos":16}}},"p|portland|com|citf":{"k":958,"estudos":280,"global":{"mu":0.168844,"lb":0.160073,"ub":0.177615,"pi_lb":0.0402928,"pi_ub":0.297395,"i2":99.9063},"familias":{"concreto_armado":{"mu":0.195807,"lb":0.171764,"ub":0.21985,"k":94,"estudos":37},"opc":{"mu":0.170299,"lb":0.160574,"ub":0.180024,"k":406,"estudos":202},"reciclado":{"mu":0.195785,"lb":0.18186,"ub":0.20971,"k":138,"estudos":58},"scm":{"mu":0.149421,"lb":0.138439,"ub":0.160402,"k":306,"estudos":87},"uhpc":{"mu":0.0369224,"lb":-0.010133,"ub":0.0839777,"k":14,"estudos":7}}},"s|portland|com|citf":{"k":298,"estudos":79,"global":{"mu":0.142186,"lb":0.125341,"ub":0.159032,"pi_lb":0.00902369,"pi_ub":0.275349,"i2":99.6586},"familias":{"concreto_armado":{"mu":0.199757,"lb":0.131942,"ub":0.267572,"k":9,"estudos":5},"opc":{"mu":0.147074,"lb":0.128891,"ub":0.165257,"k":98,"estudos":48},"reciclado":{"mu":0.184828,"lb":0.163303,"ub":0.206353,"k":53,"estudos":15},"scm":{"mu":0.123675,"lb":0.101292,"ub":0.146058,"k":113,"estudos":26},"uhpc":{"mu":0.0700362,"lb":0.0411825,"ub":0.0988899,"k":25,"estudos":9}}},"ps|todos|sem|citm":{"k":1449,"estudos":388,"global":{"mu":0.109667,"lb":0.102935,"ub":0.1164,"pi_lb":-0.00901048,"pi_ub":0.228345,"i2":99.9344},"familias":{"biobase":{"mu":0.0420937,"lb":-0.13109,"ub":0.215277,"k":1,"estudos":1},"concreto_armado":{"mu":0.0917299,"lb":0.0709337,"ub":0.112526,"k":91,"estudos":39},"geopolimero":{"mu":0.0490548,"lb":0.0361328,"ub":0.0619767,"k":202,"estudos":56},"ligantes":{"mu":0.109953,"lb":0.0780618,"ub":0.141844,"k":22,"estudos":10},"opc":{"mu":0.109026,"lb":0.101658,"ub":0.116394,"k":499,"estudos":245},"reciclado":{"mu":0.194769,"lb":0.18401,"ub":0.205528,"k":181,"estudos":68},"scm":{"mu":0.114654,"lb":0.106099,"ub":0.123208,"k":414,"estudos":110},"uhpc":{"mu":0.0511163,"lb":0.0312051,"ub":0.0710274,"k":39,"estudos":16}}},"p|todos|sem|citm":{"k":1113,"estudos":302,"global":{"mu":0.113322,"lb":0.105617,"ub":0.121028,"pi_lb":-0.00571584,"pi_ub":0.23236,"i2":99.945},"familias":{"concreto_armado":{"mu":0.0914147,"lb":0.0687638,"ub":0.114066,"k":82,"estudos":34},"geopolimero":{"mu":0.0453843,"lb":0.030421,"ub":0.0603475,"k":166,"estudos":45},"ligantes":{"mu":0.116705,"lb":0.0815658,"ub":0.151844,"k":17,"estudos":9},"opc":{"mu":0.115023,"lb":0.106514,"ub":0.123532,"k":401,"estudos":197},"reciclado":{"mu":0.197549,"lb":0.184677,"ub":0.210422,"k":131,"estudos":54},"scm":{"mu":0.121569,"lb":0.111828,"ub":0.131311,"k":302,"estudos":85},"uhpc":{"mu":0.0267574,"lb":-0.00987693,"ub":0.0633918,"k":14,"estudos":7}}},"s|todos|sem|citm":{"k":336,"estudos":86,"global":{"mu":0.0976009,"lb":0.0845267,"ub":0.110675,"pi_lb":-0.0142123,"pi_ub":0.209414,"i2":99.7553},"familias":{"biobase":{"mu":0.0420937,"lb":-0.120002,"ub":0.204189,"k":1,"estudos":1},"concreto_armado":{"mu":0.0958898,"lb":0.0360288,"ub":0.155751,"k":9,"estudos":5},"geopolimero":{"mu":0.0565016,"lb":0.0331965,"ub":0.0798067,"k":36,"estudos":11},"ligantes":{"mu":0.0642134,"lb":-0.00874957,"ub":0.137176,"k":5,"estudos":1},"opc":{"mu":0.0928578,"lb":0.0782039,"ub":0.107512,"k":98,"estudos":48},"reciclado":{"mu":0.18618,"lb":0.168037,"ub":0.204323,"k":50,"estudos":14},"scm":{"mu":0.0920055,"lb":0.0748245,"ub":0.109186,"k":112,"estudos":25},"uhpc":{"mu":0.0540764,"lb":0.0326425,"ub":0.0755103,"k":25,"estudos":9}}},"ps|portland|sem|citm":{"k":1224,"estudos":350,"global":{"mu":0.114765,"lb":0.108267,"ub":0.121263,"pi_lb":0.00806482,"pi_ub":0.221465,"i2":99.9106},"familias":{"concreto_armado":{"mu":0.0914832,"lb":0.0728729,"ub":0.110093,"k":91,"estudos":39},"opc":{"mu":0.1047,"lb":0.0980776,"ub":0.111322,"k":499,"estudos":245},"reciclado":{"mu":0.190554,"lb":0.181007,"ub":0.2001,"k":181,"estudos":68},"scm":{"mu":0.109216,"lb":0.101545,"ub":0.116887,"k":414,"estudos":110},"uhpc":{"mu":0.0495933,"lb":0.0311604,"ub":0.0680262,"k":39,"estudos":16}}},"p|portland|sem|citm":{"k":930,"estudos":272,"global":{"mu":0.118335,"lb":0.111228,"ub":0.125442,"pi_lb":0.0173373,"pi_ub":0.219332,"i2":99.9143},"familias":{"concreto_armado":{"mu":0.0911584,"lb":0.0716763,"ub":0.110641,"k":82,"estudos":34},"opc":{"mu":0.109816,"lb":0.102494,"ub":0.117138,"k":401,"estudos":197},"reciclado":{"mu":0.191717,"lb":0.180752,"ub":0.202683,"k":131,"estudos":54},"scm":{"mu":0.114449,"lb":0.106103,"ub":0.122795,"k":302,"estudos":85},"uhpc":{"mu":0.0235742,"lb":-0.0102534,"ub":0.0574018,"k":14,"estudos":7}}},"s|portland|sem|citm":{"k":294,"estudos":78,"global":{"mu":0.103431,"lb":0.0891233,"ub":0.117739,"pi_lb":-0.0123582,"pi_ub":0.21922,"i2":99.7935},"familias":{"concreto_armado":{"mu":0.0958145,"lb":0.0342549,"ub":0.157374,"k":9,"estudos":5},"opc":{"mu":0.0925826,"lb":0.0773382,"ub":0.107827,"k":98,"estudos":48},"reciclado":{"mu":0.186305,"lb":0.167388,"ub":0.205222,"k":50,"estudos":14},"scm":{"mu":0.0918884,"lb":0.0735667,"ub":0.11021,"k":112,"estudos":25},"uhpc":{"mu":0.0539353,"lb":0.0311205,"ub":0.0767501,"k":25,"estudos":9}}},"ps|todos|com|citm":{"k":1498,"estudos":398,"global":{"mu":0.107621,"lb":0.100975,"ub":0.114268,"pi_lb":-0.0102272,"pi_ub":0.22547,"i2":99.9379},"familias":{"biobase":{"mu":-0.0344935,"lb":-0.211595,"ub":0.142608,"k":1,"estudos":1},"concreto_armado":{"mu":0.0929693,"lb":0.0733547,"ub":0.112584,"k":104,"estudos":43},"geopolimero":{"mu":0.0406261,"lb":0.0273671,"ub":0.0538852,"k":218,"estudos":57},"ligantes":{"mu":0.105763,"lb":0.0733294,"ub":0.138197,"k":22,"estudos":10},"opc":{"mu":0.108281,"lb":0.100823,"ub":0.115738,"k":504,"estudos":250},"reciclado":{"mu":0.188561,"lb":0.177838,"ub":0.199285,"k":191,"estudos":73},"scm":{"mu":0.114119,"lb":0.105514,"ub":0.122724,"k":419,"estudos":113},"uhpc":{"mu":0.0509237,"lb":0.0294119,"ub":0.0724355,"k":39,"estudos":16}}},"p|todos|com|citm":{"k":1158,"estudos":311,"global":{"mu":0.110977,"lb":0.103324,"ub":0.118631,"pi_lb":-0.00855804,"pi_ub":0.230513,"i2":99.9493},"familias":{"concreto_armado":{"mu":0.0934893,"lb":0.0722644,"ub":0.114714,"k":95,"estudos":38},"geopolimero":{"mu":0.034468,"lb":0.0193389,"ub":0.0495971,"k":182,"estudos":46},"ligantes":{"mu":0.111319,"lb":0.0755168,"ub":0.147121,"k":17,"estudos":9},"opc":{"mu":0.114593,"lb":0.105983,"ub":0.123203,"k":406,"estudos":202},"reciclado":{"mu":0.191845,"lb":0.179036,"ub":0.204655,"k":138,"estudos":58},"scm":{"mu":0.120503,"lb":0.110742,"ub":0.130265,"k":306,"estudos":87},"uhpc":{"mu":0.0248578,"lb":-0.0133362,"ub":0.0630518,"k":14,"estudos":7}}},"s|todos|com|citm":{"k":340,"estudos":87,"global":{"mu":0.0958969,"lb":0.0832999,"ub":0.108494,"pi_lb":-0.0116274,"pi_ub":0.203421,"i2":99.7318},"familias":{"biobase":{"mu":-0.0344935,"lb":-0.192135,"ub":0.123148,"k":1,"estudos":1},"concreto_armado":{"mu":0.0956355,"lb":0.036317,"ub":0.154954,"k":9,"estudos":5},"geopolimero":{"mu":0.0559349,"lb":0.030758,"ub":0.0811117,"k":36,"estudos":11},"ligantes":{"mu":0.0634757,"lb":-0.00936495,"ub":0.136316,"k":5,"estudos":1},"opc":{"mu":0.0908356,"lb":0.075955,"ub":0.105716,"k":98,"estudos":48},"reciclado":{"mu":0.177773,"lb":0.159751,"ub":0.195795,"k":53,"estudos":15},"scm":{"mu":0.0942291,"lb":0.0764486,"ub":0.11201,"k":113,"estudos":26},"uhpc":{"mu":0.0520395,"lb":0.0285,"ub":0.075579,"k":25,"estudos":9}}},"ps|portland|com|citm":{"k":1256,"estudos":359,"global":{"mu":0.113144,"lb":0.106785,"ub":0.119504,"pi_lb":0.00846656,"pi_ub":0.217822,"i2":99.9059},"familias":{"concreto_armado":{"mu":0.0925689,"lb":0.0750989,"ub":0.110039,"k":103,"estudos":42},"opc":{"mu":0.102826,"lb":0.0961926,"ub":0.109459,"k":504,"estudos":250},"reciclado":{"mu":0.183659,"lb":0.174234,"ub":0.193083,"k":191,"estudos":73},"scm":{"mu":0.108145,"lb":0.100515,"ub":0.115774,"k":419,"estudos":113},"uhpc":{"mu":0.0497428,"lb":0.0302266,"ub":0.0692591,"k":39,"estudos":16}}},"p|portland|com|citm":{"k":958,"estudos":280,"global":{"mu":0.116343,"lb":0.1093,"ub":0.123386,"pi_lb":0.0153842,"pi_ub":0.217302,"i2":99.9129},"familias":{"concreto_armado":{"mu":0.0926396,"lb":0.074448,"ub":0.110831,"k":94,"estudos":37},"opc":{"mu":0.107866,"lb":0.100525,"ub":0.115207,"k":406,"estudos":202},"reciclado":{"mu":0.184888,"lb":0.174061,"ub":0.195714,"k":138,"estudos":58},"scm":{"mu":0.112687,"lb":0.104397,"ub":0.120978,"k":306,"estudos":87},"uhpc":{"mu":0.0232748,"lb":-0.0110146,"ub":0.0575642,"k":14,"estudos":7}}},"s|portland|com|citm":{"k":298,"estudos":79,"global":{"mu":0.102232,"lb":0.0884955,"ub":0.115968,"pi_lb":-0.00860731,"pi_ub":0.213071,"i2":99.7713},"familias":{"concreto_armado":{"mu":0.0956888,"lb":0.0353857,"ub":0.155992,"k":9,"estudos":5},"opc":{"mu":0.0906877,"lb":0.0752501,"ub":0.106125,"k":98,"estudos":48},"reciclado":{"mu":0.177952,"lb":0.159191,"ub":0.196713,"k":53,"estudos":15},"scm":{"mu":0.0941734,"lb":0.0754228,"ub":0.112924,"k":113,"estudos":26},"uhpc":{"mu":0.0519903,"lb":0.0272586,"ub":0.076722,"k":25,"estudos":9}}},"ps|todos|sem|citn":{"k":1449,"estudos":388,"global":{"mu":0.184767,"lb":0.174795,"ub":0.19474,"pi_lb":0.0110193,"pi_ub":0.358516,"i2":99.9113},"familias":{"biobase":{"mu":0.09216,"lb":-0.185899,"ub":0.370219,"k":1,"estudos":1},"concreto_armado":{"mu":0.238381,"lb":0.205089,"ub":0.271673,"k":91,"estudos":39},"geopolimero":{"mu":0.107415,"lb":0.0861109,"ub":0.12872,"k":202,"estudos":56},"ligantes":{"mu":0.203129,"lb":0.152254,"ub":0.254004,"k":22,"estudos":10},"opc":{"mu":0.194373,"lb":0.182451,"ub":0.206294,"k":499,"estudos":245},"reciclado":{"mu":0.214422,"lb":0.197818,"ub":0.231027,"k":181,"estudos":68},"scm":{"mu":0.177386,"lb":0.163669,"ub":0.191104,"k":414,"estudos":110},"uhpc":{"mu":0.147002,"lb":0.112352,"ub":0.181652,"k":39,"estudos":16}}},"p|todos|sem|citn":{"k":1113,"estudos":302,"global":{"mu":0.190638,"lb":0.178678,"ub":0.202597,"pi_lb":0.00639671,"pi_ub":0.374878,"i2":99.9373},"familias":{"concreto_armado":{"mu":0.237521,"lb":0.199979,"ub":0.275064,"k":82,"estudos":34},"geopolimero":{"mu":0.103292,"lb":0.0783818,"ub":0.128203,"k":166,"estudos":45},"ligantes":{"mu":0.214819,"lb":0.156723,"ub":0.272914,"k":17,"estudos":9},"opc":{"mu":0.201528,"lb":0.187283,"ub":0.215772,"k":401,"estudos":197},"reciclado":{"mu":0.216911,"lb":0.196572,"ub":0.23725,"k":131,"estudos":54},"scm":{"mu":0.185717,"lb":0.16965,"ub":0.201783,"k":302,"estudos":85},"uhpc":{"mu":0.135382,"lb":0.0682165,"ub":0.202547,"k":14,"estudos":7}}},"s|todos|sem|citn":{"k":336,"estudos":86,"global":{"mu":0.163675,"lb":0.148523,"ub":0.178826,"pi_lb":0.0383113,"pi_ub":0.289038,"i2":98.473},"familias":{"biobase":{"mu":0.09216,"lb":-0.0923802,"ub":0.2767,"k":1,"estudos":1},"concreto_armado":{"mu":0.246963,"lb":0.175768,"ub":0.318158,"k":9,"estudos":5},"geopolimero":{"mu":0.119701,"lb":0.084518,"ub":0.154884,"k":36,"estudos":11},"ligantes":{"mu":0.141281,"lb":0.0462578,"ub":0.236304,"k":5,"estudos":1},"opc":{"mu":0.173624,"lb":0.153934,"ub":0.193314,"k":98,"estudos":48},"reciclado":{"mu":0.203227,"lb":0.178874,"ub":0.227579,"k":50,"estudos":14},"scm":{"mu":0.144103,"lb":0.119673,"ub":0.168534,"k":112,"estudos":25},"uhpc":{"mu":0.141107,"lb":0.108351,"ub":0.173863,"k":25,"estudos":9}}},"ps|portland|sem|citn":{"k":1224,"estudos":350,"global":{"mu":0.188096,"lb":0.179754,"ub":0.196438,"pi_lb":0.0512047,"pi_ub":0.324987,"i2":99.8413},"familias":{"concreto_armado":{"mu":0.241352,"lb":0.215271,"ub":0.267432,"k":91,"estudos":39},"opc":{"mu":0.186301,"lb":0.176837,"ub":0.195764,"k":499,"estudos":245},"reciclado":{"mu":0.207291,"lb":0.193999,"ub":0.220582,"k":181,"estudos":68},"scm":{"mu":0.166955,"lb":0.155976,"ub":0.177933,"k":414,"estudos":110},"uhpc":{"mu":0.142125,"lb":0.113055,"ub":0.171195,"k":39,"estudos":16}}},"p|portland|sem|citn":{"k":930,"estudos":272,"global":{"mu":0.193182,"lb":0.183675,"ub":0.202688,"pi_lb":0.0561129,"pi_ub":0.33025,"i2":99.8742},"familias":{"concreto_armado":{"mu":0.240762,"lb":0.212513,"ub":0.26901,"k":82,"estudos":34},"opc":{"mu":0.191227,"lb":0.180435,"ub":0.202019,"k":401,"estudos":197},"reciclado":{"mu":0.207815,"lb":0.192207,"ub":0.223423,"k":131,"estudos":54},"scm":{"mu":0.172686,"lb":0.160404,"ub":0.184968,"k":302,"estudos":85},"uhpc":{"mu":0.130872,"lb":0.0759367,"ub":0.185808,"k":14,"estudos":7}}},"s|portland|sem|citn":{"k":294,"estudos":78,"global":{"mu":0.170542,"lb":0.154036,"ub":0.187049,"pi_lb":0.040476,"pi_ub":0.300609,"i2":98.6889},"familias":{"concreto_armado":{"mu":0.24819,"lb":0.177336,"ub":0.319044,"k":9,"estudos":5},"opc":{"mu":0.173831,"lb":0.153929,"ub":0.193733,"k":98,"estudos":48},"reciclado":{"mu":0.203416,"lb":0.178711,"ub":0.228121,"k":50,"estudos":14},"scm":{"mu":0.14316,"lb":0.118014,"ub":0.168306,"k":112,"estudos":25},"uhpc":{"mu":0.139745,"lb":0.106169,"ub":0.17332,"k":25,"estudos":9}}},"ps|todos|com|citn":{"k":1498,"estudos":398,"global":{"mu":0.181495,"lb":0.171439,"ub":0.19155,"pi_lb":0.00420578,"pi_ub":0.358784,"i2":99.9181},"familias":{"biobase":{"mu":-0.07552,"lb":-0.36673,"ub":0.21569,"k":1,"estudos":1},"concreto_armado":{"mu":0.238892,"lb":0.206804,"ub":0.27098,"k":104,"estudos":43},"geopolimero":{"mu":0.0908261,"lb":0.0689583,"ub":0.112694,"k":218,"estudos":57},"ligantes":{"mu":0.196774,"lb":0.144398,"ub":0.24915,"k":22,"estudos":10},"opc":{"mu":0.193786,"lb":0.181617,"ub":0.205955,"k":504,"estudos":250},"reciclado":{"mu":0.20819,"lb":0.191365,"ub":0.225014,"k":191,"estudos":73},"scm":{"mu":0.176206,"lb":0.162266,"ub":0.190146,"k":419,"estudos":113},"uhpc":{"mu":0.144603,"lb":0.108392,"ub":0.180814,"k":39,"estudos":16}}},"p|todos|com|citn":{"k":1158,"estudos":311,"global":{"mu":0.187547,"lb":0.175489,"ub":0.199605,"pi_lb":-0.00127323,"pi_ub":0.376367,"i2":99.9424},"familias":{"concreto_armado":{"mu":0.240019,"lb":0.204051,"ub":0.275986,"k":95,"estudos":38},"geopolimero":{"mu":0.08168,"lb":0.0561092,"ub":0.107251,"k":182,"estudos":46},"ligantes":{"mu":0.206909,"lb":0.146912,"ub":0.266905,"k":17,"estudos":9},"opc":{"mu":0.201534,"lb":0.186989,"ub":0.21608,"k":406,"estudos":202},"reciclado":{"mu":0.2118,"lb":0.191186,"ub":0.232414,"k":138,"estudos":58},"scm":{"mu":0.184571,"lb":0.168227,"ub":0.200915,"k":306,"estudos":87},"uhpc":{"mu":0.132376,"lb":0.0607927,"ub":0.20396,"k":14,"estudos":7}}},"s|todos|com|citn":{"k":340,"estudos":87,"global":{"mu":0.158336,"lb":0.143456,"ub":0.173216,"pi_lb":0.0374559,"pi_ub":0.279215,"i2":98.3374},"familias":{"biobase":{"mu":-0.07552,"lb":-0.280227,"ub":0.129187,"k":1,"estudos":1},"concreto_armado":{"mu":0.243481,"lb":0.167482,"ub":0.31948,"k":9,"estudos":5},"geopolimero":{"mu":0.119141,"lb":0.0840587,"ub":0.154222,"k":36,"estudos":11},"ligantes":{"mu":0.138608,"lb":0.0441036,"ub":0.233112,"k":5,"estudos":1},"opc":{"mu":0.168539,"lb":0.148579,"ub":0.188499,"k":98,"estudos":48},"reciclado":{"mu":0.192239,"lb":0.168245,"ub":0.216234,"k":53,"estudos":15},"scm":{"mu":0.144124,"lb":0.119836,"ub":0.168413,"k":113,"estudos":26},"uhpc":{"mu":0.137634,"lb":0.104811,"ub":0.170456,"k":25,"estudos":9}}},"ps|portland|com|citn":{"k":1256,"estudos":359,"global":{"mu":0.184911,"lb":0.17656,"ub":0.193262,"pi_lb":0.0474702,"pi_ub":0.322352,"i2":99.8403},"familias":{"concreto_armado":{"mu":0.239895,"lb":0.214784,"ub":0.265007,"k":103,"estudos":42},"opc":{"mu":0.182927,"lb":0.173396,"ub":0.192459,"k":504,"estudos":250},"reciclado":{"mu":0.19904,"lb":0.185818,"ub":0.212261,"k":191,"estudos":73},"scm":{"mu":0.164598,"lb":0.153626,"ub":0.17557,"k":419,"estudos":113},"uhpc":{"mu":0.140161,"lb":0.110697,"ub":0.169625,"k":39,"estudos":16}}},"p|portland|com|citn":{"k":958,"estudos":280,"global":{"mu":0.190391,"lb":0.180834,"ub":0.199949,"pi_lb":0.0513582,"pi_ub":0.329424,"i2":99.8756},"familias":{"concreto_armado":{"mu":0.240478,"lb":0.213435,"ub":0.26752,"k":94,"estudos":37},"opc":{"mu":0.188155,"lb":0.177289,"ub":0.199021,"k":406,"estudos":202},"reciclado":{"mu":0.200255,"lb":0.184718,"ub":0.215792,"k":138,"estudos":58},"scm":{"mu":0.170036,"lb":0.157747,"ub":0.182324,"k":306,"estudos":87},"uhpc":{"mu":0.130373,"lb":0.0744382,"ub":0.186307,"k":14,"estudos":7}}},"s|portland|com|citn":{"k":298,"estudos":79,"global":{"mu":0.165758,"lb":0.149637,"ub":0.181879,"pi_lb":0.0410652,"pi_ub":0.290451,"i2":98.5536},"familias":{"concreto_armado":{"mu":0.245219,"lb":0.171199,"ub":0.31924,"k":9,"estudos":5},"opc":{"mu":0.16876,"lb":0.14859,"ub":0.18893,"k":98,"estudos":48},"reciclado":{"mu":0.191993,"lb":0.167603,"ub":0.216382,"k":53,"estudos":15},"scm":{"mu":0.143561,"lb":0.118577,"ub":0.168545,"k":113,"estudos":26},"uhpc":{"mu":0.136236,"lb":0.102593,"ub":0.169879,"k":25,"estudos":9}}}}};
  var VIDA_FAM = {"_global":{"n_fam":159,"fam":64.88,"n_mod":17,"mod":109.47,"n_nor":563,"nor":54.92},"r":{"n_fam":14,"fam":53.12,"n_mod":1,"mod":53.7,"n_nor":73,"nor":52.47},"l":{"n_fam":1,"fam":30.0,"n_mod":0,"mod":109.47,"n_nor":10,"nor":53.0},"g":{"n_fam":4,"fam":42.5,"n_mod":0,"mod":109.47,"n_nor":57,"nor":50.88},"u":{"n_fam":2,"fam":196.0,"n_mod":1,"mod":302.0,"n_nor":16,"nor":56.25},"b":{"n_fam":0,"fam":64.88,"n_mod":0,"mod":109.47,"n_nor":1,"nor":50.0},"c":{"n_fam":28,"fam":80.46,"n_mod":2,"mod":167.31,"n_nor":43,"nor":65.58},"o":{"n_fam":84,"fam":61.65,"n_mod":9,"mod":95.89,"n_nor":250,"nor":55.92},"s":{"n_fam":26,"fam":59.56,"n_mod":4,"mod":76.9,"n_nor":113,"nor":52.3}};
  var MODELO_MIN_ESTUDOS = 2;
  /* F63 (Kiê, 2026-11-27): transporte até a obra (A4). A4[i] alinhado com DATA[i]:
     [grupo, coef betoneira, coef truck 3e, coef carreta 4e, coef carreta 5e] em
     kg CO₂-eq/(m³·km) (factor SIDAC × massa específica; motor_a4.py da RSL).
     grupo: 's' = A4 comprovadamente fora do valor (somável, F38), 'p' = provável,
     'n' = já incluído, 'i' = incerto. A4MODELO = grelha do modelo (exportar_a4_site.R).
     Gerados por metanalise/inserir_a4_site.py no repositório da RSL. */
  var A4 = [["p",0.195,0.1365,0.1365,0.117],["s",0.2342,0.1639,0.1639,0.1405],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.23,0.161,0.161,0.138],["n",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.229,0.1603,0.1603,0.1374],["n",0.2336,0.1635,0.1635,0.1402],["n",0.2358,0.1651,0.1651,0.1415],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.2375,0.1663,0.1663,0.1425],["s",0.2374,0.1662,0.1662,0.1425],["p",0.1996,0.1397,0.1397,0.1198],["p",0.1998,0.1399,0.1399,0.1199],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.237,0.1659,0.1659,0.1422],["s",0.2255,0.1579,0.1579,0.1353],["s",0.2307,0.1615,0.1615,0.1384],["s",0.2241,0.1569,0.1569,0.1345],["s",0.2288,0.1601,0.1601,0.1373],["s",0.2391,0.1674,0.1674,0.1435],["s",0.2478,0.1735,0.1735,0.1487],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.187,0.1309,0.1309,0.1122],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.232,0.1624,0.1624,0.1392],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.236,0.1652,0.1652,0.1416],["s",0.236,0.1652,0.1652,0.1416],["i",0.24,0.168,0.168,0.144],["i",0.2245,0.1572,0.1572,0.1347],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["p",0.1824,0.1276,0.1276,0.1094],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.2331,0.1632,0.1632,0.1399],["i",0.2331,0.1632,0.1632,0.1399],["i",0.2331,0.1632,0.1632,0.1399],["i",0.2331,0.1632,0.1632,0.1399],["i",0.2331,0.1632,0.1632,0.1399],["s",0.2343,0.164,0.164,0.1406],["s",0.2343,0.164,0.164,0.1406],["s",0.2161,0.1513,0.1513,0.1297],["s",0.2161,0.1513,0.1513,0.1297],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["p",0.23,0.161,0.161,0.138],["n",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["p",0.2334,0.1634,0.1634,0.14],["p",0.2304,0.1613,0.1613,0.1382],["p",0.2297,0.1608,0.1608,0.1378],["p",0.2291,0.1604,0.1604,0.1375],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["i",0.2272,0.159,0.159,0.1363],["i",0.2388,0.1672,0.1672,0.1433],["i",0.2366,0.1656,0.1656,0.142],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["p",0.238,0.1666,0.1666,0.1428],["p",0.238,0.1666,0.1666,0.1428],["p",0.238,0.1666,0.1666,0.1428],["p",0.239,0.1673,0.1673,0.1434],["p",0.239,0.1673,0.1673,0.1434],["p",0.239,0.1673,0.1673,0.1434],["p",0.2214,0.155,0.155,0.1329],["p",0.2284,0.1599,0.1599,0.1371],["p",0.2354,0.1648,0.1648,0.1413],["s",0.2231,0.1562,0.1562,0.1339],["s",0.2473,0.1731,0.1731,0.1484],["s",0.2457,0.172,0.172,0.1474],["s",0.2446,0.1712,0.1712,0.1468],["s",0.243,0.1701,0.1701,0.1458],["s",0.2407,0.1685,0.1685,0.1444],["s",0.2418,0.1693,0.1693,0.1451],["s",0.2401,0.1681,0.1681,0.1441],["s",0.2391,0.1674,0.1674,0.1435],["s",0.238,0.1666,0.1666,0.1428],["s",0.2419,0.1693,0.1693,0.1451],["s",0.2407,0.1685,0.1685,0.1444],["s",0.2396,0.1677,0.1677,0.1438],["s",0.2386,0.167,0.167,0.1432],["p",0.2223,0.1556,0.1556,0.1334],["p",0.2167,0.1517,0.1517,0.13],["p",0.2193,0.1535,0.1535,0.1316],["p",0.2182,0.1527,0.1527,0.1309],["p",0.2221,0.1555,0.1555,0.1333],["p",0.2226,0.1558,0.1558,0.1336],["p",0.2234,0.1564,0.1564,0.134],["p",0.2231,0.1561,0.1561,0.1338],["p",0.2225,0.1557,0.1557,0.1335],["p",0.2218,0.1553,0.1553,0.1331],["p",0.2217,0.1552,0.1552,0.133],["p",0.2215,0.155,0.155,0.1329],["s",0.2382,0.1667,0.1667,0.1429],["s",0.2363,0.1654,0.1654,0.1418],["s",0.238,0.1666,0.1666,0.1428],["s",0.2396,0.1677,0.1677,0.1438],["s",0.2386,0.167,0.167,0.1432],["s",0.238,0.1666,0.1666,0.1428],["s",0.2382,0.1667,0.1667,0.1429],["s",0.2372,0.166,0.166,0.1423],["s",0.2371,0.166,0.166,0.1423],["s",0.234,0.1638,0.1638,0.1404],["s",0.234,0.1638,0.1638,0.1404],["s",0.2368,0.1658,0.1658,0.1421],["s",0.238,0.1666,0.1666,0.1428],["s",0.242,0.1694,0.1694,0.1452],["s",0.2421,0.1695,0.1695,0.1453],["s",0.2408,0.1685,0.1685,0.1445],["s",0.2638,0.1846,0.1846,0.1583],["s",0.2338,0.1637,0.1637,0.1403],["s",0.2266,0.1586,0.1586,0.136],["i",0.3038,0.2127,0.2127,0.1823],["s",0.24,0.168,0.168,0.144],["p",0.2358,0.165,0.165,0.1414],["s",0.243,0.1701,0.1701,0.1458],["s",0.2446,0.1712,0.1712,0.1467],["s",0.2473,0.1731,0.1731,0.1484],["s",0.197,0.1379,0.1379,0.1182],["s",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["p",0.2355,0.1649,0.1649,0.1413],["s",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.2319,0.1623,0.1623,0.1391],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["i",0.2308,0.1615,0.1615,0.1385],["s",0.2348,0.1644,0.1644,0.1409],["s",0.2362,0.1653,0.1653,0.1417],["s",0.2356,0.1649,0.1649,0.1414],["s",0.2367,0.1657,0.1657,0.142],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["i",0.2371,0.166,0.166,0.1423],["i",0.2377,0.1664,0.1664,0.1426],["i",0.2381,0.1666,0.1666,0.1428],["i",0.2383,0.1668,0.1668,0.143],["i",0.2373,0.1661,0.1661,0.1424],["i",0.2378,0.1664,0.1664,0.1426],["i",0.237,0.1659,0.1659,0.1422],["i",0.24,0.168,0.168,0.144],["s",0.2384,0.1669,0.1669,0.143],["s",0.2257,0.158,0.158,0.1354],["s",0.2311,0.1618,0.1618,0.1387],["s",0.232,0.1624,0.1624,0.1392],["s",0.2203,0.1542,0.1542,0.1322],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["s",0.2245,0.1572,0.1572,0.1347],["s",0.2213,0.1549,0.1549,0.1328],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.2311,0.1618,0.1618,0.1387],["s",0.2304,0.1613,0.1613,0.1383],["s",0.23,0.161,0.161,0.138],["s",0.2295,0.1607,0.1607,0.1377],["s",0.2306,0.1614,0.1614,0.1384],["s",0.2304,0.1613,0.1613,0.1382],["s",0.2302,0.1611,0.1611,0.1381],["s",0.2296,0.1607,0.1607,0.1377],["s",0.2295,0.1606,0.1606,0.1377],["s",0.2292,0.1604,0.1604,0.1375],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["s",0.2357,0.165,0.165,0.1414],["s",0.2455,0.1719,0.1719,0.1473],["s",0.2367,0.1657,0.1657,0.142],["s",0.2372,0.166,0.166,0.1423],["s",0.2375,0.1663,0.1663,0.1425],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["s",0.2366,0.1657,0.1657,0.142],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.253,0.1771,0.1771,0.1518],["s",0.253,0.1771,0.1771,0.1518],["s",0.253,0.1771,0.1771,0.1518],["s",0.253,0.1771,0.1771,0.1518],["s",0.253,0.1771,0.1771,0.1518],["s",0.253,0.1771,0.1771,0.1518],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.21,0.147,0.147,0.126],["i",0.2298,0.1608,0.1608,0.1379],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["i",0.225,0.1575,0.1575,0.135],["i",0.245,0.1715,0.1715,0.147],["p",0.2421,0.1695,0.1695,0.1453],["i",0.2521,0.1765,0.1765,0.1512],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["i",0.1978,0.1384,0.1384,0.1187],["i",0.2093,0.1465,0.1465,0.1256],["i",0.1984,0.1389,0.1389,0.119],["i",0.1876,0.1313,0.1313,0.1125],["i",0.1766,0.1236,0.1236,0.106],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.245,0.1715,0.1715,0.147],["s",0.189,0.1323,0.1323,0.1134],["s",0.191,0.1337,0.1337,0.1146],["n",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.2245,0.1572,0.1572,0.1347],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.232,0.1624,0.1624,0.1392],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.2353,0.1647,0.1647,0.1412],["s",0.2296,0.1607,0.1607,0.1377],["s",0.2335,0.1634,0.1634,0.1401],["s",0.2345,0.1642,0.1642,0.1407],["p",0.1967,0.1377,0.1377,0.118],["p",0.1972,0.1381,0.1381,0.1183],["p",0.1976,0.1383,0.1383,0.1186],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["i",0.2433,0.1703,0.1703,0.146],["i",0.2433,0.1703,0.1703,0.146],["i",0.2433,0.1703,0.1703,0.146],["i",0.2255,0.1578,0.1578,0.1353],["i",0.2195,0.1537,0.1537,0.1317],["i",0.2433,0.1703,0.1703,0.146],["i",0.2433,0.1703,0.1703,0.146],["i",0.2433,0.1703,0.1703,0.146],["i",0.2255,0.1578,0.1578,0.1353],["i",0.2195,0.1537,0.1537,0.1317],["i",0.2433,0.1703,0.1703,0.146],["i",0.2433,0.1703,0.1703,0.146],["i",0.2433,0.1703,0.1703,0.146],["i",0.2255,0.1578,0.1578,0.1353],["i",0.2195,0.1537,0.1537,0.1317],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.2406,0.1684,0.1684,0.1444],["p",0.2379,0.1665,0.1665,0.1427],["p",0.2392,0.1674,0.1674,0.1435],["n",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.2409,0.1686,0.1686,0.1445],["s",0.2418,0.1693,0.1693,0.1451],["s",0.243,0.1701,0.1701,0.1458],["s",0.2433,0.1703,0.1703,0.146],["s",0.2442,0.171,0.171,0.1465],["s",0.2451,0.1716,0.1716,0.1471],["s",0.2463,0.1724,0.1724,0.1478],["s",0.2444,0.1711,0.1711,0.1467],["s",0.2453,0.1717,0.1717,0.1472],["s",0.2462,0.1724,0.1724,0.1477],["s",0.2475,0.1732,0.1732,0.1485],["p",0.235,0.1645,0.1645,0.141],["p",0.235,0.1645,0.1645,0.141],["p",0.235,0.1645,0.1645,0.141],["p",0.235,0.1645,0.1645,0.141],["p",0.235,0.1645,0.1645,0.141],["p",0.2186,0.153,0.153,0.1312],["p",0.2186,0.153,0.153,0.1312],["p",0.2186,0.153,0.153,0.1312],["p",0.2186,0.153,0.153,0.1312],["p",0.2186,0.153,0.153,0.1312],["p",0.249,0.1743,0.1743,0.1494],["p",0.249,0.1743,0.1743,0.1494],["p",0.249,0.1743,0.1743,0.1494],["p",0.249,0.1743,0.1743,0.1494],["p",0.249,0.1743,0.1743,0.1494],["p",0.2058,0.1441,0.1441,0.1235],["p",0.2058,0.1441,0.1441,0.1235],["p",0.2058,0.1441,0.1441,0.1235],["p",0.2058,0.1441,0.1441,0.1235],["p",0.2058,0.1441,0.1441,0.1235],["p",0.2358,0.1651,0.1651,0.1415],["p",0.2358,0.1651,0.1651,0.1415],["p",0.2358,0.1651,0.1651,0.1415],["p",0.2358,0.1651,0.1651,0.1415],["p",0.2358,0.1651,0.1651,0.1415],["i",0.2372,0.166,0.166,0.1423],["i",0.2343,0.164,0.164,0.1406],["i",0.2373,0.1661,0.1661,0.1424],["i",0.2357,0.165,0.165,0.1414],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.1427,0.0999,0.0999,0.0856],["s",0.1368,0.0958,0.0958,0.0821],["s",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["s",0.2291,0.1604,0.1604,0.1375],["s",0.2282,0.1597,0.1597,0.1369],["s",0.2284,0.1599,0.1599,0.137],["s",0.2279,0.1595,0.1595,0.1367],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["p",0.2317,0.1622,0.1622,0.139],["p",0.2316,0.1621,0.1621,0.139],["p",0.2383,0.1668,0.1668,0.143],["s",0.245,0.1715,0.1715,0.147],["i",0.2058,0.1441,0.1441,0.1235],["i",0.2094,0.1466,0.1466,0.1256],["n",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["p",0.2447,0.1713,0.1713,0.1468],["p",0.2402,0.1681,0.1681,0.1441],["p",0.2402,0.1681,0.1681,0.1441],["p",0.2419,0.1694,0.1694,0.1452],["p",0.2419,0.1694,0.1694,0.1452],["i",0.24,0.168,0.168,0.144],["s",0.2296,0.1607,0.1607,0.1378],["n",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["s",0.201,0.1407,0.1407,0.1206],["s",0.2232,0.1562,0.1562,0.1339],["i",0.2432,0.1702,0.1702,0.1459],["i",0.2437,0.1706,0.1706,0.1462],["i",0.2449,0.1714,0.1714,0.1469],["i",0.25,0.175,0.175,0.15],["i",0.2286,0.16,0.16,0.1372],["i",0.2178,0.1525,0.1525,0.1307],["p",0.2354,0.1648,0.1648,0.1412],["p",0.2318,0.1623,0.1623,0.1391],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.21,0.147,0.147,0.126],["s",0.2015,0.141,0.141,0.1209],["i",0.24,0.168,0.168,0.144],["p",0.253,0.1771,0.1771,0.1518],["p",0.1974,0.1382,0.1382,0.1184],["p",0.1989,0.1392,0.1392,0.1193],["s",0.2251,0.1576,0.1576,0.1351],["s",0.2285,0.16,0.16,0.1371],["s",0.2353,0.1647,0.1647,0.1412],["s",0.2614,0.183,0.183,0.1568],["s",0.2648,0.1854,0.1854,0.1589],["s",0.2716,0.1901,0.1901,0.163],["i",0.2438,0.1707,0.1707,0.1463],["p",0.2305,0.1613,0.1613,0.1383],["p",0.2313,0.1619,0.1619,0.1388],["p",0.2301,0.1611,0.1611,0.1381],["p",0.2362,0.1654,0.1654,0.1417],["p",0.236,0.1652,0.1652,0.1416],["s",0.24,0.168,0.168,0.144],["s",0.2191,0.1534,0.1534,0.1314],["s",0.2399,0.1679,0.1679,0.1439],["i",0.2409,0.1686,0.1686,0.1445],["i",0.24,0.168,0.168,0.144],["s",0.239,0.1673,0.1673,0.1434],["s",0.2146,0.1502,0.1502,0.1287],["s",0.2487,0.1741,0.1741,0.1492],["s",0.24,0.168,0.168,0.144],["p",0.2401,0.1681,0.1681,0.1441],["p",0.2401,0.168,0.168,0.144],["p",0.2367,0.1657,0.1657,0.142],["p",0.2367,0.1657,0.1657,0.142],["p",0.2367,0.1657,0.1657,0.142],["p",0.2327,0.1629,0.1629,0.1396],["s",0.2401,0.1681,0.1681,0.1441],["s",0.2401,0.1681,0.1681,0.1441],["s",0.2429,0.17,0.17,0.1457],["s",0.2447,0.1713,0.1713,0.1468],["i",0.2584,0.1809,0.1809,0.155],["i",0.2832,0.1982,0.1982,0.1699],["i",0.2832,0.1982,0.1982,0.1699],["s",0.24,0.168,0.168,0.144],["s",0.232,0.1624,0.1624,0.1392],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["s",0.2608,0.1825,0.1825,0.1565],["s",0.2608,0.1825,0.1825,0.1565],["s",0.2608,0.1825,0.1825,0.1565],["s",0.24,0.168,0.168,0.144],["p",0.2281,0.1597,0.1597,0.1369],["i",0.2439,0.1707,0.1707,0.1464],["s",0.2426,0.1698,0.1698,0.1455],["n",0.24,0.168,0.168,0.144],["i",0.2326,0.1628,0.1628,0.1396],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["s",0.2358,0.1651,0.1651,0.1415],["s",0.2358,0.1651,0.1651,0.1415],["s",0.2362,0.1653,0.1653,0.1417],["s",0.2364,0.1655,0.1655,0.1418],["s",0.2367,0.1657,0.1657,0.142],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["s",0.2372,0.1661,0.1661,0.1423],["s",0.2334,0.1634,0.1634,0.14],["s",0.2183,0.1528,0.1528,0.131],["s",0.2585,0.181,0.181,0.1551],["s",0.2585,0.181,0.181,0.1551],["s",0.2585,0.181,0.181,0.1551],["s",0.2585,0.181,0.181,0.1551],["s",0.2585,0.181,0.181,0.1551],["s",0.2586,0.181,0.181,0.1552],["s",0.2585,0.181,0.181,0.1551],["s",0.24,0.168,0.168,0.144],["s",0.214,0.1498,0.1498,0.1284],["s",0.214,0.1498,0.1498,0.1284],["s",0.215,0.1505,0.1505,0.129],["s",0.209,0.1463,0.1463,0.1254],["s",0.21,0.147,0.147,0.126],["s",0.211,0.1477,0.1477,0.1266],["s",0.2416,0.1691,0.1691,0.145],["s",0.2459,0.1721,0.1721,0.1475],["s",0.2421,0.1695,0.1695,0.1453],["s",0.2425,0.1698,0.1698,0.1455],["s",0.2321,0.1625,0.1625,0.1392],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.2416,0.1691,0.1691,0.1449],["s",0.2168,0.1518,0.1518,0.1301],["s",0.232,0.1624,0.1624,0.1392],["s",0.231,0.1617,0.1617,0.1386],["s",0.2367,0.1657,0.1657,0.142],["p",0.2637,0.1846,0.1846,0.1582],["p",0.2637,0.1846,0.1846,0.1582],["p",0.259,0.1813,0.1813,0.1554],["p",0.2561,0.1792,0.1792,0.1536],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.2053,0.1437,0.1437,0.1232],["n",0.24,0.168,0.168,0.144],["s",0.242,0.1694,0.1694,0.1452],["s",0.2171,0.1519,0.1519,0.1302],["s",0.2352,0.1646,0.1646,0.1411],["s",0.2329,0.163,0.163,0.1397],["s",0.2332,0.1632,0.1632,0.1399],["n",0.24,0.168,0.168,0.144],["i",0.2013,0.1409,0.1409,0.1208],["i",0.2014,0.1409,0.1409,0.1208],["i",0.2014,0.141,0.141,0.1209],["i",0.2015,0.141,0.141,0.1209],["s",0.2174,0.1522,0.1522,0.1304],["s",0.2196,0.1537,0.1537,0.1318],["s",0.2175,0.1522,0.1522,0.1305],["i",0.2038,0.1427,0.1427,0.1223],["i",0.2038,0.1427,0.1427,0.1223],["i",0.2038,0.1427,0.1427,0.1223],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["s",0.2281,0.1597,0.1597,0.1369],["s",0.2271,0.159,0.159,0.1363],["i",0.2509,0.1756,0.1756,0.1505],["i",0.2378,0.1665,0.1665,0.1427],["i",0.2395,0.1676,0.1676,0.1437],["i",0.2393,0.1675,0.1675,0.1436],["i",0.2417,0.1692,0.1692,0.145],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["s",0.2214,0.155,0.155,0.1329],["s",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["i",0.2261,0.1583,0.1583,0.1357],["i",0.2238,0.1566,0.1566,0.1343],["s",0.2182,0.1527,0.1527,0.1309],["s",0.2167,0.1517,0.1517,0.13],["s",0.2104,0.1473,0.1473,0.1262],["s",0.205,0.1435,0.1435,0.123],["s",0.2399,0.1679,0.1679,0.1439],["s",0.2399,0.1679,0.1679,0.1439],["s",0.24,0.168,0.168,0.144],["p",0.2054,0.1437,0.1437,0.1232],["p",0.2063,0.1444,0.1444,0.1237],["p",0.1822,0.1275,0.1275,0.1093],["p",0.2541,0.1779,0.1779,0.1525],["p",0.2427,0.1699,0.1699,0.1456],["p",0.1911,0.1338,0.1338,0.1147],["p",0.2324,0.1627,0.1627,0.1394],["p",0.2533,0.1773,0.1773,0.152],["s",0.2402,0.1681,0.1681,0.1441],["s",0.2297,0.1608,0.1608,0.1378],["s",0.24,0.168,0.168,0.144],["s",0.2468,0.1728,0.1728,0.1481],["s",0.2474,0.1732,0.1732,0.1484],["s",0.2485,0.1739,0.1739,0.1491],["s",0.2363,0.1654,0.1654,0.1418],["p",0.2259,0.1581,0.1581,0.1355],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.2329,0.163,0.163,0.1397],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["i",0.2129,0.149,0.149,0.1277],["i",0.213,0.1491,0.1491,0.1278],["i",0.2125,0.1488,0.1488,0.1275],["i",0.2127,0.1489,0.1489,0.1276],["i",0.2124,0.1487,0.1487,0.1274],["i",0.21,0.147,0.147,0.126],["i",0.2101,0.1471,0.1471,0.1261],["i",0.2097,0.1468,0.1468,0.1258],["i",0.2099,0.1469,0.1469,0.1259],["p",0.2444,0.1711,0.1711,0.1466],["i",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["s",0.2317,0.1622,0.1622,0.139],["s",0.2306,0.1614,0.1614,0.1383],["s",0.2325,0.1628,0.1628,0.1395],["s",0.2315,0.1621,0.1621,0.1389],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["s",0.2274,0.1592,0.1592,0.1364],["p",0.2153,0.1507,0.1507,0.1292],["p",0.24,0.168,0.168,0.144],["p",0.23,0.161,0.161,0.138],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["p",0.2366,0.1656,0.1656,0.1419],["s",0.2324,0.1627,0.1627,0.1394],["s",0.2362,0.1653,0.1653,0.1417],["s",0.2394,0.1676,0.1676,0.1437],["i",0.2549,0.1785,0.1785,0.153],["p",0.24,0.168,0.168,0.144],["s",0.2376,0.1663,0.1663,0.1426],["s",0.2262,0.1584,0.1584,0.1357],["s",0.241,0.1687,0.1687,0.1446],["s",0.2001,0.1401,0.1401,0.1201],["s",0.2264,0.1585,0.1585,0.1358],["i",0.24,0.168,0.168,0.144],["s",0.0,0.0,0.0,0.0],["s",0.0,0.0,0.0,0.0],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["p",0.2293,0.1605,0.1605,0.1376],["p",0.2365,0.1656,0.1656,0.1419],["s",0.2357,0.165,0.165,0.1414],["s",0.2392,0.1674,0.1674,0.1435],["s",0.2438,0.1707,0.1707,0.1463],["n",0.24,0.168,0.168,0.144],["p",0.2367,0.1657,0.1657,0.142],["s",0.2493,0.1745,0.1745,0.1496],["s",0.2482,0.1737,0.1737,0.1489],["s",0.2438,0.1707,0.1707,0.1463],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["s",0.2312,0.1618,0.1618,0.1387],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["p",0.2463,0.1724,0.1724,0.1478],["p",0.2511,0.1757,0.1757,0.1506],["p",0.2565,0.1795,0.1795,0.1539],["p",0.2581,0.1807,0.1807,0.1549],["p",0.265,0.1855,0.1855,0.159],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.2194,0.1536,0.1536,0.1316],["p",0.243,0.1701,0.1701,0.1458],["s",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.2289,0.1602,0.1602,0.1373],["s",0.228,0.1596,0.1596,0.1368],["s",0.2271,0.1589,0.1589,0.1362],["s",0.2261,0.1583,0.1583,0.1357],["s",0.2252,0.1576,0.1576,0.1351],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["s",0.2064,0.1445,0.1445,0.1238],["p",0.2349,0.1644,0.1644,0.1409],["p",0.2349,0.1644,0.1644,0.1409],["p",0.24,0.168,0.168,0.144],["s",0.2109,0.1476,0.1476,0.1265],["s",0.19,0.133,0.133,0.114],["s",0.1832,0.1282,0.1282,0.1099],["s",0.189,0.1323,0.1323,0.1134],["s",0.1808,0.1266,0.1266,0.1085],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["s",0.2477,0.1734,0.1734,0.1486],["s",0.2536,0.1775,0.1775,0.1522],["s",0.2378,0.1664,0.1664,0.1427],["s",0.2428,0.1699,0.1699,0.1457],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["p",0.236,0.1652,0.1652,0.1416],["p",0.2355,0.1649,0.1649,0.1413],["p",0.236,0.1652,0.1652,0.1416],["p",0.2364,0.1655,0.1655,0.1418],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["p",0.2322,0.1625,0.1625,0.1393],["p",0.2322,0.1625,0.1625,0.1393],["p",0.2322,0.1625,0.1625,0.1393],["i",0.2547,0.1783,0.1783,0.1528],["i",0.2389,0.1673,0.1673,0.1434],["i",0.2512,0.1759,0.1759,0.1507],["p",0.2265,0.1586,0.1586,0.1359],["p",0.227,0.1589,0.1589,0.1362],["p",0.228,0.1596,0.1596,0.1368],["i",0.24,0.168,0.168,0.144],["s",0.2296,0.1607,0.1607,0.1378],["s",0.2296,0.1607,0.1607,0.1378],["i",0.0,0.0,0.0,0.0],["i",0.0,0.0,0.0,0.0],["i",0.0,0.0,0.0,0.0],["s",0.182,0.1274,0.1274,0.1092],["p",0.243,0.1701,0.1701,0.1458],["p",0.2417,0.1692,0.1692,0.145],["p",0.2377,0.1664,0.1664,0.1426],["p",0.2383,0.1668,0.1668,0.143],["p",0.2375,0.1663,0.1663,0.1425],["p",0.2333,0.1633,0.1633,0.14],["s",0.24,0.168,0.168,0.144],["s",0.0,0.0,0.0,0.0],["s",0.0,0.0,0.0,0.0],["s",0.0,0.0,0.0,0.0],["s",0.0,0.0,0.0,0.0],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.2246,0.1572,0.1572,0.1348],["p",0.2344,0.1641,0.1641,0.1406],["p",0.2361,0.1652,0.1652,0.1416],["p",0.2362,0.1653,0.1653,0.1417],["p",0.2362,0.1653,0.1653,0.1417],["p",0.2357,0.165,0.165,0.1414],["p",0.2302,0.1612,0.1612,0.1381],["p",0.231,0.1617,0.1617,0.1386],["p",0.2362,0.1653,0.1653,0.1417],["p",0.2325,0.1628,0.1628,0.1395],["p",0.2325,0.1628,0.1628,0.1395],["p",0.2325,0.1628,0.1628,0.1395],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["s",0.242,0.1694,0.1694,0.1452],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.1668,0.1168,0.1168,0.1001],["s",0.2348,0.1644,0.1644,0.1409],["s",0.2306,0.1614,0.1614,0.1383],["s",0.24,0.168,0.168,0.144],["s",0.2337,0.1636,0.1636,0.1402],["s",0.2301,0.161,0.161,0.138],["s",0.24,0.168,0.168,0.144],["s",0.2617,0.1832,0.1832,0.157],["s",0.256,0.1792,0.1792,0.1536],["s",0.2527,0.1769,0.1769,0.1516],["s",0.26,0.182,0.182,0.156],["s",0.245,0.1715,0.1715,0.147],["s",0.2378,0.1665,0.1665,0.1427],["s",0.239,0.1673,0.1673,0.1434],["s",0.2375,0.1663,0.1663,0.1425],["s",0.2395,0.1677,0.1677,0.1437],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["p",0.2262,0.1583,0.1583,0.1357],["p",0.2266,0.1586,0.1586,0.136],["p",0.2369,0.1658,0.1658,0.1421],["p",0.2369,0.1658,0.1658,0.1421],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["p",0.2256,0.1579,0.1579,0.1354],["p",0.2405,0.1683,0.1683,0.1443],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.2214,0.155,0.155,0.1328],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["p",0.2476,0.1733,0.1733,0.1486],["p",0.247,0.1729,0.1729,0.1482],["p",0.2454,0.1718,0.1718,0.1472],["p",0.2448,0.1713,0.1713,0.1469],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.2375,0.1662,0.1662,0.1425],["s",0.2375,0.1662,0.1662,0.1425],["s",0.2375,0.1662,0.1662,0.1425],["s",0.2375,0.1662,0.1662,0.1425],["s",0.2278,0.1594,0.1594,0.1367],["s",0.2278,0.1594,0.1594,0.1367],["s",0.2278,0.1594,0.1594,0.1367],["s",0.2278,0.1594,0.1594,0.1367],["s",0.218,0.1526,0.1526,0.1308],["s",0.218,0.1526,0.1526,0.1308],["s",0.218,0.1526,0.1526,0.1308],["s",0.218,0.1526,0.1526,0.1308],["s",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.2302,0.1611,0.1611,0.1381],["s",0.2308,0.1616,0.1616,0.1385],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["i",0.2378,0.1665,0.1665,0.1427],["i",0.2368,0.1658,0.1658,0.1421],["i",0.2347,0.1643,0.1643,0.1408],["i",0.2337,0.1636,0.1636,0.1402],["i",0.2315,0.162,0.162,0.1389],["i",0.2306,0.1614,0.1614,0.1384],["i",0.2284,0.1599,0.1599,0.137],["i",0.2275,0.1593,0.1593,0.1365],["i",0.2253,0.1577,0.1577,0.1352],["i",0.2244,0.1571,0.1571,0.1346],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["i",0.2431,0.1702,0.1702,0.1459],["i",0.2432,0.1702,0.1702,0.1459],["i",0.2394,0.1676,0.1676,0.1436],["i",0.2394,0.1676,0.1676,0.1437],["i",0.2417,0.1692,0.1692,0.145],["i",0.2418,0.1693,0.1693,0.1451],["i",0.241,0.1687,0.1687,0.1446],["i",0.2413,0.1689,0.1689,0.1448],["i",0.2413,0.1689,0.1689,0.1448],["i",0.2405,0.1683,0.1683,0.1443],["i",0.2405,0.1684,0.1684,0.1443],["i",0.2399,0.1679,0.1679,0.1439],["i",0.2399,0.1679,0.1679,0.1439],["i",0.2383,0.1668,0.1668,0.143],["i",0.2383,0.1668,0.1668,0.143],["i",0.2419,0.1693,0.1693,0.1451],["i",0.2419,0.1693,0.1693,0.1451],["i",0.2412,0.1688,0.1688,0.1447],["i",0.2412,0.1689,0.1689,0.1447],["s",0.1962,0.1374,0.1374,0.1177],["s",0.1985,0.1389,0.1389,0.1191],["s",0.1982,0.1387,0.1387,0.1189],["s",0.1992,0.1395,0.1395,0.1195],["s",0.1983,0.1388,0.1388,0.119],["s",0.1958,0.137,0.137,0.1174],["s",0.1979,0.1385,0.1385,0.1187],["s",0.198,0.1386,0.1386,0.1188],["s",0.1975,0.1383,0.1383,0.1185],["s",0.1982,0.1387,0.1387,0.1189],["s",0.197,0.1379,0.1379,0.1182],["n",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["s",0.2384,0.1669,0.1669,0.143],["s",0.238,0.1666,0.1666,0.1428],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.2419,0.1694,0.1694,0.1452],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["i",0.2229,0.156,0.156,0.1337],["i",0.2155,0.1509,0.1509,0.1293],["i",0.2133,0.1493,0.1493,0.128],["p",0.2408,0.1685,0.1685,0.1445],["p",0.2429,0.17,0.17,0.1457],["s",0.2405,0.1683,0.1683,0.1443],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["s",0.2361,0.1653,0.1653,0.1417],["s",0.2438,0.1707,0.1707,0.1463],["s",0.2361,0.1653,0.1653,0.1417],["s",0.2182,0.1527,0.1527,0.1309],["s",0.2167,0.1517,0.1517,0.13],["s",0.2104,0.1473,0.1473,0.1262],["s",0.2235,0.1565,0.1565,0.1341],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["s",0.2352,0.1647,0.1647,0.1411],["s",0.2429,0.1701,0.1701,0.1458],["s",0.2415,0.169,0.169,0.1449],["s",0.2401,0.168,0.168,0.144],["s",0.2387,0.1671,0.1671,0.1432],["s",0.2402,0.1681,0.1681,0.1441],["s",0.2342,0.164,0.164,0.1405],["s",0.2389,0.1672,0.1672,0.1433],["s",0.2342,0.164,0.164,0.1405],["s",0.2424,0.1697,0.1697,0.1454],["s",0.2384,0.1669,0.1669,0.143],["s",0.2462,0.1723,0.1723,0.1477],["s",0.2446,0.1712,0.1712,0.1467],["s",0.2445,0.1711,0.1711,0.1467],["s",0.2442,0.1709,0.1709,0.1465],["s",0.2435,0.1705,0.1705,0.1461],["s",0.2435,0.1705,0.1705,0.1461],["s",0.2447,0.1713,0.1713,0.1468],["s",0.2413,0.1689,0.1689,0.1448],["s",0.24,0.168,0.168,0.144],["s",0.2409,0.1686,0.1686,0.1445],["s",0.2396,0.1677,0.1677,0.1438],["s",0.241,0.1687,0.1687,0.1446],["s",0.241,0.1687,0.1687,0.1446],["s",0.241,0.1687,0.1687,0.1446],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["p",0.24,0.168,0.168,0.144],["p",0.2334,0.1634,0.1634,0.14],["p",0.2268,0.1587,0.1587,0.1361],["p",0.2268,0.1587,0.1587,0.1361],["p",0.2268,0.1587,0.1587,0.1361],["n",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.2265,0.1586,0.1586,0.1359],["n",0.2264,0.1585,0.1585,0.1358],["n",0.2347,0.1643,0.1643,0.1408],["n",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.24,0.168,0.168,0.144],["s",0.182,0.1274,0.1274,0.1092],["s",0.182,0.1274,0.1274,0.1092],["s",0.24,0.168,0.168,0.144],["s",0.2145,0.1502,0.1502,0.1287],["s",0.2309,0.1616,0.1616,0.1385],["s",0.2303,0.1612,0.1612,0.1382],["i",0.2439,0.1707,0.1707,0.1463],["n",0.24,0.168,0.168,0.144],["p",0.237,0.1659,0.1659,0.1422],["p",0.237,0.1659,0.1659,0.1422],["i",0.2038,0.1427,0.1427,0.1223],["i",0.2038,0.1427,0.1427,0.1223],["p",0.181,0.1267,0.1267,0.1086],["p",0.186,0.1302,0.1302,0.1116],["p",0.185,0.1295,0.1295,0.111],["p",0.192,0.1344,0.1344,0.1152],["p",0.183,0.1281,0.1281,0.1098],["p",0.2347,0.1643,0.1643,0.1408],["p",0.2374,0.1662,0.1662,0.1424],["p",0.2366,0.1657,0.1657,0.142],["p",0.2304,0.1613,0.1613,0.1382],["s",0.2239,0.1567,0.1567,0.1343],["s",0.2231,0.1562,0.1562,0.1339],["s",0.2231,0.1562,0.1562,0.1339],["s",0.2217,0.1552,0.1552,0.133],["s",0.2217,0.1552,0.1552,0.133],["s",0.2231,0.1562,0.1562,0.1339],["s",0.2217,0.1552,0.1552,0.133],["s",0.2217,0.1552,0.1552,0.133],["i",0.2326,0.1628,0.1628,0.1396],["i",0.2326,0.1628,0.1628,0.1396],["i",0.2326,0.1628,0.1628,0.1396],["i",0.2326,0.1628,0.1628,0.1396],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.2292,0.1604,0.1604,0.1375],["i",0.2238,0.1567,0.1567,0.1343],["i",0.2238,0.1567,0.1567,0.1343],["i",0.2238,0.1567,0.1567,0.1343],["i",0.2238,0.1567,0.1567,0.1343],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["n",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["i",0.24,0.168,0.168,0.144],["p",0.226,0.1582,0.1582,0.1356]];
  var A4MODELO = {"gerado":"2026-11-28","base":"estrato principal, CO2 sem desconto (F9); A4 s<c3><b3> no grupo sim (F38) ou sim+provavel (op<c3><a7><c3><a3>o <c3><a0> parte); um ajuste por km","k":1113,"estudos":302,"n_sim":528,"n_provavel":271,"referencia":[10.536,9.871,11.2],"km_max":300,"factores":[1,1.5,2.5],"modos":["betoneira","truck_3e","carreta_4e","carreta_5e"],"superficie":{"sim":{"betoneira|1":[[10.536,10.538,10.541,10.544,10.547,10.549,10.552,10.555,10.558,10.56,10.563,10.566,10.569,10.571,10.574,10.577,10.58,10.582,10.585,10.588,10.591,10.593,10.596,10.599,10.602,10.604,10.607,10.61,10.613,10.615,10.618,10.621,10.624,10.626,10.629,10.632,10.634,10.637,10.64,10.643,10.645,10.648,10.651,10.654,10.656,10.659,10.662,10.665,10.667,10.67,10.673,10.676,10.678,10.681,10.684,10.687,10.689,10.692,10.695,10.697,10.7,10.703,10.706,10.708,10.711,10.714,10.717,10.719,10.722,10.725,10.728,10.73,10.733,10.736,10.738,10.741,10.744,10.747,10.749,10.752,10.755,10.758,10.76,10.763,10.766,10.768,10.771,10.774,10.777,10.779,10.782,10.785,10.788,10.79,10.793,10.796,10.798,10.801,10.804,10.807,10.809,10.812,10.815,10.817,10.82,10.823,10.826,10.828,10.831,10.834,10.837,10.839,10.842,10.845,10.847,10.85,10.853,10.856,10.858,10.861,10.864,10.866,10.869,10.872,10.875,10.877,10.88,10.883,10.885,10.888,10.891,10.894,10.896,10.899,10.902,10.904,10.907,10.91,10.913,10.915,10.918,10.921,10.923,10.926,10.929,10.931,10.934,10.937,10.94,10.942,10.945,10.948,10.95,10.953,10.956,10.959,10.961,10.964,10.967,10.969,10.972,10.975,10.977,10.98,10.983,10.986,10.988,10.991,10.994,10.996,10.999,11.002,11.004,11.007,11.01,11.013,11.015,11.018,11.021,11.023,11.026,11.029,11.031,11.034,11.037,11.039,11.042,11.045,11.048,11.05,11.053,11.056,11.058,11.061,11.064,11.066,11.069,11.072,11.074,11.077,11.08,11.083,11.085,11.088,11.091,11.093,11.096,11.099,11.101,11.104,11.107,11.109,11.112,11.115,11.117,11.12,11.123,11.125,11.128,11.131,11.134,11.136,11.139,11.142,11.144,11.147,11.15,11.152,11.155,11.158,11.16,11.163,11.166,11.168,11.171,11.174,11.176,11.179,11.182,11.184,11.187,11.19,11.192,11.195,11.198,11.2,11.203,11.206,11.208,11.211,11.214,11.216,11.219,11.222,11.224,11.227,11.23,11.232,11.235,11.238,11.24,11.243,11.246,11.248,11.251,11.254,11.256,11.259,11.262,11.264,11.267,11.27,11.272,11.275,11.278,11.28,11.283,11.286,11.288,11.291,11.294,11.296,11.299,11.302,11.304,11.307,11.31,11.312,11.315,11.318,11.32,11.323,11.326,11.328,11.331,11.333,11.336,11.339,11.341,11.344,11.347],[9.871,9.874,9.876,9.879,9.882,9.884,9.887,9.89,9.893,9.895,9.898,9.901,9.904,9.906,9.909,9.912,9.914,9.917,9.92,9.923,9.925,9.928,9.931,9.933,9.936,9.939,9.941,9.944,9.947,9.95,9.952,9.955,9.958,9.96,9.963,9.966,9.969,9.971,9.974,9.977,9.979,9.982,9.985,9.987,9.99,9.993,9.996,9.998,10.001,10.004,10.006,10.009,10.012,10.014,10.017,10.02,10.022,10.025,10.028,10.031,10.033,10.036,10.039,10.041,10.044,10.047,10.049,10.052,10.055,10.057,10.06,10.063,10.065,10.068,10.071,10.073,10.076,10.079,10.082,10.084,10.087,10.09,10.092,10.095,10.098,10.1,10.103,10.106,10.108,10.111,10.114,10.116,10.119,10.122,10.124,10.127,10.13,10.132,10.135,10.138,10.14,10.143,10.146,10.148,10.151,10.154,10.156,10.159,10.162,10.164,10.167,10.17,10.172,10.175,10.178,10.18,10.183,10.186,10.188,10.191,10.194,10.196,10.199,10.202,10.204,10.207,10.209,10.212,10.215,10.217,10.22,10.223,10.225,10.228,10.231,10.233,10.236,10.239,10.241,10.244,10.247,10.249,10.252,10.254,10.257,10.26,10.262,10.265,10.268,10.27,10.273,10.276,10.278,10.281,10.283,10.286,10.289,10.291,10.294,10.297,10.299,10.302,10.305,10.307,10.31,10.312,10.315,10.318,10.32,10.323,10.326,10.328,10.331,10.333,10.336,10.339,10.341,10.344,10.347,10.349,10.352,10.354,10.357,10.36,10.362,10.365,10.368,10.37,10.373,10.375,10.378,10.381,10.383,10.386,10.388,10.391,10.394,10.396,10.399,10.402,10.404,10.407,10.409,10.412,10.415,10.417,10.42,10.422,10.425,10.428,10.43,10.433,10.435,10.438,10.441,10.443,10.446,10.448,10.451,10.454,10.456,10.459,10.461,10.464,10.467,10.469,10.472,10.474,10.477,10.48,10.482,10.485,10.487,10.49,10.492,10.495,10.498,10.5,10.503,10.505,10.508,10.511,10.513,10.516,10.518,10.521,10.523,10.526,10.529,10.531,10.534,10.536,10.539,10.542,10.544,10.547,10.549,10.552,10.554,10.557,10.56,10.562,10.565,10.567,10.57,10.572,10.575,10.578,10.58,10.583,10.585,10.588,10.59,10.593,10.595,10.598,10.601,10.603,10.606,10.608,10.611,10.613,10.616,10.619,10.621,10.624,10.626,10.629,10.631,10.634,10.636,10.639,10.642,10.644,10.647,10.649,10.652,10.654,10.657,10.659,10.662],[11.2,11.203,11.206,11.209,11.211,11.214,11.217,11.22,11.223,11.225,11.228,11.231,11.234,11.237,11.239,11.242,11.245,11.248,11.25,11.253,11.256,11.259,11.262,11.264,11.267,11.27,11.273,11.275,11.278,11.281,11.284,11.287,11.289,11.292,11.295,11.298,11.3,11.303,11.306,11.309,11.312,11.314,11.317,11.32,11.323,11.326,11.328,11.331,11.334,11.337,11.339,11.342,11.345,11.348,11.351,11.353,11.356,11.359,11.362,11.364,11.367,11.37,11.373,11.376,11.378,11.381,11.384,11.387,11.389,11.392,11.395,11.398,11.401,11.403,11.406,11.409,11.412,11.414,11.417,11.42,11.423,11.426,11.428,11.431,11.434,11.437,11.439,11.442,11.445,11.448,11.451,11.453,11.456,11.459,11.462,11.464,11.467,11.47,11.473,11.476,11.478,11.481,11.484,11.487,11.489,11.492,11.495,11.498,11.501,11.503,11.506,11.509,11.512,11.514,11.517,11.52,11.523,11.526,11.528,11.531,11.534,11.537,11.539,11.542,11.545,11.548,11.55,11.553,11.556,11.559,11.562,11.564,11.567,11.57,11.573,11.575,11.578,11.581,11.584,11.587,11.589,11.592,11.595,11.598,11.6,11.603,11.606,11.609,11.612,11.614,11.617,11.62,11.623,11.625,11.628,11.631,11.634,11.636,11.639,11.642,11.645,11.648,11.65,11.653,11.656,11.659,11.661,11.664,11.667,11.67,11.672,11.675,11.678,11.681,11.684,11.686,11.689,11.692,11.695,11.697,11.7,11.703,11.706,11.708,11.711,11.714,11.717,11.72,11.722,11.725,11.728,11.731,11.733,11.736,11.739,11.742,11.744,11.747,11.75,11.753,11.756,11.758,11.761,11.764,11.767,11.769,11.772,11.775,11.778,11.78,11.783,11.786,11.789,11.792,11.794,11.797,11.8,11.803,11.805,11.808,11.811,11.814,11.816,11.819,11.822,11.825,11.827,11.83,11.833,11.836,11.839,11.841,11.844,11.847,11.85,11.852,11.855,11.858,11.861,11.863,11.866,11.869,11.872,11.874,11.877,11.88,11.883,11.885,11.888,11.891,11.894,11.896,11.899,11.902,11.905,11.908,11.91,11.913,11.916,11.919,11.921,11.924,11.927,11.93,11.932,11.935,11.938,11.941,11.943,11.946,11.949,11.952,11.954,11.957,11.96,11.963,11.965,11.968,11.971,11.974,11.976,11.979,11.982,11.985,11.987,11.99,11.993,11.996,11.999,12.001,12.004,12.007,12.01,12.012,12.015,12.018,12.021,12.023,12.026,12.029,12.032]],"betoneira|1.5":[[10.536,10.54,10.544,10.548,10.552,10.556,10.56,10.565,10.569,10.573,10.577,10.581,10.585,10.589,10.593,10.597,10.602,10.606,10.61,10.614,10.618,10.622,10.626,10.63,10.634,10.639,10.643,10.647,10.651,10.655,10.659,10.663,10.667,10.671,10.676,10.68,10.684,10.688,10.692,10.696,10.7,10.704,10.708,10.713,10.717,10.721,10.725,10.729,10.733,10.737,10.741,10.745,10.749,10.753,10.758,10.762,10.766,10.77,10.774,10.778,10.782,10.786,10.79,10.794,10.798,10.803,10.807,10.811,10.815,10.819,10.823,10.827,10.831,10.835,10.839,10.843,10.847,10.851,10.856,10.86,10.864,10.868,10.872,10.876,10.88,10.884,10.888,10.892,10.896,10.9,10.904,10.908,10.913,10.917,10.921,10.925,10.929,10.933,10.937,10.941,10.945,10.949,10.953,10.957,10.961,10.965,10.969,10.973,10.977,10.981,10.986,10.99,10.994,10.998,11.002,11.006,11.01,11.014,11.018,11.022,11.026,11.03,11.034,11.038,11.042,11.046,11.05,11.054,11.058,11.062,11.066,11.07,11.074,11.078,11.083,11.087,11.091,11.095,11.099,11.103,11.107,11.111,11.115,11.119,11.123,11.127,11.131,11.135,11.139,11.143,11.147,11.151,11.155,11.159,11.163,11.167,11.171,11.175,11.179,11.183,11.187,11.191,11.195,11.199,11.203,11.207,11.211,11.215,11.219,11.223,11.227,11.231,11.235,11.239,11.243,11.247,11.251,11.255,11.259,11.263,11.267,11.271,11.275,11.279,11.283,11.287,11.291,11.295,11.299,11.303,11.307,11.311,11.315,11.319,11.323,11.327,11.331,11.335,11.339,11.343,11.347,11.351,11.355,11.359,11.363,11.367,11.371,11.375,11.379,11.382,11.386,11.39,11.394,11.398,11.402,11.406,11.41,11.414,11.418,11.422,11.426,11.43,11.434,11.438,11.442,11.446,11.45,11.454,11.458,11.462,11.466,11.47,11.473,11.477,11.481,11.485,11.489,11.493,11.497,11.501,11.505,11.509,11.513,11.517,11.521,11.525,11.529,11.533,11.537,11.54,11.544,11.548,11.552,11.556,11.56,11.564,11.568,11.572,11.576,11.58,11.584,11.588,11.592,11.595,11.599,11.603,11.607,11.611,11.615,11.619,11.623,11.627,11.631,11.635,11.639,11.642,11.646,11.65,11.654,11.658,11.662,11.666,11.67,11.674,11.678,11.681,11.685,11.689,11.693,11.697,11.701,11.705,11.709,11.713,11.717,11.72,11.724,11.728,11.732,11.736,11.74],[9.871,9.875,9.879,9.883,9.887,9.891,9.895,9.899,9.904,9.908,9.912,9.916,9.92,9.924,9.928,9.932,9.936,9.94,9.944,9.948,9.952,9.956,9.96,9.964,9.969,9.973,9.977,9.981,9.985,9.989,9.993,9.997,10.001,10.005,10.009,10.013,10.017,10.021,10.025,10.029,10.033,10.037,10.041,10.045,10.049,10.053,10.057,10.061,10.065,10.069,10.073,10.077,10.082,10.086,10.09,10.094,10.098,10.102,10.106,10.11,10.114,10.118,10.122,10.126,10.13,10.134,10.138,10.142,10.146,10.15,10.154,10.158,10.162,10.166,10.17,10.174,10.178,10.182,10.186,10.19,10.194,10.198,10.202,10.205,10.209,10.213,10.217,10.221,10.225,10.229,10.233,10.237,10.241,10.245,10.249,10.253,10.257,10.261,10.265,10.269,10.273,10.277,10.281,10.285,10.289,10.293,10.297,10.301,10.305,10.309,10.312,10.316,10.32,10.324,10.328,10.332,10.336,10.34,10.344,10.348,10.352,10.356,10.36,10.364,10.368,10.371,10.375,10.379,10.383,10.387,10.391,10.395,10.399,10.403,10.407,10.411,10.415,10.418,10.422,10.426,10.43,10.434,10.438,10.442,10.446,10.45,10.454,10.457,10.461,10.465,10.469,10.473,10.477,10.481,10.485,10.489,10.492,10.496,10.5,10.504,10.508,10.512,10.516,10.52,10.523,10.527,10.531,10.535,10.539,10.543,10.547,10.551,10.554,10.558,10.562,10.566,10.57,10.574,10.578,10.581,10.585,10.589,10.593,10.597,10.601,10.604,10.608,10.612,10.616,10.62,10.624,10.627,10.631,10.635,10.639,10.643,10.647,10.65,10.654,10.658,10.662,10.666,10.67,10.673,10.677,10.681,10.685,10.689,10.692,10.696,10.7,10.704,10.708,10.711,10.715,10.719,10.723,10.727,10.73,10.734,10.738,10.742,10.746,10.749,10.753,10.757,10.761,10.765,10.768,10.772,10.776,10.78,10.783,10.787,10.791,10.795,10.799,10.802,10.806,10.81,10.814,10.817,10.821,10.825,10.829,10.832,10.836,10.84,10.844,10.847,10.851,10.855,10.859,10.863,10.866,10.87,10.874,10.877,10.881,10.885,10.889,10.892,10.896,10.9,10.904,10.907,10.911,10.915,10.919,10.922,10.926,10.93,10.933,10.937,10.941,10.945,10.948,10.952,10.956,10.959,10.963,10.967,10.971,10.974,10.978,10.982,10.985,10.989,10.993,10.997,11,11.004,11.008,11.011,11.015,11.019,11.022,11.026,11.03,11.033,11.037],[11.2,11.205,11.209,11.213,11.217,11.221,11.225,11.23,11.234,11.238,11.242,11.246,11.25,11.255,11.259,11.263,11.267,11.271,11.275,11.28,11.284,11.288,11.292,11.296,11.3,11.305,11.309,11.313,11.317,11.321,11.326,11.33,11.334,11.338,11.342,11.346,11.351,11.355,11.359,11.363,11.367,11.371,11.376,11.38,11.384,11.388,11.392,11.396,11.401,11.405,11.409,11.413,11.417,11.421,11.426,11.43,11.434,11.438,11.442,11.446,11.451,11.455,11.459,11.463,11.467,11.471,11.476,11.48,11.484,11.488,11.492,11.496,11.501,11.505,11.509,11.513,11.517,11.521,11.526,11.53,11.534,11.538,11.542,11.546,11.55,11.555,11.559,11.563,11.567,11.571,11.575,11.58,11.584,11.588,11.592,11.596,11.6,11.605,11.609,11.613,11.617,11.621,11.625,11.63,11.634,11.638,11.642,11.646,11.65,11.654,11.659,11.663,11.667,11.671,11.675,11.679,11.684,11.688,11.692,11.696,11.7,11.704,11.708,11.713,11.717,11.721,11.725,11.729,11.733,11.738,11.742,11.746,11.75,11.754,11.758,11.762,11.767,11.771,11.775,11.779,11.783,11.787,11.792,11.796,11.8,11.804,11.808,11.812,11.816,11.821,11.825,11.829,11.833,11.837,11.841,11.845,11.85,11.854,11.858,11.862,11.866,11.87,11.874,11.879,11.883,11.887,11.891,11.895,11.899,11.903,11.908,11.912,11.916,11.92,11.924,11.928,11.932,11.937,11.941,11.945,11.949,11.953,11.957,11.961,11.965,11.97,11.974,11.978,11.982,11.986,11.99,11.994,11.999,12.003,12.007,12.011,12.015,12.019,12.023,12.027,12.032,12.036,12.04,12.044,12.048,12.052,12.056,12.06,12.065,12.069,12.073,12.077,12.081,12.085,12.089,12.093,12.098,12.102,12.106,12.11,12.114,12.118,12.122,12.126,12.131,12.135,12.139,12.143,12.147,12.151,12.155,12.159,12.164,12.168,12.172,12.176,12.18,12.184,12.188,12.192,12.196,12.201,12.205,12.209,12.213,12.217,12.221,12.225,12.229,12.233,12.238,12.242,12.246,12.25,12.254,12.258,12.262,12.266,12.27,12.275,12.279,12.283,12.287,12.291,12.295,12.299,12.303,12.307,12.311,12.316,12.32,12.324,12.328,12.332,12.336,12.34,12.344,12.348,12.352,12.357,12.361,12.365,12.369,12.373,12.377,12.381,12.385,12.389,12.393,12.398,12.402,12.406,12.41,12.414,12.418,12.422,12.426,12.43,12.434,12.439,12.443]],"betoneira|2.5":[[10.536,10.543,10.549,10.556,10.563,10.57,10.577,10.584,10.591,10.597,10.604,10.611,10.618,10.625,10.632,10.639,10.645,10.652,10.659,10.666,10.673,10.68,10.687,10.693,10.7,10.707,10.714,10.721,10.728,10.734,10.741,10.748,10.755,10.762,10.768,10.775,10.782,10.789,10.796,10.803,10.809,10.816,10.823,10.83,10.837,10.843,10.85,10.857,10.864,10.87,10.877,10.884,10.891,10.898,10.904,10.911,10.918,10.925,10.931,10.938,10.945,10.952,10.959,10.965,10.972,10.979,10.986,10.992,10.999,11.006,11.013,11.019,11.026,11.033,11.039,11.046,11.053,11.06,11.066,11.073,11.08,11.087,11.093,11.1,11.107,11.113,11.12,11.127,11.134,11.14,11.147,11.154,11.16,11.167,11.174,11.18,11.187,11.194,11.2,11.207,11.214,11.22,11.227,11.234,11.24,11.247,11.254,11.26,11.267,11.274,11.28,11.287,11.294,11.3,11.307,11.314,11.32,11.327,11.333,11.34,11.347,11.353,11.36,11.367,11.373,11.38,11.386,11.393,11.4,11.406,11.413,11.419,11.426,11.433,11.439,11.446,11.452,11.459,11.466,11.472,11.479,11.485,11.492,11.498,11.505,11.512,11.518,11.525,11.531,11.538,11.544,11.551,11.558,11.564,11.571,11.577,11.584,11.59,11.597,11.603,11.61,11.616,11.623,11.629,11.636,11.642,11.649,11.655,11.662,11.668,11.675,11.681,11.688,11.694,11.701,11.707,11.714,11.72,11.727,11.733,11.74,11.746,11.753,11.759,11.766,11.772,11.779,11.785,11.792,11.798,11.805,11.811,11.817,11.824,11.83,11.837,11.843,11.85,11.856,11.863,11.869,11.875,11.882,11.888,11.895,11.901,11.908,11.914,11.92,11.927,11.933,11.94,11.946,11.952,11.959,11.965,11.972,11.978,11.984,11.991,11.997,12.004,12.01,12.016,12.023,12.029,12.035,12.042,12.048,12.055,12.061,12.067,12.074,12.08,12.086,12.093,12.099,12.105,12.112,12.118,12.124,12.131,12.137,12.143,12.15,12.156,12.162,12.169,12.175,12.181,12.188,12.194,12.2,12.207,12.213,12.219,12.226,12.232,12.238,12.245,12.251,12.257,12.263,12.27,12.276,12.282,12.289,12.295,12.301,12.307,12.314,12.32,12.326,12.333,12.339,12.345,12.351,12.358,12.364,12.37,12.376,12.383,12.389,12.395,12.401,12.408,12.414,12.42,12.426,12.433,12.439,12.445,12.451,12.458,12.464,12.47,12.476,12.483,12.489,12.495,12.501],[9.871,9.878,9.884,9.891,9.898,9.905,9.912,9.918,9.925,9.932,9.939,9.946,9.952,9.959,9.966,9.973,9.979,9.986,9.993,10,10.006,10.013,10.02,10.026,10.033,10.04,10.047,10.053,10.06,10.067,10.073,10.08,10.087,10.094,10.1,10.107,10.114,10.12,10.127,10.134,10.14,10.147,10.154,10.16,10.167,10.174,10.18,10.187,10.194,10.2,10.207,10.213,10.22,10.227,10.233,10.24,10.247,10.253,10.26,10.266,10.273,10.28,10.286,10.293,10.299,10.306,10.312,10.319,10.326,10.332,10.339,10.345,10.352,10.358,10.365,10.371,10.378,10.385,10.391,10.398,10.404,10.411,10.417,10.424,10.43,10.437,10.443,10.45,10.456,10.463,10.469,10.476,10.482,10.489,10.495,10.502,10.508,10.514,10.521,10.527,10.534,10.54,10.547,10.553,10.56,10.566,10.572,10.579,10.585,10.592,10.598,10.604,10.611,10.617,10.624,10.63,10.636,10.643,10.649,10.656,10.662,10.668,10.675,10.681,10.687,10.694,10.7,10.706,10.713,10.719,10.725,10.732,10.738,10.744,10.751,10.757,10.763,10.77,10.776,10.782,10.789,10.795,10.801,10.807,10.814,10.82,10.826,10.832,10.839,10.845,10.851,10.858,10.864,10.87,10.876,10.882,10.889,10.895,10.901,10.907,10.914,10.92,10.926,10.932,10.938,10.945,10.951,10.957,10.963,10.969,10.976,10.982,10.988,10.994,11,11.006,11.013,11.019,11.025,11.031,11.037,11.043,11.049,11.056,11.062,11.068,11.074,11.08,11.086,11.092,11.098,11.104,11.111,11.117,11.123,11.129,11.135,11.141,11.147,11.153,11.159,11.165,11.171,11.177,11.184,11.19,11.196,11.202,11.208,11.214,11.22,11.226,11.232,11.238,11.244,11.25,11.256,11.262,11.268,11.274,11.28,11.286,11.292,11.298,11.304,11.31,11.316,11.322,11.328,11.334,11.34,11.346,11.352,11.358,11.364,11.369,11.375,11.381,11.387,11.393,11.399,11.405,11.411,11.417,11.423,11.429,11.435,11.441,11.447,11.452,11.458,11.464,11.47,11.476,11.482,11.488,11.494,11.5,11.505,11.511,11.517,11.523,11.529,11.535,11.541,11.546,11.552,11.558,11.564,11.57,11.576,11.581,11.587,11.593,11.599,11.605,11.611,11.616,11.622,11.628,11.634,11.64,11.645,11.651,11.657,11.663,11.669,11.674,11.68,11.686,11.692,11.697,11.703,11.709,11.715,11.721,11.726,11.732,11.738,11.744,11.749],[11.2,11.207,11.214,11.221,11.228,11.235,11.242,11.249,11.256,11.263,11.27,11.277,11.284,11.291,11.298,11.305,11.312,11.319,11.326,11.332,11.339,11.346,11.353,11.36,11.367,11.374,11.381,11.388,11.395,11.402,11.409,11.416,11.423,11.43,11.437,11.444,11.451,11.457,11.464,11.471,11.478,11.485,11.492,11.499,11.506,11.513,11.52,11.527,11.534,11.541,11.548,11.555,11.562,11.569,11.575,11.582,11.589,11.596,11.603,11.61,11.617,11.624,11.631,11.638,11.645,11.652,11.659,11.666,11.672,11.679,11.686,11.693,11.7,11.707,11.714,11.721,11.728,11.735,11.742,11.749,11.756,11.762,11.769,11.776,11.783,11.79,11.797,11.804,11.811,11.818,11.825,11.832,11.839,11.845,11.852,11.859,11.866,11.873,11.88,11.887,11.894,11.901,11.908,11.914,11.921,11.928,11.935,11.942,11.949,11.956,11.963,11.97,11.976,11.983,11.99,11.997,12.004,12.011,12.018,12.025,12.032,12.038,12.045,12.052,12.059,12.066,12.073,12.08,12.087,12.093,12.1,12.107,12.114,12.121,12.128,12.135,12.142,12.148,12.155,12.162,12.169,12.176,12.183,12.19,12.196,12.203,12.21,12.217,12.224,12.231,12.238,12.244,12.251,12.258,12.265,12.272,12.279,12.285,12.292,12.299,12.306,12.313,12.32,12.327,12.333,12.34,12.347,12.354,12.361,12.368,12.374,12.381,12.388,12.395,12.402,12.408,12.415,12.422,12.429,12.436,12.443,12.449,12.456,12.463,12.47,12.477,12.483,12.49,12.497,12.504,12.511,12.518,12.524,12.531,12.538,12.545,12.552,12.558,12.565,12.572,12.579,12.586,12.592,12.599,12.606,12.613,12.619,12.626,12.633,12.64,12.647,12.653,12.66,12.667,12.674,12.681,12.687,12.694,12.701,12.708,12.714,12.721,12.728,12.735,12.742,12.748,12.755,12.762,12.769,12.775,12.782,12.789,12.796,12.802,12.809,12.816,12.823,12.829,12.836,12.843,12.85,12.856,12.863,12.87,12.877,12.883,12.89,12.897,12.904,12.91,12.917,12.924,12.931,12.937,12.944,12.951,12.958,12.964,12.971,12.978,12.985,12.991,12.998,13.005,13.011,13.018,13.025,13.032,13.038,13.045,13.052,13.059,13.065,13.072,13.079,13.085,13.092,13.099,13.106,13.112,13.119,13.126,13.132,13.139,13.146,13.153,13.159,13.166,13.173,13.179,13.186,13.193,13.2,13.206,13.213,13.22,13.226,13.233,13.24,13.246,13.253]],"truck_3e|1":[[10.536,10.538,10.539,10.541,10.543,10.545,10.547,10.549,10.551,10.553,10.555,10.557,10.559,10.561,10.563,10.565,10.566,10.568,10.57,10.572,10.574,10.576,10.578,10.58,10.582,10.584,10.586,10.588,10.59,10.591,10.593,10.595,10.597,10.599,10.601,10.603,10.605,10.607,10.609,10.611,10.613,10.614,10.616,10.618,10.62,10.622,10.624,10.626,10.628,10.63,10.632,10.634,10.636,10.638,10.639,10.641,10.643,10.645,10.647,10.649,10.651,10.653,10.655,10.657,10.659,10.661,10.662,10.664,10.666,10.668,10.67,10.672,10.674,10.676,10.678,10.68,10.682,10.684,10.685,10.687,10.689,10.691,10.693,10.695,10.697,10.699,10.701,10.703,10.705,10.706,10.708,10.71,10.712,10.714,10.716,10.718,10.72,10.722,10.724,10.726,10.728,10.729,10.731,10.733,10.735,10.737,10.739,10.741,10.743,10.745,10.747,10.749,10.75,10.752,10.754,10.756,10.758,10.76,10.762,10.764,10.766,10.768,10.77,10.771,10.773,10.775,10.777,10.779,10.781,10.783,10.785,10.787,10.789,10.791,10.792,10.794,10.796,10.798,10.8,10.802,10.804,10.806,10.808,10.81,10.812,10.813,10.815,10.817,10.819,10.821,10.823,10.825,10.827,10.829,10.831,10.832,10.834,10.836,10.838,10.84,10.842,10.844,10.846,10.848,10.85,10.851,10.853,10.855,10.857,10.859,10.861,10.863,10.865,10.867,10.869,10.87,10.872,10.874,10.876,10.878,10.88,10.882,10.884,10.886,10.888,10.889,10.891,10.893,10.895,10.897,10.899,10.901,10.903,10.905,10.907,10.908,10.91,10.912,10.914,10.916,10.918,10.92,10.922,10.924,10.926,10.927,10.929,10.931,10.933,10.935,10.937,10.939,10.941,10.943,10.944,10.946,10.948,10.95,10.952,10.954,10.956,10.958,10.96,10.962,10.963,10.965,10.967,10.969,10.971,10.973,10.975,10.977,10.979,10.98,10.982,10.984,10.986,10.988,10.99,10.992,10.994,10.996,10.997,10.999,11.001,11.003,11.005,11.007,11.009,11.011,11.013,11.014,11.016,11.018,11.02,11.022,11.024,11.026,11.028,11.03,11.031,11.033,11.035,11.037,11.039,11.041,11.043,11.045,11.046,11.048,11.05,11.052,11.054,11.056,11.058,11.06,11.062,11.063,11.065,11.067,11.069,11.071,11.073,11.075,11.077,11.078,11.08,11.082,11.084,11.086,11.088,11.09,11.092,11.094,11.095,11.097,11.099,11.101,11.103,11.105,11.107],[9.871,9.873,9.875,9.877,9.879,9.88,9.882,9.884,9.886,9.888,9.89,9.892,9.894,9.896,9.898,9.899,9.901,9.903,9.905,9.907,9.909,9.911,9.913,9.915,9.917,9.918,9.92,9.922,9.924,9.926,9.928,9.93,9.932,9.934,9.936,9.937,9.939,9.941,9.943,9.945,9.947,9.949,9.951,9.953,9.954,9.956,9.958,9.96,9.962,9.964,9.966,9.968,9.97,9.971,9.973,9.975,9.977,9.979,9.981,9.983,9.985,9.987,9.988,9.99,9.992,9.994,9.996,9.998,10,10.002,10.004,10.005,10.007,10.009,10.011,10.013,10.015,10.017,10.019,10.021,10.022,10.024,10.026,10.028,10.03,10.032,10.034,10.036,10.038,10.039,10.041,10.043,10.045,10.047,10.049,10.051,10.053,10.054,10.056,10.058,10.06,10.062,10.064,10.066,10.068,10.069,10.071,10.073,10.075,10.077,10.079,10.081,10.083,10.084,10.086,10.088,10.09,10.092,10.094,10.096,10.098,10.099,10.101,10.103,10.105,10.107,10.109,10.111,10.113,10.114,10.116,10.118,10.12,10.122,10.124,10.126,10.128,10.129,10.131,10.133,10.135,10.137,10.139,10.141,10.142,10.144,10.146,10.148,10.15,10.152,10.154,10.156,10.157,10.159,10.161,10.163,10.165,10.167,10.169,10.17,10.172,10.174,10.176,10.178,10.18,10.182,10.183,10.185,10.187,10.189,10.191,10.193,10.195,10.196,10.198,10.2,10.202,10.204,10.206,10.208,10.209,10.211,10.213,10.215,10.217,10.219,10.221,10.222,10.224,10.226,10.228,10.23,10.232,10.234,10.235,10.237,10.239,10.241,10.243,10.245,10.247,10.248,10.25,10.252,10.254,10.256,10.258,10.259,10.261,10.263,10.265,10.267,10.269,10.271,10.272,10.274,10.276,10.278,10.28,10.282,10.283,10.285,10.287,10.289,10.291,10.293,10.295,10.296,10.298,10.3,10.302,10.304,10.306,10.307,10.309,10.311,10.313,10.315,10.317,10.318,10.32,10.322,10.324,10.326,10.328,10.33,10.331,10.333,10.335,10.337,10.339,10.341,10.342,10.344,10.346,10.348,10.35,10.352,10.353,10.355,10.357,10.359,10.361,10.363,10.364,10.366,10.368,10.37,10.372,10.374,10.375,10.377,10.379,10.381,10.383,10.385,10.386,10.388,10.39,10.392,10.394,10.396,10.397,10.399,10.401,10.403,10.405,10.406,10.408,10.41,10.412,10.414,10.416,10.417,10.419,10.421,10.423,10.425,10.427,10.428,10.43],[11.2,11.202,11.204,11.206,11.208,11.21,11.212,11.214,11.216,11.218,11.22,11.222,11.224,11.226,11.228,11.23,11.232,11.233,11.235,11.237,11.239,11.241,11.243,11.245,11.247,11.249,11.251,11.253,11.255,11.257,11.259,11.261,11.263,11.265,11.267,11.269,11.27,11.272,11.274,11.276,11.278,11.28,11.282,11.284,11.286,11.288,11.29,11.292,11.294,11.296,11.298,11.3,11.302,11.304,11.305,11.307,11.309,11.311,11.313,11.315,11.317,11.319,11.321,11.323,11.325,11.327,11.329,11.331,11.333,11.335,11.337,11.339,11.341,11.342,11.344,11.346,11.348,11.35,11.352,11.354,11.356,11.358,11.36,11.362,11.364,11.366,11.368,11.37,11.372,11.374,11.376,11.377,11.379,11.381,11.383,11.385,11.387,11.389,11.391,11.393,11.395,11.397,11.399,11.401,11.403,11.405,11.407,11.409,11.411,11.412,11.414,11.416,11.418,11.42,11.422,11.424,11.426,11.428,11.43,11.432,11.434,11.436,11.438,11.44,11.442,11.444,11.446,11.447,11.449,11.451,11.453,11.455,11.457,11.459,11.461,11.463,11.465,11.467,11.469,11.471,11.473,11.475,11.477,11.479,11.481,11.482,11.484,11.486,11.488,11.49,11.492,11.494,11.496,11.498,11.5,11.502,11.504,11.506,11.508,11.51,11.512,11.514,11.516,11.517,11.519,11.521,11.523,11.525,11.527,11.529,11.531,11.533,11.535,11.537,11.539,11.541,11.543,11.545,11.547,11.549,11.55,11.552,11.554,11.556,11.558,11.56,11.562,11.564,11.566,11.568,11.57,11.572,11.574,11.576,11.578,11.58,11.582,11.584,11.585,11.587,11.589,11.591,11.593,11.595,11.597,11.599,11.601,11.603,11.605,11.607,11.609,11.611,11.613,11.615,11.617,11.618,11.62,11.622,11.624,11.626,11.628,11.63,11.632,11.634,11.636,11.638,11.64,11.642,11.644,11.646,11.648,11.649,11.651,11.653,11.655,11.657,11.659,11.661,11.663,11.665,11.667,11.669,11.671,11.673,11.675,11.677,11.679,11.681,11.682,11.684,11.686,11.688,11.69,11.692,11.694,11.696,11.698,11.7,11.702,11.704,11.706,11.708,11.71,11.712,11.713,11.715,11.717,11.719,11.721,11.723,11.725,11.727,11.729,11.731,11.733,11.735,11.737,11.739,11.741,11.743,11.744,11.746,11.748,11.75,11.752,11.754,11.756,11.758,11.76,11.762,11.764,11.766,11.768,11.77,11.772,11.774,11.775,11.777,11.779,11.781,11.783]],"truck_3e|1.5":[[10.536,10.539,10.541,10.544,10.547,10.55,10.553,10.556,10.559,10.562,10.565,10.567,10.57,10.573,10.576,10.579,10.582,10.585,10.588,10.59,10.593,10.596,10.599,10.602,10.605,10.608,10.611,10.614,10.616,10.619,10.622,10.625,10.628,10.631,10.634,10.637,10.639,10.642,10.645,10.648,10.651,10.654,10.657,10.66,10.662,10.665,10.668,10.671,10.674,10.677,10.68,10.683,10.685,10.688,10.691,10.694,10.697,10.7,10.703,10.706,10.708,10.711,10.714,10.717,10.72,10.723,10.726,10.728,10.731,10.734,10.737,10.74,10.743,10.746,10.749,10.751,10.754,10.757,10.76,10.763,10.766,10.769,10.771,10.774,10.777,10.78,10.783,10.786,10.789,10.791,10.794,10.797,10.8,10.803,10.806,10.809,10.812,10.814,10.817,10.82,10.823,10.826,10.829,10.831,10.834,10.837,10.84,10.843,10.846,10.849,10.851,10.854,10.857,10.86,10.863,10.866,10.869,10.871,10.874,10.877,10.88,10.883,10.886,10.889,10.891,10.894,10.897,10.9,10.903,10.906,10.908,10.911,10.914,10.917,10.92,10.923,10.926,10.928,10.931,10.934,10.937,10.94,10.943,10.945,10.948,10.951,10.954,10.957,10.96,10.962,10.965,10.968,10.971,10.974,10.977,10.979,10.982,10.985,10.988,10.991,10.994,10.996,10.999,11.002,11.005,11.008,11.011,11.013,11.016,11.019,11.022,11.025,11.028,11.03,11.033,11.036,11.039,11.042,11.045,11.047,11.05,11.053,11.056,11.059,11.062,11.064,11.067,11.07,11.073,11.076,11.078,11.081,11.084,11.087,11.09,11.093,11.095,11.098,11.101,11.104,11.107,11.11,11.112,11.115,11.118,11.121,11.124,11.126,11.129,11.132,11.135,11.138,11.14,11.143,11.146,11.149,11.152,11.155,11.157,11.16,11.163,11.166,11.169,11.171,11.174,11.177,11.18,11.183,11.185,11.188,11.191,11.194,11.197,11.199,11.202,11.205,11.208,11.211,11.213,11.216,11.219,11.222,11.225,11.227,11.23,11.233,11.236,11.239,11.241,11.244,11.247,11.25,11.253,11.255,11.258,11.261,11.264,11.267,11.269,11.272,11.275,11.278,11.281,11.283,11.286,11.289,11.292,11.295,11.297,11.3,11.303,11.306,11.309,11.311,11.314,11.317,11.32,11.322,11.325,11.328,11.331,11.334,11.336,11.339,11.342,11.345,11.348,11.35,11.353,11.356,11.359,11.361,11.364,11.367,11.37,11.373,11.375,11.378,11.381,11.384,11.386],[9.871,9.874,9.877,9.879,9.882,9.885,9.888,9.891,9.894,9.897,9.899,9.902,9.905,9.908,9.911,9.914,9.917,9.919,9.922,9.925,9.928,9.931,9.934,9.936,9.939,9.942,9.945,9.948,9.951,9.954,9.956,9.959,9.962,9.965,9.968,9.971,9.973,9.976,9.979,9.982,9.985,9.988,9.99,9.993,9.996,9.999,10.002,10.005,10.007,10.01,10.013,10.016,10.019,10.022,10.024,10.027,10.03,10.033,10.036,10.038,10.041,10.044,10.047,10.05,10.053,10.055,10.058,10.061,10.064,10.067,10.069,10.072,10.075,10.078,10.081,10.084,10.086,10.089,10.092,10.095,10.098,10.1,10.103,10.106,10.109,10.112,10.114,10.117,10.12,10.123,10.126,10.128,10.131,10.134,10.137,10.14,10.142,10.145,10.148,10.151,10.154,10.156,10.159,10.162,10.165,10.168,10.17,10.173,10.176,10.179,10.182,10.184,10.187,10.19,10.193,10.196,10.198,10.201,10.204,10.207,10.209,10.212,10.215,10.218,10.221,10.223,10.226,10.229,10.232,10.235,10.237,10.24,10.243,10.246,10.248,10.251,10.254,10.257,10.259,10.262,10.265,10.268,10.271,10.273,10.276,10.279,10.282,10.284,10.287,10.29,10.293,10.295,10.298,10.301,10.304,10.307,10.309,10.312,10.315,10.318,10.32,10.323,10.326,10.329,10.331,10.334,10.337,10.34,10.342,10.345,10.348,10.351,10.353,10.356,10.359,10.362,10.364,10.367,10.37,10.373,10.375,10.378,10.381,10.384,10.386,10.389,10.392,10.395,10.397,10.4,10.403,10.406,10.408,10.411,10.414,10.416,10.419,10.422,10.425,10.427,10.43,10.433,10.436,10.438,10.441,10.444,10.447,10.449,10.452,10.455,10.457,10.46,10.463,10.466,10.468,10.471,10.474,10.477,10.479,10.482,10.485,10.487,10.49,10.493,10.496,10.498,10.501,10.504,10.506,10.509,10.512,10.515,10.517,10.52,10.523,10.525,10.528,10.531,10.534,10.536,10.539,10.542,10.544,10.547,10.55,10.552,10.555,10.558,10.561,10.563,10.566,10.569,10.571,10.574,10.577,10.579,10.582,10.585,10.588,10.59,10.593,10.596,10.598,10.601,10.604,10.606,10.609,10.612,10.614,10.617,10.62,10.622,10.625,10.628,10.631,10.633,10.636,10.639,10.641,10.644,10.647,10.649,10.652,10.655,10.657,10.66,10.663,10.665,10.668,10.671,10.673,10.676,10.679,10.681,10.684,10.687,10.689,10.692,10.695,10.697,10.7],[11.2,11.203,11.206,11.209,11.212,11.215,11.218,11.221,11.224,11.227,11.23,11.232,11.235,11.238,11.241,11.244,11.247,11.25,11.253,11.256,11.259,11.262,11.265,11.268,11.27,11.273,11.276,11.279,11.282,11.285,11.288,11.291,11.294,11.297,11.3,11.303,11.305,11.308,11.311,11.314,11.317,11.32,11.323,11.326,11.329,11.332,11.335,11.338,11.341,11.343,11.346,11.349,11.352,11.355,11.358,11.361,11.364,11.367,11.37,11.373,11.376,11.378,11.381,11.384,11.387,11.39,11.393,11.396,11.399,11.402,11.405,11.408,11.411,11.413,11.416,11.419,11.422,11.425,11.428,11.431,11.434,11.437,11.44,11.443,11.446,11.448,11.451,11.454,11.457,11.46,11.463,11.466,11.469,11.472,11.475,11.478,11.481,11.483,11.486,11.489,11.492,11.495,11.498,11.501,11.504,11.507,11.51,11.513,11.516,11.518,11.521,11.524,11.527,11.53,11.533,11.536,11.539,11.542,11.545,11.548,11.55,11.553,11.556,11.559,11.562,11.565,11.568,11.571,11.574,11.577,11.58,11.583,11.585,11.588,11.591,11.594,11.597,11.6,11.603,11.606,11.609,11.612,11.615,11.617,11.62,11.623,11.626,11.629,11.632,11.635,11.638,11.641,11.644,11.647,11.649,11.652,11.655,11.658,11.661,11.664,11.667,11.67,11.673,11.676,11.679,11.681,11.684,11.687,11.69,11.693,11.696,11.699,11.702,11.705,11.708,11.711,11.713,11.716,11.719,11.722,11.725,11.728,11.731,11.734,11.737,11.74,11.743,11.745,11.748,11.751,11.754,11.757,11.76,11.763,11.766,11.769,11.772,11.775,11.777,11.78,11.783,11.786,11.789,11.792,11.795,11.798,11.801,11.804,11.806,11.809,11.812,11.815,11.818,11.821,11.824,11.827,11.83,11.833,11.835,11.838,11.841,11.844,11.847,11.85,11.853,11.856,11.859,11.862,11.864,11.867,11.87,11.873,11.876,11.879,11.882,11.885,11.888,11.891,11.893,11.896,11.899,11.902,11.905,11.908,11.911,11.914,11.917,11.92,11.922,11.925,11.928,11.931,11.934,11.937,11.94,11.943,11.946,11.949,11.951,11.954,11.957,11.96,11.963,11.966,11.969,11.972,11.975,11.977,11.98,11.983,11.986,11.989,11.992,11.995,11.998,12.001,12.003,12.006,12.009,12.012,12.015,12.018,12.021,12.024,12.027,12.03,12.032,12.035,12.038,12.041,12.044,12.047,12.05,12.053,12.056,12.058,12.061,12.064,12.067,12.07,12.073]],"truck_3e|2.5":[[10.536,10.54,10.545,10.55,10.555,10.56,10.565,10.569,10.574,10.579,10.584,10.589,10.593,10.598,10.603,10.608,10.613,10.617,10.622,10.627,10.632,10.637,10.641,10.646,10.651,10.656,10.661,10.665,10.67,10.675,10.68,10.684,10.689,10.694,10.699,10.704,10.708,10.713,10.718,10.723,10.728,10.732,10.737,10.742,10.747,10.751,10.756,10.761,10.766,10.771,10.775,10.78,10.785,10.79,10.794,10.799,10.804,10.809,10.813,10.818,10.823,10.828,10.832,10.837,10.842,10.847,10.851,10.856,10.861,10.866,10.87,10.875,10.88,10.885,10.889,10.894,10.899,10.904,10.908,10.913,10.918,10.923,10.927,10.932,10.937,10.942,10.946,10.951,10.956,10.961,10.965,10.97,10.975,10.979,10.984,10.989,10.994,10.998,11.003,11.008,11.013,11.017,11.022,11.027,11.031,11.036,11.041,11.046,11.05,11.055,11.06,11.064,11.069,11.074,11.078,11.083,11.088,11.093,11.097,11.102,11.107,11.111,11.116,11.121,11.125,11.13,11.135,11.14,11.144,11.149,11.154,11.158,11.163,11.168,11.172,11.177,11.182,11.186,11.191,11.196,11.2,11.205,11.21,11.214,11.219,11.224,11.228,11.233,11.238,11.242,11.247,11.252,11.256,11.261,11.266,11.27,11.275,11.28,11.284,11.289,11.294,11.298,11.303,11.308,11.312,11.317,11.322,11.326,11.331,11.335,11.34,11.345,11.349,11.354,11.359,11.363,11.368,11.373,11.377,11.382,11.386,11.391,11.396,11.4,11.405,11.41,11.414,11.419,11.423,11.428,11.433,11.437,11.442,11.447,11.451,11.456,11.46,11.465,11.47,11.474,11.479,11.483,11.488,11.493,11.497,11.502,11.506,11.511,11.516,11.52,11.525,11.529,11.534,11.539,11.543,11.548,11.552,11.557,11.561,11.566,11.571,11.575,11.58,11.584,11.589,11.593,11.598,11.603,11.607,11.612,11.616,11.621,11.625,11.63,11.635,11.639,11.644,11.648,11.653,11.657,11.662,11.667,11.671,11.676,11.68,11.685,11.689,11.694,11.698,11.703,11.707,11.712,11.717,11.721,11.726,11.73,11.735,11.739,11.744,11.748,11.753,11.757,11.762,11.766,11.771,11.775,11.78,11.785,11.789,11.794,11.798,11.803,11.807,11.812,11.816,11.821,11.825,11.83,11.834,11.839,11.843,11.848,11.852,11.857,11.861,11.866,11.87,11.875,11.879,11.884,11.888,11.893,11.897,11.902,11.906,11.911,11.915,11.92,11.924,11.929,11.933],[9.871,9.876,9.88,9.885,9.89,9.895,9.899,9.904,9.909,9.914,9.918,9.923,9.928,9.933,9.937,9.942,9.947,9.952,9.956,9.961,9.966,9.971,9.975,9.98,9.985,9.989,9.994,9.999,10.004,10.008,10.013,10.018,10.022,10.027,10.032,10.037,10.041,10.046,10.051,10.055,10.06,10.065,10.069,10.074,10.079,10.084,10.088,10.093,10.098,10.102,10.107,10.112,10.116,10.121,10.126,10.13,10.135,10.14,10.144,10.149,10.154,10.158,10.163,10.168,10.172,10.177,10.182,10.186,10.191,10.196,10.2,10.205,10.209,10.214,10.219,10.223,10.228,10.233,10.237,10.242,10.247,10.251,10.256,10.26,10.265,10.27,10.274,10.279,10.283,10.288,10.293,10.297,10.302,10.307,10.311,10.316,10.32,10.325,10.33,10.334,10.339,10.343,10.348,10.352,10.357,10.362,10.366,10.371,10.375,10.38,10.385,10.389,10.394,10.398,10.403,10.407,10.412,10.416,10.421,10.426,10.43,10.435,10.439,10.444,10.448,10.453,10.457,10.462,10.467,10.471,10.476,10.48,10.485,10.489,10.494,10.498,10.503,10.507,10.512,10.516,10.521,10.525,10.53,10.534,10.539,10.543,10.548,10.552,10.557,10.561,10.566,10.57,10.575,10.579,10.584,10.588,10.593,10.597,10.602,10.606,10.611,10.615,10.62,10.624,10.629,10.633,10.638,10.642,10.647,10.651,10.656,10.66,10.664,10.669,10.673,10.678,10.682,10.687,10.691,10.696,10.7,10.704,10.709,10.713,10.718,10.722,10.727,10.731,10.736,10.74,10.744,10.749,10.753,10.758,10.762,10.766,10.771,10.775,10.78,10.784,10.789,10.793,10.797,10.802,10.806,10.811,10.815,10.819,10.824,10.828,10.832,10.837,10.841,10.846,10.85,10.854,10.859,10.863,10.867,10.872,10.876,10.881,10.885,10.889,10.894,10.898,10.902,10.907,10.911,10.915,10.92,10.924,10.929,10.933,10.937,10.942,10.946,10.95,10.955,10.959,10.963,10.968,10.972,10.976,10.981,10.985,10.989,10.993,10.998,11.002,11.006,11.011,11.015,11.019,11.024,11.028,11.032,11.037,11.041,11.045,11.049,11.054,11.058,11.062,11.067,11.071,11.075,11.079,11.084,11.088,11.092,11.097,11.101,11.105,11.109,11.114,11.118,11.122,11.126,11.131,11.135,11.139,11.143,11.148,11.152,11.156,11.16,11.165,11.169,11.173,11.177,11.182,11.186,11.19,11.194,11.199,11.203,11.207,11.211,11.216,11.22],[11.2,11.205,11.21,11.215,11.22,11.225,11.23,11.234,11.239,11.244,11.249,11.254,11.259,11.264,11.269,11.273,11.278,11.283,11.288,11.293,11.298,11.303,11.307,11.312,11.317,11.322,11.327,11.332,11.337,11.341,11.346,11.351,11.356,11.361,11.366,11.371,11.376,11.38,11.385,11.39,11.395,11.4,11.405,11.41,11.414,11.419,11.424,11.429,11.434,11.439,11.444,11.448,11.453,11.458,11.463,11.468,11.473,11.478,11.482,11.487,11.492,11.497,11.502,11.507,11.512,11.517,11.521,11.526,11.531,11.536,11.541,11.546,11.55,11.555,11.56,11.565,11.57,11.575,11.58,11.584,11.589,11.594,11.599,11.604,11.609,11.614,11.618,11.623,11.628,11.633,11.638,11.643,11.648,11.652,11.657,11.662,11.667,11.672,11.677,11.681,11.686,11.691,11.696,11.701,11.706,11.711,11.715,11.72,11.725,11.73,11.735,11.74,11.744,11.749,11.754,11.759,11.764,11.769,11.774,11.778,11.783,11.788,11.793,11.798,11.803,11.807,11.812,11.817,11.822,11.827,11.832,11.836,11.841,11.846,11.851,11.856,11.861,11.865,11.87,11.875,11.88,11.885,11.89,11.894,11.899,11.904,11.909,11.914,11.919,11.923,11.928,11.933,11.938,11.943,11.948,11.952,11.957,11.962,11.967,11.972,11.976,11.981,11.986,11.991,11.996,12.001,12.005,12.01,12.015,12.02,12.025,12.03,12.034,12.039,12.044,12.049,12.054,12.058,12.063,12.068,12.073,12.078,12.082,12.087,12.092,12.097,12.102,12.107,12.111,12.116,12.121,12.126,12.131,12.135,12.14,12.145,12.15,12.155,12.159,12.164,12.169,12.174,12.179,12.183,12.188,12.193,12.198,12.203,12.207,12.212,12.217,12.222,12.227,12.231,12.236,12.241,12.246,12.251,12.255,12.26,12.265,12.27,12.275,12.279,12.284,12.289,12.294,12.298,12.303,12.308,12.313,12.318,12.322,12.327,12.332,12.337,12.342,12.346,12.351,12.356,12.361,12.365,12.37,12.375,12.38,12.385,12.389,12.394,12.399,12.404,12.408,12.413,12.418,12.423,12.428,12.432,12.437,12.442,12.447,12.451,12.456,12.461,12.466,12.471,12.475,12.48,12.485,12.49,12.494,12.499,12.504,12.509,12.513,12.518,12.523,12.528,12.532,12.537,12.542,12.547,12.552,12.556,12.561,12.566,12.571,12.575,12.58,12.585,12.59,12.594,12.599,12.604,12.609,12.613,12.618,12.623,12.628,12.632,12.637,12.642,12.647]],"carreta_4e|1":[[10.536,10.538,10.539,10.541,10.543,10.545,10.547,10.549,10.551,10.553,10.555,10.557,10.559,10.561,10.563,10.565,10.566,10.568,10.57,10.572,10.574,10.576,10.578,10.58,10.582,10.584,10.586,10.588,10.59,10.591,10.593,10.595,10.597,10.599,10.601,10.603,10.605,10.607,10.609,10.611,10.613,10.614,10.616,10.618,10.62,10.622,10.624,10.626,10.628,10.63,10.632,10.634,10.636,10.638,10.639,10.641,10.643,10.645,10.647,10.649,10.651,10.653,10.655,10.657,10.659,10.661,10.662,10.664,10.666,10.668,10.67,10.672,10.674,10.676,10.678,10.68,10.682,10.684,10.685,10.687,10.689,10.691,10.693,10.695,10.697,10.699,10.701,10.703,10.705,10.706,10.708,10.71,10.712,10.714,10.716,10.718,10.72,10.722,10.724,10.726,10.728,10.729,10.731,10.733,10.735,10.737,10.739,10.741,10.743,10.745,10.747,10.749,10.75,10.752,10.754,10.756,10.758,10.76,10.762,10.764,10.766,10.768,10.77,10.771,10.773,10.775,10.777,10.779,10.781,10.783,10.785,10.787,10.789,10.791,10.792,10.794,10.796,10.798,10.8,10.802,10.804,10.806,10.808,10.81,10.812,10.813,10.815,10.817,10.819,10.821,10.823,10.825,10.827,10.829,10.831,10.832,10.834,10.836,10.838,10.84,10.842,10.844,10.846,10.848,10.85,10.851,10.853,10.855,10.857,10.859,10.861,10.863,10.865,10.867,10.869,10.87,10.872,10.874,10.876,10.878,10.88,10.882,10.884,10.886,10.888,10.889,10.891,10.893,10.895,10.897,10.899,10.901,10.903,10.905,10.907,10.908,10.91,10.912,10.914,10.916,10.918,10.92,10.922,10.924,10.926,10.927,10.929,10.931,10.933,10.935,10.937,10.939,10.941,10.943,10.944,10.946,10.948,10.95,10.952,10.954,10.956,10.958,10.96,10.962,10.963,10.965,10.967,10.969,10.971,10.973,10.975,10.977,10.979,10.98,10.982,10.984,10.986,10.988,10.99,10.992,10.994,10.996,10.997,10.999,11.001,11.003,11.005,11.007,11.009,11.011,11.013,11.014,11.016,11.018,11.02,11.022,11.024,11.026,11.028,11.03,11.031,11.033,11.035,11.037,11.039,11.041,11.043,11.045,11.046,11.048,11.05,11.052,11.054,11.056,11.058,11.06,11.062,11.063,11.065,11.067,11.069,11.071,11.073,11.075,11.077,11.078,11.08,11.082,11.084,11.086,11.088,11.09,11.092,11.094,11.095,11.097,11.099,11.101,11.103,11.105,11.107],[9.871,9.873,9.875,9.877,9.879,9.88,9.882,9.884,9.886,9.888,9.89,9.892,9.894,9.896,9.898,9.899,9.901,9.903,9.905,9.907,9.909,9.911,9.913,9.915,9.917,9.918,9.92,9.922,9.924,9.926,9.928,9.93,9.932,9.934,9.936,9.937,9.939,9.941,9.943,9.945,9.947,9.949,9.951,9.953,9.954,9.956,9.958,9.96,9.962,9.964,9.966,9.968,9.97,9.971,9.973,9.975,9.977,9.979,9.981,9.983,9.985,9.987,9.988,9.99,9.992,9.994,9.996,9.998,10,10.002,10.004,10.005,10.007,10.009,10.011,10.013,10.015,10.017,10.019,10.021,10.022,10.024,10.026,10.028,10.03,10.032,10.034,10.036,10.038,10.039,10.041,10.043,10.045,10.047,10.049,10.051,10.053,10.054,10.056,10.058,10.06,10.062,10.064,10.066,10.068,10.069,10.071,10.073,10.075,10.077,10.079,10.081,10.083,10.084,10.086,10.088,10.09,10.092,10.094,10.096,10.098,10.099,10.101,10.103,10.105,10.107,10.109,10.111,10.113,10.114,10.116,10.118,10.12,10.122,10.124,10.126,10.128,10.129,10.131,10.133,10.135,10.137,10.139,10.141,10.142,10.144,10.146,10.148,10.15,10.152,10.154,10.156,10.157,10.159,10.161,10.163,10.165,10.167,10.169,10.17,10.172,10.174,10.176,10.178,10.18,10.182,10.183,10.185,10.187,10.189,10.191,10.193,10.195,10.196,10.198,10.2,10.202,10.204,10.206,10.208,10.209,10.211,10.213,10.215,10.217,10.219,10.221,10.222,10.224,10.226,10.228,10.23,10.232,10.234,10.235,10.237,10.239,10.241,10.243,10.245,10.247,10.248,10.25,10.252,10.254,10.256,10.258,10.259,10.261,10.263,10.265,10.267,10.269,10.271,10.272,10.274,10.276,10.278,10.28,10.282,10.283,10.285,10.287,10.289,10.291,10.293,10.295,10.296,10.298,10.3,10.302,10.304,10.306,10.307,10.309,10.311,10.313,10.315,10.317,10.318,10.32,10.322,10.324,10.326,10.328,10.33,10.331,10.333,10.335,10.337,10.339,10.341,10.342,10.344,10.346,10.348,10.35,10.352,10.353,10.355,10.357,10.359,10.361,10.363,10.364,10.366,10.368,10.37,10.372,10.374,10.375,10.377,10.379,10.381,10.383,10.385,10.386,10.388,10.39,10.392,10.394,10.396,10.397,10.399,10.401,10.403,10.405,10.406,10.408,10.41,10.412,10.414,10.416,10.417,10.419,10.421,10.423,10.425,10.427,10.428,10.43],[11.2,11.202,11.204,11.206,11.208,11.21,11.212,11.214,11.216,11.218,11.22,11.222,11.224,11.226,11.228,11.23,11.232,11.233,11.235,11.237,11.239,11.241,11.243,11.245,11.247,11.249,11.251,11.253,11.255,11.257,11.259,11.261,11.263,11.265,11.267,11.269,11.27,11.272,11.274,11.276,11.278,11.28,11.282,11.284,11.286,11.288,11.29,11.292,11.294,11.296,11.298,11.3,11.302,11.304,11.305,11.307,11.309,11.311,11.313,11.315,11.317,11.319,11.321,11.323,11.325,11.327,11.329,11.331,11.333,11.335,11.337,11.339,11.341,11.342,11.344,11.346,11.348,11.35,11.352,11.354,11.356,11.358,11.36,11.362,11.364,11.366,11.368,11.37,11.372,11.374,11.376,11.377,11.379,11.381,11.383,11.385,11.387,11.389,11.391,11.393,11.395,11.397,11.399,11.401,11.403,11.405,11.407,11.409,11.411,11.412,11.414,11.416,11.418,11.42,11.422,11.424,11.426,11.428,11.43,11.432,11.434,11.436,11.438,11.44,11.442,11.444,11.446,11.447,11.449,11.451,11.453,11.455,11.457,11.459,11.461,11.463,11.465,11.467,11.469,11.471,11.473,11.475,11.477,11.479,11.481,11.482,11.484,11.486,11.488,11.49,11.492,11.494,11.496,11.498,11.5,11.502,11.504,11.506,11.508,11.51,11.512,11.514,11.516,11.517,11.519,11.521,11.523,11.525,11.527,11.529,11.531,11.533,11.535,11.537,11.539,11.541,11.543,11.545,11.547,11.549,11.55,11.552,11.554,11.556,11.558,11.56,11.562,11.564,11.566,11.568,11.57,11.572,11.574,11.576,11.578,11.58,11.582,11.584,11.585,11.587,11.589,11.591,11.593,11.595,11.597,11.599,11.601,11.603,11.605,11.607,11.609,11.611,11.613,11.615,11.617,11.618,11.62,11.622,11.624,11.626,11.628,11.63,11.632,11.634,11.636,11.638,11.64,11.642,11.644,11.646,11.648,11.649,11.651,11.653,11.655,11.657,11.659,11.661,11.663,11.665,11.667,11.669,11.671,11.673,11.675,11.677,11.679,11.681,11.682,11.684,11.686,11.688,11.69,11.692,11.694,11.696,11.698,11.7,11.702,11.704,11.706,11.708,11.71,11.712,11.713,11.715,11.717,11.719,11.721,11.723,11.725,11.727,11.729,11.731,11.733,11.735,11.737,11.739,11.741,11.743,11.744,11.746,11.748,11.75,11.752,11.754,11.756,11.758,11.76,11.762,11.764,11.766,11.768,11.77,11.772,11.774,11.775,11.777,11.779,11.781,11.783]],"carreta_4e|1.5":[[10.536,10.539,10.541,10.544,10.547,10.55,10.553,10.556,10.559,10.562,10.565,10.567,10.57,10.573,10.576,10.579,10.582,10.585,10.588,10.59,10.593,10.596,10.599,10.602,10.605,10.608,10.611,10.614,10.616,10.619,10.622,10.625,10.628,10.631,10.634,10.637,10.639,10.642,10.645,10.648,10.651,10.654,10.657,10.66,10.662,10.665,10.668,10.671,10.674,10.677,10.68,10.683,10.685,10.688,10.691,10.694,10.697,10.7,10.703,10.706,10.708,10.711,10.714,10.717,10.72,10.723,10.726,10.728,10.731,10.734,10.737,10.74,10.743,10.746,10.749,10.751,10.754,10.757,10.76,10.763,10.766,10.769,10.771,10.774,10.777,10.78,10.783,10.786,10.789,10.791,10.794,10.797,10.8,10.803,10.806,10.809,10.812,10.814,10.817,10.82,10.823,10.826,10.829,10.831,10.834,10.837,10.84,10.843,10.846,10.849,10.851,10.854,10.857,10.86,10.863,10.866,10.869,10.871,10.874,10.877,10.88,10.883,10.886,10.889,10.891,10.894,10.897,10.9,10.903,10.906,10.908,10.911,10.914,10.917,10.92,10.923,10.926,10.928,10.931,10.934,10.937,10.94,10.943,10.945,10.948,10.951,10.954,10.957,10.96,10.962,10.965,10.968,10.971,10.974,10.977,10.979,10.982,10.985,10.988,10.991,10.994,10.996,10.999,11.002,11.005,11.008,11.011,11.013,11.016,11.019,11.022,11.025,11.028,11.03,11.033,11.036,11.039,11.042,11.045,11.047,11.05,11.053,11.056,11.059,11.062,11.064,11.067,11.07,11.073,11.076,11.078,11.081,11.084,11.087,11.09,11.093,11.095,11.098,11.101,11.104,11.107,11.11,11.112,11.115,11.118,11.121,11.124,11.126,11.129,11.132,11.135,11.138,11.14,11.143,11.146,11.149,11.152,11.155,11.157,11.16,11.163,11.166,11.169,11.171,11.174,11.177,11.18,11.183,11.185,11.188,11.191,11.194,11.197,11.199,11.202,11.205,11.208,11.211,11.213,11.216,11.219,11.222,11.225,11.227,11.23,11.233,11.236,11.239,11.241,11.244,11.247,11.25,11.253,11.255,11.258,11.261,11.264,11.267,11.269,11.272,11.275,11.278,11.281,11.283,11.286,11.289,11.292,11.295,11.297,11.3,11.303,11.306,11.309,11.311,11.314,11.317,11.32,11.322,11.325,11.328,11.331,11.334,11.336,11.339,11.342,11.345,11.348,11.35,11.353,11.356,11.359,11.361,11.364,11.367,11.37,11.373,11.375,11.378,11.381,11.384,11.386],[9.871,9.874,9.877,9.879,9.882,9.885,9.888,9.891,9.894,9.897,9.899,9.902,9.905,9.908,9.911,9.914,9.917,9.919,9.922,9.925,9.928,9.931,9.934,9.936,9.939,9.942,9.945,9.948,9.951,9.954,9.956,9.959,9.962,9.965,9.968,9.971,9.973,9.976,9.979,9.982,9.985,9.988,9.99,9.993,9.996,9.999,10.002,10.005,10.007,10.01,10.013,10.016,10.019,10.022,10.024,10.027,10.03,10.033,10.036,10.038,10.041,10.044,10.047,10.05,10.053,10.055,10.058,10.061,10.064,10.067,10.069,10.072,10.075,10.078,10.081,10.084,10.086,10.089,10.092,10.095,10.098,10.1,10.103,10.106,10.109,10.112,10.114,10.117,10.12,10.123,10.126,10.128,10.131,10.134,10.137,10.14,10.142,10.145,10.148,10.151,10.154,10.156,10.159,10.162,10.165,10.168,10.17,10.173,10.176,10.179,10.182,10.184,10.187,10.19,10.193,10.196,10.198,10.201,10.204,10.207,10.209,10.212,10.215,10.218,10.221,10.223,10.226,10.229,10.232,10.235,10.237,10.24,10.243,10.246,10.248,10.251,10.254,10.257,10.259,10.262,10.265,10.268,10.271,10.273,10.276,10.279,10.282,10.284,10.287,10.29,10.293,10.295,10.298,10.301,10.304,10.307,10.309,10.312,10.315,10.318,10.32,10.323,10.326,10.329,10.331,10.334,10.337,10.34,10.342,10.345,10.348,10.351,10.353,10.356,10.359,10.362,10.364,10.367,10.37,10.373,10.375,10.378,10.381,10.384,10.386,10.389,10.392,10.395,10.397,10.4,10.403,10.406,10.408,10.411,10.414,10.416,10.419,10.422,10.425,10.427,10.43,10.433,10.436,10.438,10.441,10.444,10.447,10.449,10.452,10.455,10.457,10.46,10.463,10.466,10.468,10.471,10.474,10.477,10.479,10.482,10.485,10.487,10.49,10.493,10.496,10.498,10.501,10.504,10.506,10.509,10.512,10.515,10.517,10.52,10.523,10.525,10.528,10.531,10.534,10.536,10.539,10.542,10.544,10.547,10.55,10.552,10.555,10.558,10.561,10.563,10.566,10.569,10.571,10.574,10.577,10.579,10.582,10.585,10.588,10.59,10.593,10.596,10.598,10.601,10.604,10.606,10.609,10.612,10.614,10.617,10.62,10.622,10.625,10.628,10.631,10.633,10.636,10.639,10.641,10.644,10.647,10.649,10.652,10.655,10.657,10.66,10.663,10.665,10.668,10.671,10.673,10.676,10.679,10.681,10.684,10.687,10.689,10.692,10.695,10.697,10.7],[11.2,11.203,11.206,11.209,11.212,11.215,11.218,11.221,11.224,11.227,11.23,11.232,11.235,11.238,11.241,11.244,11.247,11.25,11.253,11.256,11.259,11.262,11.265,11.268,11.27,11.273,11.276,11.279,11.282,11.285,11.288,11.291,11.294,11.297,11.3,11.303,11.305,11.308,11.311,11.314,11.317,11.32,11.323,11.326,11.329,11.332,11.335,11.338,11.341,11.343,11.346,11.349,11.352,11.355,11.358,11.361,11.364,11.367,11.37,11.373,11.376,11.378,11.381,11.384,11.387,11.39,11.393,11.396,11.399,11.402,11.405,11.408,11.411,11.413,11.416,11.419,11.422,11.425,11.428,11.431,11.434,11.437,11.44,11.443,11.446,11.448,11.451,11.454,11.457,11.46,11.463,11.466,11.469,11.472,11.475,11.478,11.481,11.483,11.486,11.489,11.492,11.495,11.498,11.501,11.504,11.507,11.51,11.513,11.516,11.518,11.521,11.524,11.527,11.53,11.533,11.536,11.539,11.542,11.545,11.548,11.55,11.553,11.556,11.559,11.562,11.565,11.568,11.571,11.574,11.577,11.58,11.583,11.585,11.588,11.591,11.594,11.597,11.6,11.603,11.606,11.609,11.612,11.615,11.617,11.62,11.623,11.626,11.629,11.632,11.635,11.638,11.641,11.644,11.647,11.649,11.652,11.655,11.658,11.661,11.664,11.667,11.67,11.673,11.676,11.679,11.681,11.684,11.687,11.69,11.693,11.696,11.699,11.702,11.705,11.708,11.711,11.713,11.716,11.719,11.722,11.725,11.728,11.731,11.734,11.737,11.74,11.743,11.745,11.748,11.751,11.754,11.757,11.76,11.763,11.766,11.769,11.772,11.775,11.777,11.78,11.783,11.786,11.789,11.792,11.795,11.798,11.801,11.804,11.806,11.809,11.812,11.815,11.818,11.821,11.824,11.827,11.83,11.833,11.835,11.838,11.841,11.844,11.847,11.85,11.853,11.856,11.859,11.862,11.864,11.867,11.87,11.873,11.876,11.879,11.882,11.885,11.888,11.891,11.893,11.896,11.899,11.902,11.905,11.908,11.911,11.914,11.917,11.92,11.922,11.925,11.928,11.931,11.934,11.937,11.94,11.943,11.946,11.949,11.951,11.954,11.957,11.96,11.963,11.966,11.969,11.972,11.975,11.977,11.98,11.983,11.986,11.989,11.992,11.995,11.998,12.001,12.003,12.006,12.009,12.012,12.015,12.018,12.021,12.024,12.027,12.03,12.032,12.035,12.038,12.041,12.044,12.047,12.05,12.053,12.056,12.058,12.061,12.064,12.067,12.07,12.073]],"carreta_4e|2.5":[[10.536,10.54,10.545,10.55,10.555,10.56,10.565,10.569,10.574,10.579,10.584,10.589,10.593,10.598,10.603,10.608,10.613,10.617,10.622,10.627,10.632,10.637,10.641,10.646,10.651,10.656,10.661,10.665,10.67,10.675,10.68,10.684,10.689,10.694,10.699,10.704,10.708,10.713,10.718,10.723,10.728,10.732,10.737,10.742,10.747,10.751,10.756,10.761,10.766,10.771,10.775,10.78,10.785,10.79,10.794,10.799,10.804,10.809,10.813,10.818,10.823,10.828,10.832,10.837,10.842,10.847,10.851,10.856,10.861,10.866,10.87,10.875,10.88,10.885,10.889,10.894,10.899,10.904,10.908,10.913,10.918,10.923,10.927,10.932,10.937,10.942,10.946,10.951,10.956,10.961,10.965,10.97,10.975,10.979,10.984,10.989,10.994,10.998,11.003,11.008,11.013,11.017,11.022,11.027,11.031,11.036,11.041,11.046,11.05,11.055,11.06,11.064,11.069,11.074,11.078,11.083,11.088,11.093,11.097,11.102,11.107,11.111,11.116,11.121,11.125,11.13,11.135,11.14,11.144,11.149,11.154,11.158,11.163,11.168,11.172,11.177,11.182,11.186,11.191,11.196,11.2,11.205,11.21,11.214,11.219,11.224,11.228,11.233,11.238,11.242,11.247,11.252,11.256,11.261,11.266,11.27,11.275,11.28,11.284,11.289,11.294,11.298,11.303,11.308,11.312,11.317,11.322,11.326,11.331,11.335,11.34,11.345,11.349,11.354,11.359,11.363,11.368,11.373,11.377,11.382,11.386,11.391,11.396,11.4,11.405,11.41,11.414,11.419,11.423,11.428,11.433,11.437,11.442,11.447,11.451,11.456,11.46,11.465,11.47,11.474,11.479,11.483,11.488,11.493,11.497,11.502,11.506,11.511,11.516,11.52,11.525,11.529,11.534,11.539,11.543,11.548,11.552,11.557,11.561,11.566,11.571,11.575,11.58,11.584,11.589,11.593,11.598,11.603,11.607,11.612,11.616,11.621,11.625,11.63,11.635,11.639,11.644,11.648,11.653,11.657,11.662,11.667,11.671,11.676,11.68,11.685,11.689,11.694,11.698,11.703,11.707,11.712,11.717,11.721,11.726,11.73,11.735,11.739,11.744,11.748,11.753,11.757,11.762,11.766,11.771,11.775,11.78,11.785,11.789,11.794,11.798,11.803,11.807,11.812,11.816,11.821,11.825,11.83,11.834,11.839,11.843,11.848,11.852,11.857,11.861,11.866,11.87,11.875,11.879,11.884,11.888,11.893,11.897,11.902,11.906,11.911,11.915,11.92,11.924,11.929,11.933],[9.871,9.876,9.88,9.885,9.89,9.895,9.899,9.904,9.909,9.914,9.918,9.923,9.928,9.933,9.937,9.942,9.947,9.952,9.956,9.961,9.966,9.971,9.975,9.98,9.985,9.989,9.994,9.999,10.004,10.008,10.013,10.018,10.022,10.027,10.032,10.037,10.041,10.046,10.051,10.055,10.06,10.065,10.069,10.074,10.079,10.084,10.088,10.093,10.098,10.102,10.107,10.112,10.116,10.121,10.126,10.13,10.135,10.14,10.144,10.149,10.154,10.158,10.163,10.168,10.172,10.177,10.182,10.186,10.191,10.196,10.2,10.205,10.209,10.214,10.219,10.223,10.228,10.233,10.237,10.242,10.247,10.251,10.256,10.26,10.265,10.27,10.274,10.279,10.283,10.288,10.293,10.297,10.302,10.307,10.311,10.316,10.32,10.325,10.33,10.334,10.339,10.343,10.348,10.352,10.357,10.362,10.366,10.371,10.375,10.38,10.385,10.389,10.394,10.398,10.403,10.407,10.412,10.416,10.421,10.426,10.43,10.435,10.439,10.444,10.448,10.453,10.457,10.462,10.467,10.471,10.476,10.48,10.485,10.489,10.494,10.498,10.503,10.507,10.512,10.516,10.521,10.525,10.53,10.534,10.539,10.543,10.548,10.552,10.557,10.561,10.566,10.57,10.575,10.579,10.584,10.588,10.593,10.597,10.602,10.606,10.611,10.615,10.62,10.624,10.629,10.633,10.638,10.642,10.647,10.651,10.656,10.66,10.664,10.669,10.673,10.678,10.682,10.687,10.691,10.696,10.7,10.704,10.709,10.713,10.718,10.722,10.727,10.731,10.736,10.74,10.744,10.749,10.753,10.758,10.762,10.766,10.771,10.775,10.78,10.784,10.789,10.793,10.797,10.802,10.806,10.811,10.815,10.819,10.824,10.828,10.832,10.837,10.841,10.846,10.85,10.854,10.859,10.863,10.867,10.872,10.876,10.881,10.885,10.889,10.894,10.898,10.902,10.907,10.911,10.915,10.92,10.924,10.929,10.933,10.937,10.942,10.946,10.95,10.955,10.959,10.963,10.968,10.972,10.976,10.981,10.985,10.989,10.993,10.998,11.002,11.006,11.011,11.015,11.019,11.024,11.028,11.032,11.037,11.041,11.045,11.049,11.054,11.058,11.062,11.067,11.071,11.075,11.079,11.084,11.088,11.092,11.097,11.101,11.105,11.109,11.114,11.118,11.122,11.126,11.131,11.135,11.139,11.143,11.148,11.152,11.156,11.16,11.165,11.169,11.173,11.177,11.182,11.186,11.19,11.194,11.199,11.203,11.207,11.211,11.216,11.22],[11.2,11.205,11.21,11.215,11.22,11.225,11.23,11.234,11.239,11.244,11.249,11.254,11.259,11.264,11.269,11.273,11.278,11.283,11.288,11.293,11.298,11.303,11.307,11.312,11.317,11.322,11.327,11.332,11.337,11.341,11.346,11.351,11.356,11.361,11.366,11.371,11.376,11.38,11.385,11.39,11.395,11.4,11.405,11.41,11.414,11.419,11.424,11.429,11.434,11.439,11.444,11.448,11.453,11.458,11.463,11.468,11.473,11.478,11.482,11.487,11.492,11.497,11.502,11.507,11.512,11.517,11.521,11.526,11.531,11.536,11.541,11.546,11.55,11.555,11.56,11.565,11.57,11.575,11.58,11.584,11.589,11.594,11.599,11.604,11.609,11.614,11.618,11.623,11.628,11.633,11.638,11.643,11.648,11.652,11.657,11.662,11.667,11.672,11.677,11.681,11.686,11.691,11.696,11.701,11.706,11.711,11.715,11.72,11.725,11.73,11.735,11.74,11.744,11.749,11.754,11.759,11.764,11.769,11.774,11.778,11.783,11.788,11.793,11.798,11.803,11.807,11.812,11.817,11.822,11.827,11.832,11.836,11.841,11.846,11.851,11.856,11.861,11.865,11.87,11.875,11.88,11.885,11.89,11.894,11.899,11.904,11.909,11.914,11.919,11.923,11.928,11.933,11.938,11.943,11.948,11.952,11.957,11.962,11.967,11.972,11.976,11.981,11.986,11.991,11.996,12.001,12.005,12.01,12.015,12.02,12.025,12.03,12.034,12.039,12.044,12.049,12.054,12.058,12.063,12.068,12.073,12.078,12.082,12.087,12.092,12.097,12.102,12.107,12.111,12.116,12.121,12.126,12.131,12.135,12.14,12.145,12.15,12.155,12.159,12.164,12.169,12.174,12.179,12.183,12.188,12.193,12.198,12.203,12.207,12.212,12.217,12.222,12.227,12.231,12.236,12.241,12.246,12.251,12.255,12.26,12.265,12.27,12.275,12.279,12.284,12.289,12.294,12.298,12.303,12.308,12.313,12.318,12.322,12.327,12.332,12.337,12.342,12.346,12.351,12.356,12.361,12.365,12.37,12.375,12.38,12.385,12.389,12.394,12.399,12.404,12.408,12.413,12.418,12.423,12.428,12.432,12.437,12.442,12.447,12.451,12.456,12.461,12.466,12.471,12.475,12.48,12.485,12.49,12.494,12.499,12.504,12.509,12.513,12.518,12.523,12.528,12.532,12.537,12.542,12.547,12.552,12.556,12.561,12.566,12.571,12.575,12.58,12.585,12.59,12.594,12.599,12.604,12.609,12.613,12.618,12.623,12.628,12.632,12.637,12.642,12.647]],"carreta_5e|1":[[10.536,10.537,10.539,10.541,10.542,10.544,10.546,10.547,10.549,10.55,10.552,10.554,10.555,10.557,10.559,10.56,10.562,10.564,10.565,10.567,10.569,10.57,10.572,10.574,10.575,10.577,10.579,10.58,10.582,10.583,10.585,10.587,10.588,10.59,10.592,10.593,10.595,10.597,10.598,10.6,10.602,10.603,10.605,10.607,10.608,10.61,10.611,10.613,10.615,10.616,10.618,10.62,10.621,10.623,10.625,10.626,10.628,10.63,10.631,10.633,10.634,10.636,10.638,10.639,10.641,10.643,10.644,10.646,10.648,10.649,10.651,10.653,10.654,10.656,10.658,10.659,10.661,10.662,10.664,10.666,10.667,10.669,10.671,10.672,10.674,10.676,10.677,10.679,10.681,10.682,10.684,10.685,10.687,10.689,10.69,10.692,10.694,10.695,10.697,10.699,10.7,10.702,10.703,10.705,10.707,10.708,10.71,10.712,10.713,10.715,10.717,10.718,10.72,10.722,10.723,10.725,10.726,10.728,10.73,10.731,10.733,10.735,10.736,10.738,10.74,10.741,10.743,10.744,10.746,10.748,10.749,10.751,10.753,10.754,10.756,10.758,10.759,10.761,10.762,10.764,10.766,10.767,10.769,10.771,10.772,10.774,10.776,10.777,10.779,10.78,10.782,10.784,10.785,10.787,10.789,10.79,10.792,10.794,10.795,10.797,10.798,10.8,10.802,10.803,10.805,10.807,10.808,10.81,10.812,10.813,10.815,10.816,10.818,10.82,10.821,10.823,10.825,10.826,10.828,10.829,10.831,10.833,10.834,10.836,10.838,10.839,10.841,10.843,10.844,10.846,10.847,10.849,10.851,10.852,10.854,10.856,10.857,10.859,10.86,10.862,10.864,10.865,10.867,10.869,10.87,10.872,10.873,10.875,10.877,10.878,10.88,10.882,10.883,10.885,10.886,10.888,10.89,10.891,10.893,10.895,10.896,10.898,10.9,10.901,10.903,10.904,10.906,10.908,10.909,10.911,10.913,10.914,10.916,10.917,10.919,10.921,10.922,10.924,10.926,10.927,10.929,10.93,10.932,10.934,10.935,10.937,10.939,10.94,10.942,10.943,10.945,10.947,10.948,10.95,10.951,10.953,10.955,10.956,10.958,10.96,10.961,10.963,10.964,10.966,10.968,10.969,10.971,10.973,10.974,10.976,10.977,10.979,10.981,10.982,10.984,10.986,10.987,10.989,10.99,10.992,10.994,10.995,10.997,10.999,11,11.002,11.003,11.005,11.007,11.008,11.01,11.011,11.013,11.015,11.016,11.018,11.02,11.021,11.023,11.024,11.026],[9.871,9.873,9.874,9.876,9.877,9.879,9.881,9.882,9.884,9.886,9.887,9.889,9.89,9.892,9.894,9.895,9.897,9.899,9.9,9.902,9.904,9.905,9.907,9.908,9.91,9.912,9.913,9.915,9.917,9.918,9.92,9.921,9.923,9.925,9.926,9.928,9.93,9.931,9.933,9.934,9.936,9.938,9.939,9.941,9.943,9.944,9.946,9.947,9.949,9.951,9.952,9.954,9.956,9.957,9.959,9.96,9.962,9.964,9.965,9.967,9.969,9.97,9.972,9.973,9.975,9.977,9.978,9.98,9.981,9.983,9.985,9.986,9.988,9.99,9.991,9.993,9.994,9.996,9.998,9.999,10.001,10.003,10.004,10.006,10.007,10.009,10.011,10.012,10.014,10.015,10.017,10.019,10.02,10.022,10.024,10.025,10.027,10.028,10.03,10.032,10.033,10.035,10.036,10.038,10.04,10.041,10.043,10.044,10.046,10.048,10.049,10.051,10.053,10.054,10.056,10.057,10.059,10.061,10.062,10.064,10.065,10.067,10.069,10.07,10.072,10.073,10.075,10.077,10.078,10.08,10.082,10.083,10.085,10.086,10.088,10.09,10.091,10.093,10.094,10.096,10.098,10.099,10.101,10.102,10.104,10.106,10.107,10.109,10.11,10.112,10.114,10.115,10.117,10.118,10.12,10.122,10.123,10.125,10.126,10.128,10.13,10.131,10.133,10.134,10.136,10.138,10.139,10.141,10.142,10.144,10.146,10.147,10.149,10.15,10.152,10.154,10.155,10.157,10.158,10.16,10.162,10.163,10.165,10.166,10.168,10.17,10.171,10.173,10.174,10.176,10.178,10.179,10.181,10.182,10.184,10.186,10.187,10.189,10.19,10.192,10.194,10.195,10.197,10.198,10.2,10.202,10.203,10.205,10.206,10.208,10.209,10.211,10.213,10.214,10.216,10.217,10.219,10.221,10.222,10.224,10.225,10.227,10.229,10.23,10.232,10.233,10.235,10.236,10.238,10.24,10.241,10.243,10.244,10.246,10.248,10.249,10.251,10.252,10.254,10.256,10.257,10.259,10.26,10.262,10.263,10.265,10.267,10.268,10.27,10.271,10.273,10.275,10.276,10.278,10.279,10.281,10.282,10.284,10.286,10.287,10.289,10.29,10.292,10.294,10.295,10.297,10.298,10.3,10.301,10.303,10.305,10.306,10.308,10.309,10.311,10.312,10.314,10.316,10.317,10.319,10.32,10.322,10.323,10.325,10.327,10.328,10.33,10.331,10.333,10.335,10.336,10.338,10.339,10.341,10.342,10.344,10.346,10.347,10.349,10.35,10.352],[11.2,11.202,11.204,11.205,11.207,11.209,11.21,11.212,11.214,11.215,11.217,11.219,11.22,11.222,11.224,11.225,11.227,11.229,11.23,11.232,11.234,11.235,11.237,11.239,11.24,11.242,11.244,11.245,11.247,11.249,11.25,11.252,11.254,11.255,11.257,11.259,11.26,11.262,11.264,11.265,11.267,11.269,11.27,11.272,11.274,11.275,11.277,11.279,11.28,11.282,11.284,11.285,11.287,11.289,11.29,11.292,11.294,11.295,11.297,11.299,11.3,11.302,11.304,11.305,11.307,11.309,11.31,11.312,11.314,11.315,11.317,11.319,11.32,11.322,11.324,11.326,11.327,11.329,11.331,11.332,11.334,11.336,11.337,11.339,11.341,11.342,11.344,11.346,11.347,11.349,11.351,11.352,11.354,11.356,11.357,11.359,11.361,11.362,11.364,11.366,11.367,11.369,11.371,11.372,11.374,11.376,11.377,11.379,11.381,11.382,11.384,11.386,11.387,11.389,11.391,11.392,11.394,11.396,11.397,11.399,11.401,11.402,11.404,11.406,11.407,11.409,11.411,11.412,11.414,11.416,11.417,11.419,11.421,11.422,11.424,11.426,11.427,11.429,11.431,11.432,11.434,11.436,11.437,11.439,11.441,11.442,11.444,11.446,11.447,11.449,11.451,11.452,11.454,11.456,11.457,11.459,11.461,11.462,11.464,11.466,11.467,11.469,11.471,11.472,11.474,11.476,11.477,11.479,11.481,11.482,11.484,11.486,11.487,11.489,11.491,11.492,11.494,11.496,11.497,11.499,11.501,11.502,11.504,11.506,11.507,11.509,11.511,11.512,11.514,11.516,11.517,11.519,11.521,11.522,11.524,11.526,11.527,11.529,11.531,11.532,11.534,11.536,11.537,11.539,11.541,11.542,11.544,11.546,11.547,11.549,11.55,11.552,11.554,11.555,11.557,11.559,11.56,11.562,11.564,11.565,11.567,11.569,11.57,11.572,11.574,11.575,11.577,11.579,11.58,11.582,11.584,11.585,11.587,11.589,11.59,11.592,11.594,11.595,11.597,11.599,11.6,11.602,11.604,11.605,11.607,11.609,11.61,11.612,11.614,11.615,11.617,11.619,11.62,11.622,11.624,11.625,11.627,11.629,11.63,11.632,11.634,11.635,11.637,11.639,11.64,11.642,11.644,11.645,11.647,11.649,11.65,11.652,11.654,11.655,11.657,11.659,11.66,11.662,11.664,11.665,11.667,11.669,11.67,11.672,11.674,11.675,11.677,11.679,11.68,11.682,11.684,11.685,11.687,11.689,11.69,11.692,11.694,11.695,11.697,11.699,11.7]],"carreta_5e|1.5":[[10.536,10.538,10.541,10.543,10.546,10.548,10.55,10.553,10.555,10.558,10.56,10.563,10.565,10.568,10.57,10.573,10.575,10.578,10.58,10.583,10.585,10.588,10.59,10.593,10.595,10.597,10.6,10.602,10.605,10.607,10.61,10.612,10.615,10.617,10.62,10.622,10.625,10.627,10.63,10.632,10.634,10.637,10.639,10.642,10.644,10.647,10.649,10.652,10.654,10.657,10.659,10.662,10.664,10.667,10.669,10.671,10.674,10.676,10.679,10.681,10.684,10.686,10.689,10.691,10.694,10.696,10.699,10.701,10.703,10.706,10.708,10.711,10.713,10.716,10.718,10.721,10.723,10.726,10.728,10.731,10.733,10.735,10.738,10.74,10.743,10.745,10.748,10.75,10.753,10.755,10.758,10.76,10.762,10.765,10.767,10.77,10.772,10.775,10.777,10.78,10.782,10.785,10.787,10.789,10.792,10.794,10.797,10.799,10.802,10.804,10.807,10.809,10.812,10.814,10.816,10.819,10.821,10.824,10.826,10.829,10.831,10.834,10.836,10.838,10.841,10.843,10.846,10.848,10.851,10.853,10.856,10.858,10.86,10.863,10.865,10.868,10.87,10.873,10.875,10.878,10.88,10.882,10.885,10.887,10.89,10.892,10.895,10.897,10.9,10.902,10.904,10.907,10.909,10.912,10.914,10.917,10.919,10.921,10.924,10.926,10.929,10.931,10.934,10.936,10.939,10.941,10.943,10.946,10.948,10.951,10.953,10.956,10.958,10.96,10.963,10.965,10.968,10.97,10.973,10.975,10.977,10.98,10.982,10.985,10.987,10.99,10.992,10.994,10.997,10.999,11.002,11.004,11.007,11.009,11.011,11.014,11.016,11.019,11.021,11.024,11.026,11.028,11.031,11.033,11.036,11.038,11.041,11.043,11.045,11.048,11.05,11.053,11.055,11.058,11.06,11.062,11.065,11.067,11.07,11.072,11.074,11.077,11.079,11.082,11.084,11.087,11.089,11.091,11.094,11.096,11.099,11.101,11.103,11.106,11.108,11.111,11.113,11.116,11.118,11.12,11.123,11.125,11.128,11.13,11.132,11.135,11.137,11.14,11.142,11.144,11.147,11.149,11.152,11.154,11.157,11.159,11.161,11.164,11.166,11.169,11.171,11.173,11.176,11.178,11.181,11.183,11.185,11.188,11.19,11.193,11.195,11.197,11.2,11.202,11.205,11.207,11.209,11.212,11.214,11.217,11.219,11.221,11.224,11.226,11.229,11.231,11.233,11.236,11.238,11.241,11.243,11.245,11.248,11.25,11.253,11.255,11.257,11.26,11.262,11.265,11.267],[9.871,9.873,9.876,9.878,9.881,9.883,9.886,9.888,9.89,9.893,9.895,9.898,9.9,9.903,9.905,9.908,9.91,9.912,9.915,9.917,9.92,9.922,9.925,9.927,9.93,9.932,9.934,9.937,9.939,9.942,9.944,9.947,9.949,9.951,9.954,9.956,9.959,9.961,9.964,9.966,9.969,9.971,9.973,9.976,9.978,9.981,9.983,9.986,9.988,9.99,9.993,9.995,9.998,10,10.003,10.005,10.007,10.01,10.012,10.015,10.017,10.019,10.022,10.024,10.027,10.029,10.032,10.034,10.036,10.039,10.041,10.044,10.046,10.049,10.051,10.053,10.056,10.058,10.061,10.063,10.065,10.068,10.07,10.073,10.075,10.077,10.08,10.082,10.085,10.087,10.09,10.092,10.094,10.097,10.099,10.102,10.104,10.106,10.109,10.111,10.114,10.116,10.118,10.121,10.123,10.126,10.128,10.13,10.133,10.135,10.138,10.14,10.142,10.145,10.147,10.15,10.152,10.154,10.157,10.159,10.162,10.164,10.166,10.169,10.171,10.174,10.176,10.178,10.181,10.183,10.186,10.188,10.19,10.193,10.195,10.198,10.2,10.202,10.205,10.207,10.209,10.212,10.214,10.217,10.219,10.221,10.224,10.226,10.229,10.231,10.233,10.236,10.238,10.24,10.243,10.245,10.248,10.25,10.252,10.255,10.257,10.259,10.262,10.264,10.267,10.269,10.271,10.274,10.276,10.278,10.281,10.283,10.286,10.288,10.29,10.293,10.295,10.297,10.3,10.302,10.305,10.307,10.309,10.312,10.314,10.316,10.319,10.321,10.323,10.326,10.328,10.331,10.333,10.335,10.338,10.34,10.342,10.345,10.347,10.349,10.352,10.354,10.357,10.359,10.361,10.364,10.366,10.368,10.371,10.373,10.375,10.378,10.38,10.382,10.385,10.387,10.389,10.392,10.394,10.397,10.399,10.401,10.404,10.406,10.408,10.411,10.413,10.415,10.418,10.42,10.422,10.425,10.427,10.429,10.432,10.434,10.436,10.439,10.441,10.443,10.446,10.448,10.45,10.453,10.455,10.457,10.46,10.462,10.464,10.467,10.469,10.471,10.474,10.476,10.478,10.481,10.483,10.485,10.488,10.49,10.492,10.495,10.497,10.499,10.502,10.504,10.506,10.509,10.511,10.513,10.516,10.518,10.52,10.523,10.525,10.527,10.53,10.532,10.534,10.537,10.539,10.541,10.544,10.546,10.548,10.551,10.553,10.555,10.557,10.56,10.562,10.564,10.567,10.569,10.571,10.574,10.576,10.578,10.581,10.583,10.585],[11.2,11.203,11.205,11.208,11.21,11.213,11.215,11.218,11.22,11.223,11.225,11.228,11.23,11.233,11.235,11.238,11.24,11.243,11.245,11.248,11.25,11.253,11.255,11.258,11.26,11.263,11.265,11.268,11.27,11.273,11.275,11.278,11.28,11.283,11.285,11.288,11.29,11.293,11.295,11.298,11.3,11.303,11.305,11.308,11.31,11.313,11.315,11.318,11.32,11.323,11.326,11.328,11.331,11.333,11.336,11.338,11.341,11.343,11.346,11.348,11.351,11.353,11.356,11.358,11.361,11.363,11.366,11.368,11.371,11.373,11.376,11.378,11.381,11.383,11.386,11.388,11.391,11.393,11.396,11.398,11.401,11.403,11.406,11.408,11.411,11.413,11.416,11.418,11.421,11.423,11.426,11.428,11.431,11.433,11.436,11.438,11.441,11.443,11.446,11.448,11.451,11.453,11.456,11.458,11.461,11.463,11.466,11.468,11.471,11.473,11.476,11.478,11.481,11.483,11.486,11.488,11.491,11.493,11.496,11.498,11.501,11.503,11.506,11.508,11.511,11.513,11.516,11.518,11.521,11.523,11.526,11.528,11.531,11.533,11.536,11.538,11.541,11.543,11.546,11.548,11.55,11.553,11.555,11.558,11.56,11.563,11.565,11.568,11.57,11.573,11.575,11.578,11.58,11.583,11.585,11.588,11.59,11.593,11.595,11.598,11.6,11.603,11.605,11.608,11.61,11.613,11.615,11.618,11.62,11.623,11.625,11.628,11.63,11.633,11.635,11.638,11.64,11.643,11.645,11.648,11.65,11.653,11.655,11.658,11.66,11.663,11.665,11.668,11.67,11.673,11.675,11.678,11.68,11.683,11.685,11.688,11.69,11.693,11.695,11.698,11.7,11.703,11.705,11.708,11.71,11.713,11.715,11.718,11.72,11.723,11.725,11.728,11.73,11.733,11.735,11.738,11.74,11.743,11.745,11.748,11.75,11.753,11.755,11.757,11.76,11.762,11.765,11.767,11.77,11.772,11.775,11.777,11.78,11.782,11.785,11.787,11.79,11.792,11.795,11.797,11.8,11.802,11.805,11.807,11.81,11.812,11.815,11.817,11.82,11.822,11.825,11.827,11.83,11.832,11.835,11.837,11.84,11.842,11.845,11.847,11.85,11.852,11.855,11.857,11.859,11.862,11.864,11.867,11.869,11.872,11.874,11.877,11.879,11.882,11.884,11.887,11.889,11.892,11.894,11.897,11.899,11.902,11.904,11.907,11.909,11.912,11.914,11.917,11.919,11.922,11.924,11.927,11.929,11.932,11.934,11.937,11.939,11.941,11.944,11.946,11.949]],"carreta_5e|2.5":[[10.536,10.54,10.544,10.548,10.552,10.556,10.56,10.565,10.569,10.573,10.577,10.581,10.585,10.589,10.593,10.597,10.602,10.606,10.61,10.614,10.618,10.622,10.626,10.63,10.634,10.639,10.643,10.647,10.651,10.655,10.659,10.663,10.667,10.671,10.676,10.68,10.684,10.688,10.692,10.696,10.7,10.704,10.708,10.713,10.717,10.721,10.725,10.729,10.733,10.737,10.741,10.745,10.749,10.753,10.758,10.762,10.766,10.77,10.774,10.778,10.782,10.786,10.79,10.794,10.798,10.803,10.807,10.811,10.815,10.819,10.823,10.827,10.831,10.835,10.839,10.843,10.847,10.851,10.856,10.86,10.864,10.868,10.872,10.876,10.88,10.884,10.888,10.892,10.896,10.9,10.904,10.908,10.913,10.917,10.921,10.925,10.929,10.933,10.937,10.941,10.945,10.949,10.953,10.957,10.961,10.965,10.969,10.973,10.977,10.981,10.986,10.99,10.994,10.998,11.002,11.006,11.01,11.014,11.018,11.022,11.026,11.03,11.034,11.038,11.042,11.046,11.05,11.054,11.058,11.062,11.066,11.07,11.074,11.078,11.083,11.087,11.091,11.095,11.099,11.103,11.107,11.111,11.115,11.119,11.123,11.127,11.131,11.135,11.139,11.143,11.147,11.151,11.155,11.159,11.163,11.167,11.171,11.175,11.179,11.183,11.187,11.191,11.195,11.199,11.203,11.207,11.211,11.215,11.219,11.223,11.227,11.231,11.235,11.239,11.243,11.247,11.251,11.255,11.259,11.263,11.267,11.271,11.275,11.279,11.283,11.287,11.291,11.295,11.299,11.303,11.307,11.311,11.315,11.319,11.323,11.327,11.331,11.335,11.339,11.343,11.347,11.351,11.355,11.359,11.363,11.367,11.371,11.375,11.379,11.382,11.386,11.39,11.394,11.398,11.402,11.406,11.41,11.414,11.418,11.422,11.426,11.43,11.434,11.438,11.442,11.446,11.45,11.454,11.458,11.462,11.466,11.47,11.473,11.477,11.481,11.485,11.489,11.493,11.497,11.501,11.505,11.509,11.513,11.517,11.521,11.525,11.529,11.533,11.537,11.54,11.544,11.548,11.552,11.556,11.56,11.564,11.568,11.572,11.576,11.58,11.584,11.588,11.592,11.595,11.599,11.603,11.607,11.611,11.615,11.619,11.623,11.627,11.631,11.635,11.639,11.642,11.646,11.65,11.654,11.658,11.662,11.666,11.67,11.674,11.678,11.681,11.685,11.689,11.693,11.697,11.701,11.705,11.709,11.713,11.717,11.72,11.724,11.728,11.732,11.736,11.74],[9.871,9.875,9.879,9.883,9.887,9.891,9.895,9.899,9.904,9.908,9.912,9.916,9.92,9.924,9.928,9.932,9.936,9.94,9.944,9.948,9.952,9.956,9.96,9.964,9.969,9.973,9.977,9.981,9.985,9.989,9.993,9.997,10.001,10.005,10.009,10.013,10.017,10.021,10.025,10.029,10.033,10.037,10.041,10.045,10.049,10.053,10.057,10.061,10.065,10.069,10.073,10.077,10.082,10.086,10.09,10.094,10.098,10.102,10.106,10.11,10.114,10.118,10.122,10.126,10.13,10.134,10.138,10.142,10.146,10.15,10.154,10.158,10.162,10.166,10.17,10.174,10.178,10.182,10.186,10.19,10.194,10.198,10.202,10.205,10.209,10.213,10.217,10.221,10.225,10.229,10.233,10.237,10.241,10.245,10.249,10.253,10.257,10.261,10.265,10.269,10.273,10.277,10.281,10.285,10.289,10.293,10.297,10.301,10.305,10.309,10.312,10.316,10.32,10.324,10.328,10.332,10.336,10.34,10.344,10.348,10.352,10.356,10.36,10.364,10.368,10.371,10.375,10.379,10.383,10.387,10.391,10.395,10.399,10.403,10.407,10.411,10.415,10.418,10.422,10.426,10.43,10.434,10.438,10.442,10.446,10.45,10.454,10.457,10.461,10.465,10.469,10.473,10.477,10.481,10.485,10.489,10.492,10.496,10.5,10.504,10.508,10.512,10.516,10.52,10.523,10.527,10.531,10.535,10.539,10.543,10.547,10.551,10.554,10.558,10.562,10.566,10.57,10.574,10.578,10.581,10.585,10.589,10.593,10.597,10.601,10.604,10.608,10.612,10.616,10.62,10.624,10.627,10.631,10.635,10.639,10.643,10.647,10.65,10.654,10.658,10.662,10.666,10.67,10.673,10.677,10.681,10.685,10.689,10.692,10.696,10.7,10.704,10.708,10.711,10.715,10.719,10.723,10.727,10.73,10.734,10.738,10.742,10.746,10.749,10.753,10.757,10.761,10.765,10.768,10.772,10.776,10.78,10.783,10.787,10.791,10.795,10.799,10.802,10.806,10.81,10.814,10.817,10.821,10.825,10.829,10.832,10.836,10.84,10.844,10.847,10.851,10.855,10.859,10.862,10.866,10.87,10.874,10.877,10.881,10.885,10.889,10.892,10.896,10.9,10.904,10.907,10.911,10.915,10.919,10.922,10.926,10.93,10.933,10.937,10.941,10.945,10.948,10.952,10.956,10.959,10.963,10.967,10.971,10.974,10.978,10.982,10.985,10.989,10.993,10.997,11,11.004,11.008,11.011,11.015,11.019,11.022,11.026,11.03,11.033,11.037],[11.2,11.205,11.209,11.213,11.217,11.221,11.225,11.23,11.234,11.238,11.242,11.246,11.25,11.255,11.259,11.263,11.267,11.271,11.275,11.28,11.284,11.288,11.292,11.296,11.3,11.305,11.309,11.313,11.317,11.321,11.326,11.33,11.334,11.338,11.342,11.346,11.351,11.355,11.359,11.363,11.367,11.371,11.376,11.38,11.384,11.388,11.392,11.396,11.401,11.405,11.409,11.413,11.417,11.421,11.426,11.43,11.434,11.438,11.442,11.446,11.451,11.455,11.459,11.463,11.467,11.471,11.476,11.48,11.484,11.488,11.492,11.496,11.501,11.505,11.509,11.513,11.517,11.521,11.526,11.53,11.534,11.538,11.542,11.546,11.55,11.555,11.559,11.563,11.567,11.571,11.575,11.58,11.584,11.588,11.592,11.596,11.6,11.605,11.609,11.613,11.617,11.621,11.625,11.63,11.634,11.638,11.642,11.646,11.65,11.654,11.659,11.663,11.667,11.671,11.675,11.679,11.684,11.688,11.692,11.696,11.7,11.704,11.708,11.713,11.717,11.721,11.725,11.729,11.733,11.738,11.742,11.746,11.75,11.754,11.758,11.762,11.767,11.771,11.775,11.779,11.783,11.787,11.792,11.796,11.8,11.804,11.808,11.812,11.816,11.821,11.825,11.829,11.833,11.837,11.841,11.845,11.85,11.854,11.858,11.862,11.866,11.87,11.874,11.879,11.883,11.887,11.891,11.895,11.899,11.903,11.908,11.912,11.916,11.92,11.924,11.928,11.932,11.937,11.941,11.945,11.949,11.953,11.957,11.961,11.965,11.97,11.974,11.978,11.982,11.986,11.99,11.994,11.999,12.003,12.007,12.011,12.015,12.019,12.023,12.027,12.032,12.036,12.04,12.044,12.048,12.052,12.056,12.06,12.065,12.069,12.073,12.077,12.081,12.085,12.089,12.093,12.098,12.102,12.106,12.11,12.114,12.118,12.122,12.126,12.131,12.135,12.139,12.143,12.147,12.151,12.155,12.159,12.164,12.168,12.172,12.176,12.18,12.184,12.188,12.192,12.196,12.201,12.205,12.209,12.213,12.217,12.221,12.225,12.229,12.233,12.238,12.242,12.246,12.25,12.254,12.258,12.262,12.266,12.27,12.275,12.279,12.283,12.287,12.291,12.295,12.299,12.303,12.307,12.311,12.316,12.32,12.324,12.328,12.332,12.336,12.34,12.344,12.348,12.352,12.357,12.361,12.365,12.369,12.373,12.377,12.381,12.385,12.389,12.393,12.398,12.402,12.406,12.41,12.414,12.418,12.422,12.426,12.43,12.434,12.438,12.443]]},"sim_provavel":{"betoneira|1":[[10.536,10.54,10.544,10.548,10.552,10.556,10.56,10.564,10.568,10.572,10.576,10.58,10.584,10.588,10.593,10.597,10.601,10.605,10.609,10.613,10.617,10.621,10.625,10.629,10.633,10.637,10.641,10.645,10.649,10.653,10.658,10.662,10.666,10.67,10.674,10.678,10.682,10.686,10.69,10.694,10.698,10.702,10.706,10.71,10.714,10.718,10.722,10.726,10.731,10.735,10.739,10.743,10.747,10.751,10.755,10.759,10.763,10.767,10.771,10.775,10.779,10.783,10.787,10.791,10.795,10.799,10.804,10.808,10.812,10.816,10.82,10.824,10.828,10.832,10.836,10.84,10.844,10.848,10.852,10.856,10.86,10.864,10.868,10.872,10.876,10.88,10.884,10.889,10.893,10.897,10.901,10.905,10.909,10.913,10.917,10.921,10.925,10.929,10.933,10.937,10.941,10.945,10.949,10.953,10.957,10.961,10.965,10.969,10.973,10.977,10.981,10.986,10.99,10.994,10.998,11.002,11.006,11.01,11.014,11.018,11.022,11.026,11.03,11.034,11.038,11.042,11.046,11.05,11.054,11.058,11.062,11.066,11.07,11.074,11.078,11.082,11.086,11.09,11.094,11.098,11.102,11.107,11.111,11.115,11.119,11.123,11.127,11.131,11.135,11.139,11.143,11.147,11.151,11.155,11.159,11.163,11.167,11.171,11.175,11.179,11.183,11.187,11.191,11.195,11.199,11.203,11.207,11.211,11.215,11.219,11.223,11.227,11.231,11.235,11.239,11.243,11.247,11.251,11.255,11.259,11.263,11.267,11.271,11.275,11.279,11.283,11.287,11.292,11.296,11.3,11.304,11.308,11.312,11.316,11.32,11.324,11.328,11.332,11.336,11.34,11.344,11.348,11.352,11.356,11.36,11.364,11.368,11.372,11.376,11.38,11.384,11.388,11.392,11.396,11.4,11.404,11.408,11.412,11.416,11.42,11.424,11.428,11.432,11.436,11.44,11.444,11.448,11.452,11.456,11.46,11.464,11.468,11.472,11.476,11.48,11.484,11.488,11.492,11.496,11.5,11.504,11.508,11.512,11.516,11.52,11.524,11.528,11.532,11.536,11.54,11.544,11.548,11.552,11.556,11.56,11.564,11.568,11.572,11.576,11.58,11.584,11.588,11.592,11.596,11.6,11.604,11.608,11.612,11.615,11.619,11.623,11.627,11.631,11.635,11.639,11.643,11.647,11.651,11.655,11.659,11.663,11.667,11.671,11.675,11.679,11.683,11.687,11.691,11.695,11.699,11.703,11.707,11.711,11.715,11.719,11.723,11.727,11.731,11.735,11.739,11.743],[9.871,9.875,9.879,9.883,9.887,9.891,9.895,9.899,9.903,9.907,9.912,9.916,9.92,9.924,9.928,9.932,9.936,9.94,9.944,9.948,9.952,9.956,9.96,9.964,9.968,9.972,9.976,9.981,9.985,9.989,9.993,9.997,10.001,10.005,10.009,10.013,10.017,10.021,10.025,10.029,10.033,10.037,10.041,10.045,10.049,10.053,10.057,10.062,10.066,10.07,10.074,10.078,10.082,10.086,10.09,10.094,10.098,10.102,10.106,10.11,10.114,10.118,10.122,10.126,10.13,10.134,10.138,10.142,10.146,10.15,10.154,10.158,10.162,10.166,10.171,10.175,10.179,10.183,10.187,10.191,10.195,10.199,10.203,10.207,10.211,10.215,10.219,10.223,10.227,10.231,10.235,10.239,10.243,10.247,10.251,10.255,10.259,10.263,10.267,10.271,10.275,10.279,10.283,10.287,10.291,10.295,10.299,10.303,10.307,10.311,10.315,10.319,10.323,10.327,10.331,10.335,10.339,10.343,10.347,10.351,10.355,10.359,10.363,10.367,10.371,10.375,10.379,10.383,10.387,10.391,10.395,10.399,10.403,10.407,10.411,10.415,10.419,10.423,10.427,10.431,10.435,10.439,10.443,10.447,10.451,10.455,10.459,10.463,10.467,10.471,10.475,10.479,10.483,10.487,10.491,10.495,10.499,10.503,10.507,10.511,10.515,10.519,10.523,10.527,10.531,10.535,10.539,10.543,10.547,10.551,10.555,10.559,10.563,10.567,10.571,10.575,10.579,10.583,10.587,10.591,10.595,10.599,10.603,10.607,10.611,10.615,10.619,10.623,10.627,10.631,10.635,10.638,10.642,10.646,10.65,10.654,10.658,10.662,10.666,10.67,10.674,10.678,10.682,10.686,10.69,10.694,10.698,10.702,10.706,10.71,10.714,10.718,10.722,10.726,10.73,10.734,10.737,10.741,10.745,10.749,10.753,10.757,10.761,10.765,10.769,10.773,10.777,10.781,10.785,10.789,10.793,10.797,10.801,10.805,10.809,10.812,10.816,10.82,10.824,10.828,10.832,10.836,10.84,10.844,10.848,10.852,10.856,10.86,10.864,10.868,10.872,10.875,10.879,10.883,10.887,10.891,10.895,10.899,10.903,10.907,10.911,10.915,10.919,10.923,10.927,10.93,10.934,10.938,10.942,10.946,10.95,10.954,10.958,10.962,10.966,10.97,10.974,10.978,10.981,10.985,10.989,10.993,10.997,11.001,11.005,11.009,11.013,11.017,11.021,11.024,11.028,11.032,11.036,11.04,11.044,11.048,11.052,11.056,11.06,11.064,11.067],[11.2,11.204,11.209,11.213,11.217,11.221,11.225,11.229,11.233,11.237,11.241,11.245,11.249,11.253,11.257,11.261,11.265,11.269,11.274,11.278,11.282,11.286,11.29,11.294,11.298,11.302,11.306,11.31,11.314,11.318,11.322,11.326,11.33,11.335,11.339,11.343,11.347,11.351,11.355,11.359,11.363,11.367,11.371,11.375,11.379,11.383,11.387,11.391,11.396,11.4,11.404,11.408,11.412,11.416,11.42,11.424,11.428,11.432,11.436,11.44,11.444,11.448,11.452,11.457,11.461,11.465,11.469,11.473,11.477,11.481,11.485,11.489,11.493,11.497,11.501,11.505,11.509,11.513,11.518,11.522,11.526,11.53,11.534,11.538,11.542,11.546,11.55,11.554,11.558,11.562,11.566,11.57,11.574,11.579,11.583,11.587,11.591,11.595,11.599,11.603,11.607,11.611,11.615,11.619,11.623,11.627,11.631,11.635,11.64,11.644,11.648,11.652,11.656,11.66,11.664,11.668,11.672,11.676,11.68,11.684,11.688,11.692,11.696,11.7,11.705,11.709,11.713,11.717,11.721,11.725,11.729,11.733,11.737,11.741,11.745,11.749,11.753,11.757,11.761,11.765,11.77,11.774,11.778,11.782,11.786,11.79,11.794,11.798,11.802,11.806,11.81,11.814,11.818,11.822,11.826,11.83,11.835,11.839,11.843,11.847,11.851,11.855,11.859,11.863,11.867,11.871,11.875,11.879,11.883,11.887,11.891,11.895,11.9,11.904,11.908,11.912,11.916,11.92,11.924,11.928,11.932,11.936,11.94,11.944,11.948,11.952,11.956,11.96,11.964,11.969,11.973,11.977,11.981,11.985,11.989,11.993,11.997,12.001,12.005,12.009,12.013,12.017,12.021,12.025,12.029,12.033,12.037,12.042,12.046,12.05,12.054,12.058,12.062,12.066,12.07,12.074,12.078,12.082,12.086,12.09,12.094,12.098,12.102,12.106,12.11,12.115,12.119,12.123,12.127,12.131,12.135,12.139,12.143,12.147,12.151,12.155,12.159,12.163,12.167,12.171,12.175,12.179,12.183,12.187,12.192,12.196,12.2,12.204,12.208,12.212,12.216,12.22,12.224,12.228,12.232,12.236,12.24,12.244,12.248,12.252,12.256,12.26,12.264,12.269,12.273,12.277,12.281,12.285,12.289,12.293,12.297,12.301,12.305,12.309,12.313,12.317,12.321,12.325,12.329,12.333,12.337,12.341,12.345,12.349,12.354,12.358,12.362,12.366,12.37,12.374,12.378,12.382,12.386,12.39,12.394,12.398,12.402,12.406,12.41,12.414,12.418]],"betoneira|1.5":[[10.536,10.542,10.548,10.554,10.56,10.566,10.572,10.578,10.584,10.591,10.597,10.603,10.609,10.615,10.621,10.627,10.633,10.639,10.645,10.651,10.658,10.664,10.67,10.676,10.682,10.688,10.694,10.7,10.706,10.712,10.718,10.724,10.731,10.737,10.743,10.749,10.755,10.761,10.767,10.773,10.779,10.785,10.791,10.797,10.804,10.81,10.816,10.822,10.828,10.834,10.84,10.846,10.852,10.858,10.864,10.87,10.876,10.882,10.889,10.895,10.901,10.907,10.913,10.919,10.925,10.931,10.937,10.943,10.949,10.955,10.961,10.967,10.973,10.979,10.986,10.992,10.998,11.004,11.01,11.016,11.022,11.028,11.034,11.04,11.046,11.052,11.058,11.064,11.07,11.076,11.082,11.088,11.094,11.1,11.107,11.113,11.119,11.125,11.131,11.137,11.143,11.149,11.155,11.161,11.167,11.173,11.179,11.185,11.191,11.197,11.203,11.209,11.215,11.221,11.227,11.233,11.239,11.245,11.251,11.257,11.263,11.269,11.275,11.281,11.287,11.294,11.3,11.306,11.312,11.318,11.324,11.33,11.336,11.342,11.348,11.354,11.36,11.366,11.372,11.378,11.384,11.39,11.396,11.402,11.408,11.414,11.42,11.426,11.432,11.438,11.444,11.45,11.456,11.462,11.468,11.474,11.48,11.486,11.492,11.498,11.504,11.51,11.516,11.522,11.528,11.534,11.54,11.546,11.552,11.558,11.564,11.57,11.576,11.582,11.588,11.594,11.6,11.606,11.612,11.617,11.623,11.629,11.635,11.641,11.647,11.653,11.659,11.665,11.671,11.677,11.683,11.689,11.695,11.701,11.707,11.713,11.719,11.725,11.731,11.737,11.743,11.749,11.755,11.761,11.767,11.773,11.779,11.785,11.79,11.796,11.802,11.808,11.814,11.82,11.826,11.832,11.838,11.844,11.85,11.856,11.862,11.868,11.874,11.88,11.886,11.892,11.897,11.903,11.909,11.915,11.921,11.927,11.933,11.939,11.945,11.951,11.957,11.963,11.969,11.975,11.981,11.986,11.992,11.998,12.004,12.01,12.016,12.022,12.028,12.034,12.04,12.046,12.052,12.057,12.063,12.069,12.075,12.081,12.087,12.093,12.099,12.105,12.111,12.117,12.122,12.128,12.134,12.14,12.146,12.152,12.158,12.164,12.17,12.176,12.181,12.187,12.193,12.199,12.205,12.211,12.217,12.223,12.229,12.234,12.24,12.246,12.252,12.258,12.264,12.27,12.276,12.282,12.287,12.293,12.299,12.305,12.311,12.317,12.323,12.329,12.334],[9.871,9.877,9.883,9.889,9.895,9.901,9.907,9.914,9.92,9.926,9.932,9.938,9.944,9.95,9.956,9.962,9.968,9.974,9.981,9.987,9.993,9.999,10.005,10.011,10.017,10.023,10.029,10.035,10.041,10.047,10.053,10.059,10.066,10.072,10.078,10.084,10.09,10.096,10.102,10.108,10.114,10.12,10.126,10.132,10.138,10.144,10.15,10.156,10.162,10.169,10.175,10.181,10.187,10.193,10.199,10.205,10.211,10.217,10.223,10.229,10.235,10.241,10.247,10.253,10.259,10.265,10.271,10.277,10.283,10.289,10.295,10.301,10.307,10.313,10.319,10.325,10.331,10.337,10.343,10.349,10.355,10.361,10.367,10.373,10.379,10.385,10.391,10.397,10.403,10.409,10.415,10.421,10.427,10.433,10.439,10.445,10.451,10.457,10.463,10.469,10.475,10.481,10.487,10.493,10.499,10.505,10.511,10.517,10.523,10.529,10.535,10.541,10.547,10.553,10.559,10.565,10.571,10.577,10.583,10.589,10.595,10.601,10.607,10.613,10.619,10.625,10.631,10.636,10.642,10.648,10.654,10.66,10.666,10.672,10.678,10.684,10.69,10.696,10.702,10.708,10.714,10.72,10.726,10.732,10.737,10.743,10.749,10.755,10.761,10.767,10.773,10.779,10.785,10.791,10.797,10.803,10.809,10.814,10.82,10.826,10.832,10.838,10.844,10.85,10.856,10.862,10.868,10.874,10.879,10.885,10.891,10.897,10.903,10.909,10.915,10.921,10.927,10.932,10.938,10.944,10.95,10.956,10.962,10.968,10.974,10.979,10.985,10.991,10.997,11.003,11.009,11.015,11.021,11.026,11.032,11.038,11.044,11.05,11.056,11.062,11.067,11.073,11.079,11.085,11.091,11.097,11.103,11.108,11.114,11.12,11.126,11.132,11.138,11.143,11.149,11.155,11.161,11.167,11.173,11.178,11.184,11.19,11.196,11.202,11.208,11.213,11.219,11.225,11.231,11.237,11.242,11.248,11.254,11.26,11.266,11.271,11.277,11.283,11.289,11.295,11.3,11.306,11.312,11.318,11.324,11.329,11.335,11.341,11.347,11.353,11.358,11.364,11.37,11.376,11.382,11.387,11.393,11.399,11.405,11.41,11.416,11.422,11.428,11.434,11.439,11.445,11.451,11.457,11.462,11.468,11.474,11.48,11.485,11.491,11.497,11.503,11.508,11.514,11.52,11.526,11.531,11.537,11.543,11.549,11.554,11.56,11.566,11.572,11.577,11.583,11.589,11.594,11.6,11.606,11.612,11.617,11.623,11.629,11.635,11.64,11.646],[11.2,11.206,11.213,11.219,11.225,11.231,11.237,11.243,11.249,11.255,11.261,11.267,11.274,11.28,11.286,11.292,11.298,11.304,11.31,11.316,11.322,11.328,11.335,11.341,11.347,11.353,11.359,11.365,11.371,11.377,11.383,11.389,11.396,11.402,11.408,11.414,11.42,11.426,11.432,11.438,11.444,11.45,11.457,11.463,11.469,11.475,11.481,11.487,11.493,11.499,11.505,11.511,11.518,11.524,11.53,11.536,11.542,11.548,11.554,11.56,11.566,11.572,11.579,11.585,11.591,11.597,11.603,11.609,11.615,11.621,11.627,11.633,11.64,11.646,11.652,11.658,11.664,11.67,11.676,11.682,11.688,11.694,11.7,11.707,11.713,11.719,11.725,11.731,11.737,11.743,11.749,11.755,11.761,11.768,11.774,11.78,11.786,11.792,11.798,11.804,11.81,11.816,11.822,11.828,11.835,11.841,11.847,11.853,11.859,11.865,11.871,11.877,11.883,11.889,11.895,11.902,11.908,11.914,11.92,11.926,11.932,11.938,11.944,11.95,11.956,11.962,11.969,11.975,11.981,11.987,11.993,11.999,12.005,12.011,12.017,12.023,12.029,12.035,12.042,12.048,12.054,12.06,12.066,12.072,12.078,12.084,12.09,12.096,12.102,12.108,12.115,12.121,12.127,12.133,12.139,12.145,12.151,12.157,12.163,12.169,12.175,12.181,12.187,12.194,12.2,12.206,12.212,12.218,12.224,12.23,12.236,12.242,12.248,12.254,12.26,12.266,12.273,12.279,12.285,12.291,12.297,12.303,12.309,12.315,12.321,12.327,12.333,12.339,12.345,12.351,12.358,12.364,12.37,12.376,12.382,12.388,12.394,12.4,12.406,12.412,12.418,12.424,12.43,12.436,12.442,12.449,12.455,12.461,12.467,12.473,12.479,12.485,12.491,12.497,12.503,12.509,12.515,12.521,12.527,12.533,12.539,12.546,12.552,12.558,12.564,12.57,12.576,12.582,12.588,12.594,12.6,12.606,12.612,12.618,12.624,12.63,12.636,12.642,12.648,12.654,12.661,12.667,12.673,12.679,12.685,12.691,12.697,12.703,12.709,12.715,12.721,12.727,12.733,12.739,12.745,12.751,12.757,12.763,12.769,12.775,12.781,12.787,12.794,12.8,12.806,12.812,12.818,12.824,12.83,12.836,12.842,12.848,12.854,12.86,12.866,12.872,12.878,12.884,12.89,12.896,12.902,12.908,12.914,12.92,12.926,12.932,12.938,12.944,12.95,12.956,12.963,12.969,12.975,12.981,12.987,12.993,12.999,13.005,13.011,13.017,13.023]],"betoneira|2.5":[[10.536,10.546,10.556,10.566,10.576,10.586,10.597,10.607,10.617,10.627,10.637,10.647,10.658,10.668,10.678,10.688,10.698,10.708,10.718,10.729,10.739,10.749,10.759,10.769,10.779,10.789,10.799,10.81,10.82,10.83,10.84,10.85,10.86,10.87,10.88,10.891,10.901,10.911,10.921,10.931,10.941,10.951,10.961,10.971,10.981,10.992,11.002,11.012,11.022,11.032,11.042,11.052,11.062,11.072,11.082,11.092,11.102,11.113,11.123,11.133,11.143,11.153,11.163,11.173,11.183,11.193,11.203,11.213,11.223,11.233,11.243,11.253,11.263,11.273,11.283,11.294,11.304,11.314,11.324,11.334,11.344,11.354,11.364,11.374,11.384,11.394,11.404,11.414,11.424,11.434,11.444,11.454,11.464,11.474,11.484,11.494,11.504,11.514,11.524,11.534,11.544,11.554,11.564,11.574,11.584,11.594,11.604,11.613,11.623,11.633,11.643,11.653,11.663,11.673,11.683,11.693,11.703,11.713,11.723,11.733,11.743,11.753,11.763,11.773,11.783,11.792,11.802,11.812,11.822,11.832,11.842,11.852,11.862,11.872,11.882,11.892,11.901,11.911,11.921,11.931,11.941,11.951,11.961,11.971,11.981,11.99,12,12.01,12.02,12.03,12.04,12.05,12.059,12.069,12.079,12.089,12.099,12.109,12.119,12.128,12.138,12.148,12.158,12.168,12.178,12.187,12.197,12.207,12.217,12.227,12.236,12.246,12.256,12.266,12.276,12.285,12.295,12.305,12.315,12.325,12.334,12.344,12.354,12.364,12.373,12.383,12.393,12.403,12.413,12.422,12.432,12.442,12.452,12.461,12.471,12.481,12.491,12.5,12.51,12.52,12.53,12.539,12.549,12.559,12.568,12.578,12.588,12.598,12.607,12.617,12.627,12.636,12.646,12.656,12.666,12.675,12.685,12.695,12.704,12.714,12.724,12.733,12.743,12.753,12.762,12.772,12.782,12.791,12.801,12.811,12.82,12.83,12.84,12.849,12.859,12.869,12.878,12.888,12.898,12.907,12.917,12.927,12.936,12.946,12.955,12.965,12.975,12.984,12.994,13.004,13.013,13.023,13.032,13.042,13.052,13.061,13.071,13.08,13.09,13.1,13.109,13.119,13.128,13.138,13.148,13.157,13.167,13.176,13.186,13.195,13.205,13.215,13.224,13.234,13.243,13.253,13.262,13.272,13.281,13.291,13.301,13.31,13.32,13.329,13.339,13.348,13.358,13.367,13.377,13.386,13.396,13.405,13.415,13.424,13.434,13.443,13.453,13.462,13.472,13.482,13.491],[9.871,9.881,9.891,9.901,9.912,9.922,9.932,9.942,9.952,9.962,9.972,9.983,9.993,10.003,10.013,10.023,10.033,10.043,10.053,10.064,10.074,10.084,10.094,10.104,10.114,10.124,10.134,10.144,10.154,10.164,10.175,10.185,10.195,10.205,10.215,10.225,10.235,10.245,10.255,10.265,10.275,10.285,10.295,10.305,10.315,10.325,10.335,10.345,10.355,10.365,10.375,10.385,10.395,10.405,10.415,10.425,10.435,10.445,10.455,10.465,10.475,10.485,10.495,10.505,10.515,10.525,10.535,10.545,10.555,10.565,10.575,10.585,10.595,10.605,10.615,10.625,10.635,10.644,10.654,10.664,10.674,10.684,10.694,10.704,10.714,10.724,10.734,10.743,10.753,10.763,10.773,10.783,10.793,10.803,10.812,10.822,10.832,10.842,10.852,10.862,10.872,10.881,10.891,10.901,10.911,10.921,10.93,10.94,10.95,10.96,10.97,10.979,10.989,10.999,11.009,11.019,11.028,11.038,11.048,11.058,11.067,11.077,11.087,11.097,11.106,11.116,11.126,11.136,11.145,11.155,11.165,11.175,11.184,11.194,11.204,11.213,11.223,11.233,11.242,11.252,11.262,11.271,11.281,11.291,11.3,11.31,11.32,11.329,11.339,11.349,11.358,11.368,11.378,11.387,11.397,11.407,11.416,11.426,11.435,11.445,11.455,11.464,11.474,11.483,11.493,11.503,11.512,11.522,11.531,11.541,11.55,11.56,11.57,11.579,11.589,11.598,11.608,11.617,11.627,11.636,11.646,11.655,11.665,11.675,11.684,11.694,11.703,11.713,11.722,11.732,11.741,11.751,11.76,11.769,11.779,11.788,11.798,11.807,11.817,11.826,11.836,11.845,11.855,11.864,11.874,11.883,11.892,11.902,11.911,11.921,11.93,11.939,11.949,11.958,11.968,11.977,11.986,11.996,12.005,12.015,12.024,12.033,12.043,12.052,12.061,12.071,12.08,12.09,12.099,12.108,12.118,12.127,12.136,12.146,12.155,12.164,12.174,12.183,12.192,12.202,12.211,12.22,12.229,12.239,12.248,12.257,12.267,12.276,12.285,12.294,12.304,12.313,12.322,12.331,12.341,12.35,12.359,12.368,12.378,12.387,12.396,12.405,12.415,12.424,12.433,12.442,12.452,12.461,12.47,12.479,12.488,12.498,12.507,12.516,12.525,12.534,12.544,12.553,12.562,12.571,12.58,12.589,12.599,12.608,12.617,12.626,12.635,12.644,12.653,12.663,12.672,12.681,12.69,12.699,12.708,12.717,12.727,12.736,12.745,12.754,12.763],[11.2,11.211,11.221,11.231,11.241,11.251,11.261,11.272,11.282,11.292,11.302,11.312,11.322,11.333,11.343,11.353,11.363,11.373,11.383,11.394,11.404,11.414,11.424,11.434,11.444,11.455,11.465,11.475,11.485,11.495,11.505,11.516,11.526,11.536,11.546,11.556,11.566,11.577,11.587,11.597,11.607,11.617,11.627,11.637,11.648,11.658,11.668,11.678,11.688,11.698,11.709,11.719,11.729,11.739,11.749,11.759,11.77,11.78,11.79,11.8,11.81,11.82,11.83,11.841,11.851,11.861,11.871,11.881,11.891,11.902,11.912,11.922,11.932,11.942,11.952,11.962,11.973,11.983,11.993,12.003,12.013,12.023,12.033,12.044,12.054,12.064,12.074,12.084,12.094,12.104,12.115,12.125,12.135,12.145,12.155,12.165,12.175,12.185,12.196,12.206,12.216,12.226,12.236,12.246,12.256,12.266,12.277,12.287,12.297,12.307,12.317,12.327,12.337,12.347,12.358,12.368,12.378,12.388,12.398,12.408,12.418,12.428,12.438,12.449,12.459,12.469,12.479,12.489,12.499,12.509,12.519,12.529,12.539,12.55,12.56,12.57,12.58,12.59,12.6,12.61,12.62,12.63,12.64,12.65,12.661,12.671,12.681,12.691,12.701,12.711,12.721,12.731,12.741,12.751,12.761,12.771,12.781,12.792,12.802,12.812,12.822,12.832,12.842,12.852,12.862,12.872,12.882,12.892,12.902,12.912,12.922,12.932,12.942,12.952,12.963,12.973,12.983,12.993,13.003,13.013,13.023,13.033,13.043,13.053,13.063,13.073,13.083,13.093,13.103,13.113,13.123,13.133,13.143,13.153,13.163,13.173,13.183,13.193,13.203,13.213,13.223,13.233,13.243,13.253,13.263,13.273,13.283,13.293,13.303,13.313,13.323,13.333,13.343,13.353,13.363,13.373,13.383,13.393,13.403,13.413,13.423,13.433,13.443,13.453,13.463,13.473,13.483,13.493,13.503,13.513,13.523,13.533,13.543,13.553,13.563,13.573,13.583,13.593,13.603,13.613,13.623,13.633,13.643,13.653,13.663,13.673,13.683,13.693,13.703,13.713,13.723,13.733,13.743,13.753,13.762,13.772,13.782,13.792,13.802,13.812,13.822,13.832,13.842,13.852,13.862,13.872,13.882,13.892,13.902,13.912,13.922,13.931,13.941,13.951,13.961,13.971,13.981,13.991,14.001,14.011,14.021,14.031,14.041,14.051,14.061,14.07,14.08,14.09,14.1,14.11,14.12,14.13,14.14,14.15,14.16,14.17,14.179,14.189,14.199,14.209,14.219]],"truck_3e|1":[[10.536,10.538,10.541,10.544,10.547,10.55,10.553,10.556,10.558,10.561,10.564,10.567,10.57,10.573,10.575,10.578,10.581,10.584,10.587,10.59,10.593,10.595,10.598,10.601,10.604,10.607,10.61,10.612,10.615,10.618,10.621,10.624,10.627,10.63,10.632,10.635,10.638,10.641,10.644,10.647,10.649,10.652,10.655,10.658,10.661,10.664,10.666,10.669,10.672,10.675,10.678,10.681,10.683,10.686,10.689,10.692,10.695,10.698,10.701,10.703,10.706,10.709,10.712,10.715,10.718,10.72,10.723,10.726,10.729,10.732,10.735,10.737,10.74,10.743,10.746,10.749,10.752,10.754,10.757,10.76,10.763,10.766,10.769,10.771,10.774,10.777,10.78,10.783,10.786,10.789,10.791,10.794,10.797,10.8,10.803,10.806,10.808,10.811,10.814,10.817,10.82,10.823,10.825,10.828,10.831,10.834,10.837,10.84,10.842,10.845,10.848,10.851,10.854,10.857,10.859,10.862,10.865,10.868,10.871,10.874,10.876,10.879,10.882,10.885,10.888,10.891,10.893,10.896,10.899,10.902,10.905,10.908,10.91,10.913,10.916,10.919,10.922,10.924,10.927,10.93,10.933,10.936,10.939,10.941,10.944,10.947,10.95,10.953,10.956,10.958,10.961,10.964,10.967,10.97,10.973,10.975,10.978,10.981,10.984,10.987,10.99,10.992,10.995,10.998,11.001,11.004,11.006,11.009,11.012,11.015,11.018,11.021,11.023,11.026,11.029,11.032,11.035,11.038,11.04,11.043,11.046,11.049,11.052,11.055,11.057,11.06,11.063,11.066,11.069,11.071,11.074,11.077,11.08,11.083,11.086,11.088,11.091,11.094,11.097,11.1,11.102,11.105,11.108,11.111,11.114,11.117,11.119,11.122,11.125,11.128,11.131,11.133,11.136,11.139,11.142,11.145,11.148,11.15,11.153,11.156,11.159,11.162,11.164,11.167,11.17,11.173,11.176,11.179,11.181,11.184,11.187,11.19,11.193,11.195,11.198,11.201,11.204,11.207,11.21,11.212,11.215,11.218,11.221,11.224,11.226,11.229,11.232,11.235,11.238,11.24,11.243,11.246,11.249,11.252,11.255,11.257,11.26,11.263,11.266,11.269,11.271,11.274,11.277,11.28,11.283,11.285,11.288,11.291,11.294,11.297,11.3,11.302,11.305,11.308,11.311,11.314,11.316,11.319,11.322,11.325,11.328,11.33,11.333,11.336,11.339,11.342,11.344,11.347,11.35,11.353,11.356,11.358,11.361,11.364,11.367,11.37,11.373,11.375,11.378,11.381,11.384],[9.871,9.874,9.877,9.879,9.882,9.885,9.888,9.891,9.894,9.897,9.899,9.902,9.905,9.908,9.911,9.914,9.916,9.919,9.922,9.925,9.928,9.931,9.933,9.936,9.939,9.942,9.945,9.948,9.951,9.953,9.956,9.959,9.962,9.965,9.968,9.97,9.973,9.976,9.979,9.982,9.985,9.987,9.99,9.993,9.996,9.999,10.002,10.004,10.007,10.01,10.013,10.016,10.019,10.021,10.024,10.027,10.03,10.033,10.036,10.038,10.041,10.044,10.047,10.05,10.053,10.055,10.058,10.061,10.064,10.067,10.07,10.072,10.075,10.078,10.081,10.084,10.087,10.089,10.092,10.095,10.098,10.101,10.104,10.106,10.109,10.112,10.115,10.118,10.12,10.123,10.126,10.129,10.132,10.135,10.137,10.14,10.143,10.146,10.149,10.152,10.154,10.157,10.16,10.163,10.166,10.168,10.171,10.174,10.177,10.18,10.183,10.185,10.188,10.191,10.194,10.197,10.2,10.202,10.205,10.208,10.211,10.214,10.216,10.219,10.222,10.225,10.228,10.231,10.233,10.236,10.239,10.242,10.245,10.247,10.25,10.253,10.256,10.259,10.261,10.264,10.267,10.27,10.273,10.276,10.278,10.281,10.284,10.287,10.29,10.292,10.295,10.298,10.301,10.304,10.306,10.309,10.312,10.315,10.318,10.321,10.323,10.326,10.329,10.332,10.335,10.337,10.34,10.343,10.346,10.349,10.351,10.354,10.357,10.36,10.363,10.365,10.368,10.371,10.374,10.377,10.379,10.382,10.385,10.388,10.391,10.393,10.396,10.399,10.402,10.405,10.407,10.41,10.413,10.416,10.419,10.421,10.424,10.427,10.43,10.433,10.435,10.438,10.441,10.444,10.447,10.449,10.452,10.455,10.458,10.461,10.463,10.466,10.469,10.472,10.475,10.477,10.48,10.483,10.486,10.489,10.491,10.494,10.497,10.5,10.502,10.505,10.508,10.511,10.514,10.516,10.519,10.522,10.525,10.528,10.53,10.533,10.536,10.539,10.541,10.544,10.547,10.55,10.553,10.555,10.558,10.561,10.564,10.567,10.569,10.572,10.575,10.578,10.58,10.583,10.586,10.589,10.592,10.594,10.597,10.6,10.603,10.606,10.608,10.611,10.614,10.617,10.619,10.622,10.625,10.628,10.631,10.633,10.636,10.639,10.642,10.644,10.647,10.65,10.653,10.656,10.658,10.661,10.664,10.667,10.669,10.672,10.675,10.678,10.68,10.683,10.686,10.689,10.692,10.694,10.697,10.7,10.703,10.705,10.708,10.711,10.714],[11.2,11.203,11.206,11.209,11.212,11.215,11.217,11.22,11.223,11.226,11.229,11.232,11.235,11.237,11.24,11.243,11.246,11.249,11.252,11.254,11.257,11.26,11.263,11.266,11.269,11.272,11.274,11.277,11.28,11.283,11.286,11.289,11.291,11.294,11.297,11.3,11.303,11.306,11.309,11.311,11.314,11.317,11.32,11.323,11.326,11.328,11.331,11.334,11.337,11.34,11.343,11.346,11.348,11.351,11.354,11.357,11.36,11.363,11.365,11.368,11.371,11.374,11.377,11.38,11.383,11.385,11.388,11.391,11.394,11.397,11.4,11.402,11.405,11.408,11.411,11.414,11.417,11.42,11.422,11.425,11.428,11.431,11.434,11.437,11.439,11.442,11.445,11.448,11.451,11.454,11.457,11.459,11.462,11.465,11.468,11.471,11.474,11.476,11.479,11.482,11.485,11.488,11.491,11.494,11.496,11.499,11.502,11.505,11.508,11.511,11.513,11.516,11.519,11.522,11.525,11.528,11.531,11.533,11.536,11.539,11.542,11.545,11.548,11.55,11.553,11.556,11.559,11.562,11.565,11.568,11.57,11.573,11.576,11.579,11.582,11.585,11.587,11.59,11.593,11.596,11.599,11.602,11.605,11.607,11.61,11.613,11.616,11.619,11.622,11.624,11.627,11.63,11.633,11.636,11.639,11.642,11.644,11.647,11.65,11.653,11.656,11.659,11.661,11.664,11.667,11.67,11.673,11.676,11.679,11.681,11.684,11.687,11.69,11.693,11.696,11.698,11.701,11.704,11.707,11.71,11.713,11.716,11.718,11.721,11.724,11.727,11.73,11.733,11.735,11.738,11.741,11.744,11.747,11.75,11.752,11.755,11.758,11.761,11.764,11.767,11.77,11.772,11.775,11.778,11.781,11.784,11.787,11.789,11.792,11.795,11.798,11.801,11.804,11.807,11.809,11.812,11.815,11.818,11.821,11.824,11.826,11.829,11.832,11.835,11.838,11.841,11.843,11.846,11.849,11.852,11.855,11.858,11.861,11.863,11.866,11.869,11.872,11.875,11.878,11.88,11.883,11.886,11.889,11.892,11.895,11.897,11.9,11.903,11.906,11.909,11.912,11.915,11.917,11.92,11.923,11.926,11.929,11.932,11.934,11.937,11.94,11.943,11.946,11.949,11.951,11.954,11.957,11.96,11.963,11.966,11.969,11.971,11.974,11.977,11.98,11.983,11.986,11.988,11.991,11.994,11.997,12,12.003,12.005,12.008,12.011,12.014,12.017,12.02,12.022,12.025,12.028,12.031,12.034,12.037,12.04,12.042,12.045,12.048,12.051,12.054]],"truck_3e|1.5":[[10.536,10.54,10.544,10.548,10.553,10.557,10.561,10.566,10.57,10.574,10.578,10.583,10.587,10.591,10.595,10.6,10.604,10.608,10.612,10.617,10.621,10.625,10.63,10.634,10.638,10.642,10.647,10.651,10.655,10.659,10.664,10.668,10.672,10.676,10.681,10.685,10.689,10.693,10.698,10.702,10.706,10.71,10.715,10.719,10.723,10.728,10.732,10.736,10.74,10.745,10.749,10.753,10.757,10.762,10.766,10.77,10.774,10.779,10.783,10.787,10.791,10.796,10.8,10.804,10.808,10.813,10.817,10.821,10.825,10.83,10.834,10.838,10.842,10.847,10.851,10.855,10.859,10.864,10.868,10.872,10.876,10.881,10.885,10.889,10.893,10.898,10.902,10.906,10.91,10.915,10.919,10.923,10.927,10.932,10.936,10.94,10.944,10.949,10.953,10.957,10.961,10.966,10.97,10.974,10.978,10.982,10.987,10.991,10.995,10.999,11.004,11.008,11.012,11.016,11.021,11.025,11.029,11.033,11.038,11.042,11.046,11.05,11.055,11.059,11.063,11.067,11.071,11.076,11.08,11.084,11.088,11.093,11.097,11.101,11.105,11.11,11.114,11.118,11.122,11.126,11.131,11.135,11.139,11.143,11.148,11.152,11.156,11.16,11.164,11.169,11.173,11.177,11.181,11.186,11.19,11.194,11.198,11.203,11.207,11.211,11.215,11.219,11.224,11.228,11.232,11.236,11.24,11.245,11.249,11.253,11.257,11.262,11.266,11.27,11.274,11.278,11.283,11.287,11.291,11.295,11.3,11.304,11.308,11.312,11.316,11.321,11.325,11.329,11.333,11.337,11.342,11.346,11.35,11.354,11.358,11.363,11.367,11.371,11.375,11.38,11.384,11.388,11.392,11.396,11.401,11.405,11.409,11.413,11.417,11.422,11.426,11.43,11.434,11.438,11.443,11.447,11.451,11.455,11.459,11.464,11.468,11.472,11.476,11.48,11.485,11.489,11.493,11.497,11.501,11.506,11.51,11.514,11.518,11.522,11.527,11.531,11.535,11.539,11.543,11.547,11.552,11.556,11.56,11.564,11.568,11.573,11.577,11.581,11.585,11.589,11.594,11.598,11.602,11.606,11.61,11.614,11.619,11.623,11.627,11.631,11.635,11.64,11.644,11.648,11.652,11.656,11.66,11.665,11.669,11.673,11.677,11.681,11.686,11.69,11.694,11.698,11.702,11.706,11.711,11.715,11.719,11.723,11.727,11.731,11.736,11.74,11.744,11.748,11.752,11.757,11.761,11.765,11.769,11.773,11.777,11.782,11.786,11.79,11.794,11.798,11.802],[9.871,9.875,9.879,9.884,9.888,9.892,9.897,9.901,9.905,9.909,9.914,9.918,9.922,9.926,9.931,9.935,9.939,9.943,9.948,9.952,9.956,9.96,9.965,9.969,9.973,9.977,9.982,9.986,9.99,9.995,9.999,10.003,10.007,10.012,10.016,10.02,10.024,10.029,10.033,10.037,10.041,10.046,10.05,10.054,10.058,10.063,10.067,10.071,10.075,10.079,10.084,10.088,10.092,10.096,10.101,10.105,10.109,10.113,10.118,10.122,10.126,10.13,10.135,10.139,10.143,10.147,10.152,10.156,10.16,10.164,10.168,10.173,10.177,10.181,10.185,10.19,10.194,10.198,10.202,10.207,10.211,10.215,10.219,10.223,10.228,10.232,10.236,10.24,10.245,10.249,10.253,10.257,10.261,10.266,10.27,10.274,10.278,10.283,10.287,10.291,10.295,10.299,10.304,10.308,10.312,10.316,10.321,10.325,10.329,10.333,10.337,10.342,10.346,10.35,10.354,10.358,10.363,10.367,10.371,10.375,10.379,10.384,10.388,10.392,10.396,10.4,10.405,10.409,10.413,10.417,10.421,10.426,10.43,10.434,10.438,10.442,10.447,10.451,10.455,10.459,10.463,10.468,10.472,10.476,10.48,10.484,10.489,10.493,10.497,10.501,10.505,10.509,10.514,10.518,10.522,10.526,10.53,10.535,10.539,10.543,10.547,10.551,10.555,10.56,10.564,10.568,10.572,10.576,10.58,10.585,10.589,10.593,10.597,10.601,10.606,10.61,10.614,10.618,10.622,10.626,10.631,10.635,10.639,10.643,10.647,10.651,10.656,10.66,10.664,10.668,10.672,10.676,10.68,10.685,10.689,10.693,10.697,10.701,10.705,10.71,10.714,10.718,10.722,10.726,10.73,10.735,10.739,10.743,10.747,10.751,10.755,10.759,10.764,10.768,10.772,10.776,10.78,10.784,10.788,10.793,10.797,10.801,10.805,10.809,10.813,10.817,10.822,10.826,10.83,10.834,10.838,10.842,10.846,10.85,10.855,10.859,10.863,10.867,10.871,10.875,10.879,10.884,10.888,10.892,10.896,10.9,10.904,10.908,10.912,10.917,10.921,10.925,10.929,10.933,10.937,10.941,10.945,10.949,10.954,10.958,10.962,10.966,10.97,10.974,10.978,10.982,10.987,10.991,10.995,10.999,11.003,11.007,11.011,11.015,11.019,11.023,11.028,11.032,11.036,11.04,11.044,11.048,11.052,11.056,11.06,11.064,11.069,11.073,11.077,11.081,11.085,11.089,11.093,11.097,11.101,11.105,11.11,11.114,11.118,11.122,11.126],[11.2,11.205,11.209,11.213,11.217,11.222,11.226,11.23,11.235,11.239,11.243,11.247,11.252,11.256,11.26,11.264,11.269,11.273,11.277,11.281,11.286,11.29,11.294,11.299,11.303,11.307,11.311,11.316,11.32,11.324,11.328,11.333,11.337,11.341,11.346,11.35,11.354,11.358,11.363,11.367,11.371,11.375,11.38,11.384,11.388,11.393,11.397,11.401,11.405,11.41,11.414,11.418,11.422,11.427,11.431,11.435,11.439,11.444,11.448,11.452,11.457,11.461,11.465,11.469,11.474,11.478,11.482,11.486,11.491,11.495,11.499,11.504,11.508,11.512,11.516,11.521,11.525,11.529,11.533,11.538,11.542,11.546,11.55,11.555,11.559,11.563,11.568,11.572,11.576,11.58,11.585,11.589,11.593,11.597,11.602,11.606,11.61,11.615,11.619,11.623,11.627,11.632,11.636,11.64,11.644,11.649,11.653,11.657,11.661,11.666,11.67,11.674,11.679,11.683,11.687,11.691,11.696,11.7,11.704,11.708,11.713,11.717,11.721,11.725,11.73,11.734,11.738,11.743,11.747,11.751,11.755,11.76,11.764,11.768,11.772,11.777,11.781,11.785,11.789,11.794,11.798,11.802,11.807,11.811,11.815,11.819,11.824,11.828,11.832,11.836,11.841,11.845,11.849,11.853,11.858,11.862,11.866,11.87,11.875,11.879,11.883,11.888,11.892,11.896,11.9,11.905,11.909,11.913,11.917,11.922,11.926,11.93,11.934,11.939,11.943,11.947,11.951,11.956,11.96,11.964,11.969,11.973,11.977,11.981,11.986,11.99,11.994,11.998,12.003,12.007,12.011,12.015,12.02,12.024,12.028,12.032,12.037,12.041,12.045,12.049,12.054,12.058,12.062,12.066,12.071,12.075,12.079,12.084,12.088,12.092,12.096,12.101,12.105,12.109,12.113,12.118,12.122,12.126,12.13,12.135,12.139,12.143,12.147,12.152,12.156,12.16,12.164,12.169,12.173,12.177,12.181,12.186,12.19,12.194,12.198,12.203,12.207,12.211,12.215,12.22,12.224,12.228,12.232,12.237,12.241,12.245,12.249,12.254,12.258,12.262,12.266,12.271,12.275,12.279,12.283,12.288,12.292,12.296,12.3,12.305,12.309,12.313,12.317,12.322,12.326,12.33,12.334,12.339,12.343,12.347,12.351,12.356,12.36,12.364,12.368,12.373,12.377,12.381,12.385,12.39,12.394,12.398,12.402,12.407,12.411,12.415,12.419,12.424,12.428,12.432,12.436,12.441,12.445,12.449,12.453,12.458,12.462,12.466,12.47,12.475,12.479]],"truck_3e|2.5":[[10.536,10.543,10.55,10.557,10.564,10.571,10.578,10.585,10.593,10.6,10.607,10.614,10.621,10.628,10.635,10.642,10.649,10.657,10.664,10.671,10.678,10.685,10.692,10.699,10.706,10.713,10.72,10.728,10.735,10.742,10.749,10.756,10.763,10.77,10.777,10.784,10.791,10.798,10.806,10.813,10.82,10.827,10.834,10.841,10.848,10.855,10.862,10.869,10.876,10.883,10.891,10.898,10.905,10.912,10.919,10.926,10.933,10.94,10.947,10.954,10.961,10.968,10.975,10.982,10.99,10.997,11.004,11.011,11.018,11.025,11.032,11.039,11.046,11.053,11.06,11.067,11.074,11.081,11.088,11.095,11.102,11.11,11.117,11.124,11.131,11.138,11.145,11.152,11.159,11.166,11.173,11.18,11.187,11.194,11.201,11.208,11.215,11.222,11.229,11.236,11.243,11.25,11.257,11.264,11.271,11.278,11.285,11.292,11.3,11.307,11.314,11.321,11.328,11.335,11.342,11.349,11.356,11.363,11.37,11.377,11.384,11.391,11.398,11.405,11.412,11.419,11.426,11.433,11.44,11.447,11.454,11.461,11.468,11.475,11.482,11.489,11.496,11.503,11.51,11.517,11.524,11.531,11.538,11.545,11.552,11.559,11.566,11.573,11.58,11.587,11.594,11.601,11.608,11.614,11.621,11.628,11.635,11.642,11.649,11.656,11.663,11.67,11.677,11.684,11.691,11.698,11.705,11.712,11.719,11.726,11.733,11.74,11.747,11.754,11.761,11.768,11.775,11.782,11.788,11.795,11.802,11.809,11.816,11.823,11.83,11.837,11.844,11.851,11.858,11.865,11.872,11.879,11.886,11.893,11.899,11.906,11.913,11.92,11.927,11.934,11.941,11.948,11.955,11.962,11.969,11.976,11.982,11.989,11.996,12.003,12.01,12.017,12.024,12.031,12.038,12.045,12.052,12.058,12.065,12.072,12.079,12.086,12.093,12.1,12.107,12.114,12.12,12.127,12.134,12.141,12.148,12.155,12.162,12.169,12.176,12.182,12.189,12.196,12.203,12.21,12.217,12.224,12.231,12.237,12.244,12.251,12.258,12.265,12.272,12.279,12.285,12.292,12.299,12.306,12.313,12.32,12.327,12.333,12.34,12.347,12.354,12.361,12.368,12.374,12.381,12.388,12.395,12.402,12.409,12.415,12.422,12.429,12.436,12.443,12.45,12.456,12.463,12.47,12.477,12.484,12.491,12.497,12.504,12.511,12.518,12.525,12.531,12.538,12.545,12.552,12.559,12.566,12.572,12.579,12.586,12.593,12.6,12.606,12.613,12.62,12.627],[9.871,9.878,9.885,9.892,9.899,9.906,9.914,9.921,9.928,9.935,9.942,9.949,9.956,9.963,9.97,9.977,9.985,9.992,9.999,10.006,10.013,10.02,10.027,10.034,10.041,10.048,10.055,10.063,10.07,10.077,10.084,10.091,10.098,10.105,10.112,10.119,10.126,10.133,10.14,10.147,10.154,10.161,10.168,10.176,10.183,10.19,10.197,10.204,10.211,10.218,10.225,10.232,10.239,10.246,10.253,10.26,10.267,10.274,10.281,10.288,10.295,10.302,10.309,10.316,10.323,10.33,10.337,10.344,10.351,10.358,10.365,10.372,10.379,10.386,10.393,10.4,10.407,10.414,10.421,10.428,10.435,10.442,10.449,10.456,10.463,10.47,10.477,10.484,10.491,10.498,10.505,10.512,10.519,10.526,10.533,10.54,10.547,10.554,10.561,10.568,10.575,10.582,10.589,10.596,10.603,10.61,10.617,10.624,10.631,10.637,10.644,10.651,10.658,10.665,10.672,10.679,10.686,10.693,10.7,10.707,10.714,10.721,10.728,10.735,10.741,10.748,10.755,10.762,10.769,10.776,10.783,10.79,10.797,10.804,10.811,10.817,10.824,10.831,10.838,10.845,10.852,10.859,10.866,10.873,10.879,10.886,10.893,10.9,10.907,10.914,10.921,10.928,10.934,10.941,10.948,10.955,10.962,10.969,10.976,10.982,10.989,10.996,11.003,11.01,11.017,11.023,11.03,11.037,11.044,11.051,11.058,11.064,11.071,11.078,11.085,11.092,11.099,11.105,11.112,11.119,11.126,11.133,11.14,11.146,11.153,11.16,11.167,11.174,11.18,11.187,11.194,11.201,11.208,11.214,11.221,11.228,11.235,11.241,11.248,11.255,11.262,11.269,11.275,11.282,11.289,11.296,11.302,11.309,11.316,11.323,11.329,11.336,11.343,11.35,11.356,11.363,11.37,11.377,11.383,11.39,11.397,11.404,11.41,11.417,11.424,11.431,11.437,11.444,11.451,11.458,11.464,11.471,11.478,11.484,11.491,11.498,11.505,11.511,11.518,11.525,11.531,11.538,11.545,11.551,11.558,11.565,11.572,11.578,11.585,11.592,11.598,11.605,11.612,11.618,11.625,11.632,11.638,11.645,11.652,11.658,11.665,11.672,11.678,11.685,11.692,11.698,11.705,11.712,11.718,11.725,11.732,11.738,11.745,11.751,11.758,11.765,11.771,11.778,11.785,11.791,11.798,11.805,11.811,11.818,11.824,11.831,11.838,11.844,11.851,11.857,11.864,11.871,11.877,11.884,11.89,11.897,11.904,11.91,11.917,11.923,11.93],[11.2,11.207,11.215,11.222,11.229,11.236,11.243,11.25,11.257,11.264,11.272,11.279,11.286,11.293,11.3,11.307,11.314,11.321,11.328,11.336,11.343,11.35,11.357,11.364,11.371,11.378,11.385,11.393,11.4,11.407,11.414,11.421,11.428,11.435,11.442,11.449,11.457,11.464,11.471,11.478,11.485,11.492,11.499,11.506,11.513,11.521,11.528,11.535,11.542,11.549,11.556,11.563,11.57,11.578,11.585,11.592,11.599,11.606,11.613,11.62,11.627,11.634,11.642,11.649,11.656,11.663,11.67,11.677,11.684,11.691,11.698,11.706,11.713,11.72,11.727,11.734,11.741,11.748,11.755,11.762,11.77,11.777,11.784,11.791,11.798,11.805,11.812,11.819,11.826,11.834,11.841,11.848,11.855,11.862,11.869,11.876,11.883,11.89,11.897,11.905,11.912,11.919,11.926,11.933,11.94,11.947,11.954,11.961,11.969,11.976,11.983,11.99,11.997,12.004,12.011,12.018,12.025,12.032,12.04,12.047,12.054,12.061,12.068,12.075,12.082,12.089,12.096,12.103,12.11,12.118,12.125,12.132,12.139,12.146,12.153,12.16,12.167,12.174,12.181,12.189,12.196,12.203,12.21,12.217,12.224,12.231,12.238,12.245,12.252,12.259,12.266,12.274,12.281,12.288,12.295,12.302,12.309,12.316,12.323,12.33,12.337,12.344,12.351,12.359,12.366,12.373,12.38,12.387,12.394,12.401,12.408,12.415,12.422,12.429,12.436,12.443,12.451,12.458,12.465,12.472,12.479,12.486,12.493,12.5,12.507,12.514,12.521,12.528,12.535,12.542,12.55,12.557,12.564,12.571,12.578,12.585,12.592,12.599,12.606,12.613,12.62,12.627,12.634,12.641,12.648,12.655,12.663,12.67,12.677,12.684,12.691,12.698,12.705,12.712,12.719,12.726,12.733,12.74,12.747,12.754,12.761,12.768,12.775,12.782,12.789,12.797,12.804,12.811,12.818,12.825,12.832,12.839,12.846,12.853,12.86,12.867,12.874,12.881,12.888,12.895,12.902,12.909,12.916,12.923,12.93,12.937,12.944,12.951,12.958,12.966,12.973,12.98,12.987,12.994,13.001,13.008,13.015,13.022,13.029,13.036,13.043,13.05,13.057,13.064,13.071,13.078,13.085,13.092,13.099,13.106,13.113,13.12,13.127,13.134,13.141,13.148,13.155,13.162,13.169,13.176,13.183,13.19,13.197,13.204,13.211,13.218,13.225,13.232,13.239,13.246,13.253,13.26,13.267,13.274,13.281,13.288,13.295,13.302,13.309,13.316,13.323]],"carreta_4e|1":[[10.536,10.538,10.541,10.544,10.547,10.55,10.553,10.556,10.558,10.561,10.564,10.567,10.57,10.573,10.575,10.578,10.581,10.584,10.587,10.59,10.593,10.595,10.598,10.601,10.604,10.607,10.61,10.612,10.615,10.618,10.621,10.624,10.627,10.63,10.632,10.635,10.638,10.641,10.644,10.647,10.649,10.652,10.655,10.658,10.661,10.664,10.666,10.669,10.672,10.675,10.678,10.681,10.683,10.686,10.689,10.692,10.695,10.698,10.701,10.703,10.706,10.709,10.712,10.715,10.718,10.72,10.723,10.726,10.729,10.732,10.735,10.737,10.74,10.743,10.746,10.749,10.752,10.754,10.757,10.76,10.763,10.766,10.769,10.771,10.774,10.777,10.78,10.783,10.786,10.789,10.791,10.794,10.797,10.8,10.803,10.806,10.808,10.811,10.814,10.817,10.82,10.823,10.825,10.828,10.831,10.834,10.837,10.84,10.842,10.845,10.848,10.851,10.854,10.857,10.859,10.862,10.865,10.868,10.871,10.874,10.876,10.879,10.882,10.885,10.888,10.891,10.893,10.896,10.899,10.902,10.905,10.908,10.91,10.913,10.916,10.919,10.922,10.924,10.927,10.93,10.933,10.936,10.939,10.941,10.944,10.947,10.95,10.953,10.956,10.958,10.961,10.964,10.967,10.97,10.973,10.975,10.978,10.981,10.984,10.987,10.99,10.992,10.995,10.998,11.001,11.004,11.006,11.009,11.012,11.015,11.018,11.021,11.023,11.026,11.029,11.032,11.035,11.038,11.04,11.043,11.046,11.049,11.052,11.055,11.057,11.06,11.063,11.066,11.069,11.071,11.074,11.077,11.08,11.083,11.086,11.088,11.091,11.094,11.097,11.1,11.102,11.105,11.108,11.111,11.114,11.117,11.119,11.122,11.125,11.128,11.131,11.133,11.136,11.139,11.142,11.145,11.148,11.15,11.153,11.156,11.159,11.162,11.164,11.167,11.17,11.173,11.176,11.179,11.181,11.184,11.187,11.19,11.193,11.195,11.198,11.201,11.204,11.207,11.21,11.212,11.215,11.218,11.221,11.224,11.226,11.229,11.232,11.235,11.238,11.24,11.243,11.246,11.249,11.252,11.255,11.257,11.26,11.263,11.266,11.269,11.271,11.274,11.277,11.28,11.283,11.285,11.288,11.291,11.294,11.297,11.3,11.302,11.305,11.308,11.311,11.314,11.316,11.319,11.322,11.325,11.328,11.33,11.333,11.336,11.339,11.342,11.344,11.347,11.35,11.353,11.356,11.358,11.361,11.364,11.367,11.37,11.373,11.375,11.378,11.381,11.384],[9.871,9.874,9.877,9.879,9.882,9.885,9.888,9.891,9.894,9.897,9.899,9.902,9.905,9.908,9.911,9.914,9.916,9.919,9.922,9.925,9.928,9.931,9.933,9.936,9.939,9.942,9.945,9.948,9.951,9.953,9.956,9.959,9.962,9.965,9.968,9.97,9.973,9.976,9.979,9.982,9.985,9.987,9.99,9.993,9.996,9.999,10.002,10.004,10.007,10.01,10.013,10.016,10.019,10.021,10.024,10.027,10.03,10.033,10.036,10.038,10.041,10.044,10.047,10.05,10.053,10.055,10.058,10.061,10.064,10.067,10.07,10.072,10.075,10.078,10.081,10.084,10.087,10.089,10.092,10.095,10.098,10.101,10.104,10.106,10.109,10.112,10.115,10.118,10.12,10.123,10.126,10.129,10.132,10.135,10.137,10.14,10.143,10.146,10.149,10.152,10.154,10.157,10.16,10.163,10.166,10.168,10.171,10.174,10.177,10.18,10.183,10.185,10.188,10.191,10.194,10.197,10.2,10.202,10.205,10.208,10.211,10.214,10.216,10.219,10.222,10.225,10.228,10.231,10.233,10.236,10.239,10.242,10.245,10.247,10.25,10.253,10.256,10.259,10.261,10.264,10.267,10.27,10.273,10.276,10.278,10.281,10.284,10.287,10.29,10.292,10.295,10.298,10.301,10.304,10.306,10.309,10.312,10.315,10.318,10.321,10.323,10.326,10.329,10.332,10.335,10.337,10.34,10.343,10.346,10.349,10.351,10.354,10.357,10.36,10.363,10.365,10.368,10.371,10.374,10.377,10.379,10.382,10.385,10.388,10.391,10.393,10.396,10.399,10.402,10.405,10.407,10.41,10.413,10.416,10.419,10.421,10.424,10.427,10.43,10.433,10.435,10.438,10.441,10.444,10.447,10.449,10.452,10.455,10.458,10.461,10.463,10.466,10.469,10.472,10.475,10.477,10.48,10.483,10.486,10.489,10.491,10.494,10.497,10.5,10.502,10.505,10.508,10.511,10.514,10.516,10.519,10.522,10.525,10.528,10.53,10.533,10.536,10.539,10.541,10.544,10.547,10.55,10.553,10.555,10.558,10.561,10.564,10.567,10.569,10.572,10.575,10.578,10.58,10.583,10.586,10.589,10.592,10.594,10.597,10.6,10.603,10.606,10.608,10.611,10.614,10.617,10.619,10.622,10.625,10.628,10.631,10.633,10.636,10.639,10.642,10.644,10.647,10.65,10.653,10.656,10.658,10.661,10.664,10.667,10.669,10.672,10.675,10.678,10.68,10.683,10.686,10.689,10.692,10.694,10.697,10.7,10.703,10.705,10.708,10.711,10.714],[11.2,11.203,11.206,11.209,11.212,11.215,11.217,11.22,11.223,11.226,11.229,11.232,11.235,11.237,11.24,11.243,11.246,11.249,11.252,11.254,11.257,11.26,11.263,11.266,11.269,11.272,11.274,11.277,11.28,11.283,11.286,11.289,11.291,11.294,11.297,11.3,11.303,11.306,11.309,11.311,11.314,11.317,11.32,11.323,11.326,11.328,11.331,11.334,11.337,11.34,11.343,11.346,11.348,11.351,11.354,11.357,11.36,11.363,11.365,11.368,11.371,11.374,11.377,11.38,11.383,11.385,11.388,11.391,11.394,11.397,11.4,11.402,11.405,11.408,11.411,11.414,11.417,11.42,11.422,11.425,11.428,11.431,11.434,11.437,11.439,11.442,11.445,11.448,11.451,11.454,11.457,11.459,11.462,11.465,11.468,11.471,11.474,11.476,11.479,11.482,11.485,11.488,11.491,11.494,11.496,11.499,11.502,11.505,11.508,11.511,11.513,11.516,11.519,11.522,11.525,11.528,11.531,11.533,11.536,11.539,11.542,11.545,11.548,11.55,11.553,11.556,11.559,11.562,11.565,11.568,11.57,11.573,11.576,11.579,11.582,11.585,11.587,11.59,11.593,11.596,11.599,11.602,11.605,11.607,11.61,11.613,11.616,11.619,11.622,11.624,11.627,11.63,11.633,11.636,11.639,11.642,11.644,11.647,11.65,11.653,11.656,11.659,11.661,11.664,11.667,11.67,11.673,11.676,11.679,11.681,11.684,11.687,11.69,11.693,11.696,11.698,11.701,11.704,11.707,11.71,11.713,11.716,11.718,11.721,11.724,11.727,11.73,11.733,11.735,11.738,11.741,11.744,11.747,11.75,11.752,11.755,11.758,11.761,11.764,11.767,11.77,11.772,11.775,11.778,11.781,11.784,11.787,11.789,11.792,11.795,11.798,11.801,11.804,11.807,11.809,11.812,11.815,11.818,11.821,11.824,11.826,11.829,11.832,11.835,11.838,11.841,11.843,11.846,11.849,11.852,11.855,11.858,11.861,11.863,11.866,11.869,11.872,11.875,11.878,11.88,11.883,11.886,11.889,11.892,11.895,11.897,11.9,11.903,11.906,11.909,11.912,11.915,11.917,11.92,11.923,11.926,11.929,11.932,11.934,11.937,11.94,11.943,11.946,11.949,11.951,11.954,11.957,11.96,11.963,11.966,11.969,11.971,11.974,11.977,11.98,11.983,11.986,11.988,11.991,11.994,11.997,12,12.003,12.005,12.008,12.011,12.014,12.017,12.02,12.022,12.025,12.028,12.031,12.034,12.037,12.04,12.042,12.045,12.048,12.051,12.054]],"carreta_4e|1.5":[[10.536,10.54,10.544,10.548,10.553,10.557,10.561,10.566,10.57,10.574,10.578,10.583,10.587,10.591,10.595,10.6,10.604,10.608,10.612,10.617,10.621,10.625,10.63,10.634,10.638,10.642,10.647,10.651,10.655,10.659,10.664,10.668,10.672,10.676,10.681,10.685,10.689,10.693,10.698,10.702,10.706,10.71,10.715,10.719,10.723,10.728,10.732,10.736,10.74,10.745,10.749,10.753,10.757,10.762,10.766,10.77,10.774,10.779,10.783,10.787,10.791,10.796,10.8,10.804,10.808,10.813,10.817,10.821,10.825,10.83,10.834,10.838,10.842,10.847,10.851,10.855,10.859,10.864,10.868,10.872,10.876,10.881,10.885,10.889,10.893,10.898,10.902,10.906,10.91,10.915,10.919,10.923,10.927,10.932,10.936,10.94,10.944,10.949,10.953,10.957,10.961,10.966,10.97,10.974,10.978,10.982,10.987,10.991,10.995,10.999,11.004,11.008,11.012,11.016,11.021,11.025,11.029,11.033,11.038,11.042,11.046,11.05,11.055,11.059,11.063,11.067,11.071,11.076,11.08,11.084,11.088,11.093,11.097,11.101,11.105,11.11,11.114,11.118,11.122,11.126,11.131,11.135,11.139,11.143,11.148,11.152,11.156,11.16,11.164,11.169,11.173,11.177,11.181,11.186,11.19,11.194,11.198,11.203,11.207,11.211,11.215,11.219,11.224,11.228,11.232,11.236,11.24,11.245,11.249,11.253,11.257,11.262,11.266,11.27,11.274,11.278,11.283,11.287,11.291,11.295,11.3,11.304,11.308,11.312,11.316,11.321,11.325,11.329,11.333,11.337,11.342,11.346,11.35,11.354,11.358,11.363,11.367,11.371,11.375,11.38,11.384,11.388,11.392,11.396,11.401,11.405,11.409,11.413,11.417,11.422,11.426,11.43,11.434,11.438,11.443,11.447,11.451,11.455,11.459,11.464,11.468,11.472,11.476,11.48,11.485,11.489,11.493,11.497,11.501,11.506,11.51,11.514,11.518,11.522,11.527,11.531,11.535,11.539,11.543,11.547,11.552,11.556,11.56,11.564,11.568,11.573,11.577,11.581,11.585,11.589,11.594,11.598,11.602,11.606,11.61,11.614,11.619,11.623,11.627,11.631,11.635,11.64,11.644,11.648,11.652,11.656,11.66,11.665,11.669,11.673,11.677,11.681,11.686,11.69,11.694,11.698,11.702,11.706,11.711,11.715,11.719,11.723,11.727,11.731,11.736,11.74,11.744,11.748,11.752,11.757,11.761,11.765,11.769,11.773,11.777,11.782,11.786,11.79,11.794,11.798,11.802],[9.871,9.875,9.879,9.884,9.888,9.892,9.897,9.901,9.905,9.909,9.914,9.918,9.922,9.926,9.931,9.935,9.939,9.943,9.948,9.952,9.956,9.96,9.965,9.969,9.973,9.977,9.982,9.986,9.99,9.995,9.999,10.003,10.007,10.012,10.016,10.02,10.024,10.029,10.033,10.037,10.041,10.046,10.05,10.054,10.058,10.063,10.067,10.071,10.075,10.079,10.084,10.088,10.092,10.096,10.101,10.105,10.109,10.113,10.118,10.122,10.126,10.13,10.135,10.139,10.143,10.147,10.152,10.156,10.16,10.164,10.168,10.173,10.177,10.181,10.185,10.19,10.194,10.198,10.202,10.207,10.211,10.215,10.219,10.223,10.228,10.232,10.236,10.24,10.245,10.249,10.253,10.257,10.261,10.266,10.27,10.274,10.278,10.283,10.287,10.291,10.295,10.299,10.304,10.308,10.312,10.316,10.321,10.325,10.329,10.333,10.337,10.342,10.346,10.35,10.354,10.358,10.363,10.367,10.371,10.375,10.379,10.384,10.388,10.392,10.396,10.4,10.405,10.409,10.413,10.417,10.421,10.426,10.43,10.434,10.438,10.442,10.447,10.451,10.455,10.459,10.463,10.468,10.472,10.476,10.48,10.484,10.489,10.493,10.497,10.501,10.505,10.509,10.514,10.518,10.522,10.526,10.53,10.535,10.539,10.543,10.547,10.551,10.555,10.56,10.564,10.568,10.572,10.576,10.58,10.585,10.589,10.593,10.597,10.601,10.606,10.61,10.614,10.618,10.622,10.626,10.631,10.635,10.639,10.643,10.647,10.651,10.656,10.66,10.664,10.668,10.672,10.676,10.68,10.685,10.689,10.693,10.697,10.701,10.705,10.71,10.714,10.718,10.722,10.726,10.73,10.735,10.739,10.743,10.747,10.751,10.755,10.759,10.764,10.768,10.772,10.776,10.78,10.784,10.788,10.793,10.797,10.801,10.805,10.809,10.813,10.817,10.822,10.826,10.83,10.834,10.838,10.842,10.846,10.85,10.855,10.859,10.863,10.867,10.871,10.875,10.879,10.884,10.888,10.892,10.896,10.9,10.904,10.908,10.912,10.917,10.921,10.925,10.929,10.933,10.937,10.941,10.945,10.949,10.954,10.958,10.962,10.966,10.97,10.974,10.978,10.982,10.987,10.991,10.995,10.999,11.003,11.007,11.011,11.015,11.019,11.023,11.028,11.032,11.036,11.04,11.044,11.048,11.052,11.056,11.06,11.064,11.069,11.073,11.077,11.081,11.085,11.089,11.093,11.097,11.101,11.105,11.11,11.114,11.118,11.122,11.126],[11.2,11.205,11.209,11.213,11.217,11.222,11.226,11.23,11.235,11.239,11.243,11.247,11.252,11.256,11.26,11.264,11.269,11.273,11.277,11.281,11.286,11.29,11.294,11.299,11.303,11.307,11.311,11.316,11.32,11.324,11.328,11.333,11.337,11.341,11.346,11.35,11.354,11.358,11.363,11.367,11.371,11.375,11.38,11.384,11.388,11.393,11.397,11.401,11.405,11.41,11.414,11.418,11.422,11.427,11.431,11.435,11.439,11.444,11.448,11.452,11.457,11.461,11.465,11.469,11.474,11.478,11.482,11.486,11.491,11.495,11.499,11.504,11.508,11.512,11.516,11.521,11.525,11.529,11.533,11.538,11.542,11.546,11.55,11.555,11.559,11.563,11.568,11.572,11.576,11.58,11.585,11.589,11.593,11.597,11.602,11.606,11.61,11.615,11.619,11.623,11.627,11.632,11.636,11.64,11.644,11.649,11.653,11.657,11.661,11.666,11.67,11.674,11.679,11.683,11.687,11.691,11.696,11.7,11.704,11.708,11.713,11.717,11.721,11.725,11.73,11.734,11.738,11.743,11.747,11.751,11.755,11.76,11.764,11.768,11.772,11.777,11.781,11.785,11.789,11.794,11.798,11.802,11.807,11.811,11.815,11.819,11.824,11.828,11.832,11.836,11.841,11.845,11.849,11.853,11.858,11.862,11.866,11.87,11.875,11.879,11.883,11.888,11.892,11.896,11.9,11.905,11.909,11.913,11.917,11.922,11.926,11.93,11.934,11.939,11.943,11.947,11.951,11.956,11.96,11.964,11.969,11.973,11.977,11.981,11.986,11.99,11.994,11.998,12.003,12.007,12.011,12.015,12.02,12.024,12.028,12.032,12.037,12.041,12.045,12.049,12.054,12.058,12.062,12.066,12.071,12.075,12.079,12.084,12.088,12.092,12.096,12.101,12.105,12.109,12.113,12.118,12.122,12.126,12.13,12.135,12.139,12.143,12.147,12.152,12.156,12.16,12.164,12.169,12.173,12.177,12.181,12.186,12.19,12.194,12.198,12.203,12.207,12.211,12.215,12.22,12.224,12.228,12.232,12.237,12.241,12.245,12.249,12.254,12.258,12.262,12.266,12.271,12.275,12.279,12.283,12.288,12.292,12.296,12.3,12.305,12.309,12.313,12.317,12.322,12.326,12.33,12.334,12.339,12.343,12.347,12.351,12.356,12.36,12.364,12.368,12.373,12.377,12.381,12.385,12.39,12.394,12.398,12.402,12.407,12.411,12.415,12.419,12.424,12.428,12.432,12.436,12.441,12.445,12.449,12.453,12.458,12.462,12.466,12.47,12.475,12.479]],"carreta_4e|2.5":[[10.536,10.543,10.55,10.557,10.564,10.571,10.578,10.585,10.593,10.6,10.607,10.614,10.621,10.628,10.635,10.642,10.649,10.657,10.664,10.671,10.678,10.685,10.692,10.699,10.706,10.713,10.72,10.728,10.735,10.742,10.749,10.756,10.763,10.77,10.777,10.784,10.791,10.798,10.806,10.813,10.82,10.827,10.834,10.841,10.848,10.855,10.862,10.869,10.876,10.883,10.891,10.898,10.905,10.912,10.919,10.926,10.933,10.94,10.947,10.954,10.961,10.968,10.975,10.982,10.99,10.997,11.004,11.011,11.018,11.025,11.032,11.039,11.046,11.053,11.06,11.067,11.074,11.081,11.088,11.095,11.102,11.11,11.117,11.124,11.131,11.138,11.145,11.152,11.159,11.166,11.173,11.18,11.187,11.194,11.201,11.208,11.215,11.222,11.229,11.236,11.243,11.25,11.257,11.264,11.271,11.278,11.285,11.292,11.3,11.307,11.314,11.321,11.328,11.335,11.342,11.349,11.356,11.363,11.37,11.377,11.384,11.391,11.398,11.405,11.412,11.419,11.426,11.433,11.44,11.447,11.454,11.461,11.468,11.475,11.482,11.489,11.496,11.503,11.51,11.517,11.524,11.531,11.538,11.545,11.552,11.559,11.566,11.573,11.58,11.587,11.594,11.601,11.608,11.614,11.621,11.628,11.635,11.642,11.649,11.656,11.663,11.67,11.677,11.684,11.691,11.698,11.705,11.712,11.719,11.726,11.733,11.74,11.747,11.754,11.761,11.768,11.775,11.782,11.788,11.795,11.802,11.809,11.816,11.823,11.83,11.837,11.844,11.851,11.858,11.865,11.872,11.879,11.886,11.893,11.899,11.906,11.913,11.92,11.927,11.934,11.941,11.948,11.955,11.962,11.969,11.976,11.982,11.989,11.996,12.003,12.01,12.017,12.024,12.031,12.038,12.045,12.052,12.058,12.065,12.072,12.079,12.086,12.093,12.1,12.107,12.114,12.12,12.127,12.134,12.141,12.148,12.155,12.162,12.169,12.176,12.182,12.189,12.196,12.203,12.21,12.217,12.224,12.231,12.237,12.244,12.251,12.258,12.265,12.272,12.279,12.285,12.292,12.299,12.306,12.313,12.32,12.327,12.333,12.34,12.347,12.354,12.361,12.368,12.374,12.381,12.388,12.395,12.402,12.409,12.415,12.422,12.429,12.436,12.443,12.45,12.456,12.463,12.47,12.477,12.484,12.491,12.497,12.504,12.511,12.518,12.525,12.531,12.538,12.545,12.552,12.559,12.566,12.572,12.579,12.586,12.593,12.6,12.606,12.613,12.62,12.627],[9.871,9.878,9.885,9.892,9.899,9.906,9.914,9.921,9.928,9.935,9.942,9.949,9.956,9.963,9.97,9.977,9.985,9.992,9.999,10.006,10.013,10.02,10.027,10.034,10.041,10.048,10.055,10.063,10.07,10.077,10.084,10.091,10.098,10.105,10.112,10.119,10.126,10.133,10.14,10.147,10.154,10.161,10.168,10.176,10.183,10.19,10.197,10.204,10.211,10.218,10.225,10.232,10.239,10.246,10.253,10.26,10.267,10.274,10.281,10.288,10.295,10.302,10.309,10.316,10.323,10.33,10.337,10.344,10.351,10.358,10.365,10.372,10.379,10.386,10.393,10.4,10.407,10.414,10.421,10.428,10.435,10.442,10.449,10.456,10.463,10.47,10.477,10.484,10.491,10.498,10.505,10.512,10.519,10.526,10.533,10.54,10.547,10.554,10.561,10.568,10.575,10.582,10.589,10.596,10.603,10.61,10.617,10.624,10.631,10.637,10.644,10.651,10.658,10.665,10.672,10.679,10.686,10.693,10.7,10.707,10.714,10.721,10.728,10.735,10.741,10.748,10.755,10.762,10.769,10.776,10.783,10.79,10.797,10.804,10.811,10.817,10.824,10.831,10.838,10.845,10.852,10.859,10.866,10.873,10.879,10.886,10.893,10.9,10.907,10.914,10.921,10.928,10.934,10.941,10.948,10.955,10.962,10.969,10.976,10.982,10.989,10.996,11.003,11.01,11.017,11.023,11.03,11.037,11.044,11.051,11.058,11.064,11.071,11.078,11.085,11.092,11.099,11.105,11.112,11.119,11.126,11.133,11.14,11.146,11.153,11.16,11.167,11.174,11.18,11.187,11.194,11.201,11.208,11.214,11.221,11.228,11.235,11.241,11.248,11.255,11.262,11.269,11.275,11.282,11.289,11.296,11.302,11.309,11.316,11.323,11.329,11.336,11.343,11.35,11.356,11.363,11.37,11.377,11.383,11.39,11.397,11.404,11.41,11.417,11.424,11.431,11.437,11.444,11.451,11.458,11.464,11.471,11.478,11.484,11.491,11.498,11.505,11.511,11.518,11.525,11.531,11.538,11.545,11.551,11.558,11.565,11.572,11.578,11.585,11.592,11.598,11.605,11.612,11.618,11.625,11.632,11.638,11.645,11.652,11.658,11.665,11.672,11.678,11.685,11.692,11.698,11.705,11.712,11.718,11.725,11.732,11.738,11.745,11.751,11.758,11.765,11.771,11.778,11.785,11.791,11.798,11.805,11.811,11.818,11.824,11.831,11.838,11.844,11.851,11.857,11.864,11.871,11.877,11.884,11.89,11.897,11.904,11.91,11.917,11.923,11.93],[11.2,11.207,11.215,11.222,11.229,11.236,11.243,11.25,11.257,11.264,11.272,11.279,11.286,11.293,11.3,11.307,11.314,11.321,11.328,11.336,11.343,11.35,11.357,11.364,11.371,11.378,11.385,11.393,11.4,11.407,11.414,11.421,11.428,11.435,11.442,11.449,11.457,11.464,11.471,11.478,11.485,11.492,11.499,11.506,11.513,11.521,11.528,11.535,11.542,11.549,11.556,11.563,11.57,11.578,11.585,11.592,11.599,11.606,11.613,11.62,11.627,11.634,11.642,11.649,11.656,11.663,11.67,11.677,11.684,11.691,11.698,11.706,11.713,11.72,11.727,11.734,11.741,11.748,11.755,11.762,11.77,11.777,11.784,11.791,11.798,11.805,11.812,11.819,11.826,11.834,11.841,11.848,11.855,11.862,11.869,11.876,11.883,11.89,11.897,11.905,11.912,11.919,11.926,11.933,11.94,11.947,11.954,11.961,11.969,11.976,11.983,11.99,11.997,12.004,12.011,12.018,12.025,12.032,12.04,12.047,12.054,12.061,12.068,12.075,12.082,12.089,12.096,12.103,12.11,12.118,12.125,12.132,12.139,12.146,12.153,12.16,12.167,12.174,12.181,12.189,12.196,12.203,12.21,12.217,12.224,12.231,12.238,12.245,12.252,12.259,12.266,12.274,12.281,12.288,12.295,12.302,12.309,12.316,12.323,12.33,12.337,12.344,12.351,12.359,12.366,12.373,12.38,12.387,12.394,12.401,12.408,12.415,12.422,12.429,12.436,12.443,12.451,12.458,12.465,12.472,12.479,12.486,12.493,12.5,12.507,12.514,12.521,12.528,12.535,12.542,12.55,12.557,12.564,12.571,12.578,12.585,12.592,12.599,12.606,12.613,12.62,12.627,12.634,12.641,12.648,12.655,12.663,12.67,12.677,12.684,12.691,12.698,12.705,12.712,12.719,12.726,12.733,12.74,12.747,12.754,12.761,12.768,12.775,12.782,12.789,12.797,12.804,12.811,12.818,12.825,12.832,12.839,12.846,12.853,12.86,12.867,12.874,12.881,12.888,12.895,12.902,12.909,12.916,12.923,12.93,12.937,12.944,12.951,12.958,12.966,12.973,12.98,12.987,12.994,13.001,13.008,13.015,13.022,13.029,13.036,13.043,13.05,13.057,13.064,13.071,13.078,13.085,13.092,13.099,13.106,13.113,13.12,13.127,13.134,13.141,13.148,13.155,13.162,13.169,13.176,13.183,13.19,13.197,13.204,13.211,13.218,13.225,13.232,13.239,13.246,13.253,13.26,13.267,13.274,13.281,13.288,13.295,13.302,13.309,13.316,13.323]],"carreta_5e|1":[[10.536,10.538,10.541,10.543,10.545,10.548,10.55,10.553,10.555,10.558,10.56,10.562,10.565,10.567,10.57,10.572,10.575,10.577,10.58,10.582,10.584,10.587,10.589,10.592,10.594,10.597,10.599,10.601,10.604,10.606,10.609,10.611,10.614,10.616,10.619,10.621,10.623,10.626,10.628,10.631,10.633,10.636,10.638,10.64,10.643,10.645,10.648,10.65,10.653,10.655,10.658,10.66,10.662,10.665,10.667,10.67,10.672,10.675,10.677,10.679,10.682,10.684,10.687,10.689,10.692,10.694,10.696,10.699,10.701,10.704,10.706,10.709,10.711,10.714,10.716,10.718,10.721,10.723,10.726,10.728,10.731,10.733,10.735,10.738,10.74,10.743,10.745,10.748,10.75,10.752,10.755,10.757,10.76,10.762,10.765,10.767,10.769,10.772,10.774,10.777,10.779,10.782,10.784,10.786,10.789,10.791,10.794,10.796,10.799,10.801,10.804,10.806,10.808,10.811,10.813,10.816,10.818,10.821,10.823,10.825,10.828,10.83,10.833,10.835,10.838,10.84,10.842,10.845,10.847,10.85,10.852,10.855,10.857,10.859,10.862,10.864,10.867,10.869,10.872,10.874,10.876,10.879,10.881,10.884,10.886,10.889,10.891,10.893,10.896,10.898,10.901,10.903,10.905,10.908,10.91,10.913,10.915,10.918,10.92,10.922,10.925,10.927,10.93,10.932,10.935,10.937,10.939,10.942,10.944,10.947,10.949,10.952,10.954,10.956,10.959,10.961,10.964,10.966,10.969,10.971,10.973,10.976,10.978,10.981,10.983,10.985,10.988,10.99,10.993,10.995,10.998,11,11.002,11.005,11.007,11.01,11.012,11.015,11.017,11.019,11.022,11.024,11.027,11.029,11.032,11.034,11.036,11.039,11.041,11.044,11.046,11.048,11.051,11.053,11.056,11.058,11.061,11.063,11.065,11.068,11.07,11.073,11.075,11.077,11.08,11.082,11.085,11.087,11.09,11.092,11.094,11.097,11.099,11.102,11.104,11.106,11.109,11.111,11.114,11.116,11.119,11.121,11.123,11.126,11.128,11.131,11.133,11.135,11.138,11.14,11.143,11.145,11.148,11.15,11.152,11.155,11.157,11.16,11.162,11.164,11.167,11.169,11.172,11.174,11.177,11.179,11.181,11.184,11.186,11.189,11.191,11.193,11.196,11.198,11.201,11.203,11.206,11.208,11.21,11.213,11.215,11.218,11.22,11.222,11.225,11.227,11.23,11.232,11.234,11.237,11.239,11.242,11.244,11.247,11.249,11.251,11.254,11.256,11.259,11.261,11.263],[9.871,9.873,9.876,9.878,9.881,9.883,9.886,9.888,9.89,9.893,9.895,9.898,9.9,9.903,9.905,9.907,9.91,9.912,9.915,9.917,9.92,9.922,9.925,9.927,9.929,9.932,9.934,9.937,9.939,9.942,9.944,9.946,9.949,9.951,9.954,9.956,9.959,9.961,9.963,9.966,9.968,9.971,9.973,9.976,9.978,9.981,9.983,9.985,9.988,9.99,9.993,9.995,9.998,10,10.002,10.005,10.007,10.01,10.012,10.015,10.017,10.019,10.022,10.024,10.027,10.029,10.032,10.034,10.036,10.039,10.041,10.044,10.046,10.049,10.051,10.053,10.056,10.058,10.061,10.063,10.066,10.068,10.07,10.073,10.075,10.078,10.08,10.083,10.085,10.087,10.09,10.092,10.095,10.097,10.099,10.102,10.104,10.107,10.109,10.112,10.114,10.116,10.119,10.121,10.124,10.126,10.129,10.131,10.133,10.136,10.138,10.141,10.143,10.146,10.148,10.15,10.153,10.155,10.158,10.16,10.162,10.165,10.167,10.17,10.172,10.175,10.177,10.179,10.182,10.184,10.187,10.189,10.191,10.194,10.196,10.199,10.201,10.204,10.206,10.208,10.211,10.213,10.216,10.218,10.22,10.223,10.225,10.228,10.23,10.233,10.235,10.237,10.24,10.242,10.245,10.247,10.249,10.252,10.254,10.257,10.259,10.261,10.264,10.266,10.269,10.271,10.274,10.276,10.278,10.281,10.283,10.286,10.288,10.29,10.293,10.295,10.298,10.3,10.302,10.305,10.307,10.31,10.312,10.314,10.317,10.319,10.322,10.324,10.327,10.329,10.331,10.334,10.336,10.339,10.341,10.343,10.346,10.348,10.351,10.353,10.355,10.358,10.36,10.363,10.365,10.367,10.37,10.372,10.375,10.377,10.379,10.382,10.384,10.387,10.389,10.391,10.394,10.396,10.399,10.401,10.403,10.406,10.408,10.411,10.413,10.415,10.418,10.42,10.423,10.425,10.427,10.43,10.432,10.435,10.437,10.439,10.442,10.444,10.447,10.449,10.451,10.454,10.456,10.459,10.461,10.463,10.466,10.468,10.471,10.473,10.475,10.478,10.48,10.483,10.485,10.487,10.49,10.492,10.494,10.497,10.499,10.502,10.504,10.506,10.509,10.511,10.514,10.516,10.518,10.521,10.523,10.526,10.528,10.53,10.533,10.535,10.538,10.54,10.542,10.545,10.547,10.549,10.552,10.554,10.557,10.559,10.561,10.564,10.566,10.569,10.571,10.573,10.576,10.578,10.58,10.583,10.585,10.588,10.59,10.592,10.595],[11.2,11.203,11.205,11.208,11.21,11.213,11.215,11.217,11.22,11.222,11.225,11.227,11.23,11.232,11.235,11.237,11.239,11.242,11.244,11.247,11.249,11.252,11.254,11.256,11.259,11.261,11.264,11.266,11.269,11.271,11.274,11.276,11.278,11.281,11.283,11.286,11.288,11.291,11.293,11.296,11.298,11.3,11.303,11.305,11.308,11.31,11.313,11.315,11.317,11.32,11.322,11.325,11.327,11.33,11.332,11.335,11.337,11.339,11.342,11.344,11.347,11.349,11.352,11.354,11.357,11.359,11.361,11.364,11.366,11.369,11.371,11.374,11.376,11.378,11.381,11.383,11.386,11.388,11.391,11.393,11.396,11.398,11.4,11.403,11.405,11.408,11.41,11.413,11.415,11.418,11.42,11.422,11.425,11.427,11.43,11.432,11.435,11.437,11.439,11.442,11.444,11.447,11.449,11.452,11.454,11.457,11.459,11.461,11.464,11.466,11.469,11.471,11.474,11.476,11.479,11.481,11.483,11.486,11.488,11.491,11.493,11.496,11.498,11.5,11.503,11.505,11.508,11.51,11.513,11.515,11.518,11.52,11.522,11.525,11.527,11.53,11.532,11.535,11.537,11.54,11.542,11.544,11.547,11.549,11.552,11.554,11.557,11.559,11.561,11.564,11.566,11.569,11.571,11.574,11.576,11.579,11.581,11.583,11.586,11.588,11.591,11.593,11.596,11.598,11.6,11.603,11.605,11.608,11.61,11.613,11.615,11.618,11.62,11.622,11.625,11.627,11.63,11.632,11.635,11.637,11.64,11.642,11.644,11.647,11.649,11.652,11.654,11.657,11.659,11.661,11.664,11.666,11.669,11.671,11.674,11.676,11.679,11.681,11.683,11.686,11.688,11.691,11.693,11.696,11.698,11.7,11.703,11.705,11.708,11.71,11.713,11.715,11.718,11.72,11.722,11.725,11.727,11.73,11.732,11.735,11.737,11.739,11.742,11.744,11.747,11.749,11.752,11.754,11.757,11.759,11.761,11.764,11.766,11.769,11.771,11.774,11.776,11.778,11.781,11.783,11.786,11.788,11.791,11.793,11.796,11.798,11.8,11.803,11.805,11.808,11.81,11.813,11.815,11.817,11.82,11.822,11.825,11.827,11.83,11.832,11.835,11.837,11.839,11.842,11.844,11.847,11.849,11.852,11.854,11.856,11.859,11.861,11.864,11.866,11.869,11.871,11.874,11.876,11.878,11.881,11.883,11.886,11.888,11.891,11.893,11.895,11.898,11.9,11.903,11.905,11.908,11.91,11.912,11.915,11.917,11.92,11.922,11.925,11.927,11.93,11.932]],"carreta_5e|1.5":[[10.536,10.539,10.543,10.547,10.55,10.554,10.558,10.561,10.565,10.569,10.572,10.576,10.58,10.583,10.587,10.591,10.594,10.598,10.601,10.605,10.609,10.612,10.616,10.62,10.623,10.627,10.631,10.634,10.638,10.642,10.645,10.649,10.653,10.656,10.66,10.664,10.667,10.671,10.675,10.678,10.682,10.686,10.689,10.693,10.696,10.7,10.704,10.707,10.711,10.715,10.718,10.722,10.726,10.729,10.733,10.737,10.74,10.744,10.748,10.751,10.755,10.759,10.762,10.766,10.769,10.773,10.777,10.78,10.784,10.788,10.791,10.795,10.799,10.802,10.806,10.81,10.813,10.817,10.821,10.824,10.828,10.831,10.835,10.839,10.842,10.846,10.85,10.853,10.857,10.861,10.864,10.868,10.872,10.875,10.879,10.882,10.886,10.89,10.893,10.897,10.901,10.904,10.908,10.912,10.915,10.919,10.922,10.926,10.93,10.933,10.937,10.941,10.944,10.948,10.952,10.955,10.959,10.962,10.966,10.97,10.973,10.977,10.981,10.984,10.988,10.992,10.995,10.999,11.002,11.006,11.01,11.013,11.017,11.021,11.024,11.028,11.032,11.035,11.039,11.042,11.046,11.05,11.053,11.057,11.061,11.064,11.068,11.071,11.075,11.079,11.082,11.086,11.09,11.093,11.097,11.1,11.104,11.108,11.111,11.115,11.119,11.122,11.126,11.129,11.133,11.137,11.14,11.144,11.148,11.151,11.155,11.158,11.162,11.166,11.169,11.173,11.177,11.18,11.184,11.187,11.191,11.195,11.198,11.202,11.206,11.209,11.213,11.216,11.22,11.224,11.227,11.231,11.234,11.238,11.242,11.245,11.249,11.253,11.256,11.26,11.263,11.267,11.271,11.274,11.278,11.281,11.285,11.289,11.292,11.296,11.3,11.303,11.307,11.31,11.314,11.318,11.321,11.325,11.328,11.332,11.336,11.339,11.343,11.346,11.35,11.354,11.357,11.361,11.364,11.368,11.372,11.375,11.379,11.383,11.386,11.39,11.393,11.397,11.401,11.404,11.408,11.411,11.415,11.419,11.422,11.426,11.429,11.433,11.437,11.44,11.444,11.447,11.451,11.455,11.458,11.462,11.465,11.469,11.473,11.476,11.48,11.483,11.487,11.491,11.494,11.498,11.501,11.505,11.509,11.512,11.516,11.519,11.523,11.527,11.53,11.534,11.537,11.541,11.544,11.548,11.552,11.555,11.559,11.562,11.566,11.57,11.573,11.577,11.58,11.584,11.588,11.591,11.595,11.598,11.602,11.606,11.609,11.613,11.616,11.62,11.623],[9.871,9.875,9.878,9.882,9.886,9.889,9.893,9.897,9.9,9.904,9.907,9.911,9.915,9.918,9.922,9.926,9.929,9.933,9.937,9.94,9.944,9.948,9.951,9.955,9.959,9.962,9.966,9.97,9.973,9.977,9.981,9.984,9.988,9.991,9.995,9.999,10.002,10.006,10.01,10.013,10.017,10.021,10.024,10.028,10.032,10.035,10.039,10.042,10.046,10.05,10.053,10.057,10.061,10.064,10.068,10.072,10.075,10.079,10.083,10.086,10.09,10.093,10.097,10.101,10.104,10.108,10.112,10.115,10.119,10.123,10.126,10.13,10.133,10.137,10.141,10.144,10.148,10.152,10.155,10.159,10.162,10.166,10.17,10.173,10.177,10.181,10.184,10.188,10.191,10.195,10.199,10.202,10.206,10.21,10.213,10.217,10.22,10.224,10.228,10.231,10.235,10.239,10.242,10.246,10.249,10.253,10.257,10.26,10.264,10.268,10.271,10.275,10.278,10.282,10.286,10.289,10.293,10.296,10.3,10.304,10.307,10.311,10.314,10.318,10.322,10.325,10.329,10.333,10.336,10.34,10.343,10.347,10.351,10.354,10.358,10.361,10.365,10.369,10.372,10.376,10.379,10.383,10.387,10.39,10.394,10.397,10.401,10.405,10.408,10.412,10.415,10.419,10.423,10.426,10.43,10.433,10.437,10.441,10.444,10.448,10.451,10.455,10.459,10.462,10.466,10.469,10.473,10.477,10.48,10.484,10.487,10.491,10.494,10.498,10.502,10.505,10.509,10.512,10.516,10.52,10.523,10.527,10.53,10.534,10.538,10.541,10.545,10.548,10.552,10.555,10.559,10.563,10.566,10.57,10.573,10.577,10.58,10.584,10.588,10.591,10.595,10.598,10.602,10.606,10.609,10.613,10.616,10.62,10.623,10.627,10.631,10.634,10.638,10.641,10.645,10.648,10.652,10.656,10.659,10.663,10.666,10.67,10.673,10.677,10.68,10.684,10.688,10.691,10.695,10.698,10.702,10.705,10.709,10.713,10.716,10.72,10.723,10.727,10.73,10.734,10.737,10.741,10.745,10.748,10.752,10.755,10.759,10.762,10.766,10.769,10.773,10.777,10.78,10.784,10.787,10.791,10.794,10.798,10.801,10.805,10.809,10.812,10.816,10.819,10.823,10.826,10.83,10.833,10.837,10.84,10.844,10.848,10.851,10.855,10.858,10.862,10.865,10.869,10.872,10.876,10.879,10.883,10.886,10.89,10.894,10.897,10.901,10.904,10.908,10.911,10.915,10.918,10.922,10.925,10.929,10.932,10.936,10.939,10.943,10.947,10.95],[11.2,11.204,11.208,11.211,11.215,11.219,11.222,11.226,11.23,11.233,11.237,11.241,11.244,11.248,11.252,11.255,11.259,11.263,11.266,11.27,11.274,11.277,11.281,11.285,11.288,11.292,11.296,11.299,11.303,11.307,11.31,11.314,11.317,11.321,11.325,11.328,11.332,11.336,11.339,11.343,11.347,11.35,11.354,11.358,11.361,11.365,11.369,11.372,11.376,11.38,11.383,11.387,11.391,11.394,11.398,11.402,11.405,11.409,11.413,11.416,11.42,11.424,11.427,11.431,11.435,11.438,11.442,11.446,11.449,11.453,11.457,11.46,11.464,11.468,11.471,11.475,11.479,11.482,11.486,11.489,11.493,11.497,11.5,11.504,11.508,11.511,11.515,11.519,11.522,11.526,11.53,11.533,11.537,11.541,11.544,11.548,11.552,11.555,11.559,11.563,11.566,11.57,11.574,11.577,11.581,11.585,11.588,11.592,11.596,11.599,11.603,11.607,11.61,11.614,11.618,11.621,11.625,11.629,11.632,11.636,11.64,11.643,11.647,11.65,11.654,11.658,11.661,11.665,11.669,11.672,11.676,11.68,11.683,11.687,11.691,11.694,11.698,11.702,11.705,11.709,11.713,11.716,11.72,11.724,11.727,11.731,11.735,11.738,11.742,11.746,11.749,11.753,11.757,11.76,11.764,11.768,11.771,11.775,11.778,11.782,11.786,11.789,11.793,11.797,11.8,11.804,11.808,11.811,11.815,11.819,11.822,11.826,11.83,11.833,11.837,11.841,11.844,11.848,11.852,11.855,11.859,11.863,11.866,11.87,11.874,11.877,11.881,11.884,11.888,11.892,11.895,11.899,11.903,11.906,11.91,11.914,11.917,11.921,11.925,11.928,11.932,11.936,11.939,11.943,11.947,11.95,11.954,11.958,11.961,11.965,11.969,11.972,11.976,11.979,11.983,11.987,11.99,11.994,11.998,12.001,12.005,12.009,12.012,12.016,12.02,12.023,12.027,12.031,12.034,12.038,12.042,12.045,12.049,12.052,12.056,12.06,12.063,12.067,12.071,12.074,12.078,12.082,12.085,12.089,12.093,12.096,12.1,12.104,12.107,12.111,12.115,12.118,12.122,12.125,12.129,12.133,12.136,12.14,12.144,12.147,12.151,12.155,12.158,12.162,12.166,12.169,12.173,12.177,12.18,12.184,12.187,12.191,12.195,12.198,12.202,12.206,12.209,12.213,12.217,12.22,12.224,12.228,12.231,12.235,12.239,12.242,12.246,12.249,12.253,12.257,12.26,12.264,12.268,12.271,12.275,12.279,12.282,12.286,12.29,12.293,12.297]],"carreta_5e|2.5":[[10.536,10.542,10.548,10.554,10.56,10.566,10.572,10.578,10.584,10.591,10.597,10.603,10.609,10.615,10.621,10.627,10.633,10.639,10.645,10.651,10.658,10.664,10.67,10.676,10.682,10.688,10.694,10.7,10.706,10.712,10.718,10.724,10.731,10.737,10.743,10.749,10.755,10.761,10.767,10.773,10.779,10.785,10.791,10.797,10.804,10.81,10.816,10.822,10.828,10.834,10.84,10.846,10.852,10.858,10.864,10.87,10.876,10.882,10.889,10.895,10.901,10.907,10.913,10.919,10.925,10.931,10.937,10.943,10.949,10.955,10.961,10.967,10.973,10.979,10.985,10.992,10.998,11.004,11.01,11.016,11.022,11.028,11.034,11.04,11.046,11.052,11.058,11.064,11.07,11.076,11.082,11.088,11.094,11.1,11.106,11.113,11.119,11.125,11.131,11.137,11.143,11.149,11.155,11.161,11.167,11.173,11.179,11.185,11.191,11.197,11.203,11.209,11.215,11.221,11.227,11.233,11.239,11.245,11.251,11.257,11.263,11.269,11.275,11.281,11.287,11.293,11.3,11.306,11.312,11.318,11.324,11.33,11.336,11.342,11.348,11.354,11.36,11.366,11.372,11.378,11.384,11.39,11.396,11.402,11.408,11.414,11.42,11.426,11.432,11.438,11.444,11.45,11.456,11.462,11.468,11.474,11.48,11.486,11.492,11.498,11.504,11.51,11.516,11.522,11.528,11.534,11.54,11.546,11.552,11.558,11.564,11.57,11.576,11.582,11.588,11.594,11.6,11.606,11.611,11.617,11.623,11.629,11.635,11.641,11.647,11.653,11.659,11.665,11.671,11.677,11.683,11.689,11.695,11.701,11.707,11.713,11.719,11.725,11.731,11.737,11.743,11.749,11.755,11.761,11.767,11.773,11.779,11.785,11.79,11.796,11.802,11.808,11.814,11.82,11.826,11.832,11.838,11.844,11.85,11.856,11.862,11.868,11.874,11.88,11.886,11.892,11.897,11.903,11.909,11.915,11.921,11.927,11.933,11.939,11.945,11.951,11.957,11.963,11.969,11.975,11.98,11.986,11.992,11.998,12.004,12.01,12.016,12.022,12.028,12.034,12.04,12.046,12.052,12.057,12.063,12.069,12.075,12.081,12.087,12.093,12.099,12.105,12.111,12.117,12.122,12.128,12.134,12.14,12.146,12.152,12.158,12.164,12.17,12.176,12.181,12.187,12.193,12.199,12.205,12.211,12.217,12.223,12.229,12.234,12.24,12.246,12.252,12.258,12.264,12.27,12.276,12.281,12.287,12.293,12.299,12.305,12.311,12.317,12.323,12.328,12.334],[9.871,9.877,9.883,9.889,9.895,9.901,9.907,9.914,9.92,9.926,9.932,9.938,9.944,9.95,9.956,9.962,9.968,9.974,9.981,9.987,9.993,9.999,10.005,10.011,10.017,10.023,10.029,10.035,10.041,10.047,10.053,10.059,10.066,10.072,10.078,10.084,10.09,10.096,10.102,10.108,10.114,10.12,10.126,10.132,10.138,10.144,10.15,10.156,10.162,10.168,10.175,10.181,10.187,10.193,10.199,10.205,10.211,10.217,10.223,10.229,10.235,10.241,10.247,10.253,10.259,10.265,10.271,10.277,10.283,10.289,10.295,10.301,10.307,10.313,10.319,10.325,10.331,10.337,10.343,10.349,10.355,10.361,10.367,10.373,10.379,10.385,10.391,10.397,10.403,10.409,10.415,10.421,10.427,10.433,10.439,10.445,10.451,10.457,10.463,10.469,10.475,10.481,10.487,10.493,10.499,10.505,10.511,10.517,10.523,10.529,10.535,10.541,10.547,10.553,10.559,10.565,10.571,10.577,10.583,10.589,10.595,10.601,10.607,10.613,10.619,10.625,10.631,10.636,10.642,10.648,10.654,10.66,10.666,10.672,10.678,10.684,10.69,10.696,10.702,10.708,10.714,10.72,10.726,10.732,10.737,10.743,10.749,10.755,10.761,10.767,10.773,10.779,10.785,10.791,10.797,10.803,10.809,10.814,10.82,10.826,10.832,10.838,10.844,10.85,10.856,10.862,10.868,10.873,10.879,10.885,10.891,10.897,10.903,10.909,10.915,10.921,10.927,10.932,10.938,10.944,10.95,10.956,10.962,10.968,10.974,10.979,10.985,10.991,10.997,11.003,11.009,11.015,11.021,11.026,11.032,11.038,11.044,11.05,11.056,11.062,11.067,11.073,11.079,11.085,11.091,11.097,11.103,11.108,11.114,11.12,11.126,11.132,11.138,11.143,11.149,11.155,11.161,11.167,11.173,11.178,11.184,11.19,11.196,11.202,11.208,11.213,11.219,11.225,11.231,11.237,11.242,11.248,11.254,11.26,11.266,11.271,11.277,11.283,11.289,11.295,11.3,11.306,11.312,11.318,11.324,11.329,11.335,11.341,11.347,11.353,11.358,11.364,11.37,11.376,11.382,11.387,11.393,11.399,11.405,11.41,11.416,11.422,11.428,11.433,11.439,11.445,11.451,11.457,11.462,11.468,11.474,11.48,11.485,11.491,11.497,11.503,11.508,11.514,11.52,11.526,11.531,11.537,11.543,11.549,11.554,11.56,11.566,11.572,11.577,11.583,11.589,11.594,11.6,11.606,11.612,11.617,11.623,11.629,11.634,11.64,11.646],[11.2,11.206,11.213,11.219,11.225,11.231,11.237,11.243,11.249,11.255,11.261,11.267,11.274,11.28,11.286,11.292,11.298,11.304,11.31,11.316,11.322,11.328,11.335,11.341,11.347,11.353,11.359,11.365,11.371,11.377,11.383,11.389,11.396,11.402,11.408,11.414,11.42,11.426,11.432,11.438,11.444,11.45,11.457,11.463,11.469,11.475,11.481,11.487,11.493,11.499,11.505,11.511,11.518,11.524,11.53,11.536,11.542,11.548,11.554,11.56,11.566,11.572,11.579,11.585,11.591,11.597,11.603,11.609,11.615,11.621,11.627,11.633,11.64,11.646,11.652,11.658,11.664,11.67,11.676,11.682,11.688,11.694,11.7,11.707,11.713,11.719,11.725,11.731,11.737,11.743,11.749,11.755,11.761,11.768,11.774,11.78,11.786,11.792,11.798,11.804,11.81,11.816,11.822,11.828,11.835,11.841,11.847,11.853,11.859,11.865,11.871,11.877,11.883,11.889,11.895,11.902,11.908,11.914,11.92,11.926,11.932,11.938,11.944,11.95,11.956,11.962,11.969,11.975,11.981,11.987,11.993,11.999,12.005,12.011,12.017,12.023,12.029,12.035,12.042,12.048,12.054,12.06,12.066,12.072,12.078,12.084,12.09,12.096,12.102,12.108,12.115,12.121,12.127,12.133,12.139,12.145,12.151,12.157,12.163,12.169,12.175,12.181,12.187,12.194,12.2,12.206,12.212,12.218,12.224,12.23,12.236,12.242,12.248,12.254,12.26,12.266,12.273,12.279,12.285,12.291,12.297,12.303,12.309,12.315,12.321,12.327,12.333,12.339,12.345,12.351,12.358,12.364,12.37,12.376,12.382,12.388,12.394,12.4,12.406,12.412,12.418,12.424,12.43,12.436,12.442,12.449,12.455,12.461,12.467,12.473,12.479,12.485,12.491,12.497,12.503,12.509,12.515,12.521,12.527,12.533,12.539,12.545,12.552,12.558,12.564,12.57,12.576,12.582,12.588,12.594,12.6,12.606,12.612,12.618,12.624,12.63,12.636,12.642,12.648,12.654,12.661,12.667,12.673,12.679,12.685,12.691,12.697,12.703,12.709,12.715,12.721,12.727,12.733,12.739,12.745,12.751,12.757,12.763,12.769,12.775,12.781,12.787,12.794,12.8,12.806,12.812,12.818,12.824,12.83,12.836,12.842,12.848,12.854,12.86,12.866,12.872,12.878,12.884,12.89,12.896,12.902,12.908,12.914,12.92,12.926,12.932,12.938,12.944,12.95,12.956,12.962,12.969,12.975,12.981,12.987,12.993,12.999,13.005,13.011,13.017,13.023]]}}};
  var tierVisible = { p: true, s: true };

  /* Filtro global da base do ligante (2026-09-28): 'todos' ou 'portland'.
     Aplica-se a tudo o que lê currentData() -- KPI de pares, dispersão,
     legenda, forest e contagens de estrato. Não se aplica ao funil (conta
     artigos, não traços) nem ao gráfico de unidades (contagens brutas de
     dados_fck). */
  var BASE_KEY = 'kl-meta-base';
  var baseFilter = 'todos';
  try {
    var qBase = new URLSearchParams(window.location.search).get('base');
    var sBase = qBase || window.localStorage.getItem(BASE_KEY);
    if (sBase === 'portland' || sBase === 'todos') baseFilter = sBase;
  } catch (e) {}

  function baseMatches(d) {
    return baseFilter === 'todos' || d[5] === 'P';
  }

  /* Cenário do CO₂ (2026-10-07, pedido da Kie): 'sem' (bruto, sem descontos)
     ou 'com' (com os descontos que o próprio artigo aplica: carga evitada,
     carbonatação, carbono biogénico, módulo D). d[6] = CO₂ com desconto (null =
     o artigo não declara desconto, vale o bruto); d[7] = 1 quando o artigo só
     publica o valor com desconto: esse par sai do cenário 'sem' e só entra no
     'com' (decisão da Kie, 2026-10-07; F9 em DECISOES_METANALISE.md). */
  var CO2_KEY = 'kl-meta-co2';
  var co2Scenario = 'sem';
  try {
    var qCo2 = new URLSearchParams(window.location.search).get('co2');
    var sCo2 = qCo2 || window.localStorage.getItem(CO2_KEY);
    if (sCo2 === 'sem' || sCo2 === 'com') co2Scenario = sCo2;
  } catch (e) {}

  function withScenario(d) {
    if (co2Scenario !== 'com' || d[6] === null || d[6] === undefined || d[6] === d[1]) return d;
    var c = d.slice();
    c[1] = d[6];
    return c;
  }

  function scenarioMatches(d) {
    return co2Scenario === 'com' || d[7] !== 1;
  }

  /* Indicador do forest por família (Kie, 2026-10-16, F25): 'ci' (Damineli,
     CO₂ ÷ fck) ou 'cit' (ci_t = ci ÷ vida útil de projeto, F22). d[9] = vida
     útil declarada pelo próprio artigo (null = sem vida útil): no modo ci_t
     esses pares saem do gráfico. ?forest=cit no URL. */
  var FOREST_KEY = 'kl-meta-forest';
  var forestMetric = 'ci';
  /* F33 (Kiê, 2026-10-17): o ci_t existe em todos os pares. 'cit' usa a vida útil da hierarquia (d[9]; d[10] =
     fonte: d declarada pelo estudo, c citada, n norma pela aplicação, p norma sem aplicação = 50 anos);
     'citf', 'citm' e 'citn' são sensibilidades com a vida útil média da família (VIDA_FAM): valores vindos
     dos estudos, só os de base «modelo» e só os de base «norma». */
  var METRICS = ['ci', 'cit', 'citf', 'citm', 'citn'];
  var VIDA_FAM_KEY = { citf: 'fam', citm: 'mod', citn: 'nor' };
  try {
    var qFor = new URLSearchParams(window.location.search).get('forest');
    var sFor = qFor || window.localStorage.getItem(FOREST_KEY);
    if (METRICS.indexOf(sFor) >= 0) forestMetric = sFor;
  } catch (e) {}

  /* vida útil de um par no indicador escolhido (null = não se aplica) */
  function vidaDoPar(d) {
    if (forestMetric === 'cit') return d[9] || null;
    var m = VIDA_FAM[d[2]] || VIDA_FAM._g;
    return (m && m[VIDA_FAM_KEY[forestMetric]]) || null;
  }

  function currentData() {
    return DATA.filter(function (d) {
      return tierVisible[d[3]] && baseMatches(d) && scenarioMatches(d);
    }).map(withScenario);
  }

  /* Contagem viva das 4 etapas da triagem (articles_final.xlsx, coluna
     status_triagem + colunas E1_, E2_, E3_ e E4_ — revisao-sistematica-
     literatura). Atualizar à mão sempre que um PR mudar esses totais
     (mesmo espírito de KPI_VALUES abaixo, snapshot manual, não
     dado ao vivo). universo = todo o banco (5.093 registos, incluindo
     duplicatas e sem-acesso); da Etapa 1 em diante contam-se só linhas
     com status_triagem diferente de Duplicado (desde 2026-09-27: antes
     entravam 6-7 duplicatas com E1 preenchido); cada etapa seguinte é
     sempre um subconjunto Aceito da anterior. e4.principal + e4.sensibilidade = e4.n = os 466
     artigos Elegíveis (2 terços de melhor qualidade formam o resultado
     principal); as 58 revisões sem ACV própria que também sobrevivem à
     Etapa 3 ficam fora desta barra — ver funnelRevisaoNote. */
  var FUNNEL = [
    { key: 'universo', n: 5093 },
    { key: 'e1', n: 2191 },
    { key: 'e2', n: 542 },
    { key: 'e3', n: 524 },
    { key: 'e4', n: 466, principal: 362, sensibilidade: 104 }
  ];

  /* Registos por base de dados, antes da remoção de duplicatas -- mesmos
     números do slide 22 de /ppt/dissertacao/ (nomes das bases são próprios,
     não traduzidos por idioma). Soma = 5.093 = FUNNEL[0].n. Snapshot manual
     das buscas originais, não recalculado a cada corrida (não vive em
     articles_final.xlsx com uma coluna própria) -- atualizar à mão só se as
     buscas forem refeitas. Exibido dentro do detalhe da etapa "universo",
     ordenado do maior para o menor (pedido da Kie, 2026-09-12) -- o slide
     mostra a ordem inversa (menor para maior). */
  var DB_SOURCES = [
    { label: 'Web of Science', n: 1917 },
    { label: 'Scopus', n: 1427 },
    { label: 'Engineering Village', n: 763 },
    { label: 'MDPI', n: 475 },
    { label: 'Science Direct', n: 411 },
    { label: 'BDTD', n: 72 },
    { label: 'SciELO', n: 28 }
  ];

  /* Checklist de qualidade da Etapa 4 -- QA-QF em vigor (0/0,5/1,0 cada,
     máximo 6,0), QG proposto em 2026-09-12 (ver CRITERIOS_E_NUANCES_RSL.md
     no repositório da RSL) e ainda não pontuado em nenhuma linha -- por
     isso `proposto: true` só nele, para o site marcar visualmente que é
     diferente dos outros seis. Rótulo e descrição de cada item vivem em
     COPY[lang].qualityCriteria, por serem texto traduzido. */
  var QUALITY_CRITERIA = [
    { key: 'QA' },
    { key: 'QB' },
    { key: 'QC' },
    { key: 'QD' },
    { key: 'QE' },
    { key: 'QF' },
    { key: 'QG' }
  ];

  var COPY = {
    PT: {
      kicker: 'PESQUISA · PAINEL AO VIVO',
      title: 'Pegada de carbono × resistência: a metanálise da dissertação',
      lead: 'Este painel acompanha, em tempo real, a extração de dados da revisão sistemática de literatura por trás da minha dissertação — comparando resistência à compressão e pegada de carbono em concretos de baixo carbono, agregado reciclado e UHPC. Os números mudam conforme a leitura de cada artigo avança.',
      navBack: '← kielima.com',
      navDb: 'Banco de dados',
      navPrisma: 'Fluxograma PRISMA',
      kpiFunilLabel: 'artigos aceitos (passaram as 4 etapas)',
      kpiQualidadeLabel: 'dos quais de melhor qualidade (≥ 4,0)',
      kpiParesLabel: 'pares resistência × CO₂ extraídos',
      kpiVidaLabel: 'com vida útil de projeto declarada',
      kpiReleituraLabel: 'estudos com par na metanálise',
      kpiCompletoLabel: 'dos artigos aceitos com resistência e CO₂ já extraídos',
      funnelLabel: 'TRIAGEM',
      funnelTitle: 'O funil da triagem: de 5.093 registos a 466 artigos',
      funnelP: 'A revisão sistemática passa por quatro etapas antes de um artigo entrar na metanálise: metadados, leitura do PDF completo, restrição geográfica do material e, por fim, qualidade metodológica. Cada barra mostra quantos artigos sobrevivem a cada etapa, a partir do banco completo de registos recolhidos nas buscas.',
      funnelStages: {
        universo: 'Banco completo (buscas + duplicatas removidas)',
        e1: 'Etapa 1 — metadados (ano, tipo de documento, material moldável, aplicação em construção)',
        e2: 'Etapa 2 — leitura do PDF completo (resistência à compressão e CO₂/ACV declarados)',
        e3: 'Etapa 3 — material não geograficamente restrito',
        e4: 'Etapa 4 — qualidade metodológica (resultado final)'
      },
      funnelRevisaoNote: 'Mais 58 artigos são revisões sem avaliação de ciclo de vida própria — não alimentam o indicador ci, mas continuam na base como ramo de citação do PRISMA: candidatos a fontes primárias descobertas pelas revisões que as citam.',
      funnelToggleHint: 'toque numa etapa para ver os critérios de exclusão',
      funnelDbChartTitle: 'Registos por base de dados, antes da remoção de duplicatas',
      qualityCriteriaProposto: 'proposto — ainda não pontuado',
      qualityCriteria: {
        QA: { label: 'Unidade funcional', desc: 'A unidade funcional está declarada e é inequívoca.' },
        QB: { label: 'Método de análise', desc: 'O método de avaliação de impacto (LCIA) está nomeado.' },
        QC: { label: 'Fonte dos dados', desc: 'A base de inventário está nomeada.' },
        QD: { label: 'Vida útil', desc: 'A vida útil está declarada (entra na unidade funcional do indicador ci_t).' },
        QE: { label: 'Fronteira do sistema', desc: 'O que está dentro e fora do sistema está definido (ex.: cradle-to-gate, cradle-to-grave).' },
        QF: { label: 'Emparelhamento CO₂↔resistência', desc: 'Os dois números do quociente ci pertencem à mesma mistura, não a misturas ou recortes diferentes.' },
        QG: { label: 'Dispersão/intervalo de confiança declarado', desc: 'O artigo dá meio de calcular um intervalo de confiança do ci daquela mistura — só conta dispersão medida pelo próprio artigo, nunca citada de outro estudo.' }
      },
      funnelDetails: {
        universo: '5.093 registos recolhidos nas buscas. 2.630 (51,6%) eram duplicados, removidos antes de qualquer triagem. 1.932 foram rejeitados ao longo das quatro etapas seguintes — ver o detalhe em cada barra abaixo. 7 nunca tiveram o texto completo disponível (sem acesso). Os 528 restantes — 470 elegíveis + 58 revisões sem ACV própria — chegam todos à Etapa 4.',
        e1: 'Dos 2.463 registos avaliados nos metadados (ano, tipo de documento, material moldável, aplicação em construção), 2.191 foram aceites. Os 272 excluídos falharam por: aplicação em construção (190), material não moldável (71), tipo de documento (9), ano de publicação (1) — um registo pode falhar mais de um critério.',
        e2: 'Dos 2.185 artigos com PDF lido na íntegra, 542 foram aceites. Dos 1.643 excluídos: 1.303 não relatavam resistência à compressão própria pareável a um CO₂ próprio, 442 não relatavam CO₂/ACV com resultado absoluto — alguns falham nos dois critérios.',
        e3: 'Dos 538 artigos avaliados quanto à restrição geográfica do material, 524 foram aceites; 14 foram excluídos por o material principal ser geograficamente restrito (ex.: resíduo de produção regional concentrada).',
        e4: 'Dos 524 artigos avaliados na Etapa 4 (checklist de 7 itens, 0 a 7 pontos): 362 formam o resultado principal (score ≥ 4,0), 104 entram só na análise de sensibilidade (score < 4,0), e 58 são revisões sem avaliação de ciclo de vida própria — não pontuam para o indicador ci, mas alimentam o ramo de citação do PRISMA (fontes primárias descobertas por essas revisões).'
      },
      tierLabel: 'ESTRATIFICAÇÃO POR QUALIDADE',
      tierTitle: 'Resultado principal × análise de sensibilidade',
      tierP: 'A Etapa 4 pontua a qualidade de cada artigo aceite (0–7, sete itens). Os dois terços de melhor pontuação formam o resultado principal da metanálise; o terço mais fraco continua aceite, mas só entra na análise de sensibilidade. Ligue e desligue cada grupo na barra fixa do topo («Qualidade») para comparar.',
      tierPrincipal: 'Dois terços de melhor qualidade (score ≥ 4,0)',
      tierSensibilidade: 'Terço mais fraco — só sensibilidade (score < 4,0)',
      tierBarLabel: 'QUALIDADE',
      tierPrincipalCurto: 'Melhor qualidade (≥ 4,0)',
      tierSensCurto: 'Terço mais fraco (< 4,0)',
      baseLabel: 'BASE DO LIGANTE',
      baseTodos: 'Todos os materiais',
      basePortland: 'Só cimento Portland',
      co2Label: 'CO₂ DOS ARTIGOS',
      co2Sem: 'Sem desconto',
      co2Com: 'Com desconto',
      co2Note: 'Alguns artigos descontam do CO₂ do betão créditos que não são da produção: carga evitada (cimento, agregado ou aterro que deixam de existir), carbonatação ao longo da vida, carbono biogénico armazenado ou reciclagem no fim de vida (módulo D). «Sem desconto» mostra o CO₂ bruto de cada traço; «Com desconto» aplica os descontos que o próprio artigo declara (o número ao lado conta os traços que mudam). Quando o artigo só publica o valor já com desconto, esse traço fica de fora em «Sem desconto» e só aparece em «Com desconto».',
      baseNote: 'Filtra a página inteira pelo ligante de cada traço. «Cimento Portland» inclui cimentos compostos, substituição parcial do cimento por adições (cinza volante, escória, argila calcinada, sílica ativa), UHPC, betão armado e betão com agregado reciclado. Ficam de fora os traços sem clínquer Portland como ligante principal: geopolímeros e ligantes álcali-ativados, sulfoaluminato de cálcio, cimentos de magnésio, compósitos de gesso e madeira. O funil conta artigos, não traços, e não muda com o filtro; o mesmo vale para o gráfico de unidades.',
      scatterTitle: 'Resistência × pegada de carbono',
      scatterP: '{N} pares comparáveis por m³ de material — traços/formulações cujo valor absoluto de CO₂ e resistência à compressão são publicados pelo próprio artigo, na mesma tabela. Totais de estrutura inteira (edifício, ponte) ficam fora, por não terem a mesma unidade de análise.',
      scatterXLabel: 'resistência à compressão (MPa)',
      scatterYLabel: 'CO₂ (kg/m³)',
      forestTitle: 'ci por família de material',
      forestP: 'ci = CO₂ ÷ resistência, em kg CO₂-eq por m³·MPa — quanto menor, mais eficiente o material por unidade de resistência entregue. Ponto contra ponto no gráfico acima.',
      forestToggleHint: 'toque numa família para ver os estudos que a compõem',
      forestTitleCit: 'ci_t por família de material',
      forestPCit: 'ci_t = ci ÷ vida útil, em kg CO₂-eq por m³·MPa·ano — quanto menor, menos carbono por unidade de resistência e por ano de serviço. Todos os pares têm ci_t: a vida útil é assumida por nós quando o artigo não a declara ({n} de {total} pares neste filtro).',
      forestP_cit: 'Vida útil pela hierarquia: declarada pelo estudo, senão citada por ele, senão a de projecto da norma conforme a aplicação (EN 1990, NBR 15575) e, sem aplicação identificável, 50 anos.',
      forestP_citf: 'Sensibilidade: vida útil média da família (valores vindos dos estudos, um voto por estudo).',
      forestP_citm: 'Sensibilidade: vida útil média da família só com os valores calculados pelos próprios estudos (modelo ou ensaio de durabilidade).',
      forestP_citn: 'Sensibilidade: vida útil média da família só com valores de norma (a declarada ou citada por norma e, sem ela, a norma conforme a aplicação).',
      forestMetricCi: 'ci',
      forestMetricCit: 'ci_t (hierarquia)',
      forestMetric_citf: 'ci_t · média da família',
      forestMetric_citm: 'ci_t · família, só modelos',
      forestMetric_citn: 'ci_t · família, só normas',
      forestAnos: 'anos',
      forestLegModelo: 'estimativa do modelo multinível com IC 95%',
      forestLegMediana: 'mediana dos pares',
      forestLegIP: 'intervalo de predição 95% (todos os materiais)',
      forestModeloNota: 'O losango é a média ponderada do modelo multinível (rma.mv, REML, pacote metafor do R; estudos e traços como efeitos aleatórios), recalculada para os filtros escolhidos; a barra é o seu intervalo de confiança de 95%. O círculo vazio é a mediana dos pares e o quadrado vazio a média simples (sem pesos); ligam-se e desligam-se na legenda. Modelo de {data}.',
      forestSemModelo: 'sem estimativa do modelo para esta família neste filtro (poucos estudos)',
      forestTipMediana: 'mediana',
      forestTipIP: 'intervalo de predição 95%',
      forestLegMedia: 'média simples dos pares',
      forestTipMedia: 'média simples',
      forestMarcasAria: 'Marcas a mostrar no forest',
      forestOverall: 'TODOS OS MATERIAIS',
      forestSemLabel: 'estudo sem citação disponível',
      subfamLang: 'pt',
      subfamInfoLabel: 'O que é esta subfamília (norma de referência)',
      baseInfoLabel: 'O que conta em cada opção da base do ligante',
      co2InfoLabel: 'O que é o CO₂ sem e com desconto',
      noteTitle: 'Sobre o indicador',
      noteP: 'O desfecho oficial desta metanálise é ci_t = ci ÷ vida útil de projeto (kg CO₂-eq por m³·MPa·ano). A vida útil só é premissa declarada pelo próprio artigo em 118 dos 466 artigos (25%), por isso o painel mostra o indicador ci, que cobre todos os pares; o ci_t é estimado à parte no subconjunto com vida útil (média 0,163 kg CO₂-eq por m³·MPa·ano, 91 estudos). Metodologia de Damineli et al. (2010). Um modelo de efeitos aleatórios multinível (REML) trata cada formulação como observação própria, aninhada no estudo de origem.',
      footerCite: 'Parte da dissertação de mestrado em Sistemas de Infraestrutura Urbana (PUC-Campinas), sobre Avaliação de Ciclo de Vida do concreto de ultra alto desempenho (UHPC).',
      cats: {
        geopolimero: 'Geopolímero / álcali-ativado',
        uhpc: 'UHPC',
        scm: 'SCM (cinza, escória, sílica)',
        reciclado: 'Agregado reciclado',
        opc: 'Cimento Portland (referência)',
        ligantes: 'Ligantes alternativos',
        biobase: 'Bio-base',
        concreto_armado: 'Concreto armado (inclui aço)'
      },
      catsDesc: {
        geopolimero: 'Ligante 100% álcali-ativado — sem cimento Portland; um precursor (cinza volante, escória etc.) reage com um ativador alcalino para formar toda a matriz.',
        uhpc: 'Concreto de ultra-alto desempenho — matriz muito densa, baixa relação água/ligante, fibras e agregados finos selecionados.',
        scm: 'Cimento Portland a que o próprio estudo junta, no traço, cinza volante, escória, sílica ativa ou outra adição — o ligante principal continua a ser o cimento.',
        reciclado: 'Concreto convencional com agregado graúdo e/ou miúdo substituído, total ou parcialmente, por material reciclado (ex. resíduo de construção e demolição).',
        opc: 'Concreto feito com um cimento comercial tal como é vendido (CP I a CP V, CEM I a CEM V, ASTM, PLC…), mesmo que seja composto — a referência-base de comparação. Toque para ver as subfamílias por tipo de cimento.',
        ligantes: 'Ligantes não convencionais que não se encaixam nas outras famílias (ex. cimentos à base de enxofre, magnésio ou sulfoaluminato).',
        biobase: 'Materiais com componente de origem biológica/vegetal como parte estrutural relevante (ex. fibra natural, biochar).',
        concreto_armado: 'Elemento de concreto armado — o valor inclui a contribuição do aço de reforço, não só do concreto.'
      },
      tooltipCi: 'ci',
      mapaTitle: "De onde vêm os artigos incluídos",
      mapaP: "País do autor de correspondência de cada artigo aceite na revisão (Web of Science, BDTD, Crossref ou a própria primeira página do PDF). Quanto mais escuro, mais artigos. Passe o cursor sobre um país para ver o número.",
      univLabel: "Universo",
      univTodos: "Todos os artigos aceites",
      univMeta: "Só os estudos da metanálise",
      mapaAria: "Mapa-múndi com o número de artigos por país do autor de correspondência",
      mapaLegenda: "Artigos por país",
      mapaTipN: "{n} artigos",
      mapaTipMeta: "{n} com par fck × CO₂ no painel",
      mapaResumo: "{n} artigos de {p} países.",
      mapaErro: "Não foi possível carregar os dados do mapa.",
      mapaVerTodos: "Mostrar os {n} países",
      mapaVerMenos: "Mostrar só os 15 primeiros",
      redeTitle: "Linha temporal e citações entre os artigos",
      redeP: "Cada ponto é um artigo, colocado no ano de publicação. Cada linha liga um artigo a outro artigo desta mesma revisão que ele cita na sua lista de referências (fonte: Crossref). Passe o cursor sobre um ponto para destacar quem ele cita e quem o cita; clique para fixar o cartão (pode fixar vários e desfixá-los no ×).",
      redeAria: "Linha temporal dos artigos incluídos com as ligações de citação entre eles",
      redeTipCita: "cita {n} desta revisão",
      redeTipCitado: "citado por {n}",
      redeTipSemRefs: "Sem lista de referências no Crossref (ex.: teses).",
      redeTipExt: "Fontes de dados citadas:",
      redeResumo: "{n} artigos e {l} ligações de citação. {s} artigos não têm lista de referências no Crossref (sobretudo teses e dissertações) e por isso não podem mostrar quem citam.",
      redeLegMeta: "com par no painel",
      redeLegOutro: "sem par no painel",
      redeLegLig: "cita",
      redePinFechar: "Desfixar",
      unitChartTitle: 'Unidades de CO₂ relatadas',
      unitChartP: 'Como cada estudo reporta a pegada de carbono — nem sempre em kg CO₂-eq por m³. "Nativo" é o valor já publicado assim pelo autor; "convertido por nós" é calculado a partir de outra grandeza que o próprio artigo imprime (ex. um total dividido pelo volume do elemento). As barras cinzentas são unidades que não se deixam converter em kg CO₂-eq/m³ sem assumir um dado que o artigo não imprime (massa volúmica, volume, traço); foram relidas na íntegra e ficam fora da metanálise. A barra tracejada reúne os valores já em kg/m³ que foram excluídos — clique nela para ver cada linha e o motivo.',
      unitChartKindNativo: 'kg CO₂-eq/m³ — nativo (publicado assim)',
      unitChartKindDerivado: 'kg CO₂-eq/m³ — convertido por nós',
      unitChartKindPendente: 'não convertível sem assumir dados (fora da metanálise)',
      unitChartKindExcluido: 'em kg/m³, mas excluído da análise',
      unitExcluidoBar: 'kg CO₂-eq/m³ — excluído (valor incoerente ou incompleto)',
      unitExcluidoHint: 'Clique para ver cada linha excluída e o motivo',
      unitExcluidoCols: ['Estudo', 'Mistura', 'fck (MPa)', 'CO₂ registado', 'Motivo da exclusão'],
      unitCats: {
        m2: 'por m² de área construída',
        tonelada: 'por tonelada de material',
        kg: 'por kg de insumo',
        elemento: 'por elemento estrutural inteiro',
        metro_linear: 'por metro linear',
        ja_mpa: 'índice já normalizado por MPa',
        especime: 'por corpo de prova/espécime',
        energia: 'por MJ de energia armazenada',
        sem_referencia: 'sem unidade de referência impressa',
        outro: 'outro / não classificado'
      },
      a4Label: 'TRANSPORTE ATÉ A OBRA (A4)',
      a4Title: 'Quanto pesa o transporte do concreto no ci?',
      a4P: 'A maioria dos estudos para a fronteira no portão da fábrica (A1–A3) e não conta o transporte do concreto até a obra (A4). Escolha a distância, o veículo e o fator de emissão: o A4 = fator SIDAC × massa específica do concreto × distância é somado ao CO₂ dos pares em que o estudo comprovadamente não o inclui, e o ci é recalculado. O modelo é reajustado para cada combinação.',
      a4DistLabel: 'distância central → obra',
      a4ModoLabel: 'veículo (SIDAC)',
      a4FacLabel: 'fator de emissão',
      a4Prov: 'incluir os pares em que a exclusão do A4 é só provável',
      a4Modo_betoneira: 'Betoneira',
      a4Modo_truck_3e: 'Truck 3 eixos',
      a4Modo_carreta_4e: 'Carreta 4 eixos',
      a4Modo_carreta_5e: 'Carreta 5 eixos',
      a4KpiPares: 'pares com A4 somado (dos visíveis)',
      a4KpiA4: 'A4 médio somado, kg CO₂-eq/m³',
      a4KpiCi0: 'ci mediano sem A4',
      a4KpiCi1: 'ci mediano com A4',
      a4KpiMu: 'modelo: ci com A4 [IC 95%]',
      a4KpiDif: 'modelo: diferença face a sem A4',
      a4EixoX: 'distância (km)',
      a4EixoY: 'ci do modelo',
      a4SemModelo: 'sem estimativa do modelo para esta combinação',
      a4Nota: 'Fatores SIDAC por t·km: betoneira 0,10, truck e carreta de 4 eixos 0,07, carreta de 5 eixos 0,06 kg CO₂-eq (sem retorno vazio). Massa específica lida do artigo ou, se não declarada, 2.400 kg/m³. Os números ao vivo seguem os filtros do topo; o modelo é sempre o do estrato principal, CO₂ sem desconto e todos os ligantes ({k} pares, {estudos} estudos; sem A4: {ref}), com um ajuste do modelo para cada quilômetro de 0 a 300 km, em cada veículo e fator. Fatores ×1,5 e ×2,5 cobrem os fatores maiores usados na literatura (ecoinvent, NREL).'
    },

    EN: {
      kicker: 'RESEARCH · LIVE DASHBOARD',
      title: 'Carbon footprint × strength: the dissertation meta-analysis',
      lead: 'This dashboard tracks, in real time, the data extraction behind the systematic literature review under my dissertation — comparing compressive strength and carbon footprint across low-carbon, recycled-aggregate and ultra-high-performance (UHPC) concretes. The numbers change as each article gets read.',
      navBack: '← kielima.com',
      navDb: 'Database',
      navPrisma: 'PRISMA flow',
      kpiFunilLabel: 'articles accepted (passed all 4 stages)',
      kpiQualidadeLabel: 'of which higher quality (≥ 4.0)',
      kpiParesLabel: 'strength × CO₂ pairs extracted',
      kpiVidaLabel: 'with declared design service life',
      kpiReleituraLabel: 'studies with a pair in the meta-analysis',
      kpiCompletoLabel: 'of accepted articles with strength and CO₂ already extracted',
      funnelLabel: 'SCREENING',
      funnelTitle: 'The screening funnel: from 5,093 records to 466 articles',
      funnelP: "The systematic review runs through four stages before an article enters the meta-analysis: metadata, full-PDF reading, the material's geographic restriction, and finally methodological quality. Each bar shows how many articles survive each stage, starting from the full pool of records collected in the searches.",
      funnelStages: {
        universo: 'Full database (searches + duplicates removed)',
        e1: 'Stage 1 — metadata (year, document type, moldable material, construction application)',
        e2: 'Stage 2 — full-PDF reading (declared compressive strength and CO₂/LCA)',
        e3: 'Stage 3 — material not geographically restricted',
        e4: 'Stage 4 — methodological quality (final result)'
      },
      funnelRevisaoNote: 'Another 58 articles are reviews without their own life-cycle assessment — they do not feed the ci indicator, but stay in the base as a PRISMA citation branch: candidate primary sources discovered through the reviews that cite them.',
      funnelToggleHint: 'tap a stage to see the exclusion criteria',
      funnelDbChartTitle: 'Records by database, before duplicate removal',
      qualityCriteriaProposto: 'proposed — not scored yet',
      qualityCriteria: {
        QA: { label: 'Functional unit', desc: 'The functional unit is declared and unambiguous.' },
        QB: { label: 'Analysis method', desc: 'The impact assessment method (LCIA) is named.' },
        QC: { label: 'Data source', desc: 'The inventory database is named.' },
        QD: { label: 'Service life', desc: 'Service life is declared (feeds the functional unit of the ci_t indicator).' },
        QE: { label: 'System boundary', desc: 'What is inside and outside the system is defined (e.g. cradle-to-gate, cradle-to-grave).' },
        QF: { label: 'CO₂↔strength pairing', desc: 'The two numbers of the ci ratio belong to the same mixture, not to different mixtures or scopes.' },
        QG: { label: 'Declared dispersion / confidence interval', desc: 'The article gives a way to compute a confidence interval for that mixture’s ci — only counts dispersion measured by the article itself, never cited from a different study.' }
      },
      funnelDetails: {
        universo: "5,093 records collected in the searches. 2,630 (51.6%) were duplicates, removed before any screening. 1,932 were rejected across the four stages that follow — see the detail in each bar below. 7 never had the full text available (no access). The remaining 528 — 470 eligible + 58 reviews without their own LCA — all reach Stage 4.",
        e1: 'Of the 2,463 records screened on metadata (year, document type, moldable material, construction application), 2,191 were accepted. The 272 excluded failed on: construction application (190), non-moldable material (71), document type (9), publication year (1) — a record can fail more than one criterion.',
        e2: 'Of the 2,185 articles fully read as PDF, 542 were accepted. Of the 1,643 excluded: 1,303 did not report their own compressive strength paired with their own CO₂, 442 did not report CO₂/LCA with an absolute result — some fail both criteria.',
        e3: "Of the 538 articles assessed for the material's geographic restriction, 524 were accepted; 14 were excluded because the main material is geographically restricted (e.g. a regionally concentrated production by-product).",
        e4: "Of the 524 articles assessed in Stage 4 (a 7-item checklist, 0 to 7 points): 362 form the main result (score ≥ 4.0), 104 enter only the sensitivity analysis (score < 4.0), and 58 are reviews without their own life-cycle assessment — they don't score toward the ci indicator, but feed the PRISMA citation branch (primary sources discovered through those reviews)."
      },
      tierLabel: 'QUALITY STRATIFICATION',
      tierTitle: 'Main result × sensitivity analysis',
      tierP: "Stage 4 scores the quality of every accepted article (0-7, seven items). The top two-thirds by score form the meta-analysis's main result; the bottom third stays accepted, but only feeds the sensitivity analysis. Toggle each group in the sticky bar at the top («Quality») to compare.",
      tierPrincipal: 'Top two-thirds by quality (score ≥ 4.0)',
      tierSensibilidade: 'Bottom third — sensitivity only (score < 4.0)',
      tierBarLabel: 'QUALITY',
      tierPrincipalCurto: 'Higher quality (≥ 4.0)',
      tierSensCurto: 'Weakest third (< 4.0)',
      baseLabel: 'BINDER BASE',
      baseTodos: 'All materials',
      basePortland: 'Portland cement only',
      co2Label: 'CO₂ OF THE ARTICLES',
      co2Sem: 'Without credits',
      co2Com: 'With credits',
      co2Note: 'Some articles subtract from the concrete CO₂ credits that are not part of production: avoided burden (cement, aggregate or landfill that no longer happen), carbonation over the service life, stored biogenic carbon, or end-of-life recycling (module D). "Without credits" shows the gross CO₂ of each mix; "With credits" applies the credits each article itself declares (the number next to it counts the mixes that change). When an article only publishes the value with credits, that mix is left out of «Without credits» and only appears in «With credits».',
      baseNote: 'Filters the whole page by the binder of each mix. "Portland cement" covers blended cements, partial cement replacement by supplementary materials (fly ash, slag, calcined clay, silica fume), UHPC, reinforced concrete and recycled-aggregate concrete. Left out are mixes without Portland clinker as the main binder: geopolymers and alkali-activated binders, calcium sulfoaluminate, magnesium cements, gypsum composites and timber. The funnel counts articles, not mixes, and does not change with the filter; the same holds for the units chart.',
      scatterTitle: 'Strength × carbon footprint',
      scatterP: '{N} comparable per-m³ pairs — mixes/formulations whose absolute CO₂ value and compressive strength are published by the article itself, in the same table. Whole-structure totals (a building, a bridge) are left out, since they are not the same unit of analysis.',
      scatterXLabel: 'compressive strength (MPa)',
      scatterYLabel: 'CO₂ (kg/m³)',
      forestTitle: 'ci by material family',
      forestP: 'ci = CO₂ ÷ strength, in kg CO₂-eq per m³·MPa — the lower, the more efficient the material per unit of strength delivered. Point against point in the chart above.',
      forestToggleHint: 'tap a family to see the studies behind it',
      forestTitleCit: 'ci_t by material family',
      forestPCit: 'ci_t = ci ÷ service life, in kg CO₂-eq per m³·MPa·year — the lower, the less carbon per unit of strength and per year of service. Every pair has a ci_t: the service life is assumed by us when the article does not state it ({n} of {total} pairs in this filter).',
      forestP_cit: 'Service life by hierarchy: stated by the study, otherwise cited by it, otherwise the design life of the standard for the application (EN 1990, NBR 15575) and, with no identifiable application, 50 years.',
      forestP_citf: 'Sensitivity: mean service life of the family (values coming from the studies, one vote per study).',
      forestP_citm: 'Sensitivity: mean service life of the family using only values computed by the studies themselves (durability model or test).',
      forestP_citn: 'Sensitivity: mean service life of the family using only standard-based values (stated or cited from a standard and, otherwise, the standard for the application).',
      forestMetricCi: 'ci',
      forestMetricCit: 'ci_t (hierarchy)',
      forestMetric_citf: 'ci_t · family mean',
      forestMetric_citm: 'ci_t · family, models only',
      forestMetric_citn: 'ci_t · family, standards only',
      forestAnos: 'yr',
      forestLegModelo: 'multilevel model estimate with 95% CI',
      forestLegMediana: 'median of the pairs',
      forestLegIP: '95% prediction interval (all materials)',
      forestModeloNota: 'The diamond is the weighted mean of the multilevel model (rma.mv, REML, R package metafor; studies and mixes as random effects), refitted for the chosen filters; the bar is its 95% confidence interval. The open circle is the median of the pairs and the open square their simple (unweighted) mean; switch them on and off in the legend. Model of {data}.',
      forestSemModelo: 'no model estimate for this family under this filter (too few studies)',
      forestTipMediana: 'median',
      forestTipIP: '95% prediction interval',
      forestLegMedia: 'simple mean of the pairs',
      forestTipMedia: 'simple mean',
      forestMarcasAria: 'Markers shown in the forest plot',
      forestOverall: 'ALL MATERIALS',
      forestSemLabel: 'study with no citation available',
      subfamLang: 'en',
      subfamInfoLabel: 'What is this subfamily (reference standard)',
      baseInfoLabel: 'What each binder-base option includes',
      co2InfoLabel: 'What CO₂ without and with credits means',
      noteTitle: 'About the indicator',
      noteP: "This meta-analysis's official outcome is ci_t = ci ÷ design service life (kg CO₂-eq per m³·MPa·year). Service life is an assumption stated by the article itself in only 118 of the 468 articles (25%), so the dashboard shows the ci indicator, which covers every pair; ci_t is estimated separately on the subset with a service life (mean 0.163 kg CO₂-eq per m³·MPa·year, 91 studies). Methodology from Damineli et al. (2010). A multilevel (REML) random-effects model treats each formulation as its own observation, nested within its source study.",
      footerCite: "Part of a master's dissertation in Urban Infrastructure Systems (PUC-Campinas), on the Life Cycle Assessment of ultra-high-performance concrete (UHPC).",
      cats: {
        geopolimero: 'Geopolymer / alkali-activated',
        uhpc: 'UHPC',
        scm: 'SCM (fly ash, slag, silica fume)',
        reciclado: 'Recycled aggregate',
        opc: 'Portland cement (reference)',
        ligantes: 'Alternative binders',
        biobase: 'Bio-based',
        concreto_armado: 'Reinforced concrete (includes steel)'
      },
      catsDesc: {
        geopolimero: '100% alkali-activated binder — no Portland cement; a precursor (fly ash, slag, etc.) reacts with an alkaline activator to form the entire matrix.',
        uhpc: 'Ultra-high-performance concrete — very dense matrix, low water/binder ratio, fibers and selected fine aggregates.',
        scm: 'Portland cement to which the study itself adds fly ash, slag, silica fume or another addition in the mix — the main binder is still cement.',
        reciclado: 'Conventional concrete with coarse and/or fine aggregate fully or partially replaced by recycled material (e.g. construction and demolition waste).',
        opc: 'Concrete made with a commercial cement as sold (CP I to CP V, CEM I to CEM V, ASTM, PLC…), even if blended — the baseline for comparison. Tap to see the subfamilies by cement type.',
        ligantes: "Non-conventional binders that don't fit the other families (e.g. sulfur, magnesium or sulfoaluminate-based cements).",
        biobase: 'Materials with a biological/plant-based component as a relevant structural part (e.g. natural fiber, biochar).',
        concreto_armado: 'Reinforced concrete element — the value includes the contribution of reinforcing steel, not just the concrete.'
      },
      tooltipCi: 'ci',
      mapaTitle: "Where the included articles come from",
      mapaP: "Country of the corresponding author of each article accepted in the review (Web of Science, BDTD, Crossref or the PDF's own first page). Darker means more articles. Hover over a country to see the count.",
      univLabel: "Universe",
      univTodos: "All accepted articles",
      univMeta: "Meta-analysis studies only",
      mapaAria: "World map with the number of articles per country of the corresponding author",
      mapaLegenda: "Articles per country",
      mapaTipN: "{n} articles",
      mapaTipMeta: "{n} with an fck × CO₂ pair in the panel",
      mapaResumo: "{n} articles from {p} countries.",
      mapaErro: "Could not load the map data.",
      mapaVerTodos: "Show all {n} countries",
      mapaVerMenos: "Show only the top 15",
      redeTitle: "Timeline and citations between the articles",
      redeP: "Each dot is an article, placed in its publication year. Each line links an article to another article of this same review that it cites in its reference list (source: Crossref). Hover over a dot to highlight what it cites and who cites it; click to pin its card (you can pin several and unpin them with ×).",
      redeAria: "Timeline of the included articles with the citation links between them",
      redeTipCita: "cites {n} in this review",
      redeTipCitado: "cited by {n}",
      redeTipSemRefs: "No reference list in Crossref (e.g. theses).",
      redeTipExt: "Data sources cited:",
      redeResumo: "{n} articles and {l} citation links. {s} articles have no reference list in Crossref (mostly theses and dissertations), so they cannot show what they cite.",
      redeLegMeta: "with a pair in the panel",
      redeLegOutro: "without a pair in the panel",
      redeLegLig: "cites",
      redePinFechar: "Unpin",
      unitChartTitle: 'Reported CO₂ units',
      unitChartP: "How each study reports its carbon footprint — not always in kg CO₂-eq per m³. \"Native\" is the value as the author already published it; \"converted by us\" is computed from a different quantity the article itself prints (e.g. a total divided by the element's volume). The grey bars are units that cannot be turned into kg CO₂-eq/m³ without assuming a figure the article does not print (density, volume, mix design); they were reread in full and stay outside the meta-analysis. The hatched bar gathers values already in kg/m³ that were excluded — click it to see each row and the reason.",
      unitChartKindNativo: 'kg CO₂-eq/m³ — native (published as such)',
      unitChartKindDerivado: 'kg CO₂-eq/m³ — converted by us',
      unitChartKindPendente: 'not convertible without assuming data (outside the meta-analysis)',
      unitChartKindExcluido: 'in kg/m³, but excluded from the analysis',
      unitExcluidoBar: 'kg CO₂-eq/m³ — excluded (inconsistent or incomplete value)',
      unitExcluidoHint: 'Click to see each excluded row and the reason',
      unitExcluidoCols: ['Study', 'Mix', 'fck (MPa)', 'Recorded CO₂', 'Reason for exclusion'],
      unitCats: {
        m2: 'per m² of built area',
        tonelada: 'per tonne of material',
        kg: 'per kg of ingredient',
        elemento: 'per whole structural element',
        metro_linear: 'per linear meter',
        ja_mpa: 'index already normalized by MPa',
        especime: 'per test specimen',
        energia: 'per MJ of stored energy',
        sem_referencia: 'no reference unit printed',
        outro: 'other / unclassified'
      },
      a4Label: 'TRANSPORT TO SITE (A4)',
      a4Title: 'How much does concrete transport weigh on ci?',
      a4P: 'Most studies stop at the factory gate (A1–A3) and leave out the transport of concrete to site (A4). Pick the distance, the vehicle and the emission factor: A4 = SIDAC factor × concrete density × distance is added to the CO₂ of the pairs whose study is known not to include it, and ci is recalculated. The model is refitted for each combination.',
      a4DistLabel: 'distance plant → site',
      a4ModoLabel: 'vehicle (SIDAC)',
      a4FacLabel: 'emission factor',
      a4Prov: 'include the pairs where A4 is only probably excluded',
      a4Modo_betoneira: 'Truck mixer',
      a4Modo_truck_3e: '3-axle truck',
      a4Modo_carreta_4e: '4-axle trailer',
      a4Modo_carreta_5e: '5-axle trailer',
      a4KpiPares: 'pairs with A4 added (of those shown)',
      a4KpiA4: 'mean A4 added, kg CO₂-eq/m³',
      a4KpiCi0: 'median ci without A4',
      a4KpiCi1: 'median ci with A4',
      a4KpiMu: 'model: ci with A4 [95% CI]',
      a4KpiDif: 'model: change vs. without A4',
      a4EixoX: 'distance (km)',
      a4EixoY: 'model ci',
      a4SemModelo: 'no model estimate for this combination',
      a4Nota: 'SIDAC factors per t·km: truck mixer 0.10, 3-axle truck and 4-axle trailer 0.07, 5-axle trailer 0.06 kg CO₂-eq (no empty return). Density read from the paper or, if not stated, 2,400 kg/m³. The live numbers follow the filters at the top; the model is always the main stratum, CO₂ without credits, all binders ({k} pairs, {estudos} studies; without A4: {ref}), with one model fit for every kilometre from 0 to 300 km, for each vehicle and factor. The ×1.5 and ×2.5 factors cover the larger factors used in the literature (ecoinvent, NREL).'
    },

    ZH: {
      kicker: '研究 · 实时面板',
      title: '碳足迹 × 强度：论文的荟萃分析',
      lead: '本面板实时展示我硕士论文所依托的系统性文献综述的数据提取进度——比较低碳混凝土、再生骨料混凝土与超高性能混凝土（UHPC）的抗压强度与碳足迹。数字会随着每篇文献的阅读而更新。',
      navBack: '← kielima.com',
      navDb: '数据库',
      navPrisma: 'PRISMA 流程图',
      kpiFunilLabel: '已通过全部4个阶段的入选文献',
      kpiQualidadeLabel: '其中质量较高（≥ 4.0）',
      kpiParesLabel: '已提取的强度×CO₂数据对',
      kpiVidaLabel: '已注明设计使用寿命',
      kpiReleituraLabel: '纳入元分析的有数据对研究',
      kpiCompletoLabel: '已入选文献中强度与CO₂均已提取的比例',
      funnelLabel: '筛选',
      funnelTitle: '筛选漏斗：从5,093条记录到466篇文献',
      funnelP: '系统综述在文献进入荟萃分析之前要经过四个阶段：元数据、通读全文PDF、材料的地域限制，最后是方法学质量。每一条柱状图显示从检索收集到的全部记录出发，有多少文献在每个阶段存活下来。',
      funnelStages: {
        universo: '完整数据库（检索结果，已去重）',
        e1: '第1阶段——元数据（年份、文献类型、可模塑材料、建筑用途）',
        e2: '第2阶段——通读全文PDF（注明抗压强度与CO₂/生命周期评估）',
        e3: '第3阶段——材料不受地域限制',
        e4: '第4阶段——方法学质量（最终结果）'
      },
      funnelRevisaoNote: '另有58篇文献属于没有自身生命周期评估的综述——不计入ci指标，但仍保留在数据库中，作为PRISMA引文分支：这些综述所引用的原始研究是潜在的候选文献。',
      funnelToggleHint: '点击每个阶段查看排除标准',
      funnelDbChartTitle: '去重之前，各数据库的记录数',
      qualityCriteriaProposto: '拟议中——尚未评分',
      qualityCriteria: {
        QA: { label: '功能单位', desc: '功能单位已明确声明，且没有歧义。' },
        QB: { label: '分析方法', desc: '已注明所用的影响评估方法（LCIA）。' },
        QC: { label: '数据来源', desc: '已注明所用的清单数据库。' },
        QD: { label: '使用寿命', desc: '已声明使用寿命（构成ci_t指标功能单位的一部分）。' },
        QE: { label: '系统边界', desc: '已明确系统的边界范围（例如摇篮到大门、摇篮到坟墓）。' },
        QF: { label: 'CO₂与强度的配对', desc: 'ci比值中的两个数值属于同一配方，而非不同配方或不同口径拼凑而成。' },
        QG: { label: '已声明的离散程度/置信区间', desc: '文章提供了计算该配方ci置信区间所需的信息——只计入文章本身测量得到的离散程度，不计入引用自其他研究的数值。' }
      },
      funnelDetails: {
        universo: '检索共收集5,093条记录。其中2,630条（51.6%）为重复记录，在任何筛选之前已被移除。1,932条在随后四个阶段中被剔除——详见下方各阶段柱状图。7条从未能获取全文（无法访问）。剩余528条——470篇入选文献+58篇无自身生命周期评估的综述——全部进入第4阶段。',
        e1: '在按元数据（年份、文献类型、可模塑材料、建筑用途）筛选的2,463条记录中，2,191条被接受。被排除的272条中：190条因不属于建筑用途，71条因材料不可模塑，9条因文献类型，1条因发表年份——同一记录可能同时不符合多项标准。',
        e2: '在通读全文PDF的2,185篇文献中，542篇被接受。被排除的1,643篇中：1,303篇未报告可与自身CO₂配对的自身抗压强度，442篇未报告有绝对数值的CO₂/生命周期评估结果——部分文献两项标准都未满足。',
        e3: '在评估材料地域限制的538篇文献中，524篇被接受；14篇因主要材料受地域限制（例如某地区高度集中的生产副产品）而被排除。',
        e4: '在第4阶段（7项清单，0至7分）评估的524篇文献中：362篇构成主要结果（得分≥4.0），104篇仅用于敏感性分析（得分<4.0），58篇是没有自身生命周期评估的综述——不计入ci指标得分，但作为PRISMA引文分支的来源（这些综述引用的原始研究）。'
      },
      tierLabel: '质量分层',
      tierTitle: '主要结果 × 敏感性分析',
      tierP: '第4阶段为每篇入选文献的质量打分（0-7分，七个项目）。得分最高的三分之二构成荟萃分析的主要结果；得分最低的三分之一仍属入选文献，但只用于敏感性分析。在顶部固定栏（「质量」）中切换各组即可对比。',
      tierPrincipal: '质量最优三分之二（得分 ≥ 4.0）',
      tierSensibilidade: '质量最弱三分之一 —— 仅用于敏感性分析（得分 < 4.0）',
      tierBarLabel: '质量',
      tierPrincipalCurto: '质量较优（≥ 4.0）',
      tierSensCurto: '最弱三分之一（< 4.0）',
      baseLabel: '胶凝材料基础',
      baseTodos: '全部材料',
      basePortland: '仅硅酸盐水泥',
      co2Label: '文章中的CO₂',
      co2Sem: '不扣减',
      co2Com: '扣减',
      co2Note: '部分文章会从混凝土的CO₂中扣除并非来自生产的抵扣项：避免的负担（不再需要的水泥、骨料或填埋）、使用期碳化、储存的生物碳或寿命末期回收（模块D）。“不扣减”显示每个配合比的总CO₂；“扣减”应用文章自身声明的抵扣（旁边的数字为会改变的配合比数量）。若文章只公布扣减后的数值，该配合比在“不扣减”情景中不显示，只在“扣减”情景中出现。',
      baseNote: '按每个配合比的胶凝材料筛选整个页面。"硅酸盐水泥"包括复合水泥、以掺合料（粉煤灰、矿渣、煅烧黏土、硅灰）部分替代水泥、UHPC、钢筋混凝土和再生骨料混凝土。不包括不以硅酸盐熟料为主要胶凝材料的配合比：地聚合物和碱激发胶凝材料、硫铝酸盐水泥、镁质水泥、石膏复合材料和木材。筛选漏斗统计的是文献而非配合比，不随筛选变化；单位图也是如此。',
      scatterTitle: '强度 × 碳足迹',
      scatterP: '{N} 对可比的每立方米数据——配合比/配方，其CO₂绝对值与抗压强度由文章本身在同一表格中公布。整体结构（建筑、桥梁）的总量不计入，因为它们的分析单位不同。',
      scatterXLabel: '抗压强度（MPa）',
      scatterYLabel: 'CO₂（kg/m³）',
      forestTitle: '各材料类别的ci指标',
      forestP: 'ci = CO₂ ÷ 强度，单位为每 m³·MPa 的 kg CO₂ 当量——数值越低，材料每单位强度的效率越高。与上方图表逐点对应。',
      forestToggleHint: '点击某个类别，查看构成该类别的研究',
      forestTitleCit: '各材料类别的ci_t指标',
      forestPCit: 'ci_t = ci ÷ 使用年限，单位为每 m³·MPa·年的 kg CO₂ 当量——数值越低，每单位强度、每年的碳越少。所有数据对都有 ci_t：文献未声明使用年限时由我们假定（此筛选下 {total} 个数据对中的 {n} 个）。',
      forestP_cit: '按层级确定使用年限：研究自身声明，其次研究引用，其次按应用场景取标准的设计使用年限（EN 1990、NBR 15575），无法确定应用时取50年。',
      forestP_citf: '敏感性分析：该类别的平均使用年限（取自各研究，每项研究一票）。',
      forestP_citm: '敏感性分析：该类别仅用研究自身计算（耐久性模型或试验）得到的平均使用年限。',
      forestP_citn: '敏感性分析：该类别仅用基于标准的平均使用年限（声明或引用的标准值，否则按应用场景取标准值）。',
      forestMetricCi: 'ci',
      forestMetricCit: 'ci_t（层级）',
      forestMetric_citf: 'ci_t · 类别平均',
      forestMetric_citm: 'ci_t · 类别，仅模型',
      forestMetric_citn: 'ci_t · 类别，仅标准',
      forestAnos: '年',
      forestLegModelo: '多层模型估计值及95%置信区间',
      forestLegMediana: '数据对的中位数',
      forestLegIP: '95%预测区间（所有材料）',
      forestModeloNota: '菱形为多层模型的加权均值（rma.mv，REML，R语言metafor包；研究和配合比作为随机效应），按所选筛选条件重新拟合；横线为其95%置信区间。空心圆为数据对的中位数，空心方块为其简单（不加权）平均值；可在图例中开启或关闭。模型日期：{data}。',
      forestSemModelo: '此筛选下该类别无模型估计值（研究太少）',
      forestTipMediana: '中位数',
      forestTipIP: '95%预测区间',
      forestLegMedia: '数据对的简单平均值',
      forestTipMedia: '简单平均值',
      forestMarcasAria: '森林图中显示的标记',
      forestOverall: '所有材料',
      forestSemLabel: '无引用信息的研究',
      subfamLang: 'zh',
      subfamInfoLabel: '该子类说明（参考标准）',
      baseInfoLabel: '胶凝材料基础各选项包含的内容',
      co2InfoLabel: '不含与含抵扣的CO₂是什么意思',
      noteTitle: '关于该指标',
      noteP: '本荟萃分析的官方结果指标是 ci_t = ci ÷ 设计使用寿命（每 m³·MPa·年的 kg CO₂ 当量）。466篇文献中只有118篇（25%）将使用寿命作为自身假设明确给出，因此面板显示覆盖全部数据对的 ci 指标；ci_t 在有使用寿命的子集中单独估计（均值 0.163 kg CO₂ 当量/(m³·MPa·年)，91 项研究）。方法源自 Damineli 等（2010）。多层级（REML）随机效应模型将每个配方视为独立观测值，嵌套于其来源研究之下。',
      footerCite: '硕士论文（PUC-Campinas，城市基础设施系统专业）的一部分，研究超高性能混凝土（UHPC）的生命周期评估。',
      cats: {
        geopolimero: '地聚合物/碱激发',
        uhpc: '超高性能混凝土（UHPC）',
        scm: '矿物掺合料（粉煤灰/矿渣/硅灰）',
        reciclado: '再生骨料',
        opc: '硅酸盐水泥（对照）',
        ligantes: '替代胶凝材料',
        biobase: '生物基材料',
        concreto_armado: '钢筋混凝土（含钢材）'
      },
      catsDesc: {
        geopolimero: '100%碱激发胶凝材料——不含硅酸盐水泥；前驱体（粉煤灰、矿渣等）与碱性激发剂反应，形成全部基体。',
        uhpc: '超高性能混凝土——基体致密、水胶比低，含纤维和精选细骨料。',
        scm: '研究本身在配合比中向硅酸盐水泥加入粉煤灰、矿渣、硅灰或其他掺合料——主要胶凝材料仍是水泥。',
        reciclado: '常规混凝土，粗骨料和/或细骨料部分或全部替换为再生材料（如建筑废料）。',
        opc: '使用市售水泥（CP I至CP V、CEM I至CEM V、ASTM、石灰石水泥等）配制的混凝土，即使是复合水泥——作为比较基准。点击查看按水泥类型划分的子类。',
        ligantes: '不属于其他类别的非常规胶凝材料（如硫基、镁基或硫铝酸盐基水泥）。',
        biobase: '含有生物/植物来源成分作为重要结构部分的材料（如天然纤维、生物炭）。',
        concreto_armado: '钢筋混凝土构件——数值包含钢筋的贡献，不仅是混凝土本身。'
      },
      tooltipCi: 'ci',
      mapaTitle: "纳入文献的来源国家",
      mapaP: "每篇纳入综述的文献的通讯作者所在国家（来源：Web of Science、BDTD、Crossref或PDF首页）。颜色越深，文献越多。将鼠标悬停在国家上可查看数量。",
      univLabel: "范围",
      univTodos: "所有纳入文献",
      univMeta: "仅荟萃分析研究",
      mapaAria: "按通讯作者国家统计文献数量的世界地图",
      mapaLegenda: "各国文献数",
      mapaTipN: "{n}篇文献",
      mapaTipMeta: "其中{n}篇在面板中有fck × CO₂数据对",
      mapaResumo: "来自{p}个国家的{n}篇文献。",
      mapaErro: "无法加载地图数据。",
      mapaVerTodos: "显示全部{n}个国家",
      mapaVerMenos: "仅显示前15个",
      redeTitle: "时间线与文献间的引用关系",
      redeP: "每个点代表一篇文献，按发表年份排列。每条线连接一篇文献与其参考文献中引用的本综述内另一篇文献（来源：Crossref）。将鼠标悬停在点上可突出显示其引用和被引用关系；点击可固定卡片（可同时固定多张，点击 × 取消固定）。",
      redeAria: "纳入文献的时间线及其相互引用关系",
      redeTipCita: "引用本综述中{n}篇",
      redeTipCitado: "被引用{n}次",
      redeTipSemRefs: "Crossref中无参考文献列表（如学位论文）。",
      redeTipExt: "所引用的数据来源：",
      redeResumo: "{n}篇文献，{l}条引用关系。{s}篇文献在Crossref中没有参考文献列表（主要是学位论文），因此无法显示其引用。",
      redeLegMeta: "面板中有数据对",
      redeLegOutro: "面板中无数据对",
      redeLegLig: "引用",
      redePinFechar: "取消固定",
      unitChartTitle: '报告的CO₂单位',
      unitChartP: '每项研究报告碳足迹的方式并不总是每立方米kg CO₂当量。"原始"指作者本身就是这样公布的数值；"我们换算的"是根据文章本身给出的另一个量计算得出（例如总量除以构件体积）。灰色各栏是不假设文章未给出的数据（密度、体积、配合比）就无法换算为每立方米kg CO₂当量的单位；均已全文重读，不纳入荟萃分析。斜纹栏汇总了已为kg/m³但被排除的数值——点击即可查看每一条记录及原因。',
      unitChartKindNativo: 'kg CO₂-eq/m³ —— 原始（本就这样公布）',
      unitChartKindDerivado: 'kg CO₂-eq/m³ —— 我们换算的',
      unitChartKindPendente: '不假设数据就无法换算（不纳入荟萃分析）',
      unitChartKindExcluido: '单位为kg/m³，但已排除在分析之外',
      unitExcluidoBar: 'kg CO₂-eq/m³ —— 已排除（数值不一致或不完整）',
      unitExcluidoHint: '点击查看每一条被排除的记录及原因',
      unitExcluidoCols: ['研究', '配合比', 'fck (MPa)', '记录的CO₂', '排除原因'],
      unitCats: {
        m2: '每平方米建筑面积',
        tonelada: '每吨材料',
        kg: '每千克原料',
        elemento: '每个完整结构构件',
        metro_linear: '每延米',
        ja_mpa: '已按MPa归一化的指标',
        especime: '每个试件/试样',
        energia: '每兆焦储存能量',
        sem_referencia: '未给出参考单位',
        outro: '其他/未分类'
      },
      a4Label: '运至工地 (A4)',
      a4Title: '混凝土运输对ci的影响有多大？',
      a4P: '大多数研究的系统边界止于工厂大门（A1–A3），不计混凝土运至工地的运输（A4）。请选择距离、车辆和排放因子：A4 = SIDAC因子 × 混凝土密度 × 距离，加到确知未包含A4的研究数据对的CO₂上，并重新计算ci。每种组合都会重新拟合模型。',
      a4DistLabel: '搅拌站 → 工地距离',
      a4ModoLabel: '车辆（SIDAC）',
      a4FacLabel: '排放因子',
      a4Prov: '包括仅“可能”未计A4的数据对',
      a4Modo_betoneira: '混凝土搅拌车',
      a4Modo_truck_3e: '三轴卡车',
      a4Modo_carreta_4e: '四轴挂车',
      a4Modo_carreta_5e: '五轴挂车',
      a4KpiPares: '已加A4的数据对（当前显示）',
      a4KpiA4: '平均加入的A4，kg CO₂-eq/m³',
      a4KpiCi0: '不含A4的ci中位数',
      a4KpiCi1: '含A4的ci中位数',
      a4KpiMu: '模型：含A4的ci [95% CI]',
      a4KpiDif: '模型：相对不含A4的变化',
      a4EixoX: '距离（km）',
      a4EixoY: '模型ci',
      a4SemModelo: '该组合没有模型估计',
      a4Nota: 'SIDAC每t·km因子：搅拌车0.10，三轴卡车和四轴挂车0.07，五轴挂车0.06 kg CO₂-eq（不含空车返程）。密度取自论文，未说明时取2,400 kg/m³。实时数字随顶部筛选变化；模型始终为主层、不含抵扣的CO₂、全部胶凝材料（{k}个数据对，{estudos}项研究；不含A4：{ref}），每个车辆和因子在0至300 km之间每公里单独拟合一次模型。×1.5和×2.5覆盖文献中更大的因子（ecoinvent、NREL）。'
    }
  };

  /* ---------------------------------------------------------- utilidades */

  function median(arr) {
    var s = arr.slice().sort(function (a, b) { return a - b; });
    var n = s.length;
    if (!n) return null;
    var mid = Math.floor(n / 2);
    return n % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }

  function mean(arr) {
    if (!arr.length) return null;
    var t = 0;
    arr.forEach(function (v) { t += v; });
    return t / arr.length;
  }

  /* Marcas do forest que se podem ligar e desligar na legenda (Kiê,
     2026-10-17): a mediana dos pares (ligada por omissão) e a média simples
     dos pares (desligada). Só escondem a marca secundária: numa linha sem
     estimativa do modelo a mediana é a própria estimativa e fica sempre. */
  var MARCAS_KEY = 'kl-meta-forest-marcas';
  var forestMarcas = { mediana: true, media: false };
  try {
    var savedM = JSON.parse(window.localStorage.getItem(MARCAS_KEY) || 'null');
    if (savedM && typeof savedM === 'object') {
      if (typeof savedM.mediana === 'boolean') forestMarcas.mediana = savedM.mediana;
      if (typeof savedM.media === 'boolean') forestMarcas.media = savedM.media;
    }
  } catch (e) {}

  function svgEl(tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  /* Posiciona um tooltip perto do cursor sem deixá-lo sair da caixa do
     gráfico — os marcos de correção ficam sempre no fim da linha do tempo,
     então sem isto o card abria cortado na borda direita. */
  function escHtml(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function positionTooltip(tooltip, wrap, ev) {
    var box = wrap.getBoundingClientRect();
    var relX = ev.clientX - box.left;
    var relY = ev.clientY - box.top;
    var tw = tooltip.offsetWidth || 260;
    var left = relX + 14;
    if (left + tw > box.width) left = Math.max(0, relX - tw - 14);
    tooltip.style.left = left + 'px';
    tooltip.style.top = (relY + 10) + 'px';
  }

  function fmtInt(n, lang) {
    var sep = lang === 'EN' ? ',' : '.';
    var s = String(Math.round(n));
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var fromEnd = s.length - i;
      out += s[i];
      if (fromEnd > 1 && fromEnd % 3 === 1) out += sep;
    }
    return out;
  }

  /* -------------------------------------------------------- gráfico: kpi */

  var KPI_VALUES = {
    funil: 466,
    vida: 118,
    /* Kiê (2026-10-17): o quadrado «64/68 lotes da releitura» (valor à mão de 08/09, nunca actualizado)
       passa a mostrar os estudos com pelo menos um par no painel: 401 em 2026-10-17 (estudos distintos
       em dados_metanalise.csv).
       Snapshot: actualizar com os pares do painel. */
    releitura: 398,
    /* % de artigos Elegível com pelo menos um par fck+CO2 completo em
       dados_fck, sobre o total de artigos Elegível que ainda podem vir a
       ter um (exclui os que, por desenho, nunca terão par próprio -- as
       revisões bibliográficas aceites pela regra da Kie de 2026-09-14,
       cujos dados vêm da extração das fontes secundárias citadas, ainda
       pendente -- ver PROMPT_E2.md no repositório da RSL). Snapshot
       manual em 2026-09-16 (era 74% em 2026-09-14): 598 Elegível ao vivo,
       2 isentas (linhas 3001 e 3163), 467 dos 596 restantes com par
       completo = 78% -- subida reflete a tarefa de 22 lotes de
       preenchimento de lacunas fck/CO2 fechada nesta sessão (PRs #204,
       #206, #207 da RSL, mais as 4 correções pontuais dos PRs #208-#211).
       Snapshot 2026-09-26 (fim dos 14 achados CI_MPA): 537 Elegível, 2
       isentas, 458 dos 535 com par completo = 86%. funil = 535 Elegível que
       passaram as 4 etapas (3001 e 3163, revisões aceites a 2026-09-14,
       ainda sem E3/E4; 2687 e 4931 pontuados a 2026-09-26). vida = artigos Elegível com vida_util_anos em
       dados_fck.
       Atualizar à mão sempre que um lote de extração ou uma promoção
       Inconclusivo→Elegível avançar, mesmo espírito das demais
       KPI_VALUES.
       Snapshot 2026-10-11 (Kiê perguntou porque 86%): o 86% era o de
       26/09 e ficou desactualizado. Ao vivo: 392 dos 521 Elegível têm pelo
       menos um par no painel = 75%; os outros 129 têm fck e CO2 no artigo
       mas sem forma de chegar a kg CO2-eq/m3 sem assumir nada (CO2 por
       tonelada/kg sem massa volúmica, por m2 ou edifício inteiro, CO2 só
       de parte do betão…) -- ver metanalise/DECISOES_METANALISE.md, F13.
       Snapshot 2026-10-11 (releitura dos 129, F14): 3222 ZHANG desdobrada e
       3095 TEFA, 3170 SAMUVEL e 3237 KANAGARAJ ganham pares -> 396 dos 521
       = 76%.
       Snapshot 2026-10-15 (F17/F18): JATIVA e ALBERTI rejeitadas em E2_co2 e
       48 artigos cujo CO2 nao se converte para o betao (edificio/sistema
       sem volume, CO2 parcial ou sem kg) rejeitados em E2_co2 -> 471
       Elegivel; 403 com par no painel = 86%. vida = 119 Elegivel com
       vida_util_anos. 5046 SILVA verificada depois (F18) -> 470 Elegivel,
       vida 118, 403/470 = 86%.
       Snapshot 2026-10-15 (F20): CHOI 4620 e MITOULIS 3691 rejeitados em
       E2_co2 (factor generico ICE, sem volume de betao) -> 468 Elegivel,
       vida 118, 403/468 = 86%.
       Snapshot 2026-10-16 (F26): PUSHKAR 4267 e 4580 rejeitados em E2_co2
       (cimento modelado com «cement mortar, at plant») -> 466 Elegivel,
       vida 118, 401/466 = 86%.
       Snapshot 2026-10-16 (F29): OH 4930 rejeitado em E2_co2 (factor
       generico de EPD) -> 465 Elegivel, vida 117, 400/465 = 86%.
       Snapshot 2026-10-16 (F30): factor generico citado = Aceito; OH 4930
       (259 kg/m3), CHOI 4620 e JATIVA 3069 voltam -> 468 Elegivel, vida 118,
       401/468 = 86%.
       F34 (2026-10-17): 2854 FILHO e 4027 TEH Duplicado, linha 655 (2695 JANG) retirada -> 466 Elegivel
       (362 + 104), 398 estudos com par. */
    completo: 86
  };

  function renderKPIs(lang) {
    /* Kiê (2026-10-11): ao lado dos aceites, os que ficaram depois da análise de
       qualidade (Etapa 4, score ≥ 4,0) -- mesmo número do funil. Desde 2026-10-16
       (Kiê) cada um tem o seu quadrado: são seis indicadores. */
    document.getElementById('kpi-funil').textContent = fmtInt(KPI_VALUES.funil, lang);
    document.getElementById('kpi-qualidade').textContent = fmtInt(FUNNEL[FUNNEL.length - 1].principal, lang);
    document.getElementById('kpi-pares').textContent = fmtInt(currentData().length, lang);
    document.getElementById('kpi-vida').textContent = fmtInt(KPI_VALUES.vida, lang);
    document.getElementById('kpi-releitura').textContent = fmtInt(KPI_VALUES.releitura, lang);
    document.getElementById('kpi-completo').textContent = KPI_VALUES.completo + '%';
  }

  function renderBaseCounts(lang) {
    var nAll = 0, nPort = 0;
    DATA.forEach(function (d) {
      if (!tierVisible[d[3]] || !scenarioMatches(d)) return;
      nAll++;
      if (d[5] === 'P') nPort++;
    });
    document.getElementById('base-n-todos').textContent = fmtInt(nAll, lang);
    document.getElementById('base-n-portland').textContent = fmtInt(nPort, lang);
    var nDesc = 0;
    DATA.forEach(function (d) {
      /* traços que mudam entre os cenários: valor diferente ou só com desconto */
      if (tierVisible[d[3]] && baseMatches(d) &&
          (d[7] === 1 || (d[6] !== null && d[6] !== undefined && d[6] !== d[1]))) nDesc++;
    });
    document.getElementById('co2-n-com').textContent = fmtInt(nDesc, lang);
  }

  function renderTierCounts(lang) {
    var nP = 0, nS = 0;
    DATA.forEach(function (d) {
      if (!baseMatches(d) || !scenarioMatches(d)) return;
      if (d[3] === 'p') nP++; else nS++;
    });
    document.getElementById('tier-n-p').textContent = fmtInt(nP, lang);
    document.getElementById('tier-n-s').textContent = fmtInt(nS, lang);
  }

  function renderScatterDesc(strings, lang) {
    document.getElementById('scatter-desc').textContent =
      strings.scatterP.replace('{N}', fmtInt(currentData().length, lang));
  }

  /* --------------------------------------------------- gráfico: funil */

  /* Persistido fora da função para sobreviver a renderFunnel ser chamada de
     novo (troca de idioma, toggle de estrato) sem fechar o que a pessoa já
     tinha aberto -- mesmo tratamento que activeCat/tierVisible dão ao
     estado da dispersão. */
  var funnelOpen = {};

  /* Funil clássico em trapézios (#1484, formato escolhido pela Kiê em
     2026-11-02): topo de cada faixa proporcional ao n da etapa, base ao n da
     seguinte; a última etapa termina em retângulo. Largura mínima de 24 px
     para o 466 não sumir. Rótulos à direita, fora da forma. */
  function renderFunnelTrap(strings, lang) {
    var svg = document.getElementById('funnel-trap');
    if (!svg) return;
    var NS = 'http://www.w3.org/2000/svg';
    svg.textContent = '';
    var t = document.createElementNS(NS, 'title');
    t.id = 'funnel-trap-title';
    t.textContent = strings.funnelTitle;
    svg.appendChild(t);
    var cx = 180, maxW = 340, minW = 24, bandH = 50, gap = 6, labelX = 380;
    var max = FUNNEL[0].n;
    function w(n) { return Math.max(minW, maxW * n / max); }
    FUNNEL.forEach(function (st, i) {
      var y = i * (bandH + gap) + 4;
      var w1 = w(st.n);
      var w2 = i < FUNNEL.length - 1 ? w(FUNNEL[i + 1].n) : w1;
      var poly = document.createElementNS(NS, 'polygon');
      poly.setAttribute('points', [
        (cx - w1 / 2) + ',' + y, (cx + w1 / 2) + ',' + y,
        (cx + w2 / 2) + ',' + (y + bandH), (cx - w2 / 2) + ',' + (y + bandH)
      ].join(' '));
      poly.setAttribute('fill', 'var(--green)');
      poly.setAttribute('fill-opacity', String(0.95 - i * 0.15));
      svg.appendChild(poly);
      var num = document.createElementNS(NS, 'text');
      num.setAttribute('x', labelX); num.setAttribute('y', y + 22);
      num.setAttribute('fill', 'var(--ink)');
      num.setAttribute('font-size', '20');
      num.setAttribute('font-weight', '600');
      num.textContent = fmtInt(st.n, lang);
      svg.appendChild(num);
      var lab = document.createElementNS(NS, 'text');
      lab.setAttribute('x', labelX); lab.setAttribute('y', y + 42);
      lab.setAttribute('fill', 'var(--ink-65)');
      lab.setAttribute('font-size', '13');
      lab.textContent = String(strings.funnelStages[st.key]).split(/ — | \(/)[0];
      svg.appendChild(lab);
    });
  }

  function renderFunnel(strings, lang) {
    var list = document.getElementById('funnel-list');
    list.textContent = '';
    var base = FUNNEL[0].n;

    FUNNEL.forEach(function (stage) {
      var isOpen = !!funnelOpen[stage.key];
      var row = document.createElement('div');
      row.className = 'funnel-row' + (isOpen ? ' is-open' : '');

      var head = document.createElement('button');
      head.type = 'button';
      head.className = 'funnel-head';
      head.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      var label = document.createElement('span');
      label.textContent = strings.funnelStages[stage.key];
      head.appendChild(label);
      var chevron = document.createElement('span');
      chevron.className = 'funnel-chevron';
      chevron.setAttribute('aria-hidden', 'true');
      chevron.textContent = '›';
      head.appendChild(chevron);
      head.addEventListener('click', function () {
        funnelOpen[stage.key] = !funnelOpen[stage.key];
        renderFunnel(i18n.strings(), i18n.current());
      });
      row.appendChild(head);

      var wrap = document.createElement('div');
      wrap.className = 'funnel-bar-wrap';
      var bar = document.createElement('div');
      bar.className = 'funnel-bar';
      /* A ultima etapa (com o desdobramento principal/sensibilidade) fica
         com largura pelo proprio conteudo -- os dois numeros escritos ja
         carregam a proporcao, e uma largura percentual apertaria "+132"
         a zero em telas estreitas (min-width:auto do flex item nao ajuda
         quando o pai tem overflow:hidden e uma largura fixa menor que a
         soma dos dois conteudos). Nas etapas anteriores, sem esse
         desdobramento, a largura proporcional ao universo continua. */
      if (stage.principal == null) {
        bar.style.width = Math.max(16, (stage.n / base) * 100) + '%';
      }

      /* Kiê (2026-10-11): o filtro de qualidade da barra fixa também vale
         para a Etapa 4 -- com o terço mais fraco desligado só fica o 409
         (e vice-versa). */
      var showP = stage.principal != null && tierVisible.p;
      var showS = stage.principal != null && tierVisible.s;
      if (showP) {
        var segP = document.createElement('div');
        segP.className = 'funnel-bar-seg funnel-bar-seg-principal';
        segP.style.flex = '1 1 auto';
        var segPVal = document.createElement('span');
        segPVal.className = 'funnel-bar-count';
        segPVal.textContent = fmtInt(stage.principal, lang);
        segP.appendChild(segPVal);
        bar.appendChild(segP);
      }
      if (showS) {
        var segS = document.createElement('div');
        segS.className = 'funnel-bar-seg funnel-bar-seg-sensibilidade';
        segS.style.flex = '0 0 auto';
        var segSVal = document.createElement('span');
        segSVal.className = 'funnel-bar-count';
        segSVal.textContent = (showP ? '+' : '') + fmtInt(stage.sensibilidade, lang);
        segS.appendChild(segSVal);
        bar.appendChild(segS);
      }
      if (stage.principal == null) {
        var seg = document.createElement('div');
        seg.className = 'funnel-bar-seg funnel-bar-seg-full';
        seg.style.flex = '1';
        var segVal = document.createElement('span');
        segVal.className = 'funnel-bar-count';
        segVal.textContent = fmtInt(stage.n, lang);
        seg.appendChild(segVal);
        bar.appendChild(seg);
      }
      wrap.appendChild(bar);
      row.appendChild(wrap);

      if (stage.principal != null) {
        var legend = document.createElement('div');
        legend.className = 'unit-legend';
        legend.style.marginBottom = '0';
        legend.style.paddingBottom = '0';
        legend.style.borderBottom = 'none';

        var pItem = document.createElement('span');
        pItem.className = 'unit-legend-item';
        var pSw = document.createElement('span');
        pSw.className = 'unit-swatch unit-swatch-nativo';
        pItem.appendChild(pSw);
        var pLbl = document.createElement('span');
        pLbl.textContent = strings.tierPrincipal + ' — ' + fmtInt(stage.principal, lang);
        pItem.appendChild(pLbl);
        if (showP) legend.appendChild(pItem);

        var sItem = document.createElement('span');
        sItem.className = 'unit-legend-item';
        var sSw = document.createElement('span');
        sSw.className = 'unit-swatch unit-swatch-derivado';
        sItem.appendChild(sSw);
        var sLbl = document.createElement('span');
        sLbl.textContent = strings.tierSensibilidade + ' — ' + fmtInt(stage.sensibilidade, lang);
        sItem.appendChild(sLbl);
        if (showS) legend.appendChild(sItem);

        row.appendChild(legend);
      }

      var detail = document.createElement('div');
      detail.className = 'funnel-detail';
      var detailText = document.createElement('p');
      detailText.className = 'funnel-detail-text';
      detailText.textContent = strings.funnelDetails[stage.key];
      detail.appendChild(detailText);
      if (stage.key === 'universo') {
        detail.appendChild(buildDbChart(strings, lang));
      }
      if (stage.key === 'e4') {
        detail.appendChild(buildQualityCriteriaList(strings));
      }
      row.appendChild(detail);

      list.appendChild(row);
    });
  }

  /* Lista dos itens do checklist de qualidade (QA-QF em vigor, QG proposto
     -- ver CRITERIOS_E_NUANCES_RSL.md no repositório da RSL) dentro do
     detalhe da etapa 4 -- pedido da Kie, 2026-09-12. QG fica visualmente
     distinto (rótulo "proposto") porque, ao contrário de QA-QF, ainda não
     é pontuado em nenhuma linha. */
  function buildQualityCriteriaList(strings) {
    var wrap = document.createElement('div');
    wrap.className = 'quality-criteria';

    QUALITY_CRITERIA.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'quality-criteria-row' + (item.proposto ? ' is-proposto' : '');

      var head = document.createElement('div');
      head.className = 'quality-criteria-head';
      var code = document.createElement('span');
      code.className = 'quality-criteria-code';
      code.textContent = item.key;
      head.appendChild(code);
      var label = document.createElement('span');
      label.className = 'quality-criteria-label';
      label.textContent = strings.qualityCriteria[item.key].label;
      head.appendChild(label);
      if (item.proposto) {
        var tag = document.createElement('span');
        tag.className = 'quality-criteria-tag';
        tag.textContent = strings.qualityCriteriaProposto;
        head.appendChild(tag);
      }
      row.appendChild(head);

      var desc = document.createElement('p');
      desc.className = 'quality-criteria-desc';
      desc.textContent = strings.qualityCriteria[item.key].desc;
      row.appendChild(desc);

      wrap.appendChild(row);
    });

    return wrap;
  }

  /* Sub-gráfico dentro do detalhe da etapa "universo" -- pedido da Kie
     (2026-09-12): mesmos números do slide 22 de /ppt/dissertacao/ (registos
     por base de dados, antes da remoção de duplicatas), mas em ordem
     invertida em relação ao slide -- maior no topo, menor embaixo -- e no
     mesmo estilo de barra (bordada/tintada) das etapas do funil acima. */
  function buildDbChart(strings, lang) {
    var wrap = document.createElement('div');
    wrap.className = 'db-chart';

    var title = document.createElement('div');
    title.className = 'db-chart-title';
    title.textContent = strings.funnelDbChartTitle;
    wrap.appendChild(title);

    var listEl = document.createElement('div');
    listEl.className = 'db-chart-list';
    var sorted = DB_SOURCES.slice().sort(function (a, b) { return b.n - a.n; });
    var max = sorted[0].n;

    sorted.forEach(function (db) {
      var row = document.createElement('div');
      row.className = 'db-chart-row';

      var label = document.createElement('div');
      label.className = 'db-chart-label';
      label.textContent = db.label;
      row.appendChild(label);

      var barWrap = document.createElement('div');
      barWrap.className = 'db-chart-bar-wrap';
      var bar = document.createElement('div');
      bar.className = 'db-chart-bar';
      bar.style.width = (db.n / max) * 100 + '%';
      var count = document.createElement('span');
      count.className = 'db-chart-count';
      count.textContent = fmtInt(db.n, lang);
      bar.appendChild(count);
      barWrap.appendChild(bar);
      row.appendChild(barWrap);

      listEl.appendChild(row);
    });

    wrap.appendChild(listEl);
    return wrap;
  }

  /* ----------------------------------------------------- gráfico: dispersão */

  var activeCat = null; // null = todas visíveis

  function renderScatter(strings) {
    var svg = document.getElementById('scatter-svg');
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var W = 760, H = 460;
    var padL = 44, padR = 14, padT = 14, padB = 34;
    var innerW = W - padL - padR, innerH = H - padT - padB;

    var maxX = 220, maxY = 4500, minY = -450;

    function x(v) { return padL + (Math.min(v, maxX) / maxX) * innerW; }
    function y(v) { return padT + innerH - ((Math.min(v, maxY) - minY) / (maxY - minY)) * innerH; }

    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

    // grade + eixos
    var xt = [0, 50, 100, 150, 200];
    xt.forEach(function (v) {
      var xx = x(v);
      svg.appendChild(svgEl('line', { x1: xx, x2: xx, y1: padT, y2: padT + innerH, class: 'scatter-grid-line' }));
      var lbl = svgEl('text', { x: xx, y: H - 14, class: 'scatter-axis-label', 'text-anchor': 'middle' });
      lbl.textContent = v;
      svg.appendChild(lbl);
    });
    var yt = [0, 1125, 2250, 3375, 4500];
    yt.forEach(function (v) {
      var yy = y(v);
      svg.appendChild(svgEl('line', { x1: padL, x2: W - padR, y1: yy, y2: yy, class: 'scatter-grid-line' }));
      var lbl = svgEl('text', { x: padL - 6, y: yy + 3, class: 'scatter-axis-label', 'text-anchor': 'end' });
      lbl.textContent = v;
      svg.appendChild(lbl);
    });

    var xLabel = svgEl('text', { x: padL + innerW / 2, y: H - 1, class: 'scatter-axis-label', 'text-anchor': 'middle' });
    xLabel.textContent = strings.scatterXLabel;
    svg.appendChild(xLabel);

    var yLabel = svgEl('text', {
      x: 12, y: padT + innerH / 2, class: 'scatter-axis-label', 'text-anchor': 'middle',
      transform: 'rotate(-90 12 ' + (padT + innerH / 2) + ')'
    });
    yLabel.textContent = strings.scatterYLabel;
    svg.appendChild(yLabel);

    var tooltip = document.getElementById('scatter-tooltip');
    var wrap = document.getElementById('scatter-wrap');

    currentData().forEach(function (d) {
      var cat = CATCODE[d[2]];
      var cx = x(d[0]), cy = y(d[1]);
      var c = svgEl('circle', {
        cx: cx, cy: cy, r: 3.4,
        fill: 'var(--cat-' + cat + ')',
        class: 'scatter-pt' + (activeCat && activeCat !== cat ? ' is-dim' : ''),
        'data-cat': cat
      });
      c.addEventListener('mousemove', function (ev) {
        tooltip.innerHTML = (d[4] ? '<b>' + escHtml(d[4]) + '</b><br>' : '') + strings.cats[cat] + '<br>' +
          strings.scatterXLabel.replace(/\s*\(.*/, '') + ': ' + d[0] + ' MPa<br>' +
          'CO₂: ' + d[1] + ' kg/m³<br>' +
          strings.tooltipCi + ': ' + (d[0] ? (d[1] / d[0]).toFixed(2) : '—');
        positionTooltip(tooltip, wrap, ev);
        tooltip.classList.add('is-visible');
      });
      c.addEventListener('mouseleave', function () {
        tooltip.classList.remove('is-visible');
      });
      svg.appendChild(c);
    });
  }

  function renderLegend(strings) {
    var box = document.getElementById('cat-legend');
    box.textContent = '';
    var counts = {};
    currentData().forEach(function (d) {
      var cat = CATCODE[d[2]];
      counts[cat] = (counts[cat] || 0) + 1;
    });

    CATS.forEach(function (cat) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cat-chip' + (activeCat && activeCat !== cat ? ' is-off' : '');

      var sw = document.createElement('span');
      sw.className = 'cat-swatch';
      sw.style.background = 'var(--cat-' + cat + ')';
      btn.appendChild(sw);

      var label = document.createElement('span');
      label.textContent = strings.cats[cat];
      if (strings.catsDesc && strings.catsDesc[cat]) {
        label.title = strings.catsDesc[cat];
        label.classList.add('has-desc');
      }
      btn.appendChild(label);

      var n = document.createElement('span');
      n.className = 'cat-n';
      n.textContent = counts[cat] || 0;
      btn.appendChild(n);

      btn.addEventListener('click', function () {
        activeCat = activeCat === cat ? null : cat;
        renderLegend(strings);
        updateDim();
      });

      box.appendChild(btn);
    });
  }

  function updateDim() {
    var pts = document.querySelectorAll('.scatter-pt');
    for (var i = 0; i < pts.length; i++) {
      var cat = pts[i].getAttribute('data-cat');
      pts[i].classList.toggle('is-dim', !!(activeCat && activeCat !== cat));
    }
  }

  /* --------------------------------------------------------- forest-style */

  /* forestOpen guarda que familia esta expandida (chave 'cat:<letra>' ou
     'overall'), sobrevive a re-renders (troca de idioma, filtro de estrato)
     do mesmo jeito que funnelOpen faz para o funil da triagem acima. */
  var forestOpen = {};

  function renderForest(strings) {
    var list = document.getElementById('forest-list');
    list.textContent = '';

    var cit = forestMetric !== 'ci';
    var byCat = {};
    CATS.forEach(function (c) { byCat[c] = []; });
    var allItems = [];
    var data = currentData();
    var nCit = 0;
    data.forEach(function (d) {
      var cat = CATCODE[d[2]];
      var fck = d[0], co2 = d[1], vida = vidaDoPar(d);
      var ci = fck ? co2 / fck : null;
      if (ci === null || ci <= 0) return;
      if (vida) nCit++;
      if (cit && !vida) return;
      var item = { ci: cit ? ci / vida : ci, fck: fck, co2: co2, vida: vida, cit: cit,
                   tier: TIERCODE[d[3]], label: d[4], sub: d[8] || null };
      byCat[cat].push(item);
      allItems.push(item);
    });

    document.getElementById('forest-title').textContent = cit ? strings.forestTitleCit : strings.forestTitle;
    document.getElementById('forest-desc').textContent = cit
      ? strings.forestPCit.replace('{n}', nCit).replace('{total}', data.length) + ' ' + strings['forestP_' + forestMetric]
      : strings.forestP;
    document.getElementById('forest-n-ci').textContent = data.length;
    METRICS.slice(1).forEach(function (m) {
      var el = document.getElementById('forest-n-' + m);
      if (!el) return;
      var n = 0;
      var save = forestMetric;
      forestMetric = m;
      data.forEach(function (d) { if (vidaDoPar(d)) n++; });
      forestMetric = save;
      el.textContent = n;
    });

    // F28: estimativa do modelo para o subconjunto que está no ecrã
    var mod = modeloCenario();
    renderForestLegenda(strings);

    // escala: ci até 12 kg CO₂-eq/(m³·MPa); ci_t até 0,4 por ano (~p88 dos pares); alarga para caber
    // o IC 95% de cada família do modelo (o intervalo de predição pode passar e fica com a ponta cortada)
    var maxCi = cit ? 0.4 : 12;
    if (mod && mod.familias) {
      Object.keys(mod.familias).forEach(function (f) {
        var m = mod.familias[f];
        if (m && m.estudos >= MODELO_MIN_ESTUDOS && byCat[f] && byCat[f].length && m.ub !== null &&
            m.ub !== undefined && m.ub > maxCi &&
            m.ub < (cit ? 1.5 : 40)) maxCi = m.ub * 1.04;
      });
    }
    function pos(v) { return Math.max(0, Math.min(v, maxCi)) / maxCi * 100; }
    pos.max = maxCi;

    var rows = CATS.map(function (cat) {
      var items = byCat[cat];
      var m = mod && mod.familias ? mod.familias[cat] : null;
      // uma família com um só estudo não tem estimativa útil (o IC é só a variância entre estudos)
      if (m && (m.mu === null || m.mu === undefined || !(m.estudos >= MODELO_MIN_ESTUDOS))) m = null;
      return { cat: cat, med: median(items.map(function (it) { return it.ci; })), items: items, m: m };
    }).filter(function (r) { return r.med !== null; });
    rows.sort(function (a, b) { return (a.m ? a.m.mu : a.med) - (b.m ? b.m.mu : b.med); });

    rows.forEach(function (r) {
      list.appendChild(buildForestItem(
        'cat:' + r.cat, strings.cats[r.cat], r.med, 'var(--cat-' + r.cat + ')', pos, r.items, strings, r.m
      ));
    });

    if (!allItems.length) return;
    var overall = median(allItems.map(function (it) { return it.ci; }));
    var g = mod && mod.global && mod.global.mu !== null && mod.global.mu !== undefined ? mod.global : null;
    var item = buildForestItem('overall', strings.forestOverall, overall, 'var(--ink)', pos, allItems, strings, g);
    item.classList.add('forest-item-overall');
    list.appendChild(item);
  }

  /* F28: chave do cenário do modelo a partir dos filtros do painel */
  function modeloCenario() {
    if (!MODELO || !MODELO.cenarios) return null;
    var est = tierVisible.p && tierVisible.s ? 'ps' : (tierVisible.p ? 'p' : 's');
    var key = [est, baseFilter, co2Scenario, forestMetric].join('|');
    return MODELO.cenarios[key] || null;
  }

  function renderForestLegenda(strings) {
    var box = document.getElementById('forest-legend');
    if (!box) return;
    box.textContent = '';
    if (!MODELO) { box.hidden = true; return; }
    box.hidden = false;
    box.setAttribute('aria-label', strings.forestMarcasAria);
    [['forest-leg-modelo', strings.forestLegModelo], ['forest-leg-mediana', strings.forestLegMediana, 'mediana'],
     ['forest-leg-media', strings.forestLegMedia, 'media'],
     ['forest-leg-ip', strings.forestLegIP]].forEach(function (l) {
      var it = document.createElement(l[2] ? 'label' : 'span');
      it.className = 'forest-leg-item' + (l[2] ? ' forest-leg-toggle' : '');
      if (l[2]) {
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.id = 'forest-marca-' + l[2];
        cb.checked = forestMarcas[l[2]];
        cb.addEventListener('change', function () {
          forestMarcas[l[2]] = cb.checked;
          try { window.localStorage.setItem(MARCAS_KEY, JSON.stringify(forestMarcas)); } catch (e) {}
          renderForest(strings);
        });
        it.appendChild(cb);
      }
      var sw = document.createElement('span');
      sw.className = 'forest-leg-sw ' + l[0];
      sw.setAttribute('aria-hidden', 'true');
      it.appendChild(sw);
      it.appendChild(document.createTextNode(l[1]));
      box.appendChild(it);
    });
    var nota = document.getElementById('forest-modelo-nota');
    if (nota) nota.textContent = strings.forestModeloNota.replace('{data}', MODELO.gerado || '');
  }

  /* barra do IC (ou do IP) entre lb e ub, cortada à escala, com seta quando passa do limite */
  function forestIntervalo(track, lb, ub, pos, cls, color, maxCi) {
    if (lb === null || lb === undefined || ub === null || ub === undefined) return;
    var el = document.createElement('div');
    el.className = cls + (ub > maxCi ? ' clip-r' : '') + (lb < 0 ? ' clip-l' : '');
    el.style.left = pos(lb) + '%';
    el.style.width = Math.max(0, pos(ub) - pos(lb)) + '%';
    if (color) el.style.setProperty('--fc', color);
    track.appendChild(el);
  }

  /* ci com 2 casas; ci_t (~0,01–1 por ano) com 3 */
  function fmtCi(v) {
    return v.toFixed(forestMetric === 'ci' ? 2 : 3);
  }

  function buildForestItem(key, label, med, color, pos, items, strings, m) {
    var wrap = document.createElement('div');
    wrap.className = 'forest-item' + (forestOpen[key] ? ' is-open' : '');

    var head = document.createElement('button');
    head.type = 'button';
    head.className = 'forest-head';
    head.addEventListener('click', function () {
      forestOpen[key] = !forestOpen[key];
      renderForest(strings);
    });

    var name = document.createElement('div');
    name.className = 'forest-name';
    var chevron = document.createElement('span');
    chevron.className = 'forest-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '›';
    name.appendChild(chevron);
    var nameText = document.createElement('span');
    nameText.textContent = label;
    if (key.indexOf('cat:') === 0) {
      var descCat = key.slice(4);
      if (strings.catsDesc && strings.catsDesc[descCat]) {
        nameText.title = strings.catsDesc[descCat];
        nameText.classList.add('has-desc');
      }
    }
    name.appendChild(nameText);
    head.appendChild(name);

    var track = document.createElement('div');
    track.className = 'forest-track';
    var bg = document.createElement('div');
    bg.className = 'forest-bar-bg';
    track.appendChild(bg);
    var maxCi = pos.max;
    var media = mean(items.map(function (it) { return it.ci; }));
    if (forestMarcas.media && media !== null) {
      var mean0 = document.createElement('div');
      mean0.className = 'forest-bar forest-bar-media';
      mean0.style.left = pos(media) + '%';
      mean0.style.borderColor = color;
      track.appendChild(mean0);
    }
    if (m) {
      // F28: modelo (losango + IC 95%) e a mediana como círculo vazio
      if (key === 'overall') forestIntervalo(track, m.pi_lb, m.pi_ub, pos, 'forest-ip', color, maxCi);
      forestIntervalo(track, m.lb, m.ub, pos, 'forest-ci', color, maxCi);
      if (forestMarcas.mediana) {
        var med0 = document.createElement('div');
        med0.className = 'forest-bar forest-bar-mediana';
        med0.style.left = pos(med) + '%';
        med0.style.borderColor = color;
        track.appendChild(med0);
      }
      var dia = document.createElement('div');
      dia.className = 'forest-diamond';
      dia.style.left = pos(m.mu) + '%';
      dia.style.background = color;
      track.appendChild(dia);
    } else {
      var bar = document.createElement('div');
      bar.className = 'forest-bar';
      bar.style.left = pos(med) + '%';
      bar.style.background = color;
      track.appendChild(bar);
    }
    head.appendChild(track);

    var val = document.createElement('div');
    val.className = 'forest-value';
    if (m) {
      val.innerHTML = '<b>' + fmtCi(m.mu) + '</b>' +
        '<span class="forest-ic">[' + fmtCi(m.lb) + '–' + fmtCi(m.ub) + ']</span>' +
        '<span class="forest-ic">n=' + items.length + '</span>';
      var tip = strings.forestTipMediana + ' ' + fmtCi(med) +
        (media !== null ? ' · ' + strings.forestTipMedia + ' ' + fmtCi(media) : '');
      if (key === 'overall' && m.pi_lb !== null && m.pi_lb !== undefined) {
        tip += ' · ' + strings.forestTipIP + ' ' + fmtCi(m.pi_lb) + '–' + fmtCi(m.pi_ub) +
          (m.i2 !== null && m.i2 !== undefined ? ' · I² ' + m.i2.toFixed(1) + '%' : '');
      }
      head.title = tip;
    } else {
      val.innerHTML = '<b>' + fmtCi(med) + '</b> · n=' + items.length;
      if (MODELO && key !== 'overall') head.title = strings.forestSemModelo;
      if (media !== null) head.title = (head.title ? head.title + ' · ' : '') + strings.forestTipMedia + ' ' + fmtCi(media);
    }
    head.appendChild(val);

    wrap.appendChild(head);

    var detail = document.createElement('div');
    detail.className = 'forest-detail';
    if (key === 'cat:opc') {
      detail.appendChild(buildSubfamList(items, color, pos, strings));
    } else {
      detail.appendChild(buildStudyList(items, color, pos, strings));
    }
    wrap.appendChild(detail);

    return wrap;
  }

  function buildStudyList(items, color, pos, strings) {
    var subList = document.createElement('div');
    subList.className = 'forest-sub-list';
    items.slice().sort(function (a, b) { return a.ci - b.ci; }).forEach(function (it) {
      subList.appendChild(buildForestSubRow(it, color, pos, strings));
    });
    return subList;
  }

  /* F12 (Kie, 2026-10-10): dentro do «cimento Portland de referencia» os
     estudos aparecem agrupados pela subfamilia do cimento (9.º campo do par,
     ver SUBFAM), cada uma com um botao (i) que explica o tipo e cita a norma.
     Ordem: tipos declarados pela mediana; «sem tipo» e «nao declarado» no fim. */
  var SUBFAM_FIM = { portland_sem_tipo: 1, nao_declarado: 2 };
  var forestInfo = {};

  function subfamText(code, field, strings) {
    var s = SUBFAM[code] || SUBFAM.nao_declarado;
    var lg = strings.subfamLang || 'pt';
    if (field === 'info') return s[lg + '_i'] || s.en_i || s.pt_i;
    return s[lg] || s.en || s.pt;
  }

  function buildSubfamList(items, color, pos, strings) {
    var groups = {};
    items.forEach(function (it) {
      var code = it.sub && SUBFAM[it.sub] ? it.sub : 'nao_declarado';
      (groups[code] = groups[code] || []).push(it);
    });
    var rows = Object.keys(groups).map(function (code) {
      return { code: code, med: median(groups[code].map(function (it) { return it.ci; })), items: groups[code] };
    });
    rows.sort(function (a, b) {
      var fa = SUBFAM_FIM[a.code] || 0, fb = SUBFAM_FIM[b.code] || 0;
      return fa !== fb ? fa - fb : a.med - b.med;
    });
    var list = document.createElement('div');
    list.className = 'forest-subfam-list';
    rows.forEach(function (r) {
      list.appendChild(buildSubfamItem(r, color, pos, strings));
    });
    return list;
  }

  function buildSubfamItem(r, color, pos, strings) {
    var key = 'sub:' + r.code;
    var wrap = document.createElement('div');
    wrap.className = 'forest-item forest-subfam' + (forestOpen[key] ? ' is-open' : '') +
      (forestInfo[r.code] ? ' info-open' : '');

    var top = document.createElement('div');
    top.className = 'forest-subfam-top';

    var info = document.createElement('button');
    info.type = 'button';
    info.className = 'forest-info-btn';
    info.textContent = 'i';
    info.title = strings.subfamInfoLabel;
    info.setAttribute('aria-label', strings.subfamInfoLabel + ': ' + subfamText(r.code, 'label', strings));
    info.setAttribute('aria-expanded', forestInfo[r.code] ? 'true' : 'false');
    info.addEventListener('click', function (e) {
      e.stopPropagation();
      forestInfo[r.code] = !forestInfo[r.code];
      renderForest(strings);
    });
    top.appendChild(info);

    var head = document.createElement('button');
    head.type = 'button';
    head.className = 'forest-subfam-head';
    head.addEventListener('click', function () {
      forestOpen[key] = !forestOpen[key];
      renderForest(strings);
    });

    var name = document.createElement('div');
    name.className = 'forest-sub-name';
    var chevron = document.createElement('span');
    chevron.className = 'forest-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '›';
    name.appendChild(chevron);
    var text = document.createElement('span');
    text.className = 'forest-sub-label forest-subfam-label';
    text.textContent = subfamText(r.code, 'label', strings);
    name.appendChild(text);
    head.appendChild(name);

    var track = document.createElement('div');
    track.className = 'forest-track forest-track-sub';
    var bg = document.createElement('div');
    bg.className = 'forest-bar-bg';
    track.appendChild(bg);
    var bar = document.createElement('div');
    bar.className = 'forest-bar';
    bar.style.left = pos(r.med) + '%';
    bar.style.background = color;
    track.appendChild(bar);
    var mediaSub = mean(r.items.map(function (it) { return it.ci; }));
    if (forestMarcas.media && mediaSub !== null) {
      var meanSub = document.createElement('div');
      meanSub.className = 'forest-bar forest-bar-media';
      meanSub.style.left = pos(mediaSub) + '%';
      meanSub.style.borderColor = color;
      track.appendChild(meanSub);
    }
    head.appendChild(track);

    var val = document.createElement('div');
    val.className = 'forest-value forest-sub-value';
    val.innerHTML = '<b>' + fmtCi(r.med) + '</b> · n=' + r.items.length;
    head.appendChild(val);
    top.appendChild(head);
    wrap.appendChild(top);

    if (forestInfo[r.code]) {
      var box = document.createElement('div');
      box.className = 'forest-info';
      box.textContent = subfamText(r.code, 'info', strings);
      wrap.appendChild(box);
    }

    var detail = document.createElement('div');
    detail.className = 'forest-detail';
    detail.appendChild(buildStudyList(r.items, color, pos, strings));
    wrap.appendChild(detail);
    return wrap;
  }

  function buildForestSubRow(it, color, pos, strings) {
    var row = document.createElement('div');
    row.className = 'forest-sub-row';

    var name = document.createElement('div');
    name.className = 'forest-sub-name';
    var text = document.createElement('span');
    text.className = 'forest-sub-label';
    text.textContent = it.label || strings.forestSemLabel;
    if (it.label) name.title = it.label;
    name.appendChild(text);
    if (it.tier === 'sensibilidade') {
      var dot = document.createElement('span');
      dot.className = 'tier-swatch tier-swatch-s forest-sub-tier';
      dot.title = strings.tierSensibilidade;
      name.appendChild(dot);
    }
    row.appendChild(name);

    var track = document.createElement('div');
    track.className = 'forest-track forest-track-sub';
    var bg = document.createElement('div');
    bg.className = 'forest-bar-bg';
    track.appendChild(bg);
    var dotEl = document.createElement('div');
    dotEl.className = 'forest-bar forest-bar-sub';
    dotEl.style.left = pos(it.ci) + '%';
    dotEl.style.background = color;
    track.appendChild(dotEl);
    row.appendChild(track);

    var val = document.createElement('div');
    val.className = 'forest-value forest-sub-value';
    val.innerHTML = '<b>' + fmtCi(it.ci) + '</b>' +
      '<span class="forest-sub-raw">' + it.fck + ' MPa · ' + it.co2 + ' kg/m³' +
      (it.cit ? ' · ' + it.vida + ' ' + strings.forestAnos : '') + '</span>';
    row.appendChild(val);

    return row;
  }

  /* --------------------------------------------------- unidades de CO2 */

  var UNIT_PENDENTE_ORDER = ['m2', 'tonelada', 'kg', 'elemento', 'metro_linear', 'ja_mpa', 'energia', 'especime', 'sem_referencia', 'outro'];

  function renderUnitChart(strings) {
    var legend = document.getElementById('unit-legend');
    legend.textContent = '';
    [
      { kind: 'nativo', label: strings.unitChartKindNativo },
      { kind: 'derivado', label: strings.unitChartKindDerivado },
      { kind: 'pendente', label: strings.unitChartKindPendente },
      { kind: 'excluido', label: strings.unitChartKindExcluido }
    ].forEach(function (it) {
      var chip = document.createElement('span');
      chip.className = 'unit-legend-item';
      var sw = document.createElement('span');
      sw.className = 'unit-swatch unit-swatch-' + it.kind;
      chip.appendChild(sw);
      var lbl = document.createElement('span');
      lbl.textContent = it.label;
      chip.appendChild(lbl);
      legend.appendChild(chip);
    });

    var list = document.getElementById('unit-chart-list');
    list.textContent = '';

    var byKindCat = {};
    UNIT_STATS.forEach(function (u) { byKindCat[u.kind + ':' + u.cat] = u.n; });

    var rows = [
      { label: strings.unitChartKindNativo, n: byKindCat['nativo:m3'] || 0, kind: 'nativo' },
      { label: strings.unitChartKindDerivado, n: byKindCat['derivado:m3'] || 0, kind: 'derivado' }
    ];
    UNIT_PENDENTE_ORDER.forEach(function (cat) {
      var n = byKindCat['pendente:' + cat] || 0;
      if (n > 0) rows.push({ label: strings.unitCats[cat], n: n, kind: 'pendente' });
    });
    var pendRows = rows.slice(2).sort(function (a, b) { return b.n - a.n; });
    rows = rows.slice(0, 2).concat(pendRows);
    /* Kiê (2026-10-13): os valores já em kg/m³ que ficaram fora da análise têm
       barra própria, clicável, com cada linha e o motivo (UNIT_EXCLUDED). */
    var nExcl = byKindCat['excluido:m3'] || 0;
    if (nExcl > 0) rows.push({ label: strings.unitExcluidoBar, n: nExcl, kind: 'excluido' });

    var maxN = Math.max.apply(null, rows.map(function (r) { return r.n; })) || 1;

    rows.forEach(function (r) {
      var row = document.createElement('div');
      row.className = 'unit-row';

      var name = document.createElement('div');
      name.className = 'unit-name';
      name.textContent = r.label;
      row.appendChild(name);

      var track = document.createElement('div');
      track.className = 'unit-track';
      var bar = document.createElement('div');
      bar.className = 'unit-bar unit-bar-' + r.kind;
      bar.style.width = Math.max(2, (r.n / maxN) * 100) + '%';
      track.appendChild(bar);
      row.appendChild(track);

      var val = document.createElement('div');
      val.className = 'unit-value';
      val.textContent = r.n;
      row.appendChild(val);

      if (r.kind !== 'excluido') {
        list.appendChild(row);
        return;
      }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'unit-row unit-row-btn';
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('title', strings.unitExcluidoHint);
      while (row.firstChild) btn.appendChild(row.firstChild);
      var panel = buildExcludedPanel(strings);
      panel.hidden = true;
      btn.addEventListener('click', function () {
        var open = panel.hidden;
        panel.hidden = !open;
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      list.appendChild(btn);
      list.appendChild(panel);
    });
  }

  function buildExcludedPanel(strings) {
    var wrap = document.createElement('div');
    wrap.className = 'unit-excl';
    var table = document.createElement('table');
    table.className = 'unit-excl-table';
    var head = document.createElement('tr');
    strings.unitExcluidoCols.forEach(function (c) {
      var th = document.createElement('th');
      th.textContent = c;
      head.appendChild(th);
    });
    var thead = document.createElement('thead');
    thead.appendChild(head);
    table.appendChild(thead);
    var tbody = document.createElement('tbody');
    UNIT_EXCLUDED.forEach(function (x) {
      var tr = document.createElement('tr');
      [x.estudo || ('#' + x.row_id), x.material, x.fck, x.co2 + ' ' + (x.unidade || ''), x.motivo].forEach(function (v, i) {
        var td = document.createElement('td');
        td.textContent = v == null ? '' : String(v);
        td.setAttribute('data-label', strings.unitExcluidoCols[i]);
        if (i === 2) td.className = 'num';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  /* ------------------------------------------- mapa de países + rede de citações

     Kiê (2026-10-13/14): mapa de publicações pelo país do autor de
     correspondência e linha temporal com as citações entre os artigos
     incluídos. Dois universos (F17-5): todos os Elegíveis (por omissão) ou só
     os estudos com par no painel. Dados em /metanalise/dados/mapa.json
     (metanalise-export-mapa.py no repositório da RSL) e geometria em
     /metanalise/dados/mundo.json (Natural Earth 1:110m, Equal Earth). Os dois
     ficheiros só são pedidos quando a página abre, uma vez. */

  var UNIV_KEY = 'kl-meta-universo';
  var universo = 'todos';
  try {
    var savedU = window.localStorage.getItem(UNIV_KEY);
    if (savedU === 'meta') universo = 'meta';
  } catch (e) {}
  var MAPA = { mundo: null, dados: null, pedido: null, erro: false };
  var paisListaAberta = false;
  /* cartões fixados na rede de citações (ids dos artigos, pela ordem em que
     foram fixados) */
  var redePins = [];
  var redePinEls = {};
  var redePosicionar = function () {};
  var redeOuvintes = false;

  function carregarMapa(onReady) {
    if (MAPA.mundo && MAPA.dados) { onReady(); return; }
    if (!MAPA.pedido) {
      MAPA.pedido = Promise.all([
        fetch('/metanalise/dados/mundo.json').then(function (r) { return r.json(); }),
        fetch('/metanalise/dados/mapa.json').then(function (r) { return r.json(); })
      ]).then(function (res) {
        MAPA.mundo = res[0];
        MAPA.dados = res[1];
      }).catch(function () { MAPA.erro = true; });
    }
    MAPA.pedido.then(onReady);
  }

  function artigosUniverso() {
    var arts = MAPA.dados.artigos;
    return universo === 'meta' ? arts.filter(function (a) { return a.meta; }) : arts;
  }

  var DISPLAY_LANG = { PT: 'pt-PT', EN: 'en', ZH: 'zh-Hans' };
  function nomePais(iso2, lang, fallback) {
    try {
      var dn = new Intl.DisplayNames([DISPLAY_LANG[lang] || 'pt'], { type: 'region' });
      return dn.of(iso2) || fallback;
    } catch (e) {
      return fallback;
    }
  }

  /* 6 classes de um só tom (verde do site), do claro ao escuro. */
  var MAPA_CLASSES = [1, 2, 5, 10, 20, 40];
  var MAPA_ALPHA = [0.16, 0.3, 0.45, 0.62, 0.8, 1];
  function classeDe(n) {
    var c = -1;
    for (var i = 0; i < MAPA_CLASSES.length; i++) if (n >= MAPA_CLASSES[i]) c = i;
    return c;
  }
  function fillClasse(c) {
    return c < 0 ? 'var(--ink-16)' : 'rgba(var(--spec-rgb), ' + MAPA_ALPHA[c] + ')';
  }

  function syncUniversoRadios(lang) {
    ['mapa', 'rede'].forEach(function (onde) {
      ['todos', 'meta'].forEach(function (u) {
        var r = document.getElementById('univ-' + onde + '-' + u);
        if (r) r.checked = universo === u;
      });
    });
    if (!MAPA.dados) return;
    var nT = MAPA.dados.n, nM = MAPA.dados.n_meta;
    ['mapa', 'rede'].forEach(function (onde) {
      var a = document.getElementById('univ-' + onde + '-n-todos');
      var b = document.getElementById('univ-' + onde + '-n-meta');
      if (a) a.textContent = fmtInt(nT, lang);
      if (b) b.textContent = fmtInt(nM, lang);
    });
  }

  function tooltipLinhas(tooltip, linhas) {
    tooltip.textContent = '';
    linhas.forEach(function (l, i) {
      if (i) tooltip.appendChild(document.createElement('br'));
      if (l.b) {
        var b = document.createElement('b');
        b.textContent = l.b;
        tooltip.appendChild(b);
        if (l.t) tooltip.appendChild(document.createTextNode(' ' + l.t));
      } else {
        tooltip.appendChild(document.createTextNode(l.t));
      }
    });
  }

  function renderMapa(strings, lang) {
    var svg = document.getElementById('mapa-svg');
    if (!svg) return;
    carregarMapa(function () {
      if (MAPA.erro) { document.getElementById('mapa-wrap').textContent = strings.mapaErro; return; }
      syncUniversoRadios(lang);
      var arts = artigosUniverso();
      var cont = {}, contMeta = {}, iso2 = {};
      arts.forEach(function (a) {
        if (!a.iso3) return;
        cont[a.iso3] = (cont[a.iso3] || 0) + 1;
        if (a.meta) contMeta[a.iso3] = (contMeta[a.iso3] || 0) + 1;
        iso2[a.iso3] = a.iso2;
      });
      var M = MAPA.mundo;
      svg.setAttribute('viewBox', '0 0 ' + M.largura + ' ' + M.altura);
      svg.textContent = '';
      var wrap = document.getElementById('mapa-wrap');
      var tooltip = document.getElementById('mapa-tooltip');
      var desenhados = {};
      M.paises.forEach(function (p) {
        var n = p.iso3 ? (cont[p.iso3] || 0) : 0;
        var path = svgEl('path', { d: p.d, 'class': 'mapa-pais' + (n ? ' tem' : '') });
        path.style.fill = fillClasse(classeDe(n));
        if (n) {
          desenhados[p.iso3] = true;
          path.addEventListener('mousemove', function (ev) {
            var nome = nomePais(p.iso2, lang, p.nome);
            var linhas = [{ b: nome }, { t: strings.mapaTipN.replace('{n}', fmtInt(n, lang)) }];
            if (universo === 'todos') linhas.push({ t: strings.mapaTipMeta.replace('{n}', fmtInt(contMeta[p.iso3] || 0, lang)) });
            tooltipLinhas(tooltip, linhas);
            tooltip.classList.add('is-visible');
            positionTooltip(tooltip, wrap, ev);
          });
          path.addEventListener('mouseleave', function () { tooltip.classList.remove('is-visible'); });
        }
        svg.appendChild(path);
      });
      svg.setAttribute('aria-label', strings.mapaAria);

      /* legenda das classes */
      var leg = document.getElementById('mapa-legend');
      leg.textContent = '';
      var tit = document.createElement('span');
      tit.className = 'mapa-legend-titulo';
      tit.textContent = strings.mapaLegenda;
      leg.appendChild(tit);
      MAPA_CLASSES.forEach(function (lo, i) {
        var hi = i + 1 < MAPA_CLASSES.length ? MAPA_CLASSES[i + 1] - 1 : null;
        var item = document.createElement('span');
        item.className = 'mapa-legend-item';
        var sw = document.createElement('span');
        sw.className = 'mapa-swatch';
        sw.style.background = fillClasse(i);
        item.appendChild(sw);
        item.appendChild(document.createTextNode(hi === null ? lo + '+' : (lo === hi ? String(lo) : lo + '–' + hi)));
        leg.appendChild(item);
      });

      /* lista ordenada (vista em tabela, legível sem cor e no telemóvel) */
      var lista = document.getElementById('pais-list');
      lista.textContent = '';
      var ordem = Object.keys(cont).sort(function (a, b) { return cont[b] - cont[a] || (a < b ? -1 : 1); });
      var max = ordem.length ? cont[ordem[0]] : 1;
      var TOPO = 15;
      ordem.forEach(function (iso3, idx) {
        if (!paisListaAberta && idx >= TOPO) return;
        var li = document.createElement('li');
        li.className = 'pais-row';
        var nome = document.createElement('span');
        nome.className = 'pais-nome';
        nome.textContent = nomePais(iso2[iso3], lang, iso3);
        var barWrap = document.createElement('span');
        barWrap.className = 'pais-bar-wrap';
        var bar = document.createElement('span');
        bar.className = 'pais-bar';
        bar.style.width = (100 * cont[iso3] / max) + '%';
        barWrap.appendChild(bar);
        var num = document.createElement('span');
        num.className = 'pais-n';
        num.textContent = fmtInt(cont[iso3], lang);
        li.appendChild(nome);
        li.appendChild(barWrap);
        li.appendChild(num);
        lista.appendChild(li);
      });
      var btn = document.getElementById('pais-mais');
      btn.hidden = ordem.length <= TOPO;
      btn.textContent = paisListaAberta ? strings.mapaVerMenos : strings.mapaVerTodos.replace('{n}', fmtInt(ordem.length, lang));
      btn.setAttribute('aria-expanded', paisListaAberta ? 'true' : 'false');
      btn.onclick = function () { paisListaAberta = !paisListaAberta; renderMapa(strings, lang); };
      document.getElementById('mapa-resumo').textContent = strings.mapaResumo
        .replace('{n}', fmtInt(arts.length, lang)).replace('{p}', fmtInt(ordem.length, lang));
      void desenhados;
    });
  }

  function renderRede(strings, lang) {
    var svg = document.getElementById('rede-svg');
    if (!svg) return;
    carregarMapa(function () {
      if (MAPA.erro) { document.getElementById('rede-wrap').textContent = strings.mapaErro; return; }
      syncUniversoRadios(lang);
      var arts = artigosUniverso();
      var porId = {};
      arts.forEach(function (a) { porId[a.id] = a; });
      var anos = arts.map(function (a) { return a.ano; });
      var a0 = Math.min.apply(null, anos), a1 = Math.max.apply(null, anos);
      var nAnos = a1 - a0 + 1;
      var porAno = {};
      arts.forEach(function (a) { (porAno[a.ano] = porAno[a.ano] || []).push(a); });
      var W = 960, ML = 8, MR = 8, MT = 14, PASSO = 9;
      var banda = (W - ML - MR) / nAnos;
      var colunas = Math.max(1, Math.floor((banda - 6) / PASSO));
      var maxLinhas = 0;
      Object.keys(porAno).forEach(function (k) {
        maxLinhas = Math.max(maxLinhas, Math.ceil(porAno[k].length / colunas));
      });
      var altPlot = maxLinhas * PASSO + 10;
      var H = MT + altPlot + 30;
      var base = MT + altPlot;
      var pos = {};
      Object.keys(porAno).forEach(function (k) {
        var lst = porAno[k];
        var x0 = ML + (Number(k) - a0) * banda + (banda - colunas * PASSO) / 2 + PASSO / 2;
        lst.forEach(function (a, i) {
          var col = i % colunas, lin = Math.floor(i / colunas);
          pos[a.id] = { x: x0 + col * PASSO, y: base - PASSO / 2 - lin * PASSO };
        });
      });
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.textContent = '';
      svg.setAttribute('aria-label', strings.redeAria);

      /* eixo dos anos */
      for (var y = a0; y <= a1; y++) {
        var cx = ML + (y - a0 + 0.5) * banda;
        if (nAnos > 12 && (y - a0) % 2 && y !== a1) continue;
        var t = svgEl('text', { x: cx, y: base + 18, 'text-anchor': 'middle', 'class': 'rede-ano' });
        t.textContent = y;
        svg.appendChild(t);
      }
      svg.appendChild(svgEl('line', { x1: ML, x2: W - MR, y1: base + 3, y2: base + 3, 'class': 'rede-base' }));

      /* ligações: de quem cita (mais recente) para o citado (anterior) */
      var gLig = svgEl('g', { 'class': 'rede-ligacoes' });
      var ligs = [];
      var citadoPor = {};
      arts.forEach(function (a) {
        a.cita.forEach(function (b) {
          if (!porId[b]) return;
          citadoPor[b] = (citadoPor[b] || 0) + 1;
          var p = pos[a.id], q = pos[b];
          var mx = (p.x + q.x) / 2, dy = Math.max(18, Math.abs(p.x - q.x) * 0.35);
          var my = Math.min(p.y, q.y) - dy;
          var path = svgEl('path', { d: 'M' + p.x + ',' + p.y + 'Q' + mx + ',' + my + ' ' + q.x + ',' + q.y, 'class': 'rede-lig' });
          gLig.appendChild(path);
          ligs.push({ de: a.id, para: b, el: path });
        });
      });
      svg.appendChild(gLig);

      var wrap = document.getElementById('rede-wrap');
      var tooltip = document.getElementById('rede-tooltip');
      var gNos = svgEl('g', {});
      var nos = {};

      function linhasArtigo(a) {
        var cita = a.cita.filter(function (b) { return porId[b]; }).length;
        var linhas = [
          { b: a.rot, t: '· ' + nomePais(a.iso2, lang, a.iso3 || '') },
          { t: a.titulo },
          { t: strings.redeTipCita.replace('{n}', fmtInt(cita, lang)) + ' · ' +
               strings.redeTipCitado.replace('{n}', fmtInt(citadoPor[a.id] || 0, lang)) }
        ];
        if (a.ext && a.ext.length) {
          var nomesExt = {};
          ((MAPA.dados && MAPA.dados.externas) || []).forEach(function (e) { nomesExt[e.id] = e.nome; });
          linhas.push({ t: strings.redeTipExt + ' ' + a.ext.map(function (k) { return nomesExt[k] || k; }).join(' · ') });
        }
        if (!a.refs) linhas.push({ t: strings.redeTipSemRefs });
        return linhas;
      }

      /* Destaque das ligações: as dos cartões fixados e, por cima, a do ponto
         sob o cursor. */
      function aplicarFoco(extra) {
        var ids = redePins.slice();
        if (extra && ids.indexOf(extra) < 0) ids.push(extra);
        svg.classList.toggle('is-foco', ids.length > 0);
        ligs.forEach(function (l) {
          l.el.classList.toggle('cita', ids.indexOf(l.de) >= 0);
          l.el.classList.toggle('citado', ids.indexOf(l.para) >= 0);
        });
        arts.forEach(function (a) {
          nos[a.id].c.classList.toggle('foco', ids.indexOf(a.id) >= 0);
        });
      }

      /* Cartões fixados (Kiê, 2026-10-17): clicar num ponto deixa o cartão
         aberto junto do ponto, com um botão para o desfixar; podem ficar
         vários abertos. Cada cartão procura, perto do seu ponto, um lugar
         dentro do quadro que não tape os já fixados (abaixo ou acima, à
         direita ou à esquerda); sem lugar livre, desce até deixar de tocar. */
      function posicionarPins() {
        var espaco = wrap.querySelector('.rede-pin-espaco');
        if (!espaco) {
          espaco = document.createElement('div');
          espaco.className = 'rede-pin-espaco';
          wrap.appendChild(espaco);
        }
        var box = wrap.getBoundingClientRect();
        var altura = box.height - espaco.offsetHeight;
        var ocupados = [];
        function toca(l, t, w, h) {
          return ocupados.some(function (o) {
            return l < o.l + o.w + 4 && l + w + 4 > o.l && t < o.t + o.h + 4 && t + h + 4 > o.t;
          });
        }
        redePins.forEach(function (id) {
          var pin = redePinEls[id];
          if (!pin || !nos[id]) return;
          var r = nos[id].c.getBoundingClientRect();
          var relX = r.left + r.width / 2 - box.left;
          var relY = r.top + r.height / 2 - box.top;
          var tw = pin.offsetWidth, th = pin.offsetHeight;
          var lefts = [relX + 12, relX - tw - 12].map(function (l) {
            return Math.min(Math.max(0, l), Math.max(0, box.width - tw));
          });
          var tops = [relY + 10, relY - th - 10];
          ocupados.forEach(function (o) { tops.push(o.t + o.h + 6, o.t - th - 6); });
          tops.sort(function (a, b) { return Math.abs(a - relY) - Math.abs(b - relY); });
          var achou = null;
          tops.some(function (t) {
            if (t < 0 || t + th > altura) return false;
            return lefts.some(function (l) {
              if (toca(l, t, tw, th)) return false;
              achou = { l: l, t: t };
              return true;
            });
          });
          if (!achou) {
            var fundo = relY + 10;
            if (toca(lefts[0], fundo, tw, th)) {
              ocupados.forEach(function (o) { fundo = Math.max(fundo, o.t + o.h + 6); });
            }
            achou = { l: lefts[0], t: fundo };
          }
          pin.style.left = achou.l + 'px';
          pin.style.top = achou.t + 'px';
          ocupados.push({ l: achou.l, t: achou.t, w: tw, h: th });
        });
        /* cartões que não cabem no quadro alargam-no para baixo, em vez de
           taparem a secção seguinte */
        var fundo = 0;
        ocupados.forEach(function (o) { fundo = Math.max(fundo, o.t + o.h); });
        espaco.style.height = Math.max(0, fundo + 12 - altura) + 'px';
      }

      function desfixar(id) {
        var i = redePins.indexOf(id);
        if (i >= 0) redePins.splice(i, 1);
        if (redePinEls[id]) redePinEls[id].remove();
        delete redePinEls[id];
        aplicarFoco(null);
        posicionarPins();
      }

      function criarPin(id) {
        var a = porId[id];
        var pin = document.createElement('div');
        pin.className = 'scatter-tooltip is-visible rede-pin';
        pin.setAttribute('data-id', id);
        var txt = document.createElement('div');
        tooltipLinhas(txt, linhasArtigo(a));
        var x = document.createElement('button');
        x.type = 'button';
        x.className = 'rede-pin-x';
        x.textContent = '×';
        x.setAttribute('aria-label', strings.redePinFechar + ': ' + a.rot);
        x.setAttribute('title', strings.redePinFechar);
        x.addEventListener('click', function () { desfixar(id); });
        pin.appendChild(x);
        pin.appendChild(txt);
        wrap.appendChild(pin);
        redePinEls[id] = pin;
      }

      function alternarPin(id) {
        if (redePins.indexOf(id) >= 0) { desfixar(id); return; }
        redePins.push(id);
        criarPin(id);
        tooltip.classList.remove('is-visible');
        aplicarFoco(null);
        posicionarPins();
      }

      arts.forEach(function (a) {
        var p = pos[a.id];
        var c = svgEl('circle', { cx: p.x, cy: p.y, r: 3.6, 'class': 'rede-no' + (a.meta ? ' meta' : '') + (a.refs ? '' : ' sem-refs') });
        var hit = svgEl('circle', { cx: p.x, cy: p.y, r: 6, 'class': 'rede-hit' });
        nos[a.id] = { c: c };
        hit.addEventListener('mousemove', function (ev) {
          aplicarFoco(a.id);
          if (redePins.indexOf(a.id) >= 0) { tooltip.classList.remove('is-visible'); return; }
          tooltipLinhas(tooltip, linhasArtigo(a));
          tooltip.classList.add('is-visible');
          positionTooltip(tooltip, wrap, ev);
        });
        hit.addEventListener('mouseleave', function () {
          aplicarFoco(null);
          tooltip.classList.remove('is-visible');
        });
        hit.addEventListener('click', function () { alternarPin(a.id); });
        gNos.appendChild(c);
        gNos.appendChild(hit);
      });
      svg.appendChild(gNos);

      /* Ao redesenhar (língua, universo) os cartões são refeitos: ficam os dos
         artigos que continuam no universo. */
      wrap.querySelectorAll('.rede-pin').forEach(function (el) { el.remove(); });
      redePinEls = {};
      redePins = redePins.filter(function (id) { return porId[id]; });
      redePins.forEach(criarPin);
      aplicarFoco(null);
      posicionarPins();
      redePosicionar = posicionarPins;
      if (!redeOuvintes) {
        redeOuvintes = true;
        window.addEventListener('resize', function () { redePosicionar(); });
        var sc = wrap.querySelector('.rede-scroll');
        if (sc) sc.addEventListener('scroll', function () { redePosicionar(); });
      }

      var nSem = arts.filter(function (a) { return !a.refs; }).length;
      document.getElementById('rede-resumo').textContent = strings.redeResumo
        .replace('{n}', fmtInt(arts.length, lang)).replace('{l}', fmtInt(ligs.length, lang))
        .replace('{s}', fmtInt(nSem, lang));
      var leg = document.getElementById('rede-legend');
      leg.textContent = '';
      [['meta', strings.redeLegMeta], ['', strings.redeLegOutro], ['lig', strings.redeLegLig]].forEach(function (it) {
        if (it[0] === '' && universo === 'meta') return;
        var item = document.createElement('span');
        item.className = 'mapa-legend-item';
        var sw = document.createElement('span');
        sw.className = it[0] === 'lig' ? 'rede-sw-lig' : 'rede-sw-no' + (it[0] ? ' meta' : '');
        item.appendChild(sw);
        item.appendChild(document.createTextNode(it[1]));
        leg.appendChild(item);
      });
    });
  }

  /* -------------------------------------------------------------- boot */

  /* F63: controlo do transporte até a obra (A4). Os números «ao vivo» seguem os
     filtros do topo (estrato, base, cenário do CO₂); o modelo vem da grelha
     pré-calculada (A4MODELO), sempre no estrato principal, sem desconto. */
  var A4_MODOS = ['betoneira', 'truck_3e', 'carreta_4e', 'carreta_5e'];
  var a4State = { km: 1, modo: 'betoneira', fac: 1, prov: false };

  function a4Fmt(v, dec, lang) {
    var s = v.toFixed(dec);
    return lang === 'EN' ? s : s.replace('.', ',');
  }

  // superfície de resposta: um ajuste do modelo por km (0–300) × veículo × fator × grupo
  function a4Modelo(modo, km, fac, prov) {
    if (!A4MODELO || !A4MODELO.superficie) return null;
    var g = A4MODELO.superficie[prov ? 'sim_provavel' : 'sim'];
    var c = g && g[modo + '|' + fac];
    if (!c || c[0][km] === undefined) return null;
    return [c[0][km], c[1][km], c[2][km]];
  }

  function renderA4(strings, lang) {
    var sec = document.getElementById('a4-section');
    if (!sec) return;
    var st = a4State;
    var mi = A4_MODOS.indexOf(st.modo);
    document.getElementById('a4-km-out').textContent = st.km + ' km';

    var ci0 = [], ci1 = [], somaA4 = 0, nSoma = 0, nVis = 0;
    DATA.forEach(function (d, i) {
      if (!(tierVisible[d[3]] && baseMatches(d) && scenarioMatches(d))) return;
      var dd = withScenario(d);
      var fck = dd[0], co2 = dd[1];
      if (!fck || !(co2 / fck > 0)) return;
      nVis++;
      var a = A4[i];
      var add = 0;
      if (a && (a[0] === 's' || (st.prov && a[0] === 'p'))) {
        add = st.fac * (a[1 + mi] || 0) * st.km;
        somaA4 += add; nSoma++;
      }
      ci0.push(co2 / fck);
      ci1.push((co2 + add) / fck);
    });
    var m0 = median(ci0), m1 = median(ci1);
    document.getElementById('a4-kpi-pares').textContent = nSoma + ' / ' + nVis;
    document.getElementById('a4-kpi-a4').textContent = nSoma ? a4Fmt(somaA4 / nSoma, 1, lang) : '—';
    document.getElementById('a4-kpi-ci0').textContent = m0 === null ? '—' : a4Fmt(m0, 2, lang);
    document.getElementById('a4-kpi-ci1').textContent = m1 === null ? '—' : a4Fmt(m1, 2, lang);

    var kmS = st.km;
    var mod = a4Modelo(st.modo, kmS, st.fac, st.prov);
    var ref = A4MODELO ? A4MODELO.referencia : null;
    var muEl = document.getElementById('a4-kpi-mu');
    var difEl = document.getElementById('a4-kpi-dif');
    if (mod && ref) {
      muEl.textContent = a4Fmt(mod[0], 2, lang);
      var icEl = document.createElement('span');
      icEl.className = 'a4-ic';
      icEl.textContent = '[' + a4Fmt(mod[1], 2, lang) + '–' + a4Fmt(mod[2], 2, lang) + ']';
      muEl.appendChild(icEl);
      var dif = 100 * (mod[0] / ref[0] - 1);
      difEl.textContent = (dif >= 0 ? '+' : '') + a4Fmt(dif, 1, lang) + ' %';
    } else {
      muEl.textContent = '—';
      difEl.textContent = '—';
    }

    var nota = document.getElementById('a4-nota');
    nota.textContent = A4MODELO && ref
      ? strings.a4Nota.replace('{k}', fmtInt(A4MODELO.k, lang)).replace('{estudos}', A4MODELO.estudos)
          .replace('{ref}', a4Fmt(ref[0], 2, lang) + ' [' + a4Fmt(ref[1], 2, lang) + '–' + a4Fmt(ref[2], 2, lang) + ']')
          .replace('{km}', kmS)
      : strings.a4SemModelo;

    // gráfico: ci do modelo × distância, uma linha por veículo (factor e grupo escolhidos)
    var svg = document.getElementById('a4-chart');
    svg.textContent = '';
    var leg = document.getElementById('a4-legend');
    leg.textContent = '';
    if (!A4MODELO) return;
    var W = 640, H = 280, L = 48, R = 16, T = 30, B = 36;
    var dists = []; for (var dk = 0; dk <= A4MODELO.km_max; dk++) dists.push(dk);
    var series = A4_MODOS.map(function (m) {
      return dists.map(function (km) { return { km: km, v: a4Modelo(m, km, st.fac, st.prov) }; })
        .filter(function (p) { return p.v; });
    });
    var ys = [];
    series.forEach(function (s) { s.forEach(function (p) { ys.push(p.v[1], p.v[2]); }); });
    if (!ys.length) return;
    var yMin = Math.floor(Math.min.apply(null, ys)), yMax = Math.ceil(Math.max.apply(null, ys));
    if (yMax === yMin) yMax = yMin + 1;
    function x(km) { return L + km / 300 * (W - L - R); }
    function y(v) { return T + (1 - (v - yMin) / (yMax - yMin)) * (H - T - B); }
    for (var g = yMin; g <= yMax; g++) {
      svg.appendChild(svgEl('line', { x1: L, x2: W - R, y1: y(g), y2: y(g), stroke: 'var(--line)' }));
      var ty = svgEl('text', { x: L - 8, y: y(g) + 3, 'text-anchor': 'end' });
      ty.textContent = a4Fmt(g, 0, lang);
      svg.appendChild(ty);
    }
    [0, 50, 100, 150, 200, 250, 300].forEach(function (km) {
      var tx = svgEl('text', { x: x(km), y: H - B + 16, 'text-anchor': 'middle' });
      tx.textContent = km;
      svg.appendChild(tx);
    });
    var xl = svgEl('text', { x: W - R, y: H - 4, 'text-anchor': 'end' });
    xl.textContent = strings.a4EixoX;
    svg.appendChild(xl);
    var yl = svgEl('text', { x: 4, y: 12 });
    yl.textContent = strings.a4EixoY;
    svg.appendChild(yl);
    var cores = ['var(--green)', 'var(--cat-reciclado)', 'var(--cat-opc)', 'var(--cat-concreto_armado)'];
    var sel = series[mi];
    if (sel.length) {
      var band = sel.map(function (p) { return x(p.km) + ',' + y(p.v[2]); })
        .concat(sel.slice().reverse().map(function (p) { return x(p.km) + ',' + y(p.v[1]); }));
      svg.appendChild(svgEl('polygon', { points: band.join(' '), fill: 'var(--green)', 'fill-opacity': '0.1' }));
    }
    series.forEach(function (s, k) {
      var pts = s.map(function (p) { return x(p.km) + ',' + y(p.v[0]); }).join(' ');
      svg.appendChild(svgEl('polyline', { points: pts, fill: 'none', stroke: cores[k],
        'stroke-width': k === mi ? 2.5 : 1.2, 'stroke-opacity': k === mi ? 1 : 0.6 }));
      var lab = document.createElement('span');
      lab.style.color = cores[k];
      lab.textContent = strings['a4Modo_' + A4_MODOS[k]];
      leg.appendChild(lab);
    });
    if (mod) {
      svg.appendChild(svgEl('line', { x1: x(kmS), x2: x(kmS), y1: T, y2: H - B, stroke: 'var(--ink-16)', 'stroke-dasharray': '3 3' }));
      svg.appendChild(svgEl('circle', { cx: x(kmS), cy: y(mod[0]), r: 4, fill: cores[mi] }));
    }
  }

  function renderAll(strings, lang) {
    renderKPIs(lang);
    renderBaseCounts(lang);
    renderTierCounts(lang);
    renderScatterDesc(strings, lang);
    renderFunnelTrap(strings, lang);
    renderFunnel(strings, lang);
    renderScatter(strings);
    renderLegend(strings);
    renderForest(strings);
    renderA4(strings, lang);
    renderUnitChart(strings);
    renderMapa(strings, lang);
    renderRede(strings, lang);
  }

  var themeCtl = null;

  var i18n = window.KLI18n.init({
    copy: COPY,
    select: document.getElementById('lang-select'),
    onChange: function (lang, strings) {
      // No telemóvel o rótulo do botão do banco de dados esconde-se e fica só
      // o ícone -- o nome acessível passa a vir do aria-label.
      var dbLink = document.getElementById('db-link');
      dbLink.setAttribute('aria-label', strings.navDb);
      dbLink.setAttribute('title', strings.navDb);
      var prismaLink = document.getElementById('prisma-link');
      prismaLink.setAttribute('aria-label', strings.navPrisma);
      prismaLink.setAttribute('title', strings.navPrisma);
      [['base-info-btn', strings.baseInfoLabel], ['co2-info-btn', strings.co2InfoLabel]].forEach(function (b) {
        var btn = document.getElementById(b[0]);
        btn.setAttribute('aria-label', b[1]);
        btn.setAttribute('title', b[1]);
      });
      renderAll(strings, lang);
      if (themeCtl) themeCtl.sync();
    }
  });

  /* Botões (i) da barra de filtros (Kiê, 2026-10-16): cada um abre a nota do
     seu filtro por baixo da barra; só uma fica aberta de cada vez. */
  var infoBtns = ['base-info-btn', 'co2-info-btn'].map(function (id) { return document.getElementById(id); });
  function fecharInfo(excepto) {
    infoBtns.forEach(function (b) {
      if (b === excepto) return;
      b.setAttribute('aria-expanded', 'false');
      document.getElementById(b.getAttribute('aria-controls')).hidden = true;
    });
  }
  infoBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var aberto = btn.getAttribute('aria-expanded') !== 'true';
      fecharInfo(btn);
      btn.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      document.getElementById(btn.getAttribute('aria-controls')).hidden = !aberto;
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.filter-info-pop')) fecharInfo(null);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') fecharInfo(null);
  });

  /* Filtro da base do ligante: dois radios fixos no HTML. A escolha fica
     guardada no navegador (e pode vir no URL: ?base=portland). */
  ['todos', 'portland'].forEach(function (base) {
    var radio = document.getElementById('base-radio-' + base);
    radio.checked = baseFilter === base;
    radio.addEventListener('change', function () {
      if (!radio.checked) return;
      baseFilter = base;
      try { window.localStorage.setItem(BASE_KEY, base); } catch (e) {}
      renderAll(i18n.strings(), i18n.current());
    });
  });

  /* Indicador do forest por família: ci / ci_t (?forest=cit no URL). */
  METRICS.forEach(function (m) {
    var radio = document.getElementById('forest-radio-' + m);
    radio.checked = forestMetric === m;
    radio.addEventListener('change', function () {
      if (!radio.checked) return;
      forestMetric = m;
      try { window.localStorage.setItem(FOREST_KEY, m); } catch (e) {}
      renderForest(i18n.strings());
    });
  });

  /* F63: controlo do A4 (distância, veículo, factor, prováveis). */
  (function () {
    var km = document.getElementById('a4-km');
    if (!km) return;
    function redraw() { renderA4(i18n.strings(), i18n.current()); }
    km.addEventListener('input', function () { a4State.km = Number(km.value); redraw(); });
    document.querySelectorAll('input[name="a4-modo"]').forEach(function (r) {
      r.addEventListener('change', function () { if (r.checked) { a4State.modo = r.value; redraw(); } });
    });
    document.querySelectorAll('input[name="a4-fac"]').forEach(function (r) {
      r.addEventListener('change', function () { if (r.checked) { a4State.fac = Number(r.value); redraw(); } });
    });
    var prov = document.getElementById('a4-prov');
    prov.addEventListener('change', function () { a4State.prov = prov.checked; redraw(); });
  })();

  /* Cenário do CO₂: dois radios fixos no HTML (?co2=com no URL). */
  ['sem', 'com'].forEach(function (sc) {
    var radio = document.getElementById('co2-radio-' + sc);
    radio.checked = co2Scenario === sc;
    radio.addEventListener('change', function () {
      if (!radio.checked) return;
      co2Scenario = sc;
      try { window.localStorage.setItem(CO2_KEY, sc); } catch (e) {}
      renderAll(i18n.strings(), i18n.current());
    });
  });

  /* Os dois checkboxes de estrato ficam fixos no HTML (não são recriados a
     cada render), então os listeners são anexados uma vez só, aqui. */
  ['p', 's'].forEach(function (tier) {
    var box = document.getElementById('tier-check-' + tier);
    box.addEventListener('change', function () {
      // nunca deixar os dois desligados ao mesmo tempo -- sem isso o forest
      // e a dispersao ficam sem nenhum ponto para desenhar.
      var other = tier === 'p' ? 's' : 'p';
      if (!box.checked && !tierVisible[other]) {
        box.checked = true;
        return;
      }
      tierVisible[tier] = box.checked;
      renderAll(i18n.strings(), i18n.current());
    });
  });

  /* Universo do mapa e da rede de citações: dois grupos de radios (um em cada
     secção) que mexem no mesmo estado. */
  ['mapa', 'rede'].forEach(function (onde) {
    ['todos', 'meta'].forEach(function (u) {
      var radio = document.getElementById('univ-' + onde + '-' + u);
      if (!radio) return;
      radio.addEventListener('change', function () {
        if (!radio.checked) return;
        universo = u;
        try { window.localStorage.setItem(UNIV_KEY, u); } catch (e) {}
        renderMapa(i18n.strings(), i18n.current());
        renderRede(i18n.strings(), i18n.current());
      });
    });
  });

  var toggle = document.getElementById('theme-toggle');
  themeCtl = window.KLTheme.attach(toggle, function (dark) {
    var lang = i18n ? i18n.current() : 'PT';
    var labels = {
      PT: { toDark: 'Modo escuro', toLight: 'Modo claro' },
      EN: { toDark: 'Dark mode', toLight: 'Light mode' },
      ZH: { toDark: '深色模式', toLight: '浅色模式' }
    }[lang];
    var label = dark ? labels.toLight : labels.toDark;
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
  });
})();
