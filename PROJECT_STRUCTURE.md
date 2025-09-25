# Snowva Business Hub - Project Structure

## Clean Directory Structure

```
snowva-gemini/
├── .github/                  # GitHub workflows and settings
├── components/               # React components
├── contexts/                 # React contexts
├── data/                     # Data files
│   ├── normalized/          # Current JSON data files
│   └── backups/             # Backup files from migrations
├── docs/                     # Documentation files
├── scripts/                  # Utility scripts
│   ├── migration/           # Current migration scripts
│   └── archived/            # Old/deprecated scripts
├── services/                # Firebase service classes
├── App.tsx                  # Main app component
├── constants.ts             # App constants
├── firebase.config.ts       # Firebase configuration
├── index.html              # HTML entry point
├── index.tsx               # React entry point
├── package.json            # Dependencies
├── types.ts                # TypeScript types
├── utils.ts                # Utility functions
└── vite.config.ts          # Vite configuration
```

## Cleaned Up Files

### Archived Scripts (moved to `/scripts/archived/`)
- All `migrate_*.py` files (old migration attempts)
- `analyzeUnmapped.py`
- `checkStructure.py`
- `completeFirebaseRemigration.py`
- `finalCustomerFix.py`
- `finalIntegrityCheck.py`
- `fixCustomerProductIds.py`
- `fixCustomerReferences.py`
- `fixDataIntegrity.py`
- `manualCustomerFix.py`
- `verifyConsumerRefs.py`
- `verifyDataIntegrity.py`
- `browserFirebaseRemigration.js`
- `remigrate.js`
- `test-firebase.js`
- `upload_to_firebase.js`
- `dataMigration.ts`
- `firebaseTest.ts`

### Documentation (moved to `/docs/`)
- `FIREBASE_SETUP.md`
- `IMMEDIATE_HOTFIX_DATES.md`
- `MIGRATION_PROGRESS_REPORT.md`
- `SCROLL_STABILIZATION.md`
- `TIMESTAMP_MIGRATION_TODOS.md`
- `TIMESTAMP_QUICK_REFERENCE.md`

### Current Working Scripts (in `/scripts/migration/`)
- `convert_to_iso_strings.py` - Final working timestamp conversion script

### Backup Data (moved to `/data/backups/`)
- All `*.backup*` files
- `customers_old.json`

### Removed Files
- `test_timestamp_formats.json` (temporary test file)
- `dateUtils.ts` (unused utility)
- `/public/data/` (outdated data, now using Firebase)
- `/logs/` contents (old log files)
- `/utils/` folder (empty after moving contents)

## Current Status
✅ Project structure cleaned and organized
✅ All date field conversions working
✅ Firebase integration complete
✅ Ready for production use