' Double-click this file to start BorderBridge without showing a terminal window.
Option Explicit

Dim shell, folder, python, app, command
Set shell = CreateObject("WScript.Shell")
folder = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
python = folder & "\.venv\Scripts\python.exe"
app = folder & "\app.py"

If Not CreateObject("Scripting.FileSystemObject").FileExists(python) Then
  MsgBox "The app's Python environment is missing. See README.md for one-time setup steps.", 16, "BorderBridge"
  WScript.Quit 1
End If

command = "cmd /c """"" & python & """ -m streamlit run """ & app & """ --server.port 8501 > """ & folder & "\work\streamlit-8501.out.log"" 2>&1"""
shell.Run command, 0, False
WScript.Sleep 2000
shell.Run "http://localhost:8501", 1, False
