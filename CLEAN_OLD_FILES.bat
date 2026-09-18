@echo off
echo Limpando arquivos antigos do Kivora AR...

if exist src\components\ARSurfacePlacement.tsx del /q src\components\ARSurfacePlacement.tsx
if exist src\components\BurgerPreview.tsx del /q src\components\BurgerPreview.tsx
if exist src\components\ReliableARPlacement.tsx del /q src\components\ReliableARPlacement.tsx
if exist src\components\ARDiagnostics.tsx del /q src\components\ARDiagnostics.tsx
if exist src\lib\burgerModel.ts del /q src\lib\burgerModel.ts
if exist src\config.ts del /q src\config.ts

echo.
echo Arquivos antigos removidos.
echo Agora execute:
echo npm install
echo npm run build
pause
