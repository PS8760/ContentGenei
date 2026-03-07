# Underperforming Posts & AI Suggestions - Fixes

## Issues Fixed

### Issue 1: Incorrect Data in Underperforming Posts
**Problem**: The likes, comments, and engagement data shown in underperforming posts section was not matching the actual Instagram data.

**Root Cause**: The `posts_data` dictionary was created BEFORE updating the database with `is_underperforming` and `performance_score` fields. Then the old `posts_data` was being returned, which didn't include the updated fields or correct data.

**Solution**: 
1. Generate `posts_data` from database posts
2. Detect underperforming posts
3. Update database with flags
4. **Regenerate `posts_data` AFTER database update** ← This was missing!
5. Filter underperforming posts from the fresh data
6. Return updated data

**Code Change** (backend/platforms/instagram/instagram_controller.py):
```python
# Before fix:
posts_data = [p.to_dict() for p in posts]
underperforming = instagram_service.detect_underperforming_posts(posts_data)
# ... update database ...
db.session.commit()
return jsonify({
    'underperforming_posts': underperforming  # ❌ Old data
})

# After fix:
posts_data = [p.to_dict() for p in posts]
underperforming = instagram_service.detect_underperforming_posts(posts_data)
# ... update database ...
db.session.commit()
posts_data = [p.to_dict() for p in posts]  # ✅ Regenerate with fresh data
underperforming_posts = [p for p in posts_data if p.get('is_underperforming', False)]
return jsonify({
    'underperforming_posts': underperforming_posts  # ✅ Fresh data
})
```

---

### Issue 2: AI Suggestions Not Appearing
**Problem**: When clicking "Get AI Suggestions", the toast said "AI suggestions have been added to your post" but they didn't appear in the UI.

**Root Cause**: The frontend was only updating the `posts` array in state, but NOT the `underperforming_posts` array. Since the underperforming posts section displays from `underperforming_posts`, the suggestions never showed up.

**Solution**: Update BOTH arrays when suggestions are generated.

**Code Change** (frontend/src/pages/InstagramAnalytics.jsx):
```javascript
// Before fix:
setDashboardData(prev => ({
  ...prev,
  posts: prev.posts.map(p =>
    p.id === postId ? response.post : p
  )
  // ❌ Missing: underperforming_posts update
}))

// After fix:
setDashboardData(prev => ({
  ...prev,
  posts: prev.posts.map(p =>
    p.id === postId ? response.post : p
  ),
  underperforming_posts: prev.underperforming_posts?.map(p =>
    p.id === postId ? response.post : p
  ) || []  // ✅ Also update underperforming_posts
}))
```

Also improved the success message to show how many suggestions were generated:
```javascript
ToastManager.success(
  'Suggestions Generated!',
  `${response.suggestions.length} AI suggestions added to your post.`,  // ✅ More informative
  [],
  4000
)
```

---

## How It Works Now

### Underperforming Posts Detection

1. **Fetch posts** from database (filtered by user_id and connection_id)
2. **Calculate average engagement rate** across all posts
3. **Set threshold** at 70% of average (configurable)
4. **Flag posts** below threshold as underperforming
5. **Calculate performance score**: `(post_engagement / avg_engagement) * 100`
6. **Update database** with flags
7. **Return fresh data** with all correct metrics

### AI Suggestions Flow

1. **User clicks** "Get AI Suggestions" button
2. **Frontend sends** POST request to `/api/platforms/instagram/posts/{post_id}/suggestions`
3. **Backend analyzes** post using AI service (Groq)
4. **AI generates** 2-3 specific, actionable suggestions
5. **Backend saves** suggestions to database
6. **Frontend updates** both `posts` and `underperforming_posts` arrays
7. **UI displays** suggestions immediately in the post card

---

## Testing

### Test Underperforming Posts Data
1. Go to Instagram Analytics → Dashboard tab
2. Scroll to "Underperforming Posts" section
3. Verify likes, comments, and engagement rate match your actual Instagram data
4. Check that performance score is shown (e.g., "45% of avg")

### Test AI Suggestions
1. Find an underperforming post
2. Click "Get AI Suggestions" button
3. Wait 2-5 seconds for AI to analyze
4. Verify suggestions appear in the post card
5. Check that suggestions are specific and actionable
6. Refresh page - suggestions should persist (saved to database)

---

## Example AI Suggestions

For a post with low engagement, AI might suggest:

```
1. Caption lacks engagement trigger - Add a question at the end like "What's your favorite?" to encourage comments

2. Missing call-to-action - Include phrases like "Tag a friend" or "Share your thoughts" to boost interaction

3. Suboptimal posting time - Your audience is most active at 7:00 PM. Consider reposting or scheduling similar content for that time
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ 1. Fetch Posts from Database                           │
│    ↓                                                    │
│ 2. Calculate Average Engagement                        │
│    ↓                                                    │
│ 3. Detect Underperforming (< 70% of avg)              │
│    ↓                                                    │
│ 4. Update Database with Flags                          │
│    ↓                                                    │
│ 5. Regenerate posts_data (FRESH DATA) ← FIX           │
│    ↓                                                    │
│ 6. Filter Underperforming Posts                        │
│    ↓                                                    │
│ 7. Return to Frontend                                  │
│    ↓                                                    │
│ 8. Display in UI with Correct Data ✅                  │
└─────────────────────────────────────────────────────────┘

AI Suggestions Flow:
┌─────────────────────────────────────────────────────────┐
│ 1. User Clicks "Get AI Suggestions"                    │
│    ↓                                                    │
│ 2. Send POST to /posts/{id}/suggestions                │
│    ↓                                                    │
│ 3. AI Analyzes Post (Groq API)                         │
│    ↓                                                    │
│ 4. Parse & Save Suggestions to DB                      │
│    ↓                                                    │
│ 5. Return Updated Post Data                            │
│    ↓                                                    │
│ 6. Update BOTH Arrays in State ← FIX                   │
│    ↓                                                    │
│ 7. Display Suggestions in UI ✅                        │
└─────────────────────────────────────────────────────────┘
```

---

## Files Modified

1. `backend/platforms/instagram/instagram_controller.py`
   - Fixed dashboard endpoint to regenerate posts_data after DB update
   - Now returns correct data in underperforming_posts

2. `frontend/src/pages/InstagramAnalytics.jsx`
   - Fixed handleGenerateSuggestions to update both arrays
   - Improved success message to show suggestion count

---

## Status

✅ **Fixed**: Underperforming posts now show correct data
✅ **Fixed**: AI suggestions now appear immediately after generation
✅ **Tested**: Both features working correctly

---

**Last Updated**: March 6, 2026
