# ListMercadão PWA — v3 (código organizado)

Aplicativo web de listas de compras e gerenciamento de tarefas. Esta edição organiza comentários e documentação da v3 sem migrar o armazenamento ou reescrever as regras de negócio.

## Executar localmente

Na pasta do projeto, execute `python -m http.server 8000` e acesse `http://localhost:8000`. Para publicar, envie o conteúdo desta pasta ao repositório do GitHub Pages. HTTPS ou localhost são necessários para recursos PWA e permissões de notificação.

## Estrutura

```text
index.html                 Interface e elementos dos formulários
manifest.json              Identidade e instalação do PWA
service-worker.js          Cache offline de recursos estáticos
assets/css/style.css       Estilos da interface
assets/js/app.js           Compras, voz, navegação e quadro base de tarefas
assets/js/tarefas-plus.js  Checklist, calendário, prioridades, alertas e painel
assets/icons/              Ícones do PWA
docs/ARQUITETURA.md        Organização e fluxo de dados
docs/MANUTENCAO.md         Atualizações, backup e cuidados
tests/verificar-sintaxe.sh Verificação básica dos arquivos JavaScript
```

## Dados e compatibilidade

As listas e tarefas são armazenadas no `localStorage` do navegador. A extensão mantém a chave `tarefas` das versões anteriores. Antes de publicar uma atualização, exporte um backup no aplicativo e teste em uma cópia do site. Os anexos ficam no armazenamento local e podem atingir a cota do navegador.

## Limitações

Os alertas e a criação de recorrências dependem do aplicativo em execução. Notificações com o app fechado exigem um servidor de Web Push e agendamento. Esta organização não adiciona sincronização entre dispositivos nem testes automatizados de interface.

## Verificação

Com Node.js instalado, execute `bash tests/verificar-sintaxe.sh` em Git Bash ou execute `node --check` em cada arquivo JavaScript. A verificação de sintaxe não substitui testes manuais no navegador e no celular.
