// Configuração do Firebase (versão corrigida)
const firebaseConfig = {
  apiKey: "AIzaSyBweXnIsgNorZ6p_jIAscQx5Jc-Hw5cXr8",
  authDomain: "petsaudedigital-a9c6a.firebaseapp.com",
  projectId: "petsaudedigital-a9c6a",
  storageBucket: "petsaudedigital-a9c6a.firebasestorage.app",
  messagingSenderId: "686936715435",
  appId: "1:686936715435:web:4d361b758bbf7f46ccc7ee",
  measurementId: "G-0RP1NCVW61"
};

// Inicializar Firebase (compat)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// IMPORTANTE: Não usar mais analytics no navegador para evitar erros
// const analytics = firebase.analytics(); // Remova ou comente esta linha

// Habilitar persistência offline (opcional)
db.enablePersistence()
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.log('Persistência falhou - múltiplas abas abertas');
    } else if (err.code == 'unimplemented') {
      console.log('Persistência não disponível neste navegador');
    }
  });

// Elementos do DOM
const form = document.querySelector('#formDisponibilidade');
const msg = document.querySelector('#msg');
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

// Menu sidebar
menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("active");
});

// Salvar disponibilidade
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validar nome
    const nome = document.getElementById('nome').value.trim();
    if (!nome) {
        mostrarErro('Por favor, digite seu nome');
        return;
    }

    // Validar turno
    const turno = document.getElementById('turno').value;
    if (!turno) {
        mostrarErro('Por favor, selecione seu turno principal');
        return;
    }

    const observacoes = document.getElementById('observacoes').value;

    // Coletar disponibilidade dos dias
    const dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta'];
    const periodos = ['manha', 'tarde'];
    
    const disponibilidade = {};
    let temDisponibilidade = false;
    
    dias.forEach(dia => {
        disponibilidade[dia] = {};
        periodos.forEach(periodo => {
            const checkbox = document.querySelector(`[name="${dia}_${periodo}"]`);
            const checked = checkbox ? checkbox.checked : false;
            disponibilidade[dia][periodo] = checked;
            if (checked) temDisponibilidade = true;
        });
    });

    // Verificar se marcou pelo menos um período
    if (!temDisponibilidade) {
        mostrarErro('Marque pelo menos um período de disponibilidade');
        return;
    }

    // Calcular carga horária total
    let horasSemanais = 0;
    dias.forEach(dia => {
        periodos.forEach(periodo => {
            if (disponibilidade[dia][periodo]) {
                horasSemanais += 3.5; // Cada período tem 3.5h
            }
        });
    });

    // Verificar se já existe registro para este nome hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    
    try {
        const query = await db.collection('disponibilidade')
            .where('nome', '==', nome)
            .where('data_registro', '>=', hoje.toISOString())
            .where('data_registro', '<', amanha.toISOString())
            .get();

        if (!query.empty) {
            if (!confirm('Você já registrou disponibilidade hoje. Deseja sobrescrever?')) {
                return;
            }
            // Deletar registros anteriores de hoje
            const batch = db.batch();
            query.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        }
    } catch (error) {
        console.log("Erro ao verificar registros existentes (ignorando):", error);
        // Continua mesmo se falhar
    }

    // Preparar dados para salvar
    const dados = {
        nome: nome,
        turno: turno,
        turno_label: turno === 'manha' ? 'Manhã (8:30-12h)' : 'Tarde (14:30-18h)',
        disponibilidade: disponibilidade,
        horas_semanais: parseFloat(horasSemanais.toFixed(1)),
        observacoes: observacoes || '',
        data_registro: new Date().toISOString(),
        data_registro_br: new Date().toLocaleString('pt-BR'),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        // Mostrar loading
        msg.textContent = "⏳ Salvando...";
        msg.classList.add('show');
        msg.style.background = "#cce5ff";
        msg.style.color = "#004085";
        msg.style.borderColor = "#b8daff";

        // Salvar no Firestore
        await db.collection('disponibilidade').add(dados);
        
        // Sucesso
        msg.textContent = "✅ Disponibilidade salva com sucesso!";
        msg.style.background = "#d4edda";
        msg.style.color = "#28a745";
        msg.style.borderColor = "#c3e6cb";
        
        // Limpar formulário
        form.reset();
        
        // Remover mensagem após 3 segundos
        setTimeout(() => {
            msg.classList.remove('show');
        }, 3000);
        
    } catch (error) {
        console.error("Erro ao salvar:", error);
        mostrarErro("Erro ao salvar. Verifique sua conexão e tente novamente.");
    }
});

// Função para mostrar erro
function mostrarErro(texto) {
    msg.textContent = "❌ " + texto;
    msg.classList.add('show');
    msg.style.background = "#f8d7da";
    msg.style.color = "#721c24";
    msg.style.borderColor = "#f5c6cb";
    
    setTimeout(() => {
        msg.classList.remove('show');
    }, 3000);
}

// Função para verificar disponibilidade existente
async function verificarDisponibilidadeAluno(nome) {
    try {
        const query = await db.collection('disponibilidade')
            .where('nome', '==', nome)
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();
        
        if (!query.empty) {
            return query.docs[0].data();
        }
        return null;
    } catch (error) {
        console.error("Erro ao verificar aluno:", error);
        return null;
    }
}

// Auto-completar campos se já existir registro (opcional)
document.getElementById('nome').addEventListener('blur', async (e) => {
    const nome = e.target.value.trim();
    if (nome.length < 3) return;
    
    const registroAnterior = await verificarDisponibilidadeAluno(nome);
    if (registroAnterior) {
        if (confirm(`Encontramos um registro anterior para ${nome}. Deseja carregar os dados?`)) {
            // Preencher turno
            document.getElementById('turno').value = registroAnterior.turno || '';
            
            // Preencher checkboxes
            if (registroAnterior.disponibilidade) {
                Object.entries(registroAnterior.disponibilidade).forEach(([dia, periodos]) => {
                    Object.entries(periodos).forEach(([periodo, valor]) => {
                        const checkbox = document.querySelector(`[name="${dia}_${periodo}"]`);
                        if (checkbox && valor) {
                            checkbox.checked = true;
                        }
                    });
                });
            }
            
            document.getElementById('observacoes').value = registroAnterior.observacoes || '';
        }
    }
});