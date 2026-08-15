/* =========================================================
   FIREBASE IMPORTS
========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDocs,
    collection,
    query,
    where,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIG
========================================================= */

const firebaseConfig = {

    apiKey: "AIzaSyBweXnIsgNorZ6p_jIAscQx5Jc-Hw5cXr8",

    authDomain:
        "petsaudedigital-a9c6a.firebaseapp.com",

    projectId:
        "petsaudedigital-a9c6a",

    storageBucket:
        "petsaudedigital-a9c6a.firebasestorage.app",

    messagingSenderId:
        "686936715435",

    appId:
        "1:686936715435:web:4d361b758bbf7f46ccc7ee",

    measurementId:
        "G-0RP1NCVW61"
};


/* =========================================================
   INICIALIZAR FIREBASE
========================================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/* =========================================================
   ELEMENTOS HTML
========================================================= */

const loginScreen =
    document.getElementById("loginScreen");

const appScreen =
    document.getElementById("appScreen");

const loginForm =
    document.getElementById("loginForm");

const loginMessage =
    document.getElementById("loginMessage");

const logoutBtn =
    document.getElementById("logoutBtn");

const menuBtn =
    document.getElementById("menuBtn");

const sidebar =
    document.getElementById("sidebar");

const xlsxInput =
    document.getElementById("xlsxInput");

const fileName =
    document.getElementById("fileName");

const cycleSelect =
    document.getElementById("cycleSelect");

const citizenSection =
    document.getElementById("citizenSection");

const citizenName =
    document.getElementById("citizenName");

const citizenNis =
    document.getElementById("citizenNis");

const positionText =
    document.getElementById("positionText");

const actionMessage =
    document.getElementById("actionMessage");

const summarySection =
    document.getElementById("summarySection");

const finishedSection =
    document.getElementById("finishedSection");

const totalCount =
    document.getElementById("totalCount");

const evaluatedCount =
    document.getElementById("evaluatedCount");

const pendingCount =
    document.getElementById("pendingCount");

const greenCount =
    document.getElementById("greenCount");

const redCount =
    document.getElementById("redCount");

const purpleCount =
    document.getElementById("purpleCount");
const todayCount =
    document.getElementById("todayCount");

const todayGreenCount =
    document.getElementById("todayGreenCount");

const todayRedCount =
    document.getElementById("todayRedCount");

const todayPurpleCount =
    document.getElementById("todayPurpleCount");

const progressBar =
    document.getElementById("progressBar");

const progressText =
    document.getElementById("progressText");

const exportBtn =
    document.getElementById("exportBtn");

const copyNameBtn =
    document.getElementById("copyNameBtn");

const copyNisBtn =
    document.getElementById("copyNisBtn");

const copyConsultBtn =
    document.getElementById("copyConsultBtn");

const greenBtn =
    document.getElementById("greenBtn");

const redBtn =
    document.getElementById("redBtn");

const purpleBtn =
    document.getElementById("purpleBtn");


/* =========================================================
   VARIÁVEIS DA APLICAÇÃO
========================================================= */

let currentUser = null;

let workbook = null;

let worksheet = null;

let rows = [];

let pendingRows = [];

let currentIndex = 0;

let currentPerson = null;

let currentCycle = "2026-2";

/*
    Guarda a linha real onde estão
    NIS e Nome no Excel.

    Exemplo:

    0 = primeira linha do Excel
    5 = sexta linha do Excel
*/
let headerRowIndex = -1;


/*
    Estatísticas
*/

let stats = {

    green: 0,

    red: 0,

    purple: 0

};

let todayStats = {

    total: 0,

    green: 0,

    red: 0,

    purple: 0

};


/* =========================================================
   FIREBASE AUTH
========================================================= */

onAuthStateChanged(auth, (user) => {

    if (user) {

        currentUser = user;

        loginScreen.classList.add("hidden");

        appScreen.classList.remove("hidden");

    } else {

        currentUser = null;

        loginScreen.classList.remove("hidden");

        appScreen.classList.add("hidden");

    }

});


