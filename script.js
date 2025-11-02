// Supabase Configuration
const SUPABASE_URL = 'https://uqgzlaxsnknheoerbfus.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZ3psYXhzbmtuaGVvZXJiZnVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MDQzMTEsImV4cCI6MjA2MDM4MDMxMX0.O5dNUizqZ5kfwTs0mHLEorqOAqjZFjWakp2Q484MKEk';

// Initialize Supabase client
let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (error) {
    console.error('Supabase initialization error:', error);
}

const categoryRanges = {
    'slhis': { start: 1, end: 51, name: 'ශ්‍රී ලංකාව' },
    'erphis': { start: 1, end: 20, name: 'යුරෝපය' },
    'indhis': { start: 1, end: 12, name: 'ඉන්දියාව' }
};

let currentCategory = 'slhis';
let currentLessonNumber = null;
let currentArticleId = null;
let fontSize = 16;
let originalHTML = '';
let learnXTerms = {};
let highlights = [];
let currentHighlightIndex = 0;
let lessonTitles = {};

const searchBox = document.getElementById('searchBox');
const noteArea = document.getElementById('noteArea');
const searchInfo = document.getElementById('searchInfo');
const searchNavButtons = document.getElementById('searchNavButtons');
const prevSearchBtn = document.getElementById('prevSearchBtn');
const nextSearchBtn = document.getElementById('nextSearchBtn');
const tooltip = document.getElementById('tooltip');
const tooltipOverlay = document.getElementById('tooltipOverlay');
const pageTitle = document.getElementById('pageTitle');
const prevLessonBtn = document.getElementById('prevLessonBtn');
const nextLessonBtn = document.getElementById('nextLessonBtn');
const increaseBtn = document.getElementById('increaseBtn');
const decreaseBtn = document.getElementById('decreaseBtn');
const lessonList = document.getElementById('lessonList');
const navBtn = document.getElementById('navBtn');
const navSidebar = document.getElementById('navSidebar');
const navOverlay = document.getElementById('navOverlay');
const navCloseBtn = document.getElementById('navCloseBtn');
const navContent = document.getElementById('navContent');
const pageIndicator = document.getElementById('pageIndicator');

document.addEventListener('contextmenu', e => e.preventDefault());

// Navigation Functions
function toggleNavigation() {
    navSidebar.classList.toggle('open');
    navOverlay.classList.toggle('active');
}

function closeNavigation() {
    navSidebar.classList.remove('open');
    navOverlay.classList.remove('active');
}

function addHeaderIds() {
    const headers = noteArea.querySelectorAll('h1, h2, h3');
    headers.forEach((header, index) => {
        header.id = 'section-' + index;
        header.classList.add('section-anchor');
    });
    console.log('Header IDs added:', headers.length);
    generateNavigation();
}

function generateNavigation() {
    const headers = noteArea.querySelectorAll('h1, h2, h3');
    
    if (headers.length === 0) {
        navContent.innerHTML = '<div class="nav-empty-state"><p>මාතෘකා හමු නොවීය</p></div>';
        return;
    }
    
    navContent.innerHTML = '';
    
    headers.forEach((header, index) => {
        const navItem = document.createElement('div');
        navItem.className = 'nav-item ' + header.tagName.toLowerCase();
        navItem.textContent = header.textContent;
        
        const sectionId = header.id || 'section-' + index;
        
        navItem.onclick = function() {
            const targetHeader = document.getElementById(sectionId);
            if (targetHeader) {
                targetHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
                console.log('Scrolling to:', sectionId, targetHeader.textContent);
            } else {
                console.warn('Header not found:', sectionId);
            }
            closeNavigation();
            
            navItem.style.background = '#667eea';
            navItem.style.color = 'white';
            setTimeout(function() {
                navItem.style.background = '';
                navItem.style.color = '';
            }, 300);
        };
        
        navContent.appendChild(navItem);
    });
    
    console.log('Navigation generated with', headers.length, 'items');
}

