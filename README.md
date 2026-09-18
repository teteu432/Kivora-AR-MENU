# Kivora AR Menu v0.8.2 — Scale Fix

Esta versão corrige um bug de escala acumulativa da v0.8.1.

## O bug

A versão anterior chamava `getDimensions()` novamente depois de alterar
`scale`.

Como as dimensões da cena podem refletir a transformação aplicada, a nova
calibração era calculada usando o tamanho já alterado.

Exemplo:

1. mede modelo;
2. aplica escala para 15 cm;
3. mede de novo o modelo já escalado;
4. trata essa nova medida como se fosse a medida original;
5. aplica outra escala;
6. o tamanho explode ou encolhe.

## Correção

Agora:

1. as dimensões originais são capturadas UMA ÚNICA VEZ;
2. a largura original é congelada em `originalHorizontalSizeRef`;
3. qualquer valor escolhido é sempre calculado a partir da mesma referência;
4. mudar de 13 cm para 15 cm significa exatamente uma razão 15/13;
5. nunca recalculamos a base depois de alterar `scale`;
6. `updateFraming()` é chamado após atualizar a escala para manter o preview correto.

## AR

O sistema continua usando:

`ar-modes="webxr"`

Nenhuma lógica da câmera foi alterada.

## Build

Use uma pasta nova:

```bash
npm install
npm run typecheck
npm run build
```

Procure:

`PROTÓTIPO AR • v0.8.2`
