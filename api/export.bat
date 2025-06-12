@echo off
setlocal enabledelayedexpansion

:: Get the name of the script itself
set "SCRIPT_NAME=%~nx0"

:: Create or clear export.txt
> export.txt echo.

:: Loop through all files in the current directory
for %%f in (*) do (
    :: Exclude the script itself
    if not "%%f"=="%SCRIPT_NAME%" (
        echo %%f: >> export.txt
        type "%%f" >> export.txt
        echo. >> export.txt
    )
)

echo All file contents (except %SCRIPT_NAME%) have been exported to export.txt
pause