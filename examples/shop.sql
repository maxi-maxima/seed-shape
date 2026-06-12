CREATE TABLE users (
  id uuid primary key,
  email varchar(255) unique,
  name text,
  created_at timestamp
);

CREATE TABLE posts (
  id uuid primary key,
  author_id uuid,
  title text,
  published boolean
);
