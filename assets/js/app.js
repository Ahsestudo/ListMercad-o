/**
 * ListMercadão — funcionalidades principais.
 *
 * Dependências: index.html, style.css e APIs nativas do navegador.
 * Carregamento: antes de tarefas-plus.js, que complementa o quadro de tarefas.
 * Persistência: localStorage (dados exclusivos deste navegador/origem).
 */
'use strict';

// ============================================================================
// ESTADO GLOBAL E REFERÊNCIAS DOM
// Dados mantidos no navegador. Preserve as chaves de localStorage para manter compatibilidade com versões anteriores.
// ============================================================================
let listas = {};
let listaAtiva = "";
let saldos = {};
let itemEditando = null;
let tarefas = {
    'pendente': [],
    'andamento': [],
    'concluida': []
};
let tarefaEditando = null;

const dom = {
    nomeLista: document.getElementById("nomeLista"),
    criarLista: document.getElementById("criarLista"),
    excluirLista: document.getElementById("excluirLista"),
    selecionarLista: document.getElementById("selecionarLista"),
    produtos: document.getElementById("produtos"),
    quantidade: document.getElementById("quantidade"),
    valor: document.getElementById("valor"),
    adicionar: document.querySelector("#listaMercadao"),
    listaVisual: document.querySelector(".Listageral"),
    limparLista: document.getElementById("clean"),
    totalProdutos: document.getElementById("totalList"),
    totalValor: document.getElementById("totalListValor"),
    saldoInput: document.getElementById("saldoInput"),
    salvarSaldoBtn: document.getElementById("salvarSaldoBtn"),
    totalComSaldo: document.getElementById("totalComSaldo"),
    toastContainer: document.getElementById("toastContainer"),
    statsCard: document.getElementById("statsCard"),
    totalProdutosStat: document.getElementById("totalProdutosStat"),
    valorTotalStat: document.getElementById("valorTotalStat"),
    saldoRestanteStat: document.getElementById("saldoRestanteStat"),
    progressBar: document.getElementById("progressBar"),
    editModal: document.getElementById("editModal"),
    editProduto: document.getElementById("editProduto"),
    editQuantidade: document.getElementById("editQuantidade"),
    editValor: document.getElementById("editValor"),
    vozBtn: document.getElementById("vozBtn"),
    compraProgressoCard: document.getElementById("compraProgressoCard"),
    compraProgressoTexto: document.getElementById("compraProgressoTexto"),
    compraProgressBar: document.getElementById("compraProgressBar"),
    valorPego: document.getElementById("valorPego"),
    valorFalta: document.getElementById("valorFalta"),
    desmarcarTodos: document.getElementById("desmarcarTodos"),
    instalarApp: document.getElementById("instalarApp"),
    // Novos elementos para tarefas
    tarefaTitulo: document.getElementById("tarefaTitulo"),
    tarefaDescricao: document.getElementById("tarefaDescricao"),
    tarefaProgresso: document.getElementById("tarefaProgresso"),
    tarefaPrazo: document.getElementById("tarefaPrazo"),
    tarefaAlerta: document.getElementById("tarefaAlerta"),
    editTarefaModal: document.getElementById("editTarefaModal"),
    editTarefaTitulo: document.getElementById("editTarefaTitulo"),
    editTarefaDescricao: document.getElementById("editTarefaDescricao"),
    editTarefaProgresso: document.getElementById("editTarefaProgresso"),
    editTarefaPrazo: document.getElementById("editTarefaPrazo"),
    editTarefaAlerta: document.getElementById("editTarefaAlerta")
};

// Sistema de Toast Melhorado

