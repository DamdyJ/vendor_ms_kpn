CREATE TABLE mutex_transaction (
  trans_id VARCHAR(255) PRIMARY key,
  user_id VARCHAR(255),
  create_at TIMESTAMP DEFAULT NOW()
);