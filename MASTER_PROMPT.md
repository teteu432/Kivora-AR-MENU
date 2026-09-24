# Kivora AR Menu — direção técnica

Projeto reiniciado do zero em 24/09/2026.

Princípios:
- câmera via getUserMedia;
- OpenCV.js para visão computacional;
- cartão físico 8 × 5 cm como referência;
- Three.js somente depois de validar tracking;
- escala física em metros;
- nada de detecção de plano na fundação;
- nada de oclusão da mão até pose/escala estarem estáveis;
- tracking 10–15 FPS e renderização separada;
- diagnosticar cada etapa isoladamente.

Ordem de implementação:
1. câmera;
2. quatro cantos;
3. solvePnP + cubo;
4. visão lateral/âncora;
5. escala 8 cm;
6. hambúrguer 13 cm;
7. pizza 32 cm;
8. otimização/fallback.
