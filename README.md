# Kivora AR Menu v0.8.1 — calibração física

Esta versão mantém a câmera/WebXR da v0.8.0 e adiciona apenas calibração de
tamanho físico.

## O que mudou

- WebXR continua sendo o único modo AR;
- `ar-scale="fixed"` continua ativo;
- o usuário escolhe a largura real do hambúrguer antes de abrir a câmera;
- presets: 11 cm, 13 cm, 15 cm e 17 cm;
- slider de 8 a 22 cm, passo de 0,5 cm;
- escala é calculada a partir das dimensões originais do GLB;
- tamanho escolhido fica salvo em `localStorage`;
- controles ficam bloqueados durante uma sessão AR.

## Como calibrar

1. Meça um hambúrguer real pela maior largura.
2. Escolha esse valor no painel.
3. Abra "Ver na minha mesa".
4. Compare com uma régua/objeto real.
5. Ajuste em passos de 0,5 cm até ficar visualmente correto.
6. Depois use esse valor como medida do produto no cadastro.

## Modelo

https://cdn.jsdelivr.net/gh/mindset-code/burger-house-3d@c2bddc597efe4870326c843a6e056727752fc261/public/hamburger__food_big-hamburger.glb

## Build

Use uma pasta nova:

```bash
npm install
npm run typecheck
npm run build
```

A interface deve mostrar:

`PROTÓTIPO AR • v0.8.1`
