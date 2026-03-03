# 🧪 Quick Test Guide - Content Library Fixes

## 🚀 Start Testing in 3 Steps

### Step 1: Open Browser Console
Press `F12` or right-click → Inspect → Console tab

### Step 2: Navigate to Content Library
Go to: `http://localhost:5173/content-library`

### Step 3: Watch Console Logs
You should see:
```
ContentLibrary: Loaded from localStorage: X items
ContentLibrary Stats Update:
- Total items: X
- Favorites: X
- View mode: all
- Filtered content: X
```

---

## ✅ Test 1: Count Accuracy (2 minutes)

### Current State Check:
```javascript
// Run in console:
const library = JSON.parse(localStorage.getItem('content_genie_library') || '[]')
console.log('Items in localStorage:', library.length)
```

### Test:
1. Look at "📝 Total Items" card
2. Count should match localStorage length
3. If you have 1 item, it should say "1" (not "2")

**Expected**: Accurate count display

---

## ⭐ Test 2: Favorites Toggle (3 minutes)

### Test:
1. Find any content card
2. Click the ☆ (empty star) in top-right corner
3. **Expected**:
   - Toast appears: "Added to Favorites"
   - Star changes to ⭐ (filled)
   - Console shows: "Toggled favorite for: [id]"
   - Favorites counter increases

4. Click the ⭐ (filled star) again
5. **Expected**:
   - Toast appears: "Removed from Favorites"
   - Star changes to ☆ (empty)
   - Favorites counter decreases

---

## 📂 Test 3: Favorites View (2 minutes)

### Test:
1. Favorite 2-3 items (click their stars)
2. Click "⭐ Favorites" button at top
3. **Expected**:
   - Only favorited items show
   - Counter shows correct number
   - Button is highlighted (yellow)

4. Click "📚 All Content" button
5. **Expected**:
   - All items show again
   - Favorited items still have ⭐

---

## ☐ Test 4: Select Mode (3 minutes)

### Test:
1. Initially, no checkboxes should be visible
2. Click "☐ Select" button
3. **Expected**:
   - Checkboxes appear on all cards (top-left)
   - Button changes to "✓ Select Mode"
   - "☐ Select All" button appears

4. Click "☐ Select All"
5. **Expected**:
   - All checkboxes checked
   - Bulk actions bar appears
   - Shows "X items selected"

6. Click "✓ Select Mode" again
7. **Expected**:
   - Checkboxes disappear
   - Selection cleared
   - Button back to "☐ Select"

---

## 🗑️ Test 5: Bulk Remove from Favorites (3 minutes)

### Test:
1. Make sure you have 3+ favorited items
2. Click "⭐ Favorites" to view favorites
3. Click "☐ Select" button
4. Select 2 items (check their checkboxes)
5. **Expected**:
   - Bulk actions bar shows
   - Orange button: "☆ Remove from Favorites"

6. Click "☆ Remove from Favorites"
7. **Expected**:
   - Toast: "Removed from Favorites"
   - Items disappear from favorites view
   - Select mode exits
   - Checkboxes disappear

8. Click "📚 All Content"
9. **Expected**:
   - Those items now have ☆ (empty star)

---

## 🐛 Debug Commands

### Check localStorage:
```javascript
const library = JSON.parse(localStorage.getItem('content_genie_library') || '[]')
console.log('Total items:', library.length)
console.log('Favorites:', library.filter(item => item.is_favorite === true).length)
console.log('All items:', library)
```

### Check is_favorite types:
```javascript
const library = JSON.parse(localStorage.getItem('content_genie_library') || '[]')
library.forEach(item => {
  console.log(`${item.title}: ${item.is_favorite} (${typeof item.is_favorite})`)
})
```

### Clear and start fresh:
```javascript
localStorage.removeItem('content_genie_library')
// Then reload page
```

---

## ✅ Success Checklist

After testing, all these should work:

- [ ] Count shows correct number (1 item = "1")
- [ ] Clicking ☆ changes to ⭐ and shows toast
- [ ] Clicking ⭐ changes to ☆ and shows toast
- [ ] Favorites counter updates correctly
- [ ] Favorites view shows only favorited items
- [ ] Select button toggles checkbox visibility
- [ ] Select All selects all visible items
- [ ] Bulk actions bar appears when items selected
- [ ] Remove from Favorites button works (in favorites view)
- [ ] All bulk actions exit select mode after completion
- [ ] Console logs show detailed information

---

## 🎯 Expected Console Output

### When page loads:
```
ContentLibrary: Loaded from localStorage: 5 items
ContentLibrary: localStorage items: 5
ContentLibrary: Backend items: 0
ContentLibrary: Total merged (no duplicates): 5
ContentLibrary Stats Update:
- Total items: 5
- Favorites: 2
- View mode: all
- Filtered content: 5
```

### When toggling favorite:
```
Toggled favorite for: abc123
- Previous status: false
- New status: true
- Item title: My Amazing Article
```

### When switching to favorites view:
```
ContentLibrary Stats Update:
- Total items: 5
- Favorites: 2
- View mode: favorites
- Filtered content: 2
```

---

## 🚨 If Something Doesn't Work

1. **Check console for errors** (red text)
2. **Run debug commands** (see above)
3. **Clear localStorage** and test with fresh data
4. **Share console output** with the developer

---

**Total Test Time: ~15 minutes**

Good luck! 🚀