/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    loginMessage.textContent =
        "Entrando...";

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        loginMessage.textContent = "";

    } catch (error) {

        console.error(error);

        loginMessage.textContent =
            "E-mail ou senha incorretos.";

    }

});


/* =========================================================
   LOGOUT
========================================================= */

logoutBtn.addEventListener("click", async (event) => {

    event.preventDefault();

    await signOut(auth);

});


/* =========================================================
   MENU
========================================================= */

menuBtn.addEventListener("click", () => {

    sidebar.classList.toggle("active");

});


/* =========================================================
   SELEÇÃO DO CICLO
========================================================= */

cycleSelect.addEventListener("change", () => {

    currentCycle =
        cycleSelect.value;

});


/* =========================================================
   UPLOAD XLSX
========================================================= */

xlsxInput.addEventListener("change", async (event) => {

    const file =
        event.target.files[0];

    if (!file) {
        return;
    }

    fileName.textContent =
        file.name;


    try {

        const arrayBuffer =
            await file.arrayBuffer();


        /* =====================================================
           LER XLSX
        ===================================================== */

        workbook =
            XLSX.read(
                arrayBuffer,
                {
                    type: "array"
                }
            );


        const firstSheet =
            workbook.SheetNames[0];

        worksheet =
            workbook.Sheets[firstSheet];


        /* =====================================================
           PRIMEIRO:

           Converte TODA a planilha em matriz.

           Isso permite procurar onde está
           o verdadeiro cabeçalho.
        ===================================================== */

        const rawRows =
            XLSX.utils.sheet_to_json(
                worksheet,
                {
                    header: 1,
                    defval: "",
                    raw: true
                }
            );


        console.log(
            "Planilha completa:",
            rawRows
        );


        /* =====================================================
           PROCURAR AUTOMATICAMENTE A LINHA DO CABEÇALHO
        ===================================================== */

        headerRowIndex =
            findHeaderRow(rawRows);


        console.log(
            "Linha do cabeçalho encontrada:",
            headerRowIndex
        );


        if (headerRowIndex === -1) {

            alert(
                "Não foi possível encontrar a linha que contém as colunas NIS e Nome."
            );

            return;

        }


        /* =====================================================
           AGORA SIM:

           Converte a planilha usando a linha correta
           como cabeçalho.
        ===================================================== */

        rows =
            XLSX.utils.sheet_to_json(
                worksheet,
                {
                    defval: "",
                    raw: true,

                    /*
                        Diz ao SheetJS:

                        "O cabeçalho começa aqui."
                    */

                    range: headerRowIndex
                }
            );


        console.log(
            "Linhas encontradas depois do cabeçalho:",
            rows
        );


        if (rows.length === 0) {

            alert(
                "Não existem cidadãos após o cabeçalho."
            );

            return;

        }


        await prepareEvaluation();


    } catch (error) {

        console.error(error);

        alert(
            "Não foi possível ler a planilha."
        );

    }

});


/* =========================================================
   ENCONTRAR LINHA DO CABEÇALHO
========================================================= */

function findHeaderRow(rawRows) {

    /*
        Procuramos uma linha que possua
        simultaneamente:

        NIS
        Nome

        Não importa em qual coluna estão.
    */

    for (
        let i = 0;
        i < rawRows.length;
        i++
    ) {

        const row =
            rawRows[i];


        if (!Array.isArray(row)) {
            continue;
        }


        const normalizedCells =
            row.map(cell =>
                normalizeText(cell)
            );


        const hasNis =
            normalizedCells.some(
                cell =>
                    cell === "nis" ||
                    cell.includes("numero nis") ||
                    cell.includes("número nis")
            );


        const hasName =
            normalizedCells.some(
                cell =>
                    cell === "nome" ||
                    cell.includes("nome completo") ||
                    cell.includes("nome do beneficiario") ||
                    cell.includes("beneficiario")
            );


        if (
            hasNis &&
            hasName
        ) {

            return i;

        }

    }


    return -1;

}


/* =========================================================
   IDENTIFICAR COLUNA
========================================================= */

