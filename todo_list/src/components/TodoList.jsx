import React, { useMemo, useState } from "react";
import TodoItem from "./TodoItem";
import "./TodoList.css";

const TodoList = ({ todos, onToggle, onDelete, onEdit, currentUser }) => {
  const [activeTab, setActiveTab] = useState("active");

  const { activeTodos, completedTodos } = useMemo(() => {
    const active = [];
    const completed = [];
    (todos || []).forEach((t) => {
      if (t && t.completed) completed.push(t);
      else active.push(t);
    });

    const sortByDateDesc = (arr) =>
      arr.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

    return {
      activeTodos: sortByDateDesc(active),
      completedTodos: sortByDateDesc(completed),
    };
  }, [todos]);

  const clearCompleted = async () => {
    if (completedTodos.length === 0) return;
    if (
      !confirm(
        `Delete ${completedTodos.length} completed todo(s)? This cannot be undone.`
      )
    )
      return;
    // delete each completed item using the onDelete callback
    for (const t of completedTodos) {
      try {
        await onDelete(t.id);
      } catch (e) {
        // ignore individual failures; load will reconcile
        console.error("Failed to delete completed todo", t.id, e);
      }
    }
  };

  if (!todos || todos.length === 0) {
    return (
      <div className="todo-list-empty">
        <p>No todos yet. Add one above to get started!</p>
      </div>
    );
  }

  return (
    <div className="todo-list-sections">
      <div className="todo-tabs" role="tablist" aria-label="Todo filters">
        <button
          role="tab"
          aria-selected={activeTab === "active"}
          className={`tab-button ${activeTab === "active" ? "active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          Active <span className="tab-count">{activeTodos.length}</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "completed"}
          className={`tab-button ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          Completed <span className="tab-count">{completedTodos.length}</span>
        </button>

        <div className="tab-actions">
          {activeTab === "completed" && (
            <button
              className="clear-completed"
              onClick={clearCompleted}
              disabled={completedTodos.length === 0}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="tab-panel">
        {activeTab === "active" && (
          <div className="todo-list">
            {activeTodos.length === 0 && (
              <div className="todo-list-empty">
                <p>No active todos yet.</p>
              </div>
            )}
            {activeTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
                currentUser={currentUser}
              />
            ))}
          </div>
        )}

        {activeTab === "completed" && (
          <div className="todo-list completed-list">
            {completedTodos.length === 0 && (
              <div className="todo-list-empty">
                <p>No completed tasks yet.</p>
              </div>
            )}
            {completedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
                currentUser={currentUser}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoList;
