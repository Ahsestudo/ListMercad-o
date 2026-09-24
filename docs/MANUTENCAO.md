# Manutenção e publicação

1. Exporte um backup de listas e tarefas antes de atualizar.
2. Teste a nova versão em localhost e verifique cadastro, edição, exclusão, checklist, calendário, alertas, recorrência e backup.
3. Confira o console do navegador e teste no Android antes de publicar.
4. Atualize a constante `CACHE` do service worker quando mudar arquivos publicados.
5. Publique todos os arquivos preservando caminhos relativos e a ordem dos scripts.

## Segurança e armazenamento

Não inclua senhas, tokens, chaves privadas VAPID ou dados pessoais em arquivos públicos do GitHub Pages. `localStorage` não é backup nem banco de dados compartilhado; anexos grandes podem esgotar a cota. O service worker não envia notificações com o app fechado.

## Convenções para futuras alterações

Use nomes descritivos em português de forma consistente; documente regras de negócio e efeitos colaterais; valide entradas; escape texto inserido em HTML; evite duplicar funções; mantenha mudanças pequenas e verificáveis.
