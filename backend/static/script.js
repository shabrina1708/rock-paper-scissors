// Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Game State
let gameState = {
    sessionId: null,
    playerScore: 0,
    aiScore: 0,
    totalGames: 0,
    difficulty: 'normal',
    isConnected: false
};

// DOM Elements
const elements = {
    playerScore: document.getElementById('player-score'),
    aiScore: document.getElementById('ai-score'),
    totalGames: document.getElementById('total-games'),
    connectionStatus: document.getElementById('connection-status'),
    gameResult: document.getElementById('game-result'),
    choiceBtns: document.querySelectorAll('.choice-btn'),
    difficultySelect: document.getElementById('difficulty'),
    resetBtn: document.getElementById('reset-btn'),
    statsBtn: document.getElementById('stats-btn'),
    lastRound: document.getElementById('last-round'),
    lastPlayerChoice: document.getElementById('last-player-choice'),
    lastAiChoice: document.getElementById('last-ai-choice'),
    statsModal: document.getElementById('stats-modal'),
    statsContent: document.getElementById('stats-content'),
    closeModal: document.querySelector('.close')
};

// Utility Functions
function updateConnectionStatus(status, message) {
    elements.connectionStatus.textContent = message;
    elements.connectionStatus.className = status;
    gameState.isConnected = status === 'connected';
}

function updateScoreBoard() {
    elements.playerScore.textContent = gameState.playerScore;
    elements.aiScore.textContent = gameState.aiScore;
    elements.totalGames.textContent = gameState.totalGames;
}

function showGameResult(result) {
    const messages = {
        'win': '🎉 Anda Menang!',
        'lose': '😢 AI Menang!',
        'draw': '🤝 Seri!'
    };
    
    elements.gameResult.textContent = messages[result] || '';
    elements.gameResult.className = result;
}
    // Hide result after 3 seconds
    setTimeout(() => {
        elements.gameResult.textContent = '';
        elements.gameResult.className = '';
    }, 3000);


function showLastRound(playerChoice, aiChoice) {
    const choiceEmojis = {
        'Batu': '🪨',
        'Kertas': '📄',
        'Gunting': '✂️'
    };
    
    elements.lastPlayerChoice.innerHTML = `${choiceEmojis[playerChoice]} ${playerChoice}`;
    elements.lastAiChoice.innerHTML = `${choiceEmojis[aiChoice]} ${aiChoice}`;
    elements.lastRound.style.display = 'block';
}

function setLoading(isLoading) {
    elements.choiceBtns.forEach(btn => {
        btn.disabled = isLoading;
        if (isLoading) {
            btn.classList.add('loading');
        } else {
            btn.classList.remove('loading');
        }
    });
}

