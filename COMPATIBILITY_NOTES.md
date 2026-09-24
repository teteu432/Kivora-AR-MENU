# Kivora AR Menu V3 — compatibilidade

## Estratégia

Esta versão abandona o marcador físico como fluxo principal e usa o mesmo tipo de experiência que produtos web de AR modernos oferecem: 3D no navegador + AR nativo quando o aparelho disponibiliza um modo compatível.

Ordem por produto:

- GLB já calibrado fisicamente: `scene-viewer webxr quick-look`
- GLB ainda não calibrado no próprio arquivo: `webxr quick-look`

A razão é técnica: no Android, o Scene Viewer recebe a URL do GLB original. Uma escala aplicada apenas pelo React/model-viewer não deve ser tratada como garantia de escala física no Scene Viewer. Por isso cada modelo de produção deve ser exportado com unidades reais em metros.

## Pizza

`public/models/pizza-calabresa.glb` foi conferido localmente e possui dimensões aproximadas de:

- 0,32 m de largura
- 0,03475 m de altura
- 0,32 m de profundidade

Ela é o melhor item para testar AR físico nesta versão.

## Hambúrguer

O hambúrguer atual vem de uma URL externa e é redimensionado em tempo de execução para 13 cm. Isso funciona no preview e no WebXR, porém ainda não é uma garantia para o Scene Viewer. Antes de produção, salve o modelo localmente e exporte-o já com 0,13 m de largura.

## Requisitos práticos

- servir o site em HTTPS para WebXR;
- testar no Chrome/Safari normal, não no navegador interno do Instagram;
- mesa bem iluminada e com alguma textura;
- mover o aparelho lentamente antes de posicionar;
- em aparelho sem AR, manter sempre o visualizador 3D como fallback.
