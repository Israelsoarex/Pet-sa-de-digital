// ============================================================
// CONFIGURAÇÕES
// ============================================================
const PASTA_DADOS = './dados/';

const ARQUIVOS = {
    gestante: [
        'gestante_0.xlsx',
        'gestante_1.xlsx',
        'gestante_2.xlsx',
        'gestante_3.xlsx',
        'gestante_4.xlsx'
    ],
    infantil: [
        'desenvolvimento infantil 1.xlsx',
        'desenvolvimento infantil 2.xlsx',
        'desenvolvimento infantil 3.xlsx',
        'desenvolvimento infantil 4.xlsx',
        'desenvolvimento infantil 5.xlsx'
    ]
};

// Estado global
let dadosAtuais = [];
let competenciaAtual = '';

// ============================================================
// REFERÊNCIAS DOM
// ============================================================
const filterTipo = document.getElementById('filterTipo');
const filterMes = document.getElementById('filterMes');
const filterEquipe = document.getElementById('filterEquipe');
const tableBody = document.getElementById('tableBody');
const barChart = document.getElementById('barChart');
const totalEquipes = document.getElementById('totalEquipes');
const totalPacientes = document.getElementById('totalPacientes');
const mediaBoasPraticas = document.getElementById('mediaBoasPraticas');
const maiorRazao = document.getElementById('maiorRazao');
const totalExibido = document.getElementById('totalExibido');
const competenciaDisplay = document.getElementById('competenciaDisplay');
const loadingDiv = document.getElementById('loading');

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================
function formatarRazao(valor) {
    if (isNaN(valor)) return '0,00%';
    return valor.toFixed(2).replace('.', ',') + '%';
}

function getBadgeClass(valor) {
    if (valor >= 40) return 'green';
    if (valor >= 30) return 'orange';
    return 'red';
}

function extrairCompetencia(linhas) {
    for (let i = 0; i < Math.min(linhas.length, 25); i++) {
        const linha = linhas[i];
        if (linha && linha.length > 0) {
            const texto = String(linha[0] || '').toLowerCase();
            if (texto.includes('competência') || texto.includes('competencia')) {
                const match = String(linha[0]).match(/Compet[eê]ncia selecionada:\s*([^\s]+)/i);
                if (match) {
                    return match[1].trim();
                }
                const partes = String(linha[0]).split(':');
                if (partes.length > 1) {
                    return partes[1].trim();
                }
            }
        }
    }
    return 'N/A';
}