function findColumn(row, possibleNames) {

    const keys =
        Object.keys(row);


    for (const key of keys) {

        const normalizedKey =
            normalizeText(key);


        for (const possible of possibleNames) {

            const normalizedPossible =
                normalizeText(possible);


            /*
                Primeiro tenta correspondência exata.
            */

            if (
                normalizedKey ===
                normalizedPossible
            ) {

                return key;

            }

        }

    }


    /*
        Segunda tentativa:

        procura palavras dentro do nome da coluna.

        Isso ajuda com coisas como:

        "Nome do Beneficiário"
        "NIS do Beneficiário"
    */

    for (const key of keys) {

        const normalizedKey =
            normalizeText(key);


        for (const possible of possibleNames) {

            const normalizedPossible =
                normalizeText(possible);


            if (
                normalizedKey.includes(
                    normalizedPossible
                )
            ) {

                return key;

            }

        }

    }


    return null;

}


/* =========================================================
   NORMALIZAR TEXTO
========================================================= */

function normalizeText(text) {

    return String(text ?? "")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .trim()
        .toLowerCase();

}


/* =========================================================
   NORMALIZAR NIS
========================================================= */

function normalizeNis(nis) {

    if (
        nis === null ||
        nis === undefined
    ) {

        return "";

    }


    return String(nis)
        .replace(/\D/g, "")
        .trim();

}


/* =========================================================
   PREPARAR AVALIAÇÃO
========================================================= */

async function prepareEvaluation() {

    currentCycle = cycleSelect.value;

    console.log("=================================");
    console.log("INICIANDO PREPARAÇÃO DA AVALIAÇÃO");
    console.log("=================================");

    console.log(
        "Total de linhas após o cabeçalho:",
        rows.length
    );


    if (!rows || rows.length === 0) {

        alert(
            "Nenhum cidadão foi encontrado na planilha."
        );

        return;

    }


    /* =====================================================
       IDENTIFICAR AS COLUNAS
    ===================================================== */

    const header =
        rows[0];


    const nameColumn =
        findColumn(
            header,
            [
                "Nome",
                "nome completo",
                "nome do beneficiario",
                "beneficiario"
            ]
        );


    const nisColumn =
        findColumn(
            header,
            [
                "NIS",
                "número nis",
                "numero nis",
                "nis do beneficiario",
                "nis beneficiario"
            ]
        );


    console.log(
        "Cabeçalho detectado:",
        header
    );

    console.log(
        "Coluna Nome:",
        nameColumn
    );

    console.log(
        "Coluna NIS:",
        nisColumn
    );


    if (!nameColumn || !nisColumn) {

        alert(
            "Não foi possível encontrar as colunas NOME e NIS."
        );

        return;

    }


    /* =====================================================
       TRANSFORMAR AS LINHAS

       Aqui está a correção principal.

       A planilha possui:

       Nome
       NIS

       O sistema passa a utilizar:

       name
       nis
    ===================================================== */

    rows =
        rows
            .map(
                (row, index) => {

                    const name =
                        String(
                            row[nameColumn] ?? ""
                        ).trim();


                    const nis =
                        normalizeNis(
                            row[nisColumn]
                        );


                    return {

                        originalRow:
                            row,

                        /*
                            Linha real no Excel.

                            headerRowIndex é zero-based.

                            Se o cabeçalho está na linha 7,
                            o primeiro cidadão está na linha 8.

                            +1 porque Excel começa em 1.
                        */

                        excelIndex:
                            headerRowIndex + index + 2,

                        name:
                            name,

                        nis:
                            nis,

                        resultado:
                            null,

                        jaAvaliado:
                            false

                    };

                }
            )
            .filter(
                row =>
                    row.nis !== "" &&
                    row.name !== ""
            );


    console.log(
        "Cidadãos válidos:",
        rows.length
    );


    if (rows.length === 0) {

        alert(
            "Nenhum cidadão com NIS e Nome válido foi encontrado."
        );

        return;

    }


    /* =====================================================
       CONSULTAR FIREBASE
    ===================================================== */

    console.log(
        "Consultando avaliações salvas no Firebase..."
    );


    try {

        await checkAlreadyEvaluated();

    } catch (error) {

        console.error(
            "Erro ao verificar avaliações:",
            error
        );

        alert(
            "Não foi possível consultar as avaliações salvas no Firebase."
        );

        return;

    }


    /*
        Buscar o que o usuário fez hoje.
    */

    await loadTodayStats();


    /* =====================================================
       CRIAR FILA DE PENDENTES
    ===================================================== */

    pendingRows =
        rows.filter(
            row =>
                !row.jaAvaliado
        );


    console.log(
        "Total de cidadãos:",
        rows.length
    );

    console.log(
        "Já avaliados:",
        rows.filter(
            row =>
                row.jaAvaliado
        ).length
    );

    console.log(
        "Pendentes:",
        pendingRows.length
    );


    currentIndex = 0;

    currentPerson = null;


    /* =====================================================
       ESTATÍSTICAS
    ===================================================== */

    calculateStats();


    /* =====================================================
       MOSTRAR RESUMO
    ===================================================== */

    showSummary();


    /* =====================================================
       SE NÃO HOUVER PENDENTES
    ===================================================== */

    if (
        pendingRows.length === 0
    ) {

        console.log(
            "Todos os cidadãos desta planilha já foram avaliados."
        );

        showFinished();

        return;

    }


    /* =====================================================
       ABRIR PRIMEIRO CIDADÃO
    ===================================================== */

    console.log(
        "Abrindo primeiro cidadão:",
        pendingRows[0]
    );


    showCurrentPerson();

}

