# Kivora AR Menu v0.8.3

Esta versão mantém o WebXR da v0.8.2 e transforma a escala física em uma
propriedade real do produto.

## Principal mudança

O consumidor não calibra mais o produto.

Cada item possui:

- `realWidthCm`
- `realHeightCm`
- `modelUrl`
- preço
- nome
- descrição

O modelo 3D é escalado automaticamente para a largura física cadastrada.

## Calibração de desenvolvedor

Abra:

`/?calibrate=1`

para exibir o painel técnico.

Esse painel permite testar outra largura sem alterar o cadastro oficial.

Sem `?calibrate=1`, o consumidor vê apenas o produto e o botão AR.

## Contato visual com a mesa

Mantemos:

- `ar-placement="floor"`
- `ar-scale="fixed"`

E aumentamos a sombra de contato:

- `shadow-intensity="1.45"`
- `shadow-softness="0.9"`

A sombra ajuda o objeto a parecer apoiado na superfície.

IMPORTANTE:
se o próprio GLB possuir geometria invisível/solta abaixo do hambúrguer, a
correção definitiva exige limpar o GLB em Blender ou outra ferramenta 3D.
O navegador não consegue corrigir vértices errados do asset apenas com CSS.

## Verificação de proporção

Além da largura, o sistema calcula qual altura o modelo terá depois da escala.

Se a altura prevista diferir muito de `realHeightCm`, o painel de calibração
avisa que o problema é a PROPORÇÃO do modelo, e não a escala do AR.

## Build

Use uma pasta nova:

```bash
npm install
npm run typecheck
npm run build
```

A versão correta mostra:

`PROTÓTIPO AR • v0.8.3`
