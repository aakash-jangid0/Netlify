backednd server

Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force



#Find all ports in use

netstat -ano

#kill a specific port

netstat -ano | findstr :3000
taskkill /PID 1234 /F


#Kill all ports
for /f "tokens=5" %a in ('netstat -aon ^| find "LISTENING"') do taskkill /F /PID %a

# To find errors

npx tsc --noEmit