function mapearDadosGestante(rows, cabecalho) {
    const resultados = [];
    const idx = {
        ine: cabecalho.indexOf('INE'),
        equipe: cabecalho.indexOf('NOME DA EQUIPE'),
        sigla: cabecalho.indexOf('SIGLA DA EQUIPE'),
        consulta_12sem: cabecalho.indexOf('TER A 1ª CONSULTA PRESENCIAL OU REMOTA REALIZADA POR MÉDICA(O) OU ENFERMEIRA(O), ATÉ A 12ª SEMANA DE GESTAÇÃO.'),
        consultas_7: cabecalho.indexOf('TER PELO MENOS 07 (SETE) CONSULTAS PRESENCIAIS OU REMOTAS REALIZADAS POR MÉDICA(O) OU ENFERMEIRA(O) DURANTE O PERÍODO DA GESTAÇÃO.'),
        pa_7: cabecalho.indexOf('TER PELO MENOS 07 (SETE) REGISTRO DE AFERIÇÃO DE PRESSÃO ARTERIAL REALIZADOS DURANTE O PERÍODO DA GESTAÇÃO.'),
        peso_altura_7: cabecalho.indexOf('TER PELO MENOS 07 (SETE) REGISTROS SIMULTÂNEOS DE PESO E ALTURA DURANTE O PERÍODO DA GESTAÇÃO.'),
        visitas_acs_3: cabecalho.indexOf('TER PELO MENOS 03 (TRÊS) VISITAS DOMICILIARES REALIZADAS POR ACS/TACS, APÓS A PRIMEIRA CONSULTA DO PRÉ-NATAL.'),
        dtpa: cabecalho.indexOf('TER VACINA ACELULAR CONTRA DIFTERIA, TÉTANO, COQUELUCHE (DTPA) REGISTRADA A PARTIR DA 20ª SEMANA DE CADA GESTAÇÃO.'),
        testes_1trim: cabecalho.indexOf('TER REGISTRO DOS TESTES RÁPIDOS OU DOS EXAMES AVALIADOS PARA SÍFILIS, HIV E HEPATITES B E C REALIZADOS NO 1º TRIMESTRE DE CADA GESTAÇÃO.'),
        testes_3trim: cabecalho.indexOf('TER REGISTRO DOS TESTES RÁPIDOS OU DOS EXAMES AVALIADOS PARA SÍFILIS E HIV REALIZADOS NO 3º TRIMESTRE DE CADA GESTAÇÃO.'),
        consulta_puerperio: cabecalho.indexOf('TER PELO MENOS 01 REGISTRO DE CONSULTA PRESENCIAL OU REMOTA REALIZADA POR MÉDICA(O) OU ENFERMEIRA(O) DURANTE O PUERPÉRIO.'),
        visita_acs_puerperio: cabecalho.indexOf('TER PELO MENOS 01 VISITA DOMICILIAR REALIZADA POR ACS/TACS DURANTE O PUERPÉRIO.'),
        saude_bucal: cabecalho.indexOf('TER PELO MENOS 01 ATIVIDADE EM SAÚDE BUCAL REALIZADA POR CIRURGIÃ(ÃO) DENTISTA OU TÉCNICA(O) DE SAÚDE BUCAL DURANTE O PERÍODO DA GESTAÇÃO.'),
        boas_praticas: cabecalho.indexOf('SOMATÓRIO DAS BOAS PRÁTICAS PONTUADAS PARA A PESSOA GESTANTE E PUÉRPERA, DURANTE CADA GESTAÇÃO'),
        total_pacientes: cabecalho.indexOf('Nº TOTAL DE GESTANTES E PUÉRPERAS VINCULADAS À EQUIPE NO PERÍODO.'),
        razao: cabecalho.indexOf('RAZÃO ENTRE O NUMERADOR E DENOMINADOR')
    };

    rows.forEach(row => {
        if (!row || row.length === 0 || !row[idx.equipe]) return;
        const equipe = String(row[idx.equipe] || '').trim();
        if (!equipe || equipe === '') return;

        const razao = parseFloat(String(row[idx.razao] || '0').replace(',', '.')) || 0;
        const total = parseInt(row[idx.total_pacientes]) || 0;

        resultados.push({
            ine: String(row[idx.ine] || '').trim(),
            equipe: equipe,
            sigla: String(row[idx.sigla] || '').trim(),
            consulta_12sem: parseInt(row[idx.consulta_12sem]) || 0,
            consultas_7: parseInt(row[idx.consultas_7]) || 0,
            pa_7: parseInt(row[idx.pa_7]) || 0,
            peso_altura_7: parseInt(row[idx.peso_altura_7]) || 0,
            visitas_acs_3: parseInt(row[idx.visitas_acs_3]) || 0,
            dtpa: parseInt(row[idx.dtpa]) || 0,
            testes_1trim: parseInt(row[idx.testes_1trim]) || 0,
            testes_3trim: parseInt(row[idx.testes_3trim]) || 0,
            consulta_puerperio: parseInt(row[idx.consulta_puerperio]) || 0,
            visita_acs_puerperio: parseInt(row[idx.visita_acs_puerperio]) || 0,
            saude_bucal: parseInt(row[idx.saude_bucal]) || 0,
            boas_praticas: parseInt(row[idx.boas_praticas]) || 0,
            total_pacientes: total,
            razao: razao,
            tipo: 'gestante'
        });
    });

    return resultados;
}

