from flask import Blueprint, request, jsonify
from utils.auth import AuthUtils
from models.admin import AdminModel
from datetime import datetime

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def unified_login():
    """Unified login endpoint - checks admin first, then senior user"""
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'กรุณากรอก Email และ รหัสผ่าน'}), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        
        # 1) Try admin login first
        admin = AdminModel.get_by_email(email)
        if admin and AuthUtils.verify_password(password, admin['password']):
            token = AuthUtils.generate_token(admin['admin_id'], 'admin')
            return jsonify({
                'message': 'Login successful',
                'token': token,
                'role': 'admin',
                'user': {
                    'id': admin['admin_id'],
                    'email': admin['email'],
                    'full_name': admin.get('full_name', 'Admin')
                }
            }), 200
        
        # 2) Try senior user login by email
        from models.senior_user import SeniorUserModel
        user = SeniorUserModel.get_by_email(email)
        if user and AuthUtils.verify_password(password, user['password']):
            token = AuthUtils.generate_token(user['user_id'], 'senior')
            return jsonify({
                'message': 'Login successful',
                'token': token,
                'role': 'senior',
                'user': {
                    'id': user['user_id'],
                    'full_name': user.get('full_name', '')
                }
            }), 200
        
        # 3) Neither matched
        return jsonify({'message': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'}), 401
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# Keep old endpoints for backward compatibility
@auth_bp.route('/admin-login', methods=['POST'])
def admin_login():
    """Admin login endpoint (legacy)"""
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password required'}), 400
        
        admin = AdminModel.get_by_email(data['email'])
        
        if not admin:
            return jsonify({'message': 'Invalid email or password'}), 401
        
        if not AuthUtils.verify_password(data['password'], admin['password']):
            return jsonify({'message': 'Invalid email or password'}), 401
        
        token = AuthUtils.generate_token(admin['admin_id'], 'admin')
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'role': 'admin',
            'admin': {
                'admin_id': admin['admin_id'],
                'email': admin['email'],
                'full_name': admin['full_name']
            }
        }), 200
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@auth_bp.route('/senior-login', methods=['POST'])
def senior_login():
    """Senior user login endpoint (legacy)"""
    try:
        from models.senior_user import SeniorUserModel
        
        data = request.get_json()
        
        if not data or not data.get('user_id') or not data.get('password'):
            return jsonify({'message': 'User ID and password required'}), 400
        
        user = SeniorUserModel.get_by_id(data['user_id'])
        
        if not user:
            return jsonify({'message': 'Invalid user ID or password'}), 401
        
        if not AuthUtils.verify_password(data['password'], user['password']):
            return jsonify({'message': 'Invalid user ID or password'}), 401
        
        token = AuthUtils.generate_token(user['user_id'], 'senior')
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'role': 'senior',
            'user': {
                'user_id': user['user_id'],
                'full_name': user['full_name']
            }
        }), 200
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@auth_bp.route('/verify-token', methods=['POST'])
def verify_token():
    """Verify JWT token"""
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({'message': 'Token required'}), 400
        
        payload = AuthUtils.verify_token(token)
        
        if not payload:
            return jsonify({'message': 'Invalid or expired token'}), 401
        
        return jsonify({
            'message': 'Token is valid',
            'payload': payload
        }), 200
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500
