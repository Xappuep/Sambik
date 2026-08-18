@echo off
cd /d "%~dp0"
echo.
echo  IL-2: Nebesnyj udar
echo  ===================
echo  Starting local server...
echo  Open in browser: http://localhost:3000
echo  Press Ctrl+C to stop.
echo.
npx --yes serve . -p 3000
