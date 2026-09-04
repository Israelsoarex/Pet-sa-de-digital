 // ============================================================
    // DADOS (exatamente do seu relatório)
    // ============================================================
    const dados = [
        {
            cnes: "2444097",
            estabelecimento: "UNIDADE BASICA DE SAUDE MARIA TERESA DE MELO COSTA MAFRENSE",
            tipo: "CENTRO DE SAUDE/UNIDADE BASICA",
            ine: "0000076600",
            equipe: "0187-MAFRENSE I-TARDE",
            sigla: "eSF",
            consulta_12sem: 8,
            consultas_7: 2,
            pa_7: 2,
            peso_altura_7: 2,
            visitas_acs_3: 4,
            dtpa: 6,
            testes_1trim: 4,
            testes_3trim: 3,
            consulta_puerperio: 3,
            visita_acs_puerperio: 3,
            saude_bucal: 6,
            boas_praticas: 395,
            total_gestantes: 10,
            razao: 39.50
        },
        {
            cnes: "2444097",
            estabelecimento: "UNIDADE BASICA DE SAUDE MARIA TERESA DE MELO COSTA MAFRENSE",
            tipo: "CENTRO DE SAUDE/UNIDADE BASICA",
            ine: "0000076597",
            equipe: "0238-SAO JOAQUIM- MANHA",
            sigla: "eSF",
            consulta_12sem: 16,
            consultas_7: 3,
            pa_7: 4,
            peso_altura_7: 4,
            visitas_acs_3: 5,
            dtpa: 9,
            testes_1trim: 10,
            testes_3trim: 5,
            consulta_puerperio: 1,
            visita_acs_puerperio: 2,
            saude_bucal: 8,
            boas_praticas: 619,
            total_gestantes: 22,
            razao: 28.14
        },
        {
            cnes: "2444097",
            estabelecimento: "UNIDADE BASICA DE SAUDE MARIA TERESA DE MELO COSTA MAFRENSE",
            tipo: "CENTRO DE SAUDE/UNIDADE BASICA",
            ine: "0000076619",
            equipe: "0186-MAFRENSE - MANHA",
            sigla: "eSF",
            consulta_12sem: 17,
            consultas_7: 6,
            pa_7: 6,
            peso_altura_7: 6,
            visitas_acs_3: 7,
            dtpa: 10,
            testes_1trim: 14,
            testes_3trim: 6,
            consulta_puerperio: 5,
            visita_acs_puerperio: 2,
            saude_bucal: 14,
            boas_praticas: 854,
            total_gestantes: 20,
            razao: 42.70
        }
    ];

    // ============================================================
    // REFERÊNCIAS DOM
    // ============================================================
    const filterSelect = document.getElementById('filterEquipe');
    const tableBody = document.getElementById('tableBody');
    const barChart = document.getElementById('barChart');
    const totalEquipes = document.getElementById('totalEquipes');
    const totalGestantes = document.getElementById('totalGestantes');
    const mediaBoasPraticas = document.getElementById('mediaBoasPraticas');
    const maiorRazao = document.getElementById('maiorRazao');
    const totalExibido = document.getElementById('totalExibido');

    // ============================================================
    // FUNÇÕES AUXILIARES
    // ============================================================
    function formatarRazao(valor) {
        return valor.toFixed(2) + '%';
    }

    function getBadgeClass(valor) {
        if (valor >= 40) return 'green';
        if (valor >= 30) return 'orange';
        return 'red';
    }

    // ============================================================
    // RENDER
    // ============================================================
    function render(equipeFiltro = 'todas') {
        // Filtrar dados
        const filtrados = equipeFiltro === 'todas'
            ? dados
            : dados.filter(d => d.equipe === equipeFiltro);

        // Atualizar cards
        const totalEq = filtrados.length;
        const totalGes = filtrados.reduce((acc, d) => acc + d.total_gestantes, 0);
        const mediaBP = filtrados.length > 0
            ? (filtrados.reduce((acc, d) => acc + d.boas_praticas, 0) / filtrados.length)
            : 0;
        const maiorRaz = filtrados.length > 0
            ? Math.max(...filtrados.map(d => d.razao))
            : 0;

        totalEquipes.textContent = totalEq;
        totalGestantes.textContent = totalGes;
        mediaBoasPraticas.textContent = mediaBP.toFixed(0);
        maiorRazao.textContent = formatarRazao(maiorRaz);

        totalExibido.textContent = totalGes;

        // Atualizar tabela
        tableBody.innerHTML = '';
        filtrados.forEach(d => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${d.ine}</td>
                <td><strong>${d.equipe}</strong></td>
                <td>${d.total_gestantes}</td>
                <td>${d.boas_praticas}</td>
                <td><span class="badge ${getBadgeClass(d.razao)}">${formatarRazao(d.razao)}</span></td>
                <td>${d.consulta_12sem}</td>
                <td>${d.consultas_7}</td>
                <td>${d.pa_7}</td>
                <td>${d.peso_altura_7}</td>
                <td>${d.visitas_acs_3}</td>
                <td>${d.dtpa}</td>
                <td>${d.testes_1trim}</td>
                <td>${d.testes_3trim}</td>
                <td>${d.consulta_puerperio}</td>
                <td>${d.visita_acs_puerperio}</td>
                <td>${d.saude_bucal}</td>
            `;
            tableBody.appendChild(tr);
        });

        // Atualizar gráfico de barras
        barChart.innerHTML = '';
        const sorted = [...filtrados].sort((a, b) => b.razao - a.razao);
        const maxRazao = sorted.length > 0 ? sorted[0].razao : 1;

        sorted.forEach(d => {
            const pct = (d.razao / maxRazao) * 100;
            const item = document.createElement('div');
            item.className = 'bar-item';
            item.innerHTML = `
                <span class="bar-label" title="${d.equipe}">${d.equipe}</span>
                <div class="bar-track">
                    <div class="bar-fill" style="width: ${Math.max(pct, 5)}%;">
                        ${formatarRazao(d.razao)}
                    </div>
                </div>
                <span class="bar-value">${d.total_gestantes}</span>
            `;
            barChart.appendChild(item);
        });

        // Se não houver dados, mostrar mensagem
        if (sorted.length === 0) {
            barChart.innerHTML = '<p style="color: #95a5a6; text-align: center; padding: 30px 0;">Nenhuma equipe encontrada com este filtro.</p>';
        }
    }

    // ============================================================
    // INICIALIZAR FILTROS
    // ============================================================
    function popularFiltros() {
        // Limpar opções (exceto "Todas")
        filterSelect.innerHTML = '<option value="todas">Todas as equipes</option>';
        // Obter nomes únicos
        const nomes = [...new Set(dados.map(d => d.equipe))];
        nomes.sort().forEach(nome => {
            const opt = document.createElement('option');
            opt.value = nome;
            opt.textContent = nome;
            filterSelect.appendChild(opt);
        });
    }

    // ============================================================
    // EVENT LISTENER
    // ============================================================
    filterSelect.addEventListener('change', (e) => {
        render(e.target.value);
    });

    // ============================================================
    // INICIAR
    // ============================================================
    popularFiltros();
    render('todas');
