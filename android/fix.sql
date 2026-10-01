UPDATE users SET password_hash = crypt('password', gen_salt('bf', 10)) WHERE email = 'admin@hms.com';  
