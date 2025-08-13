// ====== STATE MANAGEMENT ======
let db = {};
let currentCourse = '';
let mode = "cbt";
let questions = [];
let currentIndex = 0;
let answers = {};
let quizTimer = null;
let timeRemaining = 0;
let maxQuestions = 10; // Default value, will be updated by slider
let totalTime = 0;
let touchStartX = 0;
let touchEndX = 0;

// ====== DOM ELEMENTS ======
const themeToggle = document.getElementById('themeToggle');
const questionCountSlider = document.getElementById('questionCountSlider');
const questionCountDisplay = document.getElementById('questionCountDisplay');
const courseNameInput = document.getElementById('courseName');
const mcqTextArea = document.getElementById('mcqText');
const fileImport = document.getElementById('fileImport');
const fileImportOption = document.getElementById('fileImportOption');
const quizTitle = document.getElementById('quizTitle');
const timerDisplay = document.getElementById('timerDisplay');
const questionArea = document.getElementById('questionArea');
const optionsArea = document.getElementById('optionsArea');
const navPanel = document.getElementById('navPanel');
const progressBar = document.getElementById('progressBar');
const aiHelper = document.getElementById('aiHelper');
const aiResponse = document.getElementById('aiResponse');
const mainFab = document.getElementById('mainFab');
const fabContainer = document.getElementById('fabContainer');
const quizTabContent = document.getElementById('quizTabContent');
const resetAllBtn = document.getElementById('resetAllBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');

// ====== INITIALIZATION ======
document.addEventListener('DOMContentLoaded', function() {
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Check saved theme preference
    if (localStorage.getItem('theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        const icon = themeToggle.querySelector('i');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }

    // Question count slider
    questionCountSlider.addEventListener('input', function() {
        maxQuestions = parseInt(this.value);
        questionCountDisplay.textContent = maxQuestions;
    });
    maxQuestions = parseInt(questionCountSlider.value);
    questionCountDisplay.textContent = maxQuestions;
    
    // File import
    fileImportOption.addEventListener('click', () => fileImport.click());
    fileImport.addEventListener('change', handleFileImport);
    
    // Reset button
    resetAllBtn.addEventListener('click', resetAllCourses);
    
    // Load initial data
    loadData();
});

// ====== THEME TOGGLE ======
function toggleTheme() {
    document.body.setAttribute('data-theme', 
        document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    
    const icon = themeToggle.querySelector('i');
    if (document.body.getAttribute('data-theme') === 'dark') {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
    
    localStorage.setItem('theme', document.body.getAttribute('data-theme'));
}

// ====== TAB NAVIGATION ======
function showTab(tabName) {
    if (tabName === 'quiz' && (!currentCourse || questions.length === 0)) {
        alert("Please select a course and start a quiz first");
        showTab('dashboard');
        return;
    }
    
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    
    document.getElementById('dashboardTab').style.display = 'none';
    document.getElementById('importTab').style.display = 'none';
    document.getElementById('quizTabContent').style.display = 'none';
    
    if (tabName === 'dashboard') {
        document.querySelector('.tab[onclick="showTab(\'dashboard\')"]').classList.add('active');
        document.getElementById('dashboardTab').style.display = 'block';
        closeFab();
    } else if (tabName === 'import') {
        document.querySelector('.tab[onclick="showTab(\'import\')"]').classList.add('active');
        document.getElementById('importTab').style.display = 'block';
        closeFab();
    } else if (tabName === 'quiz') {
        if (questions.length > 0) {
            document.querySelector('.tab[onclick="showTab(\'quiz\')"]').classList.add('active');
            document.getElementById('quizTabContent').style.display = 'block';
        }
    }
}

// ====== SWIPE DETECTION FOR TABS ======
document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, {passive: true});

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, {passive: true});

function handleSwipe() {
    const threshold = 50;
    const activeTab = document.querySelector('.tab.active');
    const quizTab = document.getElementById('quizTab');
    
    if (touchEndX < touchStartX - threshold) {
        if (activeTab.nextElementSibling && 
            !(activeTab.textContent.includes("Import") && quizTab.style.display === "none")) {
            activeTab.nextElementSibling.click();
        }
    } else if (touchEndX > touchStartX + threshold) {
        if (activeTab.previousElementSibling) {
            activeTab.previousElementSibling.click();
        }
    }
}

// ====== QUESTION IMPORT ======
function showTextImport() {
    document.getElementById('textImportArea').style.display = 'block';
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        mcqTextArea.value = e.target.result;
        showTextImport();
    };
    reader.readAsText(file);
}

function importQuestions() {
    const course = courseNameInput.value.trim();
    const text = mcqTextArea.value.trim();
    
    if (!course || !text) {
        alert("Please enter a course name and questions.");
        return;
    }
    
    const parsed = parseMCQs(text);
    if (parsed.length === 0) {
        alert("No valid questions found. Please check your format.");
        return;
    }
    
    if (!db[course]) db[course] = [];
    db[course] = db[course].concat(parsed);
    saveData();
    
    alert(`Imported ${parsed.length} questions to "${course}"`);
    courseNameInput.value = "";
    mcqTextArea.value = "";
    document.getElementById('textImportArea').style.display = 'none';
    updateCourseButtons();
}

function parseMCQs(text) {
    const blocks = text.split(/\n\s*\n/);
    const result = [];
    
    for (const block of blocks) {
        if (!block.trim()) continue;
        
        const lines = block.trim().split("\n").filter(line => line.trim());
        if (lines.length < 2) continue;
        
        const q = lines[0].replace(/^Q\d+\.\s*/i, '').trim();
        if (!q) continue;
        
        const opts = [];
        let correct = null;
        
        for (let i = 1; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) continue;
            
            if (line.startsWith("*")) {
                correct = opts.length;
                line = line.substring(1).trim();
            }
            
            line = line.replace(/^[A-Z]\.\s*/i, '').trim();
            if (line) opts.push(line);
        }
        
        if (q && opts.length >= 2 && correct !== null && correct < opts.length) {
            result.push({ q, opts, correct });
        }
    }
    
    return result;
}

