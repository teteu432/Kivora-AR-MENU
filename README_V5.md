# Kivora AR Menu — V5 Reference Card

Esta versão troca a detecção de superfície por uma referência física calibrada.

## Fluxo

1. Imprima `/reference-card.html` em 100%.
2. Confirme que o marcador quadrado mede 5 × 5 cm.
3. Abra o site pelo HTTPS da Vercel.
4. Escolha um produto e toque em **Ver na minha mesa**.
5. A câmera abre `/marker-ar.html` e procura o cartão.
6. O produto aparece ao lado do marcador em escala física calculada pelo GLB.

## Objetivos da V5

- eliminar a procura instável da mesa;
- usar 5 cm conhecidos como régua física;
- manter escala consistente ao aproximar/afastar;
- permitir contornar o produto enquanto o cartão permanece visível;
- reduzir o trabalho do aparelho removendo hit-test e anchors WebXR do fluxo principal.

## Arquivos principais

- `public/marker-ar.html` — câmera marker-based.
- `public/reference-card.html` — página para impressão.
- `public/markers/kivora-reference.patt` — padrão reconhecido pelo AR.js.
- `public/markers/kivora-reference-card-8x5cm.png` — cartão visual.

## Observação

O quadrado de 5 cm é a medida crítica. O cartão externo pode ter aproximadamente 8 × 5 cm. Se o marcador for impresso menor ou maior, a escala do alimento também será alterada proporcionalmente.
