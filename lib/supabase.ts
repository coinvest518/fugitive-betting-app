import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ljhzyzrhdqmnyzljkmse.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqaHp5enJoZHFtbnl6bGprbXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3MDAwNDQsImV4cCI6MjA2NDI3NjA0NH0.ylf4rIrXaUeMPVicSlggxlflpLEQesnOkpexWH9Bozk';

export const supabase = createClient(supabaseUrl, supabaseKey);