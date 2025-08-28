import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../contexts/AuthContext";
import { supabase, todosService } from "../lib/supabase";
import TodoList from "./TodoList";
import AddTodo from "./AddTodo";
import "./TodoApp.css";

const TodoApp = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSplash, setShowSplash] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, profile, signOut } = useAuth();
  const addTodoRef = useRef(null);

  // Load todos when component mounts
  useEffect(() => {
    if (user) {
      loadTodos();
      // Subscribe to real-time updates
      const subscription = todosService.subscribeToTodos(handleRealtimeUpdate);
      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    }
  }, [user]);

  const loadTodos = async () => {
    try {
      setLoading(true);
      const data = await todosService.getTodos();
      setTodos(data || []);
    } catch (error) {
      setError("Failed to load todos: " + error.message);
      console.error("Error loading todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeUpdate = (payload) => {
    console.log("Real-time update:", payload);

    switch (payload.eventType) {
      case "INSERT":
        setTodos((prev) => {
          const exists = prev.some((todo) => todo.id === payload.new.id);
          if (exists) return prev;
          return [payload.new, ...prev];
        });
        break;
      case "UPDATE":
        setTodos((prev) =>
          prev.map((todo) => (todo.id === payload.new.id ? payload.new : todo))
        );
        break;
      case "DELETE":
        setTodos((prev) => prev.filter((todo) => todo.id !== payload.old.id));
        break;
      default:
        break;
    }
  };

  const addTodo = async (text, description = "") => {
    try {
      const newTodo = {
        id: uuidv4(),
        text,
        description,
        completed: false,
        createdBy: user.email,
        name:
          (profile && profile.display_name) ||
          user.name ||
          (user.email ? user.email.split("@")[0] : ""),
        // Let the database set the timestamp
      };

      // Optimistic update
      setTodos((prev) => [newTodo, ...prev]);

      // Save to database
      await todosService.addTodo(newTodo);
    } catch (error) {
      setError("Failed to add todo: " + error.message);
      console.error("Error adding todo:", error);
      // Revert optimistic update
      loadTodos();
    }
  };

  const toggleTodo = async (id) => {
    try {
      const todo = todos.find((t) => t.id === id);
      if (!todo) return;

      const updatedTodo = { ...todo, completed: !todo.completed };

      // Optimistic update
      setTodos((prev) => prev.map((t) => (t.id === id ? updatedTodo : t)));

      // Save to database
      await todosService.updateTodo(id, { completed: updatedTodo.completed });
    } catch (error) {
      setError("Failed to update todo: " + error.message);
      console.error("Error updating todo:", error);
      // Revert optimistic update
      loadTodos();
    }
  };

  const deleteTodo = async (id) => {
    try {
      // Optimistic update
      setTodos((prev) => prev.filter((todo) => todo.id !== id));

      // Delete from database
      await todosService.deleteTodo(id);
    } catch (error) {
      setError("Failed to delete todo: " + error.message);
      console.error("Error deleting todo:", error);
      // Revert optimistic update
      loadTodos();
    }
  };

  const editTodo = async (id, newText) => {
    try {
      const todo = todos.find((t) => t.id === id);
      if (!todo) return;

      const updatedTodo = { ...todo, text: newText };

      // Optimistic update
      setTodos((prev) => prev.map((t) => (t.id === id ? updatedTodo : t)));

      // Save to database
      await todosService.updateTodo(id, { text: newText });
    } catch (error) {
      setError("Failed to edit todo: " + error.message);
      console.error("Error editing todo:", error);
      // Revert optimistic update
      loadTodos();
    }
  };

  const editDescription = async (id, newDescription) => {
    try {
      const todo = todos.find((t) => t.id === id);
      if (!todo) return;

      const updatedTodo = { ...todo, description: newDescription };

      // Optimistic update
      setTodos((prev) => prev.map((t) => (t.id === id ? updatedTodo : t)));

      // Save to database
      await todosService.updateTodo(id, { description: newDescription });
    } catch (error) {
      setError("Failed to edit description: " + error.message);
      console.error("Error editing description:", error);
      // Revert optimistic update
      loadTodos();
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      setError("Failed to sign out: " + error.message);
    }
  };

  const clearError = () => setError("");

  // Filter todos based on search query
  const filteredTodos = todos.filter((todo) =>
    todo.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your todos...</p>
      </div>
    );
  }

  // Helper to get display name from user object
  const getDisplayName = (userObj) => {
    if (profile && profile.display_name) return profile.display_name;
    if (!userObj) return "";
    if (userObj.name) return userObj.name.substring(0, 7);
    if (userObj.email) return userObj.email.split("@")[0].substring(0, 7);
    return "";
  };

  return (
    <>
      <header className="todo-header">
        <h4 className="user-name" title="Sign out">
          ❤️ {getDisplayName(user)} ❤️
        </h4>
        <div className="user-info">
          <button
            className="add-in-header"
            onClick={() => addTodoRef.current?.open()}
            title="Add new todo"
          >
            <i className="fa-solid fa-plus" aria-hidden></i>
          </button>

          <button
            className="youtube-btn"
            onClick={() =>
              window.open(
                "https://music.youtube.com/playlist?list=PLShnD4RF0a5BnLuNtv6o0f0u9Lxlf_4LT&si=xUcPKYuGRKziMVd0",
                "_blank"
              )
            }
            title="Open YouTube"
          >
            <i className="fa-brands fa-youtube" aria-hidden></i>
          </button>

          <button
            className="sign-out-btn"
            onClick={handleSignOut}
            title="Sign out"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="todo-app">
        {showSplash && (
          <div className="splash-screen" role="dialog" aria-modal="true">
            <div className="splash-card">
              <div
                className="splash-image"
                aria-hidden
                style={{ backgroundColor: "#9f50ffff" }}
              ></div>
              <div className="splash-content">
                <h1 className="splash-title">
                  <h1>Our Todo List ♥</h1>
                </h1>
                <p className="splash-welcome">
                  Welcome, {getDisplayName(user)}
                </p>
                <div className="splash-actions">
                  <button
                    className="enter-btn"
                    onClick={() => setShowSplash(false)}
                  >
                    Enter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={clearError} className="error-close">
              x
            </button>
          </div>
        )}

        <div className="divider" />

        <div className="todo-content">
          {/* Search Bar */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Search todos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="search-clear"
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <TodoList
            todos={filteredTodos}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onEdit={editTodo}
            onEditDescription={editDescription}
            currentUser={getDisplayName(user)}
          />
        </div>

        {/* Hidden AddTodo component for modal functionality */}
        <AddTodo ref={addTodoRef} onAdd={addTodo} />
      </div>
    </>
  );
};

export default TodoApp;
