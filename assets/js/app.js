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
    // Novos elementos para tarefas
    tarefaTitulo: document.getElementById("tarefaTitulo"),
    tarefaDescricao: document.getElementById("tarefaDescricao"),
    tarefaProgresso: document.getElementById("tarefaProgresso"),
    editTarefaModal: document.getElementById("editTarefaModal"),
    editTarefaTitulo: document.getElementById("editTarefaTitulo"),
    editTarefaDescricao: document.getElementById("editTarefaDescricao"),
    editTarefaProgresso: document.getElementById("editTarefaProgresso")
};

// Sistema de Toast Melhorado
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
        dom.totalProdutos.value = "";
        dom.totalValor.value = "";
        dom.saldoInput.value = "";
        dom.totalComSaldo.value = "";
        dom.statsCard.style.display = "none";
        return;
    }

    const itens = listas[listaAtiva];
    dom.listaVisual.innerHTML = "";
    let total = 0;
    let quantidade = 0;

    itens.forEach((item, i) => {
        total += item.valorTotal;
        quantidade += item.quantidade;

        const el = document.createElement("div");
        el.className = "list-produtos";
        el.innerHTML = `
            <span><i class="fas fa-box"></i> ${item.nome}</span>
            <span><i class="fas fa-hashtag"></i> ${item.quantidade}</span>
            <span><i class="fas fa-tag"></i> R$${item.valor.toFixed(2)}</span>
            <span><i class="fas fa-receipt"></i> R$${item.valorTotal.toFixed(2)}</span>
            <button class="btn-primary" onclick="editarItem(${i})" title="Editar produto">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-danger" onclick="removerItem(${i})" title="Remover produto">
                <i class="fas fa-trash"></i>
            </button>
        `;
        dom.listaVisual.appendChild(el);
    });

    dom.totalProdutos.value = quantidade;
    dom.totalValor.value = `R$ ${total.toFixed(2)}`;

    const saldoAtual = saldos[listaAtiva] ?? 0;
    dom.saldoInput.value = saldoAtual.toFixed(2);

    const totalComSaldo = saldoAtual - total;
    dom.totalComSaldo.value = `R$ ${totalComSaldo.toFixed(2)}`;

    // Atualizar estatísticas
    atualizarEstatisticas(total, quantidade, saldoAtual);
    dom.statsCard.style.display = "block";

    // Alertas visuais
    if (totalComSaldo < 0) {
        dom.totalComSaldo.style.color = "#ff4757";
        mostrarToast("warn", `Atenção! Você ultrapassou o saldo em R$ ${Math.abs(totalComSaldo).toFixed(2)}`, {
            prioridade: "alta",
            tempo: 8000
        });
    } else if (totalComSaldo < saldoAtual * 0.1) {
        dom.totalComSaldo.style.color = "#ffa502";
        mostrarToast("info", "Cuidado! Seu saldo está acabando.", { tempo: 6000 });
    } else {
        dom.totalComSaldo.style.color = "#2ed573";
    }
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
        valorTotal: novaQuantidade * novoValor
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
        valorTotal: qtde * valor
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
function obterTextoLista() {
    if (!listaAtiva || !listas[listaAtiva].length) return "";

    const saldoAtual = saldos[listaAtiva] ?? 0;
    const total = listas[listaAtiva].reduce((acc, item) => acc + item.valorTotal, 0);
    const totalComSaldo = total - saldoAtual;

    let texto = `🛒 LISTA: ${listaAtiva}\n`;
    texto += "═".repeat(50) + "\n\n";

    listas[listaAtiva].forEach((item, index) => {
        texto += `${index + 1}. ${item.nome}\n`;
        texto += `   📦 ${item.quantidade} x R$ ${item.valor.toFixed(2)} = R$ ${item.valorTotal.toFixed(2)}\n\n`;
    });

    texto += "═".repeat(50) + "\n";
    texto += `💰 VALOR TOTAL: R$ ${total.toFixed(2)}\n`;
    texto += `💳 SALDO DISPONÍVEL: R$ ${saldoAtual.toFixed(2)}\n`;
    texto += `💵 VALOR FINAL: R$ ${totalComSaldo.toFixed(2)}\n`;
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
function carregarTarefas() {
    const dados = localStorage.getItem('tarefas');
    if (dados) {
        tarefas = JSON.parse(dados);
        atualizarTarefas();
    }
}

function salvarTarefas() {
    localStorage.setItem('tarefas', JSON.stringify(tarefas));
}

function adicionarTarefa() {
    const titulo = dom.tarefaTitulo.value.trim();
    const descricao = dom.tarefaDescricao.value.trim();
    const progresso = parseInt(dom.tarefaProgresso.value) || 0;

    if (!titulo) {
        mostrarToast('error', 'Digite um título para a tarefa.');
        return;
    }

    const novaTarefa = {
        id: Date.now(),
        titulo: titulo,
        descricao: descricao,
        progresso: progresso,
        dataCriacao: new Date().toISOString()
    };

    // Determinar coluna baseada no progresso
    let coluna = 'pendente';
    if (progresso > 0 && progresso < 100) {
        coluna = 'andamento';
    } else if (progresso === 100) {
        coluna = 'concluida';
    }

    tarefas[coluna].push(novaTarefa);
    salvarTarefas();
    atualizarTarefas();

    // Limpar campos
    dom.tarefaTitulo.value = '';
    dom.tarefaDescricao.value = '';
    dom.tarefaProgresso.value = '';

    mostrarToast('success', 'Tarefa adicionada com sucesso!');
}

function atualizarTarefas() {
    const colunas = ['pendente', 'andamento', 'concluida'];

    colunas.forEach(coluna => {
        const container = document.getElementById(`tarefas-${coluna}`);
        container.innerHTML = '';

        tarefas[coluna].forEach(tarefa => {
            const tarefaElement = document.createElement('div');
            tarefaElement.className = `tarefa-item ${coluna === 'concluida' ? 'concluida' : ''}`;
            tarefaElement.draggable = true;
            tarefaElement.id = `tarefa-${tarefa.id}`;

            tarefaElement.innerHTML = `
                <div class="tarefa-header">
                    <div class="tarefa-titulo">${tarefa.titulo}</div>
                    <div class="tarefa-acoes">
                        <button onclick="editarTarefa(${tarefa.id})" class="btn-primary" style="padding: 4px 8px; font-size: 12px;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="excluirTarefa(${tarefa.id})" class="btn-danger" style="padding: 4px 8px; font-size: 12px;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                ${tarefa.descricao ? `<div class="tarefa-descricao">${tarefa.descricao}</div>` : ''}
                <div class="tarefa-progresso">
                    <div class="progresso-bar">
                        <div class="progresso-fill" style="width: ${tarefa.progresso}%"></div>
                    </div>
                    <div class="progresso-texto">${tarefa.progresso}% concluído</div>
                </div>
            `;

            tarefaElement.ondragstart = (e) => dragStarted(e, tarefa.id);
            container.appendChild(tarefaElement);
        });
    });
}

function editarTarefa(id) {
    // Encontrar a tarefa em qualquer coluna
    let tarefaEncontrada = null;
    let colunaEncontrada = null;

    Object.keys(tarefas).forEach(coluna => {
        const index = tarefas[coluna].findIndex(t => t.id === id);
        if (index !== -1) {
            tarefaEncontrada = tarefas[coluna][index];
            colunaEncontrada = coluna;
        }
    });

    if (tarefaEncontrada) {
        tarefaEditando = { id, coluna: colunaEncontrada };
        dom.editTarefaTitulo.value = tarefaEncontrada.titulo;
        dom.editTarefaDescricao.value = tarefaEncontrada.descricao;
        dom.editTarefaProgresso.value = tarefaEncontrada.progresso;
        dom.editTarefaModal.style.display = 'block';
    }
}

function salvarEdicaoTarefa() {
    if (!tarefaEditando) return;

    const novoTitulo = dom.editTarefaTitulo.value.trim();
    const novaDescricao = dom.editTarefaDescricao.value.trim();
    const novoProgresso = parseInt(dom.editTarefaProgresso.value) || 0;

    if (!novoTitulo) {
        mostrarToast('error', 'O título da tarefa é obrigatório.');
        return;
    }

    // Encontrar e atualizar a tarefa
    Object.keys(tarefas).forEach(coluna => {
        const index = tarefas[coluna].findIndex(t => t.id === tarefaEditando.id);
        if (index !== -1) {
            tarefas[coluna][index].titulo = novoTitulo;
            tarefas[coluna][index].descricao = novaDescricao;
            tarefas[coluna][index].progresso = novoProgresso;
        }
    });

    salvarTarefas();
    atualizarTarefas();
    fecharTarefaModal();
    mostrarToast('success', 'Tarefa atualizada com sucesso!');
}

function excluirTarefa(id) {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    Object.keys(tarefas).forEach(coluna => {
        tarefas[coluna] = tarefas[coluna].filter(t => t.id !== id);
    });

    salvarTarefas();
    atualizarTarefas();
    mostrarToast('success', 'Tarefa excluída com sucesso!');
}

function fecharTarefaModal() {
    dom.editTarefaModal.style.display = 'none';
    tarefaEditando = null;
}

// Drag and Drop
function allowDrop(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.add('tarefa-drag-over');
}

function dragStarted(ev, tarefaId) {
    ev.dataTransfer.setData("tarefaId", tarefaId);
}

function dropped(ev) {
    ev.preventDefault();
    const tarefaId = parseInt(ev.dataTransfer.getData("tarefaId"));
    const colunaDestino = ev.currentTarget.id.replace('coluna-', '');

    // Remover de todas as colunas
    Object.keys(tarefas).forEach(coluna => {
        tarefas[coluna] = tarefas[coluna].filter(t => t.id !== tarefaId);
    });

    // Encontrar a tarefa original
    let tarefaOriginal = null;
    Object.keys(tarefas).forEach(coluna => {
        const tarefa = tarefas[coluna].find(t => t.id === tarefaId);
        if (tarefa) tarefaOriginal = tarefa;
    });

    if (!tarefaOriginal) {
        // Recriar tarefa básica se não encontrada
        tarefaOriginal = { id: tarefaId, titulo: 'Tarefa', progresso: 0 };
    }

    // Adicionar na nova coluna
    tarefas[colunaDestino].push(tarefaOriginal);

    // Atualizar progresso baseado na coluna
    const index = tarefas[colunaDestino].findIndex(t => t.id === tarefaId);
    if (index !== -1) {
        if (colunaDestino === 'concluida') {
            tarefas[colunaDestino][index].progresso = 100;
        } else if (colunaDestino === 'andamento') {
            tarefas[colunaDestino][index].progresso = Math.max(1, tarefas[colunaDestino][index].progresso || 50);
        }
    }

    salvarTarefas();
    atualizarTarefas();

    // Remover classe de drag over
    document.querySelectorAll('.coluna').forEach(coluna => {
        coluna.classList.remove('tarefa-drag-over');
    });

    mostrarToast('success', 'Tarefa movida com sucesso!');
}

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