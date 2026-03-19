from flask import Blueprint, request, jsonify
from middleware.auth_middleware import token_required, admin_required
from models.senior_user import SeniorUserModel
from utils.auth import AuthUtils
from datetime import datetime

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/users', methods=['GET'])
@token_required
@admin_required
def get_all_users():
    """Get all senior users"""
    try:
        users = SeniorUserModel.get_all()
        # Keep password visible for admin
        
        return jsonify({
            'message': 'Users retrieved successfully',
            'count': len(users),
            'data': users
        }), 200
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/scores', methods=['GET'])
@token_required
@admin_required
def get_all_scores():
    """Get all game scores with user names"""
    try:
        from utils.json_db import JSONDatabase
        from config import Config
        
        scores_db = JSONDatabase(Config.GAME_SCORES_FILE)
        all_scores = scores_db.get_all('game_scores')
        
        # Get users to map user_id to name
        users = SeniorUserModel.get_all()
        user_map = {u['user_id']: u['full_name'] for u in users}
        
        # Enrich scores with user full names
        enriched_scores = []
        for score in all_scores:
            enriched_score = score.copy()
            user_id = score.get('user_id')
            enriched_score['full_name'] = user_map.get(user_id, f"User {user_id}")
            enriched_scores.append(enriched_score)
            
        return jsonify({
            'message': 'Scores retrieved successfully',
            'count': len(enriched_scores),
            'data': enriched_scores
        }), 200
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/scores/<score_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_score(score_id):
    """Delete a specific game score"""
    try:
        from utils.json_db import JSONDatabase
        from config import Config
        
        scores_db = JSONDatabase(Config.GAME_SCORES_FILE)
        
        if scores_db.delete('game_scores', score_id, 'score_id'):
            return jsonify({'message': 'Score deleted successfully'}), 200
        else:
            return jsonify({'message': 'Failed to delete score or score not found'}), 404
            
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/scores/all', methods=['DELETE'])
@token_required
@admin_required
def delete_all_scores():
    """Delete all game scores and sessions"""
    try:
        from utils.json_db import JSONDatabase
        from config import Config
        
        scores_db = JSONDatabase(Config.GAME_SCORES_FILE)
        sessions_db = JSONDatabase(Config.GAME_SESSIONS_FILE)
        
        # Clear scores
        scores_data = scores_db.read()
        scores_data['game_scores'] = []
        scores_result = scores_db.write(scores_data)
        
        # Clear sessions
        sessions_data = sessions_db.read()
        sessions_data['game_sessions'] = []
        sessions_result = sessions_db.write(sessions_data)
        
        if scores_result and sessions_result:
            return jsonify({'message': 'All scores and sessions deleted successfully'}), 200
        else:
            return jsonify({'message': 'Failed to delete all data'}), 500
            
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/users/<user_id>', methods=['GET'])
@token_required
@admin_required
def get_user(user_id):
    """Get single senior user"""
    try:
        user = SeniorUserModel.get_by_id(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Keep password visible for admin
        
        return jsonify({
            'message': 'User retrieved successfully',
            'data': user
        }), 200
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/users', methods=['POST'])
@token_required
@admin_required
def create_user():
    """Create new senior user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['full_name', 'email', 'address', 'phone', 'password']
        if not all(field in data for field in required_fields):
            return jsonify({'message': 'Missing required fields'}), 400
        
        # Check if email already exists
        if SeniorUserModel.get_by_email(data['email']):
            return jsonify({'message': 'Email already exists'}), 400
        
        # Check if phone already exists
        if SeniorUserModel.get_by_phone(data['phone']):
            return jsonify({'message': 'Phone number already exists'}), 400
        
        # Keep plain password for display
        plain_password = data['password']
        
        # Hash password but keep plain for admin visibility
        user_data = {
            'full_name': data['full_name'],
            'email': data['email'].strip().lower(),
            'address': data['address'],
            'phone': data['phone'],
            'password': AuthUtils.hash_password(data['password']),
            'plain_password': plain_password,
            'created_at': datetime.now().isoformat(),
            'created_by': request.user['user_id']
        }
        
        new_user = SeniorUserModel.create(user_data)
        
        return jsonify({
            'message': 'User created successfully',
            'data': new_user
        }), 201
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/users/<user_id>', methods=['PUT'])
@token_required
@admin_required
def update_user(user_id):
    """Update senior user"""
    try:
        user = SeniorUserModel.get_by_id(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update only provided fields
        if 'full_name' in data:
            user['full_name'] = data['full_name']
        if 'email' in data:
            user['email'] = data['email'].strip().lower()
        if 'address' in data:
            user['address'] = data['address']
        if 'phone' in data:
            user['phone'] = data['phone']
        if 'password' in data:
            user['password'] = AuthUtils.hash_password(data['password'])
            user['plain_password'] = data['password']
        
        user['updated_at'] = datetime.now().isoformat()
        
        if SeniorUserModel.update(user_id, user):
            user.pop('password', None)
            return jsonify({
                'message': 'User updated successfully',
                'data': user
            }), 200
        else:
            return jsonify({'message': 'Failed to update user'}), 500
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_user(user_id):
    """Delete senior user"""
    try:
        user = SeniorUserModel.get_by_id(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        if SeniorUserModel.delete(user_id):
            return jsonify({'message': 'User deleted successfully'}), 200
        else:
            return jsonify({'message': 'Failed to delete user'}), 500
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/stats', methods=['GET'])
@token_required
@admin_required
def get_stats():
    """Get admin dashboard statistics"""
    try:
        total_users = SeniorUserModel.count()
        
        # Get game stats
        from utils.json_db import JSONDatabase
        from config import Config
        
        sessions_db = JSONDatabase(Config.GAME_SESSIONS_FILE)
        scores_db = JSONDatabase(Config.GAME_SCORES_FILE)
        
        all_sessions = sessions_db.get_all('game_sessions')
        all_scores = scores_db.get_all('game_scores')
        
        total_sessions = len(all_sessions)
        total_scores = len(all_scores)
        
        avg_score = 0
        if total_scores > 0:
            score_values = [s.get('score', 0) for s in all_scores]
            avg_score = sum(score_values) / len(score_values)
        
        # Calculate game popularity (count plays for each game type)
        game_popularity_map = {}
        for score in all_scores:
            game_type = score.get('game_type', 'Unknown')
            game_popularity_map[game_type] = game_popularity_map.get(game_type, 0) + 1
            
        # Convert to sorted list of dictionaries
        game_popularity = []
        for game_type, count in game_popularity_map.items():
            game_popularity.append({
                'label': game_type,
                'value': count
            })
            
        # Sort by value descending and take top 5
        game_popularity = sorted(game_popularity, key=lambda x: x['value'], reverse=True)[:5]
        
        return jsonify({
            'message': 'Stats retrieved successfully',
            'data': {
                'total_senior_users': total_users,
                'total_sessions': total_sessions,
                'total_scores': total_scores,
                'average_score': round(avg_score, 1),
                'game_popularity': game_popularity
            }
        }), 200
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/scores/summary', methods=['GET'])
@token_required
@admin_required
def get_score_summary():
    """Get usage summary, grouped by user, with optional date range filter"""
    try:
        from utils.json_db import JSONDatabase
        from config import Config
        import re

        start = request.args.get('start')  # YYYY-MM-DD
        end = request.args.get('end')      # YYYY-MM-DD

        # Load data
        sessions_db = JSONDatabase(Config.GAME_SESSIONS_FILE)
        scores_db = JSONDatabase(Config.GAME_SCORES_FILE)
        all_sessions = sessions_db.get_all('game_sessions')
        all_scores = scores_db.get_all('game_scores')

        # Filter by date range if provided (inclusive)
        def parse_date_flexible(s):
            """Accept ISO (YYYY-MM-DD or full ISO), MM/DD/YYYY, DD/MM/YYYY, and Buddhist year (YYYY+543)."""
            if not s:
                return None
            # If full ISO datetime passed
            try:
                return datetime.fromisoformat(s)
            except Exception:
                pass
            # Date only patterns
            try_formats = ["%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y"]
            for fmt in try_formats:
                try:
                    dt = datetime.strptime(s, fmt)
                    # Adjust Buddhist year
                    if dt.year > 2400:
                        dt = dt.replace(year=dt.year - 543)
                    return dt
                except Exception:
                    continue
            return None

        start_dt = None
        end_dt = None
        if start:
            base = parse_date_flexible(start)
            start_dt = datetime(base.year, base.month, base.day, 0, 0, 0) if base else None
        if end:
            base = parse_date_flexible(end)
            end_dt = datetime(base.year, base.month, base.day, 23, 59, 59) if base else None

        def in_range(dt_str):
            dt = parse_date_flexible(dt_str)
            if dt is None:
                return False
            if start_dt and dt < start_dt:
                return False
            if end_dt and dt > end_dt:
                return False
            return True

        if start or end:
            all_sessions = [s for s in all_sessions if in_range(s.get('start_time') or s.get('created_at'))]
            all_scores = [s for s in all_scores if in_range(s.get('created_at'))]

        # Map user id to name
        users = SeniorUserModel.get_all()
        user_map = {u['user_id']: u['full_name'] for u in users}

        # Group by user
        summary_map = {}
        for ses in all_sessions:
            uid = ses.get('user_id')
            if not uid:
                continue
            if uid not in summary_map:
                summary_map[uid] = {'user_id': uid, 'full_name': user_map.get(uid, f"User {uid}"), 'sessions': 0, 'plays': 0}
            summary_map[uid]['sessions'] += 1
        for sc in all_scores:
            uid = sc.get('user_id')
            if not uid:
                continue
            if uid not in summary_map:
                summary_map[uid] = {'user_id': uid, 'full_name': user_map.get(uid, f"User {uid}"), 'sessions': 0, 'plays': 0}
            summary_map[uid]['plays'] += 1

        summary_list = sorted(summary_map.values(), key=lambda x: x['sessions'], reverse=True)

        return jsonify({
            'message': 'Summary retrieved successfully',
            'count': len(summary_list),
            'data': summary_list
        }), 200

    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/scores/user/<user_id>', methods=['GET'])
@token_required
@admin_required
def get_user_score_details(user_id):
    """Get detailed scores for a user with optional date range filter"""
    try:
        from utils.json_db import JSONDatabase
        from config import Config
        def parse_date_flexible(s):
            if not s:
                return None
            try:
                return datetime.fromisoformat(s)
            except Exception:
                pass
            for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y"):
                try:
                    dt = datetime.strptime(s, fmt)
                    if dt.year > 2400:
                        dt = dt.replace(year=dt.year - 543)
                    return dt
                except Exception:
                    continue
            return None

        scores_db = JSONDatabase(Config.GAME_SCORES_FILE)
        all_scores = scores_db.get_all('game_scores')

        start = request.args.get('start')  # YYYY-MM-DD
        end = request.args.get('end')      # YYYY-MM-DD

        start_base = parse_date_flexible(start) if start else None
        end_base = parse_date_flexible(end) if end else None
        start_dt = datetime(start_base.year, start_base.month, start_base.day, 0, 0, 0) if start_base else None
        end_dt = datetime(end_base.year, end_base.month, end_base.day, 23, 59, 59) if end_base else None

        details = []
        for s in all_scores:
            if s.get('user_id') != user_id:
                continue
            if start_dt or end_dt:
                dt = parse_date_flexible(s.get('created_at'))
                if not dt:
                    continue
                if start_dt and dt < start_dt:
                    continue
                if end_dt and dt > end_dt:
                    continue
            details.append(s)

        # Enrich with full name
        user = SeniorUserModel.get_by_id(user_id)
        full_name = user['full_name'] if user else f"User {user_id}"

        return jsonify({
            'message': 'User score details retrieved successfully',
            'data': {
                'user_id': user_id,
                'full_name': full_name,
                'scores': sorted(details, key=lambda x: x.get('created_at', ''), reverse=True)
            }
        }), 200

    except Exception as e:
        return jsonify({'message': str(e)}), 500

