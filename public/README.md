# Public Assets Directory

This directory contains static assets that are served by Next.js.

## Logo Image

To add your company logo:

1. **Save your logo file** in this directory with one of these names:
   - `1.png` (your current logo file name) ✅
   - `logotipo.png`
   - `logotipo.jpg`
   - `logotipo.svg`

2. The image will be **automatically displayed** in the header of the website

3. **Recommended image specifications:**
   - Format: PNG with transparent background (preferred), JPG, or SVG
   - Size: 48x48 pixels or larger (it will be scaled to 48x48)

### How to add your "1.png" file:

**Simple:** Just copy your "1.png" file to this directory!

```bash
cp 1.png public/
```

That's it! The system is already configured to look for `1.png` first.

### Example directory structure:
```
public/
  1.png            <- Your logo file! Just add it here
  logotipo.svg     <- Placeholder (can be deleted after adding your PNG)
  README.md        <- This file
```

### Current Status:
- A placeholder SVG logo is included (`logotipo.svg`)
- The Header component will try to load images in this order: **1.png** → logotipo.png → logotipo.jpg → logotipo.svg
- If no image is found, it falls back to the text-based "AX" logo
