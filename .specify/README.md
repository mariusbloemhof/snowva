# .specify System Documentation

## Overview

The `.specify` system is a feature-driven development workflow that integrates with Git branches and provides structured project organization. It automatically manages feature specifications, implementation plans, and development workflows.

## Architecture

### Directory Structure

```
.specify/
├── scripts/powershell/          # PowerShell automation scripts
│   ├── create-new-feature.ps1   # Create new feature branch and spec
│   ├── setup-plan.ps1           # Setup implementation planning
│   ├── update-agent-context.ps1 # Update development context
│   ├── check-prerequisites.ps1  # Validate environment
│   └── common.ps1               # Shared functions and logic
├── templates/                   # Template files for feature documents
│   ├── spec-template.md         # Feature specification template
│   ├── plan-template.md         # Implementation plan template
│   ├── tasks-template.md        # Task breakdown template
│   └── agent-file-template.md   # Development context template
└── memory/                      # Persistent system knowledge
    └── constitution.md          # Core development principles
```

### Generated Feature Structure

```
specs/
└── 001-feature-name/           # Auto-generated feature directory
    ├── spec.md                 # Feature specification (mandatory)
    ├── plan.md                 # Implementation plan (optional)
    ├── tasks.md                # Task breakdown (optional)
    ├── research.md             # Research notes (optional)
    ├── data-model.md           # Data modeling (optional)
    ├── quickstart.md           # Quick setup guide (optional)
    └── contracts/              # Implementation contracts (optional)
        └── *.md
```

## Configuration System

### Priority Hierarchy

The system uses a **multi-layered configuration detection** with the following priority order:

1. **Environment Variable**: `$env:SPECIFY_FEATURE` (highest priority)
2. **Git Branch**: Current git branch name (if git is available)
3. **Directory Scanning**: Latest numbered directory in `specs/` folder (fallback)
4. **Default**: "main" (ultimate fallback)

### Configuration Detection Logic

```powershell
function Get-CurrentBranch {
    # Priority 1: Environment variable
    if ($env:SPECIFY_FEATURE) {
        return $env:SPECIFY_FEATURE
    }
    
    # Priority 2: Git branch
    try {
        $result = git rev-parse --abbrev-ref HEAD 2>$null
        if ($LASTEXITCODE -eq 0) {
            return $result
        }
    } catch {
        # Git command failed
    }
    
    # Priority 3: Latest feature directory
    $specsDir = Join-Path $repoRoot "specs"
    if (Test-Path $specsDir) {
        $latestFeature = ""
        $highest = 0
        
        Get-ChildItem -Path $specsDir -Directory | ForEach-Object {
            if ($_.Name -match '^(\d{3})-') {
                $num = [int]$matches[1]
                if ($num -gt $highest) {
                    $highest = $num
                    $latestFeature = $_.Name
                }
            }
        }
        
        if ($latestFeature) {
            return $latestFeature
        }
    }
    
    # Priority 4: Default fallback
    return "main"
}
```

### Key Points

- **No Persistent Config Files**: The system is stateless and determines configuration dynamically
- **Session-Based Environment Variables**: `$env:SPECIFY_FEATURE` persists only for the current PowerShell session
- **Git Integration**: Automatically syncs with Git branches when available
- **Fallback Mechanisms**: Works even in non-Git repositories

## Feature Management Workflows

### Creating a New Feature

```powershell
# Basic usage
./create-new-feature.ps1 "feature description"

# JSON output (for automation)
./create-new-feature.ps1 -Json "feature description"
```

**What happens:**
1. Scans existing `specs/` directory for highest feature number
2. Generates next sequential number (e.g., `004`)
3. Creates sanitized branch name: `004-feature-description`
4. Creates Git branch (if Git is available)
5. Creates feature directory: `specs/004-feature-description/`
6. Copies `spec-template.md` to `specs/004-feature-description/spec.md`
7. Sets `$env:SPECIFY_FEATURE` for current session

### Working with Features

```powershell
# Check current feature detection
Write-Host "Environment: $env:SPECIFY_FEATURE"
Write-Host "Git Branch: $(git branch --show-current)"
Write-Host "Spec Folders: $(Get-ChildItem specs\ -Directory | Select-Object -ExpandProperty Name)"

# Setup implementation planning
./setup-plan.ps1

# Update development context
./update-agent-context.ps1
```

## Troubleshooting and Management

### Common Issues

