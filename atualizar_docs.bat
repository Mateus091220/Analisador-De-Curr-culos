@echo off
echo Atualizando pasta docs com o conteúdo do frontend...

REM Apaga a pasta docs antiga, se existir
rmdir /S /Q docs

REM Cria a nova pasta docs
mkdir docs

REM Copia os arquivos da pasta frontend para a pasta docs
xcopy frontend docs /E /I /Y

echo Atualização concluída com sucesso!
pause