function updatePageIndicator() {
    if (!currentCategory || !currentLessonNumber) {
        pageIndicator.style.display = 'none';
        return;
    }
    
    const range = categoryRanges[currentCategory];
    const categoryName = range.name;
    pageIndicator.textContent = categoryName + ' - පාඩම ' + currentLessonNumber + ' / ' + range.end;
    pageIndicator.style.display = 'block';
}

navBtn.addEventListener('click', toggleNavigation);
navCloseBtn.addEventListener('click', closeNavigation);
navOverlay.addEventListener('click', closeNavigation);

document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleNavigation();
    }
    
    if (e.key === 'Escape' && navSidebar.classList.contains('open')) {
        closeNavigation();
    }
});

async function loadLearnXTerms() {
    try {
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        let allData = [];
        let from = 0;
        const batchSize = 1000;
        let hasMore = true;
        
        while (hasMore) {
            const { data, error } = await supabase
                .from('learnX pedia')
                .select('id, word, meaning, slug')
                .order('id', { ascending: true })
                .range(from, from + batchSize - 1);
            
            if (error) {
                console.error('LearnX terms load error:', error);
                throw error;
            }
            
            if (data && data.length > 0) {
                allData = allData.concat(data);
                from += batchSize;
                hasMore = data.length === batchSize;
            } else {
                hasMore = false;
            }
        }
        
        console.log('LearnX terms loaded:', allData.length);
        
        if (allData.length > 0) {
            allData.forEach(function(item) {
                const normalizedWord = item.word.trim();
                learnXTerms[normalizedWord] = {
                    meaning: item.meaning,
                    slug: item.slug,
                    id: item.id,
                    originalWord: item.word
                };
            });
            
            console.log('Total unique terms:', Object.keys(learnXTerms).length);
        }
    } catch (error) {
        console.error('Error loading LearnX terms:', error);
        noteArea.innerHTML = '<div class="error">Database සම්බන්ධතා ගැටළුවක්: ' + error.message + '</div>';
    }
}

async function loadLessonTitles() {
    try {
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        const { data, error } = await supabase
            .from('Historynt')
            .select('slug, title');
        
        if (error) {
            console.error('Lesson titles load error:', error);
            throw error;
        }
        
        if (data) {
            console.log('Lesson titles loaded:', data.length);
            data.forEach(function(item) {
                lessonTitles[item.slug] = item.title;
            });
            populateLessons('slhis');
        }
    } catch (error) {
        console.error('Error loading lesson titles:', error);
        noteArea.innerHTML = '<div class="error">Database සම්බන්ධතා ගැටළුවක්: ' + error.message + '</div>';
    }
}

function switchCategory(category) {
    currentCategory = category;
    document.querySelectorAll('.category-tab').forEach(function(tab) {
        tab.classList.remove('active');
    });
    document.querySelector('.category-tab.' + category).classList.add('active');
    populateLessons(category);
    lessonList.classList.remove('hidden');
}

