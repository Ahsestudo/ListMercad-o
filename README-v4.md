# ListMercadão v4 — compartilhamento por arquivo e som

- Exportar lista editável ou tarefas editáveis em JSON; enviar o arquivo por WhatsApp, e-mail ou Bluetooth e importar no outro dispositivo.
- A importação cria **cópias**, preservando os dados existentes. Não há sincronização automática: para receber alterações, exporte e envie um novo arquivo.
- O áudio suave exige tocar em **Ativar e testar som** com o app aberto; alguns navegadores exigem nova ativação após reiniciar. O som de notificações do sistema com o app fechado não é personalizável pelo PWA.
- Dados ficam no `localStorage` de cada dispositivo. Faça backup antes de limpar os dados do navegador ou substituir a instalação.
- Compartilhe apenas com pessoas de confiança: os arquivos JSON contêm os itens e, no caso das tarefas, podem incluir anexos e histórico.
- Publique todos os arquivos no GitHub Pages via HTTPS. Teste em dois aparelhos antes de substituir a versão de uso diário.