/* =========================================================
   VERIFICAR FIREBASE
========================================================= */

async function checkAlreadyEvaluated() {

    console.log(
        "Buscando avaliações do ciclo:",
        currentCycle
    );


    /*
        Busca todos os documentos da coleção
        "avaliacoes" pertencentes ao ciclo atual.
    */

    const evaluationsRef =
        collection(
            db,
            "avaliacoes"
        );


    const q =
        query(
            evaluationsRef,
            where(
                "ciclo",
                "==",
                currentCycle
            )
        );


    const snapshot =
        await getDocs(q);


    console.log(
        "Avaliações encontradas no Firebase:",
        snapshot.size
    );


    /*
        Criamos um Set com os NIS
        que já foram avaliados.
    */

    const evaluatedMap =
        new Map();


    snapshot.forEach(
        documentSnapshot => {

            const data =
                documentSnapshot.data();


            const nis =
                normalizeNis(
                    data.nis
                );


            if (!nis) {
                return;
            }


            evaluatedMap.set(
                nis,
                data
            );

        }
    );


    /*
        Agora percorremos a planilha
        LOCALMENTE.

        Não fazemos mais uma consulta
        Firebase para cada cidadão.
    */

    rows.forEach(
        row => {

            const saved =
                evaluatedMap.get(
                    row.nis
                );


            if (saved) {

                row.jaAvaliado =
                    true;

                row.resultado =
                    saved.resultado || null;

            } else {

                row.jaAvaliado =
                    false;

                row.resultado =
                    null;

            }

        }
    );


    console.log(
        "Verificação do Firebase concluída."
    );

}

/* =========================================================
   BUSCAR AVALIAÇÕES FEITAS HOJE PELO USUÁRIO
========================================================= */

/* =========================================================
   BUSCAR AVALIAÇÕES FEITAS HOJE PELO USUÁRIO
========================================================= */

