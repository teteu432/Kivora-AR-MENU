# Kivora AR Menu — Etapa 2 Lite

Esta versão remove completamente o OpenCV.js.

## Objetivo
Abrir a câmera e detectar geometricamente o cartão físico branco de 8 × 5 cm sobre a mesa escura.

## Motor de rastreamento
O detector é escrito em TypeScript puro e roda localmente no navegador:

1. reduz a imagem para 360 × 270;
2. encontra regiões claras/neutras;
3. agrupa regiões conectadas;
4. testa proporção próxima de 8:5;
5. calcula os quatro extremos do cartão;
6. suaviza TL/TR/BR/BL entre frames.

Não existe CDN, WASM ou módulo externo de visão computacional nesta etapa.

## Rodar
```bash
npm install
npm run dev
```

Para câmera em celular, publique em HTTPS (ex.: Vercel).

## Debug
Abra `?debug=true` para ver FPS, confiança, proporção, área e tempo de processamento.
