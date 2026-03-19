import bcrypt

pwd = 'admin123'
hashed = bcrypt.hashpw(pwd.encode('utf-8'), bcrypt.gensalt())
print('New Hash:', hashed.decode('utf-8'))
print('Verify:', bcrypt.checkpw(pwd.encode('utf-8'), hashed))
