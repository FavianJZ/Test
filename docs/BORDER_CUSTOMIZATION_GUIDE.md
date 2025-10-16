# Border Customization Guide

## Overview

Sistem border customization memungkinkan pengguna untuk mempersonalisasi avatar mereka dengan berbagai jenis border yang bisa dibuka melalui achievements. Border akan ditampilkan di berbagai bagian aplikasi seperti profile, forum, dan user mentions.

## Cara Kerja Sistem

### 1. Database Structure

Sistem menggunakan 3 model utama di database:

#### `ProfileBorder`
- Menyimpan kepemilikan border untuk setiap user
- Fields: `userId`, `borderName`, `imageUrl`, `isUnlocked`, `unlockedAt`

#### `Achievement`
- Tracking pencapaian user
- Fields: `userId`, `type`, `title`, `description`, `targetValue`, `currentValue`, `isCompleted`, `rewards`

#### `User`
- Menyimpan data user termasuk poin dan border yang dipilih
- Fields: `points`, `selectedBorder`

### 2. Achievement System

User bisa membuka border dengan menyelesaikan achievements:

| Achievement | Requirement | Rewards |
|-------------|-------------|---------|
| **First Forum Post** | 1 postingan forum | 10 poin + Bronze Border |
| **Forum Regular** | 10 postingan forum | 50 poin + Silver Border |
| **Recipe Creator** | 5 resep dibuat | 30 poin + Silver Border |
| **Social Butterfly** | 20 komentar | 40 poin + Silver Border |
| **Early Adopter** | Bergabung minggu pertama | 25 poin + Bronze Border |
| **Purchase Master** | 5 pembelian | 75 poin + Gold Border |
| **Points Collector** | 1000 poin | 100 poin + Diamond Border |

### 3. Border Tiers

#### Common (Green Border)
- **Default**: Selalu tersedia untuk semua user
- **Bronze**: Dibuka dengan achievement dasar

#### Rare (Blue Border)
- **Silver**: Dibuka dengan achievement menengah

#### Epic (Purple Border)
- **Gold**: Dibuka dengan achievement lanjutan
- **Crystal**: Dibuka dengan achievement khusus

#### Legendary (Yellow Border)
- **Diamond**: Dibuka dengan achievement premium

## Cara Kustomisasi Border

### 1. Mengganti Border di Profile

1. Login ke akun Anda
2. Go to Profile page (`/profile`)
3. Click tab "Kustomisasi"
4. Pilih border yang sudah terbuka
5. Border akan otomatis terap ke profile Anda

### 2. Melihat Progress Achievement

1. Di profile page, lihat section "Achievements" di tab kustomisasi
2. Setiap achievement menunjukkan progress Anda
3. Hover untuk melihat detail requirement dan rewards

### 3. Mendapatkan Border Baru

#### Automatic Unlock
- System otomatis membuka border saat achievement selesai
- Anda akan mendapatkan notifikasi saat border baru terbuka
- Border bisa langsung digunakan

#### Points System
- Setiap activity memberikan poin:
  - Forum post: +5 poin
  - Forum comment: +2 poin
  - Recipe creation: +10 poin
  - Purchase: +15 poin

## Technical Implementation

### 1. Border Components

#### `BorderPreview`
```tsx
<BorderPreview
  border={selectedBorder}
  size="2xl"
  avatarSrc={userAvatar}
  avatarName={userName}
  showLabel={false}
  showLockStatus={false}
/>
```

#### `BorderSelector`
```tsx
<BorderSelector
  borders={borderOptions}
  selectedBorder={selectedBorder}
  onSelect={handleBorderSelect}
  size="lg"
  columns={3}
  showRarity={true}
/>
```

#### `BorderDisplay`
```tsx
<BorderDisplay
  border={userBorder}
  userAvatar={avatar}
  userName={name}
  size="md"
  showUserInfo={true}
  showBadge={true}
  badgeText="Chef"
/>
```

### 2. API Endpoints

#### `GET /api/borders`
- Mengambil list border yang sudah dibuka user
- Response: `{ borders: ProfileBorder[] }`

#### `GET /api/achievements`
- Mengambil progress achievement user
- Response: `{ achievements: Achievement[], userPoints: number }`

#### `PUT /api/profile`
- Update profile termasuk selected border
- Request: `{ selectedBorder: string }`

### 3. Database Operations

#### Initialize User Achievements
```typescript
await initializeAchievementsForUser(userId)
```

#### Update Achievement Progress
```typescript
await updateAchievementProgress(userId, "FIRST_FORUM_POST", 1)
```

#### Grant Achievement Rewards
```typescript
await grantAchievementRewards(userId, achievementConfig)
```

## Cara Menggunakan Border di Berbagai Konteks

### 1. Forum Posts
```tsx
// Di header post author
<BorderDisplay
  border={authorBorder}
  userAvatar={author.avatar}
  userName={author.name}
  size="sm"
  showUserInfo={true}
/>
```

### 2. User Mentions
```tsx
// Di dalam comment atau post
<p>Thanks to <MinimalBorderDisplay border={userBorder} userAvatar={avatar} userName={name} size="xs" /> for the recipe!</p>
```

### 3. Leaderboard
```tsx
// Di ranking list
<div className="flex items-center space-x-2">
  <span className="font-bold">1.</span>
  <CompactBorderDisplay border={userBorder} userAvatar={avatar} userName={name} size="sm" />
  <span>{user.points} pts</span>
</div>
```

### 4. Dropdown User List
```tsx
// Di select component
{users.map(user => (
  <CompactBorderDisplay
    key={user.id}
    border={user.selectedBorder}
    userAvatar={user.avatar}
    userName={user.name}
    size="sm"
  />
))}
```

## Best Practices

### 1. Performance
- Gunakan size yang sesuai untuk setiap konteks
- Minimal penggunaan border di list yang panjang
- Cache border images untuk load yang lebih cepat

### 2. User Experience
- Tampilkan progress achievement yang jelas
- Berikan notifikasi saat border baru terbuka
- Highlight border yang baru dibuka

### 3. Visual Design
- Sesuaikan size dengan konteks (xs untuk mentions, 2xl untuk profile)
- Gunakan rarity colors untuk menunjukkan value
- Pastikan border tidak mengganggu readability

## Troubleshooting

### Common Issues

1. **Border tidak muncul**
   - Cek apakah border image ada di `/public/borders/`
   - Verify database connection
   - Check user permissions

2. **Border tidak terunlock**
   - Verify achievement progress
   - Check database logs
   - Restart server jika perlu

3. **Performance issues**
   - Optimize image sizes
   - Use appropriate border sizes
   - Implement caching

### Debug Steps

1. Check browser console untuk errors
2. Verify API responses di Network tab
3. Check database records
4. Test achievement triggers

## Future Enhancements

### Planned Features
1. **Animated Borders**: Borders dengan efek animasi
2. **Seasonal Borders**: Borders event-based (Christmas, Halloween, dll)
3. **Custom Border Upload**: User bisa upload custom border
4. **Border Trading**: User bisa trading border dengan user lain
5. **Border Crafting**: Combine border untuk membuat border baru

### Technical Improvements
1. **Border Caching**: CDN integration untuk faster loading
2. **Lazy Loading**: Load border hanya saat needed
3. **Border Analytics**: Track border usage dan popularity
4. **A/B Testing**: Test border effectiveness

## Demo

Untuk melihat semua komponen border dalam action, visit:
- Demo page: `/demo/border`
- Profile page: `/profile`
- Forum page: `/forum`

---

**Last Updated**: October 2024
**Version**: 1.0.0
**Author**: Development Team