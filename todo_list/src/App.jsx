import React from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import TodoApp from "./components/TodoApp";
import Login from "./components/Login";
import "./App.css";

// Main app component that handles auth state
function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return user ? <TodoApp /> : <Login />;
}

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;
