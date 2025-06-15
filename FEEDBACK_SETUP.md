# GitHub Issues Feedback System Setup

This project now uses GitHub Issues to collect and display team feedback for each proposal dashboard.

## How It Works

### For Team Members (Feedback Providers):
1. Click any word in the 3D globe to open its dashboard
2. Scroll to the bottom "💬 Share Your Feedback" section
3. Two options to submit feedback:
   - **📝 Submit as GitHub Issue**: Fill form and submit directly
   - **🔗 Manual GitHub Issue**: Opens GitHub with pre-filled template

### For Repository Owners:
1. Add team members as collaborators to the repository
2. Team members can create issues with feedback
3. All feedback appears in the dashboard automatically

## Setup Instructions

### 1. Update Configuration
Edit the `GITHUB_CONFIG` in `app.js`:
```javascript
const GITHUB_CONFIG = {
    owner: 'your-username',     // Your GitHub username
    repo: 'your-repo-name',     // Your repository name
    apiBase: 'https://api.github.com'
};
```

### 2. Add Team Collaborators
1. Go to your repository settings
2. Navigate to "Manage access"
3. Click "Invite a collaborator"
4. Add team members' GitHub usernames

### 3. GitHub Personal Access Token (Optional)
For creating issues programmatically, you may need a token:
1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Create token with `repo` permissions
3. Add to the API calls (see code comments)

## Features

### Automatic Issue Creation
- Forms submit directly as GitHub Issues
- Structured format with ratings and comments
- Automatic labeling: `feedback`, `proposal:word`

### Team Feedback Display
- Shows all team feedback for each proposal
- Displays ratings, comments, and timestamps
- Links back to original GitHub Issues

### Fallback System
- If GitHub API fails, saves locally
- Graceful error handling
- Works offline with localStorage

## Issue Template
Located at `.github/ISSUE_TEMPLATE/feedback.md`, provides:
- Consistent feedback format
- Pre-filled proposal information
- Structured rating system

## Benefits
- ✅ Team collaboration via GitHub Issues
- ✅ Persistent feedback across sessions
- ✅ Centralized feedback management
- ✅ No external services required
- ✅ Version control for feedback history
- ✅ GitHub Pages compatible

## Limitations
- Requires GitHub repository access
- Team members need GitHub accounts
- API rate limits apply (60 requests/hour unauthenticated)
- Creating issues requires write permissions