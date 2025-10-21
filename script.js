const SUPABASE_URL = 'https://uqgzlaxsnknheoerbfus.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZ3psYXhzbmtuaGVvZXJiZnVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MDQzMTEsImV4cCI6MjA2MDM4MDMxMX0.O5dNUizqZ5kfwTs0mHLEorqOAqjZFjWakp2Q484MKEk';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

document.addEventListener('contextmenu', e => e.preventDefault());

async function loadLearnXTerms() {
    try {
        const { data, error } = await supabase
            .from('learnX pedia')
            .select('id, word, meaning, slug');
        
        if (error) throw error;
        
        if (data) {
            data.forEach(item => {
                learnXTerms[item.word] = {
                    meaning: item.meaning,
                    slug: item.slug,
                    id: item.id
                };
            });
        }
    } catch (error) {
        console.error('Error loading LearnX terms:', error);
    }
}

async function loadLessonTitles() {
    try {
        const { data, error } = await supabase
            .from('Historynt')
            .select('slug, title');
        
        if (error) throw error;
        
        if (data) {
            data.forEach(item => {
                lessonTitles[item.slug] = item.title;
            });
            populateLessons('slhis');
        }
    } catch (error) {
        console.error('Error loading lesson titles:', error);
    }
}

function switchCategory(category) {
    currentCategory = category;
    document.querySelectorAll('.category-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`.category-tab.${category}`).classList.add('active');
    populateLessons(category);
    lessonList.classList.remove('hidden');
}

function populateLessons(category) {
    const range = categoryRanges[category];
    lessonList.innerHTML = '';
    
    for (let i = range.start; i <= range.end; i++) {
        const slug = getSlugFromNumber(category, i);
        const title = lessonTitles[slug] || `පාඩම ${i}`;
        const btn = document.createElement('button');
        btn.className = 'lesson-btn';
        btn.textContent = `${i}. ${title}`;
        btn.onclick = () => {
            loadArticle(slug);
            lessonList.classList.add('hidden');
            noteArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        lessonList.appendChild(btn);
    }
}

function getSlugFromNumber(category, number) {
    return `${category}${String(number).padStart(3, '0')}`;
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
        noteArea.innerHTML = '<div class="loading">පාඩම පූරණය වෙමින් පවතී...</div>';
        
        const { data, error } = await supabase
            .from('Historynt')
            .select('*')
            .eq('slug', slug)
            .single();
        
        if (error) throw error;
        
        if (data) {
            currentArticleId = data.id;
            currentCategory = getCategoryFromSlug(slug);
            currentLessonNumber = getNumberFromSlug(slug);
            pageTitle.textContent = data.title;
            originalHTML = data.content;
            noteArea.innerHTML = data.content;
            
            requestAnimationFrame(() => {
                applyCrossReferences();
                updateNavigationButtons();
                updateCategoryButtons();
                updateLessonHighlight();
                updateURL(slug);
            });
        } else {
            noteArea.innerHTML = '<div class="error">පාඩම හමු නොවිණි.</div>';
        }
    } catch (error) {
        console.error('Error loading article:', error);
        noteArea.innerHTML = '<div class="error">දෝෂයක්: ' + error.message + '</div>';
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
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    if (currentCategory) {
        document.querySelector(`.category-tab.${currentCategory}`).classList.add('active');
    }
    
    updateLessonHighlight();
}

function updateLessonHighlight() {
    document.querySelectorAll('.lesson-btn').forEach(btn => btn.classList.remove('active'));
    
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
    
    tempDiv.querySelectorAll('.cross-ref-term').forEach(term => {
        term.outerHTML = term.textContent;
    });
    
    content = tempDiv.innerHTML;
    
    const sortedTerms = Object.keys(learnXTerms).sort((a, b) => b.length - a.length);
    let processedCount = 0;
    
    function processTermBatch() {
        if (processedCount >= sortedTerms.length) return;
        
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
                    // වැඩිදියුණු කළ regex - Sinhala විරාම ලකුණු සහ word boundaries සඳහා
                    const regex = new RegExp('(?:^|[\\s.,;:!?()\\-්෴។\\u200B\\u200D])(' + escapedTerm + ')(?=[\\s.,;:!?()\\-්෴။\\u200B\\u200D]|$)', 'gi');
                    
                    if (regex.test(text)) {
                        const span = document.createElement('span');
                        span.innerHTML = text.replace(regex, function(match, capturedTerm, offset, string) {
                            // පෙර character එක සොයන්න
                            const prefix = offset > 0 ? string[offset - 1] : '';
                            const isAtStart = offset === 0;
                            const hasSeparator = /[\s.,;:!?()\\-්෴။\u200B\u200D]/.test(prefix);
                            
                            if (isAtStart || hasSeparator) {
                                return (isAtStart ? '' : prefix) + '<span class="cross-ref-term" data-meaning="' + 
                                       termData.meaning.replace(/"/g, '&quot;') + 
                                       '" data-slug="' + termData.slug.replace(/"/g, '&quot;') + 
                                       '">' + capturedTerm + '</span>';
                            }
                            return match;
                        });
                        node.parentNode.replaceChild(span, node);
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE && 
                          node.className !== 'cross-ref-term' && 
                          node.tagName !== 'SCRIPT' && 
                          node.tagName !== 'STYLE') {
                    Array.from(node.childNodes).forEach(child => replaceInNodes(child));
                }
            }
            
            Array.from(tempContainer.childNodes).forEach(child => replaceInNodes(child));
            content = tempContainer.innerHTML;
        }
        
        if (processedCount < sortedTerms.length) {
            requestAnimationFrame(processTermBatch);
        } else {
            noteArea.innerHTML = content;
            attachCrossRefListeners();
        }
    }
    
    processTermBatch();
}

function attachCrossRefListeners() {
    document.querySelectorAll('.cross-ref-term').forEach(term => {
        term.addEventListener('click', function(e) {
            e.stopPropagation();
            const meaning = this.getAttribute('data-meaning');
            const slug = this.getAttribute('data-slug');
            showTooltip(meaning, slug);
        });
    });
}

function showTooltip(text, slug) {
    const cleanText = text.replace(/<br\s*\/?>/gi, '|||BREAK|||');
    const meanings = cleanText.split('|||BREAK|||').filter(m => m.trim());
    
    if (meanings.length > 1) {
        tooltip.innerHTML = meanings.map(m => '<div class="tooltip-meaning">' + m.trim() + '</div>').join('');
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
    
    searchTimeout = setTimeout(() => {
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
                    Array.from(node.childNodes).forEach(child => highlightTextNodes(child));
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

prevSearchBtn.addEventListener('click', () => navigateHighlights('prev'));
nextSearchBtn.addEventListener('click', () => navigateHighlights('next'));

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
