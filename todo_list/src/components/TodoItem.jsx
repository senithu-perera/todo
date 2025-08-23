import React, { useState } from "react";
import "./TodoItem.css";

const TodoItem = ({ todo, onToggle, onDelete, onEdit, currentUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const handleEdit = () => {
    if (editText.trim()) {
      onEdit(todo.id, editText.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditText(todo.text);
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className={`todo-item ${todo.completed ? "completed" : ""}`}>
      <div className="todo-main">
        <button
          className="todo-toggle"
          onClick={() => onToggle(todo.id)}
          title={todo.completed ? "Mark as incomplete" : "Mark as complete"}
        >
          {todo.completed ? "✓" : "○"}
        </button>

        {isEditing ? (
          <div className="todo-edit">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleEdit}
              className="todo-edit-input"
              autoFocus
            />
          </div>
        ) : (
          <span
            className="todo-text"
            onDoubleClick={() => setIsEditing(true)}
            title="Double-click to edit"
          >
            {todo.text}
          </span>
        )}

        <div className="todo-actions">
          {!isEditing && (
            <>
              <button
                className="todo-edit-btn"
                onClick={() => setIsEditing(true)}
                title="Edit todo"
              >
                ✏️
              </button>
              <button
                className="todo-delete"
                onClick={() => onDelete(todo.id)}
                title="Delete todo"
              >
                🗑️
              </button>
            </>
          )}
        </div>
      </div>

      <div className="todo-meta">
        <span className="todo-creator">
          Created by: <strong>{todo.createdBy}</strong>
          {todo.createdBy === currentUser && " (You)"}
        </span>
        <span className="todo-date">{formatDate(todo.createdAt)}</span>
      </div>
    </div>
  );
};

export default TodoItem;
