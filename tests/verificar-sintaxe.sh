#!/usr/bin/env bash
set -euo pipefail
node --check assets/js/app.js
node --check assets/js/tarefas-plus.js
node --check service-worker.js
echo "Sintaxe JavaScript: OK"
