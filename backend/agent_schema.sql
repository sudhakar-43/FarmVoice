-- FarmVoice AI Agent Database Schema
-- Add these tables to your existing Supabase database
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agent conversation sessions
CREATE TABLE IF NOT EXISTS agent_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_context JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true
);

-- Agent action audit log (tracks ALL agent operations)
CREATE TABLE IF NOT EXISTS agent_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES agent_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    action_type VARCHAR(50) NOT NULL,  -- create, read, update, delete
    entity_type VARCHAR(50) NOT NULL,  -- crop, task, profile, notification, health, etc.
    entity_id UUID,                    -- ID of affected entity
    action_params JSONB,               -- Input parameters
    action_result JSONB,               -- Result/response
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent memory (persistent across sessions)
CREATE TABLE IF NOT EXISTS agent_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    conversation_history JSONB DEFAULT '[]',  -- Recent messages [{role, content, timestamp}]
    preferences JSONB DEFAULT '{}',           -- User preferences {key: value}
    context JSONB DEFAULT '{}',               -- Working memory (active task state)
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_id ON agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_active ON agent_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_last_active ON agent_sessions(last_active);

CREATE INDEX IF NOT EXISTS idx_agent_actions_user_id ON agent_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_session_id ON agent_actions(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_type ON agent_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_agent_actions_entity ON agent_actions(entity_type);
CREATE INDEX IF NOT EXISTS idx_agent_actions_timestamp ON agent_actions(executed_at);

CREATE INDEX IF NOT EXISTS idx_agent_memory_user_id ON agent_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_last_interaction ON agent_memory(last_interaction);

-- Disable RLS (using JWT auth at application level)
ALTER TABLE agent_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory DISABLE ROW LEVEL SECURITY;

-- Optional: Add comments for documentation
COMMENT ON TABLE agent_sessions IS 'Tracks FarmVoice agent conversation sessions for continuity';
COMMENT ON TABLE agent_actions IS 'Audit log of all actions performed by the FarmVoice agent';
COMMENT ON TABLE agent_memory IS 'Persistent memory for the FarmVoice agent (conversation history, preferences, context)';

COMMENT ON COLUMN agent_memory.conversation_history IS 'Recent conversation messages (max 50)';
COMMENT ON COLUMN agent_memory.preferences IS 'User preferences learned by the agent';
COMMENT ON COLUMN agent_memory.context IS 'Working memory for active tasks and state';
