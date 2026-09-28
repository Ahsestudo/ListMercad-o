/**
 * Compartilhamento offline e alertas sonoros — ListMercadão v4.
 * Arquivos JSON são cópias editáveis; não há sincronização automática.
 * Importações criam cópias com nomes/IDs novos e não substituem dados existentes.
 */
'use strict';
const LM_MAX_JSON = 8 * 1024 * 1024;
let lmAudio = null;
let lmAudioLiberado = false;

function habilitarSomAlertas() {
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) throw new Error('Áudio não suportado');
        lmAudio ||= new AudioContextClass();
        lmAudio.resume().then(() => {
            lmAudioLiberado = true;
            tocarSomAlerta();
            document.getElementById('somAlertasStatus').textContent = 'Som ativado neste acesso. O navegador pode exigir nova ativação após fechar o aplicativo.';
        }).catch(() => mostrarToast('error', 'Não foi possível liberar o áudio.'));
    } catch (_) { mostrarToast('error', 'Este navegador não permite o áudio solicitado.'); }
}
function tocarSomAlerta() {
    if (!lmAudioLiberado || !document.getElementById('somAlertas')?.checked || !lmAudio || lmAudio.state !== 'running') return;
    const agora = lmAudio.currentTime;
    [0, 0.18].forEach((delay, index) => {
        const osc = lmAudio.createOscillator(), ganho = lmAudio.createGain();
        osc.type = 'sine'; osc.frequency.value = index ? 660 : 523.25;
        ganho.gain.setValueAtTime(0.0001, agora + delay);
        ganho.gain.exponentialRampToValueAtTime(0.12, agora + delay + 0.025);
        ganho.gain.exponentialRampToValueAtTime(0.0001, agora + delay + 0.22);
        osc.connect(ganho); ganho.connect(lmAudio.destination);
        osc.start(agora + delay); osc.stop(agora + delay + 0.23);
    });
    if (navigator.vibrate) navigator.vibrate([100, 80, 100]);
}
// Os lembretes existentes já geram toast; acrescentamos áudio apenas aos de prazo.
const lmMostrarToastOriginal = mostrarToast;
mostrarToast = function(tipo, mensagem, opcoes) {
    if (tipo === 'warning' && /^(Lembrete:|Prazo:)/.test(mensagem)) tocarSomAlerta();
    return lmMostrarToastOriginal(tipo, mensagem, opcoes);
};

