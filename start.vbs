Set o = CreateObject("WScript.Shell")
o.CurrentDirectory = "D:\VP Bestanden\VP AI\SSOT3"
o.Run "cmd /k npm run start", 1, False