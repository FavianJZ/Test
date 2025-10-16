# HikariCha Web Application - Project Summary

## Overview
HikariCha adalah aplikasi web marketplace dan forum untuk produk matcha dengan sistem profil kustomisasi border, achievement, dan points yang terintegrasi.

## Tech Stack
- **Frontend**: Next.js 14 dengan TypeScript dan App Router
- **Backend**: Next.js API Routes dengan MySQL database
- **Database**: MySQL dengan raw SQL queries (mysql2)
- **Authentication**: NextAuth.js
- **UI Components**: Shadcn/UI dengan Tailwind CSS
- **State Management**: React Hooks dengan CustomEvents untuk real-time updates

## Database Schema

### Core Tables
- **users**: User data dengan authentication
- **user_profile**: Profile lengkap user (bio, location, dll)
- **border**: Koleksi border yang bisa dibeli/diunlock
- **user_border**: Border yang dimiliki user
- **activity**: Tracking aktivitas user
- **points**: Balance points user
- **achievements**: Sistem achievement

### Forum Tables (Baru Ditambahkan)
- **forum_categories**: Kategori forum (manfaat, teknik-seduh, ulasan-produk, resep)
- **forum_threads**: Thread/discussion utama
- **forum_replies**: Reply system dengan nesting support
- **forum_likes**: System like untuk threads dan replies
- **forum_views**: Tracking views untuk analytics

## Key Features

### 1. Authentication System
- NextAuth.js dengan Google OAuth
- Custom login/register dengan email/password
- Session management dengan real-time profile updates

### 2. Profile Customization System
- **Border Collection**: 30+ border dengan rarity system (Common, Rare, Epic, Legendary)
- **Purchase System**: Points-based economy untuk beli border
- **Achievement Unlock**: Border spesial dari achievement (Bronze, Silver, Gold)
- **Real-time Updates**: Border changes langsung terupdate di semua components

### 3. Points & Activity System
- **Points Economy**: Users dapat points dari login, achievement, dll
- **Activity Tracking**: Semua actions di-log (profile update, border purchase, dll)
- **Real-time Balance**: Points balance update real-time across components

### 4. Forum System (In Progress)
- **Category System**: 4 kategori utama (Manfaat, Teknik, Ulasan, Resep)
- **Thread Management**: Create, view, pin, lock threads
- **Reply System**: Nested replies dengan rich text
- **Engagement Metrics**: Likes, views, reply counts
- **User Integration**: Forum terhubung dengan profile/border system

## API Architecture

### Raw Database API Pattern
Menggunakan pattern `*-raw` untuk API endpoints yang langsung ke database:
- `/api/profile-raw`: Profile management
- `/api/borders-raw`: Border operations
- `/api/activities-raw`: Activity tracking
- `/api/points-raw`: Points management

### Forum API (Planned)
- `/api/forum/categories`: Category management
- `/api/forum/threads`: Thread CRUD operations
- `/api/forum/replies`: Reply system
- `/api/forum/likes`: Like/unlike functionality

## Component Architecture

### Real-time Data Flow
```tsx
// CustomEvent pattern untuk real-time updates
window.dispatchEvent(new CustomEvent('border-updated', { detail: { borderId } }))
window.dispatchEvent(new CustomEvent('profile-updated', { detail: { image: data.userImage } }))
window.dispatchEvent(new CustomEvent('points-updated', { detail: { points: newPoints } }))
```

### Key Components
- **BorderPreview**: Display border dengan avatar integration
- **BorderPreviewModal**: Modal untuk preview & purchase border
- **ProfileDropdown**: User menu dengan real-time updates
- **ForumPostCard**: Card untuk display forum threads
- **useProfileRealtime**: Hook untuk real-time profile data

## Database Connection Pattern

### Raw SQL with Transactions
```typescript
// lib/db-raw.ts
async executeTransaction(queries: string[]) {
  await connection.query('START TRANSACTION')
  try {
    for (const query of queries) {
      await connection.query(query)
    }
    await connection.query('COMMIT')
  } catch (error) {
    await connection.query('ROLLBACK')
    throw error
  }
}
```

## Recent Development Progress

### Phase 1: Foundation (Completed ✅)
- Setup Next.js 14 with TypeScript
- MySQL database dengan Prisma (awalnya) → Raw SQL (final)
- NextAuth.js authentication
- Basic UI components dengan Shadcn/UI

### Phase 2: Profile System (Completed ✅)
- User profile dengan bio, location, avatar
- Border collection system (30+ borders)
- Points economy
- Achievement system
- Real-time updates dengan CustomEvents

### Phase 3: Database Integration (Completed ✅)
- Migration dari hardcoded data ke database
- Raw SQL API pattern implementation
- Transaction handling
- Activity tracking system
- Real-time synchronization

### Phase 4: Forum System (In Progress 🚧)
- Database schema design (COMPLETED)
- Sample data insertion (COMPLETED)
- API endpoints development (NEXT)
- Frontend integration (NEXT)
- Thread detail pages (NEXT)
- Rich text editor (NEXT)

## Known Issues & Solutions

### Database Transaction Compatibility
**Issue**: MySQL2 prepared statement tidak support某些 transactions
**Solution**: Gunakan `conn.query()` instead of `conn.execute()` untuk transactions

### Real-time Updates
**Issue**: Components tidak update saat data berubah
**Solution**: CustomEvent pattern untuk cross-component communication

