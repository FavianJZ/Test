# Border Management Guide

## Overview

Guide lengkap untuk menambah, mengganti, dan mengelola border format PNG di sistem HikariCha. Border digunakan untuk mempersonalisasi avatar user di profile, forum, dan dropdown.

## 📁 Struktur Folder

```
public/
├── borders/
│   ├── default.png     # Default border (selalu tersedia)
│   ├── bronze.png      # Bronze border (unlockable)
│   ├── silver.png      # Silver border (unlockable)
│   ├── gold.png        # Gold border (unlockable)
│   ├── crystal.png     # Crystal border (unlockable)
│   └── diamond.png     # Diamond border (unlockable)
```

## 🎨 Requirements untuk Border PNG

### **Spesifikasi Teknis:**
- **Format**: PNG dengan transparansi
- **Ukuran**: 160x160px (untuk consistency)
- **Resolusi**: 300 DPI (recommended)
- **Transparansi**: Background harus transparant
- **Center Area**: Area kosong di tengah untuk avatar (sekitar 60-80px diameter)

### **Design Guidelines:**
1. **Circular Design**: Border harus berbentuk melingkar
2. **Center Hollow**: Tengah harus kosong untuk avatar
3. **Stroke Width**: 5-15px untuk optimal visibility
4. **Decorative Elements**: Boleh ada efek, shadows, atau patterns
5. **Color Consistency**: Sesuaikan dengan tier (bronze, silver, gold, dll)

## 📝 Cara Menambah Border Baru

### **Step 1: Siapkan File PNG**
```bash
# Letakkan file PNG di folder yang tepat
cp your-new-border.png public/borders/new-border.png
```

### **Step 2: Update Konfigurasi Border**

#### **Method A: Edit File Langsung**
Edit file yang menggunakan border:

**Profile Page (`app/profile/page.tsx`)**
```typescript
// Tambah border baru di array baseBorderOptions
const baseBorderOptions = [
  {
    id: "default",
    name: "Default",
    image: "/borders/default.png", // ← ganti ke PNG
    rarity: "common" as const
  },
  {
    id: "new-border",
    name: "New Border",
    image: "/borders/new-border.png", // ← file baru
    rarity: "epic" as const
  },
  // ... border lainnya
]
```

**Forum Component (`components/forum/forum-post-card.tsx`)**
```typescript
// Update sample data dengan border baru
const sampleUser = {
  name: "User Name",
  avatar: "/avatars/user.jpg",
  border: {
    id: "new-border",
    name: "New Border",
    image: "/borders/new-border.png",
    rarity: "epic" as const,
    unlocked: true
  },
  role: "Expert",
  posts: 50
}
```

#### **Method B: Gunakan Database (Recommended)**
Border akan otomatis di-load dari database, jadi cukup update data di database:

```sql
-- Update atau insert border ownership
INSERT INTO ProfileBorder (userId, borderName, imageUrl, isUnlocked, unlockedAt)
VALUES ('user-id', 'new-border', '/borders/new-border.png', true, NOW())
ON DUPLICATE KEY UPDATE
  imageUrl = '/borders/new-border.png',
  isUnlocked = true,
  unlockedAt = NOW();
```

### **Step 3: Update Achievement Rewards (Optional)**

**File: `lib/achievements.ts`**
```typescript
export const ACHIEVEMENTS_CONFIG: AchievementConfig[] = [
  // ... existing achievements
  {
    type: "NEW_ACHIEVEMENT",
    title: "Border Master",
    description: "Unlock special border",
    targetValue: 1,
    rewards: {
      points: 100,
      borderUnlocks: ["new-border"] // ← tambahkan border baru
    }
  }
]
```

## 🔄 Cara Mengganti Border yang Ada

### **Mengganti SVG ke PNG:**

1. **Siapkan file PNG baru**
```bash
# Convert SVG ke PNG (jika perlu)
inkscape --export-png=new-border.png --export-width=160 --export-height=160 old-border.svg
```

2. **Update path references**
```bash
# Rename file
mv public/borders/border.svg public/borders/bold.png
```

3. **Update semua references di code**
```bash
# Search and replace
grep -r "borders/border.svg" . --include="*.tsx" --include="*.ts"
```

### **Bulk Update:**
```bash
# Script untuk update semua border dari SVG ke PNG
for file in public/borders/*.svg; do
  basename=$(basename "$file" .svg)
  inkscape --export-png="public/borders/${basename}.png" --export-width=160 --export-height=160 "$file"
done
```

## 🎨 Design Template untuk Border

### **Template Dimension:**
```
160x160px canvas
┌─────────────────────┐
│   20px padding       │
│   ┌───────────────┐ │
│   │               │ │ ← 120x120px usable area
│   │    60-80px    │ │
│   │   hollow      │ │
│   │   center      │ │
│   │               │ │
│   └───────────────┘ │
│   20px padding       │
└─────────────────────┘
```

### **Color Guidelines per Tier:**

| Tier | Primary Colors | Secondary Colors | Vibe |
|------|----------------|------------------|------|
| **Common** | #8B8680, #A9A9A9 | #696969 | Simple, clean |
| **Bronze** | #CD7F32, #B87333 | #8B4513 | Earthy, warm |
| **Silver** | #C0C0C0, #B8B8B8 | #808080 | Metallic, cool |
| **Gold** | #FFD700, #FFA500 | #B8860B | Luxurious, bright |
| **Crystal** | #00CED1, #48D1CC | #40E0D0 | Mystical, icy |
| **Diamond** | #B9F2FF, #E0FFFF | #87CEEB | Premium, elegant |

