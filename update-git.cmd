@echo off
setlocal

set "BASE_DIR=."
cd /d "%BASE_DIR%" || (
    echo ****************************************
    echo Failed to change directory to %BASE_DIR%
    echo ****************************************    
    exit /b
)

echo Current directory: %CD%
echo.

REM 檢查是否有子資料夾
set "found_folder=false"
for /d %%D in (*) do (
    if /i not "%%D"==".git" (
        set "found_folder=true"
        cd %%D
        echo Pulling from "%%D"
        git pull
        echo.
        cd ..
    )
)

if "%found_folder%" == "false" (
    echo ****************************************
    echo No subfolders found in '%BASE_DIR%'
    echo ****************************************
)

echo.
echo ****************************************
echo All repositories have been updated
echo ****************************************
echo.
endlocal
pause
