# Arquitetura e responsabilidades

- **Interface (`index.html`)**: formulários, cartões, modais e carregamento de scripts. O arquivo `app.js` deve ser carregado antes de `tarefas-plus.js`.
- **Aplicação principal (`app.js`)**: estado de compras, persistência local, interação com a interface, voz e funções-base de tarefas.
- **Extensão (`tarefas-plus.js`)**: adiciona campos e visualizações às tarefas existentes. Algumas funções-base são encapsuladas e redefinidas; ao refatorar, preserve a ordem de carregamento e os contratos dessas funções.
- **Estilos (`style.css`)**: apresentação visual, layout responsivo e estados de cartões.
- **PWA (`manifest.json` e `service-worker.js`)**: instalação e cache dos arquivos estáticos.

## Fluxo de dados

Interface → funções de `app.js` / `tarefas-plus.js` → objeto de estado → `localStorage` → renderização da interface.

## Próximos passos de arquitetura

Antes de separar o JavaScript em módulos ES, remover handlers inline e criar um serviço de persistência, inclua testes de regressão. Essas mudanças exigem adaptar as referências globais usadas pelo HTML e não foram feitas nesta edição.
