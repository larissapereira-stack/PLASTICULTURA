const fs = require('fs');
const records = JSON.parse(fs.readFileSync('scripts/parsed_raw.json', 'utf8'));

const coverageTypes = ['Serroplast', 'Picplast', 'Plastico', 'Propex', 'Parling', 'Pic/Prop/Parl', 'Tecnoflora'];

const parsed = records.map(r => {
  let rest = r.restStr.trim();
  
  // Extract info at the end
  let info = '';
  if (rest.includes('Substituição Tnt 2026')) {
    info = 'Substituição Tnt 2026';
    rest = rest.replace('Substituição Tnt 2026', '').trim();
  } else if (rest.includes('Substituição Tnt 2025')) {
    info = 'Substituição Tnt 2025';
    rest = rest.replace('Substituição Tnt 2025', '').trim();
  } else if (rest.includes('Estrutura de plasticutura')) {
    info = 'Estrutura de plasticutura';
    rest = rest.replace('Estrutura de plasticutura', '').trim();
  } else if (rest.includes('Plasticultura')) {
    info = 'Plasticultura';
    rest = rest.replace('Plasticultura', '').trim();
  }

  // Now parse tokens from rest
  const tokens = rest.split(/\s+/).filter(t => t.length > 0);
  
  let data1 = '';
  let cob1 = '';
  let data2 = '';
  let cob2 = '';
  let data3 = '';
  let cob3 = '';

  // Helper: check if token is date-like (contains /)
  const isDate = (t) => /^\d{2,4}\/\d{2}\/\d{2,4}$/.test(t) || /^\d{4}\/\d{4}$/.test(t) || t === '1809/2023';

  // Let's parse tokens sequentially
  let i = 0;
  if (i < tokens.length && isDate(tokens[i])) {
    data1 = tokens[i];
    i++;
  }
  if (i < tokens.length && !isDate(tokens[i])) {
    cob1 = tokens[i];
    i++;
  }
  if (i < tokens.length && isDate(tokens[i])) {
    data2 = tokens[i];
    i++;
  }
  if (i < tokens.length && !isDate(tokens[i])) {
    cob2 = tokens[i];
    i++;
  }
  if (i < tokens.length && isDate(tokens[i])) {
    data3 = tokens[i];
    i++;
  }
  if (i < tokens.length && !isDate(tokens[i])) {
    cob3 = tokens[i];
    i++;
  }
  // Check if any remaining tokens
  if (i < tokens.length) {
    console.warn(`Line ${r.lineNum} has remaining tokens:`, tokens.slice(i));
  }

  return {
    id: `serro-${r.sigla.toLowerCase()}-${String(r.lineNum).padStart(3, '0')}`,
    sigla: r.sigla,
    fazendaNome: r.farmName,
    setorFazenda: r.setorFazenda,
    supervisor: r.supervisor,
    setorInterno: r.setorInterno,
    parcela: r.parcela,
    variedade: r.variedade,
    areaHa: r.areaHa,
    data1,
    cobertura1: cob1,
    data2,
    cobertura2: cob2,
    data3,
    cobertura3: cob3,
    informacao: info,
    ativo: true,
    dataImportacao: new Date().toISOString()
  };
});

fs.writeFileSync('scripts/parsed_structured.json', JSON.stringify(parsed, null, 2));
console.log('Successfully structured 77 records.');
