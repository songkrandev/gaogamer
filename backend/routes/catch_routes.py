from flask import Blueprint, request, jsonify
from middleware.auth_middleware import token_required
from config import Config
from utils.json_db import JSONDatabase
from datetime import datetime
import uuid
from games.catch_game import CatchGame

catch_routes_bp = Blueprint('catch_routes', __name__, url_prefix='/api/game/catch-me')

# Logic instance
catch_me_logic = CatchGame()
# Database instances
game_sessions_db = JSONDatabase(Config.GAME_SESSIONS_FILE)

@catch_routes_bp.route('/start', methods=['POST'])
@token_required
def start_game():
    """เริ่มเกมจับให้ได้ไล่ให้ทัน"""
    try:
        questions = catch_me_logic.generate_question(10)
        session_id = str(uuid.uuid4())
        session_data = {
            'session_id': session_id,
            'user_id': request.user['user_id'],
            'game_type': 'catch_me',
            'start_time': datetime.now().isoformat(),
            'status': 'active',
            'questions': questions,
            'current_question_index': 0,
            'score': 0,
            'max_rounds': 10
        }
        game_sessions_db.add('game_sessions', session_data)
        
        return jsonify({
            'message': 'Catch Me game started',
            'session_id': session_id,
            'first_question': questions[0]
        }), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@catch_routes_bp.route('/play', methods=['POST'])
@token_required
def play_round():
    """เล่นแต่ละรอบ"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        user_answer = data.get('answer_card_image') # ชื่อไฟล์รูปที่ผู้เล่นเลือก

        if not session_id or not user_answer:
            return jsonify({'message': 'Session ID and answer are required'}), 400

        sessions = game_sessions_db.get_all('game_sessions')
        session = next((s for s in sessions if s['session_id'] == session_id), None)

        if not session or session['status'] != 'active':
            return jsonify({'message': 'Session not found or inactive'}), 404

        current_idx = session['current_question_index']
        question_image = session['questions'][current_idx]
        
        # ตรวจคำตอบจาก Logic ที่เราทำไว้
        is_correct = catch_me_logic.check_answer(question_image, user_answer)
        
        if is_correct:
            session['score'] += 1
        
        session['current_question_index'] += 1
        
        # เช็คว่าจบเกมหรือยัง
        is_finished = session['current_question_index'] >= session['max_rounds']
        if is_finished:
            session['status'] = 'completed'
            session['end_time'] = datetime.now().isoformat()
        
        game_sessions_db.update('game_sessions', session['session_id'], session, 'session_id')

        # บันทึกคะแนนลงใน game_scores.json เมื่อจบเกม
        if is_finished:
            try:
                game_scores_db = JSONDatabase(Config.GAME_SCORES_FILE)
                score_data = {
                    'score_id': str(uuid.uuid4()),
                    'user_id': session['user_id'],
                    'session_id': session['session_id'],
                    'game_type': 'catch_game',
                    'score': session['score'],
                    'level': 1, # เกมนี้มีระดับเดียวคือ 1 สำหรับตอนนี้
                    'created_at': datetime.now().isoformat()
                }
                game_scores_db.add('game_scores', score_data)
            except Exception as score_err:
                print(f"Failed to save catch game score: {score_err}")

        return jsonify({
            'is_correct': is_correct,
            'score': session['score'],
            'is_finished': is_finished,
            'next_question': session['questions'][session['current_question_index']] if not is_finished else None
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
