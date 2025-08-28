import React, { useState } from "react";
import "./TodoItem.css";

const TodoItem = ({
  todo,
  onToggle,
  onDelete,
  onEdit,
  onEditDescription,
  currentUser,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [showDescription, setShowDescription] = useState(false);
  const [isDescModalOpen, setIsDescModalOpen] = useState(false);
  const [descDraft, setDescDraft] = useState(todo.description || "");

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

  // Helper to get display name from todo object
  const getDisplayName = (todo) => {
    if (todo.name) return todo.name;
    if (todo.createdBy) return todo.createdBy.split("@")[0];
    return "";
  };

  return (
    <div className={`todo-item ${todo.completed ? "completed" : ""}`}>
      <div className="todo-main">
        <button
          className="todo-toggle"
          onClick={() => onToggle(todo.id)}
          title={todo.completed ? "Mark as incomplete" : "Mark as complete"}
        >
          {todo.completed ? (
            <i className="fa-solid fa-circle-check" aria-hidden></i>
          ) : (
            <i className="fa-regular fa-circle" aria-hidden></i>
          )}
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
              {todo.description && (
                <button
                  className="todo-desc-btn"
                  onClick={() => setIsDescModalOpen(true)}
                  aria-expanded={isDescModalOpen}
                  title={"View / edit description"}
                >
                  <i className="fa-solid fa-align-left" aria-hidden></i>
                </button>
              )}
              <button
                className="todo-edit-btn"
                onClick={() => setIsEditing(true)}
                title="Edit todo"
              >
                <i className="fa-solid fa-pen-to-square" aria-hidden></i>
              </button>
              <button
                className="todo-delete"
                onClick={() => onDelete(todo.id)}
                title="Delete todo"
              >
                <i className="fa-solid fa-trash" aria-hidden></i>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Inline preview still available when toggled, if you want to keep */}
      {todo.description && showDescription && (
        <div className="todo-description">{todo.description}</div>
      )}

      {isDescModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsDescModalOpen(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Description</h3>
              <button
                className="modal-close"
                onClick={() => setIsDescModalOpen(false)}
                title="Close"
              >
                ×
              </button>
            </div>
            <div>
              <textarea
                className="modal-textarea"
                placeholder="Add more details..."
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                rows={8}
              />
            </div>
            <div className="modal-actions">
              <button
                className="modal-btn cancel"
                onClick={() => {
                  setDescDraft(todo.description || "");
                  setIsDescModalOpen(false);
                }}
              >
                Cancel
              </button>
              <button
                className="modal-btn primary"
                onClick={async () => {
                  await onEditDescription?.(todo.id, descDraft.trim());
                  setIsDescModalOpen(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="todo-meta">
        <span className="todo-creator">
          Created by: <strong>{getDisplayName(todo)}</strong>
          {getDisplayName(todo) === currentUser && " (You)"}
        </span>
      </div>
    </div>
  );
};

export default TodoItem;
