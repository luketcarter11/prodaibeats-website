'use client';

import { useState, useEffect } from 'react';
import { CheckIcon, Cross2Icon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons';

type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
};

export default function Todo() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Load todos from localStorage on component mount
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      try {
        const parsedTodos = JSON.parse(savedTodos).map((todo: any) => ({
          ...todo,
          createdAt: new Date(todo.createdAt)
        }));
        setTodos(parsedTodos);
      } catch (error) {
        console.error('Failed to parse todos from localStorage:', error);
      }
    }
  }, []);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const handleAddTodo = () => {
    if (!inputValue.trim()) return;
    
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: inputValue.trim(),
      completed: false,
      createdAt: new Date()
    };
    
    setTodos([...todos, newTodo]);
    setInputValue('');
  };

  const handleToggleComplete = (id: string) => {
    setTodos(
      todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleDelete = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const handleStartEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditValue(todo.text);
  };

  const handleSaveEdit = () => {
    if (!editValue.trim() || !editingId) return;
    
    setTodos(
      todos.map(todo => 
        todo.id === editingId ? { ...todo, text: editValue.trim() } : todo
      )
    );
    
    setEditingId(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTodo();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Todo List</h2>
      
      <div className="flex mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a new task..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Add a new task"
        />
        <button
          onClick={handleAddTodo}
          className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-700"
          aria-label="Add task"
        >
          Add
        </button>
      </div>

      <ul className="space-y-2">
        {todos.length === 0 ? (
          <li className="text-gray-500 text-center py-2">No tasks yet. Add one above!</li>
        ) : (
          todos.map(todo => (
            <li 
              key={todo.id}
              className="flex items-center p-3 border border-gray-200 rounded-lg group hover:bg-gray-50"
            >
              {editingId === todo.id ? (
                <div className="flex items-center w-full">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    aria-label="Edit task"
                  />
                  <div className="flex ml-2">
                    <button
                      onClick={handleSaveEdit}
                      className="p-1 text-green-600 hover:text-green-800"
                      aria-label="Save changes"
                    >
                      <CheckIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 text-red-600 hover:text-red-800 ml-1"
                      aria-label="Cancel editing"
                    >
                      <Cross2Icon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleToggleComplete(todo.id)}
                    className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                      todo.completed 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'border-gray-400'
                    }`}
                    aria-label={todo.completed ? "Mark as incomplete" : "Mark as complete"}
                  >
                    {todo.completed && <CheckIcon className="w-3 h-3" />}
                  </button>
                  <span 
                    className={`flex-1 ${
                      todo.completed ? 'line-through text-gray-500' : 'text-gray-800'
                    }`}
                  >
                    {todo.text}
                  </span>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleStartEdit(todo)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      aria-label="Edit task"
                    >
                      <Pencil1Icon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(todo.id)}
                      className="p-1 text-red-600 hover:text-red-800 ml-1"
                      aria-label="Delete task"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
} 