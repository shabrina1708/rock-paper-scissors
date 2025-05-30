# game_logic.py - Game Logic and AI
import random
from datetime import datetime
from collections import defaultdict

class SimpleAI:
    def __init__(self):
        self.patterns = defaultdict(lambda: defaultdict(int))
        self.max_pattern_length = 3  
    
    def predict_next_move(self, history, difficulty='normal'):
        """Predict player's next move based on pattern recognition"""
        if len(history) < 2:
            return self.get_random_choice()
        
        # Try different pattern lengths
        for pattern_len in range(min(self.max_pattern_length, len(history)), 0, -1):
            pattern = ''.join(history[-pattern_len:])
            
            if pattern in self.patterns and self.patterns[pattern]:
                # Find most common next move
                predictions = self.patterns[pattern]
                most_common = max(predictions.keys(), key=predictions.get)
                
                # Return counter move
                return self.get_counter_move(most_common, difficulty)
        
        return self.get_random_choice()
    
    def learn_pattern(self, history):
        """Learn patterns from player history"""
        if len(history) < 2:
            return
        
        for pattern_len in range(1, min(self.max_pattern_length + 1, len(history))):
            for i in range(len(history) - pattern_len):
                pattern = ''.join(history[i:i + pattern_len])
                next_move = history[i + pattern_len]
                self.patterns[pattern][next_move] += 1
    
    def get_counter_move(self, player_move, difficulty):
        """Get move that beats player's predicted move"""
        counters = {
            'Batu': 'Kertas',
            'Kertas': 'Gunting',
            'Gunting': 'Batu'
        }
        
        # Add randomness based on difficulty
        random_chance = {
            'easy': 0.7,
            'normal': 0.3,
            'hard': 0.1
        }.get(difficulty, 0.3)
        
        if random.random() < random_chance:
            return self.get_random_choice()
        
        return counters.get(player_move, self.get_random_choice())
    
    def get_random_choice(self):
        """Return random choice"""
        return random.choice(['Batu', 'Kertas', 'Gunting'])
    
    def get_pattern_count(self):
        """Get number of learned patterns"""
        return len(self.patterns)
    
    def reset(self):
        """Reset all learned patterns"""
        self.patterns.clear()

class GameSession:
    def __init__(self, session_id):
        self.session_id = session_id
        self.player_score = 0
        self.ai_score = 0
        self.total_games = 0
        self.player_history = []
        self.difficulty = 'normal'
        self.ai = SimpleAI()
        self.last_activity = datetime.now()
    
    def play_round(self, player_choice):
        """Play one round of the game"""
        # AI makes prediction
        ai_choice = self.ai.predict_next_move(self.player_history, self.difficulty)
        
        # Add to history
        self.player_history.append(player_choice)
        
        # Learn from this round
        self.ai.learn_pattern(self.player_history)
        
        # Determine winner
        result = self.determine_winner(player_choice, ai_choice)
        
        # Update scores
        if result == 'win':
            self.player_score += 1
        elif result == 'lose':
            self.ai_score += 1
        
        self.total_games += 1
        self.last_activity = datetime.now()
        
        return {
            'playerChoice': player_choice,
            'aiChoice': ai_choice,
            'result': result,
            'playerScore': self.player_score,
            'aiScore': self.ai_score,
            'totalGames': self.total_games,
            'aiPatternCount': self.ai.get_pattern_count()
        }
    
    def determine_winner(self, player, ai):
        """Determine who wins the round"""
        if player == ai:
            return 'draw'
        
        win_conditions = {
            'Batu': 'Gunting',
            'Kertas': 'Batu',
            'Gunting': 'Kertas'
        }
        
        return 'win' if win_conditions.get(player) == ai else 'lose'
    
    def reset(self):
        """Reset game session"""
        self.player_score = 0
        self.ai_score = 0
        self.total_games = 0
        self.player_history = []
        self.ai.reset()
        self.last_activity = datetime.now()
    
    def set_difficulty(self, difficulty):
        """Set game difficulty"""
        self.difficulty = difficulty
        self.last_activity = datetime.now()
    
    def get_stats(self):
        """Get game statistics"""
        win_rate = (self.player_score / self.total_games * 100) if self.total_games > 0 else 0
        draws = self.total_games - self.player_score - self.ai_score
        
        return {
            'totalGames': self.total_games,
            'playerScore': self.player_score,
            'aiScore': self.ai_score,
            'draws': draws,
            'winRate': round(win_rate, 1),
            'difficulty': self.difficulty,
            'aiPatternCount': self.ai.get_pattern_count()
        }