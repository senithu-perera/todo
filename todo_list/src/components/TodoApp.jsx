import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import TodoList from "./TodoList";
import AddTodo from "./AddTodo";
import UserSelector from "./UserSelector";
import "./TodoApp.css";

const TodoApp = () => {
  const [todos, setTodos] = useState([]);
  const [currentUser, setCurrentUser] = useState("");
  const [socket, setSocket] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to server");
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from server");
    });

    newSocket.on("todoUpdate", (updatedTodos) => {
      setTodos(updatedTodos);
    });

    newSocket.on("usersUpdate", (users) => {
      setConnectedUsers(users);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && currentUser) {
      socket.emit("userJoin", currentUser);
    }
  }, [socket, currentUser]);

  const addTodo = (text) => {
    const newTodo = {
      id: uuidv4(),
      text,
      completed: false,
      createdBy: currentUser,
      createdAt: new Date().toISOString(),
    };

    const updatedTodos = [...todos, newTodo];
    setTodos(updatedTodos);

    if (socket) {
      socket.emit("todosUpdate", updatedTodos);
    }
  };

  const toggleTodo = (id) => {
    const updatedTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updatedTodos);

    if (socket) {
      socket.emit("todosUpdate", updatedTodos);
    }
  };

  const deleteTodo = (id) => {
    const updatedTodos = todos.filter((todo) => todo.id !== id);
    setTodos(updatedTodos);

    if (socket) {
      socket.emit("todosUpdate", updatedTodos);
    }
  };

  const editTodo = (id, newText) => {
    const updatedTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, text: newText } : todo
    );
    setTodos(updatedTodos);

    if (socket) {
      socket.emit("todosUpdate", updatedTodos);
    }
  };

  if (!currentUser) {
    return <UserSelector onUserSelect={setCurrentUser} />;
  }

  return (
    <div className="todo-app">
      <header className="todo-header">
        <h1>Shared Todo List</h1>
        <div className="user-info">
          <span className="current-user">User: {currentUser}</span>
          <span
            className={`connection-status ${
              isConnected ? "connected" : "disconnected"
            }`}
          >
            {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
          </span>
        </div>
        <div className="connected-users">
          <span>Online users: {connectedUsers.join(", ")}</span>
        </div>
      </header>

      <div className="todo-content">
        <AddTodo onAdd={addTodo} />
        <TodoList
          todos={todos}
          onToggle={toggleTodo}
          onDelete={deleteTodo}
          onEdit={editTodo}
          currentUser={currentUser}
        />
      </div>

      {!isConnected && (
        <div className="offline-message">
          <p>⚠️ You're offline. Changes will not sync with other users.</p>
        </div>
      )}
    </div>
  );
};

export default TodoApp;