function mapearDadosInfantil(rows, cabecalho) {
    const resultados = [];
    const idx = {
        ine: cabecalho.indexOf('INE'),
        equipe: cabecalho.indexOf('NOME DA EQUIPE'),
        sigla: cabecalho.indexOf('SIGLA DA EQUIPE'),
        consulta_30dias: cabecalho.indexOf('TER A 1ª CONSULTA PRESENCIAL REALIZADA POR MÉDICA(O) OU ENFERMEIRA(O), ATÉ O 30º DIA DE VIDA'),
        consultas_9: cabecalho.indexOf('TER PELO MENOS 09 (NOVE) CONSULTAS PRESENCIAIS OU REMOTAS REALIZADAS POR MÉDICA (O) OU ENFERMEIRA(O) ATÉ DOIS ANOS DE VIDA'),
        peso_altura_9: cabecalho.indexOf('TER PELO MENOS 09 (NOVE) REGISTROS SIMULTÂNEOS DE PESO E ALTURA ATÉ OS DOIS ANOS DE VIDA'),
        visitas_acs_2: cabecalho.indexOf('TER PELO MENOS 02 (DUAS) VISITAS DOMICILIARES REALIZADAS POR ACS/TACS, SENDO A PRIMEIRA ATÉ OS PRIMEIROS 30 (TRINTA) DIAS DE VIDA E A SEGUNDA ATÉ OS 06 (SEIS) MESES DE VIDA'),
        vacinas: cabecalho.indexOf('TER VACINAS CONTRA DIFTERIA, TÉTANO, COQUELUCHE, HEPATITE B, INFECÇÕES CAUSADAS POR HAEMOPHILUS INFLUENZAE TIPO B, POLIOMIELITE, SARAMPO, CAXUMBA E RUBÉOLA, PNEUMOCÓCICA, REGISTRADAS COM TODAS AS DOSES RECOMENDADAS'),
        boas_praticas: cabecalho.indexOf('SOMATÓRIO DAS BOAS PRÁTICAS PONTUADAS PARA CADA CRIANÇA COM ATÉ 02 (DOIS) ANOS DE VIDA DURANTE O ACOMPANHAMENTO DO DESENVOLVIMENTO INFANTIL.'),
        total_pacientes: cabecalho.indexOf('Nº TOTAL DE CRIANÇAS COM ATÉ 02 (DOIS) ANOS DE VIDA VINCULADAS À EQUIPE NO PERÍODO'),
        razao: cabecalho.indexOf('RAZÃO ENTRE O NUMERADOR E DENOMINADOR')
    };

    rows.forEach(row => {
        if (!row || row.length === 0 || !row[idx.equipe]) return;
        const equipe = String(row[idx.equipe] || '').trim();
        if (!equipe || equipe === '') return;

        const razao = parseFloat(String(row[idx.razao] || '0').replace(',', '.')) || 0;
        const total = parseInt(row[idx.total_pacientes]) || 0;

        resultados.push({
            ine: String(row[idx.ine] || '').trim(),
            equipe: equipe,
            sigla: String(row[idx.sigla] || '').trim(),
            consulta_30dias: parseInt(row[idx.consulta_30dias]) || 0,
            consultas_9: parseInt(row[idx.consultas_9]) || 0,
            peso_altura_9: parseInt(row[idx.peso_altura_9]) || 0,
            visitas_acs_2: parseInt(row[idx.visitas_acs_2]) || 0,
            vacinas: parseInt(row[idx.vacinas]) || 0,
            boas_praticas: parseInt(row[idx.boas_praticas]) || 0,
            total_pacientes: total,
            razao: razao,
            tipo: 'infantil'
        });
    });

    return resultados;
}

