import React, { useState } from "react";
import "./AddTodo.css";

const AddTodo = ({ onAdd }) => {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text.trim());
      setText("");
    }
  };

  return (
    <form className="add-todo" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Add a new todo..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="add-todo-input"
      />
      <button type="submit" disabled={!text.trim()}>
        Add
      </button>
    </form>
  );
};

export default AddTodo;
