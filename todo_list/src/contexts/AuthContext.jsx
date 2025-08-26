import React, { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  // Simple SHA-256 hashing for passwords (client-side). For production, use server-side hashing.
  async function sha256(text) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  const SESSION_KEY = "basic_sql_auth_session";
  const saveSession = (u) =>
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
  const loadSession = () => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const clearSession = () => localStorage.removeItem(SESSION_KEY);

  useEffect(() => {
    // Load local session only
    const sess = loadSession();
    if (sess) {
      setUser(sess);
      setProfile({
        id: sess.id,
        email: sess.email,
        display_name: sess.display_name,
      });
    }
    setLoading(false);
  }, []);

  const signUp = async (email, password, displayName) => {
    // Ensure users table has columns: id uuid pk, email text unique, display_name text, password_hash text, created_at timestamptz
    const password_hash = await sha256(password);
    // Check existing
    const { data: exists, error: selErr } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (selErr) return { data: null, error: selErr };
    if (exists)
      return { data: null, error: new Error("Email already registered") };

    const userRow = {
      id: uuidv4(),
      email,
      display_name: displayName || (email.split("@")[0] || "").substring(0, 7),
      password_hash,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("users")
      .insert([userRow])
      .select()
      .single();
    if (!error) {
      const sessionUser = {
        id: data.id,
        email: data.email,
        display_name: data.display_name,
      };
      setUser(sessionUser);
      setProfile({
        id: data.id,
        email: data.email,
        display_name: data.display_name,
      });
      saveSession(sessionUser);
    }
    return { data, error };
  };

  const signIn = async (username, password) => {
    const password_hash = await sha256(password);
    const { data, error } = await supabase
      .from("users")
      .select("id, email, display_name")
      .eq("display_name", username)
      .eq("password_hash", password_hash)
      .maybeSingle();
    if (error) return { data: null, error };
    if (!data)
      return { data: null, error: new Error("Invalid login credentials") };
    const sessionUser = {
      id: data.id,
      email: data.email,
      display_name: data.display_name,
    };
    setUser(sessionUser);
    setProfile({
      id: data.id,
      email: data.email,
      display_name: data.display_name,
    });
    saveSession(sessionUser);
    return { data: sessionUser, error: null };
  };

  const signOut = async () => {
    clearSession();
    setUser(null);
    setProfile(null);
    return { error: null };
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
