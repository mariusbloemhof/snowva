---
description: Rename a feature including git branch, directory, and environment variables with conflict resolution
---

The user input to you can be provided directly by the agent or as a command argument - you **MUST** consider it before proceeding with the prompt (if not empty).

User input:
$ARGUMENTS

This command renames features in the .specify system, handling all aspects of the rename including git branches, spec directories, and environment variables.

Given the rename request, do this:

1. Parse the arguments to determine the new feature name and optionally the old feature name
2. Run the script `.specify/scripts/powershell/rename-feature.ps1 -Json $ARGUMENTS` from repo root
3. Parse the JSON output to understand what operations were performed
4. If conflicts are detected, explain them to the user and ask if they want to proceed with `-Force`
5. If the operation succeeds, confirm the rename and show the final state
6. If the operation fails, explain the error and suggest corrections

**Important Notes:**

- The script auto-detects the current feature if no old name is provided
- It handles number prefixes automatically (e.g., "004-" will be preserved or auto-assigned)
- Conflicts are detected for existing directories and git branches
- Use `-Force` flag for automatic conflict resolution with merging
- Use `-DryRun` flag to preview operations without making changes

**Examples:**

- Simple rename: `real-time-dashboard`
- Explicit old/new: `new-feature-name old-feature-name`
- With force: `new-name -Force`
- Preview only: `new-name -DryRun`

Always show the user what will be renamed before proceeding, and confirm the final state after completion.
