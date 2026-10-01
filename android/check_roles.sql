SELECT u.email, r.name FROM users u JOIN user_roles ur ON u.id=ur.user_id JOIN roles r ON r.id=ur.role_id;  
