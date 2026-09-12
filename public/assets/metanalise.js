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
   [fck_MPa, co2_kg_m3, cat, estrato, citacao_curta_ou_null] — o 5º campo
   (adicionado 2026-09-12, pedido da Kie) é uma citação curta tipo
   "Sobrenome et al., Ano" usada só como rótulo de UI no forest plot por
   estudo (clique numa família em "ci por família de material" para
   expandir); null quando dados_fck.autores está vazio. UNIT_STATS é a
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
  var CATCODE = { g: 'geopolimero', u: 'uhpc', s: 'scm', r: 'reciclado', o: 'opc', l: 'ligantes', b: 'biobase', c: 'concreto_armado' };
  var TIERCODE = { p: 'principal', s: 'sensibilidade' };

  var DATA = [[30.0,30.6,"r","p","Backes et al., 2022"],[26.91,379.4,"s","p","Chippagiri et al., 2023"],[29.34,379.22,"r","p","Ankur & Singh, 2024"],[26.03,303.06,"r","p","Ankur & Singh, 2024"],[20.6,188.66,"o","p","Coelho, 2016"],[22.56,549.61,"o","p","Coelho, 2016"],[42.0,117.01,"o","p","Coelho, 2016"],[39.83,539.07,"o","p","Coelho, 2016"],[58.0,124.49,"o","p","Coelho, 2016"],[64.27,582.31,"o","p","Coelho, 2016"],[30.0,364.19,"g","p","Cong et al., 2024"],[30.0,19.94,"g","p","Cong et al., 2024"],[40.0,351.5,"g","p","Cong et al., 2024"],[50.0,375.09,"g","p","Cong et al., 2024"],[36.0,405.2,"s","p","Cordoba & Irassar, 2023"],[35.0,368.1,"o","p","Cordoba & Irassar, 2023"],[35.0,349.5,"o","p","Cordoba & Irassar, 2023"],[35.0,344.2,"o","p","Cordoba & Irassar, 2023"],[37.0,341.1,"o","p","Cordoba & Irassar, 2023"],[37.0,318.7,"s","p","Cordoba & Irassar, 2023"],[37.0,321.7,"o","p","Cordoba & Irassar, 2023"],[35.0,314.2,"o","p","Cordoba & Irassar, 2023"],[35.0,300.1,"o","p","Cordoba & Irassar, 2023"],[25.0,380.2,"s","p","Cordoba & Irassar, 2023"],[25.0,345.3,"o","p","Cordoba & Irassar, 2023"],[25.0,343.4,"o","p","Cordoba & Irassar, 2023"],[30.0,322.7,"o","p","Cordoba & Irassar, 2023"],[25.0,323.8,"o","p","Cordoba & Irassar, 2023"],[35.0,345.1,"o","p","Cordoba & Irassar, 2023"],[35.0,337.6,"o","p","Cordoba & Irassar, 2023"],[41.0,363.8,"o","p","Cordoba & Irassar, 2023"],[45.0,376.8,"o","p","Cordoba & Irassar, 2023"],[30.0,478.3,"o","p","Corti & Muciaccia, 2023"],[43.0,-136.25,"s","p","Di Maria et al., 2020"],[43.0,-245.0,"s","p","Di Maria et al., 2020"],[43.0,-170.0,"s","p","Di Maria et al., 2020"],[21.0,292.0,"o","p","Dong et al., 2021"],[35.0,397.0,"o","p","Dong et al., 2021"],[120.0,1134.0,"u","p","Farahzadi et al., 2025"],[120.0,910.0,"u","p","Farahzadi et al., 2025"],[120.0,898.0,"u","p","Farahzadi et al., 2025"],[120.0,887.0,"u","p","Farahzadi et al., 2025"],[120.0,827.0,"u","p","Farahzadi et al., 2025"],[120.0,675.0,"u","p","Farahzadi et al., 2025"],[30.0,631.4,"o","p","Ferreira et al., 2023"],[33.9,380.0,"o","p","Habibi et al., 2024"],[33.4,297.0,"r","p","Habibi et al., 2024"],[40.0,292.8,"s","p","Hafez et al., 2024"],[40.0,357.2,"s","p","Hafez et al., 2024"],[40.0,186.23,"s","p","Hafez et al., 2024"],[40.0,249.82,"s","p","Hafez et al., 2024"],[86.3,1100.0,"u","p","Choi et al., 2023"],[90.1,1170.0,"u","p","Choi et al., 2023"],[23.07,93.5,"g","p","Sposito, 2024"],[97.21,112.0,"g","p","Sposito, 2024"],[24.0,309.0,"o","p","Kim & Tae, 2016"],[24.0,342.28,"s","p","Kim et al., 2016"],[24.0,315.94,"s","p","Kim et al., 2016"],[24.0,314.57,"s","p","Kim et al., 2016"],[24.0,263.24,"s","p","Kim et al., 2016"],[24.0,259.14,"s","p","Kim et al., 2016"],[44.17,156.2,"r","p","Li et al., 2024"],[33.0,359.99,"r","p","Manan et al., 2025"],[40.0,32.24,"o","p","Martinez-Munoz et al., 2022"],[60.0,351.76,"r","p","Menegatti et al., 2022"],[60.0,352.43,"r","p","Menegatti et al., 2022"],[26.1,807.0,"g","p","Mir et al., 2022"],[30.0,1800.98,"g","p","Mir et al., 2022"],[56.5,1631.9,"g","p","Mir et al., 2022"],[52.3,1811.14,"g","p","Mir et al., 2022"],[124.1,410.0,"u","s","Nassar et al., 2025"],[121.3,399.0,"u","s","Nassar et al., 2025"],[98.2,362.0,"u","s","Nassar et al., 2025"],[123.4,414.0,"u","s","Nassar et al., 2025"],[115.2,387.0,"u","s","Nassar et al., 2025"],[48.41,574.03,"s","p","Onn et al., 2019"],[35.61,209.0,"s","p","Onn et al., 2019"],[38.29,573.21,"s","p","Onn et al., 2019"],[26.05,207.0,"s","p","Onn et al., 2019"],[25.0,420.0,"o","s","Paik et al., 2019"],[25.0,420.0,"o","s","Paik et al., 2019"],[24.0,420.0,"o","s","Paik & Na, 2019"],[24.0,420.0,"o","s","Paik & Na, 2019"],[24.0,432.0,"o","s","Paik & Na, 2019"],[24.0,429.4,"o","s","Paik & Na, 2019"],[24.0,427.0,"o","s","Paik & Na, 2019"],[49.5,352.65,"r","p","Pavlu et al., 2019"],[25.0,477.4,"o","p","Pedroso et al., 2024"],[25.0,483.1,"o","p","Pedroso et al., 2024"],[20.0,672.0,"o","p","Pujadas-Gispert et al., 2021"],[35.0,494.0,"o","p","Sanchez-Pantoja et al., 2023"],[40.0,248.95,"s","p","Sandagomika et al., 2024"],[25.0,391.3,"o","p","Sbahieh et al., 2023"],[58.1,518.0,"o","p","Soltanzadeh et al., 2022"],[55.54,491.0,"r","p","Soltanzadeh et al., 2022"],[55.12,482.0,"r","p","Soltanzadeh et al., 2022"],[52.03,466.0,"r","p","Soltanzadeh et al., 2022"],[20.0,261.7,"o","p","Sombrio, 2015"],[71.07,452.0,"r","s","Starczyk-Kolbyk, 2024"],[71.9,318.0,"s","p","Teply et al., 2018"],[47.2,312.0,"s","p","Teply et al., 2018"],[70.5,344.0,"s","p","Teply et al., 2018"],[30.0,270.88,"o","p","De Paula Filho et al., 2023"],[40.0,355.83,"o","p","De Paula Filho et al., 2023"],[50.0,429.0,"o","p","De Paula Filho et al., 2023"],[150.0,700.0,"u","s","Rai & Wille, 2025"],[150.0,743.0,"u","s","Rai & Wille, 2025"],[150.0,610.0,"u","s","Rai & Wille, 2025"],[30.0,246.0,"o","s","Simões et al., 2021"],[30.0,244.0,"o","s","Simões et al., 2021"],[25.0,269.0,"s","s","Zhang et al., 2018"],[35.0,306.0,"s","s","Zhang et al., 2018"],[45.0,344.0,"s","s","Zhang et al., 2018"],[80.0,284.0,"s","s","Zhang et al., 2018"],[90.0,317.0,"s","s","Zhang et al., 2018"],[100.0,350.0,"s","s","Zhang et al., 2018"],[160.0,482.0,"u","s","Zhang et al., 2018"],[170.0,511.0,"u","s","Zhang et al., 2018"],[180.0,539.0,"u","s","Zhang et al., 2018"],[55.0,480.0,"s","p","Cunningham et al., 2025"],[53.9,569.0,"s","p","Celik et al., 2015"],[43.2,487.0,"s","p","Celik et al., 2015"],[33.6,434.0,"s","p","Celik et al., 2015"],[51.0,412.0,"s","p","Celik et al., 2015"],[41.6,311.0,"s","p","Celik et al., 2015"],[37.5,333.0,"s","p","Celik et al., 2015"],[33.9,282.0,"s","p","Celik et al., 2015"],[26.0,232.0,"s","p","Celik et al., 2015"],[20.6,183.0,"s","p","Celik et al., 2015"],[36.3,332.0,"s","p","Celik et al., 2015"],[31.5,281.0,"s","p","Celik et al., 2015"],[28.9,231.0,"s","p","Celik et al., 2015"],[20.6,182.0,"s","p","Celik et al., 2015"],[31.7,242.0,"s","p","Jin et al., 2025"],[34.0,267.0,"s","p","Jin et al., 2025"],[34.5,276.0,"s","p","Jin et al., 2025"],[37.2,279.0,"s","p","Jin et al., 2025"],[38.4,298.0,"s","p","Jin et al., 2025"],[43.5,283.0,"s","p","Jin et al., 2025"],[46.2,300.0,"s","p","Jin et al., 2025"],[46.3,303.0,"s","p","Jin et al., 2025"],[42.1,261.0,"s","p","Jin et al., 2025"],[40.0,270.0,"s","p","Jin et al., 2025"],[40.0,280.0,"s","p","Jin et al., 2025"],[40.2,286.0,"s","p","Jin et al., 2025"],[32.4,399.8,"s","p","Cordoba et al., 2023"],[37.4,350.2,"s","p","Cordoba et al., 2023"],[28.3,355.8,"s","p","Cordoba et al., 2023"],[47.1,378.6,"s","p","Cordoba et al., 2023"],[38.5,322.0,"s","p","Cordoba et al., 2023"],[28.0,279.5,"s","p","Cordoba et al., 2023"],[45.0,380.6,"s","p","Cordoba et al., 2023"],[35.4,323.5,"s","p","Cordoba et al., 2023"],[23.1,280.7,"s","p","Cordoba et al., 2023"],[32.8,322.6,"s","p","Cordoba et al., 2023"],[32.6,341.7,"s","p","Cordoba et al., 2023"],[34.1,350.5,"s","p","Cordoba et al., 2023"],[40.0,395.0,"g","s","Alsalman et al., 2021"],[40.0,222.0,"g","s","Alsalman et al., 2021"],[65.0,435.0,"g","s","Alsalman et al., 2021"],[58.5,512.0,"g","s","Alsalman et al., 2021"],[105.0,247.0,"g","s","Alsalman et al., 2021"],[106.0,174.0,"g","s","Alsalman et al., 2021"],[102.0,639.0,"g","s","Alsalman et al., 2021"],[94.0,553.0,"g","p","Grengg et al., 2024"],[35.9,295.0,"o","p","Abu-Ennab et al., 2022"],[30.12,307.74,"r","p","Sharma & Singh, 2023"],[51.0,273.81,"s","p","Thorne et al., 2024"],[33.6,287.9,"s","p","Thorne et al., 2024"],[53.9,500.0,"s","p","Thorne et al., 2024"],[38.72,1200.0,"o","p","Du et al., 2024"],[21.1,603.44,"s","p","Du et al., 2024"],[22.0,488.0,"g","p","Khan et al., 2023"],[24.9,595.6,"g","p","Khan et al., 2023"],[20.0,328.0,"g","s","Luca et al., 2023"],[25.0,613.0,"u","p","Galan-Marin et al., 2015"],[69.0,345.0,"s","p","Nath et al., 2018"],[73.0,269.0,"s","p","Nath et al., 2018"],[66.0,269.0,"s","p","Nath et al., 2018"],[45.0,694.0,"s","p","Souto-Martinez et al., 2018"],[25.0,475.2,"o","s","Moncaster et al., 2018"],[40.0,432.0,"o","s","Moncaster et al., 2018"],[27.0,258.58,"o","p","Oh et al., 2023"],[35.0,382.4,"o","p","Zhao et al., 2021"],[40.0,334.2,"o","p","Zhao et al., 2021"],[32.9,413.83,"o","p","Di Sarno et al., 2024"],[31.8,348.09,"o","p","Di Sarno et al., 2024"],[33.0,175.0,"s","p","Grist et al., 2015"],[33.0,135.0,"s","p","Grist et al., 2015"],[33.0,95.0,"s","p","Grist et al., 2015"],[33.0,265.0,"s","p","Grist et al., 2015"],[33.0,160.0,"s","p","Grist et al., 2015"],[49.0,195.0,"s","p","Grist et al., 2015"],[49.0,345.0,"s","p","Grist et al., 2015"],[49.0,235.0,"s","p","Grist et al., 2015"],[40.5,260.4,"o","p","Marinkovic et al., 2017"],[42.0,197.1,"s","p","Marinkovic et al., 2017"],[40.7,134.2,"s","p","Marinkovic et al., 2017"],[42.1,266.3,"r","p","Marinkovic et al., 2017"],[40.5,196.5,"r","p","Marinkovic et al., 2017"],[50.0,345.0,"g","p","Teh et al., 2017"],[50.0,291.0,"g","p","Teh et al., 2017"],[50.0,508.9,"g","p","Teh et al., 2017"],[21.0,174.8,"s","p","DeRousseau et al., 2020"],[21.0,144.8,"s","p","DeRousseau et al., 2020"],[25.0,572.0,"o","p","Haigh et al., 2024"],[20.0,1023.0,"r","p","Haigh et al., 2024"],[21.0,997.0,"r","p","Haigh et al., 2024"],[29.5,92.15,"g","s","Gopalakrishna & Dinakar, 2024"],[25.93,234.0,"r","s","Momotaz et al., 2023"],[27.85,238.0,"r","s","Momotaz et al., 2023"],[25.23,244.0,"r","s","Momotaz et al., 2023"],[27.68,236.0,"r","s","Momotaz et al., 2023"],[27.33,228.0,"r","s","Momotaz et al., 2023"],[26.55,65.7,"r","s","Momotaz et al., 2023"],[28.15,88.3,"r","s","Momotaz et al., 2023"],[28.51,109.0,"r","s","Momotaz et al., 2023"],[27.72,110.0,"r","s","Momotaz et al., 2023"],[28.12,111.0,"r","s","Momotaz et al., 2023"],[31.1,356.0,"s","p","Bayat et al., 2024"],[32.8,352.0,"s","p","Bayat et al., 2024"],[50.0,475.0,"g","p","Aygun & Uysal, 2025"],[62.45,611.86,"o","s","Celikten & Baran, 2024"],[62.95,582.59,"r","s","Celikten & Baran, 2024"],[63.55,553.32,"r","s","Celikten & Baran, 2024"],[68.65,524.04,"r","s","Celikten & Baran, 2024"],[59.8,494.77,"r","s","Celikten & Baran, 2024"],[57.85,465.5,"r","s","Celikten & Baran, 2024"],[20.0,113.3,"s","s","Hafez et al., 2023"],[30.0,132.6,"o","s","Hafez et al., 2023"],[40.0,137.3,"o","s","Hafez et al., 2023"],[50.0,155.2,"o","s","Hafez et al., 2023"],[60.0,163.0,"o","s","Hafez et al., 2023"],[70.0,173.6,"o","s","Hafez et al., 2023"],[80.0,201.4,"o","s","Hafez et al., 2023"],[143.0,709.9,"u","p","Joachim & Oettel, 2024"],[133.6,914.72,"u","p","Joachim & Oettel, 2024"],[114.4,713.7,"u","p","Joachim & Oettel, 2024"],[106.4,716.65,"u","p","Joachim & Oettel, 2024"],[105.2,715.48,"u","p","Joachim & Oettel, 2024"],[36.08,365.87,"s","s","Raveendran & Krishnan, 2025"],[41.0,366.14,"s","s","Raveendran & Krishnan, 2025"],[43.28,366.4,"s","s","Raveendran & Krishnan, 2025"],[40.0,366.67,"s","s","Raveendran & Krishnan, 2025"],[38.5,356.35,"s","s","Raveendran & Krishnan, 2025"],[41.02,340.41,"s","s","Raveendran & Krishnan, 2025"],[33.64,330.0,"s","s","Raveendran & Krishnan, 2025"],[49.02,341.11,"s","s","Raveendran & Krishnan, 2025"],[20.0,228.76,"o","s","Xu et al., 2024"],[25.0,250.76,"o","s","Xu et al., 2024"],[30.0,280.03,"o","s","Xu et al., 2024"],[40.0,280.07,"o","s","Xu et al., 2024"],[50.0,371.66,"o","s","Xu et al., 2024"],[35.0,405.8,"r","p","Yu et al., 2024"],[35.1,412.4,"r","p","Yu et al., 2024"],[35.0,411.6,"r","p","Yu et al., 2024"],[35.0,411.4,"r","p","Yu et al., 2024"],[35.0,411.6,"r","p","Yu et al., 2024"],[35.0,402.1,"r","p","Yu et al., 2024"],[35.1,395.1,"r","p","Yu et al., 2024"],[35.1,390.3,"r","p","Yu et al., 2024"],[35.0,385.4,"r","p","Yu et al., 2024"],[41.51,273.38,"r","s","Badgujar, 2023"],[39.24,271.45,"r","s","Badgujar, 2023"],[41.36,270.48,"r","s","Badgujar, 2023"],[43.29,269.51,"r","s","Badgujar, 2023"],[40.86,268.54,"r","s","Badgujar, 2023"],[38.29,267.57,"r","s","Badgujar, 2023"],[20.0,369.0,"o","p","Rondinel-Oviedo, 2024"],[35.0,466.4,"o","p","Horakova et al., 2019"],[90.0,656.3,"o","p","Horakova et al., 2019"],[90.0,594.2,"o","p","Horakova et al., 2019"],[36.6,280.1,"r","p","Pesta et al., 2019"],[25.4,271.1,"r","p","Pesta et al., 2019"],[29.3,278.5,"r","p","Pesta et al., 2019"],[37.8,254.2,"r","p","Pesta et al., 2019"],[35.0,263.9,"r","p","Pesta et al., 2019"],[32.2,304.4,"r","p","Pesta et al., 2019"],[20.0,239.19,"o","p","Lu et al., 2019"],[30.0,346.95,"o","p","Lu et al., 2019"],[20.3,221.0,"o","p","Coral et al., 2025"],[25.0,463.1,"o","p","Salandin et al., 2022"],[27.6,313.72,"o","p","Acosta-Calderon et al., 2022"],[29.3,313.74,"b","p","Acosta-Calderon et al., 2022"],[27.2,315.08,"o","p","Acosta-Calderon et al., 2022"],[30.0,295.0,"o","p","Wang et al., 2020"],[140.0,600.0,"g","s","Eltantawi et al., 2024"],[132.7,360.0,"g","s","Eltantawi et al., 2024"],[39.11,350.0,"g","s","Kanagaraj et al., 2022"],[20.0,255.0,"o","p","Abouhamad & Abu-Hamd, 2021"],[30.0,335.0,"o","p","Abouhamad & Abu-Hamd, 2021"],[46.48,695.3,"r","s","Zhu et al., 2023"],[43.86,694.6,"r","s","Zhu et al., 2023"],[36.22,693.3,"r","s","Zhu et al., 2023"],[30.48,693.2,"r","s","Zhu et al., 2023"],[25.87,691.8,"r","s","Zhu et al., 2023"],[25.0,231.4,"o","s","Momotaz et al., 2022"],[25.0,65.0,"r","s","Momotaz et al., 2022"],[25.0,225.6,"r","s","Momotaz et al., 2022"],[25.0,109.8,"r","s","Momotaz et al., 2022"],[25.0,0.08,"o","p","Huber et al., 2024"],[30.0,0.09,"o","p","Huber et al., 2024"],[30.0,321.3,"o","s","Zheng et al., 2023"],[52.1,3060.0,"l","p","Sinka et al., 2020"],[75.2,1550.0,"l","p","Sinka et al., 2020"],[88.6,1030.0,"l","p","Sinka et al., 2020"],[42.25,437.0,"o","p","Islam et al., 2024"],[33.8,366.0,"r","p","Islam et al., 2024"],[48.25,419.0,"o","p","Islam et al., 2024"],[20.0,247.69,"o","p","Huang et al., 2016"],[25.0,267.69,"o","p","Huang et al., 2016"],[30.0,287.69,"o","p","Huang et al., 2016"],[35.0,307.69,"o","p","Huang et al., 2016"],[40.0,327.69,"o","p","Huang et al., 2016"],[50.0,367.69,"o","p","Huang et al., 2016"],[25.0,525.0,"o","p","Dervishaj et al., 2024"],[25.0,525.8,"o","p","Dervishaj et al., 2024"],[32.0,420.0,"r","p","D'Orazio et al., 2023"],[32.0,310.0,"r","p","D'Orazio et al., 2023"],[25.0,420.0,"r","p","D'Orazio et al., 2023"],[25.0,385.0,"r","p","D'Orazio et al., 2023"],[58.0,791.67,"o","p","Haverkamp et al., 2025"],[21.0,409.0,"o","s","Jang et al., 2022"],[21.0,419.0,"o","s","Jang et al., 2022"],[24.0,414.0,"o","s","Jang et al., 2022"],[24.0,420.0,"o","s","Jang et al., 2022"],[24.0,414.0,"o","s","Jang et al., 2022"],[30.0,230.0,"o","p","Jayasinghe et al., 2021"],[32.0,240.0,"o","p","Jayasinghe et al., 2021"],[24.0,299.0,"o","p","Kim & Chae, 2016"],[24.0,331.0,"s","p","Kim & Chae, 2016"],[24.0,300.0,"s","p","Kim & Chae, 2016"],[24.0,269.0,"s","p","Kim & Chae, 2016"],[24.0,239.0,"s","p","Kim & Chae, 2016"],[24.0,340.9,"o","p","Kim et al., 2016"],[24.0,225.7,"o","p","Kim et al., 2016"],[30.0,134.59,"o","p","Kim et al., 2016"],[30.0,247.83,"o","p","Kim et al., 2016"],[45.5,178.7,"g","p","Kul et al., 2023"],[66.2,251.4,"g","p","Kul et al., 2023"],[61.9,302.8,"g","p","Kul et al., 2023"],[51.1,258.9,"g","p","Li et al., 2024"],[51.1,469.3,"g","p","Li et al., 2024"],[36.21,362.02,"r","s","Li et al., 2024"],[33.42,361.71,"r","s","Li et al., 2024"],[26.81,361.39,"r","s","Li et al., 2024"],[25.54,360.88,"r","s","Li et al., 2024"],[23.51,360.51,"r","s","Li et al., 2024"],[40.56,362.79,"r","s","Li et al., 2024"],[37.43,362.48,"r","s","Li et al., 2024"],[29.2,362.16,"r","s","Li et al., 2024"],[27.61,361.65,"r","s","Li et al., 2024"],[26.12,361.28,"r","s","Li et al., 2024"],[42.22,363.17,"r","s","Li et al., 2024"],[39.23,362.86,"r","s","Li et al., 2024"],[30.28,362.55,"r","s","Li et al., 2024"],[28.21,362.04,"r","s","Li et al., 2024"],[26.92,361.66,"r","s","Li et al., 2024"],[20.0,208.98,"o","p","Li et al., 2024"],[25.0,247.46,"o","p","Li et al., 2024"],[30.0,277.82,"o","p","Li et al., 2024"],[35.0,314.77,"o","p","Li et al., 2024"],[40.0,348.04,"o","p","Li et al., 2024"],[45.0,390.16,"o","p","Li et al., 2024"],[30.0,270.88,"o","p","Matias de Paula Filho et al., 2024"],[40.0,355.83,"o","p","Matias de Paula Filho et al., 2024"],[50.0,429.0,"o","p","Matias de Paula Filho et al., 2024"],[32.0,339.0,"o","p","Tait & Cheung, 2016"],[32.0,227.0,"s","p","Tait & Cheung, 2016"],[32.0,127.0,"s","p","Tait & Cheung, 2016"],[45.0,468.22,"o","p","Zhang et al., 2023"],[38.35,488.0,"r","p","Zheng et al., 2025"],[36.91,486.0,"r","p","Zheng et al., 2025"],[33.0,485.0,"r","p","Zheng et al., 2025"],[31.75,483.0,"r","p","Zheng et al., 2025"],[32.13,473.0,"r","p","Zheng et al., 2025"],[28.11,471.0,"r","p","Zheng et al., 2025"],[26.95,470.0,"r","p","Zheng et al., 2025"],[26.72,467.0,"r","p","Zheng et al., 2025"],[26.04,468.0,"r","p","Zheng et al., 2025"],[25.22,466.0,"r","p","Zheng et al., 2025"],[25.37,465.0,"r","p","Zheng et al., 2025"],[22.15,462.0,"r","p","Zheng et al., 2025"],[27.58,435.0,"s","p","Oliveira, 2007"],[27.58,528.52,"s","p","Oliveira, 2007"],[27.58,385.47,"s","p","Oliveira, 2007"],[27.58,442.08,"s","p","Oliveira, 2007"],[27.58,537.33,"s","p","Oliveira, 2007"],[27.58,404.88,"s","p","Oliveira, 2007"],[52.0,314.0,"g","p","Almeida, 2024"],[52.0,161.0,"g","p","Almeida, 2024"],[52.0,281.0,"g","p","Almeida, 2024"],[52.0,202.0,"g","p","Almeida, 2024"],[52.0,317.0,"g","p","Almeida, 2024"],[58.0,252.0,"g","p","Almeida, 2024"],[58.0,232.0,"g","p","Almeida, 2024"],[58.0,283.0,"g","p","Almeida, 2024"],[58.0,235.0,"g","p","Almeida, 2024"],[58.0,370.0,"g","p","Almeida, 2024"],[50.0,133.0,"g","p","Almeida, 2024"],[50.0,137.0,"g","p","Almeida, 2024"],[50.0,200.0,"g","p","Almeida, 2024"],[50.0,145.0,"g","p","Almeida, 2024"],[50.0,312.0,"g","p","Almeida, 2024"],[52.0,301.0,"g","p","Almeida, 2024"],[52.0,306.0,"g","p","Almeida, 2024"],[52.0,312.0,"g","p","Almeida, 2024"],[52.0,316.0,"g","p","Almeida, 2024"],[52.0,406.0,"g","p","Almeida, 2024"],[51.0,353.0,"g","p","Almeida, 2024"],[51.0,359.0,"g","p","Almeida, 2024"],[51.0,365.0,"g","p","Almeida, 2024"],[51.0,369.0,"g","p","Almeida, 2024"],[51.0,473.0,"g","p","Almeida, 2024"],[35.0,502.18,"o","p","Rigon, 2015"],[35.0,381.88,"s","p","Rigon, 2015"],[35.0,545.4,"o","p","Rigon, 2015"],[35.0,503.48,"s","p","Rigon, 2015"],[24.4,1308.47,"s","p","Sposito, 2024"],[26.3,1154.5,"s","p","Sposito, 2024"],[25.0,248.8,"o","p","Boros, 2023"],[30.0,347.6,"o","s","Asensio et al., 2023"],[35.0,415.9,"o","s","Asensio et al., 2023"],[60.0,1029.5,"o","s","Asensio et al., 2023"],[78.0,983.0,"o","p","Jones & Li, 2024"],[35.0,405.0,"o","p","Jones & Li, 2024"],[28.7,45.9,"r","p","Younes et al., 2024"],[27.0,29.4,"r","p","Younes et al., 2024"],[25.0,366.3,"o","p","Abdelaal et al., 2024"],[25.0,304.4,"s","p","Abdelaal et al., 2024"],[25.0,230.3,"s","p","Abdelaal et al., 2024"],[61.0,484.6,"r","p","Gillani et al., 2023"],[65.0,484.6,"r","p","Gillani et al., 2023"],[60.0,565.0,"r","p","Gillani et al., 2023"],[65.0,628.5,"o","p","Ali et al., 2023"],[51.5,358.4,"s","s","Kina, 2024"],[52.6,361.8,"s","s","Kina, 2024"],[20.0,320.52,"o","s","Yu et al., 2020"],[25.0,358.56,"o","s","Yu et al., 2020"],[32.0,412.06,"o","s","Yu et al., 2020"],[40.0,496.12,"o","s","Yu et al., 2020"],[50.0,628.04,"o","s","Yu et al., 2020"],[65.0,797.69,"o","s","Yu et al., 2020"],[35.0,314.0,"o","p","Zieger et al., 2020"],[50.0,109.95,"g","p","Sandanayake et al., 2022"],[20.0,250.0,"o","p","Li et al., 2023"],[25.0,267.7,"o","p","Li et al., 2023"],[30.0,287.7,"o","p","Li et al., 2023"],[35.0,307.7,"o","p","Li et al., 2023"],[40.0,327.7,"o","p","Li et al., 2023"],[50.0,367.7,"o","p","Li et al., 2023"],[30.0,450.0,"u","p","Habert et al., 2013"],[45.0,330.0,"o","p","Van den Heede et al., 2018"],[40.0,310.0,"o","p","Van den Heede et al., 2018"],[50.0,445.23,"g","p","Garces et al., 2022"],[50.0,344.75,"g","p","Garces et al., 2022"],[50.0,333.93,"g","p","Garces et al., 2022"],[50.0,380.43,"g","p","Garces et al., 2022"],[50.0,369.62,"g","p","Garces et al., 2022"],[42.6,0.4,"g","p","Tefa et al., 2025"],[50.0,454.59,"g","p","Garces et al., 2021"],[30.0,467.19,"o","p","Menna Barreto et al., 2021"],[1.0,35.0,"g","p","Hussain et al., 2025"],[35.2,403.0,"r","p","Jimenez et al., 2015"],[180.0,566.0,"s","p","Teixeira et al., 2019"],[25.0,353.0,"s","p","Oyebisi & Alomayri, 2022"],[30.0,398.0,"s","p","Oyebisi & Alomayri, 2022"],[40.0,511.0,"s","p","Oyebisi & Alomayri, 2022"],[134.2,1046.0,"u","s","Guo et al., 2023"],[127.6,771.0,"u","s","Guo et al., 2023"],[118.3,656.0,"u","s","Guo et al., 2023"],[28.0,331.36,"o","p","Lorika et al., 2023"],[29.1,298.84,"b","p","Lorika et al., 2023"],[46.5,356.0,"g","p","Kanagaraj et al., 2023"],[79.9,373.0,"g","p","Kanagaraj et al., 2023"],[47.2,313.0,"g","p","Kanagaraj et al., 2023"],[76.82,346.0,"g","p","Kanagaraj et al., 2023"],[48.25,183.0,"g","p","Kanagaraj et al., 2023"],[79.9,268.0,"g","p","Kanagaraj et al., 2023"],[24.2,270.0,"r","p","Los Santos-Ortega et al., 2023"],[20.04,292.0,"r","p","Los Santos-Ortega et al., 2023"],[52.9,253.0,"r","s","Mahdi et al., 2023"],[29.8,267.0,"r","s","Mahdi et al., 2023"],[20.7,268.0,"r","s","Mahdi et al., 2023"],[28.6,813.06,"g","p","Gholampour et al., 2025"],[44.1,848.53,"g","p","Gholampour et al., 2025"],[62.9,914.0,"g","p","Gholampour et al., 2025"],[30.6,923.63,"g","p","Gholampour et al., 2025"],[47.5,959.11,"g","p","Gholampour et al., 2025"],[65.6,1024.57,"g","p","Gholampour et al., 2025"],[60.37,3.26,"g","s","Raj R et al., 2025"],[59.23,511.0,"s","p","Hossain et al., 2021"],[63.0,446.0,"s","p","Hossain et al., 2021"],[64.37,366.0,"s","p","Hossain et al., 2021"],[70.7,429.0,"s","p","Hossain et al., 2021"],[64.8,385.0,"s","p","Hossain et al., 2021"],[21.94,559.69,"g","p","Luo et al., 2021"],[50.13,483.25,"g","p","Luo et al., 2021"],[23.0,612.9,"g","s","Damrongwiriyanupap et al., 2022"],[46.0,612.92,"g","s","Damrongwiriyanupap et al., 2022"],[21.0,385.59,"o","s","Garcia-Troncoso et al., 2022"],[31.0,365.71,"r","p","Goh et al., 2022"],[37.5,361.1,"r","p","Goh et al., 2022"],[52.0,278.68,"r","p","Goh et al., 2022"],[35.0,287.32,"g","p","Goh et al., 2022"],[53.5,440.5,"r","s","Yu et al., 2022"],[44.3,411.6,"r","s","Yu et al., 2022"],[48.3,543.6,"r","s","Yu et al., 2022"],[23.0,248.3,"r","s","Yu et al., 2022"],[52.4,422.3,"r","s","Yu et al., 2022"],[32.0,334.58,"s","p","Bediako & Valentini, 2022"],[110.02,988.0,"u","s","Abdellatief et al., 2023"],[89.9,623.0,"u","s","Abdellatief et al., 2023"],[108.95,767.0,"u","s","Abdellatief et al., 2023"],[25.0,207.5,"s","s","Shobeiri et al., 2023"],[47.5,382.3,"o","p","Al Ghali et al., 2023"],[46.22,499.28,"r","s","Vembu & Ammasi, 2024"],[50.89,402.8,"r","s","Vembu & Ammasi, 2024"],[30.1,266.59,"s","s","Yahyaee & Elize, 2024"],[36.4,334.72,"s","s","Yahyaee & Elize, 2024"],[31.85,439.26,"s","s","Yahyaee & Elize, 2024"],[92.36,1318.0,"s","s","Zhang et al., 2024"],[107.14,1120.0,"s","s","Zhang et al., 2024"],[98.29,715.0,"s","s","Zhang et al., 2024"],[50.0,294.0,"r","p","Dacic et al., 2024"],[1.0,1.0,"r","p","Manan et al., 2024"],[67.0,195.0,"s","p","Sun et al., 2025"],[30.0,262.61,"s","p","Lin et al., 2025"],[65.0,611.7,"s","p","Jiang et al., 2025"],[47.0,231.2,"g","s","Kanagaraj et al., 2023"],[30.0,30.0,"s","s","Meng et al., 2023"],[35.0,453.3,"o","p","Justo-Reinoso et al., 2023"],[206.9,824.0,"u","p","Kang et al., 2024"],[35.0,313.4,"r","p","Huang et al., 2025"],[35.0,295.6,"r","p","Huang et al., 2025"],[35.0,279.4,"r","p","Huang et al., 2025"],[35.0,263.5,"r","p","Huang et al., 2025"],[35.0,245.5,"r","p","Huang et al., 2025"],[30.0,291.0,"o","p","Skullestad et al., 2016"],[45.0,326.0,"o","p","Skullestad et al., 2016"],[36.6,323.0,"o","p","Sabau et al., 2021"],[36.3,296.0,"s","p","Sabau et al., 2021"],[36.5,306.0,"r","p","Sabau et al., 2021"],[28.0,466.77,"o","p","Yaseen et al., 2024"],[30.0,254.4,"o","s","Almulhim et al., 2024"],[66.8,121.77,"s","p","Espuelas et al., 2018"],[61.0,132.25,"s","p","Espuelas et al., 2018"],[62.1,143.41,"s","p","Espuelas et al., 2018"],[52.7,86.32,"l","p","Espuelas et al., 2018"],[54.2,97.65,"l","p","Espuelas et al., 2018"],[56.8,109.09,"l","p","Espuelas et al., 2018"],[38.0,334.4,"g","p","Abdulkareem et al., 2019"],[38.0,418.0,"g","p","Abdulkareem et al., 2019"],[38.0,167.2,"g","p","Abdulkareem et al., 2019"],[38.0,167.2,"g","p","Abdulkareem et al., 2019"],[38.0,167.2,"g","p","Abdulkareem et al., 2019"],[30.0,232.0,"o","p","Stoiber et al., 2021"],[50.0,335.0,"o","p","Stoiber et al., 2021"],[70.0,431.0,"o","p","Stoiber et al., 2021"],[43.5,535.8,"g","p","Batuecas et al., 2021"],[110.0,-406.02,"g","p","Batuecas et al., 2021"],[30.0,-253.27,"g","p","Batuecas et al., 2021"],[30.2,469.8,"r","s","Li et al., 2022"],[30.0,370.37,"o","s","Li et al., 2022"],[25.0,446.0,"o","p","Sandanayake et al., 2022"],[30.0,279.21,"o","p","Negrin et al., 2023"],[35.0,305.96,"o","p","Negrin et al., 2023"],[40.0,307.06,"o","p","Negrin et al., 2023"],[45.0,307.06,"o","p","Negrin et al., 2023"],[21.0,297.0,"g","p","Huang & Wang, 2024"],[50.46,285.5,"r","p","Manso-Morato et al., 2025"],[167.0,703.15,"u","p","Khan et al., 2024"],[150.0,571.33,"u","p","Khan et al., 2024"],[39.42,397.24,"r","p","Frazao et al., 2022"],[39.42,479.22,"o","p","Frazao et al., 2022"],[40.0,795.0,"o","p","Alali et al., 2024"],[40.2,639.0,"o","s","Teng et al., 2025"],[45.8,581.0,"s","s","Teng et al., 2025"],[44.2,522.0,"s","s","Teng et al., 2025"],[34.2,463.0,"s","s","Teng et al., 2025"],[41.5,415.0,"o","p","Fan et al., 2025"],[21.2,253.0,"g","p","Fan et al., 2025"],[34.7,308.0,"g","p","Fan et al., 2025"],[37.5,353.8,"g","p","Nguyen et al., 2020"],[37.5,284.4,"g","p","Nguyen et al., 2020"],[37.5,288.5,"g","p","Nguyen et al., 2020"],[47.0,903.0,"s","p","Anastasiou et al., 2017"],[51.8,503.0,"s","p","Anastasiou et al., 2017"],[46.2,190.3,"s","p","Kanagaraj et al., 2024"],[37.9,228.0,"o","s","Berndt, 2015"],[52.1,258.0,"o","s","Berndt, 2015"],[44.9,246.0,"o","s","Berndt, 2015"],[43.7,210.0,"r","s","Berndt, 2015"],[40.0,310.0,"r","p","Yazdanbakhsh & Lagouin, 2019"],[40.0,323.0,"r","p","Yazdanbakhsh & Lagouin, 2019"],[25.0,308.0,"r","p","Mostert et al., 2021"],[25.0,315.0,"r","p","Mostert et al., 2021"],[104.7,1194.0,"u","s","Du et al., 2022"],[77.1,942.0,"u","s","Du et al., 2022"],[121.5,687.0,"u","s","Du et al., 2022"],[30.0,360.0,"s","p","Jungclaus et al., 2024"],[45.0,505.0,"s","p","Jungclaus et al., 2024"],[40.0,347.0,"g","p","Alkhawaldeh et al., 2024"],[40.0,169.0,"g","p","Alkhawaldeh et al., 2024"],[40.0,234.0,"g","p","Alkhawaldeh et al., 2024"],[40.0,245.0,"g","p","Alkhawaldeh et al., 2024"],[50.3,502.1,"r","p","Lei et al., 2024"],[48.5,459.6,"r","p","Lei et al., 2024"],[47.2,441.2,"r","p","Lei et al., 2024"],[45.3,422.8,"r","p","Lei et al., 2024"],[25.0,436.32,"o","p","Omar et al., 2014"],[30.0,502.13,"o","p","Omar et al., 2014"],[40.0,525.89,"o","p","Omar et al., 2014"],[25.0,266.25,"s","p","Elliot et al., 2024"],[31.0,251.0,"s","p","Jin et al., 2024"],[25.0,334.0,"o","p","Van Roijen et al., 2025"],[42.0,609.0,"o","p","Baykara et al., 2024"],[42.1,469.8,"s","p","Cunningham et al., 2021"],[40.0,388.0,"o","p","Chen et al., 2023"],[48.28,660.4,"r","p","Ye et al., 2024"],[42.27,669.9,"r","p","Ye et al., 2024"],[131.0,466.83,"b","p","Ye et al., 2024"],[40.0,885.13,"c","p","Ye et al., 2024"],[40.0,318.13,"o","p","Ye et al., 2024"],[96.0,1069.0,"o","s","Mostafaei et al., 2025"],[25.0,688.0,"r","s","Mostafaei et al., 2025"],[45.43,352.0,"r","p","Kadawo et al., 2021"],[42.9,349.0,"r","p","Kadawo et al., 2021"],[35.17,348.0,"r","p","Kadawo et al., 2021"],[56.4,520.0,"s","s","Miller et al., 2015"],[35.0,237.38,"r","p","Rønning et al., 2024"],[35.0,227.67,"r","p","Rønning et al., 2024"],[35.0,217.35,"r","p","Rønning et al., 2024"],[25.0,196.0,"o","p","Silva et al., 2019"],[30.0,220.0,"o","p","Silva et al., 2019"],[35.0,248.0,"o","p","Silva et al., 2019"],[40.0,295.0,"o","p","Silva et al., 2019"],[30.0,1602.0,"u","p","Larsen et al., 2017"],[150.0,2123.8,"u","p","Larsen et al., 2017"],[25.0,362.29,"o","p","Stepanek et al., 2018"],[20.0,289.2,"o","s","Ungureanu & Muntean, 2019"],[52.4,253.0,"o","s","Pavlik et al., 2019"],[29.4,980.0,"u","p","Tran & Tran, 2020"],[25.0,461.3,"o","p","Morsi et al., 2020"],[30.0,303.0,"o","p","Jeong & Park, 2024"],[40.0,242.0,"s","p","Amitani & Miller, 2024"],[40.0,391.0,"s","p","Amitani & Miller, 2024"],[20.0,408.0,"o","p","Neimark et al., 2024"],[32.5,350.7,"r","p","Jiménez et al., 2018"],[31.6,349.9,"r","p","Jiménez et al., 2018"],[30.8,349.0,"r","p","Jiménez et al., 2018"],[29.8,348.2,"r","p","Jiménez et al., 2018"],[29.8,347.4,"r","p","Jiménez et al., 2018"],[23.7,264.7,"r","p","Jiménez et al., 2018"],[23.1,263.9,"r","p","Jiménez et al., 2018"],[22.5,263.0,"r","p","Jiménez et al., 2018"],[21.0,262.2,"r","p","Jiménez et al., 2018"],[104.0,774.0,"s","p","Gursel & Ostertag, 2019"],[35.0,472.0,"o","p","Mirdad et al., 2021"],[50.0,364.0,"g","p","Teh et al., 2018"],[55.0,168.3,"s","p","Lee et al., 2019"],[52.0,771.0,"o","p","Masi et al., 2023"],[34.0,733.0,"r","p","Masi et al., 2023"],[51.6,160.86,"g","s","Jiang et al., 2024"],[50.7,134.08,"g","s","Jiang et al., 2024"],[30.8,241.0,"o","p","Buffenbarger et al., 2023"],[31.8,248.0,"o","p","Buffenbarger et al., 2023"],[32.9,258.0,"o","p","Buffenbarger et al., 2023"],[34.5,271.0,"o","p","Buffenbarger et al., 2023"],[36.2,283.0,"o","p","Buffenbarger et al., 2023"],[39.4,308.0,"o","p","Buffenbarger et al., 2023"],[44.2,346.0,"o","p","Buffenbarger et al., 2023"],[44.4,263.78,"r","s","Zhang et al., 2022"],[30.0,535.0,"s","p","Passuello et al., 2019"],[40.0,418.78,"g","p","Gomes et al., 2019"],[40.0,239.82,"g","p","Gomes et al., 2019"],[27.82,304.9,"o","p","De Azevedo Sampaio et al., 2022"],[28.73,324.0,"r","p","De Azevedo Sampaio et al., 2022"],[25.0,224.6,"o","p","Angelin et al., 2023"],[30.0,347.4,"o","p","Bacelar et al., 2022"],[40.0,388.4,"o","p","Bacelar et al., 2022"],[50.0,424.0,"o","p","Bacelar et al., 2022"],[69.5,146.0,"g","p","Arce et al., 2023"],[40.0,370.0,"s","p","Basavaraj et al., 2023"],[70.0,569.0,"s","p","Sinoh et al., 2021"],[70.0,536.0,"s","p","Sinoh et al., 2021"],[45.0,436.0,"s","p","Sinoh et al., 2021"],[45.0,432.0,"s","p","Sinoh et al., 2021"],[45.0,434.0,"s","p","Sinoh et al., 2021"],[25.0,159.46,"o","s","Mercader Moyano et al., 2019"],[21.0,288.2,"o","p","Restrepo-Ramirez et al., 2024"],[21.0,243.7,"o","p","Restrepo-Ramirez et al., 2024"],[70.2,776.5,"r","s","Nasr et al., 2023"],[71.7,637.4,"r","s","Nasr et al., 2023"],[56.81,418.15,"s","p","Onyelowe et al., 2022"],[176.7,761.0,"g","p","Glanz et al., 2023"],[194.2,496.0,"g","p","Glanz et al., 2023"],[211.8,383.0,"g","p","Glanz et al., 2023"],[20.0,244.75,"o","p","Ranganath et al., 2024"],[24.0,358.0,"r","p","Roh et al., 2020"],[37.48,475.0,"s","p","Guignone et al., 2022"],[36.56,414.0,"r","p","Guignone et al., 2022"],[20.7,320.0,"r","p","Bertoldo et al., 2024"],[25.0,285.02,"o","p","Gao et al., 2024"],[30.0,295.0,"o","p","Gao et al., 2024"],[40.0,321.4,"o","p","Gao et al., 2024"],[50.0,385.0,"o","p","Gao et al., 2024"],[60.0,416.76,"o","p","Gao et al., 2024"],[20.0,304.7,"o","p","Mostafaei et al., 2025"],[30.0,388.7,"o","p","Mostafaei et al., 2025"],[40.0,473.9,"o","p","Mostafaei et al., 2025"],[50.0,560.2,"o","p","Mostafaei et al., 2025"],[56.0,88.7,"o","p","Pushkar, 2019"],[25.0,361.0,"o","s","Thamboo et al., 2021"],[21.0,237.22,"o","p","Petroche & Ramirez, 2022"],[24.0,256.08,"o","p","Petroche & Ramirez, 2022"],[28.0,267.54,"o","p","Petroche & Ramirez, 2022"],[30.0,290.85,"o","p","Petroche & Ramirez, 2022"],[35.0,310.31,"o","p","Petroche & Ramirez, 2022"],[40.0,355.38,"o","p","Petroche & Ramirez, 2022"],[45.0,379.38,"o","p","Petroche & Ramirez, 2022"],[50.0,382.03,"o","p","Petroche & Ramirez, 2022"],[60.0,419.55,"o","p","Petroche & Ramirez, 2022"],[80.0,442.14,"o","p","Petroche & Ramirez, 2022"],[30.0,212.26,"r","p","Hegeir et al., 2022"],[20.7,293.75,"s","p","De Pedro et al., 2023"],[20.0,267.19,"o","p","Mostafaei et al., 2023"],[30.0,332.57,"o","p","Mostafaei et al., 2023"],[40.0,417.82,"o","p","Mostafaei et al., 2023"],[40.0,361.8,"o","p","Huang & Wang, 2023"],[40.0,416.0,"o","p","Almulhim & Al Masmoum, 2024"],[50.0,471.0,"o","p","Almulhim & Al Masmoum, 2024"],[60.0,518.0,"o","p","Almulhim & Al Masmoum, 2024"],[70.0,554.0,"o","p","Almulhim & Al Masmoum, 2024"],[80.0,592.0,"o","p","Almulhim & Al Masmoum, 2024"],[20.0,299.71,"o","p","Tran et al., 2025"],[20.0,268.95,"o","p","Tran et al., 2025"],[35.0,301.8,"o","p","Tran et al., 2025"],[35.0,270.82,"o","p","Tran et al., 2025"],[40.0,302.47,"o","p","Tran et al., 2025"],[40.0,271.42,"o","p","Tran et al., 2025"],[50.0,303.1,"o","p","Tran et al., 2025"],[50.0,271.98,"o","p","Tran et al., 2025"],[65.0,303.45,"o","p","Tran et al., 2025"],[65.0,272.3,"o","p","Tran et al., 2025"],[80.0,304.27,"o","p","Tran et al., 2025"],[80.0,273.03,"o","p","Tran et al., 2025"],[100.0,305.87,"o","p","Tran et al., 2025"],[100.0,274.46,"o","p","Tran et al., 2025"],[23.16,243.5,"g","p","Rojas-Duque et al., 2020"],[21.0,377.8,"g","p","Rojas-Duque et al., 2020"],[28.75,239.0,"o","p","Paula Junior et al., 2021"],[30.0,321.3,"o","s","Xu et al., 2021"],[32.0,412.0,"o","p","Teodosio et al., 2021"],[45.0,498.5,"r","p","Nasr et al., 2023"],[42.0,444.68,"r","p","Nasr et al., 2023"],[38.0,390.87,"r","p","Nasr et al., 2023"],[35.0,337.05,"r","p","Nasr et al., 2023"],[27.0,283.23,"r","p","Nasr et al., 2023"],[20.0,190.0,"o","p","Asdrubali et al., 2025"],[25.0,205.0,"o","p","Asdrubali et al., 2025"],[30.0,205.0,"o","p","Asdrubali et al., 2025"],[37.0,250.0,"o","p","Asdrubali et al., 2025"],[40.0,320.0,"o","p","Asdrubali et al., 2025"],[45.0,325.0,"o","p","Asdrubali et al., 2025"],[50.0,360.0,"o","p","Asdrubali et al., 2025"],[55.0,385.0,"o","p","Asdrubali et al., 2025"],[60.0,250.0,"o","p","Asdrubali et al., 2025"],[75.0,290.0,"o","p","Asdrubali et al., 2025"],[50.0,705.0,"o","p","Zhou et al., 2020"],[40.0,608.0,"o","p","Zhou et al., 2020"],[30.0,565.0,"o","p","Zhou et al., 2020"],[20.0,306.19,"o","s","Hu et al., 2022"],[25.0,336.68,"o","s","Hu et al., 2022"],[30.0,371.65,"o","s","Hu et al., 2022"],[35.0,389.57,"o","s","Hu et al., 2022"],[40.0,419.6,"o","s","Hu et al., 2022"],[50.0,502.82,"o","s","Hu et al., 2022"],[60.0,549.34,"o","s","Hu et al., 2022"],[30.0,157.65,"o","p","Tres Junior et al., 2023"],[30.0,348.76,"o","p","Tres Junior et al., 2023"],[45.0,194.7,"o","p","Tres Junior et al., 2023"],[45.0,381.72,"o","p","Tres Junior et al., 2023"],[50.0,225.78,"o","p","Tres Junior et al., 2023"],[50.0,508.63,"o","p","Tres Junior et al., 2023"],[22.2,659.0,"o","p","Ellingboe et al., 2019"],[83.77,993.61,"s","s","Huang et al., 2024"],[73.64,960.31,"s","s","Huang et al., 2024"],[64.34,920.78,"s","s","Huang et al., 2024"],[54.83,890.24,"s","s","Huang et al., 2024"],[45.0,871.31,"s","s","Huang et al., 2024"],[40.0,1700.0,"s","p","Van Belleghem et al., 2017"],[150.0,940.0,"u","p","Sameer et al., 2019"],[150.0,990.0,"u","p","Sameer et al., 2019"],[35.0,240.0,"u","p","Sameer et al., 2019"],[50.0,290.0,"u","p","Sameer et al., 2019"],[38.01,1539.1,"o","p","Vitale et al., 2021"],[27.76,1351.6,"o","p","Vitale et al., 2021"],[78.18,39.55,"g","p","Faridmehr et al., 2021"],[65.89,36.68,"g","p","Faridmehr et al., 2021"],[80.51,47.05,"g","p","Faridmehr et al., 2021"],[81.7,44.18,"g","p","Faridmehr et al., 2021"],[52.6,41.3,"g","p","Faridmehr et al., 2021"],[80.46,54.55,"g","p","Faridmehr et al., 2021"],[76.9,51.68,"g","p","Faridmehr et al., 2021"],[70.4,48.8,"g","p","Faridmehr et al., 2021"],[46.24,45.93,"g","p","Faridmehr et al., 2021"],[34.53,71.93,"g","p","Faridmehr et al., 2021"],[23.04,64.43,"g","p","Faridmehr et al., 2021"],[45.96,74.8,"g","p","Faridmehr et al., 2021"],[37.8,67.3,"g","p","Faridmehr et al., 2021"],[28.8,59.8,"g","p","Faridmehr et al., 2021"],[55.64,77.68,"g","p","Faridmehr et al., 2021"],[47.1,70.18,"g","p","Faridmehr et al., 2021"],[40.6,62.68,"g","p","Faridmehr et al., 2021"],[36.8,55.18,"g","p","Faridmehr et al., 2021"],[85.09,69.55,"g","p","Faridmehr et al., 2021"],[97.75,74.18,"g","p","Faridmehr et al., 2021"],[86.4,78.8,"g","p","Faridmehr et al., 2021"],[70.53,83.43,"g","p","Faridmehr et al., 2021"],[80.68,62.05,"g","p","Faridmehr et al., 2021"],[72.44,66.68,"g","p","Faridmehr et al., 2021"],[71.93,71.3,"g","p","Faridmehr et al., 2021"],[70.84,75.93,"g","p","Faridmehr et al., 2021"],[70.22,80.55,"g","p","Faridmehr et al., 2021"],[80.46,54.55,"g","p","Faridmehr et al., 2021"],[80.43,59.18,"g","p","Faridmehr et al., 2021"],[67.22,63.8,"g","p","Faridmehr et al., 2021"],[65.14,68.43,"g","p","Faridmehr et al., 2021"],[56.34,73.05,"g","p","Faridmehr et al., 2021"],[55.64,77.68,"g","p","Faridmehr et al., 2021"],[34.02,58.66,"g","p","Faridmehr et al., 2021"],[22.4,51.16,"g","p","Faridmehr et al., 2021"],[68.44,63.43,"g","p","Faridmehr et al., 2021"],[52.08,55.93,"g","p","Faridmehr et al., 2021"],[46.76,48.43,"g","p","Faridmehr et al., 2021"],[74.12,68.2,"g","p","Faridmehr et al., 2021"],[66.19,60.7,"g","p","Faridmehr et al., 2021"],[60.17,53.2,"g","p","Faridmehr et al., 2021"],[56.47,45.7,"g","p","Faridmehr et al., 2021"],[46.1,168.66,"o","p","Koci et al., 2021"],[56.8,168.57,"r","p","Koci et al., 2021"],[54.5,165.68,"r","p","Koci et al., 2021"],[39.2,260.05,"g","p","Shi et al., 2021"],[52.6,271.75,"g","p","Shi et al., 2021"],[58.0,280.2,"g","p","Shi et al., 2021"],[59.1,289.27,"g","p","Shi et al., 2021"],[43.6,283.95,"g","p","Shi et al., 2021"],[64.2,280.65,"g","p","Shi et al., 2021"],[48.6,304.83,"g","p","Shi et al., 2021"],[71.0,300.63,"g","p","Shi et al., 2021"],[37.2,311.71,"g","p","Shi et al., 2021"],[40.8,324.78,"g","p","Shi et al., 2021"],[73.5,305.19,"g","p","Shi et al., 2021"],[76.2,317.88,"g","p","Shi et al., 2021"],[24.2,341.31,"g","p","Shi et al., 2021"],[38.7,335.34,"g","p","Shi et al., 2021"],[59.2,332.18,"g","p","Shi et al., 2021"],[63.2,329.83,"g","p","Shi et al., 2021"],[70.0,1390.0,"o","p","Mostert et al., 2022"],[35.0,611.0,"o","p","Mostert et al., 2022"],[56.68,396.0,"o","p","Garcia-Troncoso et al., 2023"],[53.48,346.0,"r","p","Garcia-Troncoso et al., 2023"],[54.72,334.0,"r","p","Garcia-Troncoso et al., 2023"],[54.16,244.0,"r","p","Garcia-Troncoso et al., 2023"],[30.61,400.0,"o","p","Anh et al., 2023"],[32.72,362.0,"o","p","Anh et al., 2023"],[30.33,362.0,"o","p","Anh et al., 2023"],[59.4,235.5,"g","p","Ji et al., 2024"],[30.0,300.41,"r","p","Los Santos-Ortega et al., 2024"],[30.0,296.99,"r","p","Los Santos-Ortega et al., 2024"],[41.61,253.6,"r","p","Skibicki et al., 2024"],[51.48,475.78,"r","p","Agrela et al., 2024"],[49.74,358.91,"r","p","Agrela et al., 2024"],[43.85,360.21,"r","p","Agrela et al., 2024"],[55.7,258.89,"r","p","Agrela et al., 2024"],[49.1,229.43,"r","p","Agrela et al., 2024"],[43.0,233.71,"r","p","Agrela et al., 2024"],[74.0,66.6,"g","p","Lemesre et al., 2024"],[40.38,432.4,"s","p","Yao et al., 2024"],[38.46,400.4,"s","p","Yao et al., 2024"],[39.9,368.5,"s","p","Yao et al., 2024"],[37.44,397.2,"r","p","Yao et al., 2024"],[62.3,608.08,"g","p","Luo et al., 2023"],[57.0,554.6,"g","p","Luo et al., 2023"],[53.6,742.69,"o","p","Sambucci et al., 2023"],[45.57,420.9,"s","p","Kim et al., 2018"],[39.19,387.3,"s","p","Kim et al., 2018"],[39.45,383.8,"s","p","Kim et al., 2018"],[40.1,383.1,"s","p","Kim et al., 2018"],[37.6,353.7,"s","p","Kim et al., 2018"],[37.08,346.7,"s","p","Kim et al., 2018"],[38.16,345.4,"s","p","Kim et al., 2018"],[35.98,320.2,"s","p","Kim et al., 2018"],[37.0,309.7,"s","p","Kim et al., 2018"],[35.83,307.7,"s","p","Kim et al., 2018"],[76.18,289.69,"s","s","Cen et al., 2019"],[42.31,261.38,"s","s","Cen et al., 2019"],[43.66,287.44,"s","s","Cen et al., 2019"],[47.8,168.62,"s","s","Cen et al., 2019"],[52.92,185.5,"s","s","Cen et al., 2019"],[34.42,137.49,"s","s","Cen et al., 2019"],[73.29,273.84,"s","s","Cen et al., 2019"],[48.04,213.57,"s","s","Cen et al., 2019"],[32.38,168.67,"s","s","Cen et al., 2019"],[62.11,219.71,"s","s","Cen et al., 2019"],[46.41,184.14,"s","s","Cen et al., 2019"],[33.46,136.12,"s","s","Cen et al., 2019"],[70.21,413.66,"s","s","Cen et al., 2019"],[59.79,254.91,"s","s","Cen et al., 2019"],[55.11,206.89,"s","s","Cen et al., 2019"],[77.11,394.23,"s","s","Cen et al., 2019"],[59.32,277.09,"s","s","Cen et al., 2019"],[51.88,229.08,"s","s","Cen et al., 2019"],[76.65,292.48,"s","s","Cen et al., 2019"],[59.61,240.03,"s","s","Cen et al., 2019"],[49.35,191.95,"s","s","Cen et al., 2019"],[80.51,316.68,"s","s","Cen et al., 2019"],[38.93,129.31,"s","s","Cen et al., 2019"],[29.6,123.53,"s","s","Cen et al., 2019"],[78.03,375.77,"s","s","Cen et al., 2019"],[60.53,297.07,"s","s","Cen et al., 2019"],[48.67,249.01,"s","s","Cen et al., 2019"],[65.17,181.5,"s","s","Cen et al., 2019"],[33.57,130.65,"s","s","Cen et al., 2019"],[32.98,193.77,"s","s","Cen et al., 2019"],[74.53,346.99,"s","s","Cen et al., 2019"],[35.78,142.92,"s","s","Cen et al., 2019"],[27.67,156.84,"s","s","Cen et al., 2019"],[72.94,288.54,"s","s","Cen et al., 2019"],[49.59,194.48,"s","s","Cen et al., 2019"],[34.38,146.43,"s","s","Cen et al., 2019"],[65.23,253.1,"s","s","Cen et al., 2019"],[47.87,263.4,"s","s","Cen et al., 2019"],[40.32,215.33,"s","s","Cen et al., 2019"],[53.52,202.2,"s","s","Cen et al., 2019"],[58.71,210.77,"s","s","Cen et al., 2019"],[39.09,162.71,"s","s","Cen et al., 2019"],[68.28,283.75,"s","s","Cen et al., 2019"],[36.87,275.29,"s","s","Cen et al., 2019"],[36.16,227.28,"s","s","Cen et al., 2019"],[89.58,273.78,"s","s","Cen et al., 2019"],[63.82,239.75,"s","s","Cen et al., 2019"],[43.24,186.09,"s","s","Cen et al., 2019"],[76.11,384.25,"s","s","Cen et al., 2019"],[44.84,223.12,"s","s","Cen et al., 2019"],[23.32,93.77,"s","s","Cen et al., 2019"],[32.21,276.3,"s","s","Cen et al., 2019"],[48.5,1.78,"r","p","Pushkar, 2019"],[45.0,2.0,"r","p","Pushkar, 2019"],[50.0,1.79,"r","p","Pushkar, 2019"],[56.0,1.6,"r","p","Pushkar, 2019"],[52.5,1.72,"r","p","Pushkar, 2019"],[40.8,2.18,"r","p","Pushkar, 2019"],[40.0,2.24,"r","p","Pushkar, 2019"],[44.3,2.03,"r","p","Pushkar, 2019"],[43.5,2.06,"r","p","Pushkar, 2019"],[46.5,1.93,"r","p","Pushkar, 2019"],[54.0,1.67,"r","p","Pushkar, 2019"],[59.3,1.51,"r","p","Pushkar, 2019"],[56.5,1.58,"r","p","Pushkar, 2019"],[52.0,1.72,"r","p","Pushkar, 2019"],[46.0,1.93,"r","p","Pushkar, 2019"],[48.3,1.85,"r","p","Pushkar, 2019"],[46.0,1.93,"r","p","Pushkar, 2019"],[40.0,2.22,"r","p","Pushkar, 2019"],[36.0,2.46,"r","p","Pushkar, 2019"],[28.0,3.15,"r","p","Pushkar, 2019"],[25.0,224.34,"o","s","Yepes et al., 2020"],[30.0,224.94,"o","s","Yepes et al., 2020"],[35.0,265.28,"o","s","Yepes et al., 2020"],[40.0,265.28,"o","s","Yepes et al., 2020"],[45.0,265.91,"o","s","Yepes et al., 2020"],[50.0,265.95,"o","s","Yepes et al., 2020"],[35.0,430.8,"o","p","Cejuela et al., 2020"],[35.0,407.7,"o","p","Cejuela et al., 2020"],[35.0,110.0,"o","p","Cejuela et al., 2020"],[30.0,376.0,"o","s","Kayabekir et al., 2020"],[30.0,143.48,"o","s","Kayabekir et al., 2020"],[40.0,373.0,"o","p","Palumbo et al., 2020"],[30.0,220.0,"o","p","Palumbo et al., 2020"],[35.0,244.0,"o","p","Palumbo et al., 2020"],[30.0,219.0,"o","p","Palumbo et al., 2020"],[20.0,301.0,"o","p","Palumbo et al., 2020"],[25.0,310.0,"o","p","Palumbo et al., 2020"],[30.0,341.0,"o","p","Palumbo et al., 2020"],[35.0,385.0,"o","p","Palumbo et al., 2020"],[40.0,410.0,"o","p","Palumbo et al., 2020"],[40.0,371.0,"o","p","Palumbo et al., 2020"],[35.0,213.0,"o","p","Palumbo et al., 2020"],[25.0,197.0,"o","p","Palumbo et al., 2020"],[20.0,178.0,"o","p","Palumbo et al., 2020"],[45.0,286.0,"o","p","Palumbo et al., 2020"],[50.0,254.0,"o","p","Palumbo et al., 2020"],[50.0,300.0,"o","p","Palumbo et al., 2020"],[85.0,466.0,"o","p","Palumbo et al., 2020"],[21.0,410.0,"o","p","Park et al., 2020"],[21.0,420.0,"o","p","Park et al., 2020"],[24.0,415.0,"o","p","Park et al., 2020"],[24.0,430.0,"o","p","Park et al., 2020"],[24.0,436.8,"r","p","Park et al., 2020"],[40.5,268.9,"s","p","Fort et al., 2020"],[35.5,0.34,"r","p","Tosic et al., 2020"],[35.5,0.35,"r","p","Tosic et al., 2020"],[35.5,0.35,"r","p","Tosic et al., 2020"],[40.5,0.37,"r","p","Tosic et al., 2020"],[40.5,0.37,"r","p","Tosic et al., 2020"],[40.5,0.36,"r","p","Tosic et al., 2020"],[30.0,430.8,"r","p","Alzard et al., 2021"],[30.0,429.3,"r","p","Alzard et al., 2021"],[30.0,487.3,"r","p","Alzard et al., 2021"],[30.0,624.2,"r","p","Alzard et al., 2021"],[30.0,503.2,"r","p","Alzard et al., 2021"],[30.0,516.3,"r","p","Alzard et al., 2021"],[30.0,301.8,"r","p","Alzard et al., 2021"],[30.0,364.6,"r","p","Alzard et al., 2021"],[30.0,390.2,"r","p","Alzard et al., 2021"],[64.56,473.0,"g","p","Tang et al., 2021"],[35.5,699.0,"g","p","Tang et al., 2021"],[38.3,727.0,"g","p","Tang et al., 2021"],[30.0,213.48,"u","p","Bertola et al., 2021"],[28.0,264.18,"g","p","Imtiaz et al., 2021"],[28.0,261.31,"g","p","Imtiaz et al., 2021"],[30.0,112.74,"g","p","Imtiaz et al., 2021"],[27.0,111.38,"g","p","Imtiaz et al., 2021"],[25.0,354.0,"r","p","Mariakova et al., 2022"],[25.0,295.0,"r","p","Mariakova et al., 2022"],[25.0,259.0,"r","p","Mariakova et al., 2022"],[35.3,394.0,"u","p","Ji et al., 2022"],[30.0,1297.4,"o","s","Passoni et al., 2022"],[30.0,896.0,"o","s","Passoni et al., 2022"],[45.0,229.5,"s","p","Kvocka et al., 2022"],[49.0,127.4,"s","p","Kvocka et al., 2022"],[45.0,247.5,"s","p","Kvocka et al., 2022"],[49.0,137.2,"s","p","Kvocka et al., 2022"],[42.0,205.8,"s","p","Kvocka et al., 2022"],[39.0,105.3,"s","p","Kvocka et al., 2022"],[42.0,226.8,"s","p","Kvocka et al., 2022"],[37.0,114.7,"s","p","Kvocka et al., 2022"],[60.0,447.4,"o","s","Wang et al., 2023"],[70.13,335.09,"r","s","Starczyk-Kolbyk & Malek, 2023"],[58.0,713.5,"o","p","Backes et al., 2023"],[58.0,861.1,"o","p","Backes et al., 2023"],[35.0,427.1,"o","p","Backes et al., 2023"],[28.0,15.8,"s","p","Maury-Ramirez & De Belie, 2023"],[28.0,20.1,"s","p","Maury-Ramirez & De Belie, 2023"],[47.6,393.09,"r","p","Moro, 2023"],[54.9,324.93,"r","p","Moro, 2023"],[42.7,299.49,"r","p","Moro, 2023"],[56.0,493.89,"r","p","Moro, 2023"],[44.4,369.73,"r","p","Moro, 2023"],[53.2,301.57,"r","p","Moro, 2023"],[40.1,276.13,"r","p","Moro, 2023"],[49.3,470.53,"r","p","Moro, 2023"],[44.3,346.38,"r","p","Moro, 2023"],[50.7,278.22,"r","p","Moro, 2023"],[41.6,252.78,"r","p","Moro, 2023"],[53.2,447.18,"r","p","Moro, 2023"],[43.3,238.0,"g","p","Amari et al., 2024"],[37.9,305.81,"o","p","Ma et al., 2024"],[34.5,288.23,"o","p","Ma et al., 2024"],[34.5,353.21,"o","p","Ma et al., 2024"],[37.9,305.81,"o","p","Ma et al., 2024"],[68.9,344.04,"o","p","Ma et al., 2024"],[82.7,412.84,"o","p","Ma et al., 2024"],[55.2,318.81,"o","p","Ma et al., 2024"],[41.4,270.64,"o","p","Ma et al., 2024"],[40.0,288.9,"o","s","Shi et al., 2024"],[60.0,222.3,"o","s","Shi et al., 2024"],[60.0,1165.0,"g","p","Roux et al., 2024"],[44.0,528.0,"g","p","Roux et al., 2024"],[41.7,489.7,"o","p","Ring et al., 2024"],[41.5,478.1,"o","p","Ring et al., 2024"],[37.2,466.4,"o","p","Ring et al., 2024"],[37.0,443.1,"o","p","Ring et al., 2024"],[34.6,419.8,"o","p","Ring et al., 2024"],[20.0,237.32,"o","p","Zhao et al., 2024"],[25.0,266.18,"o","p","Zhao et al., 2024"],[30.0,295.0,"o","p","Zhao et al., 2024"],[35.0,362.6,"o","p","Zhao et al., 2024"],[50.0,511.0,"o","p","Zhao et al., 2024"],[48.5,398.4,"r","s","Arredondo et al., 2024"],[44.0,398.7,"r","s","Arredondo et al., 2024"],[43.0,399.2,"r","s","Arredondo et al., 2024"],[39.5,399.7,"r","s","Arredondo et al., 2024"],[37.5,400.2,"r","s","Arredondo et al., 2024"],[72.9,196.0,"g","p","Almonayea et al., 2025"],[70.0,185.0,"g","p","Almonayea et al., 2025"],[71.0,0.0,"r","p","Roy et al., 2025"],[50.0,92.0,"o","p","Cho & Chae, 2016"],[50.0,145.0,"o","p","Cho & Chae, 2016"],[50.0,149.0,"o","p","Cho & Chae, 2016"],[24.0,253.6,"o","p","Cho & Chae, 2016"],[24.0,329.37,"o","p","Baek et al., 2016"],[27.0,353.02,"o","p","Baek et al., 2016"],[30.0,383.77,"o","p","Baek et al., 2016"],[35.0,406.71,"o","p","Baek et al., 2016"],[40.0,429.65,"o","p","Baek et al., 2016"],[50.0,508.39,"o","p","Baek et al., 2016"],[35.0,451.4,"o","p","Penades-Pla et al., 2017"],[50.0,558.3,"o","p","Penades-Pla et al., 2017"],[24.0,364.9,"o","p","Kim et al., 2017"],[30.0,365.4,"o","p","Kim et al., 2017"],[25.0,345.0,"r","p","Haigh, 2025"],[29.0,315.0,"r","p","Haigh, 2025"],[32.0,304.0,"r","p","Haigh, 2025"],[25.0,337.67,"o","s","Mel et al., 2015"],[30.0,3532.0,"o","p","Oh et al., 2023"],[20.0,190.7,"o","p","Hora, 2021"],[20.0,112.3,"o","p","Hora, 2021"],[20.0,200.1,"o","p","Hora, 2021"],[20.0,175.0,"r","p","Hora, 2021"],[20.0,158.2,"r","p","Hora, 2021"],[20.0,79.81,"r","p","Hora, 2021"],[25.7,546.72,"g","s","Damrongwiriyanupap et al., 2022"],[46.8,546.72,"g","s","Damrongwiriyanupap et al., 2022"],[29.3,480.53,"g","s","Damrongwiriyanupap et al., 2022"],[48.7,480.54,"g","s","Damrongwiriyanupap et al., 2022"],[30.3,414.34,"g","s","Damrongwiriyanupap et al., 2022"],[47.1,414.35,"g","s","Damrongwiriyanupap et al., 2022"],[30.4,348.15,"g","s","Damrongwiriyanupap et al., 2022"],[49.2,348.17,"g","s","Damrongwiriyanupap et al., 2022"],[31.7,281.97,"g","s","Damrongwiriyanupap et al., 2022"],[51.4,281.99,"g","s","Damrongwiriyanupap et al., 2022"],[30.0,472.4,"o","p","Menna Barreto et al., 2021"],[30.0,496.88,"o","p","Menna Barreto et al., 2021"],[30.0,497.4,"o","p","Menna Barreto et al., 2021"]];

  var UNIT_STATS = [{"kind":"derivado","cat":"m3","n":169},{"kind":"nativo","cat":"m3","n":959},{"kind":"pendente","cat":"elemento","n":19},{"kind":"pendente","cat":"ja_mpa","n":11},{"kind":"pendente","cat":"kg","n":34},{"kind":"pendente","cat":"m2","n":69},{"kind":"pendente","cat":"metro_linear","n":17},{"kind":"pendente","cat":"outro","n":46},{"kind":"pendente","cat":"tonelada","n":41}];
  var tierVisible = { p: true, s: true };

  function currentData() {
    return DATA.filter(function (d) { return tierVisible[d[3]]; });
  }

  /* "Progresso da extração" tem três frentes independentes, cada uma com o
     seu próprio array de pontos {v: total acumulado} e sua própria curva no
     site (pedido da Kie, 2026-09-12, depois de perguntar por que o forest
     plot não tem barra de erro por estudo -- ver CRITERIOS_E_NUANCES_RSL.md,
     secção QG, no repositório da RSL). kind 'wave' = uma rodada de releitura
     integral de PDF (numerado automaticamente, excluindo 'start' e 'marco').
     kind 'marco' = uma correção de escopo/qualidade dos dados, não uma
     leitura nova — o valor pode cair. tKey aponta para COPY[lang].progressMarcos,
     o texto do card ao passar o mouse (mesmo componente do tooltip da
     dispersão). Adicionar um marco novo aqui SEMPRE que uma correção alterar
     o total de pares, com o texto em progressMarcos nas 3 línguas.

     PROGRESS_FCK_CO2: o histórico original (pares resistência+CO₂), sem
     mudança nenhuma além do nome -- continua reagindo ao filtro de estrato
     via reescala proporcional (ver renderProgress). PROGRESS_CORPO_PROVA e
     PROGRESS_IC são frentes NOVAS, começando hoje com um único ponto real
     (a contagem atual em dados_fck) -- sem histórico fabricado. Cada uma
     ganha novos pontos conforme lotes de extração dedicados avançarem,
     exatamente como PROGRESS_FCK_CO2 foi crescendo desde 2026-06. */
  var PROGRESS_FCK_CO2 = [
    { v: 446, kind: 'start' },
    { v: 604, kind: 'wave' },
    { v: 751, kind: 'wave' },
    { v: 823, kind: 'wave' },
    { v: 880, kind: 'wave' },
    { v: 941, kind: 'wave' },
    { v: 1020, kind: 'wave' },
    { v: 1314, kind: 'wave' },
    { v: 1447, kind: 'wave' },
    { v: 1309, kind: 'marco', tKey: 'marcoTijoloFck' },
    { v: 1054, kind: 'marco', tKey: 'marcoUnidadeCo2' },
    { v: 1069, kind: 'wave' },
    { v: 1043, kind: 'marco', tKey: 'marcoNegacaoM3' },
    { v: 1050, kind: 'wave' },
    { v: 1061, kind: 'wave' },
    { v: 1080, kind: 'wave' },
    { v: 1094, kind: 'wave' },
    { v: 1104, kind: 'wave' },
    { v: 1108, kind: 'wave' },
    { v: 1114, kind: 'wave' },
    { v: 1116, kind: 'wave' },
    { v: 1121, kind: 'wave' }
  ];

  /* Contagem viva de dados_fck.vol_corpo_prova_m3 preenchido (qualquer
     linha, não só as que entram em `pairs`) -- necessário para a futura
     conversão cubo→cilindro. Snapshot manual em 2026-09-12, mesmo espírito
     de KPI_VALUES/FUNNEL abaixo -- atualizar à mão quando um lote novo de
     extração avançar. */
  var PROGRESS_CORPO_PROVA = [
    { v: 79, kind: 'start' }
  ];

  /* Contagem viva de dados_fck.ic_fck_valor preenchido -- o critério QG da
     Etapa 4 (ver CRITERIOS_E_NUANCES_RSL.md no repositório da RSL). Colunas
     criadas em 2026-09-12, extração ainda não começou -- ponto único em 0,
     de propósito, não fabricado. */
  var PROGRESS_IC = [
    { v: 0, kind: 'start' }
  ];

  /* Contagem viva das 4 etapas da triagem (articles_final.xlsx, coluna
     status_triagem + colunas E1_, E2_, E3_ e E4_ — revisao-sistematica-
     literatura). Atualizar à mão sempre que um PR mudar esses totais
     (mesmo espírito de KPI_VALUES/PROGRESS abaixo, snapshot manual, não
     dado ao vivo). universo = todo o banco (5.093 registos, incluindo
     duplicatas e sem-acesso); cada etapa seguinte é sempre um subconjunto
     Aceito da anterior. e4.principal + e4.sensibilidade = e4.n = os 594
     artigos Elegíveis (2 terços de melhor qualidade formam o resultado
     principal); as 57 revisões sem ACV própria que também sobrevivem à
     Etapa 3 ficam fora desta barra — ver funnelRevisaoNote. */
  var FUNNEL = [
    { key: 'universo', n: 5093 },
    { key: 'e1', n: 2199 },
    { key: 'e2', n: 662 },
    { key: 'e3', n: 651 },
    { key: 'e4', n: 594, principal: 462, sensibilidade: 132 }
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

  var COPY = {
    PT: {
      kicker: 'PESQUISA · PAINEL AO VIVO',
      title: 'Pegada de carbono × resistência: a metanálise da dissertação',
      lead: 'Este painel acompanha, em tempo real, a extração de dados da revisão sistemática de literatura por trás da minha dissertação — comparando resistência à compressão e pegada de carbono em concretos de baixo carbono, agregado reciclado e UHPC. Os números mudam conforme a leitura de cada artigo avança.',
      navBack: '← kielima.com',
      kpiFunilLabel: 'artigos aceitos (passaram as 4 etapas)',
      kpiParesLabel: 'pares resistência × CO₂ extraídos',
      kpiVidaLabel: 'com vida útil de projeto declarada',
      kpiReleituraLabel: 'lotes da releitura integral concluídos',
      funnelLabel: 'TRIAGEM',
      funnelTitle: 'O funil da triagem: de 5.093 registos a 594 artigos',
      funnelP: 'A revisão sistemática passa por quatro etapas antes de um artigo entrar na metanálise: metadados, leitura do PDF completo, restrição geográfica do material e, por fim, qualidade metodológica. Cada barra mostra quantos artigos sobrevivem a cada etapa, a partir do banco completo de registos recolhidos nas buscas.',
      funnelStages: {
        universo: 'Banco completo (buscas + duplicatas removidas)',
        e1: 'Etapa 1 — metadados (ano, tipo de documento, material moldável, aplicação em construção)',
        e2: 'Etapa 2 — leitura do PDF completo (resistência à compressão e CO₂/ACV declarados)',
        e3: 'Etapa 3 — material não geograficamente restrito',
        e4: 'Etapa 4 — qualidade metodológica (resultado final)'
      },
      funnelRevisaoNote: 'Mais 57 artigos são revisões sem avaliação de ciclo de vida própria — não alimentam o indicador ci, mas continuam na base como ramo de citação do PRISMA: candidatos a fontes primárias descobertas pelas revisões que as citam.',
      funnelToggleHint: 'toque numa etapa para ver os critérios de exclusão',
      funnelDbChartTitle: 'Registos por base de dados, antes da remoção de duplicatas',
      funnelDetails: {
        universo: '5.093 registos recolhidos nas buscas. 2.627 (51,6%) eram duplicados, removidos antes de qualquer triagem. 1.808 foram rejeitados ao longo das quatro etapas seguintes — ver o detalhe em cada barra abaixo. 7 nunca tiveram o texto completo disponível (sem acesso). Os 651 restantes — 594 elegíveis + 57 revisões sem ACV própria — chegam à Etapa 4.',
        e1: 'Dos 2.471 registos avaliados nos metadados (ano, tipo de documento, material moldável, aplicação em construção), 2.199 foram aceites. Os 272 excluídos falharam por: aplicação em construção (190), material não moldável (71), tipo de documento (9), ano de publicação (1) — um registo pode falhar mais de um critério.',
        e2: 'Dos 2.188 artigos com PDF lido na íntegra, 662 foram aceites. Dos 1.526 excluídos: 1.239 não relatavam resistência à compressão própria, 331 não relatavam CO₂/ACV com resultado absoluto — alguns falham nos dois critérios.',
        e3: 'Dos 658 artigos avaliados quanto à restrição geográfica do material, 651 foram aceites; 7 foram excluídos por o material principal ser geograficamente restrito (ex.: resíduo de produção regional concentrada).',
        e4: 'Dos 651 artigos avaliados na Etapa 4 (checklist de 6 itens, 0 a 6 pontos): 462 formam o resultado principal (score ≥ 4,0), 132 entram só na análise de sensibilidade (score < 4,0), e 57 são revisões sem avaliação de ciclo de vida própria — não pontuam para o indicador ci, mas alimentam o ramo de citação do PRISMA (fontes primárias descobertas por essas revisões).'
      },
      tierLabel: 'ESTRATIFICAÇÃO POR QUALIDADE',
      tierTitle: 'Resultado principal × análise de sensibilidade',
      tierP: 'A Etapa 4 pontua a qualidade de cada artigo aceite (0–6, seis itens). Os dois terços de melhor pontuação formam o resultado principal da metanálise; o terço mais fraco continua aceite, mas só entra na análise de sensibilidade. Ligue e desligue cada grupo para comparar.',
      tierPrincipal: 'Dois terços de melhor qualidade (score ≥ 4,0)',
      tierSensibilidade: 'Terço mais fraco — só sensibilidade (score < 4,0)',
      progressTitle: 'Progresso da extração',
      progressP: 'A extração acontece em três frentes independentes, cada uma com o seu próprio ritmo — o par resistência×CO₂, o volume do corpo de prova e, desde 12.09.2026, o intervalo de confiança de cada estudo. Cada gráfico abaixo mostra o total acumulado da sua frente.',
      progressFckCo2Title: 'Resistência × CO₂',
      progressFckCo2P: 'Cada círculo é uma rodada de releitura integral de PDF — sempre o artigo inteiro, nunca só o resumo. Os losangos marcam correções de escopo ou de qualidade dos dados, não leituras novas — passe o mouse para ver o que mudou. A curva mostra o total acumulado de pares resistência+CO₂ confirmados na base.',
      progressCorpoProvaTitle: 'Volume do corpo de prova',
      progressCorpoProvaP: 'Contagem de linhas com o volume do corpo de prova (ou do elemento medido) já extraído — necessário para a futura conversão cubo→cilindro. Rastreamento começou em 12.09.2026, ainda sem lotes de releitura dedicados.',
      progressIcTitle: 'Intervalo de confiança por estudo',
      progressIcP: 'Contagem de linhas com desvio-padrão, coeficiente de variação ou intervalo de confiança do próprio artigo já extraído — o critério QG proposto para a Etapa 4 (ver "Sobre o indicador" abaixo). Coluna criada em 12.09.2026; a extração ainda não começou.',
      progressWave: 'onda',
      progressWaveSuffix: '',
      progressStart: 'início',
      progressMarco: 'correção',
      progressMarcos: {
        marcoTijoloFck: '<b>Correção · 08.09.2026</b><br>Tijolo, bloco de alvenaria, paver e telha deixaram de contar como material moldável (dimensões e requisitos fixados por norma, não variam por projeto) e todas as linhas com resistência abaixo de 20 MPa foram removidas — mesmo dentro de artigos aceites.<br><b>1.447 → 1.309</b> pares.',
        marcoUnidadeCo2: '<b>Correção · 08.09.2026</b><br>Nem toda unidade de CO₂ extraída era kg CO₂-eq/m³: algumas linhas traziam um índice já normalizado por MPa, ou valores por m², por tonelada, por elemento inteiro etc., plotados como se fossem kg/m³. Essas linhas saem do gráfico até serem confirmadas artigo a artigo — ver "Unidades de CO₂ relatadas" abaixo.<br><b>1.309 → 1.054</b> pares.',
        marcoNegacaoM3: '<b>Correção · 10.09.2026</b><br>Bug encontrado numa varredura por concreto armado disfarçado: algumas linhas diziam explicitamente "NÃO é por m³" no próprio registo, mas o classificador de unidade reconhecia só o "por m³" e ignorava a negação, incluindo-as no gráfico por engano. Corrigido — 9 linhas saem do gráfico.<br><b>1.069 → 1.043</b> pares.'
      },
      scatterTitle: 'Resistência × pegada de carbono',
      scatterP: '{N} pares comparáveis por m³ de material — traços/formulações cujo valor absoluto de CO₂ e resistência à compressão são publicados pelo próprio artigo, na mesma tabela. Totais de estrutura inteira (edifício, ponte) ficam fora, por não terem a mesma unidade de análise.',
      scatterXLabel: 'resistência à compressão (MPa)',
      scatterYLabel: 'CO₂ (kg/m³)',
      forestTitle: 'ci por família de material',
      forestP: 'ci = CO₂ ÷ resistência, em kg CO₂-eq por m³·MPa — quanto menor, mais eficiente o material por unidade de resistência entregue. Mediana de cada família; ponto contra ponto no gráfico acima.',
      forestToggleHint: 'toque numa família para ver os estudos que a compõem',
      forestOverall: 'TODOS OS MATERIAIS',
      forestSemLabel: 'estudo sem citação disponível',
      noteTitle: 'Sobre o indicador',
      noteP: 'O desfecho oficial desta metanálise é ci_t = ci ÷ vida útil de projeto (kg CO₂-eq por m³·MPa·ano) — mas a vida útil só está declarada explicitamente em cerca de 6% dos artigos até agora, por isso o painel mostra o indicador intermediário ci enquanto essa extração continua. Metodologia de Damineli et al. (2010). Um modelo de efeitos aleatórios multinível (REML) trata cada formulação como observação própria, aninhada no estudo de origem.',
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
      tooltipCi: 'ci',
      unitChartTitle: 'Unidades de CO₂ relatadas',
      unitChartP: 'Como cada estudo reporta a pegada de carbono — nem sempre em kg CO₂-eq por m³. "Nativo" é o valor já publicado assim pelo autor; "convertido por nós" é calculado a partir de outra grandeza que o próprio artigo imprime (ex. um total dividido pelo volume do elemento). As demais barras ainda estão na unidade original do estudo e ficam fora do gráfico de dispersão acima até serem confirmadas artigo a artigo.',
      unitChartKindNativo: 'kg CO₂-eq/m³ — nativo (publicado assim)',
      unitChartKindDerivado: 'kg CO₂-eq/m³ — convertido por nós',
      unitChartKindPendente: 'ainda na unidade original do estudo',
      unitCats: {
        m2: 'por m² de área construída',
        tonelada: 'por tonelada de material',
        kg: 'por kg de insumo',
        elemento: 'por elemento estrutural inteiro',
        metro_linear: 'por metro linear',
        ja_mpa: 'índice já normalizado por MPa',
        especime: 'por corpo de prova/espécime',
        outro: 'outro / não classificado'
      }
    },

    EN: {
      kicker: 'RESEARCH · LIVE DASHBOARD',
      title: 'Carbon footprint × strength: the dissertation meta-analysis',
      lead: 'This dashboard tracks, in real time, the data extraction behind the systematic literature review under my dissertation — comparing compressive strength and carbon footprint across low-carbon, recycled-aggregate and ultra-high-performance (UHPC) concretes. The numbers change as each article gets read.',
      navBack: '← kielima.com',
      kpiFunilLabel: 'articles accepted (passed all 4 stages)',
      kpiParesLabel: 'strength × CO₂ pairs extracted',
      kpiVidaLabel: 'with declared design service life',
      kpiReleituraLabel: 'batches of the full re-read completed',
      funnelLabel: 'SCREENING',
      funnelTitle: 'The screening funnel: from 5,093 records to 594 articles',
      funnelP: "The systematic review runs through four stages before an article enters the meta-analysis: metadata, full-PDF reading, the material's geographic restriction, and finally methodological quality. Each bar shows how many articles survive each stage, starting from the full pool of records collected in the searches.",
      funnelStages: {
        universo: 'Full database (searches + duplicates removed)',
        e1: 'Stage 1 — metadata (year, document type, moldable material, construction application)',
        e2: 'Stage 2 — full-PDF reading (declared compressive strength and CO₂/LCA)',
        e3: 'Stage 3 — material not geographically restricted',
        e4: 'Stage 4 — methodological quality (final result)'
      },
      funnelRevisaoNote: 'Another 57 articles are reviews without their own life-cycle assessment — they do not feed the ci indicator, but stay in the base as a PRISMA citation branch: candidate primary sources discovered through the reviews that cite them.',
      funnelToggleHint: 'tap a stage to see the exclusion criteria',
      funnelDbChartTitle: 'Records by database, before duplicate removal',
      funnelDetails: {
        universo: "5,093 records collected in the searches. 2,627 (51.6%) were duplicates, removed before any screening. 1,808 were rejected across the four stages that follow — see the detail in each bar below. 7 never had the full text available (no access). The remaining 651 — 594 eligible + 57 reviews without their own LCA — reach Stage 4.",
        e1: 'Of the 2,471 records screened on metadata (year, document type, moldable material, construction application), 2,199 were accepted. The 272 excluded failed on: construction application (190), non-moldable material (71), document type (9), publication year (1) — a record can fail more than one criterion.',
        e2: 'Of the 2,188 articles fully read as PDF, 662 were accepted. Of the 1,526 excluded: 1,239 did not report their own compressive strength, 331 did not report CO₂/LCA with an absolute result — some fail both criteria.',
        e3: "Of the 658 articles assessed for the material's geographic restriction, 651 were accepted; 7 were excluded because the main material is geographically restricted (e.g. a regionally concentrated production by-product).",
        e4: "Of the 651 articles assessed in Stage 4 (a 6-item checklist, 0 to 6 points): 462 form the main result (score ≥ 4.0), 132 enter only the sensitivity analysis (score < 4.0), and 57 are reviews without their own life-cycle assessment — they don't score toward the ci indicator, but feed the PRISMA citation branch (primary sources discovered through those reviews)."
      },
      tierLabel: 'QUALITY STRATIFICATION',
      tierTitle: 'Main result × sensitivity analysis',
      tierP: "Stage 4 scores the quality of every accepted article (0-6, six items). The top two-thirds by score form the meta-analysis's main result; the bottom third stays accepted, but only feeds the sensitivity analysis. Toggle each group to compare.",
      tierPrincipal: 'Top two-thirds by quality (score ≥ 4.0)',
      tierSensibilidade: 'Bottom third — sensitivity only (score < 4.0)',
      progressTitle: 'Extraction progress',
      progressP: 'Extraction runs on three independent fronts, each at its own pace — the strength×CO₂ pair, the specimen volume, and, since 09.12.2026, each study’s confidence interval. Each chart below shows the running total for its own front.',
      progressFckCo2Title: 'Strength × CO₂',
      progressFckCo2P: 'Each circle is a full-PDF re-read round — always the whole article, never just the abstract. Diamonds mark a scope or data-quality correction, not a new read — hover to see what changed. The curve shows the running total of confirmed strength+CO₂ pairs in the database.',
      progressCorpoProvaTitle: 'Specimen volume',
      progressCorpoProvaP: 'Count of rows with the specimen (or measured element) volume already extracted — needed for the planned cube-to-cylinder conversion. Tracking started on 09.12.2026, no dedicated re-read batches yet.',
      progressIcTitle: 'Confidence interval per study',
      progressIcP: 'Count of rows with a standard deviation, coefficient of variation, or confidence interval already extracted from the article itself — the QG criterion proposed for Stage 4 (see "About the indicator" below). Column created on 09.12.2026; extraction has not started yet.',
      progressWave: 'wave',
      progressWaveSuffix: '',
      progressStart: 'start',
      progressMarco: 'correction',
      progressMarcos: {
        marcoTijoloFck: '<b>Correction · 09.08.2026</b><br>Brick, masonry block, paver and roof tile no longer count as moldable material (dimensions and requirements fixed by standard, not project-driven) and every row with strength below 20 MPa was removed — even inside accepted articles.<br><b>1,447 → 1,309</b> pairs.',
        marcoUnidadeCo2: '<b>Correction · 09.08.2026</b><br>Not every extracted CO₂ unit was kg CO₂-eq/m³: some rows carried an index already normalized by MPa, or values per m², per tonne, per whole element, etc., plotted as if they were kg/m³. Those rows drop out of the chart until confirmed article by article — see "Reported CO₂ units" below.<br><b>1,309 → 1,054</b> pairs.',
        marcoNegacaoM3: '<b>Correction · 09.10.2026</b><br>Bug found during a sweep for disguised reinforced-concrete rows: some rows explicitly said "NOT per m³" in their own record, but the unit classifier only recognized the "per m³" part and missed the negation, including them in the chart by mistake. Fixed — 9 rows drop out of the chart.<br><b>1,069 → 1,043</b> pairs.'
      },
      scatterTitle: 'Strength × carbon footprint',
      scatterP: '{N} comparable per-m³ pairs — mixes/formulations whose absolute CO₂ value and compressive strength are published by the article itself, in the same table. Whole-structure totals (a building, a bridge) are left out, since they are not the same unit of analysis.',
      scatterXLabel: 'compressive strength (MPa)',
      scatterYLabel: 'CO₂ (kg/m³)',
      forestTitle: 'ci by material family',
      forestP: 'ci = CO₂ ÷ strength, in kg CO₂-eq per m³·MPa — the lower, the more efficient the material per unit of strength delivered. Median of each family; point against point in the chart above.',
      forestToggleHint: 'tap a family to see the studies behind it',
      forestOverall: 'ALL MATERIALS',
      forestSemLabel: 'study with no citation available',
      noteTitle: 'About the indicator',
      noteP: "This meta-analysis's official outcome is ci_t = ci ÷ design service life (kg CO₂-eq per m³·MPa·year) — but service life is only explicitly stated in about 6% of articles so far, so the dashboard shows the intermediate ci indicator while that extraction continues. Methodology from Damineli et al. (2010). A multilevel (REML) random-effects model treats each formulation as its own observation, nested within its source study.",
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
      tooltipCi: 'ci',
      unitChartTitle: 'Reported CO₂ units',
      unitChartP: "How each study reports its carbon footprint — not always in kg CO₂-eq per m³. \"Native\" is the value as the author already published it; \"converted by us\" is computed from a different quantity the article itself prints (e.g. a total divided by the element's volume). The other bars are still in the study's original unit and stay out of the scatter chart above until confirmed article by article.",
      unitChartKindNativo: 'kg CO₂-eq/m³ — native (published as such)',
      unitChartKindDerivado: 'kg CO₂-eq/m³ — converted by us',
      unitChartKindPendente: "still in the study's original unit",
      unitCats: {
        m2: 'per m² of built area',
        tonelada: 'per tonne of material',
        kg: 'per kg of ingredient',
        elemento: 'per whole structural element',
        metro_linear: 'per linear meter',
        ja_mpa: 'index already normalized by MPa',
        especime: 'per test specimen',
        outro: 'other / unclassified'
      }
    },

    ZH: {
      kicker: '研究 · 实时面板',
      title: '碳足迹 × 强度：论文的荟萃分析',
      lead: '本面板实时展示我硕士论文所依托的系统性文献综述的数据提取进度——比较低碳混凝土、再生骨料混凝土与超高性能混凝土（UHPC）的抗压强度与碳足迹。数字会随着每篇文献的阅读而更新。',
      navBack: '← kielima.com',
      kpiFunilLabel: '已通过全部4个阶段的入选文献',
      kpiParesLabel: '已提取的强度×CO₂数据对',
      kpiVidaLabel: '已注明设计使用寿命',
      kpiReleituraLabel: '完整复读批次已完成',
      funnelLabel: '筛选',
      funnelTitle: '筛选漏斗：从5,093条记录到594篇文献',
      funnelP: '系统综述在文献进入荟萃分析之前要经过四个阶段：元数据、通读全文PDF、材料的地域限制，最后是方法学质量。每一条柱状图显示从检索收集到的全部记录出发，有多少文献在每个阶段存活下来。',
      funnelStages: {
        universo: '完整数据库（检索结果，已去重）',
        e1: '第1阶段——元数据（年份、文献类型、可模塑材料、建筑用途）',
        e2: '第2阶段——通读全文PDF（注明抗压强度与CO₂/生命周期评估）',
        e3: '第3阶段——材料不受地域限制',
        e4: '第4阶段——方法学质量（最终结果）'
      },
      funnelRevisaoNote: '另有57篇文献属于没有自身生命周期评估的综述——不计入ci指标，但仍保留在数据库中，作为PRISMA引文分支：这些综述所引用的原始研究是潜在的候选文献。',
      funnelToggleHint: '点击每个阶段查看排除标准',
      funnelDbChartTitle: '去重之前，各数据库的记录数',
      funnelDetails: {
        universo: '检索共收集5,093条记录。其中2,627条（51.6%）为重复记录，在任何筛选之前已被移除。1,808条在随后四个阶段中被剔除——详见下方各阶段柱状图。7条从未能获取全文（无法访问）。剩余651条——594篇入选文献+57篇无自身生命周期评估的综述——进入第4阶段。',
        e1: '在按元数据（年份、文献类型、可模塑材料、建筑用途）筛选的2,471条记录中，2,199条被接受。被排除的272条中：190条因不属于建筑用途，71条因材料不可模塑，9条因文献类型，1条因发表年份——同一记录可能同时不符合多项标准。',
        e2: '在通读全文PDF的2,188篇文献中，662篇被接受。被排除的1,526篇中：1,239篇未报告自身的抗压强度，331篇未报告有绝对数值的CO₂/生命周期评估结果——部分文献两项标准都未满足。',
        e3: '在评估材料地域限制的658篇文献中，651篇被接受；7篇因主要材料受地域限制（例如某地区高度集中的生产副产品）而被排除。',
        e4: '在第4阶段（6项清单，0至6分）评估的651篇文献中：462篇构成主要结果（得分≥4.0），132篇仅用于敏感性分析（得分<4.0），57篇是没有自身生命周期评估的综述——不计入ci指标得分，但作为PRISMA引文分支的来源（这些综述引用的原始研究）。'
      },
      tierLabel: '质量分层',
      tierTitle: '主要结果 × 敏感性分析',
      tierP: '第4阶段为每篇入选文献的质量打分（0-6分，六个项目）。得分最高的三分之二构成荟萃分析的主要结果；得分最低的三分之一仍属入选文献，但只用于敏感性分析。切换各组即可对比。',
      tierPrincipal: '质量最优三分之二（得分 ≥ 4.0）',
      tierSensibilidade: '质量最弱三分之一 —— 仅用于敏感性分析（得分 < 4.0）',
      progressTitle: '提取进度',
      progressP: '数据提取分三条独立的战线推进，各有各的节奏——强度×CO₂数据对、试件体积，以及自2026年9月12日起新增的各研究置信区间。下方每张图都显示对应战线的累计总数。',
      progressFckCo2Title: '强度 × CO₂',
      progressFckCo2P: '每个圆点代表一轮完整重读PDF——始终通读全文，而非仅读摘要。菱形标记的是范围或数据质量方面的修正，不是新一轮阅读——将鼠标悬停查看具体改动。曲线显示数据库中已确认的强度+CO₂数据对累计总数。',
      progressCorpoProvaTitle: '试件体积',
      progressCorpoProvaP: '已提取试件（或被测构件）体积的数据行计数——为将来的立方体转圆柱体换算做准备。该项追踪始于2026年9月12日，尚无专门的重读批次。',
      progressIcTitle: '各研究的置信区间',
      progressIcP: '已从原文提取标准差、变异系数或置信区间的数据行计数——即第4阶段拟议的QG标准（见下方"关于该指标"）。该列于2026年9月12日创建，提取工作尚未开始。',
      progressWave: '第',
      progressWaveSuffix: '轮',
      progressStart: '起点',
      progressMarco: '修正',
      progressMarcos: {
        marcoTijoloFck: '<b>修正 · 2026.09.08</b><br>砖、砌块、路面砖和瓦不再算作可模塑材料（尺寸和要求由标准固定，不随项目变化），抗压强度低于20 MPa的所有数据行也一并移除——即便出现在已入选的文献中。<br><b>1,447 → 1,309</b> 对数据。',
        marcoUnidadeCo2: '<b>修正 · 2026.09.08</b><br>并非所有提取的CO₂单位都是kg CO₂-eq/m³：部分数据行使用的是已按MPa归一化的指标，或按平方米、吨、整个构件等单位给出的数值，此前被当作kg/m³直接绘制。这些数据行将从图表中移除，直到逐篇文献确认为止——见下方"报告的CO₂单位"。<br><b>1,309 → 1,054</b> 对数据。',
        marcoNegacaoM3: '<b>修正 · 2026.09.10</b><br>在排查"伪装的钢筋混凝土"数据行时发现一个错误：部分数据行本身明确写着"并非每立方米"，但单位识别程序只认出了"每立方米"，没有识别否定词，误把它们计入图表。已修正——9行从图表中移除。<br><b>1,069 → 1,043</b> 对数据。'
      },
      scatterTitle: '强度 × 碳足迹',
      scatterP: '{N} 对可比的每立方米数据——配合比/配方，其CO₂绝对值与抗压强度由文章本身在同一表格中公布。整体结构（建筑、桥梁）的总量不计入，因为它们的分析单位不同。',
      scatterXLabel: '抗压强度（MPa）',
      scatterYLabel: 'CO₂（kg/m³）',
      forestTitle: '各材料类别的ci指标',
      forestP: 'ci = CO₂ ÷ 强度，单位为每 m³·MPa 的 kg CO₂ 当量——数值越低，材料每单位强度的效率越高。各类别的中位数，与上方图表逐点对应。',
      forestToggleHint: '点击某个类别，查看构成该类别的研究',
      forestOverall: '所有材料',
      forestSemLabel: '无引用信息的研究',
      noteTitle: '关于该指标',
      noteP: '本荟萃分析的官方结果指标是 ci_t = ci ÷ 设计使用寿命（每 m³·MPa·年的 kg CO₂ 当量）——但目前只有约6%的文献明确注明了使用寿命，因此在该项提取完成前，面板暂时显示中间指标 ci。方法源自 Damineli 等（2010）。多层级（REML）随机效应模型将每个配方视为独立观测值，嵌套于其来源研究之下。',
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
      tooltipCi: 'ci',
      unitChartTitle: '报告的CO₂单位',
      unitChartP: '每项研究报告碳足迹的方式并不总是每立方米kg CO₂当量。"原始"指作者本身就是这样公布的数值；"我们换算的"是根据文章本身给出的另一个量计算得出（例如总量除以构件体积）。其余各栏仍处于该研究的原始单位，在逐篇确认之前不计入上方的散点图。',
      unitChartKindNativo: 'kg CO₂-eq/m³ —— 原始（本就这样公布）',
      unitChartKindDerivado: 'kg CO₂-eq/m³ —— 我们换算的',
      unitChartKindPendente: '仍为该研究的原始单位',
      unitCats: {
        m2: '每平方米建筑面积',
        tonelada: '每吨材料',
        kg: '每千克原料',
        elemento: '每个完整结构构件',
        metro_linear: '每延米',
        ja_mpa: '已按MPa归一化的指标',
        especime: '每个试件/试样',
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
    funil: 595,
    vida: 87,
    releitura: '64/68'
  };

  function renderKPIs(lang) {
    document.getElementById('kpi-funil').textContent = fmtInt(KPI_VALUES.funil, lang);
    document.getElementById('kpi-pares').textContent = fmtInt(currentData().length, lang);
    document.getElementById('kpi-vida').textContent = fmtInt(KPI_VALUES.vida, lang);
    document.getElementById('kpi-releitura').textContent = KPI_VALUES.releitura;
  }

  function renderTierCounts(lang) {
    var nP = 0, nS = 0;
    DATA.forEach(function (d) { if (d[3] === 'p') nP++; else nS++; });
    document.getElementById('tier-n-p').textContent = fmtInt(nP, lang);
    document.getElementById('tier-n-s').textContent = fmtInt(nS, lang);
  }

  function renderScatterDesc(strings, lang) {
    document.getElementById('scatter-desc').textContent =
      strings.scatterP.replace('{N}', fmtInt(currentData().length, lang));
  }

  /* --------------------------------------------------- gráfico: progresso */

  function renderProgress(strings, lang) {
    /* A curva fck-CO2 e um historico cumulativo de pares confirmados na
       base -- PROGRESS_FCK_CO2 nao sabe, ponto a ponto, quantos desses
       pares eram "principal" vs "sensibilidade" em cada momento (a
       estratificacao por qualidade so existe hoje, aplicada ao estado
       atual dos dados, nao a cada onda passada). Para a curva reagir ao
       filtro de estrato sem inventar um historico que nao existe, cada
       valor registado e reescalado pela MESMA proporcao que o filtro
       atual tira do total de hoje (DATA.length) -- o ultimo ponto fecha
       exatamente com currentData().length (o mesmo numero do KPI de
       pares), e os pontos anteriores encolhem/crescem na mesma proporcao,
       preservando a forma relativa da curva (inclusive o tamanho das
       quedas nas correcoes). Aproximado, nao um recalculo linha a linha.

       As outras duas frentes (corpo de prova, intervalo de confianca) NAO
       sao reescaladas pelo filtro de estrato -- cada uma tem um unico
       ponto hoje (a contagem bruta em dados_fck, nao filtrada por
       principal/sensibilidade), e DATA nao carrega, por par, se aquela
       linha ja tem volume/IC extraido -- nao ha como recalcular por
       estrato sem exportar mais campos. Ficam como contagem bruta ate
       terem historico suficiente para essa nuance valer a pena. */
    var ratio = DATA.length ? currentData().length / DATA.length : 1;
    var fckCo2Points = PROGRESS_FCK_CO2.map(function (p) {
      return { v: p.v * ratio, kind: p.kind, tKey: p.tKey };
    });

    renderProgressChart({
      svg: 'progress-svg-fck-co2', tooltip: 'progress-tooltip-fck-co2', wrap: 'progress-wrap-fck-co2'
    }, fckCo2Points, strings, lang);
    renderProgressChart({
      svg: 'progress-svg-corpo-prova', tooltip: 'progress-tooltip-corpo-prova', wrap: 'progress-wrap-corpo-prova'
    }, PROGRESS_CORPO_PROVA, strings, lang);
    renderProgressChart({
      svg: 'progress-svg-ic', tooltip: 'progress-tooltip-ic', wrap: 'progress-wrap-ic'
    }, PROGRESS_IC, strings, lang);
  }

  /* Desenha uma curva de progresso num conjunto de elementos DOM (svg +
     tooltip + wrap) a partir de uma lista de pontos {v, kind, tKey}.
     Generaliza para series de um so ponto (denom abaixo usa `|| 1` para
     nao dividir por zero quando points.length === 1) -- e o caso das
     frentes novas (corpo de prova, intervalo de confianca), que comecam
     hoje com um unico ponto real, sem historico fabricado. */
  function renderProgressChart(ids, points, strings, lang) {
    var svg = document.getElementById(ids.svg);
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var W = 900, H = 200;
    var padL = 36, padR = 16, padT = 16, padB = 10;
    var innerW = W - padL - padR, innerH = H - padT - padB;
    // piso de 4 no eixo -- sem isso, uma frente que comeca em 0 (ex. IC hoje)
    // dava um eixo com "1,1,1,0,0" (arredondamento de fracoes de 1), em vez
    // de uma escala legivel.
    var max = Math.max(Math.max.apply(null, points.map(function (p) { return p.v; })) * 1.08, 4);
    var min = 0;
    var denom = (points.length - 1) || 1;

    function x(i) { return padL + (i / denom) * innerW; }
    function y(v) { return padT + innerH - ((v - min) / (max - min)) * innerH; }

    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

    // linhas de grade horizontais
    var ticks = 4;
    for (var t = 0; t <= ticks; t++) {
      var v = (max / ticks) * t;
      var yy = y(v);
      svg.appendChild(svgEl('line', { x1: padL, x2: W - padR, y1: yy, y2: yy, class: 'scatter-grid-line' }));
      var lbl = svgEl('text', { x: 4, y: yy + 3, class: 'progress-axis' });
      lbl.textContent = Math.round(v);
      svg.appendChild(lbl);
    }

    // área + linha
    var pathD = 'M ' + x(0) + ' ' + y(points[0].v);
    for (var i = 1; i < points.length; i++) pathD += ' L ' + x(i) + ' ' + y(points[i].v);
    var areaD = pathD + ' L ' + x(points.length - 1) + ' ' + (padT + innerH) + ' L ' + x(0) + ' ' + (padT + innerH) + ' Z';

    svg.appendChild(svgEl('path', { d: areaD, class: 'progress-area' }));
    svg.appendChild(svgEl('path', { d: pathD, class: 'progress-line' }));

    var tooltip = document.getElementById(ids.tooltip);
    var wrap = document.getElementById(ids.wrap);
    var waveN = 0;

    /* O rotulo de cada ponto (inicio/onda N/correcao) deixou de ficar
       escrito permanentemente por baixo do eixo -- com 22+ pontos no
       mesmo espaco os textos se sobrepunham e ficavam ilegiveis (achado
       da Kie, 2026-09-12). Agora só aparece no tooltip ao passar o mouse
       em cima do circulo/losango, junto com o valor (ja reescalado pelo
       filtro de estrato acima, quando aplicavel). */
    for (var j = 0; j < points.length; j++) {
      var pt = points[j];
      var isMarco = pt.kind === 'marco';
      var cx = x(j), cy = y(pt.v);

      if (isMarco) {
        svg.appendChild(svgEl('line', {
          x1: cx, x2: cx, y1: padT, y2: padT + innerH, class: 'progress-marco-line'
        }));
      }

      var dot = svgEl(isMarco ? 'rect' : 'circle', isMarco
        ? { x: cx - 4, y: cy - 4, width: 8, height: 8, class: 'progress-dot-marco', transform: 'rotate(45 ' + cx + ' ' + cy + ')' }
        : { cx: cx, cy: cy, r: 4, class: 'progress-dot' });
      svg.appendChild(dot);

      var val = svgEl('text', {
        x: cx, y: cy - 11, class: 'progress-value' + (isMarco ? ' progress-value-marco' : ''), 'text-anchor': 'middle'
      });
      val.textContent = fmtInt(Math.round(pt.v), lang);
      svg.appendChild(val);

      var pointLabel;
      if (pt.kind === 'start') {
        pointLabel = strings.progressStart;
      } else if (isMarco) {
        pointLabel = strings.progressMarco;
      } else {
        waveN++;
        pointLabel = strings.progressWave + (strings.progressWaveSuffix ? '' : ' ') + waveN + strings.progressWaveSuffix;
      }

      (function (label, marcoText) {
        dot.addEventListener('mousemove', function (ev) {
          tooltip.innerHTML = marcoText || ('<b>' + label + '</b>');
          positionTooltip(tooltip, wrap, ev);
          tooltip.classList.add('is-visible');
        });
        dot.addEventListener('mouseleave', function () {
          tooltip.classList.remove('is-visible');
        });
      })(pointLabel, isMarco ? strings.progressMarcos[pt.tKey] : null);
    }
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

      if (stage.principal != null) {
        var segP = document.createElement('div');
        segP.className = 'funnel-bar-seg funnel-bar-seg-principal';
        segP.style.flex = '1 1 auto';
        var segPVal = document.createElement('span');
        segPVal.className = 'funnel-bar-count';
        segPVal.textContent = fmtInt(stage.principal, lang);
        segP.appendChild(segPVal);
        bar.appendChild(segP);
        var segS = document.createElement('div');
        segS.className = 'funnel-bar-seg funnel-bar-seg-sensibilidade';
        segS.style.flex = '0 0 auto';
        var segSVal = document.createElement('span');
        segSVal.className = 'funnel-bar-count';
        segSVal.textContent = '+' + fmtInt(stage.sensibilidade, lang);
        segS.appendChild(segSVal);
        bar.appendChild(segS);
      } else {
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
        legend.appendChild(pItem);

        var sItem = document.createElement('span');
        sItem.className = 'unit-legend-item';
        var sSw = document.createElement('span');
        sSw.className = 'unit-swatch unit-swatch-derivado';
        sItem.appendChild(sSw);
        var sLbl = document.createElement('span');
        sLbl.textContent = strings.tierSensibilidade + ' — ' + fmtInt(stage.sensibilidade, lang);
        sItem.appendChild(sLbl);
        legend.appendChild(sItem);

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
      row.appendChild(detail);

      list.appendChild(row);
    });
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
      var item = { ci: ci, fck: fck, co2: co2, tier: TIERCODE[d[3]], label: d[4] };
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
    var subList = document.createElement('div');
    subList.className = 'forest-sub-list';
    items.slice().sort(function (a, b) { return a.ci - b.ci; }).forEach(function (it) {
      subList.appendChild(buildForestSubRow(it, color, pos, strings));
    });
    detail.appendChild(subList);
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

  var UNIT_PENDENTE_ORDER = ['m2', 'tonelada', 'kg', 'elemento', 'metro_linear', 'ja_mpa', 'especime', 'outro'];

  function renderUnitChart(strings) {
    var legend = document.getElementById('unit-legend');
    legend.textContent = '';
    [
      { kind: 'nativo', label: strings.unitChartKindNativo },
      { kind: 'derivado', label: strings.unitChartKindDerivado },
      { kind: 'pendente', label: strings.unitChartKindPendente }
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

      list.appendChild(row);
    });
  }

  /* -------------------------------------------------------------- boot */

  function renderAll(strings, lang) {
    renderKPIs(lang);
    renderTierCounts(lang);
    renderScatterDesc(strings, lang);
    renderFunnel(strings, lang);
    renderProgress(strings, lang);
    renderScatter(strings);
    renderLegend(strings);
    renderForest(strings);
    renderUnitChart(strings);
  }

  var themeCtl = null;

  var i18n = window.KLI18n.init({
    copy: COPY,
    select: document.getElementById('lang-select'),
    onChange: function (lang, strings) {
      renderAll(strings, lang);
      if (themeCtl) themeCtl.sync();
    }
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