### Border Data Loss
**Issue**: Kebetulan menghapus semua border data saat testing
**Solution**: Selalu backup dan gunakan `init-borders-raw.js` untuk restore

### Null Price Handling
**Issue**: Error saat border price = null (achievement-only)
**Solution**: Null checking di BorderPreviewModal components

## File Structure

```
app/
├── api/
│   ├── auth/              # Authentication endpoints
│   ├── profile/           # Profile management
│   ├── borders/           # Border system
│   ├── achievements/      # Achievement system
│   ├── activities-raw/    # Activity tracking
│   ├── borders-raw/       # Border operations
│   ├── profile-raw/       # Profile operations
│   └── points-raw/        # Points management
├── auth/
│   ├── login/            # Login page
│   └── register/         # Registration page
├── profile/              # User profile page
└── forum/                # Forum system (in development)

components/
├── auth/
│   └── profile-dropdown.tsx    # User menu with real-time updates
├── ui/
│   ├── border-preview.tsx      # Border display component
│   ├── border-preview-modal.tsx # Border purchase modal
│   └── ...                    # Other UI components
└── forum/
    └── forum-post-card.tsx     # Forum thread cards

lib/
├── auth.ts              # NextAuth configuration
├── db-raw.ts           # Database service
├── achievements.ts     # Achievement logic
└── ...

hooks/
└── useProfileRealtime.ts  # Real-time profile data hook

docs/
├── BORDER_SYSTEM_GUIDE.md  # Border system documentation
└── PROJECT_SUMMARY.md     # This file
```

## Environment Variables
```env
DATABASE_URL="mysql://root:@localhost:3306/hikaricha_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Development Commands

### Database Operations
```bash
# Initialize database tables
node create-missing-tables.js

# Setup forum tables
node create-forum-tables.js

# Initialize borders data
node init-borders-raw.js

# Fix database issues
node fix-database.js
```

### Development Server
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
```

### Git Operations
```bash
git add .
git commit -m "feat: implement forum system foundation"
git push origin main
```

## Next Steps (Roadmap)

### Immediate Tasks (Next 1-2 days)
1. **Forum API Endpoints**
   - `/api/forum/categories` - GET categories
   - `/api/forum/threads` - CRUD threads
   - `/api/forum/replies` - CRUD replies
   - `/api/forum/likes` - Like/unlike system

2. **Frontend Integration**
   - Update forum page dengan database data
   - Create thread detail page
   - Implement new thread creation
   - Add reply functionality

3. **Rich Text Editor**
   - Integrate markdown editor
   - Preview functionality
   - Attachment support

### Medium Term (Next Week)
1. **Advanced Forum Features**
   - Search functionality
   - User badges/roles
   - Moderation tools
   - Notification system

2. **Mobile Optimization**
   - Responsive improvements
   - Touch-friendly interactions
   - PWA features

### Long Term (Next Month)
1. **Marketplace Integration**
   - Product listings
   - Shopping cart
   - Payment integration
   - Order management

2. **Social Features**
   - User following
   - Private messaging
   - Share functionality
   - Social media integration

## Testing Notes

### Database Testing
```bash
# Test database connection
node test-db-connection.js

# Test authentication flow
node test-auth-raw.js

# Test new APIs
node test-new-apis.js
```

### Frontend Testing
- Manual testing di browser
- Real-time update testing
- Cross-component integration testing

## Deployment Notes

### Database Setup
1. Create MySQL database `hikaricha_db`
2. Run table creation scripts
3. Insert initial data
4. Configure environment variables

### Production Build
1. Set production environment variables
2. Build application: `npm run build`
3. Start production server: `npm run start`
4. Configure reverse proxy (nginx/Apache)

## Security Considerations

### Authentication
- Secure session management
- OAuth integration best practices
- Rate limiting untuk auth endpoints

### Database Security
- SQL injection prevention dengan parameterized queries
- Connection pooling
- User input sanitization

### API Security
- CORS configuration
- Rate limiting
- Input validation
- Error handling tanpa information leakage

## Performance Optimization

### Database Optimization
- Indexing strategy untuk forum queries
- Connection pooling
- Query optimization
- Caching layer consideration

### Frontend Optimization
- Image optimization
- Lazy loading
- Component memoization
- Bundle size optimization

## Troubleshooting Guide

### Common Issues
1. **Database Connection Errors**
   - Check MySQL service status
   - Verify credentials
   - Check database exists

2. **Authentication Issues**
   - Verify NextAuth configuration
   - Check environment variables
   - Clear browser cookies

3. **Real-time Update Issues**
   - Check CustomEvent listeners
   - Verify API responses
   - Check network tab for errors

4. **Border System Issues**
   - Run `init-borders-raw.js` untuk restore data
   - Check API endpoints
   - Verify image paths

## Contributors Notes

### Development Style
- TypeScript strict mode
- Component-first development
- Real-time data synchronization
- Comprehensive error handling
- User feedback integration

### Code Patterns
- Custom API route pattern dengan `-raw` suffix
- Real-time updates dengan CustomEvents
- Modular component architecture
- Database transaction safety

### Git Workflow
- Feature branches untuk development
- Comprehensive commit messages
- Regular pushes ke GitHub
- Documentation updates

---

**Last Updated**: October 8, 2025
**Version**: 1.0.0-alpha
**Status**: Forum System Development in Progress