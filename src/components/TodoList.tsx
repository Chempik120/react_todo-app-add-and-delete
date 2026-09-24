import React from 'react';
import { Todo } from '../types/Todo';
import { TodoItem } from './TodoItem';

type Props = {
  todos: (Todo & { isLoading?: boolean })[];
  onDelete: (todoId: number) => void;
  tempTodo?: Todo | null;
};

export const TodoList: React.FC<Props> = ({ todos, onDelete, tempTodo }) => {
  return (
    <section className="todoapp__main" data-cy="TodoList">
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onDelete={onDelete}
          isAdding={todo.isLoading}
        />
      ))}

      {tempTodo && <TodoItem todo={tempTodo} isAdding />}
    </section>
  );
};
