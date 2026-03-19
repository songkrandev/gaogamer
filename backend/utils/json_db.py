import json
import os
from threading import Lock
from datetime import datetime

class JSONDatabase:
    """Utility class for handling JSON file operations"""
    
    def __init__(self, filepath):
        self.filepath = filepath
        self.lock = Lock()
        self._ensure_file_exists()
    
    def _ensure_file_exists(self):
        """Create file if it doesn't exist"""
        if not os.path.exists(self.filepath):
            os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
            with open(self.filepath, 'w') as f:
                json.dump({}, f, ensure_ascii=False, indent=2)
    
    def read(self):
        """Read JSON file"""
        with self.lock:
            try:
                with open(self.filepath, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error reading {self.filepath}: {e}")
                return {}
    
    def write(self, data):
        """Write JSON file"""
        with self.lock:
            try:
                with open(self.filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                return True
            except Exception as e:
                print(f"Error writing {self.filepath}: {e}")
                return False
    
    def get_all(self, key):
        """Get all items from a collection"""
        data = self.read()
        return data.get(key, [])
    
    def get_by_id(self, key, item_id, id_field='_id'):
        """Get single item by ID"""
        items = self.get_all(key)
        for item in items:
            if item.get(id_field) == item_id:
                return item
        return None
    
    def add(self, key, item):
        """Add new item to collection"""
        data = self.read()
        if key not in data:
            data[key] = []
        data[key].append(item)
        return self.write(data)
    
    def update(self, key, item_id, updated_item, id_field='_id'):
        """Update existing item"""
        data = self.read()
        if key in data:
            for i, item in enumerate(data[key]):
                if item.get(id_field) == item_id:
                    data[key][i] = updated_item
                    return self.write(data)
        return False
    
    def delete(self, key, item_id, id_field='_id'):
        """Delete item from collection"""
        data = self.read()
        if key in data:
            data[key] = [item for item in data[key] if item.get(id_field) != item_id]
            return self.write(data)
        return False
    
    def count(self, key):
        """Count items in collection"""
        return len(self.get_all(key))
