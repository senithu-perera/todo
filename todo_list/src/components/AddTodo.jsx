import React, { useState, forwardRef, useImperativeHandle } from "react";
import "./AddTodo.css";

const AddTodo = forwardRef(({ onAdd }, ref) => {
  const [text, setText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Expose open method to parent components
  useImperativeHandle(ref, () => ({
    open: () => setIsModalOpen(true),
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text.trim());
      setText("");
      setIsModalOpen(false);
    }
  };

  const handleCancel = () => {
    setText("");
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Add Todo Button */}


      {/* Modal Popup */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Todo</h3>
              <button
                className="modal-close"
                onClick={handleCancel}
                title="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <textarea
                placeholder="What needs to be done?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="modal-textarea"
                autoFocus
                rows="3"
              />
              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn cancel"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-btn primary"
                  disabled={!text.trim()}
                >
                  Add Todo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
});

export default AddTodo;
