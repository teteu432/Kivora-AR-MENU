# Kivora AR Menu — V3 Native

Protótipo de cardápio 3D/AR com fluxo simplificado para celular.

## Rodar

```bash
npm install
npm run dev
```

Para testar AR de verdade, publique em HTTPS (por exemplo Vercel) e abra pelo Chrome no Android ou Safari no iPhone.

## Fluxo

1. O cliente escolhe o prato.
2. Visualiza e gira o modelo em 3D.
3. Toca em **Ver na minha mesa**.
4. Recebe instruções rápidas para encontrar a superfície.
5. O projeto chama o modo AR que o aparelho oferece.
6. Se AR não estiver disponível, o cliente continua no 3D sem erro ou tela travada.

## Escala física

O ideal de produção é que cada GLB seja exportado em unidades reais (1 unidade = 1 metro). `ar-scale="fixed"` impede redimensionamento pelo usuário, mas não substitui um arquivo 3D fisicamente calibrado.

A pizza incluída está em aproximadamente 32 cm e é o item recomendado para validar o fluxo nativo.

Veja também `COMPATIBILITY_NOTES.md`.
