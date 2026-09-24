/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Todo } from './types/Todo';
import { getTodos, USER_ID } from './api/todos';
import { FILTERS } from './utils/constants';
import { getFilteredTodos } from './utils/getFilteredTodos';
import { TodoList } from './components/TodoList';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { UserWarning } from './UserWarning';
import * as todoService from './api/todos';
import { ErrorNotification } from './components/Erros';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState(FILTERS.all);
  const [errorMessage, setErrorMessage] = useState('');
  const [title, setTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const newTodoFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    newTodoFieldRef.current?.focus();
  }, []);

  function addTodo({ userId, title: todoTitle, completed }: Omit<Todo, 'id'>) {
    setErrorMessage('');
    setIsAdding(true);

    setTempTodo({
      id: 0,
      userId,
      title: todoTitle,
      completed,
    });

    todoService
      .postTodos({ userId, title: todoTitle, completed })
      .then(newTodos => {
        setTodos(currentTodo => [...currentTodo, newTodos]);
        setTitle('');
      })
      .catch(() => {
        setErrorMessage('Unable to add a todo');
      })
      .finally(() => {
        setIsAdding(false);
        setTempTodo(null);
        setTimeout(() => {
          newTodoFieldRef.current?.focus();
        }, 0);
      });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setErrorMessage('Title should not be empty');

      return;
    }

    addTodo({
      userId: USER_ID,
      title: trimmedTitle,
      completed: false,
    });
  }

  function deleteTodo(todoId: number) {
    setErrorMessage('');

    setTodos(currentTodos =>
      currentTodos.map(todo =>
        todo.id === todoId ? { ...todo, isLoading: true } : todo,
      ),
    );

    todoService
      .deleteTodos(todoId)
      .then(() => {
        setTodos(currentTodos =>
          currentTodos.filter(todo => todo.id !== todoId),
        );
      })
      .catch(() => {
        setErrorMessage('Unable to delete a todo');
        setTodos(currentTodos =>
          currentTodos.map(todo =>
            todo.id === todoId ? { ...todo, isLoading: false } : todo,
          ),
        );
      })
      .finally(() => {
        newTodoFieldRef.current?.focus();
      });
  }

  function clearCompleted() {
    const completedTodos = todos.filter(todo => todo.completed);

    if (completedTodos.length === 0) {
      return;
    }

    setErrorMessage('');

    const completedIds = completedTodos.map(todo => todo.id);

    setTodos(currentTodos =>
      currentTodos.map(todo =>
        completedIds.includes(todo.id) ? { ...todo, isLoading: true } : todo,
      ),
    );

    const deletePromises = completedTodos.map(todo =>
      todoService
        .deleteTodos(todo.id)
        .then(() => todo.id)
        .catch(() => null),
    );

    Promise.all(deletePromises)
      .then(deletedIds => {
        const successfullyDeleted = new Set(
          deletedIds.filter((id): id is number => id !== null),
        );

        setTodos(currentTodos =>
          currentTodos.filter(todo => !successfullyDeleted.has(todo.id)),
        );
        if (successfullyDeleted.size < completedTodos.length) {
          setErrorMessage('Unable to delete a todo');
        }
      })
      .finally(() => {
        setTodos(currentTodos =>
          currentTodos.map(todo => ({ ...todo, isLoading: false })),
        );
        newTodoFieldRef.current?.focus();
      });
  }

  useEffect(() => {
    if (!errorMessage) {
      return;
    }

    const timerId = setTimeout(() => {
      setErrorMessage('');
    }, 3000);

    return () => {
      clearTimeout(timerId);
    };
  }, [errorMessage]);

  useEffect(() => {
    if (!USER_ID) {
      return;
    }

    setErrorMessage('');
    getTodos()
      .then(setTodos)
      .catch(() => {
        setErrorMessage('Unable to load todos');
      });
  }, []);

  const visibleTodos = useMemo(() => {
    return getFilteredTodos(todos, filter);
  }, [todos, filter]);

  const activeTodosCount = useMemo(() => {
    return todos.filter(t => !t.completed).length;
  }, [todos]);

  const hasCompletedTodos = useMemo(() => {
    return todos.some(t => t.completed);
  }, [todos]);

  const allCompleted = todos.length > 0 && activeTodosCount === 0;

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          todosLength={todos.length}
          allCompleted={allCompleted}
          handleSubmit={handleSubmit}
          newTodoFieldRef={newTodoFieldRef}
          title={title}
          setTitle={setTitle}
          isAdding={isAdding}
        />

        {(todos.length > 0 || tempTodo) && (
          <>
            <TodoList
              todos={visibleTodos}
              onDelete={deleteTodo}
              tempTodo={tempTodo}
            />

            <Footer
              activeTodosCount={activeTodosCount}
              filter={filter}
              onFilterChange={setFilter}
              hasCompletedTodos={hasCompletedTodos}
              onClearCompleted={clearCompleted}
            />
          </>
        )}
      </div>

      <ErrorNotification
        errorMessage={errorMessage}
        onClose={() => setErrorMessage('')}
      />
    </div>
  );
};
