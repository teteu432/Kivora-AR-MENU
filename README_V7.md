# Kivora AR Menu V7 — MindAR image tracking

A V6 usava um pattern marker do AR.js que não correspondia ao cartão real. A V7 troca isso por rastreamento natural de imagem com MindAR.

## Referência física
- cartão real: 5 cm de largura × 8 cm de altura (orientação retrato)
- hambúrguer: 13 cm
- relação: 13/5 = 2,6× a largura física do cartão

## Como funciona
1. A página compila a foto retificada do cartão em memória.
2. O usuário toca em Abrir câmera.
3. MindAR procura a imagem real do cartão.
4. Ao encontrar, o alimento é ancorado ao alvo e escalado pela largura física conhecida.

A compilação em memória é proposital nesta versão de teste. Para produção, o ideal é gerar e hospedar um arquivo .mind pré-compilado.
