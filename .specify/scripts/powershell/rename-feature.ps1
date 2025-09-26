#!/usr/bin/env pwsh
# Rename a feature - handles git branches, directories, and environment variables
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$NewName,
    
    [Parameter(Position = 1)]
    [string]$OldName,
    
    [switch]$Force,
    [switch]$Json,
    [switch]$DryRun,
    [switch]$Help
)

$ErrorActionPreference = 'Stop'

if ($Help -or (-not $NewName -and -not $Help)) {
    Write-Output @"
Usage: ./rename-feature.ps1 <new-name> [old-name] [-Force] [-Json] [-DryRun] [-Help]

Parameters:
  new-name    New feature name (can include or exclude number prefix)
  old-name    Old feature name (optional, auto-detects current feature)
  -Force      Force rename even if conflicts exist
  -Json       Output results in JSON format
  -DryRun     Show what would be done without making changes
  -Help       Show this help message

Examples:
  ./rename-feature.ps1 "real-time-dashboard"
  ./rename-feature.ps1 "005-power-analysis" "004-real-time-power"
  ./rename-feature.ps1 "new-feature" -DryRun
  ./rename-feature.ps1 "renamed-feature" -Force
"@
    exit 0
}

if (-not $NewName) {
    Write-Error "New feature name is required. Use -Help for usage information."
    exit 1
}

# Import common functions
$commonScript = Join-Path $PSScriptRoot "common.ps1"
if (Test-Path $commonScript) {
    . $commonScript
}
else {
    Write-Error "Cannot find common.ps1. Please run from .specify/scripts/powershell/ directory."
    exit 1
}

# Helper functions
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

function Get-FeatureNumber {
    param([string]$Name)
    if ($Name -match '^(\d{3})-') {
        return [int]$matches[1]
    }
    return $null
}

function Normalize-FeatureName {
    param([string]$Name, [int]$DefaultNumber = 0)
    
    # If already has number prefix, return as-is
    if ($Name -match '^\d{3}-') {
        return $Name
    }
    
    # Sanitize the name
    $sanitized = $Name.ToLower() -replace '[^a-z0-9]', '-' -replace '-{2,}', '-' -replace '^-', '' -replace '-$', ''
    $words = ($sanitized -split '-') | Where-Object { $_ } | Select-Object -First 4  # Allow 4 words instead of 3
    $cleanName = [string]::Join('-', $words)
    
    # If number is provided separately, use it
    if ($DefaultNumber -gt 0) {
        return ('{0:000}-{1}' -f $DefaultNumber, $cleanName)
    }
    
    # Return just the clean name without number
    return $cleanName
}

function Find-FeatureConflicts {
    param([string]$RepoRoot, [string]$NewName, [string]$OldName)
    
    $conflicts = @()
    $specsDir = Join-Path $RepoRoot "specs"
    
    if (-not (Test-Path $specsDir)) {
        return $conflicts
    }
    
    # Check for directory conflicts
    $targetDir = Join-Path $specsDir $NewName
    if ((Test-Path $targetDir) -and $NewName -ne $OldName) {
        $conflicts += @{
            Type        = "Directory"
            Path        = $targetDir
            Description = "Target directory already exists"
        }
    }
    
    # Check for git branch conflicts
    try {
        $branches = git branch --list $NewName 2>$null
        if ($branches -and $NewName -ne $OldName) {
            $conflicts += @{
                Type        = "GitBranch"
                Name        = $NewName
                Description = "Git branch already exists"
            }
        }
    }
    catch {
        # Git not available or branch doesn't exist
    }
    
    return $conflicts
}

