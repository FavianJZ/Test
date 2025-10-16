# Border System Implementation Guide

## Overview

Complete border management system with database integration, supporting points-based purchasing and achievement-based unlocking.

## 🏗️ Architecture

### Database Schema

```sql
-- Border definitions
model Border {
  id          String   @id @default(cuid())
name        String   @unique
  description String?  @db.Text
  imageUrl    String
  price       Int?     // null for achievement-only borders
  rarity      BorderRarity
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  borderUnlocks BorderUnlock[]
}

-- User border ownership
model BorderUnlock {
  id          String   @id @default(cuid())
  userId      String
  borderId    String
  unlockType  UnlockType // ACHIEVEMENT, PURCHASE, ADMIN
  unlockedAt  DateTime @default(now())
  pricePaid   Int?     // Points spent if purchased

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  border Border @relation(fields: [borderId], references: [id], onDelete: Cascade)

  @@unique([userId, borderId])
}

-- Points economy
model PointTransaction {
  id          String   @id @default(cuid())
  userId      String
  type        PointType // EARNED, SPENT, ADMIN_GIVEN, REFUND
  amount      Int
  description String?  @db.Text
  metadata    Json?    // Additional data
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Service Layer

**`lib/border-service.ts`** - Core business logic:
- `getAllBordersWithUnlockStatus()` - Get borders with user unlock status
- `purchaseBorder()` - Handle border purchasing with points
- `unlockBorderViaAchievement()` - Achievement-based unlocking
- `addPoints()` - Points transaction management
- `selectUserBorder()` - Update user's selected border

## 🎮 Features

### 1. Points-Based Purchasing
- Borders can have prices in points
- Users can purchase with sufficient points
- Transaction history tracking
- Real-time point balance updates

### 2. Achievement-Based Unlocking
- Automatic border unlocks for achievements
- Integration with existing achievement system
- No point cost for achievement borders
- Activity logging for unlocked borders

### 3. Border Selection
- Users can select from their unlocked borders
- Default border always available
- Visual preview with proper sizing
- Database persistence of selection

### 4. Admin Controls
- Initialize default borders via API
- Admin-only border management
- Border activation/deactivation
- Price and rarity management

## 📡 API Endpoints

### GET `/api/borders`
Get all borders with user's unlock status
```json
{
  "success": true,
  "data": [
    {
      "id": "gold",
      "name": "Gold",
      "imageUrl": "/borders/gold.svg",
      "price": 500,
      "rarity": "EPIC",
      "unlocked": true,
      "unlockType": "ACHIEVEMENT",
      "unlockedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST `/api/borders/purchase`
Purchase a border with points
```json
{
  "borderId": "gold"
}
```

### POST `/api/borders/select`
Select a border for profile
```json
{
  "borderId": "gold"
}
```

### GET `/api/points`
Get user's current points balance
```json
{
  "success": true,
  "data": { "points": 1250 }
}
```

### POST `/api/points`
Add points to user account
```json
{
  "type": "EARNED",
  "amount": 100,
  "description": "Forum post bonus"
}
```

### POST `/api/init/borders` (Admin only)
Initialize default borders in database

## 🎨 Border Configuration

### Default Borders

| Name | Rarity | Price | Unlock Method |
|------|--------|-------|---------------|
| Default | Common | Free | Always available |
| Bronze | Common | Free | FIRST_FORUM_POST achievement |
| Silver | Rare | Free | FORUM_REGULAR achievement |
| Gold | Epic | 500 pts | RECIPE_CREATOR achievement |
| Crystal | Epic | 1000 pts | SOCIAL_BUTTERFLY achievement |
| Diamond | Legendary | 2000 pts | BORDER_COLLECTOR achievement |

### Border Images
- Location: `public/borders/`
- Format: SVG (can be migrated to PNG)
- Size: 160x160px recommended
- Transparency required for center area

## 🏆 Achievement Integration

### Achievement Border Rewards

```typescript
// lib/achievements.ts
export const ACHIEVEMENTS_CONFIG: AchievementConfig[] = [
  {
    type: "FIRST_FORUM_POST",
    title: "Poster Pertama",
    rewards: {
      points: 10,
      borderUnlocks: ["Bronze"]
    }
  },
  // ... more achievements
]
```

### Automatic Progress Tracking

```typescript
// Track user activities
await trackActivity(userId, 'FORUM_POST') // Updates FORUM_REGULAR achievement
await trackActivity(userId, 'RECIPE_CREATED') // Updates RECIPE_CREATOR achievement
```

## 🚀 Initialization

### 1. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 2. Initialize Default Borders
```bash
# Using the initialization script
node scripts/init-borders.js

# Or via API (admin only)
curl -X POST http://localhost:3000/api/init/borders \
  -H "Content-Type: application/json"
```

### 3. User Setup
```typescript
// Initialize achievements for new user
await initializeAchievementsForUser(userId)
```

## 📱 Frontend Integration

### Profile Page Usage

```typescript
// Fetch borders with unlock status
const response = await fetch('/api/borders')
const { data: borders } = await response.json()

// Handle border selection/purchase
const handleBorderSelect = async (borderId: string) => {
  if (border.unlocked) {
    // Select the border
    await fetch('/api/borders/select', {
      method: 'POST',
      body: JSON.stringify({ borderId })
    })
  } else if (border.price) {
    // Purchase the border
    await fetch('/api/borders/purchase', {
      method: 'POST',
      body: JSON.stringify({ borderId })
    })
  }
}
```

### Border Display Components

```tsx
// Border preview with user info
<BorderPreview
  border={selectedBorder}
  size="2xl"
  avatarSrc={userAvatar}
  avatarName={userName}
  showLabel={false}
  showLockStatus={false}
/>

// Border selector with purchasing
<BorderSelector
  borders={borderOptions}
  selectedBorder={selectedBorder}
  onSelect={handleBorderSelect}
  showRarity={true}
  showPrice={true}
/>
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Border initialization via API
- [ ] User points balance display
- [ ] Border purchasing with sufficient points
- [ ] Border purchasing rejection with insufficient points
- [ ] Achievement-based border unlocking
- [ ] Border selection persistence
- [ ] Border display in profile and dropdown
- [ ] Points transaction history
- [ ] Error handling for invalid operations

### Test Commands

```bash
# Test border API endpoints
curl http://localhost:3000/api/borders
curl http://localhost:3000/api/points

# Test border purchase
curl -X POST http://localhost:3000/api/borders/purchase \
  -H "Content-Type: application/json" \
  -d '{"borderId":"gold"}'
```

## 🔧 Configuration

### Environment Variables

```env
DATABASE_URL="mysql://user:password@localhost:3306/hikariCha"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

### Border Customization

Add new borders in `lib/border-service.ts`:

```typescript
const newBorders = [
  {
    name: 'Rainbow',
    description: 'Colorful rainbow border',
    imageUrl: '/borders/rainbow.svg',
    price: 1500,
    rarity: 'LEGENDARY',
    sortOrder: 60
  }
]
```

## 🐛 Troubleshooting

### Common Issues

1. **Border not appearing in selector**
   - Check if border is active in database
   - Verify image path exists in `/borders/`
   - Ensure user has unlocked status

2. **Purchase failing**
   - Verify user has sufficient points
   - Check if border is already unlocked
   - Confirm border has price set

3. **Achievement unlock not working**
   - Verify achievement exists in config
   - Check border name matches achievement config
   - Ensure achievement progress is tracked

### Debug Commands

```sql
-- Check border data
SELECT * FROM Border WHERE isActive = true;

-- Check user unlocks
SELECT * FROM BorderUnlock WHERE userId = 'user-id';

-- Check point transactions
SELECT * FROM PointTransaction WHERE userId = 'user-id' ORDER BY createdAt DESC;
```

## 📈 Future Enhancements

1. **Border Marketplace** - User-to-user border trading
2. **Border Templates** - Custom border creation tools
3. **Seasonal Borders** - Limited-time border releases
4. **Border Effects** - Animated or interactive borders
5. **Border Collections** - Themed border sets
6. **Border Gifting** - Send borders as gifts

---

**Need help?** Check the implementation in:
- `lib/border-service.ts` - Core business logic
- `app/api/borders/` - API endpoints
- `app/profile/page.tsx` - Frontend integration
- `lib/achievements.ts` - Achievement integration