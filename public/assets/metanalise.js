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

  var DATA = [[47.4,343.2,"o","p","Assunção, 2020","P",null,0,"nao_declarado"],[26.91,379.4,"r","p","Chippagiri et al., 2023","P",null,0,null],[65.1,316.0,"s","p","De Schepper et al., 2014","P",250.6,0,null],[84.2,212.0,"s","p","De Schepper et al., 2014","P",146.2,0,null],[57.8,306.0,"o","p","De Schepper et al., 2014","P",339.3,0,"cem_i"],[69.3,322.0,"o","p","De Schepper et al., 2014","P",358.3,0,"cem_i"],[132.5,560.0,"u","p","Wagner et al., 2023","P",null,0,null],[40.0,271.9,"o","p","Borges et al., 2014","P",null,0,"cp_ii_e"],[40.0,75.1,"g","p","Borges et al., 2014","N",null,0,null],[32.0,463.0,"r","p","Mello, 2018","P",null,0,null],[25.0,286.37,"o","s","Figueiredo, 2017","P",null,0,"cp_ii_z"],[25.0,214.9,"o","p","Rezende, 2019","P",null,0,"nao_declarado"],[35.0,352.29,"o","s","Medeiros, 2012","P",null,0,"nao_declarado"],[20.0,256.88,"o","s","Medeiros, 2012","P",null,0,"nao_declarado"],[25.0,501.56,"c","p","Medeiros, 2016","P",null,0,null],[25.0,224.6,"o","p","Bento, 2016","P",null,1,"cp_iii"],[40.0,661.0,"c","p","Bento, 2016","P",648.6,0,null],[50.0,692.4,"c","p","Bento, 2016","P",679.0,0,null],[25.0,267.0,"o","p","Braga, 2018","P",null,0,"nao_declarado"],[118.1,597.24,"o","p","Isaia, 2021","P",null,0,"cp_v_ari"],[80.1,377.41,"s","p","Isaia, 2021","P",null,0,null],[56.3,325.09,"s","p","Isaia, 2021","P",null,0,null],[70.2,361.27,"s","p","Isaia, 2021","P",null,0,null],[28.0,212.83,"s","p","Isaia, 2021","P",null,0,null],[31.3,250.3,"s","p","Isaia, 2021","P",null,0,null],[25.0,265.22,"o","p","Navarro-Rubio et al., 2019","P",null,0,"nao_declarado"],[29.34,379.22,"o","p","Ankur & Singh, 2024","P",null,0,"is_opc_grau"],[26.03,303.06,"s","p","Ankur & Singh, 2024","P",null,0,null],[52.7,485.0,"o","p","Assunção, 2020","P",null,0,"nao_declarado"],[48.4,417.6,"o","p","Assunção, 2020","P",null,0,"nao_declarado"],[30.0,365.0,"o","p","Cong et al., 2024","P",364.19,0,"portland_sem_tipo"],[40.0,352.31,"o","p","Cong et al., 2024","P",351.5,0,"portland_sem_tipo"],[50.0,375.9,"o","p","Cong et al., 2024","P",375.09,0,"portland_sem_tipo"],[30.0,478.3,"o","s","Corti & Muciaccia, 2023","P",null,0,"nao_declarado"],[43.0,101.7,"l","p","Di Maria et al., 2020","N",-110.8,0,null],[43.0,71.8,"l","p","Di Maria et al., 2020","N",-140.7,0,null],[43.0,90.0,"l","p","Di Maria et al., 2020","N",-122.4,0,null],[33.9,380.0,"o","p","Habibi et al., 2024","P",null,0,"astm_type_ii"],[33.4,297.0,"r","p","Habibi et al., 2024","P",null,0,null],[40.0,311.6,"o","p","Hafez et al., 2024","P",null,0,"cem_i"],[40.0,386.6,"o","p","Hafez et al., 2024","P",null,0,"cem_i"],[40.0,218.8,"s","p","Hafez et al., 2024","P",null,0,null],[40.0,290.7,"s","p","Hafez et al., 2024","P",null,0,null],[86.3,1100.0,"u","p","Choi et al., 2023","P",null,0,null],[90.1,1170.0,"u","p","Choi et al., 2023","P",null,0,null],[35.0,795.8,"c","p","Sahmenko et al., 2021","P",null,0,null],[46.44,96.2,"g","p","Sposito, 2024","N",null,0,null],[97.21,108.0,"g","p","Sposito, 2024","N",null,0,null],[28.0,296.2,"o","p","Guaygua et al., 2024","P",null,0,"nao_declarado"],[28.0,298.1,"o","p","Guaygua et al., 2024","P",null,0,"nao_declarado"],[28.0,299.7,"o","p","Guaygua et al., 2024","P",null,0,"nao_declarado"],[28.0,294.8,"o","p","Guaygua et al., 2024","P",null,0,"nao_declarado"],[24.0,309.0,"s","p","Kim & Tae, 2016","P",null,0,null],[29.6,342.28,"o","p","Kim et al., 2016","P",null,0,"portland_sem_tipo"],[24.0,315.94,"s","p","Kim et al., 2016","P",null,0,null],[24.0,314.57,"s","p","Kim et al., 2016","P",null,0,null],[38.6,263.24,"s","p","Kim et al., 2016","P",null,0,null],[33.2,259.14,"s","p","Kim et al., 2016","P",null,0,null],[59.18,449.06,"o","s","Li et al., 2024","P",null,0,"gb_po"],[56.71,325.07,"s","s","Li et al., 2024","P",null,0,null],[50.0,561.6,"o","s","Ma et al., 2021","P",null,0,"nao_declarado"],[33.0,359.99,"s","p","Manan et al., 2025","P",null,0,null],[21.0,367.0,"o","p","Archila et al., 2018","P",null,0,"nao_declarado"],[21.0,345.0,"o","p","Archila et al., 2018","P",null,0,"nao_declarado"],[40.0,770.9,"c","p","Martinez-Munoz et al., 2021","P",770.9,1,null],[40.0,792.3,"c","p","Martinez-Munoz et al., 2021","P",792.3,1,null],[40.0,749.8,"c","p","Martinez-Munoz et al., 2021","P",749.8,1,null],[60.0,351.76,"o","p","Menegatti et al., 2022","P",null,0,"cem_i"],[60.0,352.43,"r","p","Menegatti et al., 2022","P",333.45,0,null],[26.1,807.0,"o","p","Mir et al., 2022","P",null,0,"portland_sem_tipo"],[30.0,1800.98,"g","p","Mir et al., 2022","N",null,0,null],[56.5,1631.9,"g","p","Mir et al., 2022","N",null,0,null],[52.3,1811.14,"g","p","Mir et al., 2022","N",null,0,null],[124.1,410.0,"u","s","Nassar et al., 2025","P",null,0,null],[121.3,399.0,"r","s","Nassar et al., 2025","P",null,0,null],[98.2,362.0,"r","s","Nassar et al., 2025","P",null,0,null],[123.4,414.0,"r","s","Nassar et al., 2025","P",null,0,null],[115.2,387.0,"r","s","Nassar et al., 2025","P",null,0,null],[48.41,574.03,"o","p","Onn et al., 2019","P",null,0,"astm_type_i"],[35.61,209.0,"s","p","Onn et al., 2019","P",null,0,null],[38.29,573.21,"o","p","Onn et al., 2019","P",null,0,"astm_type_i"],[26.05,207.0,"s","p","Onn et al., 2019","P",null,0,null],[25.0,420.0,"o","s","Paik et al., 2019","P",null,0,"nao_declarado"],[25.0,420.0,"o","s","Paik et al., 2019","P",null,0,"nao_declarado"],[24.0,420.0,"o","s","Paik & Na, 2019","P",null,0,"nao_declarado"],[24.0,420.0,"o","s","Paik & Na, 2019","P",null,0,"nao_declarado"],[24.0,432.0,"o","s","Paik & Na, 2019","P",null,0,"nao_declarado"],[24.0,429.4,"o","s","Paik & Na, 2019","P",null,0,"nao_declarado"],[24.0,427.0,"o","s","Paik & Na, 2019","P",null,0,"nao_declarado"],[49.5,352.65,"o","p","Pavlu et al., 2019","P",null,0,"cem_i"],[25.0,477.4,"o","p","Pedroso et al., 2024","P",null,0,"nao_declarado"],[25.0,483.1,"o","p","Pedroso et al., 2024","P",null,0,"nao_declarado"],[20.0,672.0,"c","p","Pujadas-Gispert et al., 2021","P",null,0,null],[35.0,494.0,"o","p","Sanchez-Pantoja et al., 2023","P",null,0,"cem_i"],[40.0,248.95,"c","p","Sandagomika et al., 2024","P",null,0,null],[25.0,391.3,"o","p","Sbahieh et al., 2023","P",null,0,"portland_sem_tipo"],[58.1,518.0,"s","p","Soltanzadeh et al., 2022","P",null,0,null],[55.54,491.0,"r","p","Soltanzadeh et al., 2022","P",null,0,null],[55.12,482.0,"r","p","Soltanzadeh et al., 2022","P",null,0,null],[52.03,466.0,"r","p","Soltanzadeh et al., 2022","P",null,0,null],[20.0,239.4,"o","p","Sombrio, 2015","P",null,0,"nao_declarado"],[71.07,452.0,"r","s","Starczyk-Kolbyk, 2024","P",null,0,null],[71.9,318.0,"o","p","Teply et al., 2018","P",null,0,"cem_i"],[47.2,312.0,"s","p","Teply et al., 2018","P",null,0,null],[70.5,344.0,"s","p","Teply et al., 2018","P",null,0,null],[30.0,270.88,"o","p","De Paula Filho et al., 2023","P",null,0,"nao_declarado"],[40.0,355.83,"o","p","De Paula Filho et al., 2023","P",null,0,"nao_declarado"],[50.0,429.0,"o","p","De Paula Filho et al., 2023","P",null,0,"nao_declarado"],[150.0,700.0,"u","s","Rai & Wille, 2025","P",null,0,null],[150.0,743.0,"u","s","Rai & Wille, 2025","P",null,0,null],[150.0,610.0,"u","s","Rai & Wille, 2025","P",null,0,null],[30.0,246.0,"o","s","Simões et al., 2021","P",null,0,"portland_sem_tipo"],[30.0,244.0,"r","s","Simões et al., 2021","P",null,0,null],[56.0,302.8,"s","p","Rathnarajan et al., 2025","P",null,0,null],[25.0,269.0,"o","s","Zhang et al., 2018","P",null,0,"cem_i"],[35.0,306.0,"o","s","Zhang et al., 2018","P",null,0,"cem_i"],[45.0,344.0,"o","s","Zhang et al., 2018","P",null,0,"cem_i"],[80.0,284.0,"s","s","Zhang et al., 2018","P",null,0,null],[90.0,317.0,"s","s","Zhang et al., 2018","P",null,0,null],[100.0,350.0,"s","s","Zhang et al., 2018","P",null,0,null],[160.0,482.0,"u","s","Zhang et al., 2018","P",null,0,null],[170.0,511.0,"u","s","Zhang et al., 2018","P",null,0,null],[180.0,539.0,"u","s","Zhang et al., 2018","P",null,0,null],[54.82,460.1,"s","p","Cunningham et al., 2025","P",459.5,0,null],[53.9,569.0,"o","p","Celik et al., 2015","P",null,0,"astm_type_i_ii"],[43.2,487.0,"s","p","Celik et al., 2015","P",null,0,null],[33.6,434.0,"s","p","Celik et al., 2015","P",null,0,null],[51.0,412.0,"s","p","Celik et al., 2015","P",null,0,null],[41.6,311.0,"s","p","Celik et al., 2015","P",null,0,null],[37.5,333.0,"s","p","Celik et al., 2015","P",null,0,null],[33.9,282.0,"s","p","Celik et al., 2015","P",null,0,null],[26.0,232.0,"s","p","Celik et al., 2015","P",null,0,null],[20.6,183.0,"s","p","Celik et al., 2015","P",null,0,null],[36.3,332.0,"s","p","Celik et al., 2015","P",null,0,null],[31.5,281.0,"s","p","Celik et al., 2015","P",null,0,null],[28.9,231.0,"s","p","Celik et al., 2015","P",null,0,null],[20.6,182.0,"s","p","Celik et al., 2015","P",null,0,null],[31.7,242.0,"s","p","Jin et al., 2025","P",null,0,null],[34.0,267.0,"s","p","Jin et al., 2025","P",null,0,null],[34.5,276.0,"s","p","Jin et al., 2025","P",null,0,null],[37.2,279.0,"s","p","Jin et al., 2025","P",null,0,null],[38.4,298.0,"s","p","Jin et al., 2025","P",null,0,null],[43.5,283.0,"s","p","Jin et al., 2025","P",null,0,null],[46.2,300.0,"s","p","Jin et al., 2025","P",null,0,null],[46.3,303.0,"s","p","Jin et al., 2025","P",null,0,null],[42.1,261.0,"s","p","Jin et al., 2025","P",null,0,null],[40.0,270.0,"s","p","Jin et al., 2025","P",null,0,null],[40.0,280.0,"s","p","Jin et al., 2025","P",null,0,null],[40.2,286.0,"s","p","Jin et al., 2025","P",null,0,null],[32.4,399.8,"o","p","Cordoba et al., 2023","P",null,0,"cem_i"],[37.4,350.2,"s","p","Cordoba et al., 2023","P",null,0,null],[28.3,355.8,"s","p","Cordoba et al., 2023","P",null,0,null],[47.1,378.6,"s","p","Cordoba et al., 2023","P",null,0,null],[38.5,322.0,"s","p","Cordoba et al., 2023","P",null,0,null],[28.0,279.5,"s","p","Cordoba et al., 2023","P",null,0,null],[45.0,380.6,"s","p","Cordoba et al., 2023","P",null,0,null],[35.4,323.5,"s","p","Cordoba et al., 2023","P",null,0,null],[23.1,280.7,"s","p","Cordoba et al., 2023","P",null,0,null],[32.8,322.6,"s","p","Cordoba et al., 2023","P",null,0,null],[32.6,341.7,"s","p","Cordoba et al., 2023","P",null,0,null],[34.1,350.5,"s","p","Cordoba et al., 2023","P",null,0,null],[40.0,395.0,"o","s","Alsalman et al., 2021","P",null,0,"astm_type_i"],[40.0,108.0,"g","s","Alsalman et al., 2021","N",null,0,null],[65.0,435.0,"s","s","Alsalman et al., 2021","P",null,0,null],[58.5,259.0,"g","s","Alsalman et al., 2021","N",null,0,null],[105.0,247.0,"s","s","Alsalman et al., 2021","P",null,0,null],[106.0,174.0,"g","s","Alsalman et al., 2021","N",null,0,null],[102.0,313.0,"g","s","Alsalman et al., 2021","N",null,0,null],[94.4,326.0,"g","p","Grengg et al., 2024","N",null,0,null],[35.9,215.4,"l","p","Abu-Ennab et al., 2022","N",null,0,null],[30.12,307.74,"r","p","Sharma & Singh, 2023","P",null,0,null],[51.0,273.81,"s","p","Thorne et al., 2024","P",null,0,null],[33.6,287.9,"s","p","Thorne et al., 2024","P",null,0,null],[53.9,498.87,"o","p","Thorne et al., 2024","P",null,0,"cem_i"],[38.72,1200.0,"o","p","Du et al., 2024","P",null,0,"cem_i"],[21.1,603.44,"r","p","Du et al., 2024","P",null,0,null],[32.0,770.9,"c","p","Villalba et al., 2024","P",null,0,null],[32.0,798.5,"c","p","Villalba et al., 2024","P",null,0,null],[27.9,184.8,"g","s","Narayanaswamy et al., 2020","N",null,0,null],[22.0,488.0,"g","p","Khan et al., 2023","N",null,0,null],[24.9,595.6,"o","p","Khan et al., 2023","P",null,0,"cem_ii"],[20.0,328.0,"o","s","Luca et al., 2023","P",null,0,"portland_sem_tipo"],[25.0,265.22,"o","p","Galan-Marin et al., 2015","P",null,0,"nao_declarado"],[69.0,345.0,"o","p","Nath et al., 2018","P",null,0,"as_gp"],[73.0,269.0,"s","p","Nath et al., 2018","P",null,0,null],[66.0,269.0,"s","p","Nath et al., 2018","P",null,0,null],[45.0,694.0,"o","p","Souto-Martinez et al., 2018","P",563.9,0,"branco"],[25.0,475.2,"c","s","Moncaster et al., 2018","P",null,0,null],[40.0,432.0,"o","s","Moncaster et al., 2018","P",null,0,"nao_declarado"],[31.0,585.5,"c","p","Amiri et al., 2021","P",null,0,null],[27.0,258.58,"o","p","Oh et al., 2023","P",null,0,"nao_declarado"],[35.0,382.4,"o","p","Zhao et al., 2021","P",null,0,"portland_sem_tipo"],[40.0,334.9,"o","p","Zhao et al., 2021","P",null,0,"portland_sem_tipo"],[47.61,359.1,"o","p","Dadd et al., 2025","P",null,0,"as_gp"],[34.7,314.1,"s","p","Smith & Durham, 2016","P",null,0,null],[38.3,296.1,"s","p","Smith & Durham, 2016","P",null,0,null],[36.5,278.0,"s","p","Smith & Durham, 2016","P",null,0,null],[31.7,241.8,"s","p","Smith & Durham, 2016","P",null,0,null],[32.9,413.83,"o","p","Di Sarno et al., 2024","P",null,0,"cem_i"],[31.8,413.83,"o","p","Di Sarno et al., 2024","P",348.09,0,"cem_i"],[33.0,175.0,"l","p","Grist et al., 2015","N",null,0,null],[33.0,135.0,"l","p","Grist et al., 2015","N",null,0,null],[33.0,95.0,"l","p","Grist et al., 2015","N",null,0,null],[33.0,265.0,"o","p","Grist et al., 2015","P",null,0,"cem_i"],[33.0,160.0,"s","p","Grist et al., 2015","P",null,0,null],[49.0,195.0,"l","p","Grist et al., 2015","N",null,0,null],[49.0,345.0,"o","p","Grist et al., 2015","P",null,0,"cem_i"],[49.0,235.0,"s","p","Grist et al., 2015","P",null,0,null],[40.5,260.4,"o","p","Marinkovic et al., 2017","P",null,0,"cem_ii_a"],[42.0,197.1,"s","p","Marinkovic et al., 2017","P",null,0,null],[40.7,134.2,"g","p","Marinkovic et al., 2017","N",null,0,null],[42.1,266.3,"r","p","Marinkovic et al., 2017","P",null,0,null],[40.5,196.5,"r","p","Marinkovic et al., 2017","P",null,0,null],[50.0,345.0,"g","p","Teh et al., 2017","N",null,0,null],[50.0,291.0,"g","p","Teh et al., 2017","N",null,0,null],[50.0,508.9,"o","p","Teh et al., 2017","P",null,0,"portland_sem_tipo"],[35.0,432.0,"o","p","Gutierreza et al., 2017","P",null,0,"astm_c150"],[35.0,408.0,"o","p","Gutierreza et al., 2017","P",null,0,"nc_cuba"],[25.0,301.0,"o","p","Gutierreza et al., 2017","P",null,0,"nc_cuba"],[21.0,257.0,"o","p","DeRousseau et al., 2020","P",174.8,0,"portland_sem_tipo"],[21.0,220.0,"s","p","DeRousseau et al., 2020","P",144.8,0,null],[32.0,651.2,"o","p","Abdulkareem et al., 2021","P",null,0,"nao_declarado"],[25.0,370.0,"o","p","Haigh et al., 2024","P",null,0,"as_gp"],[20.0,360.0,"r","p","Haigh et al., 2024","P",null,0,null],[21.0,343.0,"r","p","Haigh et al., 2024","P",null,0,null],[25.93,234.0,"s","s","Momotaz et al., 2023","P",null,0,null],[27.85,276.1,"r","s","Momotaz et al., 2023","P",238.0,0,null],[25.23,317.8,"r","s","Momotaz et al., 2023","P",244.0,0,null],[27.68,347.7,"r","s","Momotaz et al., 2023","P",236.0,0,null],[27.33,377.5,"r","s","Momotaz et al., 2023","P",228.0,0,null],[26.55,222.4,"r","s","Momotaz et al., 2023","P",65.7,0,null],[28.15,275.1,"r","s","Momotaz et al., 2023","P",88.3,0,null],[28.51,324.0,"r","s","Momotaz et al., 2023","P",109.0,0,null],[27.72,354.9,"r","s","Momotaz et al., 2023","P",110.0,0,null],[28.12,385.8,"r","s","Momotaz et al., 2023","P",111.0,0,null],[38.7,475.0,"o","p","Bayat et al., 2024","P",null,0,"cem_i"],[38.1,457.0,"s","p","Bayat et al., 2024","P",null,0,null],[37.8,439.0,"s","p","Bayat et al., 2024","P",null,0,null],[36.4,422.0,"s","p","Bayat et al., 2024","P",null,0,null],[37.6,407.0,"s","p","Bayat et al., 2024","P",null,0,null],[37.5,371.0,"s","p","Bayat et al., 2024","P",null,0,null],[31.1,337.0,"s","p","Bayat et al., 2024","P",null,0,null],[36.0,370.0,"s","p","Bayat et al., 2024","P",null,0,null],[32.8,335.0,"s","p","Bayat et al., 2024","P",null,0,null],[30.6,300.0,"s","p","Bayat et al., 2024","P",null,0,null],[62.45,611.86,"o","s","Celikten & Baran, 2024","P",null,0,"cem_i"],[62.95,582.59,"s","s","Celikten & Baran, 2024","P",null,0,null],[63.55,553.32,"s","s","Celikten & Baran, 2024","P",null,0,null],[68.65,524.04,"s","s","Celikten & Baran, 2024","P",null,0,null],[59.8,494.77,"s","s","Celikten & Baran, 2024","P",null,0,null],[57.85,465.5,"s","s","Celikten & Baran, 2024","P",null,0,null],[20.0,113.3,"s","s","Hafez et al., 2023","P",null,0,null],[30.0,132.6,"s","s","Hafez et al., 2023","P",null,0,null],[40.0,137.3,"s","s","Hafez et al., 2023","P",null,0,null],[50.0,155.2,"s","s","Hafez et al., 2023","P",null,0,null],[60.0,163.0,"s","s","Hafez et al., 2023","P",null,0,null],[70.0,173.6,"s","s","Hafez et al., 2023","P",null,0,null],[80.0,201.4,"s","s","Hafez et al., 2023","P",null,0,null],[143.0,709.9,"u","p","Joachim & Oettel, 2024","P",null,0,null],[133.6,914.72,"u","p","Joachim & Oettel, 2024","P",null,0,null],[114.4,713.7,"u","p","Joachim & Oettel, 2024","P",null,0,null],[106.4,716.65,"u","p","Joachim & Oettel, 2024","P",null,0,null],[105.2,715.48,"u","p","Joachim & Oettel, 2024","P",null,0,null],[36.08,365.87,"o","s","Raveendran & Krishnan, 2025","P",null,0,"is_opc_grau"],[41.0,366.14,"s","s","Raveendran & Krishnan, 2025","P",null,0,null],[43.28,366.4,"s","s","Raveendran & Krishnan, 2025","P",null,0,null],[40.0,366.67,"s","s","Raveendran & Krishnan, 2025","P",null,0,null],[38.5,356.35,"s","s","Raveendran & Krishnan, 2025","P",null,0,null],[41.02,340.41,"s","s","Raveendran & Krishnan, 2025","P",null,0,null],[33.64,330.0,"s","s","Raveendran & Krishnan, 2025","P",null,0,null],[49.02,341.11,"s","s","Raveendran & Krishnan, 2025","P",null,0,null],[20.0,228.76,"o","s","Xu et al., 2024","P",null,0,"nao_declarado"],[25.0,250.76,"o","s","Xu et al., 2024","P",null,0,"nao_declarado"],[30.0,280.03,"o","s","Xu et al., 2024","P",null,0,"nao_declarado"],[40.0,280.07,"o","s","Xu et al., 2024","P",null,0,"nao_declarado"],[50.0,371.66,"o","s","Xu et al., 2024","P",null,0,"nao_declarado"],[35.0,405.8,"r","p","Yu et al., 2024","P",null,0,null],[35.1,412.4,"r","p","Yu et al., 2024","P",null,0,null],[35.0,411.6,"r","p","Yu et al., 2024","P",null,0,null],[35.0,411.4,"r","p","Yu et al., 2024","P",null,0,null],[35.0,411.6,"r","p","Yu et al., 2024","P",null,0,null],[35.0,402.1,"s","p","Yu et al., 2024","P",null,0,null],[35.1,395.1,"s","p","Yu et al., 2024","P",null,0,null],[35.1,390.3,"s","p","Yu et al., 2024","P",null,0,null],[35.0,385.4,"s","p","Yu et al., 2024","P",null,0,null],[41.51,273.38,"s","s","Badgujar, 2023","P",null,0,null],[39.24,272.42,"r","s","Badgujar, 2023","P",271.45,0,null],[41.36,271.93,"r","s","Badgujar, 2023","P",270.48,0,null],[43.29,271.45,"r","s","Badgujar, 2023","P",269.51,0,null],[40.86,270.96,"r","s","Badgujar, 2023","P",268.54,0,null],[38.29,270.48,"r","s","Badgujar, 2023","P",267.57,0,null],[20.0,369.0,"o","p","Rondinel-Oviedo, 2024","P",369.0,1,"portland_sem_tipo"],[35.0,466.4,"c","p","Horakova et al., 2019","P",null,0,null],[90.0,656.3,"c","p","Horakova et al., 2019","P",null,0,null],[90.0,594.2,"c","p","Horakova et al., 2019","P",null,0,null],[36.6,280.1,"o","p","Pesta et al., 2019","P",null,0,"cem_i"],[25.4,271.1,"r","p","Pesta et al., 2019","P",null,0,null],[29.3,278.5,"r","p","Pesta et al., 2019","P",null,0,null],[37.8,254.2,"s","p","Pesta et al., 2019","P",null,0,null],[35.0,263.9,"r","p","Pesta et al., 2019","P",null,0,null],[32.2,304.4,"r","p","Pesta et al., 2019","P",null,0,null],[20.0,239.19,"o","p","Lu et al., 2019","P",null,0,"nao_declarado"],[30.0,346.95,"o","p","Lu et al., 2019","P",null,0,"nao_declarado"],[20.3,221.0,"o","p","Coral et al., 2025","P",null,0,"nao_declarado"],[61.1,432.0,"o","p","Tian et al., 2024","P",null,0,"gb_po"],[65.4,392.0,"s","p","Tian et al., 2024","P",null,0,null],[64.7,364.2,"o","p","Radovic et al., 2022","P",null,0,"cem_i"],[25.0,463.1,"o","p","Salandin et al., 2022","P",null,0,"portland_sem_tipo"],[27.6,313.72,"o","p","Acosta-Calderon et al., 2022","P",null,0,"astm_c1157"],[29.3,313.74,"o","p","Acosta-Calderon et al., 2022","P",null,0,"astm_c1157"],[27.2,315.08,"o","p","Acosta-Calderon et al., 2022","P",null,0,"astm_c1157"],[30.0,295.0,"o","p","Wang et al., 2020","P",null,0,"nao_declarado"],[140.0,600.0,"u","s","Eltantawi et al., 2024","P",null,0,null],[132.7,360.0,"g","s","Eltantawi et al., 2024","N",null,0,null],[43.2,274.0,"o","p","Pushkar et al., 2022","P",null,0,"portland_sem_tipo"],[39.11,350.0,"g","s","Kanagaraj et al., 2022","N",null,0,null],[20.0,255.0,"o","p","Abouhamad & Abu-Hamd, 2021","P",null,0,"nao_declarado"],[30.0,335.0,"o","p","Abouhamad & Abu-Hamd, 2021","P",null,0,"nao_declarado"],[46.48,695.3,"s","s","Zhu et al., 2023","P",null,0,null],[43.86,694.6,"r","s","Zhu et al., 2023","P",null,0,null],[36.22,693.3,"r","s","Zhu et al., 2023","P",null,0,null],[30.48,693.2,"r","s","Zhu et al., 2023","P",null,0,null],[25.87,691.8,"r","s","Zhu et al., 2023","P",null,0,null],[25.0,231.4,"s","s","Momotaz et al., 2022","P",null,0,null],[25.0,222.4,"r","s","Momotaz et al., 2022","P",65.0,0,null],[25.0,377.5,"r","s","Momotaz et al., 2022","P",225.6,0,null],[25.0,385.8,"r","s","Momotaz et al., 2022","P",109.8,0,null],[25.0,199.92,"o","p","Huber et al., 2024","P",null,0,"nao_declarado"],[30.0,219.12,"o","p","Huber et al., 2024","P",null,0,"nao_declarado"],[30.0,321.3,"o","s","Zheng et al., 2023","P",null,0,"nao_declarado"],[20.0,383.4,"c","p","Aryan et al., 2024","P",375.6,0,null],[52.1,3060.0,"l","p","Sinka et al., 2020","N",null,0,null],[75.2,1550.0,"l","p","Sinka et al., 2020","N",null,0,null],[88.6,1030.0,"l","p","Sinka et al., 2020","N",null,0,null],[30.0,138.24,"b","s","Ascione et al., 2024","N",-113.28,0,null],[42.25,437.0,"o","p","Islam et al., 2024","P",null,0,"astm_type_i"],[33.8,366.0,"r","p","Islam et al., 2024","P",null,0,null],[48.25,419.0,"r","p","Islam et al., 2024","P",null,0,null],[20.0,247.69,"o","p","Huang et al., 2016","P",null,0,"nao_declarado"],[25.0,267.69,"o","p","Huang et al., 2016","P",null,0,"nao_declarado"],[30.0,287.69,"o","p","Huang et al., 2016","P",null,0,"nao_declarado"],[35.0,307.69,"o","p","Huang et al., 2016","P",null,0,"nao_declarado"],[40.0,327.69,"o","p","Huang et al., 2016","P",null,0,"nao_declarado"],[50.0,367.69,"o","p","Huang et al., 2016","P",null,0,"nao_declarado"],[80.0,685.7,"o","p","Bumanis et al., 2022","P",684.6,0,"cem_i"],[25.0,525.0,"c","p","Dervishaj et al., 2024","P",505.3,0,null],[25.0,525.8,"c","p","Dervishaj et al., 2024","P",506.6,0,null],[32.0,420.0,"o","p","D'Orazio et al., 2023","P",null,0,"cem_ii_a"],[32.0,418.0,"r","p","D'Orazio et al., 2023","P",310.0,0,null],[25.0,420.0,"o","p","D'Orazio et al., 2023","P",null,0,"cem_ii_a"],[25.0,420.2,"r","p","D'Orazio et al., 2023","P",385.0,0,null],[58.0,791.67,"c","p","Haverkamp et al., 2025","P",791.67,1,null],[67.4,285.0,"o","p","Inman et al., 2017","P",null,0,"nao_declarado"],[60.4,284.6,"o","p","Inman et al., 2017","P",null,0,"nao_declarado"],[61.7,284.6,"o","p","Inman et al., 2017","P",null,0,"nao_declarado"],[57.1,284.6,"o","p","Inman et al., 2017","P",null,0,"nao_declarado"],[31.4,281.9,"o","p","Inman et al., 2017","P",null,0,"nao_declarado"],[21.0,409.0,"o","s","Jang et al., 2022","P",null,0,"nao_declarado"],[21.0,419.0,"o","s","Jang et al., 2022","P",null,0,"nao_declarado"],[24.0,414.0,"o","s","Jang et al., 2022","P",null,0,"nao_declarado"],[24.0,429.0,"o","s","Jang et al., 2022","P",null,0,"nao_declarado"],[24.0,414.0,"o","s","Jang et al., 2022","P",null,0,"nao_declarado"],[30.0,230.0,"o","p","Jayasinghe et al., 2021","P",null,0,"nao_declarado"],[32.0,240.0,"o","p","Jayasinghe et al., 2021","P",null,0,"nao_declarado"],[24.0,299.0,"s","p","Kim & Chae, 2016","P",null,0,null],[24.0,331.0,"o","p","Kim & Chae, 2016","P",null,0,"portland_sem_tipo"],[24.0,300.0,"s","p","Kim & Chae, 2016","P",null,0,null],[24.0,269.0,"s","p","Kim & Chae, 2016","P",null,0,null],[24.0,239.0,"s","p","Kim & Chae, 2016","P",null,0,null],[24.0,340.9,"s","p","Kim et al., 2016","P",null,0,null],[24.0,225.7,"s","p","Kim et al., 2016","P",null,0,null],[30.0,134.59,"s","p","Kim et al., 2016","P",null,0,null],[30.0,247.83,"s","p","Kim et al., 2016","P",null,0,null],[45.5,178.7,"g","p","Kul et al., 2023","N",null,0,null],[66.2,251.4,"g","p","Kul et al., 2023","N",null,0,null],[61.9,302.8,"g","p","Kul et al., 2023","N",null,0,null],[51.1,258.9,"g","p","Li et al., 2024","N",null,0,null],[51.1,469.3,"o","p","Li et al., 2024","P",null,0,"cem_i"],[36.21,362.02,"o","s","Li et al., 2024","P",null,0,"gb_po"],[33.42,361.71,"r","s","Li et al., 2024","P",null,0,null],[26.81,361.39,"r","s","Li et al., 2024","P",null,0,null],[25.54,360.88,"r","s","Li et al., 2024","P",null,0,null],[23.51,360.51,"r","s","Li et al., 2024","P",null,0,null],[40.56,362.79,"o","s","Li et al., 2024","P",null,0,"gb_po"],[37.43,362.48,"r","s","Li et al., 2024","P",null,0,null],[29.2,362.16,"r","s","Li et al., 2024","P",null,0,null],[27.61,361.65,"r","s","Li et al., 2024","P",null,0,null],[26.12,361.28,"r","s","Li et al., 2024","P",null,0,null],[42.22,363.17,"o","s","Li et al., 2024","P",null,0,"gb_po"],[39.23,362.86,"r","s","Li et al., 2024","P",null,0,null],[30.28,362.55,"r","s","Li et al., 2024","P",null,0,null],[28.21,362.04,"r","s","Li et al., 2024","P",null,0,null],[26.92,361.66,"r","s","Li et al., 2024","P",null,0,null],[20.0,208.98,"o","p","Li et al., 2024","P",null,0,"nao_declarado"],[25.0,247.46,"o","p","Li et al., 2024","P",null,0,"nao_declarado"],[30.0,277.82,"o","p","Li et al., 2024","P",null,0,"nao_declarado"],[35.0,314.77,"o","p","Li et al., 2024","P",null,0,"nao_declarado"],[40.0,348.04,"o","p","Li et al., 2024","P",null,0,"nao_declarado"],[45.0,390.16,"o","p","Li et al., 2024","P",null,0,"nao_declarado"],[30.0,270.88,"o","p","Matias de Paula Filho et al., 2024","P",null,0,"nao_declarado"],[40.0,355.83,"o","p","Matias de Paula Filho et al., 2024","P",null,0,"nao_declarado"],[50.0,429.0,"o","p","Matias de Paula Filho et al., 2024","P",null,0,"nao_declarado"],[25.0,521.5,"c","p","Pons et al., 2018","P",521.5,1,null],[25.0,213.7,"o","p","Pons et al., 2018","P",213.7,1,"nao_declarado"],[25.0,134.9,"r","p","Sameer et al., 2020","P",null,0,null],[32.0,339.0,"o","p","Tait & Cheung, 2016","P",null,0,"cem_i"],[32.0,227.0,"s","p","Tait & Cheung, 2016","P",null,0,null],[32.0,127.0,"s","p","Tait & Cheung, 2016","P",null,0,null],[45.0,528.38,"c","p","Zhang et al., 2023","P",468.22,0,null],[25.0,524.7,"o","p","Zhang et al., 2023","P",null,0,"portland_sem_tipo"],[30.0,747.8,"c","s","Zhang & Zhang, 2023","P",null,0,null],[38.35,488.0,"o","p","Zheng et al., 2025","P",null,0,"portland_sem_tipo"],[36.91,486.0,"r","p","Zheng et al., 2025","P",null,0,null],[33.0,485.0,"r","p","Zheng et al., 2025","P",null,0,null],[31.75,483.0,"r","p","Zheng et al., 2025","P",null,0,null],[32.13,473.0,"r","p","Zheng et al., 2025","P",null,0,null],[28.11,471.0,"r","p","Zheng et al., 2025","P",null,0,null],[26.95,470.0,"r","p","Zheng et al., 2025","P",null,0,null],[26.72,467.0,"r","p","Zheng et al., 2025","P",null,0,null],[26.04,468.0,"r","p","Zheng et al., 2025","P",null,0,null],[25.22,466.0,"r","p","Zheng et al., 2025","P",null,0,null],[25.37,465.0,"r","p","Zheng et al., 2025","P",null,0,null],[22.15,462.0,"r","p","Zheng et al., 2025","P",null,0,null],[52.0,314.0,"g","p","Almeida, 2024","N",null,0,null],[52.0,161.0,"g","p","Almeida, 2024","N",null,0,null],[52.0,281.0,"g","p","Almeida, 2024","N",null,0,null],[52.0,202.0,"g","p","Almeida, 2024","N",null,0,null],[52.0,317.0,"g","p","Almeida, 2024","N",null,0,null],[58.0,252.0,"g","p","Almeida, 2024","N",null,0,null],[58.0,232.0,"g","p","Almeida, 2024","N",null,0,null],[58.0,283.0,"g","p","Almeida, 2024","N",null,0,null],[58.0,235.0,"g","p","Almeida, 2024","N",null,0,null],[58.0,370.0,"g","p","Almeida, 2024","N",null,0,null],[50.0,133.0,"g","p","Almeida, 2024","N",null,0,null],[50.0,137.0,"g","p","Almeida, 2024","N",null,0,null],[50.0,200.0,"g","p","Almeida, 2024","N",null,0,null],[50.0,145.0,"g","p","Almeida, 2024","N",null,0,null],[50.0,312.0,"g","p","Almeida, 2024","N",null,0,null],[52.0,301.0,"o","p","Almeida, 2024","P",null,0,"cp_iii"],[52.0,306.0,"o","p","Almeida, 2024","P",null,0,"cp_iii"],[52.0,312.0,"o","p","Almeida, 2024","P",null,0,"cp_iii"],[52.0,316.0,"o","p","Almeida, 2024","P",null,0,"cp_iii"],[52.0,406.0,"o","p","Almeida, 2024","P",null,0,"cp_iii"],[51.0,353.0,"o","p","Almeida, 2024","P",null,0,"cp_i"],[51.0,359.0,"o","p","Almeida, 2024","P",null,0,"cp_i"],[51.0,365.0,"o","p","Almeida, 2024","P",null,0,"cp_i"],[51.0,369.0,"o","p","Almeida, 2024","P",null,0,"cp_i"],[51.0,473.0,"o","p","Almeida, 2024","P",null,0,"cp_i"],[35.0,502.18,"o","p","Rigon, 2015","P",null,0,"cp_ii_f"],[35.0,381.88,"s","p","Rigon, 2015","P",null,0,null],[35.0,545.4,"o","p","Rigon, 2015","P",null,0,"cp_ii_f"],[35.0,503.48,"s","p","Rigon, 2015","P",null,0,null],[40.18,556.6,"o","p","Lyra, 2023","P",null,0,"cp_v_ari"],[33.82,554.6,"s","p","Lyra, 2023","P",null,0,null],[33.57,531.7,"s","p","Lyra, 2023","P",528.3,0,null],[39.51,491.0,"s","p","Lyra, 2023","P",482.9,0,null],[34.08,442.6,"s","p","Lyra, 2023","P",423.5,0,null],[34.53,529.3,"s","p","Lyra, 2023","P",518.8,0,null],[41.16,490.5,"s","p","Lyra, 2023","P",469.6,0,null],[35.14,440.3,"s","p","Lyra, 2023","P",395.5,0,null],[24.4,1308.47,"l","p","Sposito, 2024","N",null,0,null],[26.3,1154.5,"l","p","Sposito, 2024","N",null,0,null],[25.0,248.8,"o","p","Boros, 2023","P",null,0,"nao_declarado"],[30.0,347.6,"c","s","Asensio et al., 2023","P",null,0,null],[35.0,415.9,"c","s","Asensio et al., 2023","P",null,0,null],[42.2,367.0,"o","p","Sirico et al., 2024","P",null,0,"cem_ii_a"],[44.9,360.0,"s","p","Sirico et al., 2024","P",360.0,1,null],[41.1,357.0,"s","p","Sirico et al., 2024","P",357.0,1,null],[39.1,353.0,"s","p","Sirico et al., 2024","P",353.0,1,null],[78.0,983.0,"o","p","Jones & Li, 2024","P",null,0,"nao_declarado"],[35.0,405.0,"o","p","Jones & Li, 2024","P",null,0,"nao_declarado"],[25.0,366.3,"o","p","Abdelaal et al., 2024","P",null,0,"portland_sem_tipo"],[25.0,304.4,"s","p","Abdelaal et al., 2024","P",null,0,null],[25.0,230.3,"s","p","Abdelaal et al., 2024","P",null,0,null],[61.0,484.6,"r","p","Gillani et al., 2023","P",null,0,null],[65.0,484.6,"r","p","Gillani et al., 2023","P",null,0,null],[60.0,565.0,"o","p","Gillani et al., 2023","P",null,0,"is_opc_grau"],[71.3,628.5,"o","p","Ali et al., 2023","P",null,0,"is_opc_grau"],[51.5,358.4,"s","s","Kina, 2024","P",null,0,null],[52.6,361.8,"s","s","Kina, 2024","P",null,0,null],[30.0,345.0,"c","p","Colangelo et al., 2020","M",345.0,1,null],[20.0,320.52,"o","s","Yu et al., 2020","P",null,0,"nao_declarado"],[25.0,358.56,"o","s","Yu et al., 2020","P",null,0,"nao_declarado"],[32.0,412.06,"o","s","Yu et al., 2020","P",null,0,"nao_declarado"],[40.0,496.12,"o","s","Yu et al., 2020","P",null,0,"portland_sem_tipo"],[50.0,628.04,"o","s","Yu et al., 2020","P",null,0,"nao_declarado"],[65.0,797.69,"o","s","Yu et al., 2020","P",null,0,"nao_declarado"],[35.0,314.0,"o","p","Zieger et al., 2020","P",null,0,"portland_sem_tipo"],[27.58,393.0,"s","p","Cai et al., 2022","P",null,0,null],[50.0,355.0,"g","s","Sandanayake et al., 2022","N",null,0,null],[20.0,250.0,"o","p","Li et al., 2023","P",112.5,0,"nao_declarado"],[25.0,267.7,"o","p","Li et al., 2023","P",120.5,0,"nao_declarado"],[30.0,287.7,"o","p","Li et al., 2023","P",129.5,0,"nao_declarado"],[35.0,307.7,"o","p","Li et al., 2023","P",138.5,0,"nao_declarado"],[40.0,327.7,"o","p","Li et al., 2023","P",147.5,0,"nao_declarado"],[50.0,367.7,"o","p","Li et al., 2023","P",165.5,0,"nao_declarado"],[30.0,334.9,"c","p","Habert et al., 2013","P",null,0,null],[50.0,445.23,"o","p","Garces et al., 2022","P",null,0,"cem_i"],[50.0,344.75,"g","p","Garces et al., 2022","N",null,0,null],[50.0,333.93,"g","p","Garces et al., 2022","N",null,0,null],[50.0,380.43,"g","p","Garces et al., 2022","N",null,0,null],[50.0,369.62,"g","p","Garces et al., 2022","N",null,0,null],[45.4,1212.0,"o","p","Tefa et al., 2025","P",null,0,"cem_ii_b"],[50.0,417.16,"g","p","Garces et al., 2021","N",null,0,null],[30.0,557.13,"c","p","Menna Barreto et al., 2021","P",546.95,0,null],[35.0,509.0,"o","p","Hussain et al., 2025","P",null,0,"nao_declarado"],[35.2,403.0,"r","p","Jimenez et al., 2015","P",null,0,null],[44.0,566.0,"o","p","Teixeira et al., 2019","P",null,0,"cem_i"],[29.1,381.8,"o","p","Oyebisi & Alomayri, 2022","P",null,0,"cem_ii"],[34.5,427.2,"o","p","Oyebisi & Alomayri, 2022","P",null,0,"cem_ii"],[45.9,540.6,"o","p","Oyebisi & Alomayri, 2022","P",null,0,"cem_ii"],[134.2,768.4,"u","s","Guo et al., 2023","P",null,0,null],[127.6,771.0,"u","s","Guo et al., 2023","P",null,0,null],[118.3,656.0,"u","s","Guo et al., 2023","P",null,0,null],[28.0,331.36,"o","p","Lorika et al., 2023","P",null,0,"cem_ii_a"],[29.1,298.84,"o","p","Lorika et al., 2023","P",null,0,"cem_ii_a"],[46.5,356.0,"o","p","Kanagaraj et al., 2023","P",null,0,"portland_sem_tipo"],[79.9,373.0,"s","p","Kanagaraj et al., 2023","P",null,0,null],[47.2,313.0,"g","p","Kanagaraj et al., 2023","N",null,0,null],[76.82,346.0,"g","p","Kanagaraj et al., 2023","N",null,0,null],[48.25,183.0,"s","p","Kanagaraj et al., 2023","P",null,0,null],[79.9,268.0,"s","p","Kanagaraj et al., 2023","P",null,0,null],[24.2,270.0,"o","p","Los Santos-Ortega et al., 2023","P",null,0,"cem_ii_a"],[20.04,292.0,"r","p","Los Santos-Ortega et al., 2023","P",240.0,0,null],[57.06,412.0,"g","s","Kanagaraj et al., 2023","N",null,0,null],[52.9,253.0,"s","p","Mahdi et al., 2023","P",null,0,null],[29.8,267.0,"r","p","Mahdi et al., 2023","P",null,0,null],[20.7,268.0,"r","p","Mahdi et al., 2023","P",null,0,null],[28.6,813.06,"g","p","Gholampour et al., 2025","N",null,0,null],[44.1,848.53,"g","p","Gholampour et al., 2025","N",null,0,null],[62.9,914.0,"g","p","Gholampour et al., 2025","N",null,0,null],[30.6,923.63,"g","p","Gholampour et al., 2025","N",null,0,null],[47.5,959.11,"g","p","Gholampour et al., 2025","N",null,0,null],[65.6,1024.57,"g","p","Gholampour et al., 2025","N",null,0,null],[60.37,351.87,"g","s","Raj R et al., 2025","N",null,0,null],[59.23,511.0,"o","p","Hossain et al., 2021","P",null,0,"portland_sem_tipo"],[63.0,446.0,"s","p","Hossain et al., 2021","P",null,0,null],[64.37,366.0,"s","p","Hossain et al., 2021","P",null,0,null],[70.7,429.0,"s","p","Hossain et al., 2021","P",null,0,null],[64.8,385.0,"s","p","Hossain et al., 2021","P",null,0,null],[44.79,184.0,"g","p","Irshidat et al., 2021","N",null,0,null],[21.94,559.69,"r","p","Luo et al., 2021","P",559.69,1,null],[50.13,483.25,"g","p","Luo et al., 2021","N",483.25,1,null],[23.0,612.9,"g","s","Damrongwiriyanupap et al., 2022","N",null,0,null],[46.0,612.92,"g","s","Damrongwiriyanupap et al., 2022","N",null,0,null],[31.0,365.71,"o","p","Goh et al., 2022","P",null,0,"portland_sem_tipo"],[37.5,361.1,"r","p","Goh et al., 2022","P",null,0,null],[52.0,278.68,"s","p","Goh et al., 2022","P",null,0,null],[35.0,287.32,"g","p","Goh et al., 2022","N",null,0,null],[53.5,440.5,"s","s","Yu et al., 2022","P",null,0,null],[44.3,411.6,"s","s","Yu et al., 2022","P",null,0,null],[48.3,543.6,"r","s","Yu et al., 2022","P",null,0,null],[23.0,248.3,"s","s","Yu et al., 2022","P",null,0,null],[52.4,422.3,"r","s","Yu et al., 2022","P",null,0,null],[32.0,334.58,"s","p","Bediako & Valentini, 2022","P",null,0,null],[43.23,429.56,"o","s","Amran et al., 2022","P",null,0,"astm_type_i"],[29.18,217.52,"s","s","Amran et al., 2022","P",null,0,null],[45.98,217.56,"s","s","Amran et al., 2022","P",null,0,null],[36.64,217.59,"s","s","Amran et al., 2022","P",null,0,null],[110.02,988.0,"u","s","Abdellatief et al., 2023","P",null,0,null],[89.9,623.0,"u","s","Abdellatief et al., 2023","P",null,0,null],[108.95,767.0,"u","s","Abdellatief et al., 2023","P",null,0,null],[25.0,207.5,"s","s","Shobeiri et al., 2023","P",null,0,null],[47.5,382.3,"o","p","Al Ghali et al., 2023","P",null,0,"astm_type_i"],[30.1,266.59,"s","s","Yahyaee & Elize, 2024","P",null,0,null],[36.4,334.72,"s","s","Yahyaee & Elize, 2024","P",null,0,null],[31.85,439.26,"o","s","Yahyaee & Elize, 2024","P",null,0,"astm_type_ii"],[92.36,1318.0,"u","s","Zhang et al., 2024","P",null,0,null],[107.14,1120.0,"u","s","Zhang et al., 2024","P",null,0,null],[98.29,715.0,"u","s","Zhang et al., 2024","P",null,0,null],[50.0,403.38,"o","p","Wu et al., 2024","P",null,0,"nao_declarado"],[50.0,331.0,"r","p","Dacic et al., 2024","P",null,0,null],[27.8,410.01,"o","p","Manan et al., 2024","P",null,0,"astm_c150"],[67.0,195.0,"l","p","Sun et al., 2025","N",null,0,null],[30.0,262.61,"o","p","Lin et al., 2025","P",null,0,"nao_declarado"],[107.15,443.61,"u","s","Zhang et al., 2025","P",null,0,null],[65.0,611.7,"o","p","Jiang et al., 2025","P",null,0,"gb_po"],[30.0,295.0,"o","s","Meng et al., 2023","P",null,0,"nao_declarado"],[35.0,453.3,"o","p","Justo-Reinoso et al., 2023","P",null,0,"cem_ii_a"],[206.9,824.0,"u","p","Kang et al., 2024","P",null,0,null],[35.0,383.1,"o","p","Huang et al., 2025","P",313.4,0,"portland_sem_tipo"],[35.0,378.5,"r","p","Huang et al., 2025","P",295.6,0,null],[35.0,375.7,"r","p","Huang et al., 2025","P",279.4,0,null],[35.0,373.1,"r","p","Huang et al., 2025","P",263.5,0,null],[35.0,368.3,"r","p","Huang et al., 2025","P",245.5,0,null],[30.0,291.0,"o","p","Skullestad et al., 2016","P",231.0,0,"nao_declarado"],[45.0,326.0,"o","p","Skullestad et al., 2016","P",276.0,0,"nao_declarado"],[36.6,323.0,"o","p","Sabau et al., 2021","P",null,0,"cem_i"],[36.3,296.0,"s","p","Sabau et al., 2021","P",null,0,null],[36.5,306.0,"r","p","Sabau et al., 2021","P",306.0,1,null],[29.3,466.77,"o","p","Yaseen et al., 2024","P",null,0,"astm_c150"],[27.9,423.0,"s","p","Yaseen et al., 2024","P",null,0,null],[26.3,380.09,"s","p","Yaseen et al., 2024","P",null,0,null],[25.1,336.33,"s","p","Yaseen et al., 2024","P",null,0,null],[26.9,445.32,"s","p","Yaseen et al., 2024","P",null,0,null],[28.2,423.86,"s","p","Yaseen et al., 2024","P",null,0,null],[24.4,401.55,"s","p","Yaseen et al., 2024","P",null,0,null],[30.0,254.4,"o","s","Almulhim et al., 2024","P",null,0,"nao_declarado"],[66.8,121.77,"g","p","Espuelas et al., 2018","N",null,0,null],[61.0,132.25,"g","p","Espuelas et al., 2018","N",null,0,null],[62.1,143.41,"g","p","Espuelas et al., 2018","N",null,0,null],[52.7,86.32,"g","p","Espuelas et al., 2018","N",null,0,null],[54.2,97.65,"g","p","Espuelas et al., 2018","N",null,0,null],[56.8,109.09,"g","p","Espuelas et al., 2018","N",null,0,null],[35.0,350.7,"o","p","Abdulkareem et al., 2019","P",null,0,"cem_i"],[39.5,449.7,"o","p","Abdulkareem et al., 2019","P",null,0,"cem_i"],[38.4,185.7,"g","p","Abdulkareem et al., 2019","N",null,0,null],[35.97,166.9,"g","p","Abdulkareem et al., 2019","N",null,0,null],[39.21,179.7,"g","p","Abdulkareem et al., 2019","N",null,0,null],[30.0,232.0,"o","p","Stoiber et al., 2021","P",null,0,"nao_declarado"],[50.0,335.0,"o","p","Stoiber et al., 2021","P",null,0,"nao_declarado"],[70.0,431.0,"o","p","Stoiber et al., 2021","P",null,0,"nao_declarado"],[52.0,190.6,"g","p","Abdulkareem et al., 2021","N",null,0,null],[58.0,174.2,"g","p","Abdulkareem et al., 2021","N",null,0,null],[58.0,72.4,"g","p","Abdulkareem et al., 2021","N",null,0,null],[60.0,72.4,"g","p","Abdulkareem et al., 2021","N",null,0,null],[43.5,535.8,"o","p","Batuecas et al., 2021","P",null,0,"cem_i"],[101.2,109.63,"g","p","Batuecas et al., 2021","N",-406.02,0,null],[42.0,138.64,"g","p","Batuecas et al., 2021","N",-253.26,0,null],[30.0,138.63,"g","p","Batuecas et al., 2021","N",-253.27,0,null],[30.2,469.8,"s","s","Li et al., 2022","P",null,0,null],[30.0,370.37,"o","s","Li et al., 2022","P",null,0,"portland_sem_tipo"],[20.5,446.0,"o","p","Sandanayake et al., 2022","P",null,0,"portland_sem_tipo"],[16.0,398.0,"r","p","Sandanayake et al., 2022","P",null,0,null],[35.0,532.5,"c","p","Di Summa et al., 2022","P",null,0,null],[30.0,526.0,"c","p","Di Summa et al., 2022","P",null,0,null],[35.0,400.0,"s","p","Jones & Li, 2023","P",null,0,null],[78.0,979.0,"s","p","Jones & Li, 2023","P",null,0,null],[30.0,279.21,"o","s","Negrin et al., 2023","P",null,0,"portland_sem_tipo"],[35.0,305.96,"o","s","Negrin et al., 2023","P",null,0,"portland_sem_tipo"],[40.0,307.06,"o","s","Negrin et al., 2023","P",null,0,"portland_sem_tipo"],[45.0,307.06,"o","s","Negrin et al., 2023","P",null,0,"portland_sem_tipo"],[30.0,372.2,"c","s","Kuepfer et al., 2024","P",null,0,null],[21.0,297.0,"g","p","Huang & Wang, 2024","N",null,0,null],[30.0,322.0,"o","p","Driessen & Gronlund, 2024","P",null,0,"portland_sem_tipo"],[50.46,285.5,"r","p","Manso-Morato et al., 2025","P",null,0,null],[167.0,703.15,"u","p","Khan et al., 2024","P",null,0,null],[150.0,571.33,"u","p","Khan et al., 2024","P",null,0,null],[39.42,397.24,"r","p","Frazao et al., 2022","P",null,0,null],[39.42,479.22,"s","p","Frazao et al., 2022","P",null,0,null],[40.0,850.0,"c","p","Alali et al., 2024","P",795.0,0,null],[40.2,639.0,"s","s","Teng et al., 2025","P",null,0,null],[45.8,581.0,"s","s","Teng et al., 2025","P",null,0,null],[44.2,522.0,"s","s","Teng et al., 2025","P",null,0,null],[34.2,463.0,"s","s","Teng et al., 2025","P",null,0,null],[41.5,415.0,"o","p","Fan et al., 2025","P",null,0,"astm_il"],[21.2,253.0,"g","p","Fan et al., 2025","N",null,0,null],[34.7,308.0,"g","p","Fan et al., 2025","N",null,0,null],[38.8,353.8,"g","p","Nguyen et al., 2020","N",null,0,null],[33.3,284.4,"g","p","Nguyen et al., 2020","N",null,0,null],[38.1,288.5,"g","p","Nguyen et al., 2020","N",null,0,null],[47.0,903.0,"o","p","Anastasiou et al., 2017","P",null,0,"cem_i"],[51.8,503.0,"r","p","Anastasiou et al., 2017","P",503.0,1,null],[46.2,190.3,"s","p","Kanagaraj et al., 2024","P",null,0,null],[38.6,228.0,"s","s","Berndt, 2015","P",null,0,null],[52.1,258.0,"s","s","Berndt, 2015","P",null,0,null],[45.4,246.0,"s","s","Berndt, 2015","P",null,0,null],[43.7,210.0,"r","s","Berndt, 2015","P",null,0,null],[40.0,310.0,"o","p","Yazdanbakhsh & Lagouin, 2019","P",null,0,"portland_sem_tipo"],[40.0,323.0,"r","p","Yazdanbakhsh & Lagouin, 2019","P",280.2,0,null],[25.0,308.0,"r","p","Mostert et al., 2021","P",null,0,null],[25.0,315.0,"r","p","Mostert et al., 2021","P",null,0,null],[104.7,1194.0,"u","s","Du et al., 2022","P",null,0,null],[77.1,942.0,"u","s","Du et al., 2022","P",null,0,null],[121.5,651.0,"u","s","Du et al., 2022","P",null,0,null],[30.0,360.0,"o","p","Jungclaus et al., 2024","P",263.0,0,"astm_type_i"],[45.0,505.0,"o","p","Jungclaus et al., 2024","P",395.0,0,"astm_type_i"],[40.0,347.0,"o","p","Alkhawaldeh et al., 2024","P",null,0,"portland_sem_tipo"],[40.0,169.0,"g","p","Alkhawaldeh et al., 2024","N",null,0,null],[40.0,234.0,"g","p","Alkhawaldeh et al., 2024","N",null,0,null],[40.0,245.0,"s","p","Alkhawaldeh et al., 2024","P",null,0,null],[24.52,168.0,"o","s","Lopez-Sosa et al., 2025","P",null,0,"nao_declarado"],[20.0,349.37,"c","p","Tushar et al., 2023","P",null,0,null],[50.3,502.1,"o","p","Lei et al., 2024","P",null,0,"gb_po"],[48.5,478.0,"r","p","Lei et al., 2024","P",459.6,0,null],[47.2,477.8,"r","p","Lei et al., 2024","P",441.2,0,null],[45.3,478.2,"r","p","Lei et al., 2024","P",422.8,0,null],[25.0,436.32,"o","p","Omar et al., 2014","P",null,0,"portland_sem_tipo"],[30.0,502.13,"o","p","Omar et al., 2014","P",null,0,"portland_sem_tipo"],[40.0,525.89,"o","p","Omar et al., 2014","P",null,0,"portland_sem_tipo"],[25.0,266.25,"s","p","Elliot et al., 2024","P",251.25,0,null],[31.0,251.0,"s","p","Jin et al., 2024","P",null,0,null],[25.0,334.0,"o","p","Van Roijen et al., 2025","P",334.0,1,"portland_sem_tipo"],[40.0,609.0,"o","p","Baykara et al., 2024","P",null,0,"astm_c1157"],[38.2,543.0,"o","p","Cunningham et al., 2021","P",null,0,"astm_type_ii_v"],[44.0,367.85,"o","p","Ro et al., 2024","P",null,0,"astm_type_ii_v"],[37.5,312.88,"s","p","Ro et al., 2024","P",null,0,null],[24.18,697.0,"o","p","Cunningham & Miller, 2020","P",null,0,"astm_type_ii_v"],[30.69,513.0,"s","p","Cunningham & Miller, 2020","P",null,0,null],[23.41,470.0,"s","p","Cunningham & Miller, 2020","P",null,0,null],[20.56,100.0,"g","p","Cunningham & Miller, 2020","N",null,0,null],[51.2,471.62,"o","p","Dehghani et al., 2024","P",null,0,"astm_type_ii"],[65.7,380.62,"s","p","Dehghani et al., 2024","P",380.07,0,null],[40.0,388.0,"o","p","Chen et al., 2023","P",null,0,"nao_declarado"],[48.28,660.4,"r","p","Ye et al., 2024","P",null,0,null],[42.27,669.9,"r","p","Ye et al., 2024","P",null,0,null],[131.0,466.83,"s","p","Ye et al., 2024","P",null,0,null],[40.0,318.13,"o","p","Ye et al., 2024","P",null,0,"portland_sem_tipo"],[95.0,1069.0,"s","s","Mostafaei et al., 2025","P",null,1,null],[25.0,688.0,"r","s","Mostafaei et al., 2025","P",null,1,null],[89.0,993.0,"r","s","Mostafaei et al., 2025","P",null,1,null],[106.0,887.0,"r","s","Mostafaei et al., 2025","P",null,1,null],[45.43,352.0,"o","p","Kadawo et al., 2021","P",null,0,"cem_ii_a"],[42.9,349.0,"r","p","Kadawo et al., 2021","P",null,0,null],[35.17,348.0,"r","p","Kadawo et al., 2021","P",null,0,null],[30.0,289.5,"o","p","Asare et al., 2024","P",null,0,"portland_sem_tipo"],[40.0,348.8,"o","p","Asare et al., 2024","P",null,0,"portland_sem_tipo"],[50.0,391.2,"o","p","Asare et al., 2024","P",null,0,"portland_sem_tipo"],[56.4,520.0,"o","s","Miller et al., 2015","P",null,0,"portland_sem_tipo"],[25.0,334.1,"s","p","Miller, 2021","P",null,0,null],[35.0,237.38,"o","p","Rønning et al., 2024","P",140.38,0,"nao_declarado"],[35.0,227.79,"r","p","Rønning et al., 2024","P",107.23,0,null],[35.0,217.47,"r","p","Rønning et al., 2024","P",48.35,0,null],[25.0,196.0,"o","p","Silva et al., 2019","P",null,0,"cp_ii"],[30.0,220.0,"o","p","Silva et al., 2019","P",null,0,"cp_ii"],[35.0,248.0,"o","p","Silva et al., 2019","P",null,0,"cp_ii"],[40.0,295.0,"o","p","Silva et al., 2019","P",null,0,"cp_ii"],[24.1,120.0,"g","p","Meek & Elchalakani, 2019","N",null,0,null],[25.0,260.0,"s","p","Mostert et al., 2020","P",null,0,null],[30.0,801.0,"c","p","Larsen et al., 2017","P",null,0,null],[150.0,2123.8,"c","p","Larsen et al., 2017","P",null,0,null],[25.0,362.29,"o","p","Stepanek et al., 2018","P",null,0,"nao_declarado"],[52.4,253.0,"o","s","Pavlik et al., 2019","P",null,0,"cem_i"],[29.4,980.0,"c","p","Tran & Tran, 2020","P",null,0,null],[25.0,461.3,"o","p","Morsi et al., 2020","P",461.3,1,"astm_type_i"],[30.0,401.3,"o","p","Jeong & Park, 2024","P",385.0,0,"nao_declarado"],[40.0,242.0,"o","p","Amitani & Miller, 2024","P",null,0,"portland_sem_tipo"],[40.0,391.0,"o","p","Amitani & Miller, 2024","P",null,0,"portland_sem_tipo"],[20.0,253.44,"o","p","Neimark et al., 2024","P",null,0,"cem_i"],[32.5,350.7,"o","p","Jiménez et al., 2018","P",null,0,"portland_sem_tipo"],[31.6,349.9,"r","p","Jiménez et al., 2018","P",null,0,null],[30.8,349.0,"r","p","Jiménez et al., 2018","P",null,0,null],[29.8,348.2,"r","p","Jiménez et al., 2018","P",null,0,null],[29.8,347.4,"r","p","Jiménez et al., 2018","P",null,0,null],[23.7,264.7,"o","p","Jiménez et al., 2018","P",null,0,"portland_sem_tipo"],[23.1,263.9,"r","p","Jiménez et al., 2018","P",null,0,null],[22.5,263.0,"r","p","Jiménez et al., 2018","P",null,0,null],[21.0,262.2,"r","p","Jiménez et al., 2018","P",null,0,null],[104.0,774.0,"r","p","Gursel & Ostertag, 2019","P",null,0,null],[35.0,472.0,"c","p","Mirdad et al., 2021","P",null,0,null],[50.0,510.94,"o","p","Li & Zhu, 2022","P",null,0,"nao_declarado"],[50.0,364.0,"g","p","Teh et al., 2018","N",null,0,null],[50.0,517.0,"r","s","Teh & Wiedmann, 2018","P",null,0,null],[55.0,178.63,"s","p","Lee et al., 2019","P",168.3,0,null],[52.0,220.29,"o","p","Masi et al., 2023","P",null,0,"cem_iii"],[34.0,216.3,"r","p","Masi et al., 2023","P",209.43,0,null],[51.6,160.86,"g","s","Jiang et al., 2024","N",null,0,null],[50.7,134.08,"g","s","Jiang et al., 2024","N",null,0,null],[30.8,241.0,"o","p","Buffenbarger et al., 2023","P",null,0,"nao_declarado"],[31.8,248.0,"o","p","Buffenbarger et al., 2023","P",null,0,"nao_declarado"],[32.9,258.0,"o","p","Buffenbarger et al., 2023","P",null,0,"nao_declarado"],[34.5,271.0,"o","p","Buffenbarger et al., 2023","P",null,0,"nao_declarado"],[36.2,283.0,"o","p","Buffenbarger et al., 2023","P",null,0,"nao_declarado"],[39.4,308.0,"o","p","Buffenbarger et al., 2023","P",null,0,"nao_declarado"],[44.2,346.0,"o","p","Buffenbarger et al., 2023","P",null,0,"nao_declarado"],[44.4,263.78,"r","s","Zhang et al., 2022","P",null,0,null],[30.0,535.0,"s","p","Passuello et al., 2019","P",null,0,null],[40.0,418.78,"o","p","Gomes et al., 2019","P",null,0,"cp_ii_e"],[40.0,239.82,"g","p","Gomes et al., 2019","N",null,0,null],[27.82,304.9,"o","p","De Azevedo Sampaio et al., 2022","P",null,0,"cp_v_ari"],[28.73,324.0,"r","p","De Azevedo Sampaio et al., 2022","P",null,0,null],[25.0,224.6,"o","p","Angelin et al., 2023","P",null,0,"cp_iii"],[32.4,416.13,"o","p","Souza et al., 2024","P",null,0,"cp_v_ari"],[30.0,347.4,"o","p","Bacelar et al., 2022","P",null,0,"portland_sem_tipo"],[40.0,388.4,"o","p","Bacelar et al., 2022","P",null,0,"portland_sem_tipo"],[50.0,424.0,"o","p","Bacelar et al., 2022","P",null,0,"portland_sem_tipo"],[69.5,146.0,"g","p","Arce et al., 2023","N",null,0,null],[40.0,370.0,"s","s","Basavaraj et al., 2023","P",null,0,null],[70.0,569.0,"o","p","Sinoh et al., 2021","P",null,0,"portland_sem_tipo"],[70.0,536.0,"s","p","Sinoh et al., 2021","P",null,0,null],[45.0,436.0,"o","p","Sinoh et al., 2021","P",null,0,"portland_sem_tipo"],[45.0,432.0,"r","p","Sinoh et al., 2021","P",null,0,null],[45.0,434.0,"r","p","Sinoh et al., 2021","P",null,0,null],[25.0,159.46,"o","s","Mercader Moyano et al., 2019","P",null,0,"nao_declarado"],[21.0,288.2,"o","p","Restrepo-Ramirez et al., 2024","P",null,0,"portland_sem_tipo"],[21.0,243.7,"o","p","Restrepo-Ramirez et al., 2024","P",null,0,"portland_sem_tipo"],[70.2,776.5,"o","s","Nasr et al., 2023","P",null,0,"cem_ii_a"],[71.7,637.4,"s","s","Nasr et al., 2023","P",null,0,null],[41.5,414.0,"o","p","Li et al., 2020","P",null,0,"cem_i"],[47.7,435.0,"o","p","Li et al., 2020","P",null,0,"cem_i"],[176.7,761.0,"u","p","Glanz et al., 2023","P",null,0,null],[194.2,545.6,"g","p","Glanz et al., 2023","N",null,0,null],[211.8,459.6,"g","p","Glanz et al., 2023","N",null,0,null],[20.0,244.75,"s","p","Ranganath et al., 2024","P",null,0,null],[24.0,358.0,"o","p","Roh et al., 2020","P",null,0,"portland_sem_tipo"],[37.48,475.0,"c","p","Guignone et al., 2022","P",null,0,null],[36.56,414.0,"c","p","Guignone et al., 2022","P",null,0,null],[20.7,334.1,"r","p","Bertoldo et al., 2024","P",320.0,0,null],[25.0,285.02,"o","p","Gao et al., 2024","P",78.52,0,"nao_declarado"],[30.0,295.0,"o","p","Gao et al., 2024","P",88.5,0,"portland_sem_tipo"],[40.0,321.4,"o","p","Gao et al., 2024","P",114.9,0,"portland_sem_tipo"],[50.0,385.0,"o","p","Gao et al., 2024","P",178.5,0,"portland_sem_tipo"],[60.0,416.76,"o","p","Gao et al., 2024","P",210.26,0,"portland_sem_tipo"],[56.0,88.7,"o","p","Pushkar, 2019","P",null,0,"portland_sem_tipo"],[25.0,361.0,"o","s","Thamboo et al., 2021","P",null,0,"nao_declarado"],[21.0,237.22,"o","p","Petroche & Ramirez, 2022","P",null,0,"astm_c1157"],[24.0,256.08,"o","p","Petroche & Ramirez, 2022","P",null,0,"astm_c1157"],[28.0,267.54,"o","p","Petroche & Ramirez, 2022","P",null,0,"astm_c1157"],[30.0,290.85,"o","p","Petroche & Ramirez, 2022","P",null,0,"astm_c1157"],[35.0,310.31,"o","p","Petroche & Ramirez, 2022","P",null,0,"astm_c1157"],[40.0,355.38,"o","p","Petroche & Ramirez, 2022","P",null,0,"astm_c1157"],[45.0,379.38,"o","p","Petroche & Ramirez, 2022","P",null,0,"astm_c1157"],[50.0,382.03,"o","p","Petroche & Ramirez, 2022","P",null,0,"astm_c1157"],[60.0,419.55,"o","p","Petroche & Ramirez, 2022","P",null,0,"astm_c1157"],[80.0,442.14,"o","p","Petroche & Ramirez, 2022","P",null,0,"astm_c1157"],[30.0,212.26,"o","p","Hegeir et al., 2022","P",null,0,"nao_declarado"],[20.0,305.0,"o","p","Pushkar et al., 2022","P",null,0,"nao_declarado"],[34.47,648.4,"c","p","Tushar et al., 2022","P",null,0,null],[20.68,627.6,"c","p","Tushar et al., 2022","P",null,0,null],[34.47,668.0,"c","p","Tushar et al., 2022","P",null,0,null],[20.7,293.75,"s","p","De Pedro et al., 2023","P",null,0,null],[20.0,267.19,"o","p","Mostafaei et al., 2023","P",null,0,"portland_sem_tipo"],[30.0,332.57,"o","p","Mostafaei et al., 2023","P",null,0,"portland_sem_tipo"],[40.0,417.82,"o","p","Mostafaei et al., 2023","P",null,0,"portland_sem_tipo"],[40.0,361.8,"o","p","Huang & Wang, 2023","P",null,0,"nao_declarado"],[38.27,416.0,"o","p","Almulhim & Al Masmoum, 2024","P",null,0,"portland_sem_tipo"],[48.82,471.0,"o","p","Almulhim & Al Masmoum, 2024","P",null,0,"portland_sem_tipo"],[59.82,518.0,"o","p","Almulhim & Al Masmoum, 2024","P",null,0,"portland_sem_tipo"],[70.82,554.0,"o","p","Almulhim & Al Masmoum, 2024","P",null,0,"portland_sem_tipo"],[81.82,592.0,"o","p","Almulhim & Al Masmoum, 2024","P",null,0,"portland_sem_tipo"],[20.0,299.71,"o","p","Tran et al., 2025","P",null,0,"portland_sem_tipo"],[20.0,268.95,"o","p","Tran et al., 2025","P",183.19,0,"portland_sem_tipo"],[35.0,301.8,"o","p","Tran et al., 2025","P",null,0,"portland_sem_tipo"],[35.0,270.82,"o","p","Tran et al., 2025","P",184.43,0,"portland_sem_tipo"],[40.0,302.47,"o","p","Tran et al., 2025","P",null,0,"portland_sem_tipo"],[40.0,271.42,"o","p","Tran et al., 2025","P",184.83,0,"portland_sem_tipo"],[50.0,303.1,"o","p","Tran et al., 2025","P",null,0,"portland_sem_tipo"],[50.0,271.98,"o","p","Tran et al., 2025","P",185.2,0,"portland_sem_tipo"],[65.0,303.45,"o","p","Tran et al., 2025","P",null,0,"portland_sem_tipo"],[65.0,272.3,"o","p","Tran et al., 2025","P",185.41,0,"portland_sem_tipo"],[80.0,304.27,"o","p","Tran et al., 2025","P",null,0,"portland_sem_tipo"],[80.0,273.03,"o","p","Tran et al., 2025","P",185.9,0,"portland_sem_tipo"],[100.0,305.87,"o","p","Tran et al., 2025","P",null,0,"portland_sem_tipo"],[100.0,274.46,"o","p","Tran et al., 2025","P",186.85,0,"portland_sem_tipo"],[34.47,523.9,"c","p","Zahabi et al., 2025","P",null,0,null],[23.16,243.5,"g","p","Rojas-Duque et al., 2020","N",null,0,null],[21.0,377.8,"o","p","Rojas-Duque et al., 2020","P",null,0,"astm_c1157"],[28.75,239.0,"o","p","Paula Junior et al., 2021","P",null,0,"cp_iii"],[30.0,321.3,"o","s","Xu et al., 2021","P",null,0,"nao_declarado"],[32.0,412.0,"o","p","Teodosio et al., 2021","P",371.44,0,"nao_declarado"],[45.0,498.5,"o","p","Nasr et al., 2023","P",null,0,"portland_sem_tipo"],[42.0,444.68,"s","p","Nasr et al., 2023","P",null,0,null],[38.0,390.87,"s","p","Nasr et al., 2023","P",null,0,null],[35.0,337.05,"s","p","Nasr et al., 2023","P",null,0,null],[27.0,283.23,"s","p","Nasr et al., 2023","P",null,0,null],[20.0,185.0,"o","p","Asdrubali et al., 2025","P",null,0,"nao_declarado"],[25.0,205.9,"o","p","Asdrubali et al., 2025","P",null,0,"nao_declarado"],[30.0,204.5,"o","p","Asdrubali et al., 2025","P",null,0,"nao_declarado"],[37.0,237.0,"o","p","Asdrubali et al., 2025","P",null,0,"nao_declarado"],[40.0,319.6,"o","p","Asdrubali et al., 2025","P",null,0,"nao_declarado"],[45.0,326.1,"o","p","Asdrubali et al., 2025","P",null,0,"nao_declarado"],[50.0,356.4,"o","p","Asdrubali et al., 2025","P",null,0,"nao_declarado"],[55.0,385.4,"o","p","Asdrubali et al., 2025","P",null,0,"nao_declarado"],[60.0,265.6,"o","p","Asdrubali et al., 2025","P",null,0,"nao_declarado"],[75.0,292.6,"o","p","Asdrubali et al., 2025","P",null,0,"nao_declarado"],[50.0,705.0,"s","p","Zhou et al., 2020","P",null,0,null],[40.0,608.0,"s","p","Zhou et al., 2020","P",null,0,null],[30.0,565.0,"s","p","Zhou et al., 2020","P",null,0,null],[20.0,306.19,"o","s","Hu et al., 2022","P",null,0,"nao_declarado"],[25.0,336.68,"o","s","Hu et al., 2022","P",null,0,"nao_declarado"],[30.0,371.65,"o","s","Hu et al., 2022","P",null,0,"nao_declarado"],[35.0,389.57,"o","s","Hu et al., 2022","P",null,0,"nao_declarado"],[40.0,419.6,"o","s","Hu et al., 2022","P",null,0,"nao_declarado"],[50.0,502.82,"o","s","Hu et al., 2022","P",null,0,"nao_declarado"],[60.0,549.34,"o","s","Hu et al., 2022","P",null,0,"nao_declarado"],[30.0,157.65,"o","p","Tres Junior et al., 2023","P",null,0,"nao_declarado"],[30.0,348.76,"o","p","Tres Junior et al., 2023","P",null,0,"nao_declarado"],[45.0,194.7,"o","p","Tres Junior et al., 2023","P",null,0,"nao_declarado"],[45.0,381.72,"o","p","Tres Junior et al., 2023","P",null,0,"nao_declarado"],[50.0,225.78,"o","p","Tres Junior et al., 2023","P",null,0,"nao_declarado"],[50.0,508.63,"o","p","Tres Junior et al., 2023","P",null,0,"nao_declarado"],[22.2,659.0,"o","p","Ellingboe et al., 2019","P",578.8,0,"astm_type_i"],[80.0,172.37,"g","s","Esparham et al., 2023","N",null,0,null],[80.0,742.88,"o","s","Esparham et al., 2023","P",null,0,"portland_sem_tipo"],[28.0,150.0,"s","s","Pineda et al., 2025","P",null,0,null],[41.4,508.0,"o","s","Sahmenko et al., 2024","P",null,0,"cem_i"],[43.4,380.0,"l","s","Sahmenko et al., 2024","N",null,0,null],[38.2,333.0,"l","s","Sahmenko et al., 2024","N",null,0,null],[38.6,318.0,"l","s","Sahmenko et al., 2024","N",null,0,null],[37.0,296.0,"l","s","Sahmenko et al., 2024","N",null,0,null],[83.77,343.98,"s","s","Huang et al., 2024","P",null,0,null],[73.64,317.1,"s","s","Huang et al., 2024","P",null,0,null],[64.34,295.4,"s","s","Huang et al., 2024","P",null,0,null],[54.83,250.42,"s","s","Huang et al., 2024","P",null,0,null],[45.0,215.16,"s","s","Huang et al., 2024","P",null,0,null],[150.0,1614.0,"u","p","Sameer et al., 2019","P",null,0,null],[150.0,1702.0,"u","p","Sameer et al., 2019","P",null,0,null],[35.0,352.0,"s","p","Sameer et al., 2019","P",null,0,null],[50.0,422.0,"s","p","Sameer et al., 2019","P",null,0,null],[38.01,513.0,"o","p","Vitale et al., 2021","P",null,0,"portland_sem_tipo"],[27.76,450.5,"r","p","Vitale et al., 2021","P",null,0,null],[78.18,39.55,"g","p","Faridmehr et al., 2021","N",null,0,null],[65.89,36.68,"g","p","Faridmehr et al., 2021","N",null,0,null],[80.51,47.05,"g","p","Faridmehr et al., 2021","N",null,0,null],[81.7,44.18,"g","p","Faridmehr et al., 2021","N",null,0,null],[52.6,41.3,"g","p","Faridmehr et al., 2021","N",null,0,null],[80.46,54.55,"g","p","Faridmehr et al., 2021","N",null,0,null],[76.9,51.68,"g","p","Faridmehr et al., 2021","N",null,0,null],[70.4,48.8,"g","p","Faridmehr et al., 2021","N",null,0,null],[46.24,45.93,"g","p","Faridmehr et al., 2021","N",null,0,null],[34.53,71.93,"g","p","Faridmehr et al., 2021","N",null,0,null],[23.04,64.43,"g","p","Faridmehr et al., 2021","N",null,0,null],[45.96,74.8,"g","p","Faridmehr et al., 2021","N",null,0,null],[37.8,67.3,"g","p","Faridmehr et al., 2021","N",null,0,null],[28.8,59.8,"g","p","Faridmehr et al., 2021","N",null,0,null],[55.64,77.68,"g","p","Faridmehr et al., 2021","N",null,0,null],[47.1,70.18,"g","p","Faridmehr et al., 2021","N",null,0,null],[40.6,62.68,"g","p","Faridmehr et al., 2021","N",null,0,null],[36.8,55.18,"g","p","Faridmehr et al., 2021","N",null,0,null],[85.09,69.55,"g","p","Faridmehr et al., 2021","N",null,0,null],[97.75,74.18,"g","p","Faridmehr et al., 2021","N",null,0,null],[86.4,78.8,"g","p","Faridmehr et al., 2021","N",null,0,null],[70.53,83.43,"g","p","Faridmehr et al., 2021","N",null,0,null],[80.68,62.05,"g","p","Faridmehr et al., 2021","N",null,0,null],[72.44,66.68,"g","p","Faridmehr et al., 2021","N",null,0,null],[71.93,71.3,"g","p","Faridmehr et al., 2021","N",null,0,null],[70.84,75.93,"g","p","Faridmehr et al., 2021","N",null,0,null],[70.22,80.55,"g","p","Faridmehr et al., 2021","N",null,0,null],[80.43,59.18,"g","p","Faridmehr et al., 2021","N",null,0,null],[67.22,63.8,"g","p","Faridmehr et al., 2021","N",null,0,null],[65.14,68.43,"g","p","Faridmehr et al., 2021","N",null,0,null],[56.34,73.05,"g","p","Faridmehr et al., 2021","N",null,0,null],[34.02,58.66,"g","p","Faridmehr et al., 2021","N",null,0,null],[22.4,51.16,"g","p","Faridmehr et al., 2021","N",null,0,null],[68.44,63.43,"g","p","Faridmehr et al., 2021","N",null,0,null],[52.08,55.93,"g","p","Faridmehr et al., 2021","N",null,0,null],[46.76,48.43,"g","p","Faridmehr et al., 2021","N",null,0,null],[74.12,68.2,"g","p","Faridmehr et al., 2021","N",null,0,null],[66.19,60.7,"g","p","Faridmehr et al., 2021","N",null,0,null],[60.17,53.2,"g","p","Faridmehr et al., 2021","N",null,0,null],[56.47,45.7,"g","p","Faridmehr et al., 2021","N",null,0,null],[46.1,168.66,"o","p","Koci et al., 2021","P",null,0,"cem_i"],[56.8,168.57,"r","p","Koci et al., 2021","P",null,0,null],[54.5,165.68,"r","p","Koci et al., 2021","P",null,0,null],[39.2,260.05,"g","p","Shi et al., 2021","N",null,0,null],[52.6,271.75,"g","p","Shi et al., 2021","N",null,0,null],[58.0,280.2,"g","p","Shi et al., 2021","N",null,0,null],[59.1,289.27,"g","p","Shi et al., 2021","N",null,0,null],[43.6,283.95,"g","p","Shi et al., 2021","N",null,0,null],[64.2,280.65,"g","p","Shi et al., 2021","N",null,0,null],[48.6,304.83,"g","p","Shi et al., 2021","N",null,0,null],[71.0,300.63,"g","p","Shi et al., 2021","N",null,0,null],[37.2,311.71,"g","p","Shi et al., 2021","N",null,0,null],[40.8,324.78,"g","p","Shi et al., 2021","N",null,0,null],[73.5,305.19,"g","p","Shi et al., 2021","N",null,0,null],[76.2,317.88,"g","p","Shi et al., 2021","N",null,0,null],[24.2,341.31,"g","p","Shi et al., 2021","N",null,0,null],[38.7,335.34,"g","p","Shi et al., 2021","N",null,0,null],[59.2,332.18,"g","p","Shi et al., 2021","N",null,0,null],[63.2,329.83,"g","p","Shi et al., 2021","N",null,0,null],[70.0,1390.0,"c","p","Mostert et al., 2022","P",null,0,null],[35.0,611.0,"c","p","Mostert et al., 2022","P",null,0,null],[56.68,396.0,"o","p","Garcia-Troncoso et al., 2023","P",null,0,"astm_c1157"],[53.48,346.0,"r","p","Garcia-Troncoso et al., 2023","P",346.0,1,null],[54.72,334.0,"r","p","Garcia-Troncoso et al., 2023","P",334.0,1,null],[54.16,421.0,"r","p","Garcia-Troncoso et al., 2023","P",244.0,0,null],[33.2,331.0,"c","p","Pavlu et al., 2023","P",null,0,null],[30.0,303.0,"c","p","Pavlu et al., 2023","P",null,0,null],[34.4,226.0,"c","p","Pavlu et al., 2023","P",226.0,1,null],[44.9,366.0,"c","p","Pavlu et al., 2023","P",null,0,null],[38.0,338.0,"c","p","Pavlu et al., 2023","P",null,0,null],[42.9,265.0,"c","p","Pavlu et al., 2023","P",265.0,1,null],[30.61,400.0,"o","p","Anh et al., 2023","P",null,0,"cem_ii_a"],[32.72,362.0,"s","p","Anh et al., 2023","P",null,0,null],[30.33,362.0,"s","p","Anh et al., 2023","P",null,0,null],[43.6,337.1,"o","s","Boukhelf et al., 2023","P",null,0,"cem_i"],[25.7,71.0,"o","s","Boukhelf et al., 2023","P",null,0,"cem_iii"],[27.4,168.3,"s","s","Boukhelf et al., 2023","P",null,0,null],[35.51,239.5,"o","p","Los Santos-Ortega et al., 2023","P",null,0,"cem_ii_a"],[33.85,252.2,"o","p","Los Santos-Ortega et al., 2023","P",null,0,"cem_ii_a"],[28.26,240.0,"r","p","Los Santos-Ortega et al., 2023","P",225.0,0,null],[59.4,235.5,"g","p","Ji et al., 2024","N",null,0,null],[39.54,300.41,"o","p","Los Santos-Ortega et al., 2024","P",null,0,"nao_declarado"],[31.21,296.99,"r","p","Los Santos-Ortega et al., 2024","P",null,0,null],[82.07,487.3,"s","p","Skibicki et al., 2024","P",null,0,null],[74.06,393.8,"s","p","Skibicki et al., 2024","P",null,0,null],[41.61,253.6,"s","p","Skibicki et al., 2024","P",null,0,null],[57.92,1303.7,"s","p","Lv et al., 2024","P",null,0,null],[51.48,475.78,"o","p","Agrela et al., 2024","P",null,0,"cem_ii"],[49.74,358.91,"s","p","Agrela et al., 2024","P",null,0,null],[43.85,360.21,"s","p","Agrela et al., 2024","P",null,0,null],[55.7,258.89,"o","p","Agrela et al., 2024","P",null,0,"cem_ii"],[49.1,229.43,"s","p","Agrela et al., 2024","P",null,0,null],[43.0,233.71,"s","p","Agrela et al., 2024","P",null,0,null],[74.0,64.0,"g","p","Lemesre et al., 2024","N",null,0,null],[40.38,432.4,"o","p","Yao et al., 2024","P",429.6,0,"gb_po"],[38.46,400.4,"s","p","Yao et al., 2024","P",396.2,0,null],[39.9,368.5,"s","p","Yao et al., 2024","P",363.2,0,null],[37.44,397.2,"r","p","Yao et al., 2024","P",390.7,0,null],[62.3,608.08,"g","p","Luo et al., 2023","N",null,0,null],[57.0,554.6,"g","p","Luo et al., 2023","N",null,0,null],[28.9,1191.41,"g","p","Luo et al., 2023","N",null,0,null],[53.6,742.69,"s","p","Sambucci et al., 2023","P",null,0,null],[45.57,420.9,"o","p","Kim et al., 2018","P",null,0,"astm_type_i"],[39.19,387.3,"s","p","Kim et al., 2018","P",null,0,null],[39.45,383.8,"s","p","Kim et al., 2018","P",null,0,null],[40.1,383.1,"s","p","Kim et al., 2018","P",null,0,null],[37.6,353.7,"s","p","Kim et al., 2018","P",null,0,null],[37.08,346.7,"s","p","Kim et al., 2018","P",null,0,null],[38.16,345.4,"s","p","Kim et al., 2018","P",null,0,null],[35.98,320.2,"s","p","Kim et al., 2018","P",null,0,null],[37.0,309.7,"s","p","Kim et al., 2018","P",null,0,null],[35.83,307.7,"s","p","Kim et al., 2018","P",null,0,null],[76.18,289.69,"s","s","Cen et al., 2019","P",null,0,null],[42.31,261.38,"s","s","Cen et al., 2019","P",null,0,null],[43.66,287.44,"s","s","Cen et al., 2019","P",null,0,null],[47.8,168.62,"s","s","Cen et al., 2019","P",null,0,null],[52.92,185.5,"s","s","Cen et al., 2019","P",null,0,null],[34.42,137.49,"s","s","Cen et al., 2019","P",null,0,null],[73.29,273.84,"s","s","Cen et al., 2019","P",null,0,null],[48.04,213.57,"s","s","Cen et al., 2019","P",null,0,null],[32.38,168.67,"s","s","Cen et al., 2019","P",null,0,null],[62.11,219.71,"s","s","Cen et al., 2019","P",null,0,null],[46.41,184.14,"s","s","Cen et al., 2019","P",null,0,null],[33.46,136.12,"s","s","Cen et al., 2019","P",null,0,null],[70.21,413.66,"s","s","Cen et al., 2019","P",null,0,null],[59.79,254.91,"s","s","Cen et al., 2019","P",null,0,null],[55.11,206.89,"s","s","Cen et al., 2019","P",null,0,null],[77.11,394.23,"s","s","Cen et al., 2019","P",null,0,null],[59.32,277.09,"s","s","Cen et al., 2019","P",null,0,null],[51.88,229.08,"s","s","Cen et al., 2019","P",null,0,null],[76.65,292.48,"s","s","Cen et al., 2019","P",null,0,null],[59.61,240.03,"s","s","Cen et al., 2019","P",null,0,null],[49.35,191.95,"s","s","Cen et al., 2019","P",null,0,null],[80.51,316.68,"s","s","Cen et al., 2019","P",null,0,null],[38.93,129.31,"s","s","Cen et al., 2019","P",null,0,null],[29.6,123.53,"s","s","Cen et al., 2019","P",null,0,null],[78.03,375.77,"s","s","Cen et al., 2019","P",null,0,null],[60.53,297.07,"s","s","Cen et al., 2019","P",null,0,null],[48.67,249.01,"s","s","Cen et al., 2019","P",null,0,null],[65.17,181.5,"s","s","Cen et al., 2019","P",null,0,null],[33.57,130.65,"s","s","Cen et al., 2019","P",null,0,null],[32.98,193.77,"s","s","Cen et al., 2019","P",null,0,null],[74.53,346.99,"s","s","Cen et al., 2019","P",null,0,null],[35.78,142.92,"s","s","Cen et al., 2019","P",null,0,null],[27.67,156.84,"s","s","Cen et al., 2019","P",null,0,null],[72.94,288.54,"s","s","Cen et al., 2019","P",null,0,null],[49.59,194.48,"s","s","Cen et al., 2019","P",null,0,null],[34.38,146.43,"s","s","Cen et al., 2019","P",null,0,null],[65.23,253.1,"s","s","Cen et al., 2019","P",null,0,null],[47.87,263.4,"s","s","Cen et al., 2019","P",null,0,null],[40.32,215.33,"s","s","Cen et al., 2019","P",null,0,null],[53.52,202.2,"s","s","Cen et al., 2019","P",null,0,null],[58.71,210.77,"s","s","Cen et al., 2019","P",null,0,null],[39.09,162.71,"s","s","Cen et al., 2019","P",null,0,null],[68.28,283.75,"s","s","Cen et al., 2019","P",null,0,null],[36.87,275.29,"s","s","Cen et al., 2019","P",null,0,null],[36.16,227.28,"s","s","Cen et al., 2019","P",null,0,null],[89.58,273.78,"s","s","Cen et al., 2019","P",null,0,null],[63.82,239.75,"s","s","Cen et al., 2019","P",null,0,null],[43.24,186.09,"s","s","Cen et al., 2019","P",null,0,null],[76.11,384.25,"s","s","Cen et al., 2019","P",null,0,null],[44.84,223.12,"s","s","Cen et al., 2019","P",null,0,null],[23.32,93.77,"s","s","Cen et al., 2019","P",null,0,null],[32.21,276.3,"s","s","Cen et al., 2019","P",null,0,null],[48.5,86.33,"o","p","Pushkar, 2019","P",null,0,"portland_sem_tipo"],[45.0,90.0,"r","p","Pushkar, 2019","P",null,0,null],[50.0,89.5,"r","p","Pushkar, 2019","P",null,0,null],[56.0,89.6,"r","p","Pushkar, 2019","P",null,0,null],[52.5,90.3,"r","p","Pushkar, 2019","P",null,0,null],[40.8,88.94,"o","p","Pushkar, 2019","P",null,0,"portland_sem_tipo"],[40.0,89.6,"r","p","Pushkar, 2019","P",null,0,null],[44.3,89.93,"r","p","Pushkar, 2019","P",null,0,null],[43.5,89.61,"r","p","Pushkar, 2019","P",null,0,null],[46.5,89.74,"r","p","Pushkar, 2019","P",null,0,null],[54.0,90.18,"o","p","Pushkar, 2019","P",null,0,"portland_sem_tipo"],[59.3,89.54,"r","p","Pushkar, 2019","P",null,0,null],[56.5,89.27,"r","p","Pushkar, 2019","P",null,0,null],[52.0,89.44,"r","p","Pushkar, 2019","P",null,0,null],[46.0,88.78,"r","p","Pushkar, 2019","P",null,0,null],[48.3,89.36,"o","p","Pushkar, 2019","P",null,0,"portland_sem_tipo"],[46.0,88.78,"r","p","Pushkar, 2019","P",null,0,null],[40.0,88.8,"r","p","Pushkar, 2019","P",null,0,null],[36.0,88.56,"r","p","Pushkar, 2019","P",null,0,null],[28.0,88.2,"r","p","Pushkar, 2019","P",null,0,null],[24.0,429.0,"o","s","Na & Paik, 2019","P",null,0,"nao_declarado"],[25.0,224.34,"o","s","Yepes et al., 2020","P",null,0,"portland_sem_tipo"],[30.0,224.94,"o","s","Yepes et al., 2020","P",null,0,"portland_sem_tipo"],[35.0,265.28,"o","s","Yepes et al., 2020","P",null,0,"portland_sem_tipo"],[40.0,265.28,"o","s","Yepes et al., 2020","P",null,0,"portland_sem_tipo"],[45.0,265.91,"o","s","Yepes et al., 2020","P",null,0,"portland_sem_tipo"],[50.0,265.95,"o","s","Yepes et al., 2020","P",null,0,"portland_sem_tipo"],[28.0,357.3,"o","s","Almulhim et al., 2020","P",null,0,"cem_i"],[35.0,430.8,"c","p","Cejuela et al., 2020","P",null,0,null],[35.0,407.7,"c","p","Cejuela et al., 2020","P",null,0,null],[35.0,110.0,"c","p","Cejuela et al., 2020","P",null,0,null],[30.0,376.0,"o","s","Kayabekir et al., 2020","P",null,0,"nao_declarado"],[30.0,143.48,"o","s","Kayabekir et al., 2020","P",null,0,"nao_declarado"],[40.0,373.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado"],[30.0,220.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado"],[35.0,244.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado"],[30.0,219.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado"],[20.0,301.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado"],[25.0,310.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado"],[30.0,341.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado"],[35.0,385.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado"],[40.0,410.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado"],[32.0,371.0,"o","p","Palumbo et al., 2020","P",null,0,"cem_i"],[28.0,213.0,"s","p","Palumbo et al., 2020","P",null,0,null],[25.0,197.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado"],[20.0,178.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado"],[45.0,286.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado"],[50.0,254.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado"],[50.0,300.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado"],[85.0,466.0,"o","p","Palumbo et al., 2020","P",null,0,"nao_declarado"],[21.0,410.0,"o","p","Park et al., 2020","P",null,0,"nao_declarado"],[21.0,420.0,"o","p","Park et al., 2020","P",null,0,"nao_declarado"],[24.0,415.0,"o","p","Park et al., 2020","P",null,0,"nao_declarado"],[24.0,430.0,"o","p","Park et al., 2020","P",null,0,"nao_declarado"],[24.0,436.8,"o","p","Park et al., 2020","P",null,0,"nao_declarado"],[40.5,268.9,"s","p","Fort et al., 2020","P",null,1,null],[35.5,0.34,"o","p","Tosic et al., 2020","P",null,0,"nao_declarado"],[35.5,0.35,"r","p","Tosic et al., 2020","P",null,0,null],[35.5,0.35,"r","p","Tosic et al., 2020","P",null,0,null],[40.5,0.37,"o","p","Tosic et al., 2020","P",null,0,"nao_declarado"],[40.5,0.37,"r","p","Tosic et al., 2020","P",null,0,null],[40.5,0.36,"r","p","Tosic et al., 2020","P",null,0,null],[30.0,430.8,"o","p","Alzard et al., 2021","P",null,0,"astm_type_i"],[30.0,429.3,"r","p","Alzard et al., 2021","P",null,0,null],[30.0,487.3,"r","p","Alzard et al., 2021","P",null,0,null],[30.0,624.2,"r","p","Alzard et al., 2021","P",null,0,null],[30.0,503.2,"r","p","Alzard et al., 2021","P",null,0,null],[30.0,516.3,"r","p","Alzard et al., 2021","P",null,0,null],[30.0,301.8,"s","p","Alzard et al., 2021","P",null,0,null],[30.0,364.6,"s","p","Alzard et al., 2021","P",null,0,null],[30.0,390.2,"s","p","Alzard et al., 2021","P",null,0,null],[64.56,473.0,"g","p","Tang et al., 2021","N",null,0,null],[35.5,699.0,"o","p","Tang et al., 2021","P",null,0,"astm_type_i"],[38.3,727.0,"r","p","Tang et al., 2021","P",null,0,null],[30.0,213.48,"o","p","Bertola et al., 2021","P",null,0,"cem_i"],[28.0,264.18,"o","p","Imtiaz et al., 2021","P",null,0,"portland_sem_tipo"],[28.0,261.31,"r","p","Imtiaz et al., 2021","P",null,0,null],[30.0,112.74,"g","p","Imtiaz et al., 2021","N",null,0,null],[27.0,111.38,"g","p","Imtiaz et al., 2021","N",null,0,null],[25.0,354.0,"o","p","Mariakova et al., 2022","P",350.47,0,"nao_declarado"],[25.0,295.0,"r","p","Mariakova et al., 2022","P",291.47,1,null],[25.0,259.0,"r","p","Mariakova et al., 2022","P",255.47,1,null],[55.0,204.0,"g","p","Rabie et al., 2022","N",null,0,null],[30.0,280.66,"o","s","Li et al., 2022","P",null,0,"portland_sem_tipo"],[35.3,413.9,"o","p","Ji et al., 2022","P",null,0,"cem_ii"],[35.87,439.56,"o","p","Onyelowe et al., 2022","P",null,0,"portland_sem_tipo"],[21.89,372.62,"o","p","Onyelowe et al., 2022","P",null,0,"portland_sem_tipo"],[25.93,390.88,"o","p","Onyelowe et al., 2022","P",null,0,"portland_sem_tipo"],[57.92,342.2,"o","p","Onyelowe et al., 2022","P",null,0,"portland_sem_tipo"],[50.07,433.9,"o","p","Onyelowe et al., 2022","P",null,0,"portland_sem_tipo"],[43.5,259.7,"o","p","Zhao et al., 2022","P",null,0,"cem_i"],[46.5,258.5,"r","p","Zhao et al., 2022","P",null,0,null],[48.0,257.4,"r","p","Zhao et al., 2022","P",null,0,null],[45.0,252.2,"s","p","Zhao et al., 2022","P",null,0,null],[43.0,245.8,"s","p","Zhao et al., 2022","P",null,0,null],[46.0,251.0,"s","p","Zhao et al., 2022","P",null,0,null],[44.0,244.7,"s","p","Zhao et al., 2022","P",null,0,null],[41.45,417.36,"o","s","Lei et al., 2022","P",413.21,0,"gb_po"],[29.15,394.06,"r","s","Lei et al., 2022","P",387.84,0,null],[45.0,229.5,"o","p","Kvocka et al., 2022","P",null,0,"cem_ii_b"],[49.0,127.4,"o","p","Kvocka et al., 2022","P",null,0,"cem_iii"],[45.0,247.5,"o","p","Kvocka et al., 2022","P",null,0,"cem_ii_b"],[49.0,137.2,"o","p","Kvocka et al., 2022","P",null,0,"cem_iii"],[42.0,251.9,"r","p","Kvocka et al., 2022","P",205.8,0,null],[39.0,151.7,"r","p","Kvocka et al., 2022","P",105.3,0,null],[42.0,271.0,"r","p","Kvocka et al., 2022","P",226.8,0,null],[37.0,158.2,"r","p","Kvocka et al., 2022","P",114.7,0,null],[60.0,447.4,"o","s","Wang et al., 2023","P",null,0,"nao_declarado"],[70.13,335.09,"r","s","Starczyk-Kolbyk & Malek, 2023","P",null,0,null],[58.0,767.4,"c","p","Backes et al., 2023","P",713.5,0,null],[58.0,914.9,"c","p","Backes et al., 2023","P",861.1,0,null],[35.0,427.1,"c","p","Backes et al., 2023","P",427.1,1,null],[47.6,393.09,"o","p","Moro, 2023","P",null,0,"portland_sem_tipo"],[54.9,324.93,"s","p","Moro, 2023","P",null,0,null],[42.7,299.49,"s","p","Moro, 2023","P",null,0,null],[56.0,358.03,"s","p","Moro, 2023","P",null,0,null],[44.4,378.37,"r","p","Moro, 2023","P",369.73,0,null],[53.2,310.21,"r","p","Moro, 2023","P",301.57,0,null],[40.1,284.77,"r","p","Moro, 2023","P",276.13,0,null],[49.3,343.31,"r","p","Moro, 2023","P",334.67,0,null],[44.3,363.66,"r","p","Moro, 2023","P",346.38,0,null],[50.7,295.5,"r","p","Moro, 2023","P",278.22,0,null],[41.6,270.06,"r","p","Moro, 2023","P",252.78,0,null],[53.2,328.59,"r","p","Moro, 2023","P",311.31,0,null],[43.3,238.0,"g","p","Amari et al., 2024","N",null,0,null],[37.9,305.81,"o","p","Ma et al., 2024","P",null,0,"nao_declarado"],[34.5,288.23,"o","p","Ma et al., 2024","P",null,0,"nao_declarado"],[34.5,353.21,"o","p","Ma et al., 2024","P",null,0,"nao_declarado"],[68.9,344.04,"o","p","Ma et al., 2024","P",null,0,"nao_declarado"],[82.7,412.84,"o","p","Ma et al., 2024","P",null,0,"nao_declarado"],[55.2,318.81,"o","p","Ma et al., 2024","P",null,0,"nao_declarado"],[41.4,270.64,"o","p","Ma et al., 2024","P",null,0,"nao_declarado"],[40.0,288.9,"o","s","Shi et al., 2024","P",null,0,"nao_declarado"],[60.0,222.3,"o","s","Shi et al., 2024","P",null,0,"nao_declarado"],[60.0,1165.0,"g","p","Roux et al., 2024","N",null,0,null],[44.0,528.0,"g","p","Roux et al., 2024","N",null,0,null],[41.7,489.7,"o","p","Ring et al., 2024","P",null,0,"cem_i"],[41.5,478.1,"s","p","Ring et al., 2024","P",null,0,null],[37.2,466.4,"s","p","Ring et al., 2024","P",null,0,null],[37.0,443.1,"s","p","Ring et al., 2024","P",null,0,null],[34.6,419.8,"s","p","Ring et al., 2024","P",null,0,null],[20.0,237.32,"o","p","Zhao et al., 2024","P",null,0,"nao_declarado"],[25.0,266.18,"o","p","Zhao et al., 2024","P",null,0,"nao_declarado"],[30.0,295.0,"o","p","Zhao et al., 2024","P",null,0,"nao_declarado"],[35.0,362.6,"o","p","Zhao et al., 2024","P",null,0,"nao_declarado"],[50.0,511.0,"o","p","Zhao et al., 2024","P",null,0,"nao_declarado"],[40.0,446.0,"c","p","Jolly et al., 2024","P",425.5,0,null],[30.0,420.2,"o","s","Ali et al., 2024","P",null,0,"nao_declarado"],[72.9,196.0,"g","p","Almonayea et al., 2025","N",null,0,null],[70.0,185.0,"g","p","Almonayea et al., 2025","N",null,0,null],[71.0,230.0,"l","p","Roy et al., 2025","N",null,0,null],[50.0,92.0,"s","p","Cho & Chae, 2016","P",null,0,null],[50.0,145.0,"s","p","Cho & Chae, 2016","P",null,0,null],[50.0,149.0,"l","p","Cho & Chae, 2016","N",null,0,null],[24.0,253.6,"o","p","Cho & Chae, 2016","P",null,0,"nao_declarado"],[24.0,329.37,"o","p","Baek et al., 2016","P",null,0,"nao_declarado"],[27.0,353.02,"o","p","Baek et al., 2016","P",null,0,"nao_declarado"],[30.0,383.77,"o","p","Baek et al., 2016","P",null,0,"nao_declarado"],[35.0,406.71,"o","p","Baek et al., 2016","P",null,0,"nao_declarado"],[40.0,429.65,"o","p","Baek et al., 2016","P",null,0,"nao_declarado"],[50.0,508.39,"o","p","Baek et al., 2016","P",null,0,"nao_declarado"],[25.0,432.8,"o","p","Abd Rashid et al., 2017","P",null,0,"nao_declarado"],[35.0,451.4,"c","p","Penades-Pla et al., 2017","P",349.8,0,null],[50.0,558.3,"c","p","Penades-Pla et al., 2017","P",419.2,0,null],[24.0,364.9,"o","p","Kim et al., 2017","P",null,0,"portland_sem_tipo"],[30.0,365.4,"s","p","Kim et al., 2017","P",null,0,null],[25.0,345.0,"o","p","Haigh, 2025","P",null,0,"as_gp"],[29.0,315.0,"s","p","Haigh, 2025","P",null,0,null],[32.0,304.0,"s","p","Haigh, 2025","P",null,0,null],[25.0,264.62,"r","s","Kocak et al., 2024","P",null,0,null],[25.0,273.18,"o","s","Kocak et al., 2024","P",null,0,"cem_i"],[25.0,302.39,"o","s","Mel et al., 2015","P",null,0,"portland_sem_tipo"],[30.0,3532.0,"o","p","Oh et al., 2023","P",null,0,"nao_declarado"],[25.7,546.72,"g","s","Damrongwiriyanupap et al., 2022","N",null,0,null],[46.8,546.72,"g","s","Damrongwiriyanupap et al., 2022","N",null,0,null],[29.3,480.53,"g","s","Damrongwiriyanupap et al., 2022","N",null,0,null],[48.7,480.54,"g","s","Damrongwiriyanupap et al., 2022","N",null,0,null],[30.3,414.34,"g","s","Damrongwiriyanupap et al., 2022","N",null,0,null],[47.1,414.35,"g","s","Damrongwiriyanupap et al., 2022","N",null,0,null],[30.4,348.15,"g","s","Damrongwiriyanupap et al., 2022","N",null,0,null],[49.2,348.17,"g","s","Damrongwiriyanupap et al., 2022","N",null,0,null],[31.7,281.97,"g","s","Damrongwiriyanupap et al., 2022","N",null,0,null],[51.4,281.99,"g","s","Damrongwiriyanupap et al., 2022","N",null,0,null],[30.0,566.63,"c","p","Menna Barreto et al., 2021","P",553.05,0,null],[30.0,598.68,"c","p","Menna Barreto et al., 2021","P",581.71,0,null],[30.0,602.69,"c","p","Menna Barreto et al., 2021","P",582.32,0,null],[30.0,636.8,"c","p","Hajiesmaeili et al., 2019","P",null,0,null],[34.4,642.67,"c","p","Kontra et al., 2023","P",674.81,0,null],[35.0,364.0,"o","p","Jones & Li, 2024","P",null,0,"nao_declarado"],[40.0,340.0,"o","s","Meng et al., 2023","P",null,0,"nao_declarado"],[37.1,469.8,"s","p","Cunningham et al., 2021","P",null,0,null],[29.6,469.8,"s","p","Cunningham et al., 2021","P",null,0,null],[31.6,469.8,"s","p","Cunningham et al., 2021","P",null,0,null],[28.3,469.8,"s","p","Cunningham et al., 2021","P",null,0,null],[27.0,469.8,"s","p","Cunningham et al., 2021","P",null,0,null],[25.9,469.8,"s","p","Cunningham et al., 2021","P",null,0,null],[22.2,469.8,"s","p","Cunningham et al., 2021","P",null,0,null],[31.4,469.8,"s","p","Cunningham et al., 2021","P",null,0,null],[34.2,469.8,"s","p","Cunningham et al., 2021","P",null,0,null],[27.2,469.8,"s","p","Cunningham et al., 2021","P",null,0,null],[29.2,469.8,"s","p","Cunningham et al., 2021","P",null,0,null],[31.4,469.8,"s","p","Cunningham et al., 2021","P",null,0,null],[27.7,469.8,"s","p","Cunningham et al., 2021","P",null,0,null],[23.5,469.8,"s","p","Cunningham et al., 2021","P",null,0,null],[34.5,469.8,"s","p","Cunningham et al., 2021","P",null,0,null],[27.7,469.8,"s","p","Cunningham et al., 2021","P",null,0,null],[20.0,201.38,"o","p","Li & Zhu, 2022","P",null,0,"nao_declarado"],[25.0,250.54,"o","p","Li & Zhu, 2022","P",null,0,"nao_declarado"],[30.0,306.78,"o","p","Li & Zhu, 2022","P",null,0,"nao_declarado"],[40.0,391.03,"o","p","Li & Zhu, 2022","P",null,0,"nao_declarado"],[30.0,702.9,"c","s","Mitterpach et al., 2023","P",null,0,null],[30.0,493.3,"c","s","Mitterpach et al., 2023","P",null,0,null],[30.0,379.4,"c","s","Mitterpach et al., 2023","P",null,0,null],[25.0,230.5,"o","p","Sameer et al., 2020","P",null,0,"nao_declarado"],[25.0,137.9,"r","p","Sameer et al., 2020","P",null,0,null],[25.0,232.8,"o","p","Sameer et al., 2020","P",null,0,"nao_declarado"],[25.0,238.2,"r","p","Sameer et al., 2020","P",null,0,null],[25.0,521.1,"r","p","Zhang et al., 2023","P",null,0,null],[25.0,514.7,"r","p","Zhang et al., 2023","P",null,0,null],[25.0,489.1,"r","p","Zhang et al., 2023","P",null,0,null],[25.0,477.5,"r","p","Zhang et al., 2023","P",null,0,null],[25.0,457.1,"r","p","Zhang et al., 2023","P",null,0,null],[25.0,409.9,"r","p","Zhang et al., 2023","P",null,0,null],[25.0,391.0,"r","p","Zhang et al., 2023","P",null,0,null],[25.0,519.6,"r","p","Zhang et al., 2023","P",null,0,null],[25.0,514.7,"r","p","Zhang et al., 2023","P",null,0,null],[25.0,519.6,"r","p","Zhang et al., 2023","P",null,0,null],[25.0,517.1,"r","p","Zhang et al., 2023","P",null,0,null],[25.0,489.1,"r","p","Zhang et al., 2023","P",null,0,null],[42.5,347.2,"o","p","Rathnarajan et al., 2025","P",null,0,"cem_i"],[44.5,348.8,"o","p","Rathnarajan et al., 2025","P",null,0,"cem_i"],[44.8,256.9,"s","p","Rathnarajan et al., 2025","P",null,0,null],[42.0,257.9,"s","p","Rathnarajan et al., 2025","P",null,0,null],[50.0,256.3,"s","p","Rathnarajan et al., 2025","P",null,0,null],[46.0,258.2,"s","p","Rathnarajan et al., 2025","P",null,0,null],[55.0,301.2,"s","p","Rathnarajan et al., 2025","P",null,0,null],[65.0,280.5,"s","p","Rathnarajan et al., 2025","P",null,0,null],[60.0,281.3,"s","p","Rathnarajan et al., 2025","P",null,0,null],[45.7,249.1,"s","p","Rathnarajan et al., 2025","P",null,0,null],[43.6,249.8,"s","p","Rathnarajan et al., 2025","P",null,0,null],[54.0,273.4,"s","p","Rathnarajan et al., 2025","P",null,0,null],[52.0,274.1,"s","p","Rathnarajan et al., 2025","P",null,0,null],[53.5,235.8,"s","p","Rathnarajan et al., 2025","P",null,0,null],[55.0,236.3,"s","p","Rathnarajan et al., 2025","P",null,0,null],[50.5,296.8,"s","p","Rathnarajan et al., 2025","P",null,0,null],[52.0,297.6,"s","p","Rathnarajan et al., 2025","P",null,0,null],[44.0,270.9,"s","p","Rathnarajan et al., 2025","P",null,0,null],[50.8,271.4,"s","p","Rathnarajan et al., 2025","P",null,0,null],[73.2,1080.0,"g","p","Abdel-Gawwad et al., 2024","N",null,0,null],[65.2,625.0,"g","p","Abdel-Gawwad et al., 2024","N",null,0,null],[30.3,606.0,"g","p","Abdel-Gawwad et al., 2024","N",null,0,null],[72.3,888.0,"g","p","Abdel-Gawwad et al., 2024","N",null,0,null],[68.6,613.0,"g","p","Abdel-Gawwad et al., 2024","N",null,0,null],[22.1,331.0,"g","p","Abdel-Gawwad et al., 2024","N",null,0,null],[34.8,580.0,"g","p","Abdel-Gawwad et al., 2024","N",null,0,null],[67.7,613.0,"g","p","Abdel-Gawwad et al., 2024","N",null,0,null],[85.0,867.0,"g","p","Abdel-Gawwad et al., 2024","N",null,0,null],[61.8,620.0,"g","p","Abdel-Gawwad et al., 2024","N",null,0,null],[35.9,360.0,"g","p","Abdel-Gawwad et al., 2024","N",null,0,null],[32.0,795.2,"c","p","Villalba et al., 2024","P",null,0,null],[58.7,438.0,"s","s","Kanagaraj et al., 2023","P",null,0,null],[57.0,289.5,"l","p","Spagnuolo & Meda, 2024","N",null,0,null],[48.0,297.7,"o","p","Spagnuolo & Meda, 2024","P",null,0,"cem_iv"],[46.89,185.0,"g","p","Irshidat et al., 2021","N",null,1,null],[42.45,183.2,"g","p","Irshidat et al., 2021","N",null,1,null],[39.72,186.1,"g","p","Irshidat et al., 2021","N",null,1,null],[34.73,182.2,"g","p","Irshidat et al., 2021","N",null,1,null],[41.41,187.1,"g","p","Irshidat et al., 2021","N",null,1,null],[35.23,181.1,"g","p","Irshidat et al., 2021","N",null,1,null],[45.9,188.1,"g","p","Irshidat et al., 2021","N",null,1,null],[27.92,180.1,"g","p","Irshidat et al., 2021","N",null,1,null],[43.28,190.2,"g","p","Irshidat et al., 2021","N",null,1,null],[26.58,178.0,"g","p","Irshidat et al., 2021","N",null,1,null],[41.63,192.1,"g","p","Irshidat et al., 2021","N",null,1,null],[25.27,176.2,"g","p","Irshidat et al., 2021","N",null,1,null],[44.52,217.55,"s","s","Amran et al., 2022","P",null,0,null],[40.0,408.0,"o","p","Arruda Junior et al., 2023","P",null,0,"cem_i"],[44.0,343.2,"o","p","Arruda Junior et al., 2023","P",null,0,"cem_ii"],[57.0,279.3,"s","p","Arruda Junior et al., 2023","P",null,0,null],[52.0,275.6,"s","p","Arruda Junior et al., 2023","P",null,0,null],[49.0,274.4,"s","p","Arruda Junior et al., 2023","P",null,0,null],[44.0,228.8,"s","p","Arruda Junior et al., 2023","P",null,0,null],[42.0,222.6,"s","p","Arruda Junior et al., 2023","P",null,0,null],[39.0,216.4,"s","p","Arruda Junior et al., 2023","P",null,0,null],[53.9,417.9,"o","p","Vaclavik et al., 2024","P",null,0,"cem_i"],[49.4,376.5,"s","p","Vaclavik et al., 2024","P",null,0,null],[38.0,335.2,"s","p","Vaclavik et al., 2024","P",null,0,null],[29.8,293.9,"s","p","Vaclavik et al., 2024","P",null,0,null],[56.2,342.3,"o","p","Vaclavik et al., 2024","P",null,0,"cem_ii_a"],[47.0,308.5,"s","p","Vaclavik et al., 2024","P",null,0,null],[43.1,274.7,"s","p","Vaclavik et al., 2024","P",null,0,null],[34.8,241.0,"s","p","Vaclavik et al., 2024","P",null,0,null],[51.5,273.0,"o","p","Vaclavik et al., 2024","P",null,0,"cem_iii"],[49.2,246.2,"s","p","Vaclavik et al., 2024","P",null,0,null],[36.0,219.3,"s","p","Vaclavik et al., 2024","P",null,0,null],[26.6,192.5,"s","p","Vaclavik et al., 2024","P",null,0,null],[52.4,307.2,"o","p","Vaclavik et al., 2024","P",null,0,"cem_v"],[48.5,276.9,"s","p","Vaclavik et al., 2024","P",null,0,null],[40.3,246.6,"s","p","Vaclavik et al., 2024","P",null,0,null],[32.4,216.4,"s","p","Vaclavik et al., 2024","P",null,0,null],[56.8,377.2,"s","p","Vaclavik et al., 2024","P",null,0,null],[48.0,336.6,"s","p","Vaclavik et al., 2024","P",null,0,null],[44.0,295.9,"s","p","Vaclavik et al., 2024","P",null,0,null],[53.6,309.2,"s","p","Vaclavik et al., 2024","P",null,0,null],[45.1,276.1,"s","p","Vaclavik et al., 2024","P",null,0,null],[37.9,243.0,"s","p","Vaclavik et al., 2024","P",null,0,null],[47.5,246.9,"s","p","Vaclavik et al., 2024","P",null,0,null],[40.9,220.7,"s","p","Vaclavik et al., 2024","P",null,0,null],[34.3,194.5,"s","p","Vaclavik et al., 2024","P",null,0,null],[51.3,277.6,"s","p","Vaclavik et al., 2024","P",null,0,null],[42.5,248.0,"s","p","Vaclavik et al., 2024","P",null,0,null],[36.2,218.4,"s","p","Vaclavik et al., 2024","P",null,0,null],[40.0,322.14,"o","p","Wu et al., 2024","P",null,0,"nao_declarado"],[35.0,292.45,"o","p","Wu et al., 2024","P",null,0,"nao_declarado"],[30.0,273.29,"o","p","Wu et al., 2024","P",null,0,"nao_declarado"],[25.0,243.04,"o","p","Wu et al., 2024","P",null,0,"nao_declarado"],[20.0,211.45,"o","p","Wu et al., 2024","P",null,0,"nao_declarado"],[35.0,341.8,"c","p","Almirall et al., 2019","P",null,0,null],[35.0,534.7,"c","p","Almirall et al., 2019","P",null,0,null],[55.5,372.5,"r","p","Dadd et al., 2025","P",null,0,null],[47.91,335.0,"r","p","Dadd et al., 2025","P",null,0,null],[48.26,350.4,"r","p","Dadd et al., 2025","P",null,0,null],[35.0,693.0,"o","p","Teixeira et al., 2016","P",null,0,"portland_sem_tipo"],[37.5,520.0,"s","p","Teixeira et al., 2016","P",null,0,null],[25.0,248.0,"o","p","Zastrow et al., 2017","P",null,0,"portland_sem_tipo"],[35.0,361.0,"o","p","Jones & Li, 2023","P",null,0,"nao_declarado"],[30.0,370.0,"c","s","Kuepfer et al., 2024","P",null,0,null],[30.0,248.0,"s","p","Driessen & Gronlund, 2024","P",null,0,null],[30.0,211.0,"s","p","Driessen & Gronlund, 2024","P",null,0,null],[20.0,340.23,"c","p","Tushar et al., 2023","P",null,0,null],[20.0,347.59,"c","p","Tushar et al., 2023","P",null,1,null],[20.0,338.45,"c","p","Tushar et al., 2023","P",null,1,null],[20.0,275.28,"c","p","Tushar et al., 2023","P",null,0,null],[20.0,281.69,"c","p","Tushar et al., 2023","P",null,0,null],[20.0,272.66,"c","p","Tushar et al., 2023","P",null,1,null],[20.0,279.9,"c","p","Tushar et al., 2023","P",null,1,null],[40.0,316.0,"o","p","Malami et al., 2024","P",297.53,0,"cem_i"],[40.0,249.8,"s","p","Malami et al., 2024","P",233.97,0,null],[40.0,132.61,"s","p","Malami et al., 2024","P",122.28,0,null],[26.81,720.0,"o","p","Cunningham & Miller, 2020","P",null,0,"astm_type_ii_v"],[26.41,537.0,"s","p","Cunningham & Miller, 2020","P",null,0,null],[21.54,493.0,"s","p","Cunningham & Miller, 2020","P",null,0,null],[25.0,250.0,"r","p","Mostert et al., 2020","P",null,0,null],[50.0,363.0,"g","s","Teh & Wiedmann, 2018","N",null,0,null],[48.9,375.0,"s","p","Tian et al., 2024","P",null,0,null],[31.5,352.0,"s","p","Tian et al., 2024","P",null,0,null],[36.5,352.0,"s","p","Tian et al., 2024","P",null,0,null],[25.0,308.0,"s","p","Tian et al., 2024","P",null,0,null],[29.5,332.0,"s","p","Tian et al., 2024","P",null,0,null],[49.5,373.9,"o","p","Radovic et al., 2022","P",null,0,"cem_i"],[50.0,315.7,"s","p","Radovic et al., 2022","P",null,0,null],[45.4,279.6,"s","p","Radovic et al., 2022","P",null,0,null],[46.4,256.7,"s","p","Radovic et al., 2022","P",null,0,null],[50.1,315.8,"s","p","Radovic et al., 2022","P",null,0,null],[61.8,285.0,"s","p","Radovic et al., 2022","P",null,0,null],[56.5,345.0,"o","p","Radovic et al., 2022","P",null,0,"cem_i"],[52.3,276.4,"s","p","Radovic et al., 2022","P",null,0,null],[43.7,310.6,"s","p","Radovic et al., 2022","P",null,0,null],[58.0,285.3,"s","p","Radovic et al., 2022","P",null,0,null],[55.1,313.4,"s","p","Radovic et al., 2022","P",null,0,null],[64.0,438.8,"o","p","Radovic et al., 2022","P",null,0,"cem_i"],[53.6,392.4,"o","p","Radovic et al., 2022","P",null,0,"cem_i"],[43.0,347.8,"o","p","Radovic et al., 2022","P",null,0,"cem_i"],[53.9,392.0,"s","p","Radovic et al., 2022","P",null,0,null],[45.0,351.3,"s","p","Radovic et al., 2022","P",null,0,null],[36.9,313.0,"s","p","Radovic et al., 2022","P",null,0,null],[50.6,361.6,"s","p","Radovic et al., 2022","P",null,0,null],[58.7,380.5,"o","p","Radovic et al., 2022","P",null,0,"cem_i"],[47.2,361.5,"o","p","Radovic et al., 2022","P",null,0,"cem_i"],[49.7,337.2,"s","p","Radovic et al., 2022","P",null,0,null],[42.4,321.6,"s","p","Radovic et al., 2022","P",null,0,null],[47.5,395.6,"o","p","Radovic et al., 2022","P",null,0,"cem_i"],[43.2,355.1,"s","p","Radovic et al., 2022","P",null,0,null],[35.6,327.6,"s","p","Radovic et al., 2022","P",null,0,null],[34.47,537.9,"c","p","Tushar et al., 2022","P",null,0,null],[34.47,515.9,"c","p","Tushar et al., 2022","P",null,0,null],[34.47,440.6,"c","p","Tushar et al., 2022","P",null,0,null],[34.47,650.6,"c","p","Tushar et al., 2022","P",null,0,null],[34.47,539.8,"c","p","Tushar et al., 2022","P",null,0,null],[34.47,517.6,"c","p","Tushar et al., 2022","P",null,0,null],[34.47,429.0,"c","p","Tushar et al., 2022","P",null,0,null],[20.68,536.1,"c","p","Tushar et al., 2022","P",null,0,null],[20.68,517.8,"c","p","Tushar et al., 2022","P",null,0,null],[20.68,444.7,"c","p","Tushar et al., 2022","P",null,0,null],[20.68,503.0,"c","p","Tushar et al., 2022","P",null,0,null],[20.68,561.3,"c","p","Tushar et al., 2022","P",null,0,null],[34.47,557.9,"c","p","Tushar et al., 2022","P",null,0,null],[34.47,535.9,"c","p","Tushar et al., 2022","P",null,0,null],[34.47,447.9,"c","p","Tushar et al., 2022","P",null,0,null],[34.47,507.0,"c","p","Tushar et al., 2022","P",null,0,null],[34.47,566.0,"c","p","Tushar et al., 2022","P",null,0,null],[27.4,287.0,"r","p","Pavlů et al., 2025","P",160.2,0,null],[28.0,270.0,"s","s","Pineda et al., 2025","P",null,0,null],[35.5,208.0,"r","p","Pushkar et al., 2022","P",null,0,null],[32.46,264.1,"o","p","Los Santos-Ortega et al., 2023","P",null,0,"cem_ii_a"],[29.12,264.1,"o","p","Los Santos-Ortega et al., 2023","P",null,0,"cem_ii_a"],[24.13,245.9,"o","p","Los Santos-Ortega et al., 2023","P",null,0,"cem_ii_a"],[40.0,525.8,"c","p","Penadés-Plà et al., 2018","P",428.2,0,null],[20.0,234.64,"o","s","Li et al., 2022","P",null,0,"portland_sem_tipo"],[25.0,245.98,"o","s","Li et al., 2022","P",null,0,"portland_sem_tipo"],[35.0,326.62,"o","s","Li et al., 2022","P",null,0,"portland_sem_tipo"],[40.0,363.03,"o","s","Li et al., 2022","P",null,0,"portland_sem_tipo"],[45.0,399.45,"o","s","Li et al., 2022","P",null,0,"portland_sem_tipo"],[39.39,412.71,"r","s","Lei et al., 2022","P",408.27,0,null],[36.78,408.03,"r","s","Lei et al., 2022","P",403.24,0,null],[34.15,403.38,"r","s","Lei et al., 2022","P",398.2,0,null],[35.03,398.7,"r","s","Lei et al., 2022","P",393.04,0,null],[30.0,540.0,"c","p","Bento, 2016","P",529.0,0,null],[35.0,602.4,"c","p","Bento, 2016","P",590.8,0,null],[45.0,680.0,"c","p","Bento, 2016","P",667.1,0,null],[25.0,295.0,"o","p","Lara, 2024","P",null,0,"nao_declarado"],[35.0,283.5,"c","p","Studzinski et al., 2024","P",null,0,null],[35.0,278.7,"c","p","Studzinski et al., 2024","P",null,0,null],[35.0,322.1,"c","p","Studzinski et al., 2024","P",null,0,null],[35.0,311.7,"c","p","Studzinski et al., 2024","P",null,0,null],[60.15,1303.7,"s","p","Lv et al., 2024","P",null,0,null],[42.15,1246.9,"s","p","Lv et al., 2024","P",null,0,null],[26.6,293.0,"l","s","Sahmenko et al., 2024","N",null,0,null],[35.5,316.0,"r","p","Jimenez et al., 2015","P",null,0,null],[41.2,410.0,"o","p","Jimenez et al., 2015","P",null,0,"cem_i"],[43.7,381.0,"r","p","Jimenez et al., 2015","P",null,0,null],[33.1,359.8,"s","p","Manan et al., 2024","P",null,0,null],[80.0,401.78,"o","p","Lin et al., 2025","P",null,0,"nao_declarado"],[40.6,192.0,"g","p","Hussain et al., 2025","N",null,0,null],[42.2,192.0,"g","p","Hussain et al., 2025","N",null,0,null],[35.5,284.4,"g","p","Nguyen et al., 2020","N",null,0,null],[36.9,288.5,"g","p","Nguyen et al., 2020","N",null,0,null],[75.87,104.0,"g","p","Sposito, 2024","N",null,0,null],[90.38,112.0,"g","p","Sposito, 2024","N",null,0,null],[77.45,93.5,"g","p","Sposito, 2024","N",93.5,1,null],[86.35,93.9,"g","p","Sposito, 2024","N",93.9,1,null],[61.0,93.9,"g","p","Sposito, 2024","N",93.9,1,null],[47.5,250.2,"s","p","Buffenbarger et al., 2023","P",null,0,null],[61.7,310.7,"s","p","Buffenbarger et al., 2023","P",null,0,null],[45.7,222.1,"s","p","Buffenbarger et al., 2023","P",null,0,null],[51.2,245.7,"s","p","Buffenbarger et al., 2023","P",null,0,null],[48.89,482.2,"o","p","Cunningham et al., 2025","P",null,0,"portland_sem_tipo"],[50.49,459.8,"s","p","Cunningham et al., 2025","P",457.1,0,null],[45.55,459.9,"s","p","Cunningham et al., 2025","P",456.3,0,null],[43.95,416.2,"s","p","Cunningham et al., 2025","P",408.0,0,null],[26.54,416.2,"s","p","Cunningham et al., 2025","P",405.3,0,null],[52.35,460.1,"s","p","Cunningham et al., 2025","P",459.5,0,null],[53.95,416.1,"s","p","Cunningham et al., 2025","P",414.4,0,null],[49.5,416.1,"s","p","Cunningham et al., 2025","P",414.4,0,null],[108.27,443.33,"u","s","Zhang et al., 2025","P",null,0,null],[108.93,443.05,"u","s","Zhang et al., 2025","P",null,0,null],[109.33,442.78,"u","s","Zhang et al., 2025","P",null,0,null],[109.53,442.5,"u","s","Zhang et al., 2025","P",null,0,null],[48.7,1193.0,"o","p","Tefa et al., 2025","P",null,0,"cem_iv"],[45.9,895.0,"o","p","Tefa et al., 2025","P",null,0,"cem_iv"],[35.8,458.0,"s","p","Tefa et al., 2025","P",null,0,null],[40.69,348.94,"g","s","Raj R et al., 2025","N",null,0,null],[47.07,349.67,"g","s","Raj R et al., 2025","N",null,0,null],[53.81,350.41,"g","s","Raj R et al., 2025","N",null,0,null],[58.14,351.14,"g","s","Raj R et al., 2025","N",null,0,null],[56.26,352.6,"g","s","Raj R et al., 2025","N",null,0,null],[37.7,168.6,"g","s","Kanagaraj et al., 2023","N",null,0,null],[39.5,168.6,"g","s","Kanagaraj et al., 2023","N",null,0,null],[41.2,315.3,"g","s","Kanagaraj et al., 2023","N",null,0,null],[42.9,315.3,"g","s","Kanagaraj et al., 2023","N",null,0,null],[43.9,461.2,"g","s","Kanagaraj et al., 2023","N",null,0,null],[46.7,461.2,"g","s","Kanagaraj et al., 2023","N",null,0,null],[20.0,362.8,"g","p","Abdulkareem et al., 2021","N",null,0,null],[24.9,604.8,"g","p","Abdulkareem et al., 2021","N",null,0,null],[20.0,330.9,"o","s","Ma et al., 2021","P",null,0,"nao_declarado"],[25.0,388.5,"o","s","Ma et al., 2021","P",null,0,"nao_declarado"],[30.0,425.3,"o","s","Ma et al., 2021","P",null,0,"nao_declarado"],[35.0,477.8,"o","s","Ma et al., 2021","P",null,0,"nao_declarado"],[40.0,509.2,"o","s","Ma et al., 2021","P",null,0,"nao_declarado"],[45.0,530.2,"o","s","Ma et al., 2021","P",null,0,"nao_declarado"],[25.0,224.5,"s","p","Miller, 2021","P",null,0,null]];

  var UNIT_STATS = [{"kind":"derivado","cat":"m3","n":521},{"kind":"excluido","cat":"m3","n":35},{"kind":"nativo","cat":"m3","n":1005},{"kind":"pendente","cat":"elemento","n":25},{"kind":"pendente","cat":"energia","n":4},{"kind":"pendente","cat":"ja_mpa","n":6},{"kind":"pendente","cat":"kg","n":23},{"kind":"pendente","cat":"m2","n":32},{"kind":"pendente","cat":"metro_linear","n":9},{"kind":"pendente","cat":"tonelada","n":42}];

  var UNIT_EXCLUDED = [{"row_id":2681,"estudo":"Habibi et al., 2024","material":"Concreto circular (RCA + sílica ativa + GGBS) vs concreto convencional","fck":33.4,"co2":249.0,"unidade":"kg CO2-eq/m3","motivo":"HABIBI 2681: 249 = GWP do circular com fim de vida escalado para a vida util do convencional (Tab.3 'Circular (38-Y SL)'; 354 x 37,9/53,7); a mesma mistura (fck 33,4) ja esta na linha 131 (297, berco-a-porta) -> duplicado com outra fronteira"},{"row_id":5050,"estudo":"Braga, 2018","material":"Estrutura de concreto armado VC com alvenaria ceramica fck=25 MPa","fck":25.0,"co2":267.0,"unidade":"kg CO2-eq/m3 de concreto","motivo":"E2: mesmo factor generico da DAP Votorantim (25 MPa x 267) da linha 62, aplicado a outro sistema"},{"row_id":5055,"estudo":"Isaia, 2021","material":"Concreto REF (referencia s/ filler calcario)","fck":127.2,"co2":597.24,"unidade":"kgCO2eq/m3","motivo":"E2: mesmo traco e mesmo CO2 da linha 65, com o fck aos 91 d; fica o par aos 28 d"},{"row_id":5055,"estudo":"Isaia, 2021","material":"Concreto FC50 (50% filler calcario)","fck":87.8,"co2":377.41,"unidade":"kgCO2eq/m3","motivo":"E2: mesmo traco e mesmo CO2 da linha 67, com o fck aos 91 d; fica o par aos 28 d"},{"row_id":5055,"estudo":"Isaia, 2021","material":"Concreto FC60 (60% filler calcario)","fck":65.7,"co2":325.09,"unidade":"kgCO2eq/m3","motivo":"E2: mesmo traco e mesmo CO2 da linha 69, com o fck aos 91 d; fica o par aos 28 d"},{"row_id":5055,"estudo":"Isaia, 2021","material":"Concreto FC60CH10 (60% filler + 10% cal hidratada)","fck":88.6,"co2":361.27,"unidade":"kgCO2eq/m3","motivo":"E2: mesmo traco e mesmo CO2 da linha 71, com o fck aos 91 d; fica o par aos 28 d"},{"row_id":5055,"estudo":"Isaia, 2021","material":"Concreto FC70CV10 (70% filler + 10% cinza volante)","fck":51.8,"co2":212.83,"unidade":"kgCO2eq/m3","motivo":"E2: mesmo traco e mesmo CO2 da linha 73, com o fck aos 91 d; fica o par aos 28 d"},{"row_id":5055,"estudo":"Isaia, 2021","material":"Concreto FC70CV10CH10 (70% filler + 10% CV + 10% CH)","fck":43.5,"co2":250.3,"unidade":"kgCO2eq/m3","motivo":"E2: mesmo traco e mesmo CO2 da linha 75, com o fck aos 91 d; fica o par aos 28 d"},{"row_id":2611,"estudo":"Cong et al., 2024","material":"GGBS-A (geopolimero base escoria de alto-forno, 30 MPa, traco A1)","fck":30.0,"co2":19.944,"unidade":"kg CO2-eq/m3 [RELABEL 2026-09-13: unidade original ja e por 1m3 de concreto (Tabela 14, coluna \"OC (kg/m3)\") -- valor nao alterado]","motivo":"E1: 19,944 (Table 14) e o CO2 do GPC dividido por 18 ciclos de 50 anos em acido sulfurico; o valor por m3 so existe na Fig.8"},{"row_id":2703,"estudo":"Kim et al., 2016","material":"Betao 100% OPC, medido fisicamente (Type 1)","fck":29.6,"co2":342.28,"unidade":"kg-CO2 eq/m3","motivo":"E2: duplica a linha 154 (mesmo traco 100% OPC, mesmo fck e CO2)"},{"row_id":2703,"estudo":"Kim et al., 2016","material":"Betao OPC+BFS (30%), medido fisicamente (Type 2)","fck":33.2,"co2":259.14,"unidade":"kg-CO2 eq/m3 [CORRIGIDO 2026-09-24, lote CI_MPA: co2 estava trocado com a linha 153. Tabela 11 do artigo: Type2=OPC+BFS-geral(30%) pareia com Case5=259.14 (nao ","motivo":"E2: duplica a linha 158 (mesmo traco OPC+BFS 30%, mesmo fck e CO2)"},{"row_id":2703,"estudo":"Kim et al., 2016","material":"Betao OPC+W-BFS (30%, aditivo residuo), medido fisicamente (Type 3)","fck":38.6,"co2":263.24,"unidade":"kg-CO2 eq/m3 [CORRIGIDO 2026-09-24, lote CI_MPA: co2 estava trocado com a linha 152. Tabela 11 do artigo: Type3(rotulado 4)=OPC+W-BFS(30%) pareia com Case4=263.","motivo":"E2: duplica a linha 157 (mesmo traco OPC+W-BFS 30%, mesmo fck e CO2)"},{"row_id":2891,"estudo":"Asensio et al., 2023","material":"TRC (textile-reinforced concrete), baseado no footbridge de referencia de Albstadt-Ebingen","fck":60.0,"co2":1029.5,"unidade":"kg CO2-eq/m3 [DERIVADO 2026-09-11: total CO2 (Tab.6) dividido pelo volume de betao (Tab.5) -- ver observacoes]","motivo":"revisao 2026-09-27: o total 2584 kg (Tab.6) inclui o guarda-corpo de aco galvanizado (\"increases emissions by 10% due to the production of the galvanized steel railing\", p.7717), cuja parcela nao e publicada; massa implicita 7,6 t/2,51 m3 = 3.028 kg/m3 vs 2.500 declarado. O unico percentual (10%) e incoerente com a Tab.6 (TRC emite 13% MENOS que 3DPC). Antes: 1029,5"},{"row_id":3215,"estudo":"Mekky et al., 2024","material":"concreto de controlo (CM) + cenario de aterro de lama de esgoto","fck":33.35,"co2":10300.0,"unidade":"kg CO2 eq (GWP, cenario 1: CM + aterro de lama de esgoto)","motivo":"revisao 2026-09-27 (leitura integral do PDF): incoerente com o proprio inventario (10.300 kg/m3 com 380 kg de cimento; cenario inclui deposicao de lamas)"},{"row_id":3215,"estudo":"Mekky et al., 2024","material":"concreto com 5% biochar de lama de esgoto (ASB) substituindo cimento","fck":31.9,"co2":6980.0,"unidade":"kg CO2 eq (GWP, cenario 2: 5% ASB - biochar de lama de esgoto)","motivo":"revisao 2026-09-27 (leitura integral do PDF): incoerente com o proprio inventario (10.300 kg/m3 com 380 kg de cimento; cenario inclui deposicao de lamas)"},{"row_id":3237,"estudo":"Kanagaraj et al., 2023","material":"SCLGC - concreto geopolimerico autocompactavel leve com agregado de argila expandida (ECA)","fck":47.0,"co2":231.2,"unidade":"kg CO2/m3 (convertido de 0,2312 t-CO2/m3, texto sec.6.3.3)","motivo":"KANAGARAJ 3237: 231,2 kg/m3 e um GPC generico 'segundo a proposta' de Alsalman 2021, nao corresponde a nenhuma mistura da Tab.2 (as ECA0 dao 168,6/315,2/461,0); o fck 47 e de uma mistura SCLGC com argila expandida, sem factor de CO2 -> par mistura duas misturas"},{"row_id":3818,"estudo":"Ye et al., 2024","material":"RC (concreto armado convencional, referencia com armadura, impressao 3D vs. betonagem)","fck":40.0,"co2":885.13,"unidade":"kg CO2-eq/m3","motivo":"E2/D1: RC com aco (885,13 = 318,13 + 567,01 do varao); o mesmo traco sem aco ja esta na linha 1107 (RC-0)"},{"row_id":3881,"estudo":"Han et al., 2019","material":"Concreto estrutural (media de corpos de prova de laboratorio, 7 anos de dados, Indonesia)","fck":35.0,"co2":63000.0,"unidade":"[DERIVADO] kg CO2/ano (pico 2017; = 20 m3 cimento (Fig.4) x 3,15 t/m3 densidade padrao)","motivo":"revisao 2026-09-27 (leitura integral do PDF): PAR_NAO_CONVERTIVEL: fck 35 MPa = media das resistencias registadas em 7 anos (usada para estimar o teor de cimento pelo ACI). O CO2 so existe em 'm3' (Eq.1 aplica factor massa/massa a um VOLUME de cimento; Fig.4 eixo 'CO2 emission (m3)'). Conversao para kg exige a massa volumica do cimento, que o artigo nao imprime. Pela excepcao 5b ja autorizada pela Kie para esta linha (3,15 t/m3), a intensidade por m3 sai directamente das constantes impressas, sem leitura de grafico: 0,204 m3 cimento/m3 betao x 3,15 t/m3 x 0,95 (clinquer) x 0,5 tCO2/t = 0,305 t"},{"row_id":4263,"estudo":"Mostafaei et al., 2025","material":"Concreto de barragem, resistencia de projeto de 20 MPa","fck":20.0,"co2":304.7,"unidade":"kg CO2-eq/m3 [DERIVADO 2026-09-11: rotulo impresso Fig.11 (ton CO2eq/m largura) x1000 / volume por m de largura (Secao 4.4) -- ver observacoes]","motivo":"MOSTAFAEI 4263 (decisao da Kie 2026-10-09, opcao a): a Fig.11 (303/348/422/497 t CO2/m de barragem) nao tem fronteira identificavel - caso-base: construcao 355 t, betao >305 t (p.8, Tab.3), Fig.3 341,2 kg/m3 (=305 t/895 m3, classe 30 MPa por deducao), mas a Fig.11 da 348 t aos 30 MPa; total/volume nao e o CO2 do betao"},{"row_id":4263,"estudo":"Mostafaei et al., 2025","material":"Concreto de barragem, resistencia de projeto de 30 MPa","fck":30.0,"co2":388.7,"unidade":"kg CO2-eq/m3 [DERIVADO 2026-09-11: rotulo impresso Fig.11 (ton CO2eq/m largura) x1000 / volume por m de largura (Secao 4.4) -- ver observacoes]","motivo":"MOSTAFAEI 4263 (decisao da Kie 2026-10-09, opcao a): a Fig.11 (303/348/422/497 t CO2/m de barragem) nao tem fronteira identificavel - caso-base: construcao 355 t, betao >305 t (p.8, Tab.3), Fig.3 341,2 kg/m3 (=305 t/895 m3, classe 30 MPa por deducao), mas a Fig.11 da 348 t aos 30 MPa; total/volume nao e o CO2 do betao"},{"row_id":4263,"estudo":"Mostafaei et al., 2025","material":"Concreto de barragem, resistencia de projeto de 40 MPa","fck":40.0,"co2":473.9,"unidade":"kg CO2-eq/m3 [DERIVADO 2026-09-11: rotulo impresso Fig.11 (ton CO2eq/m largura) x1000 / volume por m de largura (Secao 4.4) -- ver observacoes]","motivo":"MOSTAFAEI 4263 (decisao da Kie 2026-10-09, opcao a): a Fig.11 (303/348/422/497 t CO2/m de barragem) nao tem fronteira identificavel - caso-base: construcao 355 t, betao >305 t (p.8, Tab.3), Fig.3 341,2 kg/m3 (=305 t/895 m3, classe 30 MPa por deducao), mas a Fig.11 da 348 t aos 30 MPa; total/volume nao e o CO2 do betao"},{"row_id":4263,"estudo":"Mostafaei et al., 2025","material":"Concreto de barragem, resistencia de projeto de 50 MPa","fck":50.0,"co2":560.2,"unidade":"kg CO2-eq/m3 [DERIVADO 2026-09-11: rotulo impresso Fig.11 (ton CO2eq/m largura) x1000 / volume por m de largura (Secao 4.4) -- ver observacoes]","motivo":"MOSTAFAEI 4263 (decisao da Kie 2026-10-09, opcao a): a Fig.11 (303/348/422/497 t CO2/m de barragem) nao tem fronteira identificavel - caso-base: construcao 355 t, betao >305 t (p.8, Tab.3), Fig.3 341,2 kg/m3 (=305 t/895 m3, classe 30 MPa por deducao), mas a Fig.11 da 348 t aos 30 MPa; total/volume nao e o CO2 do betao"},{"row_id":4476,"estudo":"Faridmehr et al., 2021","material":"AAM argamassa alcali-ativada Mix 28: FA50%+GBFS50%","fck":80.46,"co2":54.55,"unidade":"kg CO2/m3","motivo":"E2: o proprio artigo repete a Mix 6 como Mix 28 (mesma composicao, fck e CO2) - fica a linha 1396"},{"row_id":4476,"estudo":"Faridmehr et al., 2021","material":"AAM argamassa alcali-ativada Mix 33: GBFS50%+POFA50%","fck":55.64,"co2":77.68,"unidade":"kg CO2/m3","motivo":"E2: o proprio artigo repete a Mix 15 como Mix 33 (mesma composicao, fck e CO2) - fica a linha 1405"},{"row_id":4706,"estudo":"Passoni et al., 2022","material":"Concreto C25/30 -- fundacoes do exoesqueleto de reforco sismico, solucoes Timber Shell e Steel Diagrid (67.29 m3)","fck":25.0,"co2":1297.4,"unidade":"[DERIVADO] kg CO2eq/m3 (concreto C25/30 das fundacoes, modulos A1-A3)","motivo":"revisao 2026-09-27 (leitura integral do PDF): PAR_NAO_CONVERTIVEL: Confirma a decisao da Kie de 2026-09-26. fck: betao C25/30 (classe de projecto) nas fundacoes (67,29 m3 Timber/Diagrid; 95,31 m3 Steel/RC Walls) e superestrutura RC Walls (70,88 m3) - Tab.A1 p.29. CO2 so em totais por solucao (GWP A1-A3: 0,21/1,07/1,64/2,27 x10^5 kgCO2eq, p.17) e na Fig.9(ii), onde a parcela 'concrete C25/30' e uma barra empilhada SEM rotulo proprio; os rotulos '8.73x10^4' e '8.54x10^4' estao no painel PERT (MJ), nao no GWP. O eixo GWP tem escala, mas a leitura da barra verde do betao da ~1,0x10^3 kgCO2eq/m3 (e"},{"row_id":4706,"estudo":"Passoni et al., 2022","material":"Concreto C25/30 -- fundacoes do exoesqueleto de reforco sismico, solucoes Steel Walls e RC Walls (95.31 m3)","fck":25.0,"co2":896.0,"unidade":"[DERIVADO] kg CO2eq/m3 (concreto C25/30 das fundacoes, modulos A1-A3)","motivo":"revisao 2026-09-27 (leitura integral do PDF): PAR_NAO_CONVERTIVEL: Confirma a decisao da Kie de 2026-09-26. fck: betao C25/30 (classe de projecto) nas fundacoes (67,29 m3 Timber/Diagrid; 95,31 m3 Steel/RC Walls) e superestrutura RC Walls (70,88 m3) - Tab.A1 p.29. CO2 so em totais por solucao (GWP A1-A3: 0,21/1,07/1,64/2,27 x10^5 kgCO2eq, p.17) e na Fig.9(ii), onde a parcela 'concrete C25/30' e uma barra empilhada SEM rotulo proprio; os rotulos '8.73x10^4' e '8.54x10^4' estao no painel PERT (MJ), nao no GWP. O eixo GWP tem escala, mas a leitura da barra verde do betao da ~1,0x10^3 kgCO2eq/m3 (e"},{"row_id":4754,"estudo":"Maury-Ramirez & De Belie, 2023","material":"Eco-concreto com 50% escoria de alto-forno (BFS) — vigas aereas e de fundacao, casa sustentavel, Santiago de Cali","fck":28.0,"co2":15.8,"unidade":"kg CO2/m3","motivo":"E1: 15,8 kg CO2/m3 impossivel para 182,6 kg de cimento/m3; o eixo da Fig.4 nao tem unidade"},{"row_id":4754,"estudo":"Maury-Ramirez & De Belie, 2023","material":"Eco-concreto com 50% escoria de alto-forno (BFS) — colunas, casa sustentavel, Santiago de Cali","fck":28.0,"co2":20.1,"unidade":"kg CO2/m3","motivo":"E1: 20,1 kg CO2/m3 impossivel para 182,6 kg de cimento/m3; o eixo da Fig.4 nao tem unidade"},{"row_id":4766,"estudo":"Ma et al., 2024","material":"Concreto estrutural — Mild Reinforced Beams and Slabs (edificio alto hibrido aco-concreto, Chicago, 60 andares)","fck":37.9,"co2":305.81,"unidade":"kg CO2eq/m3 (A-D, cradle-to-grave, base GaBi/NRMCA EPD via Tally)","motivo":"E2: mesma classe 5500 psi e mesmo factor da linha 1758 (dois elementos do mesmo edificio)"},{"row_id":5029,"estudo":"Hora, 2021","material":"Concreto usinado (cimento CP II-F, referencia) para pavimento de ciclovia -- producao apenas","fck":20.0,"co2":190.7,"unidade":"kg CO2-eq/m3 [PAR NOVO 2026-09-11, nao capturado nas extracoes anteriores por truncagem do read_file_content -- ver nota da linha 606 do mesmo row_id]. Valor im","motivo":"E1: as Tabelas 27-29 dao totais da ciclovia (588 m3) com os valores uma linha acima do rotulo; o numero gravado e a eutrofizacao, nao o GWP por m3"},{"row_id":5029,"estudo":"Hora, 2021","material":"Concreto usinado com cimento CP IV (menor teor de clinquer) para pavimento de ciclovia -- producao apenas","fck":20.0,"co2":112.3,"unidade":"kg CO2-eq/m3 [PAR NOVO 2026-09-11, nao capturado nas extracoes anteriores por truncagem do read_file_content -- ver nota da linha 606 do mesmo row_id]. Valor im","motivo":"E1: as Tabelas 27-29 dao totais da ciclovia (588 m3) com os valores uma linha acima do rotulo; o numero gravado e a eutrofizacao, nao o GWP por m3"},{"row_id":5029,"estudo":"Hora, 2021","material":"Concreto usinado com cimento CP V ARI (maior teor de clinquer) para pavimento de ciclovia -- producao apenas","fck":20.0,"co2":200.1,"unidade":"kg CO2-eq/m3 [PAR NOVO 2026-09-11, nao capturado nas extracoes anteriores por truncagem do read_file_content -- ver nota da linha 606 do mesmo row_id]. Valor im","motivo":"E1: as Tabelas 27-29 dao totais da ciclovia (588 m3) com os valores uma linha acima do rotulo; o numero gravado e a eutrofizacao, nao o GWP por m3"},{"row_id":5029,"estudo":"Hora, 2021","material":"Concreto usinado com 50% do agregado graudo substituido por reciclado de concreto (ARC-50%) -- producao+transporte","fck":20.0,"co2":175.0,"unidade":"kg CO2-eq/m3 [PAR NOVO 2026-09-11, nao capturado nas extracoes anteriores por truncagem do read_file_content -- ver nota da linha 606 do mesmo row_id]. Valor im","motivo":"E1: as Tabelas 27-29 dao totais da ciclovia (588 m3) com os valores uma linha acima do rotulo; o numero gravado e a eutrofizacao, nao o GWP por m3"},{"row_id":5029,"estudo":"Hora, 2021","material":"Concreto usinado com 100% do agregado graudo substituido por reciclado de concreto (ARC-100%) -- producao+transporte","fck":20.0,"co2":158.2,"unidade":"kg CO2-eq/m3 [PAR NOVO 2026-09-11, nao capturado nas extracoes anteriores por truncagem do read_file_content -- ver nota da linha 606 do mesmo row_id]. Valor im","motivo":"E1: as Tabelas 27-29 dao totais da ciclovia (588 m3) com os valores uma linha acima do rotulo; o numero gravado e a eutrofizacao, nao o GWP por m3"},{"row_id":5029,"estudo":"Hora, 2021","material":"Concreto 'Ideal' (cimento CP IV + 100% agregado graudo reciclado, combinados) -- producao+transporte","fck":20.0,"co2":79.81,"unidade":"kg CO2-eq/m3 [PAR NOVO 2026-09-11, nao capturado nas extracoes anteriores por truncagem do read_file_content -- ver nota da linha 606 do mesmo row_id]. Valor im","motivo":"E1: as Tabelas 27-29 dao totais da ciclovia (588 m3) com os valores uma linha acima do rotulo; o numero gravado e a eutrofizacao, nao o GWP por m3"}];
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
     sempre um subconjunto Aceito da anterior. e4.principal + e4.sensibilidade = e4.n = os 468
     artigos Elegíveis (2 terços de melhor qualidade formam o resultado
     principal); as 58 revisões sem ACV própria que também sobrevivem à
     Etapa 3 ficam fora desta barra — ver funnelRevisaoNote. */
  var FUNNEL = [
    { key: 'universo', n: 5093 },
    { key: 'e1', n: 2193 },
    { key: 'e2', n: 544 },
    { key: 'e3', n: 526 },
    { key: 'e4', n: 468, principal: 365, sensibilidade: 103 }
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
      kpiFunilLabel: 'artigos aceitos (passaram as 4 etapas)',
      kpiQualidadeLabel: 'dos quais de melhor qualidade (≥ 4,0)',
      kpiParesLabel: 'pares resistência × CO₂ extraídos',
      kpiVidaLabel: 'com vida útil de projeto declarada',
      kpiReleituraLabel: 'lotes da releitura integral concluídos',
      kpiCompletoLabel: 'dos artigos aceitos com resistência e CO₂ já extraídos',
      funnelLabel: 'TRIAGEM',
      funnelTitle: 'O funil da triagem: de 5.093 registos a 468 artigos',
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
        universo: '5.093 registos recolhidos nas buscas. 2.628 (51,6%) eram duplicados, removidos antes de qualquer triagem. 1.932 foram rejeitados ao longo das quatro etapas seguintes — ver o detalhe em cada barra abaixo. 7 nunca tiveram o texto completo disponível (sem acesso). Os 528 restantes — 470 elegíveis + 58 revisões sem ACV própria — chegam todos à Etapa 4.',
        e1: 'Dos 2.465 registos avaliados nos metadados (ano, tipo de documento, material moldável, aplicação em construção), 2.193 foram aceites. Os 272 excluídos falharam por: aplicação em construção (190), material não moldável (71), tipo de documento (9), ano de publicação (1) — um registo pode falhar mais de um critério.',
        e2: 'Dos 2.187 artigos com PDF lido na íntegra, 544 foram aceites. Dos 1.643 excluídos: 1.303 não relatavam resistência à compressão própria pareável a um CO₂ próprio, 442 não relatavam CO₂/ACV com resultado absoluto — alguns falham nos dois critérios.',
        e3: 'Dos 540 artigos avaliados quanto à restrição geográfica do material, 526 foram aceites; 14 foram excluídos por o material principal ser geograficamente restrito (ex.: resíduo de produção regional concentrada).',
        e4: 'Dos 526 artigos avaliados na Etapa 4 (checklist de 7 itens, 0 a 7 pontos): 365 formam o resultado principal (score ≥ 4,0), 103 entram só na análise de sensibilidade (score < 4,0), e 58 são revisões sem avaliação de ciclo de vida própria — não pontuam para o indicador ci, mas alimentam o ramo de citação do PRISMA (fontes primárias descobertas por essas revisões).'
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
      forestP: 'ci = CO₂ ÷ resistência, em kg CO₂-eq por m³·MPa — quanto menor, mais eficiente o material por unidade de resistência entregue. Mediana de cada família; ponto contra ponto no gráfico acima.',
      forestToggleHint: 'toque numa família para ver os estudos que a compõem',
      forestOverall: 'TODOS OS MATERIAIS',
      forestSemLabel: 'estudo sem citação disponível',
      subfamLang: 'pt',
      subfamInfoLabel: 'O que é esta subfamília (norma de referência)',
      baseInfoLabel: 'O que conta em cada opção da base do ligante',
      co2InfoLabel: 'O que é o CO₂ sem e com desconto',
      noteTitle: 'Sobre o indicador',
      noteP: 'O desfecho oficial desta metanálise é ci_t = ci ÷ vida útil de projeto (kg CO₂-eq por m³·MPa·ano). A vida útil só é premissa declarada pelo próprio artigo em 118 dos 468 artigos (25%), por isso o painel mostra o indicador ci, que cobre todos os pares; o ci_t é estimado à parte no subconjunto com vida útil (média 0,163 kg CO₂-eq por m³·MPa·ano, 91 estudos). Metodologia de Damineli et al. (2010). Um modelo de efeitos aleatórios multinível (REML) trata cada formulação como observação própria, aninhada no estudo de origem.',
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
      redeP: "Cada ponto é um artigo, colocado no ano de publicação. Cada linha liga um artigo a outro artigo desta mesma revisão que ele cita na sua lista de referências (fonte: Crossref). Passe o cursor sobre um ponto para destacar quem ele cita e quem o cita.",
      redeAria: "Linha temporal dos artigos incluídos com as ligações de citação entre eles",
      redeTipCita: "cita {n} desta revisão",
      redeTipCitado: "citado por {n}",
      redeTipSemRefs: "Sem lista de referências no Crossref (ex.: teses).",
      redeResumo: "{n} artigos e {l} ligações de citação. {s} artigos não têm lista de referências no Crossref (sobretudo teses e dissertações) e por isso não podem mostrar quem citam.",
      redeLegMeta: "com par no painel",
      redeLegOutro: "sem par no painel",
      redeLegLig: "cita",
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
      }
    },

    EN: {
      kicker: 'RESEARCH · LIVE DASHBOARD',
      title: 'Carbon footprint × strength: the dissertation meta-analysis',
      lead: 'This dashboard tracks, in real time, the data extraction behind the systematic literature review under my dissertation — comparing compressive strength and carbon footprint across low-carbon, recycled-aggregate and ultra-high-performance (UHPC) concretes. The numbers change as each article gets read.',
      navBack: '← kielima.com',
      navDb: 'Database',
      kpiFunilLabel: 'articles accepted (passed all 4 stages)',
      kpiQualidadeLabel: 'of which higher quality (≥ 4.0)',
      kpiParesLabel: 'strength × CO₂ pairs extracted',
      kpiVidaLabel: 'with declared design service life',
      kpiReleituraLabel: 'batches of the full re-read completed',
      kpiCompletoLabel: 'of accepted articles with strength and CO₂ already extracted',
      funnelLabel: 'SCREENING',
      funnelTitle: 'The screening funnel: from 5,093 records to 468 articles',
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
        universo: "5,093 records collected in the searches. 2,628 (51.6%) were duplicates, removed before any screening. 1,932 were rejected across the four stages that follow — see the detail in each bar below. 7 never had the full text available (no access). The remaining 528 — 470 eligible + 58 reviews without their own LCA — all reach Stage 4.",
        e1: 'Of the 2,465 records screened on metadata (year, document type, moldable material, construction application), 2,193 were accepted. The 272 excluded failed on: construction application (190), non-moldable material (71), document type (9), publication year (1) — a record can fail more than one criterion.',
        e2: 'Of the 2,187 articles fully read as PDF, 544 were accepted. Of the 1,643 excluded: 1,303 did not report their own compressive strength paired with their own CO₂, 442 did not report CO₂/LCA with an absolute result — some fail both criteria.',
        e3: "Of the 540 articles assessed for the material's geographic restriction, 526 were accepted; 14 were excluded because the main material is geographically restricted (e.g. a regionally concentrated production by-product).",
        e4: "Of the 526 articles assessed in Stage 4 (a 7-item checklist, 0 to 7 points): 365 form the main result (score ≥ 4.0), 103 enter only the sensitivity analysis (score < 4.0), and 58 are reviews without their own life-cycle assessment — they don't score toward the ci indicator, but feed the PRISMA citation branch (primary sources discovered through those reviews)."
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
      forestP: 'ci = CO₂ ÷ strength, in kg CO₂-eq per m³·MPa — the lower, the more efficient the material per unit of strength delivered. Median of each family; point against point in the chart above.',
      forestToggleHint: 'tap a family to see the studies behind it',
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
      redeP: "Each dot is an article, placed in its publication year. Each line links an article to another article of this same review that it cites in its reference list (source: Crossref). Hover over a dot to highlight what it cites and who cites it.",
      redeAria: "Timeline of the included articles with the citation links between them",
      redeTipCita: "cites {n} in this review",
      redeTipCitado: "cited by {n}",
      redeTipSemRefs: "No reference list in Crossref (e.g. theses).",
      redeResumo: "{n} articles and {l} citation links. {s} articles have no reference list in Crossref (mostly theses and dissertations), so they cannot show what they cite.",
      redeLegMeta: "with a pair in the panel",
      redeLegOutro: "without a pair in the panel",
      redeLegLig: "cites",
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
      }
    },

    ZH: {
      kicker: '研究 · 实时面板',
      title: '碳足迹 × 强度：论文的荟萃分析',
      lead: '本面板实时展示我硕士论文所依托的系统性文献综述的数据提取进度——比较低碳混凝土、再生骨料混凝土与超高性能混凝土（UHPC）的抗压强度与碳足迹。数字会随着每篇文献的阅读而更新。',
      navBack: '← kielima.com',
      navDb: '数据库',
      kpiFunilLabel: '已通过全部4个阶段的入选文献',
      kpiQualidadeLabel: '其中质量较高（≥ 4.0）',
      kpiParesLabel: '已提取的强度×CO₂数据对',
      kpiVidaLabel: '已注明设计使用寿命',
      kpiReleituraLabel: '完整复读批次已完成',
      kpiCompletoLabel: '已入选文献中强度与CO₂均已提取的比例',
      funnelLabel: '筛选',
      funnelTitle: '筛选漏斗：从5,093条记录到468篇文献',
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
        universo: '检索共收集5,093条记录。其中2,628条（51.6%）为重复记录，在任何筛选之前已被移除。1,932条在随后四个阶段中被剔除——详见下方各阶段柱状图。7条从未能获取全文（无法访问）。剩余528条——470篇入选文献+58篇无自身生命周期评估的综述——全部进入第4阶段。',
        e1: '在按元数据（年份、文献类型、可模塑材料、建筑用途）筛选的2,465条记录中，2,193条被接受。被排除的272条中：190条因不属于建筑用途，71条因材料不可模塑，9条因文献类型，1条因发表年份——同一记录可能同时不符合多项标准。',
        e2: '在通读全文PDF的2,187篇文献中，544篇被接受。被排除的1,643篇中：1,303篇未报告可与自身CO₂配对的自身抗压强度，442篇未报告有绝对数值的CO₂/生命周期评估结果——部分文献两项标准都未满足。',
        e3: '在评估材料地域限制的540篇文献中，526篇被接受；14篇因主要材料受地域限制（例如某地区高度集中的生产副产品）而被排除。',
        e4: '在第4阶段（7项清单，0至7分）评估的526篇文献中：365篇构成主要结果（得分≥4.0），103篇仅用于敏感性分析（得分<4.0），58篇是没有自身生命周期评估的综述——不计入ci指标得分，但作为PRISMA引文分支的来源（这些综述引用的原始研究）。'
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
      forestP: 'ci = CO₂ ÷ 强度，单位为每 m³·MPa 的 kg CO₂ 当量——数值越低，材料每单位强度的效率越高。各类别的中位数，与上方图表逐点对应。',
      forestToggleHint: '点击某个类别，查看构成该类别的研究',
      forestOverall: '所有材料',
      forestSemLabel: '无引用信息的研究',
      subfamLang: 'zh',
      subfamInfoLabel: '该子类说明（参考标准）',
      baseInfoLabel: '胶凝材料基础各选项包含的内容',
      co2InfoLabel: '不含与含抵扣的CO₂是什么意思',
      noteTitle: '关于该指标',
      noteP: '本荟萃分析的官方结果指标是 ci_t = ci ÷ 设计使用寿命（每 m³·MPa·年的 kg CO₂ 当量）。468篇文献中只有118篇（25%）将使用寿命作为自身假设明确给出，因此面板显示覆盖全部数据对的 ci 指标；ci_t 在有使用寿命的子集中单独估计（均值 0.163 kg CO₂ 当量/(m³·MPa·年)，91 项研究）。方法源自 Damineli 等（2010）。多层级（REML）随机效应模型将每个配方视为独立观测值，嵌套于其来源研究之下。',
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
      redeP: "每个点代表一篇文献，按发表年份排列。每条线连接一篇文献与其参考文献中引用的本综述内另一篇文献（来源：Crossref）。将鼠标悬停在点上可突出显示其引用和被引用关系。",
      redeAria: "纳入文献的时间线及其相互引用关系",
      redeTipCita: "引用本综述中{n}篇",
      redeTipCitado: "被引用{n}次",
      redeTipSemRefs: "Crossref中无参考文献列表（如学位论文）。",
      redeResumo: "{n}篇文献，{l}条引用关系。{s}篇文献在Crossref中没有参考文献列表（主要是学位论文），因此无法显示其引用。",
      redeLegMeta: "面板中有数据对",
      redeLegOutro: "面板中无数据对",
      redeLegLig: "引用",
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
      }
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

  function svgEl(tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  /* Posiciona um tooltip perto do cursor sem deixá-lo sair da caixa do
     gráfico — os marcos de correção ficam sempre no fim da linha do tempo,
     então sem isto o card abria cortado na borda direita. */
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
    funil: 468,
    vida: 118,
    releitura: '64/68',
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
       vida 118, 403/468 = 86%. */
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
    document.getElementById('kpi-releitura').textContent = KPI_VALUES.releitura;
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
        tooltip.innerHTML = '<b>' + strings.cats[cat] + '</b><br>' +
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

    var byCat = {};
    CATS.forEach(function (c) { byCat[c] = []; });
    var allItems = [];
    currentData().forEach(function (d) {
      var cat = CATCODE[d[2]];
      var fck = d[0], co2 = d[1];
      var ci = fck ? co2 / fck : null;
      if (ci === null || ci <= 0) return;
      var item = { ci: ci, fck: fck, co2: co2, tier: TIERCODE[d[3]], label: d[4], sub: d[8] || null };
      byCat[cat].push(item);
      allItems.push(item);
    });

    var maxCi = 12;
    function pos(v) { return Math.min(v, maxCi) / maxCi * 100; }

    var rows = CATS.map(function (cat) {
      var items = byCat[cat];
      return { cat: cat, med: median(items.map(function (it) { return it.ci; })), items: items };
    }).filter(function (r) { return r.med !== null; });
    rows.sort(function (a, b) { return a.med - b.med; });

    rows.forEach(function (r) {
      list.appendChild(buildForestItem(
        'cat:' + r.cat, strings.cats[r.cat], r.med, 'var(--cat-' + r.cat + ')', pos, r.items, strings
      ));
    });

    var overall = median(allItems.map(function (it) { return it.ci; }));
    var item = buildForestItem('overall', strings.forestOverall, overall, 'var(--ink)', pos, allItems, strings);
    item.classList.add('forest-item-overall');
    list.appendChild(item);
  }

  function buildForestItem(key, label, med, color, pos, items, strings) {
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
    var bar = document.createElement('div');
    bar.className = 'forest-bar';
    bar.style.left = pos(med) + '%';
    bar.style.background = color;
    track.appendChild(bar);
    head.appendChild(track);

    var val = document.createElement('div');
    val.className = 'forest-value';
    val.innerHTML = '<b>' + med.toFixed(2) + '</b> · n=' + items.length;
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
    head.appendChild(track);

    var val = document.createElement('div');
    val.className = 'forest-value forest-sub-value';
    val.innerHTML = '<b>' + r.med.toFixed(2) + '</b> · n=' + r.items.length;
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
    val.innerHTML = '<b>' + it.ci.toFixed(2) + '</b>' +
      '<span class="forest-sub-raw">' + it.fck + ' MPa · ' + it.co2 + ' kg/m³</span>';
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
      arts.forEach(function (a) {
        var p = pos[a.id];
        var c = svgEl('circle', { cx: p.x, cy: p.y, r: 3.6, 'class': 'rede-no' + (a.meta ? ' meta' : '') + (a.refs ? '' : ' sem-refs') });
        var hit = svgEl('circle', { cx: p.x, cy: p.y, r: 6, 'class': 'rede-hit' });
        hit.addEventListener('mousemove', function (ev) {
          svg.classList.add('is-foco');
          ligs.forEach(function (l) {
            l.el.classList.toggle('cita', l.de === a.id);
            l.el.classList.toggle('citado', l.para === a.id);
          });
          c.classList.add('foco');
          var cita = a.cita.filter(function (b) { return porId[b]; }).length;
          var linhas = [
            { b: a.rot, t: '· ' + nomePais(a.iso2, lang, a.iso3 || '') },
            { t: a.titulo },
            { t: strings.redeTipCita.replace('{n}', fmtInt(cita, lang)) + ' · ' +
                 strings.redeTipCitado.replace('{n}', fmtInt(citadoPor[a.id] || 0, lang)) }
          ];
          if (!a.refs) linhas.push({ t: strings.redeTipSemRefs });
          tooltipLinhas(tooltip, linhas);
          tooltip.classList.add('is-visible');
          positionTooltip(tooltip, wrap, ev);
        });
        hit.addEventListener('mouseleave', function () {
          svg.classList.remove('is-foco');
          ligs.forEach(function (l) { l.el.classList.remove('cita'); l.el.classList.remove('citado'); });
          c.classList.remove('foco');
          tooltip.classList.remove('is-visible');
        });
        gNos.appendChild(c);
        gNos.appendChild(hit);
      });
      svg.appendChild(gNos);

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

  function renderAll(strings, lang) {
    renderKPIs(lang);
    renderBaseCounts(lang);
    renderTierCounts(lang);
    renderScatterDesc(strings, lang);
    renderFunnel(strings, lang);
    renderScatter(strings);
    renderLegend(strings);
    renderForest(strings);
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
