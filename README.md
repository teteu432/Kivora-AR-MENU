# Kivora AR Menu v0.7.1

Esta versão usa apenas:

- React
- TypeScript
- Vite
- @google/model-viewer
- Google Scene Viewer / ARCore no Android

A implementação WebXR customizada foi removida.

## IMPORTANTE

Não copie este ZIP por cima da pasta antiga.

O caminho mais seguro é:

1. renomear a pasta antiga;
2. extrair este ZIP em uma pasta NOVA e vazia;
3. executar npm install;
4. executar npm run build.

Se quiser continuar usando a pasta antiga, execute também:

`CLEAN_OLD_FILES.bat`

Ele remove os arquivos WebXR obsoletos.

## Proteção extra

O `tsconfig.app.json` desta versão usa `files` em vez de incluir todo `src`.

Isso significa que arquivos antigos esquecidos na pasta não serão compilados
se não fizerem parte da aplicação atual.

## Comandos

```bash
npm install
npm run typecheck
npm run build
```

A interface deve mostrar:

`PROTÓTIPO AR • v0.7.1`
