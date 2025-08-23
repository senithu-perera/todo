import { createClient } from '@supabase/supabase-js'

// Use VITE_ prefix for Vite environment variables
const supabaseUrl = "https://jbogmlholrmgsdhicocb.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impib2dtbGhvbHJtZ3NkaGljb2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzczNDMsImV4cCI6MjA3MTUxMzM0M30.fC4QQi5AIkfslpoMghCsVxKlpOB9TEW4nqwPA4yUpUQ";

// Helper to show config error
export function supabaseConfigError() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return 'Supabase environment variables are missing. Please check your .env file and restart the dev server.';
  }
  return null;
}

// Only create client if credentials are present
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Database helper functions
export const todosService = {
  // Get all todos (shared list)
  async getTodos() {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  // Add a new todo
  async addTodo(todo) {
    if (!supabase) throw new Error('Supabase not configured')
    const { data, error } = await supabase
      .from('todos')
      .insert([
        {
          id: todo.id,
          text: todo.text,
          completed: todo.completed,
          created_by: todo.createdBy,
          created_at: todo.createdAt
        }
      ])
      .select()
    if (error) throw error
    return data[0]
  },

  // Update a todo
  async updateTodo(todoId, updates) {
    if (!supabase) throw new Error('Supabase not configured')
    const { data, error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', todoId)
      .select()
    if (error) throw error
    return data[0]
  },

  // Delete a todo
  async deleteTodo(todoId) {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', todoId)
    if (error) throw error
  },

  // Subscribe to real-time changes
  subscribeToTodos(callback) {
    if (!supabase) return { unsubscribe: () => {} }
    return supabase
      .channel('todos')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
        },
        callback
      )
      .subscribe()
  }
}