// ====== DATA MANAGEMENT ======
function saveData() {
    localStorage.setItem("cbtData", JSON.stringify(db));
}

function loadData() {
    const data = localStorage.getItem("cbtData");
    db = data ? JSON.parse(data) : {};
    updateCourseButtons();
}

function resetAllCourses() {
    if (confirm("💣 NUKE WARNING!\nThis will delete ALL courses permanently!\n\nAre you absolutely sure?")) {
        db = {};
        localStorage.removeItem("cbtData");
        updateCourseButtons();
        
        // Visual feedback
        resetAllBtn.innerHTML = '<i class="fas fa-explosion"></i> BOOM!';
        resetAllBtn.style.backgroundColor = '#ff0000';
        
        setTimeout(() => {
            resetAllBtn.innerHTML = '<i class="fas fa-check"></i> Reset Complete';
            resetAllBtn.style.backgroundColor = 'var(--success)';
        }, 1000);
        
        setTimeout(() => {
            resetAllBtn.innerHTML = '<i class="fas fa-bomb"></i> Nuke All Courses';
            resetAllBtn.style.backgroundColor = 'var(--danger)';
        }, 3000);
    }
}

// ====== COURSE MANAGEMENT ======
function updateCourseButtons() {
    const container = document.getElementById('courseButtonsContainer');
    container.innerHTML = '';
    
    const courses = Object.keys(db);
    if (courses.length === 0) {
        container.innerHTML = '<p>No courses yet. Import some questions to get started.</p>';
        return;
    }
    
    courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <h3>${course}</h3>
            <div class="course-meta">
                <span>${db[course].length} questions</span>
            </div>
            <div class="course-actions">
                <button class="btn btn-primary btn-sm" onclick="startQuiz('${course}')">
                    <i class="fas fa-play"></i> Start
                </button>
                <button class="btn btn-outline btn-sm" onclick="exportCourse('${course}')">
                    <i class="fas fa-download"></i> Export
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function clearCurrentCourse() {
    if (!currentCourse) return;
    
    if (confirm(`Are you sure you want to delete the "${currentCourse}" course?`)) {
        delete db[currentCourse];
        saveData();
        updateCourseButtons();
        showTab('dashboard');
    }
}

// ====== QUIZ FLOW ======
function setMode(selectedMode) {
    mode = selectedMode;
    document.querySelectorAll('.mode-card').forEach(card => {
        card.classList.remove('active');
        if (card.dataset.mode === selectedMode) {
            card.classList.add('active');
        }
    });
    
    updateQuizUIForMode();
}

function updateQuizUIForMode() {
    if (mode === 'cbt') {
        quizTabContent.classList.add('exam-mode');
        if (aiHelper) aiHelper.style.display = 'none';
    } else {
        quizTabContent.classList.remove('exam-mode');
        if (aiHelper) aiHelper.style.display = 'block';
    }
}

function startQuiz(course) {
    currentCourse = course;
    const allQuestions = db[course] || [];
    
    if (allQuestions.length === 0) {
        alert("No questions available for this course.");
        return;
    }
    
    // Get current slider value
    maxQuestions = parseInt(questionCountSlider.value);
    
    // Shuffle and select questions
    questions = shuffle(allQuestions).slice(0, Math.min(maxQuestions, allQuestions.length));
    currentIndex = 0;
    answers = {};
    
    quizTitle.textContent = course;
    document.getElementById('quizTab').style.display = 'block';
    showTab('quiz');
    
    // Set up timer for exam mode
    if (mode === 'cbt') {
        totalTime = questions.length * 60;
        timeRemaining = totalTime;
        startTimer();
    } else if (aiHelper) {
        aiHelper.style.display = 'block';
    }
    
    renderQuestion();
    updateQuizUIForMode();
}

function renderQuestion() {
    if (questions.length === 0) return;
    
    const qObj = questions[currentIndex];
    questionArea.innerHTML = `${currentIndex + 1}. ${qObj.q}`;
    
    let optsHTML = '';
    qObj.opts.forEach((opt, idx) => {
        let cls = 'option';
        if (answers[currentIndex] === idx) cls += ' selected';
        optsHTML += `<div class="${cls}" onclick="selectOption(${idx})">${opt}</div>`;
    });
    
    optionsArea.innerHTML = optsHTML;
    renderNav();
    updateProgress();
}

function selectOption(idx) {
    answers[currentIndex] = idx;
    
    if (mode === 'practice') {
        const qObj = questions[currentIndex];
        const correctIdx = qObj.correct;
        const isCorrect = idx === correctIdx;
        
        document.querySelectorAll('.option').forEach((opt, i) => {
            opt.classList.remove('selected', 'correct', 'incorrect');
            
            if (i === correctIdx) {
                opt.classList.add('correct');
            } else if (i === idx && !isCorrect) {
                opt.classList.add('incorrect');
            } else if (i === idx) {
                opt.classList.add('selected');
            }
        });
        
        if (aiResponse) {
            showExplanation(qObj, idx);
        }
    } else {
        renderQuestion();
    }
}

function showExplanation(qObj, selectedIdx) {
    const correctIdx = qObj.correct;
    const isCorrect = selectedIdx === correctIdx;
    
    let explanation = `<p><strong>${isCorrect ? 'Correct!' : 'Incorrect.'}</strong> `;
    
    if (isCorrect) {
        explanation += `You selected the right answer.</p>`;
    } else {
        explanation += `The correct answer is: ${qObj.opts[correctIdx]}</p>`;
    }
    
    if (qObj.q.toLowerCase().includes('capital')) {
        explanation += `<p>This question is about geographical capitals.</p>`;
    } else if (qObj.q.toLowerCase().includes('math') || qObj.q.match(/\d+/)) {
        explanation += `<p>This is a mathematical question.</p>`;
    } else {
        explanation += `<p>Review this concept in your study materials.</p>`;
    }
    
    if (aiResponse) {
        aiResponse.innerHTML = explanation;
    }
}

function prevQuestion() {
    if (currentIndex > 0) {
        currentIndex--;
        renderQuestion();
    }
}

function nextQuestion() {
    if (currentIndex < questions.length - 1) {
        currentIndex++;
        renderQuestion();
    }
}

function renderNav() {
    navPanel.innerHTML = '';
    
    for (let i = 0; i < questions.length; i++) {
        const btn = document.createElement('div');
        btn.className = 'nav-btn';
        if (i === currentIndex) btn.classList.add('current');
        if (answers[i] !== undefined) btn.classList.add('answered');
        btn.textContent = i + 1;
        btn.onclick = () => {
            currentIndex = i;
            renderQuestion();
        };
        navPanel.appendChild(btn);
    }
}

function updateProgress() {
    const progress = ((currentIndex + 1) / questions.length) * 100;
    progressBar.style.width = `${progress}%`;
}

// ====== TIMER ======
function startTimer() {
    updateTimerDisplay();
    quizTimer = setInterval(() => {
        timeRemaining--;
        
        if (timeRemaining <= 0) {
            stopTimer();
            alert("Time's up! Submitting your quiz.");
            submitQuiz();
        } else {
            updateTimerDisplay();
        }
    }, 1000);
}

function stopTimer() {
    if (quizTimer) {
        clearInterval(quizTimer);
        quizTimer = null;
    }
}

function updateTimerDisplay() {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    // Change color when time is running low
    timerDisplay.className = 'timer-text';
    if (timeRemaining <= totalTime * 0.3) {
        timerDisplay.classList.add('warning');
    }
    if (timeRemaining <= totalTime * 0.1) {
        timerDisplay.classList.add('danger');
    }
}

// ====== QUIZ SUBMISSION ======
function submitQuiz() {
    if (Object.keys(answers).length < questions.length) {
        if (!confirm(`You have ${questions.length - Object.keys(answers).length} unanswered questions. Submit anyway?`)) {
            return;
        }
    }
    
    stopTimer();
    showResults();
}

function showResults() {
    let score = 0;
    const total = questions.length;
    
    // Calculate score
    questions.forEach((q, i) => {
        if (answers[i] === q.correct) score++;
    });
    
    questionArea.innerHTML = `<h3>Quiz Results: ${currentCourse}</h3>`;
    
    let resultsHTML = `<div class="score-summary">
        <h4>Your Score: ${score}/${total} (${Math.round((score/total)*100)}%)</h4>
        <div class="progress-container" style="height: 20px; margin: 1rem 0;">
            <div class="progress-bar" style="width: ${(score/total)*100}%;"></div>
        </div>
    </div>`;
    
    questions.forEach((q, i) => {
        const userAnswer = answers[i];
        const isCorrect = userAnswer === q.correct;
        
        resultsHTML += `<div class="question-result ${isCorrect ? 'correct' : 'incorrect'}">
            <h5>Q${i+1}: ${q.q}</h5>
            <div class="options-review">`;
        
        q.opts.forEach((opt, idx) => {
            let cls = '';
            if (idx === q.correct) cls = 'correct';
            else if (idx === userAnswer && !isCorrect) cls = 'incorrect';
            
            resultsHTML += `<div class="option ${cls}">${opt}</div>`;
        });
        
        resultsHTML += `</div></div>`;
    });
    
    optionsArea.innerHTML = resultsHTML;
    navPanel.innerHTML = '';
    
    // Show restart button
    document.querySelector('.quiz-nav').innerHTML = `
        <button class="btn btn-primary" onclick="startQuiz('${currentCourse}')">
            <i class="fas fa-redo"></i> Try Again
        </button>
        <button class="btn btn-outline" onclick="showTab('dashboard')">
            <i class="fas fa-home"></i> Back to Dashboard
        </button>`;
}

// ====== EXPORT & SHARE ======
function exportCourse(courseName) {
    if (!db[courseName]) return;
    
    let exportText = `${courseName} Questions:\n\n`;
    db[courseName].forEach((q, i) => {
        exportText += `Q${i+1}. ${q.q}\n`;
        q.opts.forEach((opt, j) => {
            exportText += `${j === q.correct ? '*' : ''}${String.fromCharCode(65 + j)}. ${opt}\n`;
        });
        exportText += "\n";
    });
    
    // Create download link
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${courseName.replace(/\s+/g, '_')}_questions.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ====== FLOATING ACTION BUTTON ======
function toggleFab() {
    if (fabContainer && mainFab) {
        fabContainer.classList.toggle('open');
        mainFab.classList.toggle('open');
    }
}

function closeFab() {
    if (fabContainer && mainFab) {
        fabContainer.classList.remove('open');
        mainFab.classList.remove('open');
    }
}

// ====== FULLSCREEN ======
function toggleFullscreen() {
    const quizTab = document.getElementById('quizTabContent');
    
    if (!document.fullscreenElement) {
        quizTab.requestFullscreen()
            .then(() => {
                document.querySelector('header').style.display = 'none';
                document.querySelector('.tabs').style.display = 'none';
                
                setTimeout(() => {
                    const nav = document.querySelector('.quiz-nav');
                    nav.style.display = 'none';
                    nav.offsetHeight;
                    nav.style.display = 'flex';
                }, 100);
            })
            .catch(err => {
                console.log("Fullscreen error:", err);
            });
    } else {
        document.exitFullscreen();
    }
}

// Handle fullscreen changes
document.addEventListener('fullscreenchange', () => {
    if (fullscreenBtn) {
        if (document.fullscreenElement) {
            fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i> Exit';
        } else {
            fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i> Fullscreen';
            document.querySelector('header').style.display = 'flex';
            document.querySelector('.tabs').style.display = 'flex';
        }
    }
});

// ====== UTILITIES ======
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}