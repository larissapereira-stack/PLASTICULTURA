const fs = require('fs');

const rawOcr = `
LAB Labrunier I LAB 01 ADELSON II-04 3/3 ARD 36 3,51 01/12/2025 Serroplast Plasticultura
LAB Labrunier I LAB 01 ADELSON I-42 7/4 AUTUMN CRISP 1,87 22/11/2023 Picplast 08/08/2025 Serroplast Plasticultura
LAB Labrunier I LAB 01 ADELSON I-41 7/3 AUTUMN CRISP 2,44 28/08/2023 Picplast 13/08/2025 Serroplast Plasticultura
LAB Labrunier I LAB 01 ADELSON I-12 2/1 AUTUMN CRISP 2,87 21/04/2022 Plastico 03/09/2025 Serroplast Plasticultura
LAB Labrunier I LAB 01 ADELSON I-01 1/1 AUTUMN CRISP 2,32 03/02/2023 Propex Serroplast Plasticultura
LAB Labrunier I LAB 01 ADELSON I-19 2/D AUTUMN CRISP 2,12 31/10/2022 Plastico 29/09/2025 Serroplast Plasticultura
LAB Labrunier I LAB 01 ADELSON II-01 2/4A AUTUMN CRISP 3,47 21/07/2022 Picplast 04/01/2024 Propex 28/04/2025 Serroplast Plasticultura
LAB Labrunier I LAB 01 ADELSON I-04 1/4 SUGAR CRISP 2,08 Serroplast Substituição Tnt 2026
LAB Labrunier I LAB 01 ADELSON I-05 1/5 SUGAR CRISP 1,09 Serroplast Substituição Tnt 2026
LAB Labrunier I LAB 01 ADELSON I-23 4/1 BEBOP 4,16 1809/2023 Picplast 24/08/2025 Serroplast Plasticultura
LAB Labrunier I LAB 01 ADELSON II-12 5/2A CANDY DREAMS 1,43 04/07/2022 Picplast 20/08/2025 Serroplast Plasticultura
LAB Labrunier I LAB 01 ADELSON II-29 6/9 CANDY DREAMS 3,74 25/10/2022 Picplast 15/10/2025 Serroplast Estrutura de plasticutura
LAB Labrunier I LAB 01 ADELSON II-16 5/6 CANDY DREAMS 2,11 06/03/2023 Propex 23/09/2025 Serroplast Plasticultura
LAB Labrunier I LAB 01 ADELSON I-10 1/D SUGAR CRISP 3,12 23/09/2026 Serroplast Substituição Tnt 2026
LAB Labrunier I LAB 01 ADELSON II-30 6/10 CANDY SNAPS 1,27 21/11/2022 Picplast 19/02/2026 Serroplast Plasticultura
LAB Labrunier I LAB 01 ADELSON I-05 1/5 CANDY SNAPS 2,67 01/11/2025 Serroplast Plasticultura
LAB Labrunier I LAB 01 ADELSON I-17 2/B SUGAR CRISP 0,94 21/04/2023 Picplast 06/11/2025 Serroplast Plasticultura
LAB Labrunier I LAB 01 ADELSON I-22 2/E CANDY SNAPS 2,20 05/01/2023 Propex 17/11/2025 Serroplast Plasticultura
BRU Brasil Uvas BRU 01 VANIA I-20 I/4 AUTUMN CRISP 6,02 07/12/2023 Picplast 19/03/2025 Serroplast Plasticultura
BRU Brasil Uvas BRU 01 VANIA I-22 I/6 AUTUMN CRISP 3,83 26/10/2023 Picplast 29/07/2025 Serroplast Plasticultura
BRU Brasil Uvas BRU 01 VANIA I-19 D/3 AUTUMN CRISP 2,00 02/10/2023 Picplast 11/08/2025 Serroplast Plasticultura
BRU Brasil Uvas BRU 01 VANIA I-05 N/5 BEBOP 3,06 09/01/2023 Parling 11/12/2024 Parling 05/08/2026 Serroplast Plasticultura
BRU Brasil Uvas BRU 01 VANIA I-18 D/7 AUTUMN CRISP 5,57 05/11/2022 Propex 28/03/2025 Picplast Serroplast Plasticultura
BRU Brasil Uvas BRU 01 VANIA I-21 I/5 AUTUMN CRISP 5,61 18/11/2022 Propex 24/02/2025 Serroplast Plasticultura
BRU Brasil Uvas BRU 01 VANIA I-10 N/10 CANDY SNAPS 2,50 21/10/2022 Picplast 24/03/2025 Serroplast Plasticultura
BRU Brasil Uvas BRU 01 VANIA I-06 N/6 CANDY SNAPS 3,06 27/01/2023 Picplast 27/10/2025 Serroplast Plasticultura
BRU Brasil Uvas BRU 01 VANIA I-09 N/9 CANDY DREAMS 3,78 29/03/2203 Picplast 20/09/2025 Serroplast Plasticultura
BRU Brasil Uvas BRU 01 VANIA I-08 N/8 CANDY DREAMS 2,11 14/09/2022 Picplast 20/10/2025 Serroplast Plasticultura
BRU Brasil Uvas BRU 02 CLAUDIO II-04 E/4 QUIP 1,30 28/04/2022 Picplast 01/05/2025 Serroplast Plasticultura
BRU Brasil Uvas BRU 02 CLAUDIO II-04 E/4 BEBOP 1,30 28/04/2022 Picplast 01/05/2025 Serroplast Plasticultura
BRU Brasil Uvas BRU 02 CLAUDIO II-09 E/1 TIMPSON 2,15 13/06/2022 Picplast 12/02/2026 Serroplast Plasticultura
BRU Brasil Uvas BRU 02 CLAUDIO II-20 A/1 AUTUMN CRISP 3,10 04/09/2023 Picplast 23/08/2025 Serroplast Plasticultura
BRU Brasil Uvas BRU 02 CLAUDIO II-03 E/5 SUGAR CRISP 2,62 22/01/2026 Serroplast Substituição Tnt 2025
BRU Brasil Uvas BRU 02 CLAUDIO II-02 E/6 SUGAR CRISP 2,56 03/08/2026 Serroplast Substituição Tnt 2026
LBR Labrunier II LBR 01 EDICARLOS I-04 1/4 AUTUMN CRISP 5,24 20/11/2023 Picplast 22/06/2026 Serroplast Plasticultura
LBR Labrunier II LBR 01 EDICARLOS I-07 1/7 AUTUMN CRISP 5,22 02/12/2023 Picplast 01/09/2026 Serroplast Plasticultura
LBR Labrunier II LBR 01 EDICARLOS I-21 1/11 AUTUMN CRISP 5,06 19/12/2023 Picplast 16/09/2026 Serroplast Plasticultura
LBR Labrunier II LBR 01 EDICARLOS I-14 2/4 SUGAR CRISP 4,85 17/09/2025 Serroplast Substituição Tnt 2025
LBR Labrunier II LBR 01 EDICARLOS II-16 2/6 SUGAR CRISP 5,47 Serroplast Substituição Tnt 2026
LBR Labrunier II LBR 01 EDICARLOS I-08 1/8 AUTUMN CRISP 5,46 28/08/2023 Picplast 07/01/2026 Serroplast Plasticultura
LBR Labrunier II LBR 01 EDICARLOS II-17 2/7 CANDY SNAPS 5,13 26/09/2022 Parling 21/07/2025 Serroplast Plasticultura
LBR Labrunier II LBR 01 EDICARLOS I-11 2/1 COTTON CANDY 5,64 07/06/2022 Plastico 07/08/2025 Serroplast Plasticultura
LBR Labrunier II LBR 01 EDICARLOS II-12 2/2 SUGAR CRISP 4,36 12/11/2025 Serroplast Substituição Tnt 2025
LBR Labrunier II LBR 02 LEANDRO II-09 3/9 AUTUMN CRISP 5,47 14/12/2022 Propex 31/05/2024 Picplast Serroplast Plasticultura
LBR Labrunier II LBR 02 LEANDRO III-05 3/5 AUTUMN CRISP 4,80 30/05/2022 Picplast 20/03/2026 Serroplast Plasticultura
LBR Labrunier II LBR 02 LEANDRO III-06 3/6 AUTUMN CRISP 5,04 16/07/2025 Picplast 27/07/2026 Serroplast Plasticultura
LBR Labrunier II LBR 02 LEANDRO II-07 3/7 SUGAR CRISP 5,47 07/08/2026 Serroplast Substituição Tnt 2026
LBR Labrunier II LBR 02 LEANDRO II-01 3/1 SUGAR CRISP 4,75 01/10/2026 Serroplast Substituição Tnt 2026
LBR Labrunier II LBR 02 LEANDRO III-11 4/1 SWEET GLOBE 4,77 11/08/2022 Pic/Prop/Parl 05/10/2026 Serroplast Plasticultura
LBR Labrunier II LBR 02 LEANDRO III-21 3/11 SUGRA 53 5,53 01/09/2025 Serroplast Plasticultura
LBR Labrunier II LBR 02 LEANDRO III-04 3/4 SUGRA 53 5,53 07/10/2025 Serroplast Plasticultura
VDU Vale das Uvas VDU 01 MARCELO V-14 10/4 AUTUMN CRISP 3,75 30/01/2023 Parling 26/08/2025 Serroplast Plasticultura
VDU Vale das Uvas VDU 01 MARCELO V-11 10/1 SUGAR CRISP 4,82 16/08/2022 Picplast Serroplast Plasticultura
VDU Vale das Uvas VDU 01 MARCELO I-05 1/5 AUTUMN CRISP 4,90 05/10/2023 Picplast 04/09/2025 Serroplast Plasticultura
VDU Vale das Uvas VDU 01 MARCELO V-03 9/3 CANDY DREAMS 4,78 27/04/2022 Picplast 15/09/2025 Serroplast Plasticultura
VDU Vale das Uvas VDU 02 ALCIDES I-11 2/1 SUGAR CRISP 4,90 Serroplast Substituição Tnt 2026
VDU Vale das Uvas VDU 02 ALCIDES I-07 1/7 AUTUMN CRISP 4,90 03/06/2022 Propex 04/06/2024 Picplast 26/06/2026 Serroplast Plasticultura
VDU Vale das Uvas VDU 02 ALCIDES II-03 3/3 COTTON CANDY 4,77 03/05/2022 Plastico 10/06/2025 Serroplast Plasticultura
VDU Vale das Uvas VDU 02 ALCIDES II-11 3/11 COTTON CANDY 2,77 05/05/2022 Picplast 25/02/2025 Serroplast Plasticultura
VDU Vale das Uvas VDU 02 ALCIDES II-10 3/10 COTTON CANDY 2,75 06/05/2022 Picplast 20/03/2025 Serroplast Plasticultura
VDU Vale das Uvas VDU 02 ALCIDES II-02 3/2 SUGAR CRISP 4,83 14/09/2026 Serroplast Substituição Tnt 2026
VDU Vale das Uvas VDU 02 ALCIDES I-14 2/4 SUGAR CRISP 5,13 Serroplast Substituição Tnt 2026
VDU Vale das Uvas VDU 02 ALCIDES II-12 3/12 SUGAR CRISP 2,79 23/05/2022 Tecnoflora 07/02/2025 Parling 17/08/2026 Serroplast Plasticultura
VDU Vale das Uvas VDU 02 ALCIDES II-09 3/9 SUGAR CRISP 5,30 14/11/2025 Serroplast Substituição Tnt 2025
VDU Vale das Uvas VDU 03 JOSIVALDO III-06 4/6 AUTUMN CRISP 0,96 10/11/2022 Propex 31/12/2024 Picplast 04/02/2026 Serroplast Plasticultura
VDU Vale das Uvas VDU 03 JOSIVALDO III-10 4/10 AUTUMN CRISP 4,23 18/05/2022 Picplast 28/07/2025 Serroplast Plasticultura
VDU Vale das Uvas VDU 03 JOSIVALDO III-13 4/13 AUTUMN CRISP 5,06 29/09/2022 Picplast 13/08/2025 Serroplast Plasticultura
VDU Vale das Uvas VDU 03 JOSIVALDO III-24 5/4 COTTON CANDY 4,64 25/09/2025 Serroplast Substituição Tnt 2025
VDU Vale das Uvas VDU 03 JOSIVALDO III-04 4/4 COTTON CANDY 3,31 24/02/2022 Picplast 16/09/2025 Serroplast Plasticultura
VDU Vale das Uvas VDU 03 JOSIVALDO III-08 4/8 ARD 36 1,22 03/10/2023 Picplast 27/07/2026 Serroplast Plasticultura
VDU Vale das Uvas VDU 03 JOSIVALDO III-08 4/8 SUGRA 53 1,98 03/10/2023 Picplast 27/07/2026 Serroplast Plasticultura
VDU Vale das Uvas VDU 03 JOSIVALDO III-08 4/8 ALISSON 0,94 03/10/2023 Picplast 27/07/2026 Serroplast Plasticultura
VDU Vale das Uvas VDU 03 JOSIVALDO III-18 5/8 CANDY DREAMS 5,32 04/08/2023 Picplast 07/03/2026 Serroplast Plasticultura
VDU Vale das Uvas VDU 04 FABIANA IV-14 7/4 AUTUMN CRISP 1,02 16/04/2022 Picplast 04/09/2025 Serroplast Plasticultura
VDU Vale das Uvas VDU 04 FABIANA IV-14 7/4 SUGRA 48 1,04 16/04/2022 Picplast 04/09/2025 Serroplast Plasticultura
VDU Vale das Uvas VDU 04 FABIANA IV-15 7/5 SUGAR CRISP 1,89 25/11/2022 Picplast 01/11/2026 Serroplast Plasticultura
VDU Vale das Uvas VDU 04 FABIANA IV-10 8/1 SUGRA 53 3,50 Serroplast Plasticultura
`;

