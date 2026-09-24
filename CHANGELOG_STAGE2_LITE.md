# Alteração — Etapa 2 Lite

O OpenCV.js foi removido porque seu carregamento falhou no aparelho de teste e é desnecessariamente pesado para o primeiro objetivo do protótipo.

Agora a detecção do cartão é feita em TypeScript puro, sem dependências externas de visão computacional.

Isto também reduz o risco de:
- falha de CDN;
- inicialização WASM incompatível;
- download inicial muito grande;
- bloqueios de Content Security Policy;
- diferenças de inicialização do objeto `cv` entre versões.