async function loadTodayStats() {

    todayStats = {

        total: 0,

        green: 0,

        red: 0,

        purple: 0

    };


    if (!currentUser) {
        return;
    }


    try {

        /*
            Início do dia
        */

        const startOfToday =
            new Date();

        startOfToday.setHours(
            0,
            0,
            0,
            0
        );


        /*
            Início de amanhã
        */

        const startOfTomorrow =
            new Date(
                startOfToday
            );

        startOfTomorrow.setDate(
            startOfTomorrow.getDate() + 1
        );


        /*
            IMPORTANTE:

            Não fazemos mais uma query composta
            com ciclo + usuário + data.

            Buscamos as avaliações do ciclo
            e filtramos o restante no JavaScript.

            Assim NÃO precisamos criar índice.
        */

        const evaluationsRef =
            collection(
                db,
                "avaliacoes"
            );


        const q =
            query(
                evaluationsRef,

                where(
                    "ciclo",
                    "==",
                    currentCycle
                )
            );


        const snapshot =
            await getDocs(q);


        console.log(
            "Avaliações do ciclo encontradas:",
            snapshot.size
        );


        snapshot.forEach(
            documentSnapshot => {

                const data =
                    documentSnapshot.data();


                /*
                    Primeiro:

                    verifica se pertence
                    ao usuário atual.
                */

                if (
                    data.usuarioUid !==
                    currentUser.uid
                ) {

                    return;

                }


                /*
                    Verifica se existe
                    a data da avaliação.
                */

                if (!data.avaliadoEm) {

                    return;

                }


                /*
                    Firestore Timestamp
                    -> JavaScript Date
                */

                const evaluationDate =
                    data.avaliadoEm.toDate();


                /*
                    Verifica se foi feita hoje.
                */

                if (
                    evaluationDate >=
                    startOfToday &&
                    evaluationDate <
                    startOfTomorrow
                ) {

                    todayStats.total++;


                    if (
                        data.resultado ===
                        "acompanhada"
                    ) {

                        todayStats.green++;

                    }

                    else if (
                        data.resultado ===
                        "desacompanhada"
                    ) {

                        todayStats.red++;

                    }

                    else if (
                        data.resultado ===
                        "motivo_desconhecido"
                    ) {

                        todayStats.purple++;

                    }

                }

            }
        );


        console.log(
            "================================="
        );

        console.log(
            "AVALIAÇÕES DE HOJE"
        );

        console.log(
            todayStats
        );

        console.log(
            "================================="
        );


    } catch (error) {

        console.error(
            "Erro ao buscar avaliações de hoje:",
            error
        );

    }

}

/* =========================================================
   ID DO DOCUMENTO
========================================================= */

function createDocumentId(
    cycle,
    nis
) {

    return `${cycle}_${nis}`;

}


/* =========================================================
   MOSTRAR RESUMO
========================================================= */

function showSummary() {

    summarySection.style.display =
        "block";

    totalCount.textContent =
        rows.length;


    const alreadyEvaluated =
        rows.filter(
            row =>
                row.jaAvaliado
        ).length;


    evaluatedCount.textContent =
        alreadyEvaluated;


    pendingCount.textContent =
        pendingRows.length;


    greenCount.textContent =
        stats.green;

    redCount.textContent =
        stats.red;

    purpleCount.textContent =
        stats.purple;


    const progress =
        rows.length === 0
            ? 0
            : (
                alreadyEvaluated /
                rows.length
            ) * 100;


    progressBar.style.width =
        `${progress}%`;


    progressText.textContent =
        `${Math.round(progress)}%`;

    updateTodayStatsUI();

}

/* =========================================================
   ATUALIZAR RESUMO DE HOJE
========================================================= */

function updateTodayStatsUI() {

    todayCount.textContent =
        todayStats.total;


    todayGreenCount.textContent =
        todayStats.green;


    todayRedCount.textContent =
        todayStats.red;


    todayPurpleCount.textContent =
        todayStats.purple;

}

/* =========================================================
   CALCULAR ESTATÍSTICAS
========================================================= */

function calculateStats() {

    stats = {

        green: 0,

        red: 0,

        purple: 0

    };


    rows.forEach(row => {

        if (
            row.resultado ===
            "acompanhada"
        ) {

            stats.green++;

        }

        else if (
            row.resultado ===
            "desacompanhada"
        ) {

            stats.red++;

        }

        else if (
            row.resultado ===
            "motivo_desconhecido"
        ) {

            stats.purple++;

        }

    });

}


/* =========================================================
   MOSTRAR PESSOA ATUAL
========================================================= */