function populateLessons(category) {
    const range = categoryRanges[category];
    lessonList.innerHTML = '';
    
    for (let i = range.start; i <= range.end; i++) {
        const slug = getSlugFromNumber(category, i);
        const title = lessonTitles[slug] || 'පාඩම ' + i;
        const btn = document.createElement('button');
        btn.className = 'lesson-btn';
        btn.textContent = i + '. ' + title;
        btn.onclick = function() {
            loadArticle(slug);
            lessonList.classList.add('hidden');
            noteArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        lessonList.appendChild(btn);
    }
}

function getSlugFromNumber(category, number) {
    return category + String(number).padStart(3, '0');
}

function getNumberFromSlug(slug) {
    const match = slug.match(/\d+$/);
    return match ? parseInt(match[0]) : null;
}

function getCategoryFromSlug(slug) {
    const match = slug.match(/^[a-z]+/);
    return match ? match[0] : null;
}

async function loadArticle(slug) {
    try {
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        noteArea.innerHTML = '<div class="loading">පාඩම පූරණය වෙමින් පවතී...</div>';
        
        const { data, error } = await supabase
            .from('Historynt')
            .select('*')
            .eq('slug', slug)
            .single();
        
        if (error) {
            console.error('Article load error:', error);
            throw error;
        }
        
        if (data) {
            currentArticleId = data.id;
            currentCategory = getCategoryFromSlug(slug);
            currentLessonNumber = getNumberFromSlug(slug);
            pageTitle.textContent = data.title;
            originalHTML = data.content;
            noteArea.innerHTML = data.content;
            
            addHeaderIds();
            
            requestAnimationFrame(function() {
                applyCrossReferences();
                updateNavigationButtons();
                updateCategoryButtons();
                updateLessonHighlight();
                updateURL(slug);
                updatePageIndicator();
            });
        } else {
            noteArea.innerHTML = '<div class="error">පාඩම හමු නොවිණි.</div>';
        }
    } catch (error) {
        console.error('Error loading article:', error);
        noteArea.innerHTML = '<div class="error">දෝෂයක්: ' + error.message + '<br><br>කරුණාකර Supabase credentials පරීක්ෂා කරන්න.</div>';
    }
}

function updateURL(slug) {
    const url = new URL(window.location);
    url.searchParams.set('slug', slug);
    window.history.pushState({}, '', url);
}

function updateNavigationButtons() {
    if (!currentCategory || !currentLessonNumber) return;
    
    const range = categoryRanges[currentCategory];
    prevLessonBtn.disabled = currentLessonNumber <= range.start;
    nextLessonBtn.disabled = currentLessonNumber >= range.end;
}

function updateCategoryButtons() {
    document.querySelectorAll('.category-tab').forEach(function(tab) {
        tab.classList.remove('active');
    });
    
    if (currentCategory) {
        document.querySelector('.category-tab.' + currentCategory).classList.add('active');
    }
    
    updateLessonHighlight();
}

function updateLessonHighlight() {
    document.querySelectorAll('.lesson-btn').forEach(function(btn) {
        btn.classList.remove('active');
    });
    
    if (currentLessonNumber) {
        const buttons = Array.from(lessonList.querySelectorAll('.lesson-btn'));
        const currentBtn = buttons[currentLessonNumber - 1];
        if (currentBtn) currentBtn.classList.add('active');
    }
}

prevLessonBtn.addEventListener('click', function() {
    if (currentCategory && currentLessonNumber > categoryRanges[currentCategory].start) {
        const slug = getSlugFromNumber(currentCategory, currentLessonNumber - 1);
        loadArticle(slug);
    }
});

nextLessonBtn.addEventListener('click', function() {
    if (currentCategory && currentLessonNumber < categoryRanges[currentCategory].end) {
        const slug = getSlugFromNumber(currentCategory, currentLessonNumber + 1);
        loadArticle(slug);
    }
});

function applyCrossReferences() {
    let content = noteArea.innerHTML;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    const headerInfo = [];
    tempDiv.querySelectorAll('h1, h2, h3').forEach(function(header, index) {
        headerInfo.push({
            tagName: header.tagName,
            id: header.id,
            className: header.className || '',
            text: header.textContent
        });
    });
    
    tempDiv.querySelectorAll('.cross-ref-term').forEach(function(term) {
        term.outerHTML = term.textContent;
    });
    
    content = tempDiv.innerHTML;
    
    const sortedTerms = Object.keys(learnXTerms).sort(function(a, b) {
        return b.length - a.length;
    });
    let processedCount = 0;
    
    console.log('Processing cross-references for', sortedTerms.length, 'terms');
    
    function processTermBatch() {
        if (processedCount >= sortedTerms.length) {
            console.log('Cross-reference processing complete');
            restoreHeaderIds();
            return;
        }
        
        const batchSize = 5;
        for (let b = 0; b < batchSize && processedCount < sortedTerms.length; b++) {
            const term = sortedTerms[processedCount++];
            const termData = learnXTerms[term];
            const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = content;
            
            function replaceInNodes(node) {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent;
                    const regex = new RegExp('(?:^|[\\s,.:;!?()\\-"\'\\u200B\\u200D])(' + escapedTerm + ')(?=[\\s,.:;!?()\\-"\'\\u200B\\u200D]|$)', 'gi');
                    
                    const matches = text.match(regex);
                    if (matches && matches.length > 0) {
                        const fragment = document.createDocumentFragment();
                        let lastIndex = 0;
                        
                        regex.lastIndex = 0;
                        let match;
                        while ((match = regex.exec(text)) !== null) {
                            if (match.index > lastIndex) {
                                fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
                            }
                            
                            const beforeChar = match[0].charAt(0);
                            if (/[\s,.:;!?()\-"'\u200B\u200D]/.test(beforeChar)) {
                                fragment.appendChild(document.createTextNode(beforeChar));
                            }
                            
                            const span = document.createElement('span');
                            span.className = 'cross-ref-term';
                            span.setAttribute('data-meaning', termData.meaning);
                            span.setAttribute('data-slug', termData.slug);
                            span.textContent = match[1];
                            fragment.appendChild(span);
                            
                            lastIndex = match.index + match[0].length;
                        }
                        
                        if (lastIndex < text.length) {
                            fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
                        }
                        
                        node.parentNode.replaceChild(fragment, node);
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE && 
                          node.className !== 'cross-ref-term' && 
                          node.tagName !== 'SCRIPT' && 
                          node.tagName !== 'STYLE') {
                    Array.from(node.childNodes).forEach(function(child) {
                        replaceInNodes(child);
                    });
                }
            }
            
            Array.from(tempContainer.childNodes).forEach(function(child) {
                replaceInNodes(child);
            });
            content = tempContainer.innerHTML;
        }
        
        if (processedCount < sortedTerms.length) {
            requestAnimationFrame(processTermBatch);
        } else {
            noteArea.innerHTML = content;
            restoreHeaderIds();
            attachCrossRefListeners();
        }
    }
    
    function restoreHeaderIds() {
        const headers = noteArea.querySelectorAll('h1, h2, h3');
        headers.forEach(function(header, index) {
            if (headerInfo[index]) {
                if (headerInfo[index].id) {
                    header.id = headerInfo[index].id;
                }
                if (headerInfo[index].className) {
                    header.className = headerInfo[index].className;
                }
                if (!header.classList.contains('section-anchor')) {
                    header.classList.add('section-anchor');
                }
            }
        });
        console.log('Header IDs restored:', headers.length);
    }
    
    processTermBatch();
}

function attachCrossRefListeners() {
    document.querySelectorAll('.cross-ref-term').forEach(function(term) {
        term.addEventListener('click', function(e) {
            e.stopPropagation();
            const meaning = this.getAttribute('data-meaning');
            const slug = this.getAttribute('data-slug');
            showTooltip(meaning, slug);
        });
    });
    console.log('Cross-ref listeners attached to', document.querySelectorAll('.cross-ref-term').length, 'terms');
}

function showTooltip(text, slug) {
    const cleanText = text.replace(/<br\s*\/?>/gi, '|||BREAK|||');
    const meanings = cleanText.split('|||BREAK|||').filter(function(m) {
        return m.trim();
    });
    
    if (meanings.length > 1) {
        tooltip.innerHTML = meanings.map(function(m) {
            return '<div class="tooltip-meaning">' + m.trim() + '</div>';
        }).join('');
    } else {
        tooltip.innerHTML = '<div class="tooltip-meaning">' + text + '</div>';
    }
    
    tooltip.style.display = 'block';
    tooltipOverlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    tooltip.onclick = function() {
        if (slug) {
            loadArticle(slug);
            hideTooltip();
        }
    };
}

function hideTooltip() {
    tooltip.style.display = 'none';
    tooltipOverlay.style.display = 'none';
    document.body.style.overflow = '';
}

tooltipOverlay.addEventListener('click', hideTooltip);

let searchTimeout;
searchBox.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    const searchTerm = this.value.trim();
    
    if (!searchTerm) {
        noteArea.innerHTML = originalHTML;
        applyCrossReferences();
        searchInfo.textContent = '';
        searchNavButtons.style.display = 'none';
        highlights = [];
        currentHighlightIndex = 0;
        return;
    }
    
    searchTimeout = setTimeout(function() {
        const text = noteArea.textContent;
        const regex = new RegExp('(' + searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        const matches = text.match(regex);
        
        if (matches && matches.length > 0) {
            let content = originalHTML;
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            
            function highlightTextNodes(node) {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent;
                    if (regex.test(text)) {
                        const span = document.createElement('span');
                        span.innerHTML = text.replace(regex, '<span class="highlight">$1</span>');
                        node.parentNode.replaceChild(span, node);
                        while (span.firstChild) {
                            span.parentNode.insertBefore(span.firstChild, span);
                        }
                        span.remove();
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE && 
                          node.tagName !== 'SCRIPT' && 
                          node.tagName !== 'STYLE') {
                    Array.from(node.childNodes).forEach(function(child) {
                        highlightTextNodes(child);
                    });
                }
            }
            
            highlightTextNodes(tempDiv);
            noteArea.innerHTML = tempDiv.innerHTML;
            applyCrossReferences();
            
            highlights = Array.from(document.querySelectorAll('.highlight'));
            currentHighlightIndex = 0;
            
            if (highlights.length > 0) {
                highlights[0].classList.add('current-highlight');
                highlights[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            searchInfo.textContent = 'ප්‍රතිඵල ' + highlights.length + ' ක් හමු විය';
            
            if (highlights.length > 1) {
                searchNavButtons.style.display = 'flex';
                updateSearchNavButtons();
            } else {
                searchNavButtons.style.display = 'none';
            }
        } else {
            noteArea.innerHTML = originalHTML;
            applyCrossReferences();
            searchInfo.textContent = 'ප්‍රතිඵල හමු නොවිය';
            searchNavButtons.style.display = 'none';
            highlights = [];
            currentHighlightIndex = 0;
        }
    }, 300);
});

function updateSearchNavButtons() {
    prevSearchBtn.disabled = currentHighlightIndex === 0;
    nextSearchBtn.disabled = currentHighlightIndex === highlights.length - 1;
}

function navigateHighlights(direction) {
    if (highlights.length === 0) return;
    
    highlights[currentHighlightIndex].classList.remove('current-highlight');
    
    if (direction === 'next' && currentHighlightIndex < highlights.length - 1) {
        currentHighlightIndex++;
    } else if (direction === 'prev' && currentHighlightIndex > 0) {
        currentHighlightIndex--;
    }
    
    highlights[currentHighlightIndex].classList.add('current-highlight');
    highlights[currentHighlightIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    updateSearchNavButtons();
}

prevSearchBtn.addEventListener('click', function() {
    navigateHighlights('prev');
});

nextSearchBtn.addEventListener('click', function() {
    navigateHighlights('next');
});

increaseBtn.addEventListener('click', function() {
    fontSize += 2;
    noteArea.style.fontSize = fontSize + 'px';
});

decreaseBtn.addEventListener('click', function() {
    if (fontSize > 10) {
        fontSize -= 2;
        noteArea.style.fontSize = fontSize + 'px';
    }
});

window.addEventListener('DOMContentLoaded', async function() {
    console.log('Page loaded, initializing...');
    await loadLearnXTerms();
    await loadLessonTitles();
    
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    
    if (slug) {
        loadArticle(slug);
    } else {
        noteArea.innerHTML = '<div class="loading">කරුණාකර කාණ්ඩයක් තෝරන්න...</div>';
    }
});
