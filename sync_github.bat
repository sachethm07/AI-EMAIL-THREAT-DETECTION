@echo off
set "PATH=C:\Users\sache\AppData\Local\Programs\Git\cmd;%PATH%"
echo ========================================================
echo   SentinMail - Auto Sync to GitHub
echo ========================================================
echo.
echo Staging changes...
git add .
echo.
echo Committing latest progress...
git commit -m "Update: %date% %time%"
echo.
echo Pushing to GitHub (main branch)...
git push -u origin main
echo.
echo ========================================================
echo   GitHub Sync Completed!
echo ========================================================
pause
