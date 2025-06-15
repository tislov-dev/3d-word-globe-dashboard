// Define global functions first for immediate availability
function toggleLegend() {
    const legend = document.getElementById('theme-legend');
    legend.classList.toggle('hidden');
}

function toggleFullscreen() {
    const fullscreenButton = document.querySelector('.fullscreen-toggle');
    const fullscreenIcon = document.getElementById('fullscreen-icon');
    
    // Check if we're in an iframe and try parent window
    if (window !== window.top) {
        try {
            const parentDoc = window.parent.document;
            if (parentDoc.documentElement.requestFullscreen) {
                parentDoc.documentElement.requestFullscreen().then(() => {
                    updateFullscreenUI(fullscreenButton, fullscreenIcon, true);
                }).catch(() => {
                    showFullscreenError('Fullscreen not available in embedded view');
                });
                return;
            }
        } catch (e) {
            // Cannot access parent, continue with current document
        }
    }
    
    // Check for various fullscreen API implementations
    const isFullscreen = document.fullscreenElement || 
                        document.webkitFullscreenElement || 
                        document.mozFullScreenElement || 
                        document.msFullscreenElement;
    
    if (!isFullscreen) {
        // Enter fullscreen - try different API methods
        const docElm = document.documentElement;
        
        if (docElm.requestFullscreen) {
            docElm.requestFullscreen().then(() => {
                updateFullscreenUI(fullscreenButton, fullscreenIcon, true);
            }).catch(() => {
                showFullscreenError('Fullscreen request failed');
            });
        } else if (docElm.webkitRequestFullscreen) {
            try {
                docElm.webkitRequestFullscreen();
                updateFullscreenUI(fullscreenButton, fullscreenIcon, true);
            } catch (err) {
                showFullscreenError('Fullscreen not supported');
            }
        } else if (docElm.mozRequestFullScreen) {
            try {
                docElm.mozRequestFullScreen();
                updateFullscreenUI(fullscreenButton, fullscreenIcon, true);
            } catch (err) {
                showFullscreenError('Fullscreen not supported');
            }
        } else if (docElm.msRequestFullscreen) {
            try {
                docElm.msRequestFullscreen();
                updateFullscreenUI(fullscreenButton, fullscreenIcon, true);
            } catch (err) {
                showFullscreenError('Fullscreen not supported');
            }
        } else {
            showFullscreenError('Fullscreen not supported');
        }
    } else {
        // Exit fullscreen - try different API methods
        if (document.exitFullscreen) {
            document.exitFullscreen().then(() => {
                updateFullscreenUI(fullscreenButton, fullscreenIcon, false);
            }).catch(() => {
                // Silent fail for exit errors
            });
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
            updateFullscreenUI(fullscreenButton, fullscreenIcon, false);
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
            updateFullscreenUI(fullscreenButton, fullscreenIcon, false);
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
            updateFullscreenUI(fullscreenButton, fullscreenIcon, false);
        }
    }
}

function updateFullscreenUI(button, icon, isFullscreen) {
    if (isFullscreen) {
        button.classList.add('fullscreen-active');
        icon.textContent = '⛷';
        button.title = 'Exit Fullscreen';
    } else {
        button.classList.remove('fullscreen-active');
        icon.textContent = '⛶';
        button.title = 'Toggle Fullscreen';
    }
}

function showFullscreenError(message = 'Fullscreen not supported') {
    const button = document.querySelector('.fullscreen-toggle');
    const originalTitle = button.title;
    button.title = message;
    button.style.opacity = '0.5';
    
    setTimeout(() => {
        button.title = originalTitle;
        button.style.opacity = '1';
    }, 3000);
}

function closeDashboard() {
    const dashboard = document.getElementById('dashboard');
    const canvasContainer = document.getElementById('canvas-container');
    
    dashboard.classList.remove('open');
    canvasContainer.classList.remove('dashboard-open');
    window.globe.isRotationPaused = false;
    
    setTimeout(() => {
        window.globe.onWindowResize();
    }, 300);
}

// Immediately attach functions to window object
window.toggleLegend = toggleLegend;
window.toggleFullscreen = toggleFullscreen;
window.updateFullscreenUI = updateFullscreenUI;
window.showFullscreenError = showFullscreenError;
window.closeDashboard = closeDashboard;

// GitHub Integration Configuration
const GITHUB_CONFIG = {
    owner: 'tislov-dev', // Your GitHub username
    repo: '3d-word-globe-dashboard', // Your repository name
    apiBase: 'https://api.github.com'
};

