@echo off
setlocal

rem set "BASE_DIR=D:\_Personal\Repositories\Git\network-utils"
set "BASE_DIR=."
cd /d "%BASE_DIR%" || (
    echo ****************************************
    echo Failed to change directory to %BASE_DIR%
    echo ****************************************    
    exit /b
)

echo Current directory: %CD%

REM 檢查是否有子資料夾
set "found_folder=false"
for /d %%D in (*) do (
    if /i not "%%D"==".git" (
        set "found_folder=true"
        if exist "%%D\node_modules" (
            pushd "%%D"
            echo.
            echo ****************************************
            echo %%D
            echo ****************************************
            echo * Running [npm update]...
            call npm update
            echo.
            REM echo * Running [npm audit fix]...
            REM call npm audit fix
            REM echo.
            echo * Running [npm prune]...
            call npm prune
            popd
        ) else (
            echo.
            echo * Skipping folder '%%D': no 'node_modules'
        )
    )
)

if "%found_folder%" == "false" (
    echo ****************************************
    echo No subfolders found in '%BASE_DIR%'
    echo ****************************************
)

echo.
echo ****************************************
echo All updates completed.
echo ****************************************
echo.
endlocal