#### Issue 1: Mismatched Environment Variable and Git Branch

**Symptoms:**
- Scripts reference wrong feature directory
- Environment variable shows `003-feature-name` but Git branch is `004-feature-name`

**Solution:**
```powershell
# Option A: Clear environment variable (use Git branch detection)
Remove-Item env:SPECIFY_FEATURE -ErrorAction SilentlyContinue

# Option B: Update environment variable to match Git branch
$env:SPECIFY_FEATURE = "004-feature-name"
```

#### Issue 2: Duplicate Feature Directories

**Symptoms:**
- Multiple directories with same feature name but different numbers
- Scripts confused about which directory to use

**Solution:**
```powershell
# Remove unwanted duplicate directories
Remove-Item "specs\003-old-feature" -Recurse -Force

# Clear environment variable to force re-detection
Remove-Item env:SPECIFY_FEATURE -ErrorAction SilentlyContinue
```

#### Issue 3: Branch and Directory Name Mismatch

**Symptoms:**
- Git branch name doesn't match spec directory name
- Scripts can't find expected files

**Solution:**
```powershell
# Method 1: Rename Git branch to match directory
git branch -m old-branch-name new-branch-name

# Method 2: Rename directory to match Git branch
Rename-Item "specs\old-dir-name" "specs\new-dir-name"

# Method 3: Use environment variable override
$env:SPECIFY_FEATURE = "correct-feature-name"
```

### Feature Renaming Workflow

To properly rename a feature, follow this complete workflow:

```powershell
# 1. Clear environment variable
Remove-Item env:SPECIFY_FEATURE -ErrorAction SilentlyContinue

# 2. Rename Git branch
git branch -m old-feature-name new-feature-name

# 3. Rename spec directory
Rename-Item "specs\old-feature-name" "specs\new-feature-name"

# 4. Update environment variable (optional, will auto-detect from Git)
$env:SPECIFY_FEATURE = "new-feature-name"

# 5. Verify the change
Write-Host "Environment: $env:SPECIFY_FEATURE"
Write-Host "Git Branch: $(git branch --show-current)"
Write-Host "Spec Directory: $(Test-Path specs\new-feature-name)"
```

### Feature Cleanup Workflow

To remove old or duplicate features:

```powershell
# 1. List all features
Get-ChildItem specs\ -Directory | Select-Object Name

# 2. Remove unwanted feature directories
Remove-Item "specs\unwanted-feature" -Recurse -Force

# 3. Clear environment variable to force re-detection
Remove-Item env:SPECIFY_FEATURE -ErrorAction SilentlyContinue

# 4. Verify current detection
Write-Host "Current feature: $(& .\.specify\scripts\powershell\common.ps1; Get-CurrentBranch)"
```

## Best Practices

### Development Workflow

1. **Always Create Features Properly**
   ```powershell
   ./create-new-feature.ps1 "descriptive-feature-name"
   ```

2. **Check Current State Regularly**
   ```powershell
   # Quick status check
   Write-Host "Feature: $env:SPECIFY_FEATURE | Branch: $(git branch --show-current)"
   ```

3. **Clean Environment Between Features**
   ```powershell
   # When switching features
   Remove-Item env:SPECIFY_FEATURE -ErrorAction SilentlyContinue
   git checkout new-feature-branch
   ```

4. **Use Git Branch Names as Source of Truth**
   - Let environment variable auto-detect from Git branch
   - Only set `$env:SPECIFY_FEATURE` when overriding is necessary

### Naming Conventions

- **Branch Names**: `001-feature-description` (3-digit number + kebab-case)
- **Directory Names**: Must match branch names exactly
- **Feature Numbers**: Sequential, no gaps preferred
- **Descriptions**: Use descriptive, concise names (max 3 words after number)

### Repository Integration

- **Git Repository**: Full functionality with automatic branch management
- **Non-Git Repository**: Limited functionality, uses directory scanning and environment variables
- **Hybrid Approach**: Can work with partial Git integration

## Script Reference

### create-new-feature.ps1

**Usage:** `./create-new-feature.ps1 [-Json] <feature description>`

**Parameters:**
- `-Json`: Output results in JSON format for automation
- `<feature description>`: Natural language description of the feature

**Outputs:**
- Creates Git branch (if Git available)
- Creates feature directory in `specs/`
- Copies spec template
- Sets `$env:SPECIFY_FEATURE`
- Returns feature metadata

