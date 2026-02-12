# Migration: Add image_size Column to portfolio_images

## 📋 Overview

This migration adds the `image_size` column to the `portfolio_images` table with a default value of `'feed-square'`. This allows admins to choose the display format for each portfolio image based on aspect ratios commonly used in social media.

## 🎯 What This Migration Does

1. Adds `image_size` column to `portfolio_images` table
2. Sets default value to `'feed-square'` (1:1 aspect ratio)
3. Maintains backward compatibility with existing images

## 📱 Valid Image Size Values

- `'feed-vertical'`: Feed vertical (4:5 aspect ratio) - 320px height
- `'feed-square'`: Feed square (1:1 aspect ratio) - 256px height **(default)**
- `'story'`: Stories/Reels (9:16 aspect ratio) - 384px height  
- `'profile'`: Profile photo (1:1 aspect ratio, smaller) - 192px height

### Backward Compatibility

Old values are still supported:
- `'small'` = 192px height
- `'medium'` = 256px height
- `'large'` = 320px height

## 🛠️ How to Execute This Migration

### Option 1: Using the Migration Helper Script (Recommended)

```bash
npm run db:migrate:file migrations/008_add_portfolio_image_size.sql
```

Or directly:

```bash
node scripts/run-migration.js migrations/008_add_portfolio_image_size.sql
```

### Option 2: Using Wrangler CLI Directly

```bash
npx wrangler d1 execute sistema --file=./migrations/008_add_portfolio_image_size.sql
```

### Option 3: Using SQL Command Directly

```bash
npx wrangler d1 execute sistema --command="ALTER TABLE portfolio_images ADD COLUMN image_size TEXT DEFAULT 'feed-square';"
```

## ✅ Verify Migration

After running the migration, verify it was applied:

```bash
npx wrangler d1 execute sistema --command="PRAGMA table_info(portfolio_images);"
```

You should see the `image_size` column in the output.

## 📊 Update Existing Records (Optional)

If you have existing images without `image_size` set, you can update them:

```bash
npx wrangler d1 execute sistema --command="UPDATE portfolio_images SET image_size = 'feed-square' WHERE image_size IS NULL;"
```

## 🔍 Check Current Values

To see what image sizes are currently in use:

```bash
npx wrangler d1 execute sistema --command="SELECT image_size, COUNT(*) as count FROM portfolio_images GROUP BY image_size;"
```

## 📝 Notes

- This migration is **idempotent** - it's safe to run multiple times
- The `IF NOT EXISTS` clause in SQLite ensures no error if the column already exists
- All new portfolio images will automatically use 'feed-square' as the default
- Existing images will maintain their current size (NULL will be handled by the application)
