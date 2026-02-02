
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ecdgvpxnlahxfbeevfqq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZGd2cHhubGFoeGZiZWV2ZnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzM0MTIsImV4cCI6MjA4MDAwOTQxMn0.8YmDk3VpywMezgNvJBIX8oBT5UgkKngCAemJMQi-d3A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
