SELECT 'CREATE DATABASE friends_db_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'friends_db_test')\gexec
