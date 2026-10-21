/* PET Saúde Digital — dashboard funcional com leitura de planilhas Excel.
   Os nomes das colunas são procurados por termos normalizados; valide os indicadores
   com a equipe antes de utilizar os resultados para tomada de decisão. */
const PASTA_DADOS = './dados/';
const ARQUIVOS = {
  gestante: ['dados_gestantes_1.xlsx','dados_gestantes_2.xlsx','dados_gestantes_3.xlsx','dados_gestantes_4.xlsx','dados_gestantes_5.xlsx'],
  infantil: ['desenvolvimento infantil 1.xlsx','desenvolvimento infantil 2.xlsx','desenvolvimento infantil 3.xlsx','desenvolvimento infantil 4.xlsx','desenvolvimento infantil 5.xlsx']
};
const CORES = ['#1976b9','#f07b35','#22a363','#8052c6','#d64c58','#11a6b5','#c39a2e'];
let todosDados = [], dadosAtuais = [], charts = {}, periodoGrafico = 'mensal', colunasVisiveis = null, competenciaSelecionada = 'todos';

const $ = id => document.getElementById(id);
const normalizar = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toUpperCase();
function numero(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const s = String(v ?? '').trim().replace(/\s/g,'').replace('%','').replace(/\.(?=\d{3}(\D|$))/g,'').replace(',','.');
  const n = Number(s); return Number.isFinite(n) ? n : 0;
}
function encontrarColuna(headers, termos) {
  const list = Array.isArray(termos) ? termos : [termos];
  const norm = headers.map(normalizar);
  let idx = norm.findIndex(h => h && list.some(t => h === normalizar(t)));
  if (idx >= 0) return idx;
  return norm.findIndex(h => h && list.every(t => h.includes(normalizar(t))));
}
function primeiroValor(row, headers, termos) {
  const i = encontrarColuna(headers, termos);
  return i < 0 ? '' : (row[i] ?? '');
}
function extrairCompetencia(rows, nomeArquivo) {
  for (const row of rows.slice(0,30)) {
    const text = (row || []).map(x => String(x ?? '')).join(' ');
    const m = text.match(/Compet[eê]ncia(?:\s+selecionada)?\s*:\s*([0-9]{4}[-/][0-9]{1,2}|[0-9]{1,2}[-/][0-9]{4}|[A-Za-zçÇ]+\/?\s*\d{2,4})/i);
    if (m) return m[1].trim();
  }
  const m = nomeArquivo.match(/(\d+)(?=\.xlsx$)/i);
  return m ? `Competência ${m[1]}` : nomeArquivo.replace(/\.xlsx$/i,'');
}
function encontrarCabecalho(rows) {
  for (let i=0; i<Math.min(rows.length,45); i++) {
    const row = rows[i] || [];
    const text = row.map(normalizar).join(' | ');
    if (text.includes('INE') && (text.includes('NOME DA EQUIPE') || text.includes('EQUIPE'))) return i;
  }
  return -1;
}
function mapearPlanilha(rows, tipo, competencia, arquivo) {
  const hidx = encontrarCabecalho(rows);
  if (hidx < 0) throw new Error(`Não foi possível localizar o cabeçalho em ${arquivo}. Verifique se a planilha contém INE e equipe.`);
  const headers = (rows[hidx] || []).map(x => String(x ?? '').trim());
  const dataRows = rows.slice(hidx+1);
  const isGestante = tipo === 'gestante';
  const specs = isGestante ? [
    ['consulta_12sem',['1ª CONSULTA','12ª SEMANA']],['consultas_7',['07 (SETE) CONSULTAS','PERÍODO DA GESTAÇÃO']],
    ['pa_7',['07 (SETE) REGISTRO','PRESSÃO ARTERIAL']],['peso_altura_7',['07 (SETE) REGISTROS SIMULTÂNEOS','PESO E ALTURA']],
    ['visitas_acs_3',['03 (TRÊS) VISITAS DOMICILIARES','ACS/TACS']],['dtpa',['VACINA ACELULAR','DTPA']],
    ['testes_1trim',['TESTES RÁPIDOS','1º TRIMESTRE']],['testes_3trim',['TESTES RÁPIDOS','3º TRIMESTRE']],
    ['consulta_puerperio',['CONSULTA PRESENCIAL OU REMOTA','PUERPÉRIO']],['visita_acs_puerperio',['VISITA DOMICILIAR','DURANTE O PUERPÉRIO']],
    ['saude_bucal',['ATIVIDADE EM SAÚDE BUCAL']],['boas_praticas',['SOMATÓRIO DAS BOAS PRÁTICAS']],
    ['total_pacientes',['Nº TOTAL DE GESTANTES','VINCULADAS À EQUIPE']],['razao',['RAZÃO ENTRE O NUMERADOR E DENOMINADOR']]
  ] : [
    ['consulta_30dias',['1ª CONSULTA','30º DIA']],['consultas_9',['09 (NOVE) CONSULTAS','CRIANÇA']],
    ['peso_altura_9',['09 (NOVE) REGISTROS','PESO E ALTURA']],['visitas_acs_2',['02 (DUAS) VISITAS DOMICILIARES','ACS/TACS']],
    ['vacinas',['VACINAS','CRIANÇA']],['boas_praticas',['SOMATÓRIO DAS BOAS PRÁTICAS']],
    ['total_pacientes',['Nº TOTAL DE CRIANÇAS','VINCULADAS À EQUIPE']],['razao',['RAZÃO ENTRE O NUMERADOR E DENOMINADOR']]
  ];
  const indexes = {
    ine: encontrarColuna(headers,['INE']),
    equipe: encontrarColuna(headers,['NOME DA EQUIPE','EQUIPE']),
    sigla: encontrarColuna(headers,['SIGLA DA EQUIPE']),
    ubs: encontrarColuna(headers,['UBS','NOME DA UBS','UNIDADE BÁSICA DE SAÚDE'])
  };
  if (indexes.equipe < 0) throw new Error(`A coluna de equipe não foi encontrada em ${arquivo}.`);
  const result = [];
  for (const row of dataRows) {
    if (!row || !String(row[indexes.equipe] ?? '').trim()) continue;
    const item = {
      ine: indexes.ine < 0 ? '' : String(row[indexes.ine] ?? '').trim(),
      equipe: String(row[indexes.equipe] ?? '').trim(),
      sigla: indexes.sigla < 0 ? '' : String(row[indexes.sigla] ?? '').trim(),
      ubs: indexes.ubs < 0 ? '' : String(row[indexes.ubs] ?? '').trim(),
      tipo, competencia, arquivo
    };
    for (const [key, terms] of specs) item[key] = numero(primeiroValor(row, headers, terms));
    if (!item.ubs) item.ubs = /sao joaquim/i.test(item.equipe) ? 'UBS São Joaquim' : 'UBS não informada';
    result.push(item);
  }
  if (!result.length) throw new Error(`Nenhum registro de equipe foi encontrado em ${arquivo}.`);
  return result;
}
async function lerArquivo(url, tipo, nome) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Não foi possível abrir ${nome} (${response.status}).`);
  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer,{type:'array'});
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error(`Nenhuma planilha encontrada em ${nome}.`);
  const rows = XLSX.utils.sheet_to_json(sheet,{header:1,defval:''});
  return mapearPlanilha(rows,tipo,extrairCompetencia(rows,nome),nome);
}
async function carregarDados() {
  $('dataStatus').classList.remove('ready');
  $('dataStatus').innerHTML = '<i></i> Carregando planilhas…';
  $('tableBody').innerHTML = '<tr><td colspan="8" class="empty-state">Lendo arquivos Excel…</td></tr>';
  const tipo = $('filterTipo').value;
  const files = ARQUIVOS[tipo];
  const loaded = [], errors = [];
  for (const name of files) {
    try { loaded.push(...await lerArquivo(`${PASTA_DADOS}${encodeURIComponent(name)}`,tipo,name)); }
    catch (e) { errors.push(`${name}: ${e.message}`); }
  }
  todosDados = loaded;
  atualizarFiltros();
  atualizarTela();
  if (loaded.length) {
    $('dataStatus').classList.add('ready');
    $('dataStatus').innerHTML = `<i></i> ${loaded.length} registros carregados`;
    toast(errors.length ? `Carregados ${loaded.length} registros. ${errors.length} arquivo(s) não puderam ser lidos; confira a pasta dados/.` : `${loaded.length} registros carregados com sucesso.`);
  } else {
    $('dataStatus').innerHTML = '<i></i> Dados não carregados';
    $('tableBody').innerHTML = `<tr><td colspan="8" class="empty-state">Não foi possível carregar as planilhas. Confira se os arquivos estão na pasta <b>dados/</b> e abra o projeto por um servidor local ou Netlify.<br><br>${escapeHtml(errors.join(' | '))}</td></tr>`;
    toast('Nenhuma planilha foi carregada. Confira os nomes e caminhos dos arquivos.');
  }
}
function atualizarFiltros() {
  const team = $('filterEquipe'), ubs = $('filterUBS'), mes = $('filterMes');
  const teamVal = team.value, ubsVal = ubs.value, mesVal = mes.value;
  const teams = [...new Set(todosDados.map(d=>d.equipe).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const units = [...new Set(todosDados.map(d=>d.ubs).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const comps = [...new Set(todosDados.map(d=>d.competencia).filter(Boolean))];
  team.innerHTML = '<option value="todas">Todas as equipes</option>'+teams.map(x=>`<option value="${escapeAttr(x)}">${escapeHtml(x)}</option>`).join('');
  ubs.innerHTML = '<option value="todas">Todas as UBSs</option>'+units.map(x=>`<option value="${escapeAttr(x)}">${escapeHtml(x)}</option>`).join('');
  mes.innerHTML = '<option value="todos">Todas as competências</option>'+comps.map(x=>`<option value="${escapeAttr(x)}">${escapeHtml(x)}</option>`).join('');
  if (teams.includes(teamVal)) team.value=teamVal;
  if (units.includes(ubsVal)) ubs.value=ubsVal;
  if (comps.includes(mesVal)) mes.value=mesVal;
}
function filtrarDados() {
  const tipo=$('filterTipo').value, team=$('filterEquipe').value, ubs=$('filterUBS').value, mes=$('filterMes').value;
  return todosDados.filter(d=>d.tipo===tipo&&(team==='todas'||d.equipe===team)&&(ubs==='todas'||d.ubs===ubs)&&(mes==='todos'||d.competencia===mes));
}
function formatarPct(v){return `${Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}%`;}
function formatarNumero(v){return Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:2});}
function badgeClass(v){return v>=40?'ratio-good':v>=20?'ratio-attention':'ratio-critical';}
function atualizarTela() {
  dadosAtuais=filtrarDados();
  const teams=[...new Set(dadosAtuais.map(d=>d.equipe))];
  $('totalEquipes').textContent=teams.length.toLocaleString('pt-BR');
  const patientKey=$('filterTipo').value==='gestante'?'total_pacientes':'total_pacientes';
  const patientTotal=dadosAtuais.reduce((s,d)=>s+(d[patientKey]||0),0);
  $('totalGestantes').textContent=formatarNumero(patientTotal);
  $('patientLabel').textContent=$('filterTipo').value==='gestante'?'Total de gestantes/puérperas':'Total de crianças';
  $('mediaBoasPraticas').textContent=dadosAtuais.length?formatarNumero(dadosAtuais.reduce((s,d)=>s+(d.boas_praticas||0),0)/dadosAtuais.length):'—';
  $('maiorRazao').textContent=dadosAtuais.length?formatarPct(Math.max(...dadosAtuais.map(d=>d.razao||0))):'—';
  $('zeroCount').textContent=dadosAtuais.filter(d=>(d.razao||0)===0).length.toLocaleString('pt-BR');
  $('totalExibido').textContent=`${dadosAtuais.length} registro(s)`;
  $('tableSubtitle').textContent=$('filterMes').value==='todos'?'Todas as competências selecionadas':'Competência: '+$('filterMes').value;
  renderTable(); renderCharts(); renderSummaries();
}
function columnsForType() {
  const common=[['ine','INE'],['ubs','UBS'],['equipe','Equipe'],['total_pacientes',$('filterTipo').value==='gestante'?'Gestantes/Puérperas':'Crianças'],['boas_praticas','Boas práticas'],['razao','Razão (%)']];
  const extra=$('filterTipo').value==='gestante'?
    [['consulta_12sem','1ª consulta até 12ª sem.'],['consultas_7','≥ 7 consultas'],['pa_7','≥ 7 PA'],['peso_altura_7','≥ 7 peso/altura'],['visitas_acs_3','≥ 3 visitas ACS'],['dtpa','DTPa'],['testes_1trim','Testes 1º trim.'],['testes_3trim','Testes 3º trim.'],['consulta_puerperio','Consulta puerpério'],['visita_acs_puerperio','Visita ACS puerpério'],['saude_bucal','Saúde bucal']]:
    [['consulta_30dias','1ª consulta até 30º dia'],['consultas_9','≥ 9 consultas'],['peso_altura_9','≥ 9 peso/altura'],['visitas_acs_2','≥ 2 visitas ACS'],['vacinas','Vacinas']];
  return common.concat(extra);
}
function renderTable() {
  const cols=columnsForType();
  if(!colunasVisiveis) colunasVisiveis=cols.map(c=>c[0]);
  const visible=cols.filter(c=>colunasVisiveis.includes(c[0]));
  $('tableHead').innerHTML='<tr>'+visible.map(c=>`<th data-col="${c[0]}">${escapeHtml(c[1])}</th>`).join('')+'</tr>';
  const query=normalizar($('searchTable').value);
  const rows=dadosAtuais.filter(d=>normalizar(d.equipe+' '+d.ubs+' '+d.ine).includes(query));
  if(!rows.length){$('tableBody').innerHTML=`<tr><td colspan="${visible.length||1}" class="empty-state">Nenhum registro corresponde aos filtros selecionados.</td></tr>`;return;}
  $('tableBody').innerHTML=rows.map(d=>'<tr>'+visible.map(([key])=>{
    const val=d[key]??0;
    if(key==='razao') return `<td><span class="ratio-badge ${badgeClass(Number(val))}">${formatarPct(val)}</span></td>`;
    if(key==='equipe') return `<td><b>${escapeHtml(val)}</b></td>`;
    if(typeof val==='number'&&val===0) return `<td class="zero-cell">0</td>`;
    return `<td>${escapeHtml(typeof val==='number'?formatarNumero(val):String(val||'—'))}</td>`;
  }).join('')+'</tr>').join('');
  $('totalExibido').textContent=`${rows.length} de ${dadosAtuais.length} registro(s)`;
}
function chartBaseOptions(yLabel='Razão (%)') {
  return {responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{boxWidth:9,boxHeight:9,usePointStyle:true,padding:12,font:{size:10}}},tooltip:{callbacks:{label:c=>`${c.dataset.label||''}: ${formatarPct(c.parsed.y??c.parsed.x??0)}`}}},scales:{x:{grid:{display:false},ticks:{font:{size:9},maxRotation:45}},y:{beginAtZero:true,grid:{color:'#eaf0f5'},ticks:{font:{size:9},callback:v=>`${v}%`},title:{display:true,text:yLabel,font:{size:10}}}}};
}
function destroyChart(id){if(charts[id]){charts[id].destroy();delete charts[id];}}
function renderCharts() {
  const byTeam=new Map();
  for(const d of todosDados.filter(d=>d.tipo===$('filterTipo').value)) {
    if($('filterEquipe').value!=='todas'&&d.equipe!==$('filterEquipe').value) continue;
    if($('filterUBS').value!=='todas'&&d.ubs!==$('filterUBS').value) continue;
    if(!byTeam.has(d.equipe)) byTeam.set(d.equipe,new Map());
    byTeam.get(d.equipe).set(d.competencia,d);
  }
  const comps=[...new Set(todosDados.filter(d=>d.tipo===$('filterTipo').value).map(d=>d.competencia))];
  const sortedTeams=[...byTeam.keys()].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  let labels=comps;
  if(periodoGrafico==='trimestral') labels=comps.filter((_,i)=>i%3===2);
  if(periodoGrafico==='semestral') labels=comps.filter((_,i)=>i%6===5);
  const lineSets=sortedTeams.map((team,i)=>({label:team,data:labels.map(c=>byTeam.get(team).get(c)?.razao??null),borderColor:CORES[i%CORES.length],backgroundColor:CORES[i%CORES.length],tension:.3,spanGaps:true,pointRadius:3,borderWidth:2}));
  destroyChart('evolutionChart');
  charts.evolutionChart=new Chart($('evolutionChart'),{type:'line',data:{labels,datasets:lineSets},options:{...chartBaseOptions(),plugins:{...chartBaseOptions().plugins,legend:{position:'bottom',labels:{boxWidth:8,usePointStyle:true,font:{size:9}}}}}});
  const comparison=$('filterMes').value==='todos'?(comps[comps.length-1]):$('filterMes').value;
  const latest=sortedTeams.map(t=>({team:t,d:byTeam.get(t).get(comparison)})).filter(x=>x.d);
  destroyChart('comparisonChart');
  charts.comparisonChart=new Chart($('comparisonChart'),{type:'bar',data:{labels:latest.map(x=>x.team),datasets:[{label:'Razão (%)',data:latest.map(x=>x.d.razao),backgroundColor:latest.map((x,i)=>CORES[i%CORES.length]),borderRadius:4,maxBarThickness:48}]},options:{...chartBaseOptions(),plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>formatarPct(c.parsed.y)}}},scales:{x:{grid:{display:false},ticks:{font:{size:9},maxRotation:30}},y:{beginAtZero:true,grid:{color:'#eaf0f5'},ticks:{font:{size:9},callback:v=>v+'%'}}}}});
  const currentTeamData=latest;
  destroyChart('volumeChart');
  const volumeKey='total_pacientes';
  charts.volumeChart=new Chart($('volumeChart'),{type:'bar',data:{labels:currentTeamData.map(x=>x.team),datasets:[{label:'Quantidade',data:currentTeamData.map(x=>x.d[volumeKey]||0),backgroundColor:currentTeamData.map((x,i)=>CORES[i%CORES.length]),borderRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{font:{size:9},maxRotation:30}},y:{beginAtZero:true,grid:{color:'#eaf0f5'},ticks:{font:{size:9}}}}}});
  const dist=$('distributionList');
  if(!latest.length){dist.innerHTML='<p class="empty-state">Sem dados para os filtros selecionados.</p>';return;}
  dist.innerHTML=latest.sort((a,b)=>(b.d.razao||0)-(a.d.razao||0)).map(({team,d})=>{
    const val=Number(d.razao)||0, color=val>=40?'#22a363':val>=20?'#efb83e':'#e4525b';
    return `<div class="distribution-row"><div class="distribution-name">${escapeHtml(team)}</div><div class="distribution-track"><div class="distribution-fill" style="width:${Math.max(0,Math.min(100,val))}%;background:${color}"></div></div><div class="distribution-value">${formatarPct(val)}</div></div>`;
  }).join('');
}
function renderSummaries() {
  const teams=[...new Set(todosDados.map(d=>d.equipe))].sort();
  const ubs=[...new Set(todosDados.map(d=>d.ubs))].sort();
  $('teamsSummary').innerHTML=teams.length?'<div class="summary-grid">'+teams.map(t=>{const r=todosDados.filter(d=>d.equipe===t);return `<div class="summary-item"><strong>${escapeHtml(t)}</strong><span>${escapeHtml(r[0]?.ubs||'UBS não informada')} · ${r.length} registro(s) carregado(s)</span></div>`}).join('')+'</div>':'<p class="empty-state">Nenhuma equipe identificada.</p>';
  $('ubsSummary').innerHTML=ubs.length?'<div class="summary-grid">'+ubs.map(u=>`<div class="summary-item"><strong>${escapeHtml(u)}</strong><span>${new Set(todosDados.filter(d=>d.ubs===u).map(d=>d.equipe)).size} equipe(s) identificada(s)</span></div>`).join('')+'</div>':'<p class="empty-state">Nenhuma UBS identificada nas planilhas.</p>';
  const names=columnsForType();
  $('indicatorsSummary').innerHTML='<div class="summary-grid">'+names.map(([key,label])=>`<div class="summary-item"><strong>${escapeHtml(label)}</strong><span>Campo de dados: ${escapeHtml(key)}. Confirmar definição e interpretação com a equipe responsável.</span></div>`).join('')+'</div>';
}
function exportarCSV() {
  const cols=columnsForType().filter(c=>!colunasVisiveis||colunasVisiveis.includes(c[0]));
  const rows=dadosAtuais.filter(d=>normalizar(d.equipe+' '+d.ubs+' '+d.ine).includes(normalizar($('searchTable').value)));
  const csv=[cols.map(c=>`"${c[1].replace(/"/g,'""')}"`).join(';'),...rows.map(d=>cols.map(([k])=>`"${String(d[k]??'').replace(/"/g,'""')}"`).join(';'))].join('\r\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob), a=document.createElement('a');a.href=url;a.download='pet-saude-indicadores.csv';a.click();URL.revokeObjectURL(url);
}
function configurarColunas() {
  const el=$('columnChooser'), cols=columnsForType();
  el.hidden=!el.hidden;
  if(!el.hidden) el.innerHTML=cols.map(([key,label])=>`<label><input type="checkbox" data-column="${key}" ${(!colunasVisiveis||colunasVisiveis.includes(key))?'checked':''}> ${escapeHtml(label)}</label>`).join('');
}
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),5000);}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function escapeAttr(s){return escapeHtml(s).replace(/`/g,'&#96;');}
function importarArquivos(files) {
  if(!files.length)return;
  const tipo=$('filterTipo').value;
  const tasks=[...files].map(async file=>{
    const buffer=await file.arrayBuffer(), wb=XLSX.read(buffer,{type:'array'}), sheet=wb.Sheets[wb.SheetNames[0]];
    return mapearPlanilha(XLSX.utils.sheet_to_json(sheet,{header:1,defval:''}),tipo,extrairCompetencia([],file.name),file.name);
  });
  Promise.allSettled(tasks).then(results=>{
    const ok=results.filter(r=>r.status==='fulfilled').flatMap(r=>r.value);
    const fail=results.filter(r=>r.status==='rejected');
    todosDados=todosDados.filter(d=>d.tipo!==tipo||!ok.some(n=>n.arquivo===d.arquivo)).concat(ok);
    atualizarFiltros();atualizarTela();
    toast(`${ok.length} registro(s) importados.${fail.length?` ${fail.length} arquivo(s) apresentaram erro.`:''}`);
  });
}
function navegar(section) {
  document.querySelectorAll('.content').forEach(el=>el.hidden=true);
  const el=$(section);if(el)el.hidden=false;
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.section===section));
  $('sidebar').classList.remove('open');
  if(section==='comparativos') renderComparativos();
  if(section==='equipes') $('teamsSummary').scrollIntoView({behavior:'smooth',block:'start'});
}
document.querySelectorAll('.nav-item[data-section]').forEach(b=>b.addEventListener('click',()=>navegar(b.dataset.section)));
$('navImportar').addEventListener('click',()=>$('fileInput').click());
$('btnImportar').addEventListener('click',()=>$('fileInput').click());
$('fileInput').addEventListener('change',e=>importarArquivos(e.target.files));
$('filterTipo').addEventListener('change',()=>{colunasVisiveis=null;carregarDados();});
['filterEquipe','filterUBS','filterMes'].forEach(id=>$(id).addEventListener('change',atualizarTela));
$('searchTable').addEventListener('input',renderTable);
$('exportCsv').addEventListener('click',exportarCSV);
$('toggleColumns').addEventListener('click',configurarColunas);
$('columnChooser').addEventListener('change',e=>{if(!e.target.matches('input[data-column]'))return;const key=e.target.dataset.column;if(!colunasVisiveis)colunasVisiveis=columnsForType().map(c=>c[0]);colunasVisiveis=e.target.checked?[...new Set([...colunasVisiveis,key])]:colunasVisiveis.filter(x=>x!==key);renderTable();});
$('chartPeriod').addEventListener('click',e=>{const btn=e.target.closest('button[data-period]');if(!btn)return;periodoGrafico=btn.dataset.period;document.querySelectorAll('#chartPeriod button').forEach(b=>b.classList.toggle('selected',b===btn));renderCharts();});
$('mobileMenu').addEventListener('click',()=>$('sidebar').classList.toggle('open'));
window.addEventListener('resize',()=>{if(window.innerWidth>720)$('sidebar').classList.remove('open');});
carregarDados();

