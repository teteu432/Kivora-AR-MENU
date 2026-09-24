# Compatibilidade — V4 Stable Anchor

## Android / Chrome com WebXR + hit-test
Modo principal: **WebXR ancorado**. A escala é calculada em metros e o produto é fixado após um toque. Quando a API WebXR Anchors está disponível, o projeto cria um `XRAnchor`; caso contrário, mantém uma pose fixa no `local referenceSpace`.

## Android sem WebXR
A aplicação mantém o visualizador 3D. Para modelos cujo GLB já esteja exportado em escala física nativa, o Scene Viewer pode ser usado como fallback.

## iPhone / iPad
O `<model-viewer>` mantém Quick Look como fallback quando suportado.

## Importante
Nenhum WebAR consegue eliminar completamente drift se o rastreamento do próprio aparelho perder referências. Mesas muito lisas, escuras, brilhantes ou sem textura pioram o tracking. A V4 impede que o nosso código reposicione ou redimensione o alimento depois da colocação; qualquer drift restante passa a ser do rastreamento do dispositivo.