// ============================================================
// CARREGAR ARQUIVO VIA BLOB URL (MÉTODO ALTERNATIVO)
// ============================================================
function carregarArquivoViaBlob(tipo, indice) {
    return new Promise((resolve, reject) => {
        const nomeArquivo = ARQUIVOS[tipo][indice];
        const caminho = PASTA_DADOS + nomeArquivo;

        console.log('Tentando carregar:', caminho);

        // Tenta com fetch primeiro
        fetch(caminho)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Arquivo não encontrado: ${nomeArquivo}`);
                }
                return response.arrayBuffer();
            })
            .then(buffer => {
                processarArquivo(buffer, tipo, nomeArquivo, resolve, reject);
            })
            .catch(error => {
                // Se falhar, tenta criar um input escondido para carregar
                console.warn('Fetch falhou, tentando método alternativo...', error);
                carregarViaInputOculto(tipo, indice, resolve, reject);
            });
    });
}

function processarArquivo(buffer, tipo, nomeArquivo, resolve, reject) {
    try {
        const workbook = XLSX.read(buffer, { type: 'array' });
        const primeiraPlanilha = workbook.Sheets[workbook.SheetNames[0]];
        const dados = XLSX.utils.sheet_to_json(primeiraPlanilha, { header: 1 });

        const competencia = extrairCompetencia(dados);

        let linhaCabecalho = -1;
        for (let i = 0; i < Math.min(dados.length, 30); i++) {
            const linha = dados[i];
            if (linha && linha.length > 0) {
                const texto = String(linha[0] || '').toUpperCase();
                if (texto.includes('CNES') || texto.includes('INE')) {
                    linhaCabecalho = i;
                    break;
                }
            }
        }

        if (linhaCabecalho === -1) {
            reject('Cabeçalho não encontrado no arquivo');
            return;
        }

        const cabecalho = dados[linhaCabecalho].map(col => String(col || '').trim());
        const dadosLinhas = dados.slice(linhaCabecalho + 1);

        let resultados;
        if (tipo === 'gestante') {
            resultados = mapearDadosGestante(dadosLinhas, cabecalho);
        } else {
            resultados = mapearDadosInfantil(dadosLinhas, cabecalho);
        }

        resolve({
            dados: resultados,
            competencia: competencia,
            arquivo: nomeArquivo
        });
    } catch (error) {
        reject(error);
    }
}

function carregarViaInputOculto(tipo, indice, resolve, reject) {
    // Cria um input file escondido
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) {
            reject('Nenhum arquivo selecionado');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const data = new Uint8Array(ev.target.result);
                processarArquivo(data, tipo, file.name, resolve, reject);
            } catch (error) {
                reject(error);
            }
        };
        reader.readAsArrayBuffer(file);
        document.body.removeChild(input);
    };

    // Simula o clique para abrir o seletor de arquivos
    input.click();
}

// ============================================================
// CARREGAR TODOS OS ARQUIVOS
// ============================================================
async function carregarTodosArquivos(tipo) {
    loadingDiv.style.display = 'block';
    loadingDiv.innerHTML = '🔄 Carregando dados... Aguarde.';
    loadingDiv.style.color = '#2c3e50';

    try {
        const promessas = [];
        for (let i = 0; i < ARQUIVOS[tipo].length; i++) {
            promessas.push(carregarArquivoViaBlob(tipo, i));
        }

        const resultados = await Promise.allSettled(promessas);
        
        const falhas = resultados.filter(r => r.status === 'rejected');
        if (falhas.length === ARQUIVOS[tipo].length) {
            loadingDiv.innerHTML = `
                ⚠️ Não foi possível carregar os arquivos automaticamente.<br>
                <span style="font-size: 13px; opacity: 0.7;">
                    Clique no botão abaixo e selecione os arquivos da pasta <strong>dados/</strong>
                </span>
                <br><br>
                <input type="file" id="fileInput" multiple accept=".xlsx,.xls" style="padding: 8px; border: 1px solid #dce1e8; border-radius: 8px;">
                <button onclick="carregarArquivosSelecionados()" style="padding: 8px 20px; background: #2e86c1; color: white; border: none; border-radius: 8px; cursor: pointer; margin-left: 10px;">
                    📂 Carregar Selecionados
                </button>
            `;
            loadingDiv.style.display = 'block';
            return;
        }

        const todosDados = [];
        let competencia = '';
        resultados.forEach(result => {
            if (result.status === 'fulfilled') {
                todosDados.push(...result.value.dados);
                if (!competencia && result.value.competencia !== 'N/A') {
                    competencia = result.value.competencia;
                }
            }
        });

        dadosAtuais = todosDados;
        competenciaAtual = competencia || 'Mês não identificado';
        
        atualizarMeses(tipo);
        filterMes.value = '0';
        
        // Carregar o primeiro mês
        const resultado = await carregarArquivoViaBlob(tipo, 0);
        dadosAtuais = resultado.dados;
        competenciaAtual = resultado.competencia || `Mês 1`;
        
        loadingDiv.style.display = 'none';
        popularFiltros();
        render('todas');
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        loadingDiv.innerHTML = '❌ Erro ao carregar dados. Tente selecionar os arquivos manualmente.';
        loadingDiv.style.color = '#e74c3c';
    }
}

// ============================================================
// CARREGAR ARQUIVOS SELECIONADOS MANUALMENTE
// ============================================================
window.carregarArquivosSelecionados = async function() {
    const input = document.getElementById('fileInput');
    if (!input || input.files.length === 0) {
        alert('Selecione pelo menos um arquivo Excel.');
        return;
    }

    loadingDiv.style.display = 'block';
    loadingDiv.innerHTML = '🔄 Carregando arquivos selecionados...';
    loadingDiv.style.color = '#2c3e50';

    try {
        const todosDados = [];
        let competencia = '';

        for (const file of input.files) {
            const data = await file.arrayBuffer();
            const tipo = file.name.toLowerCase().includes('gestante') ? 'gestante' : 'infantil';
            
            const workbook = XLSX.read(data, { type: 'array' });
            const primeiraPlanilha = workbook.Sheets[workbook.SheetNames[0]];
            const dados = XLSX.utils.sheet_to_json(primeiraPlanilha, { header: 1 });

            const comp = extrairCompetencia(dados);
            if (!competencia && comp !== 'N/A') competencia = comp;

            let linhaCabecalho = -1;
            for (let i = 0; i < Math.min(dados.length, 30); i++) {
                const linha = dados[i];
                if (linha && linha.length > 0) {
                    const texto = String(linha[0] || '').toUpperCase();
                    if (texto.includes('CNES') || texto.includes('INE')) {
                        linhaCabecalho = i;
                        break;
                    }
                }
            }

            if (linhaCabecalho === -1) continue;

            const cabecalho = dados[linhaCabecalho].map(col => String(col || '').trim());
            const dadosLinhas = dados.slice(linhaCabecalho + 1);

            let resultados;
            if (tipo === 'gestante') {
                resultados = mapearDadosGestante(dadosLinhas, cabecalho);
            } else {
                resultados = mapearDadosInfantil(dadosLinhas, cabecalho);
            }
            todosDados.push(...resultados);
        }

        dadosAtuais = todosDados;
        competenciaAtual = competencia || 'Arquivos carregados';

        popularFiltros();
        render('todas');
        
        loadingDiv.innerHTML = '✅ Dados carregados com sucesso!';
        loadingDiv.style.color = '#27ae60';
        setTimeout(() => {
            loadingDiv.style.display = 'none';
        }, 1500);

    } catch (error) {
        console.error('Erro:', error);
        loadingDiv.innerHTML = '❌ Erro ao carregar os arquivos.';
        loadingDiv.style.color = '#e74c3c';
    }
};

// ============================================================
// ATUALIZAR DROPDOWN DE MESES
// ============================================================
function atualizarMeses(tipo) {
    filterMes.innerHTML = '';
    const arquivos = ARQUIVOS[tipo];
    arquivos.forEach((nome, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        const num = index + 1;
        opt.textContent = `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} - Mês ${num}`;
        filterMes.appendChild(opt);
    });
}

// ============================================================
// FILTRAR POR MÊS
// ============================================================
function filtrarPorMes() {
    const mesIndex = parseInt(filterMes.value);
    const tipo = filterTipo.value;
    carregarArquivoEspecifico(tipo, mesIndex);
}

async function carregarArquivoEspecifico(tipo, indice) {
    loadingDiv.style.display = 'block';
    loadingDiv.textContent = '🔄 Carregando mês selecionado...';
    loadingDiv.style.color = '#2c3e50';
    
    try {
        const resultado = await carregarArquivoViaBlob(tipo, indice);
        dadosAtuais = resultado.dados;
        competenciaAtual = resultado.competencia || `Mês ${indice + 1}`;
        
        loadingDiv.style.display = 'none';
        
        popularFiltros();
        render('todas');
        
    } catch (error) {
        console.error('Erro ao carregar mês:', error);
        loadingDiv.innerHTML = '❌ Erro ao carregar o mês selecionado. Tente usar o botão de carregar arquivos.';
        loadingDiv.style.color = '#e74c3c';
    }
}

// ============================================================
// RENDER
// ============================================================
function render(equipeFiltro = 'todas') {
    const filtrados = equipeFiltro === 'todas'
        ? dadosAtuais
        : dadosAtuais.filter(d => d.equipe === equipeFiltro);

    const totalEq = filtrados.length;
    const totalPac = filtrados.reduce((acc, d) => acc + (d.total_pacientes || 0), 0);
    const mediaBP = filtrados.length > 0
        ? (filtrados.reduce((acc, d) => acc + (d.boas_praticas || 0), 0) / filtrados.length)
        : 0;
    const maiorRaz = filtrados.length > 0
        ? Math.max(...filtrados.map(d => d.razao || 0))
        : 0;

    totalEquipes.textContent = totalEq;
    totalPacientes.textContent = totalPac;
    mediaBoasPraticas.textContent = mediaBP.toFixed(0);
    maiorRazao.textContent = formatarRazao(maiorRaz);
    totalExibido.textContent = totalPac;
    competenciaDisplay.textContent = `📅 Competência: ${competenciaAtual}`;

    // Tabela
    tableBody.innerHTML = '';
    
    if (filtrados.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="16" style="text-align:center; padding: 30px; color: #95a5a6;">
                    Nenhum dado encontrado para este filtro.
                </td>
            </tr>
        `;
    } else {
        filtrados.forEach(d => {
            const tr = document.createElement('tr');
            const isGestante = d.tipo === 'gestante';
            
            let colunas = `
                <td>${d.ine || '-'}</td>
                <td><strong>${d.equipe}</strong></td>
                <td>${d.total_pacientes || 0}</td>
                <td>${d.boas_praticas || 0}</td>
                <td><span class="badge ${getBadgeClass(d.razao || 0)}">${formatarRazao(d.razao || 0)}</span></td>
            `;
            
            if (isGestante) {
                colunas += `
                    <td>${d.consulta_12sem || 0}</td>
                    <td>${d.consultas_7 || 0}</td>
                    <td>${d.pa_7 || 0}</td>
                    <td>${d.peso_altura_7 || 0}</td>
                    <td>${d.visitas_acs_3 || 0}</td>
                    <td>${d.dtpa || 0}</td>
                    <td>${d.testes_1trim || 0}</td>
                    <td>${d.testes_3trim || 0}</td>
                    <td>${d.consulta_puerperio || 0}</td>
                    <td>${d.visita_acs_puerperio || 0}</td>
                    <td>${d.saude_bucal || 0}</td>
                `;
            } else {
                colunas += `
                    <td>${d.consulta_30dias || 0}</td>
                    <td>${d.consultas_9 || 0}</td>
                    <td>${d.peso_altura_9 || 0}</td>
                    <td>${d.visitas_acs_2 || 0}</td>
                    <td>${d.vacinas || 0}</td>
                    <td colspan="6">-</td>
                `;
            }
            
            tr.innerHTML = colunas;
            tableBody.appendChild(tr);
        });
    }

    // Gráfico
    barChart.innerHTML = '';
    const sorted = [...filtrados].sort((a, b) => (b.razao || 0) - (a.razao || 0));
    const maxRazao = sorted.length > 0 ? Math.max(...sorted.map(d => d.razao || 0)) : 1;

    if (sorted.length === 0) {
        barChart.innerHTML = '<p style="color: #95a5a6; text-align: center; padding: 30px 0;">Nenhuma equipe encontrada.</p>';
    } else {
        sorted.forEach(d => {
            const razao = d.razao || 0;
            const pct = maxRazao > 0 ? (razao / maxRazao) * 100 : 0;
            const item = document.createElement('div');
            item.className = 'bar-item';
            item.innerHTML = `
                <span class="bar-label" title="${d.equipe}">${d.equipe}</span>
                <div class="bar-track">
                    <div class="bar-fill" style="width: ${Math.max(pct, 5)}%;">
                        ${formatarRazao(razao)}
                    </div>
                </div>
                <span class="bar-value">${d.total_pacientes || 0}</span>
            `;
            barChart.appendChild(item);
        });
    }
}

// ============================================================
// POPULAR FILTROS
// ============================================================
function popularFiltros() {
    filterEquipe.innerHTML = '<option value="todas">Todas as equipes</option>';
    const nomes = [...new Set(dadosAtuais.map(d => d.equipe))];
    nomes.sort().forEach(nome => {
        if (nome && nome.trim() !== '') {
            const opt = document.createElement('option');
            opt.value = nome;
            opt.textContent = nome;
            filterEquipe.appendChild(opt);
        }
    });
}

// ============================================================
// EVENT LISTENERS
// ============================================================
filterTipo.addEventListener('change', () => {
    const tipo = filterTipo.value;
    carregarTodosArquivos(tipo);
});

filterMes.addEventListener('change', () => {
    filtrarPorMes();
});

filterEquipe.addEventListener('change', (e) => {
    render(e.target.value);
});

// ============================================================
// INICIAR
// ============================================================
console.log('📊 Dashboard iniciado!');
console.log('📁 Arquivos esperados:', ARQUIVOS);

// Tenta carregar os dados
carregarTodosArquivos('gestante');