/* Página Comparativos: independente dos gráficos da Visão Geral. */
function atualizarCompetenciasComparativas(){
  const tipo=$('compareTipo').value;
  const comps=[...new Set(todosDados.filter(d=>d.tipo===tipo).map(d=>d.competencia))];
  const anterior=$('compareMes').value;
  $('compareMes').innerHTML='<option value="todos">Última disponível</option>'+comps.map(c=>`<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');
  if(comps.includes(anterior)) $('compareMes').value=anterior;
}
function renderComparativos(){
  if($('comparativos').hidden)return;
  const tipo=$('compareTipo').value;
  const data=todosDados.filter(d=>d.tipo===tipo);
  const comps=[...new Set(data.map(d=>d.competencia))];
  const competencia=$('compareMes').value==='todos'?comps[comps.length-1]:$('compareMes').value;
  const rows=data.filter(d=>d.competencia===competencia).sort((a,b)=>b.razao-a.razao);
  $('compareBody').innerHTML=rows.length?rows.map(d=>`<tr><td>${escapeHtml(d.equipe)}</td><td>${escapeHtml(d.ubs)}</td><td>${escapeHtml(d.competencia)}</td><td><span class="ratio-badge ${badgeClass(d.razao)}">${formatarPct(d.razao)}</span></td><td>${d.razao>=40?'≥ 40%':d.razao>=20?'20–39,99%':'< 20%'}</td></tr>`).join(''):'<tr><td colspan="5" class="empty-state">Nenhum registro disponível para a competência selecionada.</td></tr>';
  destroyChart('compareBars');destroyChart('compareLines');
  charts.compareBars=new Chart($('compareBars'),{type:'bar',data:{labels:rows.map(d=>d.equipe),datasets:[{label:'Razão (%)',data:rows.map(d=>d.razao),backgroundColor:rows.map((d,i)=>CORES[i%CORES.length]),borderRadius:4}]},options:{...chartBaseOptions(),plugins:{legend:{display:false}}}});
  const equipes=[...new Set(data.map(d=>d.equipe))];
  charts.compareLines=new Chart($('compareLines'),{type:'line',data:{labels:comps,datasets:equipes.map((nome,i)=>({label:nome,data:comps.map(c=>data.find(d=>d.equipe===nome&&d.competencia===c)?.razao??null),borderColor:CORES[i%CORES.length],backgroundColor:CORES[i%CORES.length],tension:.25,spanGaps:true}))},options:chartBaseOptions()});
}
$('compareTipo').addEventListener('change',()=>{atualizarCompetenciasComparativas();renderComparativos();});
$('compareMes').addEventListener('change',renderComparativos);
const _atualizarTelaOriginal=atualizarTela;
atualizarTela=function(){_atualizarTelaOriginal();atualizarCompetenciasComparativas();if(!$('comparativos').hidden)renderComparativos();};
