# Kivora AR Menu v0.7.0 — AR nativo

Esta versão remove a implementação customizada de WebXR Hit Test.

No Android, o projeto prioriza **Google Scene Viewer / ARCore** através do
`<model-viewer>`.

## Por que mudou

A implementação WebXR própria funcionava, mas apresentava:

- retículo grande sobre o produto;
- rastreamento visual instável;
- posicionamento pouco natural;
- muito código para ciclo de vida XR;
- mais pontos de falha.

O Scene Viewer já possui UX nativa para:

- procurar superfície;
- posicionar;
- rastrear;
- mover objeto;
- controlar escala.

## AR

Configuração:

```html
ar
ar-modes="scene-viewer webxr quick-look"
ar-placement="floor"
ar-scale="fixed"
```

A ordem prioriza Scene Viewer no Android.

## Escala

Ao carregar o GLB, o código mede o modelo com `getDimensions()` e ajusta
automaticamente `scale` para que o maior eixo horizontal fique em cerca de
15 cm.

Isso evita depender de um número de escala arbitrário.

## Modelo

`https://cdn.jsdelivr.net/gh/mindset-code/burger-house-3d@c2bddc597efe4870326c843a6e056727752fc261/public/hamburger__food_big-hamburger.glb`

Antes de uso comercial, confirme a licença individual/atribuição do asset
ou substitua por um modelo próprio/licenciado do restaurante.

## Instalação limpa

```bash
rm -rf node_modules
rm -f package-lock.json
npm install
npm run typecheck
npm run build
```

Na tela deve aparecer:

`PROTÓTIPO AR • v0.7.0`
