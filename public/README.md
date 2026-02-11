# Public Assets Directory

This directory contains static assets that are served by Next.js.

## Logo Image

To add your company logo (like "logotipo 1.png"):

1. **Save your logo file** in this directory with one of these names:
   - `logotipo.png` (preferred)
   - `logotipo.jpg`
   - `logotipo.svg`

2. The image will be **automatically displayed** in the header of the website

3. **Recommended image specifications:**
   - Format: PNG with transparent background (preferred), JPG, or SVG
   - Size: 48x48 pixels or larger (it will be scaled to 48x48)
   - Name: `logotipo.png`, `logotipo.jpg`, or `logotipo.svg`

### How to add your "logotipo 1.png" file:

1. **Option A (Recommended):** Rename the file to remove the space:
   - Rename `logotipo 1.png` → `logotipo.png`
   - Place it in the `public/` directory

2. **Option B:** Keep the original name and update the code:
   - Place `logotipo 1.png` in the `public/` directory
   - Update the Header component to use `/logotipo 1.png` as the image source

### Example directory structure:
```
public/
  logotipo.png     <- Your logo file (replaces the placeholder SVG)
  logotipo.svg     <- Placeholder (can be deleted after adding your PNG)
  README.md        <- This file
```

### Current Status:
- A placeholder SVG logo is included (`logotipo.svg`)
- The Header component will try to load images in this order: PNG → JPG → SVG
- If no image is found, it falls back to the text-based "AX" logo
