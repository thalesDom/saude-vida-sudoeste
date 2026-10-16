// Converte a tabela de preços (CSV) em dados/precos.json, aplicando a regra comercial:
//   preço associado = valor negociado com o parceiro × 1,10 (arredondado em centavos)
// O valor negociado NÃO vai para o site; só o preço final ao associado e o valor de balcão.
//
// Uso:  node ferramentas/atualizar-precos.js [ferramentas/precos.csv]
// CSV separado por ";" (padrão do Excel em português), com o cabeçalho de ferramentas/modelo-precos.csv.
// Valores aceitam "1.234,56", "1234,56" ou "1234.56". Valor de balcão vazio = não exibido (não estimar).

const fs = require('fs');
const path = require('path');

const MARGEM = 1.10;
const CATEGORIAS = ['Consultas médicas', 'Exames laboratoriais', 'Diagnóstico por imagem', 'Serviços hospitalares'];
const raiz = path.join(__dirname, '..');
const entrada = process.argv[2] || path.join(__dirname, 'precos.csv');
const saida = path.join(raiz, 'dados', 'precos.json');

function lerCSV(texto) {
  const linhas = [];
  let campo = '', linha = [], aspas = false;
  texto = texto.replace(/^﻿/, '');
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ';') { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo); linhas.push(linha); linha = []; campo = '';
    } else campo += c;
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas.filter(l => l.some(v => v.trim()));
}

function numero(v) {
  v = String(v || '').replace(/R\$|\s/g, '');
  if (!v) return null;
  if (v.includes(',')) v = v.replace(/\./g, '').replace(',', '.');
  const n = Number(v);
  return isFinite(n) && n > 0 ? n : NaN;
}

if (!fs.existsSync(entrada)) {
  console.error(`Arquivo não encontrado: ${entrada}\nCopie ferramentas/modelo-precos.csv para ferramentas/precos.csv e preencha.`);
  process.exit(1);
}

const [cab, ...linhas] = lerCSV(fs.readFileSync(entrada, 'utf8'));
const col = Object.fromEntries(cab.map((c, i) => [c.trim().toLowerCase(), i]));
for (const obrig of ['categoria', 'nome', 'prestador', 'valor_negociado']) {
  if (!(obrig in col)) { console.error(`Coluna obrigatória ausente: ${obrig}`); process.exit(1); }
}

const erros = [], itens = [];
linhas.forEach((l, i) => {
  const v = k => (k in col ? (l[col[k]] || '').trim() : '');
  const n = i + 2;
  const categoria = CATEGORIAS.find(c => c.toLowerCase() === v('categoria').toLowerCase());
  const negociado = numero(v('valor_negociado')), balcao = numero(v('valor_balcao'));
  if (!categoria) erros.push(`linha ${n}: categoria "${v('categoria')}" inválida (use: ${CATEGORIAS.join(', ')})`);
  if (!v('nome')) erros.push(`linha ${n}: nome vazio`);
  if (!v('prestador')) erros.push(`linha ${n}: prestador vazio`);
  if (!negociado) erros.push(`linha ${n}: valor_negociado vazio ou inválido`);
  if (Number.isNaN(balcao)) erros.push(`linha ${n}: valor_balcao inválido`);
  if (!categoria || !v('nome') || !v('prestador') || !negociado || Number.isNaN(balcao)) return;
  const item = { categoria, nome: v('nome'), prestador: v('prestador'), preco_associado: Math.round(negociado * MARGEM * 100) / 100 };
  if (v('especialidade')) item.especialidade = v('especialidade');
  if (balcao) item.valor_balcao = balcao;
  if (v('agendamento')) item.agendamento = v('agendamento');
  if (v('observacao')) item.observacao = v('observacao');
  if (balcao && item.preco_associado >= balcao) console.warn(`aviso linha ${n}: preço associado (${item.preco_associado}) não é menor que o de balcão (${balcao})`);
  itens.push(item);
});

if (erros.length) { console.error('Corrija o CSV:\n- ' + erros.join('\n- ')); process.exit(1); }

const hoje = new Date();
const data = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
fs.writeFileSync(saida, JSON.stringify({ atualizado_em: data, itens }, null, 2) + '\n');
console.log(`${itens.length} itens gravados em dados/precos.json (preço associado = negociado × ${MARGEM.toFixed(2).replace('.', ',')}).`);