// ============================================================================
// FEEDBACK VISUAL
// Mensagens temporárias para informar ações e erros ao usuário.
// ============================================================================
function mostrarToast(tipo = "info", mensagem = "", opcoes = {}) {
    if (!dom.toastContainer) return;

    const tempoPadrao = 5000;
    const tempo = opcoes.tempo ?? tempoPadrao;
    const prioridade = opcoes.prioridade ?? "normal";
    const acoes = Array.isArray(opcoes.acoes) ? opcoes.acoes : [];

    const toast = document.createElement("div");
    toast.className = `toast-msg toast-${tipo}`;

    const icones = {
        success: '✅',
        error: '❌',
        warn: '⚠️',
        info: 'ℹ️'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icones[tipo] || "🔔"}</span>
        <span class="toast-text">${mensagem}</span>
        <div class="toast-actions"></div>
        <span class="toast-close" title="Fechar">&times;</span>
    `;

    const actionsContainer = toast.querySelector(".toast-actions");
    const closeBtn = toast.querySelector(".toast-close");

    closeBtn.onclick = () => {
        clearTimeout(timeoutId);
        toast.remove();
    };

    acoes.forEach(({ texto, onClick }) => {
        const btn = document.createElement("button");
        btn.className = "toast-btn";
        btn.textContent = texto;
        btn.onclick = e => {
            e.preventDefault();
            if (typeof onClick === "function") onClick();
            toast.remove();
            clearTimeout(timeoutId);
        };
        actionsContainer.appendChild(btn);
    });

    let timeoutDuracao = tempo;
    if (prioridade === "alta") {
        timeoutDuracao = Math.max(tempo, 8000);
    }

    dom.toastContainer.appendChild(toast);

    const timeoutId = setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.5s ease forwards';
        setTimeout(() => toast.remove(), 500);
    }, timeoutDuracao);
}

// ========== SISTEMA DE MERCADO ==========

// Carregar dados do localStorage

// ============================================================================
// PERSISTÊNCIA E LISTAS DE COMPRAS
// Leitura, gravação e apresentação das listas de compras.
// ============================================================================
function carregarListas() {
    const dadosListas = localStorage.getItem("listas");
    const dadosSaldos = localStorage.getItem("saldos");

    listas = dadosListas ? JSON.parse(dadosListas) : {};
    saldos = dadosSaldos ? JSON.parse(dadosSaldos) : {};

    atualizarSelecaoListas();
}

// Salvar dados no localStorage
function salvarListas() {
    localStorage.setItem("listas", JSON.stringify(listas));
}

function salvarSaldos() {
    localStorage.setItem("saldos", JSON.stringify(saldos));
}

// Atualizar seleção de listas
function atualizarSelecaoListas() {
    dom.selecionarLista.innerHTML = '<option disabled selected>📋 Selecione uma lista</option>';
    Object.keys(listas).forEach(nome => {
        const opt = document.createElement("option");
        opt.value = nome;
        opt.textContent = nome;
        if (nome === listaAtiva) opt.selected = true;
        dom.selecionarLista.appendChild(opt);
    });
}

// Atualizar estatísticas
function atualizarEstatisticas(total, quantidade, saldoAtual) {
    const totalComSaldo = saldoAtual - total;
    const percentualUsado = saldoAtual > 0 ? (total / saldoAtual) * 100 : 0;

    dom.totalProdutosStat.textContent = quantidade;
    dom.valorTotalStat.textContent = `R$ ${total.toFixed(2)}`;
    dom.saldoRestanteStat.textContent = `R$ ${Math.max(0, totalComSaldo).toFixed(2)}`;
    dom.progressBar.style.width = `${Math.min(percentualUsado, 100)}%`;

    // Cor da barra de progresso
    if (percentualUsado > 90) {
        dom.progressBar.style.background = 'linear-gradient(135deg, #ff4757, #ff6b81)';
    } else if (percentualUsado > 70) {
        dom.progressBar.style.background = 'linear-gradient(135deg, #ffa502, #ffb142)';
    } else {
        dom.progressBar.style.background = 'linear-gradient(135deg, #1ffd3a, #4cff6c)';
    }
}

// Atualizar visualização da lista
function atualizarLista() {
    if (!listaAtiva) {
        dom.listaVisual.innerHTML = "";
        dom.totalProdutos.value = ""; dom.totalValor.value = ""; dom.saldoInput.value = ""; dom.totalComSaldo.value = "";
        dom.statsCard.style.display = "none"; dom.compraProgressoCard.style.display = "none";
        return;
    }

    const itens = listas[listaAtiva] || [];
    // Compatibilidade com listas antigas: itens sem o campo comprado começam desmarcados.
    itens.forEach(item => { if (typeof item.comprado !== "boolean") item.comprado = false; });
    dom.listaVisual.innerHTML = "";
    let total = 0, quantidade = 0, valorPego = 0, pegos = 0;
    itens.forEach(item => {
        total += Number(item.valorTotal) || 0; quantidade += Number(item.quantidade) || 0;
        if (item.comprado) { valorPego += Number(item.valorTotal) || 0; pegos++; }
    });

    itens.map((item, index) => ({item, index}))
        .sort((a,b) => Number(a.item.comprado) - Number(b.item.comprado))
        .forEach(({item, index}) => {
            const el = document.createElement("div");
            el.className = `list-produtos ${item.comprado ? "produto-comprado" : ""}`;
            el.innerHTML = `
                <button class="btn-check ${item.comprado ? "checked" : ""}" onclick="alternarComprado(${index})" title="${item.comprado ? "Desmarcar" : "Marcar como pego"}">
                    <i class="fas ${item.comprado ? "fa-check-circle" : "fa-circle"}"></i> ${item.comprado ? "Peguei" : "Pegar"}
                </button>
                <span class="produto-texto"><i class="fas fa-box"></i> ${item.nome}</span>
                <span><i class="fas fa-hashtag"></i> ${item.quantidade}</span>
                <span><i class="fas fa-tag"></i> R$ ${Number(item.valor).toFixed(2)}</span>
                <span><i class="fas fa-receipt"></i> R$ ${Number(item.valorTotal).toFixed(2)}</span>
                <button class="btn-primary" onclick="editarItem(${index})" title="Editar produto"><i class="fas fa-edit"></i></button>
                <button class="btn-danger" onclick="removerItem(${index})" title="Remover produto"><i class="fas fa-trash"></i></button>`;
            dom.listaVisual.appendChild(el);
        });

    dom.totalProdutos.value = quantidade; dom.totalValor.value = `R$ ${total.toFixed(2)}`;
    const saldoAtual = saldos[listaAtiva] ?? 0; dom.saldoInput.value = Number(saldoAtual).toFixed(2);
    const saldoFinal = saldoAtual - total; dom.totalComSaldo.value = `R$ ${saldoFinal.toFixed(2)}`;
    atualizarEstatisticas(total, quantidade, saldoAtual); dom.statsCard.style.display = "block";

    const percentual = itens.length ? (pegos / itens.length) * 100 : 0;
    dom.compraProgressoCard.style.display = "block";
    dom.compraProgressoTexto.textContent = `${pegos} de ${itens.length} pegos`;
    dom.compraProgressBar.style.width = `${percentual}%`;
    dom.valorPego.textContent = `R$ ${valorPego.toFixed(2)}`;
    dom.valorFalta.textContent = `R$ ${Math.max(0, total - valorPego).toFixed(2)}`;

    if (saldoFinal < 0) dom.totalComSaldo.style.color = "#ff4757";
    else if (saldoAtual > 0 && saldoFinal < saldoAtual * 0.1) dom.totalComSaldo.style.color = "#ffa502";
    else dom.totalComSaldo.style.color = "#2ed573";
    salvarListas();
}

function alternarComprado(index) {
    if (!listaAtiva || !listas[listaAtiva][index]) return;
    listas[listaAtiva][index].comprado = !listas[listaAtiva][index].comprado;
    salvarListas(); atualizarLista();
}

// Editar produto
function editarItem(index) {
    if (!listaAtiva) return;

    const item = listas[listaAtiva][index];
    itemEditando = index;

    dom.editProduto.value = item.nome;
    dom.editQuantidade.value = item.quantidade;
    dom.editValor.value = item.valor;

    dom.editModal.style.display = "block";
}

function fecharModal() {
    dom.editModal.style.display = "none";
    itemEditando = null;
}

function salvarEdicao() {
    if (itemEditando === null || !listaAtiva) return;

    const novoNome = dom.editProduto.value.trim();
    const novaQuantidade = parseFloat(dom.editQuantidade.value);
    const novoValor = parseFloat(dom.editValor.value);

    if (!novoNome || isNaN(novaQuantidade) || isNaN(novoValor) || novaQuantidade <= 0 || novoValor <= 0) {
        mostrarToast("error", "Por favor, preencha todos os campos corretamente.");
        return;
    }

    listas[listaAtiva][itemEditando] = {
        nome: novoNome,
        quantidade: novaQuantidade,
        valor: novoValor,
        valorTotal: novaQuantidade * novoValor,
        comprado: Boolean(listas[listaAtiva][itemEditando].comprado)
    };

    salvarListas();
    mostrarToast("success", "Produto atualizado com sucesso!");
    atualizarLista();
    fecharModal();
}

// Remover produto
function removerItem(index) {
    if (!listaAtiva) return;

    if (!confirm("Tem certeza que deseja remover este item?")) return;

    listas[listaAtiva].splice(index, 1);
    salvarListas();
    mostrarToast("success", "Item removido da lista.");
    atualizarLista();
}

// Adicionar produto
dom.adicionar.addEventListener("submit", e => {
    e.preventDefault();
    if (!listaAtiva) {
        mostrarToast("error", "Selecione uma lista primeiro.");
        return;
    }

    const nome = dom.produtos.value.trim();
    const qtde = parseFloat(dom.quantidade.value);
    const valor = parseFloat(dom.valor.value);

    if (!nome || isNaN(qtde) || isNaN(valor) || qtde <= 0 || valor <= 0) {
        mostrarToast("error", "Por favor, preencha todos os campos corretamente.");
        return;
    }

    listas[listaAtiva].push({
        nome,
        quantidade: qtde,
        valor,
        valorTotal: qtde * valor,
        comprado: false
    });

    salvarListas();
    mostrarToast("success", "Produto adicionado à lista!");
    atualizarLista();

    // Limpar campos
    dom.produtos.value = "";
    dom.quantidade.value = "";
    dom.valor.value = "";
    dom.produtos.focus();
});

// Criar nova lista
dom.criarLista.addEventListener("click", () => {
    const nome = dom.nomeLista.value.trim();
    if (!nome) {
        mostrarToast("error", "Digite um nome para a lista.");
        return;
    }
    if (listas[nome]) {
        mostrarToast("error", "Já existe uma lista com esse nome.");
        return;
    }

    listas[nome] = [];
    saldos[nome] = 0;
    listaAtiva = nome;
    salvarListas();
    salvarSaldos();
    atualizarSelecaoListas();

    mostrarToast("success", `Lista "${nome}" criada com sucesso!`, {
        acoes: [{
            texto: "Adicionar Itens",
            onClick: () => dom.produtos.focus()
        }]
    });

    atualizarLista();
    dom.nomeLista.value = "";
});

// Excluir lista
dom.excluirLista.addEventListener("click", () => {
    if (!listaAtiva) {
        mostrarToast("error", "Selecione uma lista para excluir.");
        return;
    }

    if (!confirm(`Tem certeza que deseja excluir a lista "${listaAtiva}"? Esta ação não pode ser desfeita.`)) return;

    delete listas[listaAtiva];
    delete saldos[listaAtiva];

    mostrarToast("success", `Lista "${listaAtiva}" excluída.`);
    listaAtiva = "";
    salvarListas();
    salvarSaldos();
    atualizarSelecaoListas();
    atualizarLista();
});

// Selecionar lista
dom.selecionarLista.addEventListener("change", e => {
    listaAtiva = e.target.value;
    mostrarToast("info", `Lista "${listaAtiva}" selecionada.`, { tempo: 3000 });
    atualizarLista();
});

// Limpar lista
dom.limparLista.addEventListener("click", () => {
    if (!listaAtiva) {
        mostrarToast("error", "Selecione uma lista para limpar.");
        return;
    }

    if (!listas[listaAtiva].length) {
        mostrarToast("info", "A lista já está vazia.");
        return;
    }

    if (!confirm("Deseja limpar todos os itens da lista atual?")) return;

    listas[listaAtiva] = [];
    salvarListas();
    mostrarToast("success", "Lista limpa com sucesso.");
    atualizarLista();
});

// Salvar saldo
dom.salvarSaldoBtn.addEventListener("click", () => {
    if (!listaAtiva) {
        mostrarToast("error", "Selecione uma lista primeiro.");
        return;
    }

    let saldo = parseFloat(dom.saldoInput.value);
    if (isNaN(saldo) || saldo < 0) {
        mostrarToast("error", "Digite um valor válido para o saldo.");
        return;
    }

    saldos[listaAtiva] = saldo;
    salvarSaldos();
    mostrarToast("success", "Saldo atualizado com sucesso!");
    atualizarLista();
});

// Gerar texto da lista

// ============================================================================
// EXPORTAÇÃO E COMPARTILHAMENTO
// Geração de texto e arquivos a partir dos dados da lista.
// ============================================================================
function obterTextoLista() {
    if (!listaAtiva || !listas[listaAtiva].length) return "";

    const saldoAtual = saldos[listaAtiva] ?? 0;
    const total = listas[listaAtiva].reduce((acc, item) => acc + item.valorTotal, 0);
    const saldoFinal = saldoAtual - total;

    let texto = `🛒 LISTA: ${listaAtiva}\n`;
    texto += "═".repeat(50) + "\n\n";

    listas[listaAtiva].forEach((item, index) => {
        texto += `${item.comprado ? "✅" : "☐"} ${index + 1}. ${item.nome}\n`;
        texto += `   📦 ${item.quantidade} x R$ ${item.valor.toFixed(2)} = R$ ${item.valorTotal.toFixed(2)}\n\n`;
    });

    texto += "═".repeat(50) + "\n";
    texto += `💰 VALOR TOTAL: R$ ${total.toFixed(2)}\n`;
    texto += `💳 SALDO DISPONÍVEL: R$ ${saldoAtual.toFixed(2)}\n`;
    const valorPego = listas[listaAtiva].filter(i => i.comprado).reduce((acc, item) => acc + item.valorTotal, 0);
    texto += `🛒 JÁ PEGO: R$ ${valorPego.toFixed(2)}\n`;
    texto += `⏳ FALTA PEGAR: R$ ${(total - valorPego).toFixed(2)}\n`;
    texto += `💵 SALDO FINAL: R$ ${saldoFinal.toFixed(2)}\n`;
    texto += `🕒 ${new Date().toLocaleString('pt-BR')}`;

    return texto;
}

// Baixar lista
function baixarLista() {
    if (!listaAtiva) {
        mostrarToast("error", "Selecione uma lista para baixar.");
        return;
    }

    const texto = obterTextoLista();
    if (!texto) {
        mostrarToast("error", "A lista está vazia.");
        return;
    }

    const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${listaAtiva.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    mostrarToast("success", "Lista baixada com sucesso!");
}

// Compartilhar no WhatsApp
function compartilharWhatsApp() {
    if (!listaAtiva) {
        mostrarToast("error", "Selecione uma lista para compartilhar.");
        return;
    }

    const texto = encodeURIComponent(obterTextoLista());
    const url = `https://wa.me/?text=${texto}`;
    window.open(url, "_blank");
}

