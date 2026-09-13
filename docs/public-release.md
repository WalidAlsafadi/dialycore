# Creating the clean public repository

The private repository history must never be made public. These PowerShell commands export only the current Git index into a new sibling directory, excluding `.git`, ignored databases, local environments, reports, build output, and other untracked artifacts.

First, from the sanitized private working tree, review and stage the intended release candidate:

```powershell
git status --short
git add -A
python scripts/public_release_check.py
git diff --cached --check
```

Then create a new directory without overwriting any existing path:

```powershell
$Source = (Get-Location).Path
$Export = Join-Path (Split-Path -Parent $Source) 'DialyCore-public'
if (Test-Path -LiteralPath $Export) { throw "Export path already exists: $Export" }
New-Item -ItemType Directory -Path $Export | Out-Null
$Prefix = $Export.TrimEnd('\') + '\'
git checkout-index --all --prefix="$Prefix"
Set-Location -LiteralPath $Export
git init -b main
git add -A
python scripts/public_release_check.py
git diff --cached --check
git commit -m "Initial open-source release"
```

Inspect that new repository and configure a newly created public remote only after the scan passes. Never reuse or expose the private remote URL:

```powershell
git remote add origin <NEW_PUBLIC_REPOSITORY_URL>
git remote -v
```

Pushing is deliberately a separate manual action.
