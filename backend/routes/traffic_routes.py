from flask import Blueprint, request, jsonify
from middleware.auth_middleware import token_required
from config import Config
from utils.json_db import JSONDatabase
from datetime import datetime
import uuid

traffic_routes_bp = Blueprint('traffic_routes', __name__, url_prefix='/api/game/traffic')

# Database instances
game_sessions_db = JSONDatabase(Config.GAME_SESSIONS_FILE)
game_scores_db = JSONDatabase(Config.GAME_SCORES_FILE)

@traffic_routes_bp.route('/start-session', methods=['POST'])
@token_required
def start_game_session():
    """Start a new traffic game session"""
    try:
        data = request.get_json()
        
        session_data = {
            'session_id': str(uuid.uuid4()),
            'user_id': request.user['user_id'],
            'game_type': 'traffic_game',
            'start_time': datetime.now().isoformat(),
            'end_time': None,
            'duration': None,
            'status': 'active'
        }
        
        game_sessions_db.add('game_sessions', session_data)
        
        return jsonify({
            'message': 'Traffic game session started',
            'data': session_data
        }), 201
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@traffic_routes_bp.route('/end-session', methods=['POST'])
@token_required
def end_game_session():
    """End a traffic game session"""
    try:
        data = request.get_json()
        
        if not data.get('session_id'):
            return jsonify({'message': 'Session ID is required'}), 400
        
        sessions = game_sessions_db.get_all('game_sessions')
        
        for session in sessions:
            if session['session_id'] == data['session_id']:
                session['end_time'] = datetime.now().isoformat()
                session['status'] = 'completed'
                
                # Calculate duration
                start = datetime.fromisoformat(session['start_time'])
                end = datetime.fromisoformat(session['end_time'])
                session['duration'] = int((end - start).total_seconds())
                
                game_sessions_db.update('game_sessions', session['session_id'], session, 'session_id')
                
                return jsonify({
                    'message': 'Traffic game session ended',
                    'data': session
                }), 200
        
        return jsonify({'message': 'Session not found'}), 404
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@traffic_routes_bp.route('/save-score', methods=['POST'])
@token_required
def save_game_score():
    """Save traffic game score"""
    try:
        data = request.get_json()
        
        if not data.get('session_id') or 'score' not in data:
            return jsonify({'message': 'Session ID and score are required'}), 400
        
        score_data = {
            'score_id': str(uuid.uuid4()),
            'user_id': request.user['user_id'],
            'session_id': data['session_id'],
            'game_type': 'traffic_game',
            'score': data['score'],
            'level': data.get('level', 1),
            'created_at': datetime.now().isoformat()
        }
        
        game_scores_db.add('game_scores', score_data)
        
        return jsonify({
            'message': 'Traffic game score saved successfully',
            'data': score_data
        }), 201
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500
