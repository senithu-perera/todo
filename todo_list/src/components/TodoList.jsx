import React, { useMemo, useState } from "react";
import TodoItem from "./TodoItem";
import "./TodoList.css";

const TodoList = ({ todos, onToggle, onDelete, onEdit, currentUser }) => {
  const [showCompleted, setShowCompleted] = useState(true);

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
      <section className="todos-section todos-active">
        <header className="section-header">
          <h2>Active</h2>
          <div className="section-meta">{activeTodos.length}</div>
        </header>
        <div className="todo-list">
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
      </section>

      <section className="todos-section todos-completed">
        <header className="section-header">
          <button
            className="completed-toggle"
            onClick={() => setShowCompleted((s) => !s)}
            aria-expanded={showCompleted}
          >
            {showCompleted ? (
              <i className="fa-solid fa-caret-down" aria-hidden></i>
            ) : (
              <i className="fa-solid fa-caret-right" aria-hidden></i>
            )}
          </button>
          <h2>Completed</h2>
          <div className="section-meta">{completedTodos.length}</div>
          <div className="section-actions">
            <button
              className="clear-completed"
              onClick={clearCompleted}
              disabled={completedTodos.length === 0}
            >
              Clear completed
            </button>
          </div>
        </header>

        <div
          className={`todo-list completed-list ${
            showCompleted ? "open" : "collapsed"
          }`}
        >
          {showCompleted && completedTodos.length === 0 && (
            <div className="todo-list-empty">
              <p>No completed tasks yet.</p>
            </div>
          )}
          {showCompleted &&
            completedTodos.map((todo) => (
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
      </section>
    </div>
  );
};

export default TodoList;