function lmBaixarJson(nome, conteudo) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(conteudo, null, 2)], {type:'application/json'}));
    const a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
}
async function lmLerJson(input) {
    const arquivo = input.files?.[0];
    if (!arquivo) return null;
    if (arquivo.size > LM_MAX_JSON) throw new Error('Arquivo muito grande (máximo 8 MB).');
    return JSON.parse(await arquivo.text());
}
function lmNomeDisponivel(nome) {
    let candidato = nome, n = 2;
    while (Object.prototype.hasOwnProperty.call(listas, candidato)) candidato = `${nome} (recebida ${n++})`;
    return candidato;
}
function exportarListaEditavel() {
    if (!listaAtiva || !Array.isArray(listas[listaAtiva])) return mostrarToast('error','Selecione uma lista.');
    lmBaixarJson('listmercadao-lista-editavel.json', {aplicativo:'ListMercadao', formato:'lista-editavel', versao:1, nome:listaAtiva, itens:listas[listaAtiva], saldo:saldos[listaAtiva] ?? 0});
    mostrarToast('success','Arquivo criado. Envie-o pelo WhatsApp ou outro aplicativo.');
}
async function importarListaEditavel(input) {
    try {
        const data = await lmLerJson(input); if (!data) return;
        if (data.aplicativo !== 'ListMercadao' || data.formato !== 'lista-editavel' || data.versao !== 1 || typeof data.nome !== 'string' || !data.nome.trim() || data.nome.length > 120 || !Array.isArray(data.itens) || data.itens.length > 5000) throw new Error('Formato de lista não reconhecido.');
        const itens = data.itens.map(item => {
            if (!item || typeof item.nome !== 'string' || item.nome.length > 300 || !Number.isFinite(Number(item.quantidade)) || !Number.isFinite(Number(item.valor)) || Number(item.quantidade) < 0 || Number(item.valor) < 0) throw new Error('Há itens inválidos no arquivo.');
            const quantidade = Number(item.quantidade), valor = Number(item.valor);
            return {nome:item.nome, quantidade, valor, valorTotal:quantidade*valor, comprado:!!item.comprado};
        });
        const nome = lmNomeDisponivel(data.nome.trim());
        if (!confirm(`Importar ${itens.length} itens como “${nome}”? Sua lista atual será preservada.`)) return;
        const saldo = Number(data.saldo); const saldoSeguro = Number.isFinite(saldo) ? saldo : 0;
        const anterior = listaAtiva;
        try { listas[nome] = itens; saldos[nome] = saldoSeguro; salvarListas(); salvarSaldos(); }
        catch (e) { delete listas[nome]; delete saldos[nome]; listaAtiva = anterior; throw new Error('Sem espaço para armazenar a lista.'); }
        listaAtiva = nome; atualizarSelecaoListas(); atualizarLista();
        mostrarToast('success',`Lista “${nome}” importada. Você já pode editá-la.`);
    } catch (e) { mostrarToast('error',e.message || 'Não foi possível abrir o arquivo.'); }
    finally { input.value = ''; }
}
function exportarTarefasEditaveis() {
    lmBaixarJson('listmercadao-tarefas-editaveis.json', {aplicativo:'ListMercadao', formato:'tarefas-editaveis', versao:1, tarefas});
    mostrarToast('success','Arquivo de tarefas criado.');
}
async function importarTarefasEditaveis(input) {
    try {
        const data = await lmLerJson(input); if (!data) return;
        if (data.aplicativo !== 'ListMercadao' || data.formato !== 'tarefas-editaveis' || data.versao !== 1 || !data.tarefas || !['pendente','andamento','concluida'].every(c => Array.isArray(data.tarefas[c]))) throw new Error('Formato de tarefas não reconhecido.');
        const recebidas = ['pendente','andamento','concluida'].flatMap(c => data.tarefas[c].map(t => ({coluna:c, tarefa:t})));
        if (recebidas.length > 2000 || recebidas.some(({tarefa:t}) => !t || typeof t.titulo !== 'string' || t.titulo.length > 300 || !Number.isFinite(Number(t.progresso)) || Number(t.progresso)<0 || Number(t.progresso)>100)) throw new Error('O arquivo contém tarefas inválidas.');
        if (!confirm(`Importar ${recebidas.length} tarefas como cópias? Suas tarefas atuais serão preservadas.`)) return;
        const novos = {pendente:[],andamento:[],concluida:[]};
        recebidas.forEach(({coluna,tarefa:t}, i) => {
            const copia = structuredClone(t);
            copia.id = Date.now() + i + 1 + Math.floor(Math.random()*1000000);
            copia.alertaEnviado = false; copia.avisosEnviados = [];
            normalizarTarefa(copia); registrarHistorico(copia,'Importada de arquivo compartilhado');
            novos[coluna].push(copia);
        });
        const anterior = tarefas;
        try { tarefas = {pendente:[...tarefas.pendente,...novos.pendente],andamento:[...tarefas.andamento,...novos.andamento],concluida:[...tarefas.concluida,...novos.concluida]}; salvarTarefas(); }
        catch (_) { tarefas = anterior; throw new Error('Sem espaço para armazenar as tarefas.'); }
        atualizarTarefas(); mostrarToast('success',`${recebidas.length} tarefas importadas e prontas para edição.`);
    } catch (e) { mostrarToast('error',e.message || 'Não foi possível abrir o arquivo.'); }
    finally { input.value = ''; }
}
