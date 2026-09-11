@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel%==0 (
    echo 使用 Node 启动本地服务...
    node server.js
    goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
    echo 未找到 Node，改用 Python 启动本地服务...
    start "" http://localhost:7788/
    python -m http.server 7788
    goto :eof
)
echo 未找到 Node 或 Python，请安装其中之一，或让开发同学用任意静态服务器托管本目录。
pause