## 🔧 Konfigurasi Overflow & Visibility

### **Current Configuration:**
```typescript
// BorderPreview component dengan overflow visible
<div className={`relative ${config.container} overflow-visible`}>
  <img
    src={border.image}
    className="absolute inset-0 w-full h-full z-0"
    style={{
      objectFit: 'contain',
      overflow: 'visible'
    }}
  />
</div>
```

### **Custom CSS untuk Border Effects:**
```css
/* Tambah di globals.css atau component CSS */
.border-glow {
  filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
}

.border-sparkle {
  animation: sparkle 2s infinite;
}

@keyframes sparkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.border-pulse {
  animation: pulse 3s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

## 📱 Responsive Sizing

### **Size Configuration:**
```typescript
const sizeConfig = {
  xs: { container: "w-6 h-6", avatar: "w-4 h-4", inset: "inset-1" },    // 24px
  sm: { container: "w-8 h-8", avatar: "w-5 h-5", inset: "inset-1.5" }, // 32px
  md: { container: "w-10 h-10", avatar: "w-6 h-6", inset: "inset-2" },  // 40px
  lg: { container: "w-12 h-12", avatar: "w-8 h-8", inset: "inset-2" },  // 48px
  xl: { container: "w-14 h-14", avatar: "w-9 h-9", inset: "inset-2.5" }, // 56px
  "2xl": { container: "w-18 h-18", avatar: "w-11 h-11", inset: "inset-3.5" } // 72px
}
```

## 🔄 Migration Script (SVG → PNG)

### **Automated Migration:**
```bash
#!/bin/bash
# migrate-borders.sh

echo "Starting border migration from SVG to PNG..."

# Buat backup
cp -r public/borders public/borders-backup

# Convert all SVG files to PNG
for svg_file in public/borders/*.svg; do
    if [ -f "$svg_file" ]; then
        basename=$(basename "$svg_file" .svg)
        png_file="public/borders/${basename}.png"

        echo "Converting $basename.svg to $basename.png..."

        # Using ImageMagick (recommended)
        convert "$svg_file" -resize 160x160 "$png_file"

        # Alternative: Using inkscape (if available)
        # inkscape --export-png="$png_file" --export-width=160 --export-height=160 "$svg_file"

        echo "✅ Converted: $basename"
    fi
done

echo "🎉 Migration complete!"
echo "Don't forget to update code references from .svg to .png"
```

### **Update References Script:**
```bash
#!/bin/bash
# update-border-references.sh

echo "Updating border file references..."

# Find and replace in TypeScript/TSX files
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/\.svg/\.png/g'

echo "✅ Updated all .svg references to .png"
echo "🔍 Review changes before committing"
```

## 🧪 Testing & Validation

### **Checklist Testing:**
- [ ] Border PNG muncul di profile page
- [ ] Border PNG muncul di dropdown
- [ ] Border PNG muncul di forum posts
- [ ] Overflow visible (tidak terpotong)
- [ ] Responsive di mobile
- [ ] Transparansi berfungsi
- [ ] Loading tidak error
- [ ] Database sync (jika applicable)

### **Manual Testing Commands:**
```bash
# Test semua border URL
curl -I http://localhost:3000/borders/default.png
curl -I http://localhost:3000/borders/gold.png
# ... test semua border

# Check image dimensions
file public/borders/*.png
```

## 🚀 Deployment Notes

### **Before Deploy:**
1. **Optimize PNG sizes**
```bash
# Optimize all PNG files
optipng -o7 public/borders/*.png
```

2. **Verify all paths**
```bash
# Check for broken references
grep -r "\.svg" . --include="*.tsx" --include="*.ts" || echo "No SVG references found ✓"
```

3. **Test production build**
```bash
npm run build
npm run start
```

## 🐞 Troubleshooting

### **Common Issues:**

1. **Border tidak muncul**
   - Cek file path: `/borders/your-border.png`
   - Verify file ada di `public/borders/`
   - Check console untuk 404 errors

2. **Overflow terpotong**
   - Pastikan `overflow-visible` di container
   - Check parent container tidak punya `overflow: hidden`

3. **PNG transparansi tidak berfungsi**
   - Verify PNG punya alpha channel
   - Check browser developer tools

4. **Border terlalu besar/kecil**
   - Adjust size config di `border-preview.tsx`
   - Test dengan berbagai size props

### **Debug Commands:**
```bash
# Check file sizes
ls -la public/borders/

# Test image validity
file public/borders/*.png

# Check network requests (buka dev tools)
# Tab: Network → filter "borders"
```

## 📚 Quick Reference

### **File Locations to Update:**
- `app/profile/page.tsx` - Profile border options
- `components/auth/profile-dropdown.tsx` - Dropdown border
- `components/forum/forum-post-card.tsx` - Forum post borders
- `lib/achievements.ts` - Achievement rewards
- `public/borders/` - Border PNG files

### **Quick Commands:**
```bash
# Add new border
cp new-border.png public/borders/new-border.png

# Convert SVG to PNG
convert border.svg -resize 160x160 border.png

# Optimize PNG
optipng -o7 border.png

# Test all borders
for border in default bronze silver gold crystal diamond; do
  echo "Testing: $border"
  curl -f "http://localhost:3000/borders/$border.png" || echo "❌ Failed: $border"
done
```

---

**Need help?** Check the demo at `/demo/border` or profile page at `/profile` for live examples!