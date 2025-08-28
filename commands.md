backednd server

Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force



#Find all ports in use

netstat -ano

#kill a specific port

netstat -ano | findstr :3000
taskkill /PID 1234 /F

# Kill all Node.js processes
Get-Process -Name "node" | Stop-Process -Force

# Kill common frontend development ports (3000, 5173, 5174, 8080)
# Kill common backend ports (5000-5005, 8000, 8800)
Get-Process | Where-Object {$_.Path -like "*node*"} | ForEach-Object { 
    $netstat = netstat -ano | findstr ":3000 :5173 :5174 :8080 :5000 :5001 :5002 :5003 :5004 :5005 :8000 :8800" | findstr $_.Id
    if ($netstat) {
        Write-Host "Killing process" $_.Id "on port(s):" $netstat
        Stop-Process -Id $_.Id -Force
    }
}

# Check for any remaining processes on these ports
Write-Host "`nChecking for any remaining processes on these ports..."
netstat -ano | findstr ":3000 :5173 :5174 :8080 :5000 :5001 :5002 :5003 :5004 :5005 :8000 :8800"


#Kill all ports


# To find errors

npx tsc --noEmit