// Desmarcar todos os produtos
dom.desmarcarTodos?.addEventListener("click", () => {
    if (!listaAtiva) return mostrarToast("error", "Selecione uma lista primeiro.");
    listas[listaAtiva].forEach(item => item.comprado = false);
    salvarListas(); atualizarLista(); mostrarToast("success", "Todos os itens foram desmarcados.");
});

// Comando de voz (Chrome/Android e navegadores compatíveis)

// ============================================================================
// ENTRADA POR VOZ
// Interpretação de produtos, quantidades e preços em português.
// ============================================================================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (dom.vozBtn) {
    if (!SpeechRecognition) {
        dom.vozBtn.disabled = true; dom.vozBtn.title = "Reconhecimento de voz não disponível neste navegador";
    } else {
        const recognition = new SpeechRecognition();
        recognition.lang = "pt-BR"; recognition.interimResults = false; recognition.maxAlternatives = 1;
        dom.vozBtn.addEventListener("click", () => {
            if (!listaAtiva) return mostrarToast("error", "Selecione uma lista antes de usar a voz.");
            try { recognition.start(); dom.vozBtn.classList.add("ouvindo"); mostrarToast("info", "🎤 Estou ouvindo..."); } catch(e) {}
        });
        recognition.onend = () => dom.vozBtn.classList.remove("ouvindo");
        recognition.onerror = () => { dom.vozBtn.classList.remove("ouvindo"); mostrarToast("error", "Não consegui reconhecer. Tente novamente."); };
        recognition.onresult = e => interpretarVoz(e.results[0][0].transcript);
    }
}