// Feedback functionality with GitHub Issues integration
async function submitFeedback(word, isInline = false) {
    // Determine the correct IDs based on whether it's inline or not
    const nameId = isInline ? `inline-feedback-name-${word}` : `feedback-name-${word}`;
    const emailId = isInline ? `inline-feedback-email-${word}` : `feedback-email-${word}`;
    const ratingInputId = isInline ? `inline-rating-input-${word}` : `rating-input-${word}`;
    const commentsId = isInline ? `inline-feedback-comments-${word}` : `feedback-comments-${word}`;
    
    const name = document.getElementById(nameId).value.trim();
    const email = document.getElementById(emailId).value.trim();
    const rating = document.getElementById(ratingInputId).value || 0;
    const comments = document.getElementById(commentsId).value.trim();
    
    if (!name || !email || rating === 0) {
        alert('Please fill in all required fields and provide a rating.');
        return;
    }
    
    const feedback = {
        name,
        email,
        rating: parseInt(rating),
        comments,
        timestamp: new Date().toISOString(),
        word
    };
    
    // Show loading state
    const formId = isInline ? `inline-feedback-form-${word}` : `feedback-form-${word}`;
    const submitBtn = document.querySelector(`#${formId} .feedback-submit`);
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Opening GitHub...';
    submitBtn.disabled = true;
    
    try {
        // Create GitHub Issue (opens in new tab)
        await createGitHubIssue(word, feedback);
        
        // Also save locally for immediate display
        saveFeedbackLocally(word, feedback);
        
        // Show success message
        const successId = isInline ? `inline-feedback-success-${word}` : `feedback-success-${word}`;
        const successMsg = document.getElementById(successId);
        successMsg.style.display = 'block';
        successMsg.innerHTML = `
            <div>GitHub issue page opened!</div>
            <div style="font-size: 11px; margin-top: 5px;">
                Please submit the pre-filled issue on GitHub. Also saved locally.
            </div>
        `;
        
        // Disable form
        const form = document.getElementById(formId);
        const inputs = form.querySelectorAll('input, textarea, button');
        inputs.forEach(input => input.disabled = true);
        
        // If it's an inline form, refresh the dashboard to show the new feedback
        if (isInline && window.globe) {
            setTimeout(() => {
                window.globe.showDashboard(word);
            }, 1000);
        }
        
    } catch (error) {
        console.error('Error opening GitHub issue page:', error);
        
        // Fallback to localStorage only
        saveFeedbackLocally(word, feedback);
        
        const successMsg = document.getElementById(successId);
        successMsg.style.display = 'block';
        successMsg.innerHTML = `
            <div style="color: #ff9800;">Feedback saved locally</div>
            <div style="font-size: 11px; margin-top: 5px;">
                Could not open GitHub. Feedback saved to your browser.
            </div>
        `;
        
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function createGitHubIssue(word, feedback) {
    // Since GitHub requires authentication for creating issues,
    // we'll redirect to GitHub's issue creation page instead
    const stars = '⭐'.repeat(feedback.rating);
    const issueBody = `## Proposal Information
**Proposal Name:** ${word}

## Feedback Details
**Name:** ${feedback.name}
**Email:** ${feedback.email}
**Rating:** ${stars} (${feedback.rating}/5)

## Comments
${feedback.comments || 'No additional comments provided.'}

---
**Submitted:** ${new Date(feedback.timestamp).toLocaleString()}
**Type:** Dashboard Feedback`;

    // Encode the body for URL parameter
    const encodedBody = encodeURIComponent(issueBody);
    const encodedTitle = encodeURIComponent(`Feedback: ${word}`);
    const labels = encodeURIComponent(`feedback,proposal:${word.toLowerCase()}`);
    
    // Open GitHub issue creation page with pre-filled data
    const githubUrl = `https://github.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/issues/new?title=${encodedTitle}&body=${encodedBody}&labels=${labels}`;
    
    // Open in new tab
    window.open(githubUrl, '_blank');
    
    // Return success to continue with UI updates
    return { html_url: githubUrl };
}

async function loadFeedback(word) {
    let allFeedback = [];
    
    // Try to load from GitHub Issues first
    try {
        const issues = await fetchGitHubIssues(word);
        
        if (issues && issues.length > 0) {
            allFeedback = issues.map(issue => parseIssueToFeedback(issue));
        }
    } catch (error) {
        console.warn('Could not load GitHub issues, will only show localStorage:', error);
    }
    
    // Also load localStorage feedback
    const localFeedback = loadFeedbackLocally(word);
    
    // Combine GitHub and local feedback, removing duplicates
    const combinedFeedback = [...allFeedback];
    
    // Add local feedback that aren't already in GitHub issues
    localFeedback.forEach(local => {
        const isDuplicate = allFeedback.some(github => 
            Math.abs(new Date(github.timestamp) - new Date(local.timestamp)) < 60000 && // Within 1 minute
            github.name === local.name &&
            github.rating === local.rating
        );
        
        if (!isDuplicate) {
            combinedFeedback.push(local);
        }
    });
    
    
    // Sort by timestamp (newest first)
    return combinedFeedback.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

async function fetchGitHubIssues(word) {
    const label = `proposal:${word.toLowerCase()}`;
    const url = `${GITHUB_CONFIG.apiBase}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/issues?labels=feedback,${label}&state=all`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const issues = await response.json();
    
    // If no issues found with specific labels, try broader search
    if (issues.length === 0) {
        // Try searching for just the feedback label
        const broadUrl = `${GITHUB_CONFIG.apiBase}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/issues?labels=feedback&state=all`;
        
        const broadResponse = await fetch(broadUrl);
        if (broadResponse.ok) {
            const allFeedbackIssues = await broadResponse.json();
            
            // If still no feedback issues, check ALL issues in the repo
            if (allFeedbackIssues.length === 0) {
                const allIssuesUrl = `${GITHUB_CONFIG.apiBase}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/issues?state=all`;
                
                const allIssuesResponse = await fetch(allIssuesUrl);
                if (allIssuesResponse.ok) {
                    const allIssues = await allIssuesResponse.json();
                    
                    // Filter by title containing the word
                    const matchingByTitle = allIssues.filter(issue => 
                        issue.title.toLowerCase().includes(`feedback: ${word.toLowerCase()}`) ||
                        issue.title.toLowerCase().includes(word.toLowerCase())
                    );
                    
                    return matchingByTitle;
                }
            } else {
                // Filter by title containing the word
                const matchingIssues = allFeedbackIssues.filter(issue => 
                    issue.title.toLowerCase().includes(`feedback: ${word.toLowerCase()}`)
                );
                
                return matchingIssues;
            }
        }
    }
    
    return issues;
}

function parseIssueToFeedback(issue) {
    // Parse the issue body to extract feedback data
    const body = issue.body || '';
    
    // Extract rating (look for star pattern or number pattern)
    const ratingMatch = body.match(/\*\*Rating:\*\*.*?(\d)\/5/) || body.match(/Rating:\*\*.*?\((\d)\/5\)/);
    const rating = ratingMatch ? parseInt(ratingMatch[1]) : 0;
    
    // Extract name
    const nameMatch = body.match(/\*\*Name:\*\*\s*(.+)/);
    const name = nameMatch ? nameMatch[1].trim() : 'Anonymous';
    
    // Extract comments - try multiple patterns
    let comments = '';
    
    // Pattern 1: ## Comments followed by content until ---
    const commentsMatch1 = body.match(/## Comments\s*\n(.*?)\n---/s);
    if (commentsMatch1) {
        comments = commentsMatch1[1].trim();
    } else {
        // Pattern 2: ## Comments followed by content until end or next section
        const commentsMatch2 = body.match(/## Comments\s*\n(.*?)(?:\n##|\n---|\n\*\*|$)/s);
        if (commentsMatch2) {
            comments = commentsMatch2[1].trim();
        } else {
            // Pattern 3: Look for any content after "Comments" section
            const commentsMatch3 = body.match(/## Comments\s*\n(.*)$/s);
            if (commentsMatch3) {
                comments = commentsMatch3[1].trim().replace(/\n---.*$/s, '').trim();
            }
        }
    }
    
    // Remove "No additional comments provided." if that's all there is
    if (comments === 'No additional comments provided.') {
        comments = '';
    }
    
    return {
        name,
        rating,
        comments,
        timestamp: issue.created_at,
        word: issue.title.replace('Feedback: ', ''),
        githubUrl: issue.html_url
    };
}

// Fallback localStorage functions
function saveFeedbackLocally(word, feedback) {
    const key = `feedback_${word}`;
    let existingFeedback = JSON.parse(localStorage.getItem(key) || '[]');
    existingFeedback.push(feedback);
    localStorage.setItem(key, JSON.stringify(existingFeedback));
}

function loadFeedbackLocally(word) {
    const key = `feedback_${word}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
}

function setRating(word, rating, isInline = false) {
    // Determine the correct IDs based on whether it's inline or not
    const ratingId = isInline ? `inline-rating-${word}` : `rating-${word}`;
    const ratingInputId = isInline ? `inline-rating-input-${word}` : `rating-input-${word}`;
    
    // Update visual stars
    const stars = document.querySelectorAll(`#${ratingId} .rating-star`);
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
    
    // Update hidden input
    const hiddenInput = document.getElementById(ratingInputId);
    if (hiddenInput) {
        hiddenInput.value = rating;
    }
}

// Security functions
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function isValidGitHubUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname === 'github.com' && 
               urlObj.pathname.startsWith(`/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/`);
    } catch {
        return false;
    }
}

function sanitizeFeedback(feedback) {
    return {
        ...feedback,
        name: escapeHtml(feedback.name),
        comments: escapeHtml(feedback.comments),
        githubUrl: feedback.githubUrl && isValidGitHubUrl(feedback.githubUrl) ? feedback.githubUrl : null
    };
}

// New feedback management functions
function showAddFeedbackForm(word) {
    const formContainer = document.getElementById(`add-feedback-form-${word}`);
    if (formContainer) {
        formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
    }
}

function deleteFeedback(word, feedbackIndex) {
    if (!confirm('Are you sure you want to delete this feedback?')) {
        return;
    }
    
    // Load current feedback
    const key = `feedback_${word}`;
    let existingFeedback = JSON.parse(localStorage.getItem(key) || '[]');
    
    // Remove the feedback at the specified index
    if (feedbackIndex >= 0 && feedbackIndex < existingFeedback.length) {
        existingFeedback.splice(feedbackIndex, 1);
        
        // Save back to localStorage
        localStorage.setItem(key, JSON.stringify(existingFeedback));
        
        // Refresh the dashboard to show updated feedback
        if (window.globe) {
            window.globe.showDashboard(word);
        }
    }
}

window.submitFeedback = submitFeedback;
window.setRating = setRating;
window.showAddFeedbackForm = showAddFeedbackForm;
window.deleteFeedback = deleteFeedback;

// Search functionality
let searchResults = [];
let currentSearchTerm = '';

function searchWords(searchTerm) {
    currentSearchTerm = searchTerm.toLowerCase().trim();
    const resultsContainer = document.getElementById('search-results');
    
    if (!currentSearchTerm) {
        resultsContainer.style.display = 'none';
        clearSearchHighlight();
        return;
    }
    
    // Filter words that match the search term
    searchResults = window.globe.words.filter(word => 
        word.toLowerCase().includes(currentSearchTerm)
    );
    
    // Display results
    if (searchResults.length > 0) {
        resultsContainer.innerHTML = searchResults.map(word => {
            const theme = window.globe.wordThemes[word];
            const themeColor = window.globe.themes[theme]?.color || '#ffffff';
            const safeWord = escapeHtml(word);
            const safeTheme = escapeHtml(theme);
            
            return `
                <div class="search-result-item" data-word="${safeWord}">
                    <div>
                        <div class="search-result-word">${safeWord}</div>
                        <div class="search-result-theme" style="color: ${escapeHtml(themeColor)};">${safeTheme}</div>
                    </div>
                </div>
            `;
        }).join('');
        resultsContainer.style.display = 'block';
        
        // Highlight matching words in the globe
        highlightSearchResults();
    } else {
        resultsContainer.innerHTML = '<div class="search-result-item">No matches found</div>';
        resultsContainer.style.display = 'block';
        clearSearchHighlight();
    }
}

function selectSearchResult(word) {
    // Hide search results
    document.getElementById('search-results').style.display = 'none';
    
    // Find the word object in the globe
    const wordObject = window.globe.wordObjects.find(obj => obj.userData.word === word);
    if (wordObject) {
        // Animate camera to focus on the selected word
        focusOnWord(wordObject);
        
        // Open dashboard after a short delay
        setTimeout(() => {
            window.globe.showDashboard(word);
        }, 1000);
    }
}

function focusOnWord(wordObject) {
    if (!window.globe) return;
    
    // Get the position of the word relative to the globe center
    const wordPosition = wordObject.position.clone();
    
    // Calculate the rotation needed to bring the word to the front
    // We want to rotate the globe so the word appears in the center
    const targetRotationY = -Math.atan2(wordPosition.x, wordPosition.z);
    const targetRotationX = Math.asin(wordPosition.y / 8); // 8 is the globe radius
    
    // Set the target rotations for smooth animation
    window.globe.targetRotationX = targetRotationX;
    window.globe.targetRotationY = targetRotationY;
    window.globe.targetZoom = 12; // Zoom in slightly to better see the word
    
    // Temporarily highlight the word more prominently
    wordObject.material.emissive.setHex(0x666666);
    wordObject.scale.set(1.5, 1.5, 1.5);
    
    // Reset highlighting after animation completes
    setTimeout(() => {
        if (searchResults.length > 0) {
            // Keep search highlighting if search is active
            highlightSearchResults();
        } else {
            // Otherwise reset to normal
            wordObject.material.emissive.setHex(0x000000);
            wordObject.scale.set(1, 1, 1);
        }
    }, 1500);
}

function highlightSearchResults() {
    if (!window.globe) return;
    
    // Reset all word colors first
    clearSearchHighlight();
    
    // Highlight matching words
    window.globe.wordObjects.forEach(obj => {
        const word = obj.userData.word;
        if (searchResults.includes(word)) {
            // Highlight with bright white color
            obj.material.emissive.setHex(0x444444);
            obj.scale.set(1.3, 1.3, 1.3);
        }
    });
}

function clearSearchHighlight() {
    if (!window.globe) return;
    
    // Reset all words to original state
    window.globe.wordObjects.forEach(obj => {
        obj.material.color.copy(obj.userData.originalColor);
        obj.material.emissive.setHex(0x000000);
        obj.scale.set(1, 1, 1);
    });
}

function showSearchResults() {
    if (currentSearchTerm) {
        document.getElementById('search-results').style.display = 'block';
    }
}

function clearSearch() {
    document.getElementById('search-bar').value = '';
    document.getElementById('search-results').style.display = 'none';
    currentSearchTerm = '';
    searchResults = [];
    clearSearchHighlight();
}

// Hide search results when clicking outside
document.addEventListener('click', function(event) {
    const searchContainer = document.querySelector('.search-container');
    if (!searchContainer.contains(event.target)) {
        document.getElementById('search-results').style.display = 'none';
    }
});

// Global functions
window.searchWords = searchWords;
window.selectSearchResult = selectSearchResult;
window.showSearchResults = showSearchResults;
window.clearSearch = clearSearch;

class WordGlobe {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true });
        this.words = [];
        this.wordObjects = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isMouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetRotationX = 0;
        this.targetRotationY = 0;
        this.rotationX = 0;
        this.rotationY = 0;
        this.globeGroup = new THREE.Group();
        this.isRotationPaused = false;
        this.stars = [];
        this.starField = new THREE.Group();
        this.targetZoom = 15;
        this.currentZoom = 15;
        this.minZoom = 5;
        this.maxZoom = 30;
        
        this.initializeWords();
        this.setupScene();
        this.setupEventListeners();
        this.populateLegend();
        this.checkFullscreenSupport();
        this.animate();
    }
    
    initializeWords() {
        this.themes = {
            'Data & Analytics': {
                words: ['Analytics', 'Data', 'Insights', 'Metrics', 'KPIs', 'Dashboard', 'Visualization', 'Reports', 'Intelligence', 'Analysis'],
                color: '#2196F3' // Blue
            },
            'Marketing & Sales': {
                words: ['Marketing', 'Sales', 'Engagement', 'Customer', 'Acquisition', 'Conversion', 'Funnel', 'Pipeline', 'Market', 'Competitive'],
                color: '#FF5722' // Deep Orange
            },
            'Finance & Business': {
                words: ['Revenue', 'Budget', 'ROI', 'Cost', 'Profit', 'Margin', 'Forecast', 'Growth', 'Strategy', 'Business'],
                color: '#4CAF50' // Green
            },
            'Technology': {
                words: ['Technology', 'Digital', 'Platform', 'Cloud', 'Mobile', 'Web', 'Application', 'Software', 'Integration', 'API'],
                color: '#9C27B0' // Purple
            },
            'Development & DevOps': {
                words: ['Development', 'DevOps', 'CI/CD', 'Deployment', 'Testing', 'Debugging', 'Maintenance', 'Updates', 'Features', 'Agile'],
                color: '#FF9800' // Orange
            },
            'User Experience': {
                words: ['Design', 'User', 'Experience', 'Interface', 'Usability', 'Accessibility', 'Prototype', 'Wireframe', 'Journey', 'Persona'],
                color: '#E91E63' // Pink
            },
            'Operations & Performance': {
                words: ['Performance', 'Automation', 'Efficiency', 'Productivity', 'Optimization', 'Scalability', 'Monitoring', 'Alerting', 'Logging', 'Quality'],
                color: '#00BCD4' // Cyan
            },
            'Management & Leadership': {
                words: ['Management', 'Leadership', 'Team', 'Collaboration', 'Communication', 'Project', 'Governance', 'Risk', 'Compliance', 'Enterprise'],
                color: '#795548' // Brown
            },
            'Planning & Strategy': {
                words: ['Vision', 'Mission', 'Goals', 'Objectives', 'Targets', 'Milestones', 'Timeline', 'Schedule', 'Roadmap', 'Planning'],
                color: '#607D8B' // Blue Grey
            },
            'Support & Services': {
                words: ['Service', 'Support', 'Success', 'Retention', 'Resources', 'Capacity', 'Demand', 'Supply', 'Research', 'Innovation'],
                color: '#FFC107' // Amber
            }
        };
        
        this.words = [];
        this.wordThemes = {};
        
        Object.keys(this.themes).forEach(theme => {
            this.themes[theme].words.forEach(word => {
                this.words.push(word);
                this.wordThemes[word] = theme;
            });
        });
        
        this.dashboardData = this.generateDashboardData();
    }
    
    generateDashboardData() {
        const brands = ['TechCorp', 'DataFlow', 'InsightMax', 'MetricsPro', 'AnalyticHub', 'SmartDash', 'CloudMetrics', 'VizuallyPro'];
        const taglines = [
            'Transforming data into insights',
            'Your success, our analytics',
            'Data-driven decisions made simple',
            'Unlocking business potential',
            'Intelligence at your fingertips',
            'Metrics that matter',
            'Visualizing your success',
            'Smart analytics for smart business'
        ];
        
        const data = {};
        this.words.forEach(word => {
            data[word] = {
                description: `${word} dashboard provides comprehensive insights and analytics for your business operations. Track key performance indicators, monitor trends, and make data-driven decisions with our advanced visualization tools.`,
                brand: brands[Math.floor(Math.random() * brands.length)],
                tagline: taglines[Math.floor(Math.random() * taglines.length)],
                mascot: `mascot-${Math.floor(Math.random() * 8) + 1}`,
                category: this.getCategory(word),
                features: this.getFeatures(word),
                metrics: this.getMetrics(word)
            };
        });
        return data;
    }
    
    getCategory(word) {
        return this.wordThemes[word] || 'General Business';
    }
    
    getFeatures(word) {
        const allFeatures = [
            'Real-time monitoring',
            'Custom alerts',
            'Advanced filtering',
            'Export capabilities',
            'Mobile responsive',
            'API integration',
            'Historical data analysis',
            'Predictive analytics',
            'Automated reporting',
            'Team collaboration'
        ];
        return allFeatures.slice(0, Math.floor(Math.random() * 4) + 3);
    }
    
    getMetrics(word) {
        return {
            users: Math.floor(Math.random() * 10000) + 1000,
            uptime: '99.' + Math.floor(Math.random() * 9) + Math.floor(Math.random() * 9) + '%',
            satisfaction: Math.floor(Math.random() * 20) + 80 + '%',
            performance: Math.floor(Math.random() * 30) + 70 + 'ms'
        };
    }
    
    setupScene() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000011, 1);
        this.scene.add(this.globeGroup);
        this.scene.add(this.starField);
        
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = false;
        this.scene.add(directionalLight);
        
        // Add rim lighting for professional look
        const rimLight = new THREE.DirectionalLight(0x6699ff, 0.3);
        rimLight.position.set(-10, -5, -5);
        this.scene.add(rimLight);
        
        // Add fill light
        const fillLight = new THREE.DirectionalLight(0xffeedd, 0.2);
        fillLight.position.set(0, -10, 0);
        this.scene.add(fillLight);
        
        this.createStarField();
        this.createWordSphere();
        this.camera.position.z = 15;
    }
    
    createStarField() {
        const starGeometry = new THREE.BufferGeometry();
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const starCount = 2000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        
        const starColors = [
            new THREE.Color(0xffffff), // White
            new THREE.Color(0xaaccff), // Blue
            new THREE.Color(0xffffaa), // Yellow
            new THREE.Color(0xffaaaa), // Red
            new THREE.Color(0xaaffaa), // Green
        ];
        
        for (let i = 0; i < starCount; i++) {
            // Create stars in a large sphere around the scene
            const radius = 200 + Math.random() * 300;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            // Random star color
            const starColor = starColors[Math.floor(Math.random() * starColors.length)];
            colors[i * 3] = starColor.r;
            colors[i * 3 + 1] = starColor.g;
            colors[i * 3 + 2] = starColor.b;
            
            // Random star size
            sizes[i] = Math.random() * 3 + 0.5;
            
            // Store star data for animation
            this.stars.push({
                baseIntensity: Math.random() * 0.5 + 0.5,
                twinkleSpeed: Math.random() * 0.02 + 0.005,
                phase: Math.random() * Math.PI * 2
            });
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        starMaterial.vertexColors = true;
        starMaterial.sizeAttenuation = false;
        
        const starField = new THREE.Points(starGeometry, starMaterial);
        this.starField.add(starField);
        this.starFieldPoints = starField;
        
        // Create nebula-like background
        this.createNebula();
    }
    
    createNebula() {
        const nebulaGeometry = new THREE.SphereGeometry(400, 32, 32);
        const nebulaMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying vec3 vWorldPosition;
                
                void main() {
                    vec3 color = vec3(0.05, 0.02, 0.15);
                    float noise = sin(vWorldPosition.x * 0.01 + time * 0.5) * 
                                  cos(vWorldPosition.y * 0.01 + time * 0.3) * 
                                  sin(vWorldPosition.z * 0.01 + time * 0.4);
                    color += vec3(0.1, 0.05, 0.2) * noise * 0.3;
                    gl_FragColor = vec4(color, 0.3);
                }
            `,
            transparent: true,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        
        const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
        this.starField.add(nebula);
        this.nebula = nebula;
    }
    
    createWordSphere() {
        const radius = 8;
        const loader = new THREE.FontLoader();
        
        loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            this.words.forEach((word, index) => {
                const phi = Math.acos(-1 + (2 * index) / this.words.length);
                const theta = Math.sqrt(this.words.length * Math.PI) * phi;
                
                const x = radius * Math.cos(theta) * Math.sin(phi);
                const y = radius * Math.sin(theta) * Math.sin(phi);
                const z = radius * Math.cos(phi);
                
                const textGeometry = new THREE.TextGeometry(word, {
                    font: font,
                    size: 0.3,
                    height: 0.08,
                    curveSegments: 16,
                    bevelEnabled: true,
                    bevelThickness: 0.015,
                    bevelSize: 0.008,
                    bevelOffset: 0,
                    bevelSegments: 4
                });
                
                textGeometry.computeBoundingBox();
                const centerOffsetX = -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x);
                const centerOffsetY = -0.5 * (textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y);
                
                const theme = this.wordThemes[word];
                const themeColor = this.themes[theme].color;
                
                const material = new THREE.MeshPhongMaterial({
                    color: new THREE.Color(themeColor),
                    transparent: true,
                    opacity: 0.95,
                    shininess: 100,
                    specular: 0x444444,
                    emissive: new THREE.Color(themeColor).multiplyScalar(0.1),
                    flatShading: false
                });
                
                const textMesh = new THREE.Mesh(textGeometry, material);
                textMesh.position.set(x + centerOffsetX, y + centerOffsetY, z);
                
                // Make text face outward from center
                const lookAtPosition = new THREE.Vector3(x * 2, y * 2, z * 2);
                textMesh.lookAt(lookAtPosition);
                
                textMesh.userData = { word: word, originalColor: material.color.clone() };
                
                this.wordObjects.push(textMesh);
                this.globeGroup.add(textMesh);
            });
        });
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
        document.addEventListener('mousedown', (event) => this.onMouseDown(event));
        document.addEventListener('mousemove', (event) => this.onMouseMove(event));
        document.addEventListener('mouseup', () => this.onMouseUp());
        document.addEventListener('click', (event) => this.onMouseClick(event));
        document.addEventListener('wheel', (event) => this.onMouseWheel(event), { passive: false });
        // Add cross-browser fullscreen event listeners
        document.addEventListener('fullscreenchange', () => this.onFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.onFullscreenChange());
        document.addEventListener('mozfullscreenchange', () => this.onFullscreenChange());
        document.addEventListener('MSFullscreenChange', () => this.onFullscreenChange());
    }
    
    onWindowResize() {
        const container = document.getElementById('canvas-container');
        const width = container.offsetWidth;
        const height = container.offsetHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    onMouseDown(event) {
        if (event.target.id === 'canvas') {
            this.isMouseDown = true;
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
        }
    }
    
    onMouseMove(event) {
        if (this.isMouseDown && event.target.id === 'canvas') {
            const deltaX = event.clientX - this.mouseX;
            const deltaY = event.clientY - this.mouseY;
            
            this.targetRotationY += deltaX * 0.005;
            this.targetRotationX += deltaY * 0.005;
            
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
        }
        
        const container = document.getElementById('canvas-container');
        const rect = container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.checkIntersections();
    }
    
    onMouseUp() {
        this.isMouseDown = false;
    }
    
    onMouseWheel(event) {
        // Only handle wheel events when over the canvas container
        const canvasContainer = document.getElementById('canvas-container');
        const rect = canvasContainer.getBoundingClientRect();
        const isOverCanvas = event.clientX >= rect.left && 
                           event.clientX <= rect.right && 
                           event.clientY >= rect.top && 
                           event.clientY <= rect.bottom;
        
        if (isOverCanvas) {
            event.preventDefault();
            
            const zoomSpeed = 0.5;
            const delta = event.deltaY > 0 ? zoomSpeed : -zoomSpeed;
            
            this.targetZoom += delta;
            this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetZoom));
        }
    }
    
    onFullscreenChange() {
        const fullscreenButton = document.querySelector('.fullscreen-toggle');
        const fullscreenIcon = document.getElementById('fullscreen-icon');
        
        // Check for cross-browser fullscreen state
        const isFullscreen = document.fullscreenElement || 
                            document.webkitFullscreenElement || 
                            document.mozFullScreenElement || 
                            document.msFullscreenElement;
        
        updateFullscreenUI(fullscreenButton, fullscreenIcon, !!isFullscreen);
        
        // Resize canvas to new dimensions
        setTimeout(() => {
            this.onWindowResize();
        }, 100);
    }
    
    onMouseClick(event) {
        if (event.target.id === 'canvas') {
            const container = document.getElementById('canvas-container');
            const rect = container.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.wordObjects);
            
            if (intersects.length > 0) {
                const word = intersects[0].object.userData.word;
                this.showDashboard(word);
            }
        }
    }
    
    checkIntersections() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.wordObjects);
        
        this.wordObjects.forEach(obj => {
            obj.material.color.copy(obj.userData.originalColor);
            obj.scale.set(1, 1, 1);
        });
        
        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            intersectedObject.material.color.setHex(0xffffff);
            intersectedObject.scale.set(1.2, 1.2, 1.2);
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'default';
        }
    }
    
    async showDashboard(word) {
        const data = this.dashboardData[word];
        const dashboard = document.getElementById('dashboard');
        const canvasContainer = document.getElementById('canvas-container');
        const content = document.getElementById('dashboard-content');
        
        // Show loading state
        content.innerHTML = '<div class="loading">Loading dashboard...</div>';
        
        // Check if feedback already exists for this proposal
        const existingFeedback = await loadFeedback(word);
        const hasSubmittedFeedback = existingFeedback.length > 0;
        
        content.innerHTML = `
            <div class="dashboard-header">
                <div class="dashboard-title">${word}</div>
                <div class="dashboard-subtitle">Dashboard Overview</div>
            </div>
            
            <div class="card">
                <div class="card-title">Description</div>
                <div class="card-content">${data.description}</div>
            </div>
            
            <div class="card">
                <div class="card-title">Brand Information</div>
                <div class="card-content">
                    <strong>Brand:</strong> ${data.brand}<br>
                    <strong>Tagline:</strong> ${data.tagline}<br>
                    <strong>Theme:</strong> <span style="color: ${this.themes[data.category].color}; font-weight: bold;">${data.category}</span>
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">Mascot</div>
                <div class="card-content">
                    <div class="mascot"></div>
                    <div style="text-align: center; margin-top: 8px;">${data.mascot}</div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">Key Features</div>
                <div class="card-content">
                    ${data.features.map(feature => `• ${feature}`).join('<br>')}
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">Performance Metrics</div>
                <div class="card-content">
                    <strong>Active Users:</strong> ${data.metrics.users.toLocaleString()}<br>
                    <strong>Uptime:</strong> ${data.metrics.uptime}<br>
                    <strong>User Satisfaction:</strong> ${data.metrics.satisfaction}<br>
                    <strong>Avg Response Time:</strong> ${data.metrics.performance}
                </div>
            </div>
            
            <div class="feedback-card">
                <div class="card-title">💬 Share Your Feedback</div>
                ${hasSubmittedFeedback ? this.renderExistingFeedback(existingFeedback, word) : this.renderFeedbackForm(word)}
            </div>
        `;
        
        dashboard.classList.add('open');
        canvasContainer.classList.add('dashboard-open');
        this.isRotationPaused = true;
        
        setTimeout(() => {
            this.onWindowResize();
        }, 300);
    }
    
    loadFeedback(word) {
        const key = `feedback_${word}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
    }
    
    renderFeedbackForm(word, isInline = false) {
        const formId = isInline ? `inline-feedback-form-${word}` : `feedback-form-${word}`;
        const nameId = isInline ? `inline-feedback-name-${word}` : `feedback-name-${word}`;
        const emailId = isInline ? `inline-feedback-email-${word}` : `feedback-email-${word}`;
        const ratingId = isInline ? `inline-rating-${word}` : `rating-${word}`;
        const ratingInputId = isInline ? `inline-rating-input-${word}` : `rating-input-${word}`;
        const commentsId = isInline ? `inline-feedback-comments-${word}` : `feedback-comments-${word}`;
        const successId = isInline ? `inline-feedback-success-${word}` : `feedback-success-${word}`;
        
        return `
            <form id="${formId}" class="feedback-form">
                <input 
                    type="text" 
                    id="${nameId}" 
                    placeholder="Your Name *" 
                    class="feedback-input"
                    required
                />
                <input 
                    type="email" 
                    id="${emailId}" 
                    placeholder="Your Email *" 
                    class="feedback-input"
                    required
                />
                <div class="rating-container">
                    <span>Rating: </span>
                    <div id="${ratingId}" class="rating-stars">
                        ${[1,2,3,4,5].map(star => 
                            `<span class="rating-star" data-rating="${star}" data-word="${word}" data-inline="${isInline}">★</span>`
                        ).join('')}
                    </div>
                    <input type="hidden" id="${ratingInputId}" name="rating-${word}" value="0" />
                </div>
                <textarea 
                    id="${commentsId}" 
                    placeholder="Additional comments or suggestions..." 
                    class="feedback-textarea"
                ></textarea>
                <div style="display: flex; gap: 10px;">
                    <button 
                        type="button" 
                        class="feedback-submit"
                        data-word="${word}"
                        data-inline="${isInline}"
                        style="flex: 1;"
                    >
                        📝 Open GitHub Issue Form
                    </button>
                    <a 
                        href="https://github.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/issues/new?template=feedback.md&title=Feedback: ${word}&labels=feedback,proposal:${word.toLowerCase()}" 
                        target="_blank" 
                        class="feedback-submit" 
                        style="flex: 1; text-decoration: none; text-align: center; background: rgba(76, 175, 80, 0.8);"
                    >
                        🔗 Manual GitHub Issue
                    </a>
                </div>
                <div style="font-size: 11px; color: #aaa; margin-top: 8px; text-align: center;">
                    Your feedback will be shared with the team via GitHub Issues
                </div>
                <div id="${successId}" class="feedback-success" style="display: none;"></div>
            </form>
        `;
    }
    
    renderExistingFeedback(feedbackList, word) {
        if (feedbackList.length === 0) {
            return `
                <div class="card-content">
                    <div class="feedback-header">
                        <span>No feedback available yet.</span>
                        <button class="feedback-btn feedback-add-new" data-word="${word}" data-action="add-new">
                            Add Feedback
                        </button>
                    </div>
                </div>
            `;
        }
        
        // Show all team feedback, not just the latest
        const feedbackHTML = feedbackList.map((feedback, index) => {
            const sanitizedFeedback = sanitizeFeedback(feedback);
            const stars = '★'.repeat(sanitizedFeedback.rating) + '☆'.repeat(5 - sanitizedFeedback.rating);
            const isFromGitHub = sanitizedFeedback.githubUrl;
            const canDelete = !isFromGitHub; // Only allow deleting local feedback
            
            return `
                <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding: 15px 0; ${index === feedbackList.length - 1 ? 'border-bottom: none;' : ''}" data-feedback-index="${index}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong style="color: #64b5f6;">${sanitizedFeedback.name}</strong>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="color: #ffd700; font-size: 16px;">${stars}</span>
                            ${canDelete ? `
                                <button class="feedback-btn feedback-delete" data-word="${word}" data-feedback-index="${index}" data-action="delete">
                                    Delete
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    ${sanitizedFeedback.comments ? `
                        <div style="margin: 8px 0; font-style: italic; color: #e0e0e0;">
                            "${sanitizedFeedback.comments}"
                        </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #aaa;">
                        <span>${new Date(sanitizedFeedback.timestamp).toLocaleDateString()}</span>
                        ${isFromGitHub ? `
                            <a href="${sanitizedFeedback.githubUrl}" target="_blank" style="color: #64b5f6; text-decoration: none;" rel="noopener noreferrer">
                                GitHub Issue →
                            </a>
                        ` : '<span style="color: #ff9800;">Local</span>'}
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="card-content">
                <div class="feedback-header">
                    <strong>Team Feedback (${feedbackList.length})</strong>
                    <button class="feedback-btn feedback-add-new" data-word="${word}" data-action="add-new">
                        Add Feedback
                    </button>
                </div>
                <div id="feedback-list-${word}">
                    ${feedbackHTML}
                </div>
                <div style="text-align: center; margin-top: 15px;">
                    <a href="https://github.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/issues?labels=feedback" 
                       target="_blank" 
                       style="color: #64b5f6; font-size: 12px; text-decoration: none;">
                       View all feedback on GitHub →
                    </a>
                </div>
                <div id="add-feedback-form-${word}" style="display: none; margin-top: 15px;">
                    ${this.renderFeedbackForm(word, true)}
                </div>
            </div>
        `;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (!this.isMouseDown && !this.isRotationPaused) {
            this.targetRotationY += 0.002;
        }
        
        this.rotationX += (this.targetRotationX - this.rotationX) * 0.05;
        this.rotationY += (this.targetRotationY - this.rotationY) * 0.05;
        
        this.globeGroup.rotation.x = this.rotationX;
        this.globeGroup.rotation.y = this.rotationY;
        
        // Smooth zoom animation
        this.currentZoom += (this.targetZoom - this.currentZoom) * 0.1;
        this.camera.position.z = this.currentZoom;
        
        // Animate stars
        this.animateStars();
        
        // Animate nebula
        if (this.nebula) {
            this.nebula.material.uniforms.time.value += 0.01;
        }
        
        // Slowly rotate starfield
        this.starField.rotation.y += 0.0001;
        this.starField.rotation.x += 0.00005;
        
        this.renderer.render(this.scene, this.camera);
    }
    
    animateStars() {
        if (this.starFieldPoints && this.stars.length > 0) {
            const time = Date.now() * 0.001;
            const sizes = this.starFieldPoints.geometry.attributes.size.array;
            
            for (let i = 0; i < this.stars.length; i++) {
                const star = this.stars[i];
                const twinkle = Math.sin(time * star.twinkleSpeed + star.phase) * 0.5 + 0.5;
                sizes[i] = (star.baseIntensity + twinkle * 0.5) * 3;
            }
            
            this.starFieldPoints.geometry.attributes.size.needsUpdate = true;
        }
    }
    
    populateLegend() {
        const legendContent = document.getElementById('legend-content');
        let html = '';
        
        Object.keys(this.themes).forEach(theme => {
            const color = this.themes[theme].color;
            html += `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${color}"></div>
                    <span>${theme}</span>
                </div>
            `;
        });
        
        legendContent.innerHTML = html;
    }
    
    checkFullscreenSupport() {
        const docElm = document.documentElement;
        const fullscreenButton = document.querySelector('.fullscreen-toggle');
        
        // Check basic API support
        const hasAPI = docElm.requestFullscreen || 
                      docElm.webkitRequestFullscreen || 
                      docElm.mozRequestFullScreen || 
                      docElm.msRequestFullscreen;
        
        if (!hasAPI) {
            fullscreenButton.style.display = 'none';
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.globe = new WordGlobe();
    
    // Setup event listeners for UI elements
    setupEventListeners();
});

function setupEventListeners() {
    // Search bar functionality
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        searchBar.addEventListener('input', (e) => searchWords(e.target.value));
        searchBar.addEventListener('focus', showSearchResults);
    }
    
    // Search clear button
    const clearBtn = document.getElementById('search-clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearSearch);
    }
    
    // Fullscreen toggle
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }
    
    // Legend toggle
    const legendBtn = document.getElementById('legend-btn');
    if (legendBtn) {
        legendBtn.addEventListener('click', toggleLegend);
    }
    
    // Dashboard close button
    const closeDashboardBtn = document.getElementById('close-dashboard-btn');
    if (closeDashboardBtn) {
        closeDashboardBtn.addEventListener('click', closeDashboard);
    }
    
    // Event delegation for dynamic content
    setupDynamicEventListeners();
}

function setupDynamicEventListeners() {
    // Search results clicks
    document.addEventListener('click', (e) => {
        if (e.target.closest('.search-result-item')) {
            const item = e.target.closest('.search-result-item');
            const word = item.dataset.word;
            if (word) {
                selectSearchResult(word);
            }
        }
    });
    
    // Rating star clicks
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('rating-star')) {
            const rating = parseInt(e.target.dataset.rating);
            const word = e.target.dataset.word;
            const isInline = e.target.dataset.inline === 'true';
            if (rating && word) {
                setRating(word, rating, isInline);
            }
        }
    });
    
    // Feedback submit button clicks
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('feedback-submit') && e.target.dataset.word) {
            const word = e.target.dataset.word;
            const isInline = e.target.dataset.inline === 'true';
            submitFeedback(word, isInline);
        }
    });
    
    // Feedback management button clicks
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('feedback-btn')) {
            const word = e.target.dataset.word;
            const action = e.target.dataset.action;
            
            if (action === 'add-new' && word) {
                showAddFeedbackForm(word);
            } else if (action === 'delete' && word) {
                const feedbackIndex = parseInt(e.target.dataset.feedbackIndex);
                if (!isNaN(feedbackIndex)) {
                    deleteFeedback(word, feedbackIndex);
                }
            }
        }
    });
}