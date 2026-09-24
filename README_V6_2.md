# Kivora AR Menu V6.2 — correção de renderização da câmera

Esta versão corrige a tela preta observada no Android.

Mudanças principais:
- `videoTexture: true` no AR.js;
- vídeo do AR.js forçado a ficar visível atrás do canvas;
- fundo preto do container removido;
- canvas do A-Frame mantido transparente;
- removido o ciclo de abrir/fechar a câmera antes de iniciar o AR;
- adicionado `/camera-test.html` para testar a câmera sem AR.js.

## Diagnóstico
Abra primeiro `/camera-test.html`.
Se a imagem da câmera aparecer, o Chrome e a permissão estão corretos.
Depois teste o cardápio normalmente.
