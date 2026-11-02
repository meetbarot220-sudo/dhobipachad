@echo off
echo ========================================================
echo        SQUISH ARENA - 100 VS 100 CHAOTIC BRAWLER
echo ========================================================
echo Starting local web server on port 8000...
start "" http://localhost:8000
python -m http.server 8000
pause