function numeroFaladoPt(texto) {
    if (!texto) return NaN;
    let t = texto.toLowerCase().trim().replace(/\b(um|uma)\b/g, "1");
    t = t.replace(/\bdois|duas\b/g, "2").replace(/\btr[eê]s\b/g, "3")
         .replace(/\bquatro\b/g, "4").replace(/\bcinco\b/g, "5")
         .replace(/\bseis\b/g, "6").replace(/\bsete\b/g, "7")
         .replace(/\boito\b/g, "8").replace(/\bnove\b/g, "9").replace(/\bdez\b/g, "10");
    const n = parseFloat(t.replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
}

function precoFaladoPt(texto) {
    let t = texto.toLowerCase().trim()
        .replace(/r\$/g, "")
        .replace(/\s+/g, " ");

    // Ex.: "5 reais e 99 centavos" / "5 real e 50 centavos"
    let m = t.match(/(\d+(?:[.,]\d+)?)\s*reais?\s*(?:e\s*)?(\d{1,2})?\s*(?:centavos?)?/i);
    if (m) {
        const reais = parseFloat(m[1].replace(",", "."));
        const centavos = m[2] ? parseInt(m[2], 10) : 0;
        return reais + centavos / 100;
    }

    // Ex.: "5 e 99", "5,99", "5.99" ou "5"
    m = t.match(/^(\d+)(?:\s+e\s+(\d{1,2})|[.,](\d{1,2}))?(?:\s*(?:reais?|real))?(?:\s*cada)?$/i);
    if (m) {
        const reais = parseInt(m[1], 10);
        const cents = m[2] ?? m[3];
        return cents != null ? reais + parseInt(cents, 10) / 100 : reais;
    }
    return NaN;
}

function interpretarVoz(frase) {
    let texto = frase.toLowerCase().trim()
        .replace(/^adicionar\s+/, "")
        .replace(/^adiciona\s+/, "")
        .replace(/^colocar\s+/, "")
        .replace(/^coloca\s+/, "");

    const qtdMatch = texto.match(/^(\d+(?:[.,]\d+)?|um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez)\s+(?:unidades?\s+(?:de\s+)?)?/i);
    let quantidade = 1;
    if (qtdMatch) {
        quantidade = numeroFaladoPt(qtdMatch[1]);
        texto = texto.slice(qtdMatch[0].length).trim();
    }

    // Separa o produto do preço. Aceita: "a", "por", "de", "custando" e "valor de".
    const precoMatch = texto.match(/^(.*?)\s+(?:a|por|de|custando|valor\s+de)\s+(.+?)(?:\s+cada)?$/i);
    if (precoMatch) {
        const produto = precoMatch[1].trim();
        const preco = precoFaladoPt(precoMatch[2].replace(/\s+cada$/i, "").trim());
        if (produto && Number.isFinite(preco) && preco > 0 && quantidade > 0) {
            dom.produtos.value = produto;
            dom.quantidade.value = quantidade;
            dom.valor.value = preco.toFixed(2);
            const total = quantidade * preco;
            mostrarToast("success", `🎤 Entendi: ${quantidade} ${produto} × R$ ${preco.toFixed(2)} = R$ ${total.toFixed(2)}.`, {
                tempo: 10000,
                acoes: [
                    { texto: "✓ Adicionar", onClick: () => dom.adicionar.requestSubmit() },
                    { texto: "✏️ Corrigir", onClick: () => dom.produtos.focus() }
                ]
            });
            return;
        }
    }

    // Sem preço: mantém produto/quantidade e permite completar manualmente.
    dom.quantidade.value = quantidade;
    dom.produtos.value = texto;
    dom.valor.value = "";
    dom.valor.focus();
    mostrarToast("info", "Produto e quantidade reconhecidos. Fale também o preço, por exemplo: ‘3 leites a 5 reais e 99 centavos cada’. ");
}

// Instalação PWA

// ============================================================================
// INSTALAÇÃO E NAVEGAÇÃO PWA
// Fluxo de instalação e troca de telas.
// ============================================================================
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredPrompt = e; if (dom.instalarApp) dom.instalarApp.style.display = "flex"; });
dom.instalarApp?.addEventListener("click", async () => {
    if (!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; dom.instalarApp.style.display = "none";
});
window.addEventListener("appinstalled", () => mostrarToast("success", "ListMercadão instalado no celular!"));

// ========== SISTEMA DE TAREFAS ==========

// Sistema de Abas
function mostrarAba(aba) {
    document.getElementById('aba-mercado').style.display = aba === 'mercado' ? 'block' : 'none';
    document.getElementById('aba-tarefas').style.display = aba === 'tarefas' ? 'block' : 'none';

    // Animar a transição
    const elemento = document.getElementById(`aba-${aba}`);
    elemento.style.animation = 'fadeInUp 0.5s ease';
}

// Sistema de Tarefas

// ============================================================================
// TAREFAS: PERSISTÊNCIA E QUADRO
// O arquivo tarefas-plus.js estende estas funções; mantenha os nomes globais compatíveis.
// ============================================================================
function carregarTarefas() {
    const dados = localStorage.getItem('tarefas');
    if (dados) {
        try { tarefas = JSON.parse(dados); } catch (e) { console.error(e); }
    }
    ['pendente','andamento','concluida'].forEach(c => { if (!Array.isArray(tarefas[c])) tarefas[c] = []; });
    atualizarTarefas();
    verificarAlertasTarefas();
}

function salvarTarefas() { localStorage.setItem('tarefas', JSON.stringify(tarefas)); }
function escaparHtml(v='') { const d=document.createElement('div'); d.textContent=v; return d.innerHTML; }
function formatarPrazo(valor) {
    if (!valor) return '';
    const d = new Date(valor);
    return isNaN(d) ? '' : d.toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'});
}
function classePrazo(tarefa) {
    if (!tarefa.prazo || tarefa.progresso >= 100) return '';
    const ms = new Date(tarefa.prazo).getTime() - Date.now();
    if (ms < 0) return 'prazo-atrasado';
    if (ms <= 24*60*60*1000) return 'prazo-proximo';
    return '';
}
async function pedirPermissaoNotificacao() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'default') {
        try { return (await Notification.requestPermission()) === 'granted'; } catch(e) { return false; }
    }
    return false;
}
async function notificarTarefa(tarefa) {
    const titulo = '⏰ Prazo da tarefa';
    const body = `${tarefa.titulo} — prazo ${formatarPrazo(tarefa.prazo)}`;
    try {
        const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.ready : null;
        if (reg && reg.showNotification) await reg.showNotification(titulo, { body, icon:'./assets/icons/icon-192.png', badge:'./assets/icons/icon-192.png', tag:`tarefa-${tarefa.id}` });
        else if ('Notification' in window && Notification.permission === 'granted') new Notification(titulo, {body});
    } catch(e) { console.error(e); }
}
function verificarAlertasTarefas() {
    let mudou = false;
    Object.keys(tarefas).forEach(coluna => tarefas[coluna].forEach(t => {
        if (!t.prazo || !t.alerta || t.alertaEnviado || t.progresso >= 100) return;
        if (Date.now() >= new Date(t.prazo).getTime()) {
            t.alertaEnviado = true; mudou = true;
            if ('Notification' in window && Notification.permission === 'granted') notificarTarefa(t);
            mostrarToast('warning', `Prazo: ${t.titulo}`);
        }
    }));
    if (mudou) salvarTarefas();
    atualizarIndicadoresPrazo();
}
function atualizarIndicadoresPrazo() {
    document.querySelectorAll('.tarefa-item').forEach(el => {
        const id = Number(el.dataset.id); let t=null;
        Object.values(tarefas).some(arr => (t=arr.find(x=>x.id===id)));
        if (t) { el.classList.remove('prazo-atrasado','prazo-proximo'); const c=classePrazo(t); if(c) el.classList.add(c); }
    });
}
function adicionarTarefa() {
    const titulo = dom.tarefaTitulo.value.trim();
    const descricao = dom.tarefaDescricao.value.trim();
    const progresso = Math.min(100, Math.max(0, parseInt(dom.tarefaProgresso.value) || 0));
    const prazo = dom.tarefaPrazo.value || '';
    const alerta = !!dom.tarefaAlerta.checked;
    if (!titulo) { mostrarToast('error', 'Digite um título para a tarefa.'); return; }
    const novaTarefa = { id:Date.now(), titulo, descricao, progresso, prazo, alerta, alertaEnviado:false, dataCriacao:new Date().toISOString() };
    let coluna = progresso === 100 ? 'concluida' : progresso > 0 ? 'andamento' : 'pendente';
    tarefas[coluna].push(novaTarefa); salvarTarefas(); atualizarTarefas();
    dom.tarefaTitulo.value=''; dom.tarefaDescricao.value=''; dom.tarefaProgresso.value='0'; dom.tarefaPrazo.value=''; dom.tarefaAlerta.checked=true;
    const pv=document.getElementById('tarefaProgressoValor'); if(pv) pv.textContent='0%';
    if (alerta && prazo) pedirPermissaoNotificacao();
    mostrarToast('success', 'Tarefa adicionada com sucesso!');
}
function atualizarTarefas() {
    ['pendente','andamento','concluida'].forEach(coluna => {
        const container=document.getElementById(`tarefas-${coluna}`); container.innerHTML='';
        tarefas[coluna].forEach(tarefa => {
            const el=document.createElement('div');
            const cp=classePrazo(tarefa);
            el.className=`tarefa-item ${coluna==='concluida'?'concluida':''} ${cp}`; el.draggable=true; el.id=`tarefa-${tarefa.id}`; el.dataset.id=tarefa.id;
            const prazoTexto=formatarPrazo(tarefa.prazo);
            el.innerHTML=`<div class="tarefa-header"><div class="tarefa-titulo">${escaparHtml(tarefa.titulo)}</div><div class="tarefa-acoes">
                <button onclick="editarTarefa(${tarefa.id})" class="btn-primary tarefa-btn"><i class="fas fa-edit"></i></button>
                <button onclick="excluirTarefa(${tarefa.id})" class="btn-danger tarefa-btn"><i class="fas fa-trash"></i></button></div></div>
                ${tarefa.descricao?`<div class="tarefa-descricao">${escaparHtml(tarefa.descricao)}</div>`:''}
                ${prazoTexto?`<div class="tarefa-prazo"><i class="fas fa-calendar-alt"></i> ${prazoTexto} ${tarefa.alerta?'<i class="fas fa-bell" title="Alerta ativado"></i>':''}</div>`:''}
                <div class="tarefa-progresso"><div class="progresso-bar"><div class="progresso-fill" style="width:${tarefa.progresso}%"></div></div>
                <div class="progresso-controles"><input aria-label="Progresso" type="range" min="0" max="100" step="5" value="${tarefa.progresso}" oninput="alterarProgressoTarefa(${tarefa.id}, this.value)"><span>${tarefa.progresso}%</span></div></div>`;
            el.ondragstart=e=>dragStarted(e,tarefa.id); container.appendChild(el);
        });
    });
}
function encontrarTarefa(id) { for (const coluna of Object.keys(tarefas)) { const index=tarefas[coluna].findIndex(t=>t.id===id); if(index!==-1) return {tarefa:tarefas[coluna][index], coluna, index}; } return null; }
function alterarProgressoTarefa(id, valor) {
    const achou=encontrarTarefa(id); if(!achou)return; const p=Math.min(100,Math.max(0,Number(valor)||0));
    achou.tarefa.progresso=p; let destino=p===100?'concluida':p>0?'andamento':'pendente';
    if(destino!==achou.coluna){ tarefas[achou.coluna].splice(achou.index,1); tarefas[destino].push(achou.tarefa); }
    salvarTarefas(); atualizarTarefas();
}
function editarTarefa(id) {
    const a=encontrarTarefa(id); if(!a)return; tarefaEditando={id,coluna:a.coluna};
    dom.editTarefaTitulo.value=a.tarefa.titulo; dom.editTarefaDescricao.value=a.tarefa.descricao||''; dom.editTarefaProgresso.value=a.tarefa.progresso||0;
    dom.editTarefaPrazo.value=a.tarefa.prazo||''; dom.editTarefaAlerta.checked=!!a.tarefa.alerta;
    const pv=document.getElementById('editTarefaProgressoValor'); if(pv) pv.textContent=(a.tarefa.progresso||0)+'%'; dom.editTarefaModal.style.display='block';
}
function salvarEdicaoTarefa() {
    if(!tarefaEditando)return; const a=encontrarTarefa(tarefaEditando.id); if(!a)return;
    const titulo=dom.editTarefaTitulo.value.trim(); if(!titulo){mostrarToast('error','O título da tarefa é obrigatório.');return;}
    const p=Math.min(100,Math.max(0,parseInt(dom.editTarefaProgresso.value)||0)); const prazo=dom.editTarefaPrazo.value||'';
    const prazoMudou=prazo!==a.tarefa.prazo;
    Object.assign(a.tarefa,{titulo,descricao:dom.editTarefaDescricao.value.trim(),progresso:p,prazo,alerta:!!dom.editTarefaAlerta.checked}); if(prazoMudou)a.tarefa.alertaEnviado=false;
    const destino=p===100?'concluida':p>0?'andamento':'pendente'; if(destino!==a.coluna){tarefas[a.coluna].splice(a.index,1);tarefas[destino].push(a.tarefa);}
    salvarTarefas(); atualizarTarefas(); fecharTarefaModal(); if(a.tarefa.alerta&&prazo) pedirPermissaoNotificacao(); mostrarToast('success','Tarefa atualizada com sucesso!');
}
function excluirTarefa(id) { if(!confirm('Tem certeza que deseja excluir esta tarefa?'))return; Object.keys(tarefas).forEach(c=>tarefas[c]=tarefas[c].filter(t=>t.id!==id)); salvarTarefas(); atualizarTarefas(); mostrarToast('success','Tarefa excluída com sucesso!'); }
function fecharTarefaModal(){dom.editTarefaModal.style.display='none';tarefaEditando=null;}
function allowDrop(ev){ev.preventDefault();ev.currentTarget.classList.add('tarefa-drag-over');}
function dragStarted(ev,id){ev.dataTransfer.setData('tarefaId',id);}
function dropped(ev){
    ev.preventDefault(); const id=parseInt(ev.dataTransfer.getData('tarefaId')); const destino=ev.currentTarget.id.replace('coluna-',''); const a=encontrarTarefa(id); if(!a)return;
    const t=a.tarefa; tarefas[a.coluna].splice(a.index,1); if(destino==='concluida')t.progresso=100; else if(destino==='andamento'&&(t.progresso===0||t.progresso===100))t.progresso=50; else if(destino==='pendente')t.progresso=0;
    tarefas[destino].push(t); salvarTarefas(); atualizarTarefas(); document.querySelectorAll('.coluna').forEach(c=>c.classList.remove('tarefa-drag-over')); mostrarToast('success','Tarefa movida com sucesso!');
}
setInterval(verificarAlertasTarefas, 30000);

// ========== INICIALIZAÇÃO ==========

// Fechar modal ao clicar fora
window.addEventListener('click', (e) => {
    if (e.target === dom.editModal) {
        fecharModal();
    }
    if (e.target === dom.editTarefaModal) {
        fecharTarefaModal();
    }
});

// Tecla ESC fecha modal

// ============================================================================
// EVENTOS E INICIALIZAÇÃO
// Registre os eventos depois de definir as funções utilizadas.
// ============================================================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        fecharModal();
        fecharTarefaModal();
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', function () {
    carregarListas();
    carregarTarefas();
    atualizarLista();

    // Mostrar aba mercado por padrão
    mostrarAba('mercado');
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(console.error);
});

// Adicionar CSS para animação de saída do toast
const style = document.createElement('style');
style.textContent = `
    @keyframes toastSlideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);