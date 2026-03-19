from flask import request, jsonify
from functools import wraps
from utils.auth import AuthUtils

def token_required(f):
    """Decorator to check if token is valid"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(' ')[-1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        payload = AuthUtils.verify_token(token)
        if not payload:
            return jsonify({'message': 'Invalid or expired token!'}), 401
        
        request.user = payload
        return f(*args, **kwargs)
    
    return decorated

def admin_required(f):
    """Decorator to check if user is admin"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(request, 'user') or request.user.get('user_type') != 'admin':
            return jsonify({'message': 'Admin access required!'}), 403
        
        return f(*args, **kwargs)
    
    return decorated
