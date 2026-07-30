import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://klshcrofvsofofouvcbt.supabase.co';
const supabaseKey = 'sb_publishable_okWx4O-c9X82dJlkfhAhPA_FKgLtyDs';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];
