# ListMercadão PWA v3 — Tarefas Plus

Abra o index.html em um servidor local (por exemplo, `python -m http.server 8000`) ou publique os arquivos no GitHub Pages. Para notificações e instalação PWA, use HTTPS ou localhost.

Inclui checklist automático, calendário mensal, etiquetas e prioridades, lembretes configuráveis, tarefas recorrentes, anexos locais, histórico, painel de produtividade e backup JSON.

**Limites importantes:** dados e anexos ficam no armazenamento local do navegador, não sincronizam entre dispositivos; anexos de até 1 MB podem esgotar o espaço do navegador. Exporte backups regularmente. Notificações e recorrências são verificadas quando o app está em execução: Web Push com servidor e agendador é necessário para avisos confiáveis com o aplicativo fechado. Recorrências geram a próxima ocorrência quando a tarefa anterior é concluída e o aplicativo executa a verificação.

Ao atualizar o GitHub Pages, substitua os arquivos do site pelos arquivos extraídos deste ZIP, mantendo o armazenamento do mesmo navegador e origem. Não apague os dados do site.
