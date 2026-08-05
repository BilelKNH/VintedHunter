@echo off
REM Rebuilds VintedHunterLauncher.exe and copies it to the repo root.
REM Requires csc.exe — ships with .NET Framework (Windows built-in) or Visual Studio
REM Build Tools' Roslyn compiler for a version that supports modern C# syntax.

setlocal
set "CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if exist "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\MSBuild\Current\Bin\Roslyn\csc.exe" (
  set "CSC=C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\MSBuild\Current\Bin\Roslyn\csc.exe"
)

"%CSC%" /nologo /target:exe /out:VintedHunterLauncher.exe /reference:System.Net.Http.dll Launcher.cs
if errorlevel 1 (
  echo Build failed.
  exit /b 1
)

copy /Y VintedHunterLauncher.exe ..\..\VintedHunterLauncher.exe
echo Built and copied to repo root.
