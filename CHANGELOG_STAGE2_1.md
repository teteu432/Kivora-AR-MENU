# Stage 2.1 — filtro do cartão real

Correção baseada no teste real em que o detector marcou uma região grande do ambiente em vez do cartão.

Mudanças:
- área máxima do candidato reduzida para 22% do frame;
- candidatos que encostam nas bordas são rejeitados;
- preferência por área próxima de 6,5% do frame;
- preferência pelo centro da câmera;
- faixa de proporção mais próxima de 8:5;
- confiança mínima aumentada;
- guia 8:5 na tela para posicionar o cartão.

Objetivo: detectar apenas o cartão 8 × 5 cm antes de avançar para pose 3D.