function showCurrentPerson() {

    if (
        currentIndex >=
        pendingRows.length
    ) {

        showFinished();

        return;

    }


    currentPerson =
        pendingRows[currentIndex];


    citizenSection.style.display =
        "block";

    finishedSection.style.display =
        "none";


    citizenName.textContent =
        currentPerson.name;


    citizenNis.textContent =
        currentPerson.nis;


    positionText.textContent =
        `Pessoa ${currentIndex + 1} de ${pendingRows.length}`;


    actionMessage.textContent =
        "";


    updateSummaryAfterAction();

}


/* =========================================================
   COPIAR TEXTO
========================================================= */

async function copyToClipboard(
    text,
    button
) {

    try {

        await navigator.clipboard.writeText(
            text
        );


        const oldText =
            button.innerHTML;


        button.classList.add(
            "copied"
        );


        button.innerHTML =
            `<i class="fas fa-check"></i> Copiado!`;


        setTimeout(() => {

            button.classList.remove(
                "copied"
            );

            button.innerHTML =
                oldText;

        }, 1200);


    } catch (error) {

        console.error(error);

        alert(
            "Não foi possível copiar."
        );

    }

}


/* =========================================================
   COPIAR NOME
========================================================= */

copyNameBtn.addEventListener(
    "click",
    () => {

        if (!currentPerson) {
            return;
        }


        copyToClipboard(
            currentPerson.name,
            copyNameBtn
        );

    }
);


/* =========================================================
   COPIAR NIS
========================================================= */

copyNisBtn.addEventListener(
    "click",
    () => {

        if (!currentPerson) {
            return;
        }


        copyToClipboard(
            currentPerson.nis,
            copyNisBtn
        );

    }
);


/* =========================================================
   COPIAR MENSAGEM
========================================================= */

copyConsultBtn.addEventListener(
    "click",
    () => {

        copyToClipboard(
            "Ver a última consulta",
            copyConsultBtn
        );

    }
);


/* =========================================================
   RESULTADOS
========================================================= */

greenBtn.addEventListener(
    "click",
    () => {

        registerResult(
            "acompanhada"
        );

    }
);


redBtn.addEventListener(
    "click",
    () => {

        registerResult(
            "desacompanhada"
        );

    }
);


purpleBtn.addEventListener(
    "click",
    () => {

        registerResult(
            "motivo_desconhecido"
        );

    }
);


/* =========================================================
   REGISTRAR RESULTADO
========================================================= */

async function registerResult(
    resultado
) {

    if (
        !currentPerson ||
        !currentUser
    ) {

        return;

    }


    setResultButtonsDisabled(
        true
    );


    actionMessage.textContent =
        "Salvando avaliação...";


    try {

        const documentId =
            createDocumentId(
                currentCycle,
                currentPerson.nis
            );


        const reference =
            doc(
                db,
                "avaliacoes",
                documentId
            );


        await setDoc(
            reference,
            {

                nis:
                    currentPerson.nis,

                nome:
                    currentPerson.name,

                resultado:
                    resultado,

                ciclo:
                    currentCycle,

                usuarioUid:
                    currentUser.uid,

                usuarioEmail:
                    currentUser.email,

                avaliadoEm:
                    serverTimestamp()

            }
        );


        currentPerson.resultado =
            resultado;

        currentPerson.jaAvaliado =
            true;



        const original =
            rows.find(
                row =>
                    row.nis ===
                    currentPerson.nis
            );


        if (original) {

            original.resultado =
                resultado;

            original.jaAvaliado =
                true;

        }

        /* =====================================================
   ATUALIZAR ESTATÍSTICAS
===================================================== */

        todayStats.total++;

        if (
            resultado ===
            "acompanhada"
        ) {

            stats.green++;
            todayStats.green++;
        }

        else if (
            resultado ===
            "desacompanhada"
        ) {

            stats.red++;
            todayStats.red++;
        }

        else if (
            resultado ===
            "motivo_desconhecido"
        ) {

            stats.purple++;
            todayStats.purple++;
        }

        updateTodayStatsUI();

        actionMessage.textContent =
            "Avaliação salva com sucesso ✓";


        setTimeout(
            () => {

                currentIndex++;

                showCurrentPerson();

                setResultButtonsDisabled(
                    false
                );

            },
            500
        );


    } catch (error) {

        console.error(error);

        actionMessage.textContent =
            "Erro ao salvar. Tente novamente.";


        setResultButtonsDisabled(
            false
        );

    }

}


