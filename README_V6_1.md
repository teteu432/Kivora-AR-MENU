# V6.1 — Camera startup fix

Esta versão corrige a tela preta antes do rastreamento.

Mudanças:
- câmera só inicia depois de toque explícito em **Abrir câmera**;
- faz um teste real com `getUserMedia()` antes de iniciar AR.js;
- exibe mensagem específica para permissão negada, câmera ocupada, HTTPS ou falha do AR.js;
- troca o CDN do AR.js para jsDelivr;
- watchdog de 7 s evita ficar eternamente numa tela preta;
- mantém o cartão físico 8 × 5 cm e a referência de 5 cm.

## Teste
Abra pela Vercel no Chrome, toque em **Abrir câmera** e aceite a permissão. Se a câmera já estiver bloqueada, altere a permissão do site no ícone de ajustes ao lado da URL.