### setup-plan.ps1

**Usage:** `./setup-plan.ps1 [-Json] [-Help]`

**Purpose:** Initializes implementation planning documents

### update-agent-context.ps1

**Usage:** `./update-agent-context.ps1`

**Purpose:** Updates development context and agent files

### rename-feature.ps1

**Usage:** `./rename-feature.ps1 -NewName <new-name> [-DryRun] [-Force] [-Verbose] [-Json]`

**Parameters:**
- `-NewName`: New name for the feature (will be normalized and numbered)
- `-DryRun`: Show what would be renamed without actually renaming
- `-Force`: Force rename even with conflicts (enables directory merging)
- `-Verbose`: Show detailed progress information
- `-Json`: Output results in JSON format for automation

**Features:**
- Auto-detects current feature from environment/branch/directory
- Handles conflicts with existing features
- Can merge directories when using `-Force`
- Updates Git branch, spec directory, and environment variables atomically
- Comprehensive validation and rollback on errors
- Supports up to 4 words in feature names (normalized to kebab-case)

### common.ps1

**Purpose:** Shared functions used by all scripts
- `Get-RepoRoot()`: Find repository root directory
- `Get-CurrentBranch()`: Determine current feature
- `Test-HasGit()`: Check Git availability
- `Test-FeatureBranch()`: Validate feature branch naming
- `Get-FeaturePathsEnv()`: Get all feature-related paths

## Advanced Usage

### Automation Integration

```powershell
# Create feature programmatically
$result = ./create-new-feature.ps1 -Json "automated feature" | ConvertFrom-Json
Write-Host "Created feature: $($result.BRANCH_NAME)"
Write-Host "Spec file: $($result.SPEC_FILE)"

# Use in CI/CD pipelines
if ($result.HAS_GIT) {
    Write-Host "Git integration available"
} else {
    Write-Host "Running in non-Git mode"
}
```

### Multi-Repository Support

The system works across different repository types:
- **Full Git repositories**: Complete feature set
- **Git repositories without remote**: Local Git features only
- **Non-Git directories**: Basic feature management with directory scanning
- **Mixed environments**: Graceful fallback between modes

### Environment Variable Management

```powershell
# Check all SPECIFY-related environment variables
Get-ChildItem env: | Where-Object { $_.Name -like "*SPECIFY*" }

# Persist environment variable across sessions (optional)
[Environment]::SetEnvironmentVariable("SPECIFY_FEATURE", "004-feature-name", "User")

# Remove persistent environment variable
[Environment]::SetEnvironmentVariable("SPECIFY_FEATURE", $null, "User")
```

## Troubleshooting Reference

### Diagnostic Commands

```powershell
# Full system status
Write-Host "=== .specify System Status ==="
Write-Host "Repository Root: $(Get-Location)"
Write-Host "Git Available: $(if (git --version 2>$null) { 'Yes' } else { 'No' })"
Write-Host "Current Branch: $(git branch --show-current 2>$null)"
Write-Host "Environment Variable: $env:SPECIFY_FEATURE"
Write-Host "Spec Directories:"
Get-ChildItem specs\ -Directory | ForEach-Object { Write-Host "  - $($_.Name)" }
```

### Reset Commands

```powershell
# Nuclear reset (use with caution)
Remove-Item env:SPECIFY_FEATURE -ErrorAction SilentlyContinue
Write-Host "Environment cleared. Current detection will use Git branch or latest spec directory."

# Verify reset worked
$detectedFeature = & { 
    . .\.specify\scripts\powershell\common.ps1
    Get-CurrentBranch 
}
Write-Host "Detected feature: $detectedFeature"
```

## Support and Maintenance

### File Locations

- **System Scripts**: `.specify/scripts/powershell/`
- **Templates**: `.specify/templates/`
- **Generated Features**: `specs/`
- **Documentation**: `.specify/README.md` (this file)

### Extending the System

To add new functionality:
1. Add functions to `common.ps1` for shared logic
2. Create new scripts in `scripts/powershell/`
3. Add templates to `templates/` directory
4. Update this documentation

### Version Compatibility

- **PowerShell**: Requires PowerShell 5.1+ or PowerShell Core 6.0+
- **Git**: Optional but recommended for full functionality
- **Operating Systems**: Windows, macOS, Linux (via PowerShell Core)

---

*Last Updated: September 25, 2025*
*Version: 1.0*