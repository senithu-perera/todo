import React, { useState } from "react";
import "./UserSelector.css";

const UserSelector = ({ onUserSelect }) => {
  const [username, setUsername] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onUserSelect(username.trim());
    }
  };

  return (
    <div className="user-selector">
      <div className="user-selector-container">
        <h1>Join Shared Todo List</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="username-input"
            autoFocus
          />
          <button type="submit" disabled={!username.trim()}>
            Join
          </button>
        </form>
        <p className="info-text">
          Enter your username to start collaborating on the todo list with other
          users in real-time!
        </p>
      </div>
    </div>
  );
};

export default UserSelector;