function Merge-FeatureDirectories {
    param([string]$SourceDir, [string]$TargetDir, [bool]$Force = $false)
    
    if (-not (Test-Path $SourceDir)) {
        Write-Warning "Source directory does not exist: $SourceDir"
        return $false
    }
    
    if (-not (Test-Path $TargetDir)) {
        Write-Info "Target directory does not exist, moving source directory"
        Move-Item $SourceDir $TargetDir
        return $true
    }
    
    Write-Info "Merging directories: $SourceDir -> $TargetDir"
    
    Get-ChildItem $SourceDir -Recurse | ForEach-Object {
        $relativePath = $_.FullName.Substring($SourceDir.Length + 1)
        $targetPath = Join-Path $TargetDir $relativePath
        $targetParent = Split-Path $targetPath -Parent
        
        # Ensure target directory exists
        if (-not (Test-Path $targetParent)) {
            New-Item -ItemType Directory -Path $targetParent -Force | Out-Null
        }
        
        if ($_.PSIsContainer) {
            # Skip directories, they're created as needed
            return
        }
        
        if (Test-Path $targetPath) {
            if ($Force) {
                Write-Warning "Overwriting existing file: $relativePath"
                Copy-Item $_.FullName $targetPath -Force
            }
            else {
                Write-Warning "Skipping existing file: $relativePath (use -Force to overwrite)"
            }
        }
        else {
            Write-Info "Copying file: $relativePath"
            Copy-Item $_.FullName $targetPath
        }
    }
    
    # Remove source directory after successful merge
    Remove-Item $SourceDir -Recurse -Force
    return $true
}

function Confirm-Action {
    param([string]$Message, [bool]$Force = $false)
    
    if ($Force) {
        return $true
    }
    
    $response = Read-Host "$Message (y/N)"
    return $response -match '^[Yy]([Ee][Ss])?$'
}