// API Functions
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function createSession() {
    try {
        updateConnectionStatus('', 'Membuat sesi...');
        const response = await apiRequest('/session/create', {
            method: 'POST'
        });
        
        if (response.success) {
            gameState.sessionId = response.sessionId;
            updateConnectionStatus('connected', '✅ Terhubung');
            console.log('Session created:', response.sessionId);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        updateConnectionStatus('error', '❌ Gagal terhubung');
        console.error('Failed to create session:', error);
    }
}

async function playGame(playerChoice) {
    if (!gameState.sessionId || !gameState.isConnected) {
        alert('Belum terhubung ke server!');
        return;
    }
    
    try {
        setLoading(true);
        
        const response = await apiRequest('/game/play', {
            method: 'POST',
            body: JSON.stringify({
                sessionId: gameState.sessionId,
                playerChoice: playerChoice
            })
        });
        
        if (response.success) {
            const result = response.result;
            
            // Update game state
            gameState.playerScore = result.playerScore;
            gameState.aiScore = result.aiScore;
            gameState.totalGames = result.totalGames;
            
            // Update UI
            updateScoreBoard();
            showGameResult(result.result);
            showLastRound(result.playerChoice, result.aiChoice);
            
            console.log('Round played:', result);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        alert('Gagal memainkan game: ' + error.message);
        console.error('Failed to play game:', error);
    } finally {
        setLoading(false);
    }
}

async function resetGame() {
    if (!gameState.sessionId || !gameState.isConnected) {
        alert('Belum terhubung ke server!');
        return;
    }
    
    try {
        const response = await apiRequest('/game/reset', {
            method: 'POST',
            body: JSON.stringify({
                sessionId: gameState.sessionId
            })
        });
        
        if (response.success) {
            // Reset local state
            gameState.playerScore = 0;
            gameState.aiScore = 0;
            gameState.totalGames = 0;
            
            // Update UI
            updateScoreBoard();
            elements.gameResult.textContent = '';
            elements.gameResult.className = '';
            elements.lastRound.style.display = 'none';
            
            alert('Game berhasil direset!');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        alert('Gagal mereset game: ' + error.message);
        console.error('Failed to reset game:', error);
    }
}

async function setDifficulty(difficulty) {
    if (!gameState.sessionId || !gameState.isConnected) {
        return;
    }
    
    try {
        const response = await apiRequest('/game/difficulty', {
            method: 'POST',
            body: JSON.stringify({
                sessionId: gameState.sessionId,
                difficulty: difficulty
            })
        });
        
        if (response.success) {
            gameState.difficulty = difficulty;
            console.log('Difficulty updated:', difficulty);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Failed to set difficulty:', error);
    }
}

async function getStats() {
    if (!gameState.sessionId || !gameState.isConnected) {
        alert('Belum terhubung ke server!');
        return;
    }
    
    try {
        const response = await apiRequest(`/game/stats/${gameState.sessionId}`);
        
        if (response.success) {
            showStatsModal(response.stats);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        alert('Gagal mengambil statistik: ' + error.message);
        console.error('Failed to get stats:', error);
    }
}

function showStatsModal(stats) {
    const statsHtml = `
        <div><strong>Total Game:</strong> ${stats.totalGames}</div>
        <div><strong>Menang:</strong> ${stats.playerScore}</div>
        <div><strong>Kalah:</strong> ${stats.aiScore}</div>
        <div><strong>Seri:</strong> ${stats.draws}</div>
        <div><strong>Win Rate:</strong> ${stats.winRate}%</div>
        <div><strong>Kesulitan:</strong> ${stats.difficulty}</div>
        <div><strong>AI Pattern Count:</strong> ${stats.aiPatternCount}</div>
    `;
    
    elements.statsContent.innerHTML = statsHtml;
    elements.statsModal.style.display = 'flex';
}

// Event Listeners
function initEventListeners() {
    // Choice buttons
    elements.choiceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const choice = btn.dataset.choice;
            playGame(choice);
            
            // Visual feedback
            elements.choiceBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            setTimeout(() => btn.classList.remove('selected'), 1000);
        });
    });
    
    // Difficulty select
    elements.difficultySelect.addEventListener('change', (e) => {
        setDifficulty(e.target.value);
    });
    
    // Reset button
    elements.resetBtn.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin mereset game?')) {
            resetGame();
        }
    });
    
    // Stats button
    elements.statsBtn.addEventListener('click', getStats);
    
    // Modal close
    elements.closeModal.addEventListener('click', () => {
        elements.statsModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === elements.statsModal) {
            elements.statsModal.style.display = 'none';
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (!gameState.isConnected) return;
        
        switch(e.key.toLowerCase()) {
            case '1':
            case 'b':
                playGame('Batu');
                break;
            case '2':
            case 'k':
                playGame('Kertas');
                break;
            case '3':
            case 'g':
                playGame('Gunting');
                break;
            case 'r':
                if (e.ctrlKey) {
                    e.preventDefault();
                    resetGame();
                }
                break;
            case 's':
                if (e.ctrlKey) {
                    e.preventDefault();
                    getStats();
                }
                break;
        }
    });
}

// Initialize Application
async function init() {
    console.log('Initializing Rock Paper Scissors Game...');
    
    // Initialize event listeners
    initEventListeners();
    
    // Create game session
    await createSession();
    
    // Update initial UI
    updateScoreBoard();
    
    console.log('Game initialized successfully!');
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Handle page unload
window.addEventListener('beforeunload', () => {
    console.log('Game session ending...');
});