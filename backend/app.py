from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import uuid
from datetime import datetime, timedelta
from game_logic import GameSession

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# In-memory session storage
game_sessions = {}

def cleanup_old_sessions():
    """Remove sessions older than 24 hours"""
    now = datetime.now()
    expired_sessions = [
        session_id for session_id, session in game_sessions.items()
        if now - session.last_activity > timedelta(hours=24)
    ]
    for session_id in expired_sessions:
        del game_sessions[session_id]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/session/create', methods=['POST'])
def create_session():
    session_id = str(uuid.uuid4())[:12]
    session = GameSession(session_id)
    game_sessions[session_id] = session
    return jsonify({
        'success': True,
        'sessionId': session_id,
        'message': 'Session created successfully'
    })

@app.route('/api/session/<session_id>', methods=['GET'])
def get_session(session_id):
    session = game_sessions.get(session_id)
    if not session:
        return jsonify({'success': False, 'message': 'Session not found'}), 404
    return jsonify({
        'success': True,
        'session': {
            'sessionId': session.session_id,
            'playerScore': session.player_score,
            'aiScore': session.ai_score,
            'totalGames': session.total_games,
            'difficulty': session.difficulty
        }
    })

@app.route('/api/game/play', methods=['POST'])
def play_game():
    data = request.get_json() or {}
    session_id = data.get('sessionId')
    player_choice = data.get('playerChoice')

    if not session_id or not player_choice:
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    if player_choice not in ['Batu', 'Kertas', 'Gunting']:
        return jsonify({'success': False, 'message': 'Invalid choice'}), 400

    session = game_sessions.get(session_id)
    if not session:
        return jsonify({'success': False, 'message': 'Session not found'}), 404

    result = session.play_round(player_choice)
    return jsonify({'success': True, 'result': result})

@app.route('/api/game/stats/<session_id>', methods=['GET'])
def get_stats(session_id):
    session = game_sessions.get(session_id)
    if not session:
        return jsonify({'success': False, 'message': 'Session not found'}), 404

    stats = session.get_stats()
    return jsonify({'success': True, 'stats': stats})

@app.route('/api/game/reset', methods=['POST'])
def reset_game():
    data = request.get_json() or {}
    session_id = data.get('sessionId')

    session = game_sessions.get(session_id)
    if not session:
        return jsonify({'success': False, 'message': 'Session not found'}), 404

    session.reset()
    return jsonify({'success': True, 'message': 'Game reset successfully'})

@app.route('/api/game/difficulty', methods=['POST'])
def set_difficulty():
    data = request.get_json() or {}
    session_id = data.get('sessionId')
    difficulty = data.get('difficulty')

    if difficulty not in ['easy', 'normal', 'hard']:
        return jsonify({'success': False, 'message': 'Invalid difficulty'}), 400

    session = game_sessions.get(session_id)
    if not session:
        return jsonify({'success': False, 'message': 'Session not found'}), 404

    session.set_difficulty(difficulty)
    return jsonify({'success': True, 'message': 'Difficulty updated'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
