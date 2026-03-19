from config import Config
from utils.json_db import JSONDatabase
import string
import random

# Database instance
senior_users_db = JSONDatabase(Config.SENIOR_USERS_FILE)

class SeniorUserModel:
    """Senior user model"""
    
    @staticmethod
    def generate_user_id():
        """Generate unique 5-character user ID"""
        existing_ids = set()
        users = SeniorUserModel.get_all()
        for user in users:
            existing_ids.add(user.get('user_id', ''))
        
        while True:
            # สร้าง ID 5 ตัวแบบ SU001, SU002, ... SU999
            user_num = random.randint(1, 999)
            user_id = f"SU{user_num:03d}"
            if user_id not in existing_ids:
                return user_id
    
    @staticmethod
    def get_all():
        return senior_users_db.get_all('senior_users')
    
    @staticmethod
    def get_by_id(user_id):
        return senior_users_db.get_by_id('senior_users', user_id, 'user_id')
    
    @staticmethod
    def get_by_phone(phone):
        users = SeniorUserModel.get_all()
        for user in users:
            if user.get('phone') == phone:
                return user
        return None
    
    @staticmethod
    def get_by_email(email):
        users = SeniorUserModel.get_all()
        for user in users:
            if user.get('email', '').lower() == email.lower():
                return user
        return None
    
    @staticmethod
    def create(user_data):
        # Generate unique user_id if not provided
        if 'user_id' not in user_data:
            user_data['user_id'] = SeniorUserModel.generate_user_id()
        
        senior_users_db.add('senior_users', user_data)
        return user_data
    
    @staticmethod
    def update(user_id, user_data):
        return senior_users_db.update('senior_users', user_id, user_data, 'user_id')
    
    @staticmethod
    def delete(user_id):
        return senior_users_db.delete('senior_users', user_id, 'user_id')
    
    @staticmethod
    def count():
        return senior_users_db.count('senior_users')
