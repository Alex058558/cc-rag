-- Add sources column to messages for persisting RAG citation data
alter table messages add column if not exists sources jsonb;