/* =========================================================
   DESABILITAR BOTÕES
========================================================= */

function setResultButtonsDisabled(
    disabled
) {

    greenBtn.disabled =
        disabled;

    redBtn.disabled =
        disabled;

    purpleBtn.disabled =
        disabled;

}


/* =========================================================
   ATUALIZAR RESUMO
========================================================= */

function updateSummaryAfterAction() {

    const evaluated =
        rows.filter(
            row =>
                row.jaAvaliado
        ).length;


    const pending =
        rows.length -
        evaluated;


    evaluatedCount.textContent =
        evaluated;

    pendingCount.textContent =
        pending;


    greenCount.textContent =
        stats.green;

    redCount.textContent =
        stats.red;

    purpleCount.textContent =
        stats.purple;


    const progress =
        rows.length === 0
            ? 0
            : (
                evaluated /
                rows.length
            ) * 100;


    progressBar.style.width =
        `${progress}%`;


    progressText.textContent =
        `${Math.round(progress)}%`;

}


/* =========================================================
   FINALIZAR
========================================================= */

function showFinished() {

    citizenSection.style.display =
        "none";

    finishedSection.style.display =
        "block";


    updateSummaryAfterAction();

}


/* =========================================================
   EXPORTAR XLSX
========================================================= */

exportBtn.addEventListener(
    "click",
    () => {

        exportSpreadsheet();

    }
);


/* =========================================================
   EXPORTAR PLANILHA
========================================================= */

function exportSpreadsheet() {

    if (
        !workbook ||
        !worksheet
    ) {

        alert(
            "Nenhuma planilha carregada."
        );

        return;

    }


    /*
        IMPORTANTE:

        Aqui usamos a planilha ORIGINAL.

        Isso preserva:

        - cabeçalho inicial
        - informações do relatório
        - NIS
        - Nome
        - demais colunas
    */

    const exportWorksheet =
        worksheet;


    /*
        Para cada cidadão avaliado
    */

    rows.forEach(
        (person) => {

            if (!person.resultado) {
                return;
            }


            let color;


            if (
                person.resultado ===
                "acompanhada"
            ) {

                color =
                    "C6EFCE";

            }

            else if (
                person.resultado ===
                "desacompanhada"
            ) {

                color =
                    "FFC7CE";

            }

            else if (
                person.resultado ===
                "motivo_desconhecido"
            ) {

                color =
                    "D9C2E9";

            }


            if (!color) {
                return;
            }


            /*
                person.excelIndex é a linha REAL
                dentro da planilha.

                Exemplo:

                cabeçalho = linha 6

                primeiro cidadão = linha 7

                segundo cidadão = linha 8
            */

            const excelRow =
                person.excelIndex;


            /*
                Descobrir quantas colunas existem
            */

            const range =
                XLSX.utils.decode_range(
                    exportWorksheet["!ref"]
                );


            /*
                Colorir toda a linha
            */

            for (
                let col = range.s.c;
                col <= range.e.c;
                col++
            ) {

                const address =
                    XLSX.utils.encode_cell(
                        {
                            r:
                                excelRow - 1,

                            c:
                                col
                        }
                    );


                if (
                    !exportWorksheet[address]
                ) {
                    continue;
                }


                /*
                    Observação:

                    Para que a cor seja realmente
                    preservada no XLSX, o SheetJS
                    utilizado no HTML precisa suportar
                    estilos.
                */

                exportWorksheet[address].s = {

                    fill: {

                        patternType:
                            "solid",

                        fgColor: {

                            rgb:
                                color

                        }

                    }

                };

            }

        }
    );


    const fileName =
        `acompanhamento_${currentCycle}.xlsx`;


    XLSX.writeFile(
        workbook,
        fileName
    );

}