# Main execution
try {
    $repoRoot = Get-RepoRoot
    $hasGit = Test-HasGit
    $currentFeature = Get-CurrentBranch
    
    # Determine old name
    if (-not $OldName) {
        $OldName = $currentFeature
        Write-Info "Auto-detected current feature: $OldName"
    }
    
    if ($OldName -eq "main" -or $OldName -eq "master") {
        Write-Error "Cannot rename main/master branch"
        exit 1
    }
    
    # Normalize new name
    $oldNumber = Get-FeatureNumber $OldName
    if ($oldNumber -and -not ($NewName -match '^\d{3}-')) {
        # Use the same number as the old feature
        $NewName = Normalize-FeatureName $NewName $oldNumber
    }
    elseif (-not ($NewName -match '^\d{3}-')) {
        # Find next available number if no number provided
        $specsDir = Join-Path $repoRoot "specs"
        $highest = 0
        if (Test-Path $specsDir) {
            Get-ChildItem -Path $specsDir -Directory | ForEach-Object {
                if ($_.Name -match '^(\d{3})') {
                    $num = [int]$matches[1]
                    if ($num -gt $highest) { $highest = $num }
                }
            }
        }
        $nextNumber = $highest + 1
        $NewName = Normalize-FeatureName $NewName $nextNumber
    }
    # If NewName already has a number prefix, use it as-is
    
    Write-Info "Renaming feature: $OldName -> $NewName"
    
    # Check for conflicts
    $conflicts = Find-FeatureConflicts $repoRoot $NewName $OldName
    
    if ($conflicts.Count -gt 0 -and -not $Force) {
        Write-Warning "Conflicts detected:"
        foreach ($conflict in $conflicts) {
            Write-Warning "  - $($conflict.Type): $($conflict.Description)"
        }
        
        if (-not (Confirm-Action "Continue with merge/resolution?")) {
            Write-Info "Operation cancelled by user"
            exit 0
        }
    }
    
    # Prepare operations
    $operations = @()
    
    # Git branch operations
    if ($hasGit) {
        try {
            $currentGitBranch = git rev-parse --abbrev-ref HEAD 2>$null
            if ($currentGitBranch -eq $OldName) {
                $operations += @{
                    Type        = "RenameBranch"
                    Description = "Rename git branch: $OldName -> $NewName"
                    Action      = { git branch -m $OldName $NewName }
                }
            }
            else {
                $operations += @{
                    Type        = "CreateBranch"
                    Description = "Create new git branch: $NewName"
                    Action      = { git checkout -b $NewName }
                }
            }
        }
        catch {
            Write-Warning "Git operations may not be available"
        }
    }
    
    # Directory operations
    $oldDir = Join-Path $repoRoot "specs/$OldName"
    $newDir = Join-Path $repoRoot "specs/$NewName"
    
    if (Test-Path $oldDir) {
        if (Test-Path $newDir) {
            $operations += @{
                Type        = "MergeDirectories"
                Description = "Merge directories: $OldName -> $NewName"
                Action      = { Merge-FeatureDirectories $oldDir $newDir $Force }
            }
        }
        else {
            $operations += @{
                Type        = "MoveDirectory"
                Description = "Move directory: $OldName -> $NewName"
                Action      = { Move-Item $oldDir $newDir }
            }
        }
    }
    
    # Environment variable operation
    $operations += @{
        Type        = "UpdateEnvironment"
        Description = "Update SPECIFY_FEATURE environment variable: $NewName"
        Action      = { 
            # Set for current session
            $env:SPECIFY_FEATURE = $NewName
            # Set persistently in user registry
            try {
                Set-ItemProperty -Path 'HKCU:\Environment' -Name 'SPECIFY_FEATURE' -Value $NewName -ErrorAction Stop
            }
            catch {
                # Fallback to .NET method if registry method fails
                [System.Environment]::SetEnvironmentVariable('SPECIFY_FEATURE', $NewName, 'User')
            }
        }
    }
    
    # Show operations
    if ($DryRun) {
        Write-Info "Dry run - operations that would be performed:"
        foreach ($op in $operations) {
            Write-Output "  - $($op.Type): $($op.Description)"
        }
        
        if ($Json) {
            $result = @{
                DryRun     = $true
                OldName    = $OldName
                NewName    = $NewName
                Operations = $operations | ForEach-Object { @{ Type = $_.Type; Description = $_.Description } }
                Conflicts  = $conflicts
            }
            $result | ConvertTo-Json -Depth 3
        }
        exit 0
    }
    
    # Execute operations
    $results = @()
    foreach ($op in $operations) {
        try {
            Write-Info $op.Description
            $result = & $op.Action
            $results += @{
                Type        = $op.Type
                Description = $op.Description
                Success     = $true
                Result      = $result
            }
            Write-Success "Completed: $($op.Description)"
        }
        catch {
            $results += @{
                Type        = $op.Type
                Description = $op.Description
                Success     = $false
                Error       = $_.Exception.Message
            }
            Write-Error "Failed: $($op.Description) - $($_.Exception.Message)"
            
            if (-not $Force) {
                Write-Error "Operation failed. Use -Force to continue despite errors."
                exit 1
            }
        }
    }
    
    # Verify final state
    Start-Sleep -Milliseconds 500  # Give filesystem time to update
    
    $finalCheck = @{
        EnvironmentVariable = $env:SPECIFY_FEATURE
        GitBranch           = if ($hasGit) { git rev-parse --abbrev-ref HEAD 2>$null } else { "N/A" }
        SpecDirectory       = Test-Path (Join-Path $repoRoot "specs/$NewName")
        DetectedFeature     = Get-CurrentBranch
    }
    
    Write-Success "Feature successfully renamed to: $NewName"
    Write-Info "Final state verification:"
    Write-Info "  Environment Variable: $($finalCheck.EnvironmentVariable)"
    Write-Info "  Git Branch: $($finalCheck.GitBranch)"
    Write-Info "  Spec Directory Exists: $($finalCheck.SpecDirectory)"
    Write-Info "  Auto-detected Feature: $($finalCheck.DetectedFeature)"
    
    if ($Json) {
        $result = @{
            Success    = $true
            OldName    = $OldName
            NewName    = $NewName
            Operations = $results
            FinalState = $finalCheck
            Conflicts  = $conflicts
        }
        $result | ConvertTo-Json -Depth 3
    }
    
}
catch {
    Write-Error "Rename operation failed: $($_.Exception.Message)"
    
    if ($Json) {
        $result = @{
            Success = $false
            Error   = $_.Exception.Message
            OldName = $OldName
            NewName = $NewName
        }
        $result | ConvertTo-Json -Depth 2
    }
    
    exit 1
}