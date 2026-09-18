# Kivora AR Menu v0.5.0

Esta versão troca a implementação anterior por um fluxo de WebXR Hit Test
baseado na estrutura do exemplo oficial do Three.js.

## Mudanças principais

- removidos filtros de inclinação que podiam impedir o retículo de aparecer;
- Hit Test solicitado a partir do `viewer` space durante a sessão XR;
- referência espacial obtida diretamente de `renderer.xr.getReferenceSpace()`;
- retículo verde grande e de alto contraste;
- toque na tela posiciona o hambúrguer no retículo;
- modelo único de hambúrguer, em vez do combo low-poly;
- sombra artificial suave sob o lanche para melhorar a sensação de contato com a mesa.

## Modelo 3D

URL usada no protótipo:

`https://cdn.jsdelivr.net/gh/mindset-code/burger-house-3d@c2bddc597efe4870326c843a6e056727752fc261/public/hamburger__food_big-hamburger.glb`

Antes de uso comercial, confirme a licença individual/atribuição do asset
ou substitua por um modelo próprio do restaurante.

## Instalação limpa

Git Bash:

```bash
rm -rf node_modules
rm -f package-lock.json
npm install
npm run build
```

Na interface deve aparecer:

`PROTÓTIPO AR • v0.5.0`

## Teste

1. Publique em HTTPS (Vercel).
2. Abra pelo Chrome no Android compatível.
3. Toque no botão de AR.
4. Aponte o centro da câmera para a mesa.
5. Mova o celular lentamente.
6. Assim que o círculo verde aparecer, toque na tela.
