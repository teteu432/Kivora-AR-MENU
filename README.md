# Kivora AR Menu v0.8.0 — WebXR no navegador

Esta versão foi construída para reproduzir o COMPORTAMENTO da câmera mostrado
no vídeo de referência:

1. usuário toca em `Ver na minha mesa`;
2. aparece uma orientação rápida;
3. usuário toca em `Abrir câmera`;
4. WebXR abre em tela cheia dentro do navegador;
5. o navegador mostra a câmera real;
6. o próprio `<model-viewer>` cuida de Hit Test, placement e tracking;
7. o botão padrão de saída do WebXR fica no canto superior.

Não usamos:
- Scene Viewer;
- Hit Test escrito manualmente;
- retículo verde customizado;
- Three.js customizado para AR.

## AR mode

O projeto usa somente:

```html
ar-modes="webxr"
```

Assim ele não troca para o aplicativo Google Scene Viewer.

## Instalação

Extraia em uma PASTA NOVA.

```bash
npm install
npm run typecheck
npm run build
```

A versão correta mostra:

`PROTÓTIPO AR • v0.8.0`

## Modelo 3D

https://cdn.jsdelivr.net/gh/mindset-code/burger-house-3d@c2bddc597efe4870326c843a6e056727752fc261/public/hamburger__food_big-hamburger.glb

Para uso comercial, substitua por um modelo cuja licença individual esteja
documentada ou por um GLB próprio do restaurante.
