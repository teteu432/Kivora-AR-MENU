# Kivora AR Menu v0.3.1

Versão corrigida com dependências compatíveis.

## Correção desta versão

`@google/model-viewer@4.1.0` usa `three ^0.172.0`.

Por isso o projeto fixa:

- three: 0.172.0
- @types/three: 0.172.0

## Instalação limpa

Se estiver substituindo uma versão anterior no Windows/Git Bash:

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

No PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
npm run build
```

Depois publique no GitHub/Vercel.

Na interface deve aparecer `PROTÓTIPO AR • v0.3.1`.
