# Kivora AR Menu v0.6.0 — auditado

Esta versão foi reorganizada para reduzir pontos de falha.

## Arquitetura

- React
- TypeScript
- Vite
- Three.js
- WebXR
- WebXR Hit Test

`@google/model-viewer` foi removido. A visualização 3D normal e o AR agora usam
a mesma engine: Three.js.

## Modelo 3D do protótipo

`https://cdn.jsdelivr.net/gh/mindset-code/burger-house-3d@c2bddc597efe4870326c843a6e056727752fc261/public/hamburger__food_big-hamburger.glb`

O arquivo existe no repositório público `mindset-code/burger-house-3d`,
fixado no commit `c2bddc597efe4870326c843a6e056727752fc261`.

O repositório informa que os modelos vieram do Sketchfab sob licenças
Creative Commons. Antes de uso comercial, confirme a licença e atribuição
do modelo individual ou substitua por um GLB próprio do restaurante.

## Instalação limpa

Git Bash:

```bash
rm -rf node_modules
rm -f package-lock.json
npm install
npm run build
```

## Vercel

- Framework: Vite
- Build: `npm run build`
- Output: `dist`

## Teste físico

Na página deve aparecer:

`PROTÓTIPO AR • v0.6.0`

No Android/Chrome compatível:

1. Aguarde o modelo ficar pronto.
2. Toque em `Ver na minha mesa`.
3. A câmera AR deve assumir a tela.
4. Mova o aparelho devagar apontando para a mesa.
5. O círculo verde deve aparecer quando o Hit Test retornar uma superfície.
6. Toque na tela para posicionar o hambúrguer.
7. Toque em outro ponto válido para reposicionar.
8. Encerre o AR pelo controle do navegador.
9. Abra novamente para confirmar que a segunda sessão funciona.

## Diagnóstico

A página inclui um painel de diagnóstico que mostra:

- contexto HTTPS;
- presença da API WebXR;
- suporte a immersive-ar;
- estado do modelo 3D;
- estado da sessão;
- estado do Hit Test;
- se algum hit foi detectado.

Esses dados continuam disponíveis quando a sessão AR é encerrada.