const lines = rawOcr.trim().split('\n').filter(l => l.trim().length > 0);

const records = lines.map((line, idx) => {
  // Let's parse each line with regex or pattern
  // Format:
  // SIGLA FAZENDA_NAME SETOR_FAZENDA SUPERVISOR SETOR_INTERNO PARCELA VARIEDADE AREA_HA REST...
  const tokens = line.trim().split(/\s+/);
  const sigla = tokens[0];
  let farmName = '';
  let tokenIdx = 1;
  if (sigla === 'LAB') {
    farmName = 'Labrunier I';
    tokenIdx = 3; // 'LAB', 'Labrunier', 'I'
  } else if (sigla === 'BRU') {
    farmName = 'Brasil Uvas';
    tokenIdx = 3;
  } else if (sigla === 'LBR') {
    farmName = 'Labrunier II';
    tokenIdx = 3;
  } else if (sigla === 'VDU') {
    farmName = 'Vale das Uvas';
    tokenIdx = 4; // 'VDU', 'Vale', 'das', 'Uvas'
  }

  const setorFazenda = tokens[tokenIdx] + ' ' + tokens[tokenIdx + 1];
  tokenIdx += 2;

  const supervisor = tokens[tokenIdx];
  tokenIdx += 1;

  const setorInterno = tokens[tokenIdx];
  tokenIdx += 1;

  const parcela = tokens[tokenIdx];
  tokenIdx += 1;

  // Now find area token (e.g. "3,51")
  let areaIdx = -1;
  for (let i = tokenIdx; i < tokens.length; i++) {
    if (/^\d+,\d{2}$/.test(tokens[i])) {
      areaIdx = i;
      break;
    }
  }

  const variedade = tokens.slice(tokenIdx, areaIdx).join(' ');
  const areaHa = parseFloat(tokens[areaIdx].replace(',', '.'));

  const restTokens = tokens.slice(areaIdx + 1);
  const restStr = restTokens.join(' ');

  // Parse coverage dates and coverings
  // Patterns observed:
  // 1) "01/12/2025 Serroplast Plasticultura" -> d1: 01/12/2025, c1: Serroplast, d2: '', c2: '', d3: '', c3: '', info: 'Plasticultura'
  // 2) "22/11/2023 Picplast 08/08/2025 Serroplast Plasticultura"
  // 3) "21/07/2022 Picplast 04/01/2024 Propex 28/04/2025 Serroplast Plasticultura"
  // 4) "03/02/2023 Propex Serroplast Plasticultura" -> d1: 03/02/2023, c1: Propex, c2: Serroplast, info: Plasticultura
  // 5) "Serroplast Substituição Tnt 2026" -> d1: '', c1: Serroplast, info: Substituição Tnt 2026
  // 6) "1809/2023 Picplast 24/08/2025 Serroplast Plasticultura" (typo in year 1809 -> 18/09/2023)
  // 7) "29/03/2203 Picplast 20/09/2025 Serroplast Plasticultura" (29/03/2023 or 2203 as in doc)
  // 8) "05/11/2022 Propex 28/03/2025 Picplast Serroplast Plasticultura"
  // 9) "14/12/2022 Propex 31/05/2024 Picplast Serroplast Plasticultura"
  // 10) "16/08/2022 Picplast Serroplast Plasticultura"

  return {
    lineNum: idx + 1,
    sigla,
    farmName,
    setorFazenda,
    supervisor,
    setorInterno,
    parcela,
    variedade,
    areaHa,
    restStr
  };
});

fs.writeFileSync('scripts/parsed_raw.json', JSON.stringify(records, null, 2));
console.log('Saved parsed_raw.json');
