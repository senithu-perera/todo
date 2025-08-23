import React from "react";
import TodoItem from "./TodoItem";
import "./TodoList.css";

const TodoList = ({ todos, onToggle, onDelete, onEdit, currentUser }) => {
  if (todos.length === 0) {
    return (
      <div className="todo-list-empty">
        <p>No todos yet. Add one above to get started!</p>
      </div>
    );
  }

  const sortedTodos = [...todos].sort((a, b) => {
    if (a.completed === b.completed) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    return a.completed - b.completed;
  });

  return (
    <div className="todo-list">
      {sortedTodos.map((todo) => (
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
  );
};

export default TodoList;
