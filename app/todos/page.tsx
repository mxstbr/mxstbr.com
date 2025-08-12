'use client'

import React from 'react'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Data types
export type Status = 'inbox' | 'todo' | 'blocked' | 'watching' | 'done'

type Todo = {
  id: string
  title: string
  status: Status
}

const STATUSES: Status[] = ['inbox', 'todo', 'blocked', 'watching', 'done']

const STATUS_TITLES: Record<Status, string> = {
  inbox: 'Inbox',
  todo: 'Todo',
  blocked: 'Blocked',
  watching: 'Watching',
  done: 'Done',
}

// Mock data: id, title, status only
const initialTodos: Todo[] = [
  { id: 't1', title: 'Plan quarterly goals', status: 'inbox' },
  { id: 't2', title: 'Email accountant', status: 'inbox' },
  { id: 't3', title: 'Refactor nav component', status: 'todo' },
  { id: 't4', title: 'Fix flaky test in CI', status: 'blocked' },
  { id: 't5', title: 'Review PR #123', status: 'watching' },
  { id: 't6', title: 'Ship blog post draft', status: 'todo' },
  { id: 't7', title: 'Update dependencies', status: 'watching' },
  { id: 't8', title: 'Book dentist appointment', status: 'inbox' },
  { id: 't9', title: 'Migrate to new Redis plan', status: 'todo' },
  { id: 't10', title: 'Celebrate shipping!', status: 'done' },
]

function isStatus(value: string): value is Status {
  return (STATUSES as string[]).includes(value)
}

function createInitialColumnOrder(todos: Todo[]): Record<Status, string[]> {
  const order: Record<Status, string[]> = {
    inbox: [],
    todo: [],
    blocked: [],
    watching: [],
    done: [],
  }
  for (const todo of todos) {
    order[todo.status].push(todo.id)
  }
  return order
}

export default function TodosPage() {
  const [todos, setTodos] = React.useState<Todo[]>(initialTodos)
  const [columnOrder, setColumnOrder] = React.useState<
    Record<Status, string[]>
  >(createInitialColumnOrder(initialTodos))
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const dragStartStatusRef = React.useRef<Status | null>(null)
  const columnOrderBeforeDragRef = React.useRef<Record<
    Status,
    string[]
  > | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const getStatusOf = React.useCallback(
    (id: string): Status | undefined => {
      return STATUSES.find((s) => columnOrder[s].includes(id))
    },
    [columnOrder],
  )

  const getTodoById = React.useCallback(
    (id: string) => todos.find((t) => t.id === id),
    [todos],
  )

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id)
    setActiveId(id)

    dragStartStatusRef.current = getStatusOf(id) ?? null
    columnOrderBeforeDragRef.current = {
      inbox: [...columnOrder.inbox],
      todo: [...columnOrder.todo],
      blocked: [...columnOrder.blocked],
      watching: [...columnOrder.watching],
      done: [...columnOrder.done],
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    setColumnOrder((prev) => {
      const getStatusFrom = (
        order: Record<Status, string[]>,
        id: string,
      ): Status | undefined => {
        return STATUSES.find((s) => order[s].includes(id))
      }

      const sourceStatus = getStatusFrom(prev, activeId)
      const targetStatus = isStatus(overId)
        ? overId
        : getStatusFrom(prev, overId)

      if (!sourceStatus || !targetStatus) return prev

      if (sourceStatus === targetStatus) {
        const items = prev[sourceStatus]
        const oldIndex = items.indexOf(activeId)
        const newIndex = isStatus(overId)
          ? items.length - 1
          : items.indexOf(overId)

        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex)
          return prev

        const moved = arrayMove(items, oldIndex, newIndex)
        if (moved === items) return prev
        return { ...prev, [sourceStatus]: moved }
      }

      const sourceItems = [...prev[sourceStatus]]
      const targetItems = [...prev[targetStatus]]

      const sourceIndex = sourceItems.indexOf(activeId)
      if (sourceIndex !== -1) sourceItems.splice(sourceIndex, 1)

      // Avoid duplicates if the item somehow exists in the target already
      const existingIndexInTarget = targetItems.indexOf(activeId)
      if (existingIndexInTarget !== -1)
        targetItems.splice(existingIndexInTarget, 1)

      let targetIndex = isStatus(overId)
        ? targetItems.length
        : targetItems.indexOf(overId)
      if (targetIndex === -1) targetIndex = targetItems.length

      targetItems.splice(targetIndex, 0, activeId)

      return {
        ...prev,
        [sourceStatus]: sourceItems,
        [targetStatus]: targetItems,
      }
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over) {
      if (columnOrderBeforeDragRef.current) {
        setColumnOrder(columnOrderBeforeDragRef.current)
      }
      dragStartStatusRef.current = null
      columnOrderBeforeDragRef.current = null
      return
    }

    const activeId = String(active.id)
    const overId = String(over.id)

    const startStatus = dragStartStatusRef.current
    const currentStatus = getStatusOf(activeId)
    const dropStatus = isStatus(overId) ? overId : getStatusOf(overId)
    const finalStatus = dropStatus ?? currentStatus ?? startStatus ?? null

    // If we stayed within the original column throughout, finalize ordering
    if (startStatus && finalStatus && startStatus === finalStatus) {
      const items = columnOrder[finalStatus]
      const oldIndex = items.indexOf(activeId)
      const newIndex = isStatus(overId)
        ? items.length - 1
        : items.indexOf(overId)

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        setColumnOrder((prev) => ({
          ...prev,
          [finalStatus]: arrayMove(prev[finalStatus], oldIndex, newIndex),
        }))
      }
    }

    // If the item crossed columns at any point, update its status to match the final column
    if (startStatus && finalStatus && startStatus !== finalStatus) {
      setTodos((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: finalStatus } : t,
        ),
      )

      // Ensure state reflects final placement if for some reason we didn't optimistically move it
      if (currentStatus !== finalStatus) {
        setColumnOrder((prev) => {
          const sourceItems = [...prev[startStatus]]
          const targetItems = [...prev[finalStatus]]

          const sourceIndex = sourceItems.indexOf(activeId)
          if (sourceIndex !== -1) sourceItems.splice(sourceIndex, 1)

          let targetIndex = isStatus(overId)
            ? targetItems.length
            : targetItems.indexOf(overId)
          if (targetIndex === -1) targetIndex = targetItems.length

          targetItems.splice(targetIndex, 0, activeId)

          return {
            ...prev,
            [startStatus]: sourceItems,
            [finalStatus]: targetItems,
          }
        })
      }
    }

    dragStartStatusRef.current = null
    columnOrderBeforeDragRef.current = null
  }

  function handleDragCancel() {
    setActiveId(null)
    if (columnOrderBeforeDragRef.current) {
      setColumnOrder(columnOrderBeforeDragRef.current)
    }
    dragStartStatusRef.current = null
    columnOrderBeforeDragRef.current = null
  }

  return (
    <div className="space-y-8">
      <h2 className="font-bold text-lg">Todos</h2>

      {/* Full-bleed board */}
      <div className="full-bleed">
        <div className="md:px-16">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragCancel={handleDragCancel}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-6">
              {STATUSES.map((status) => (
                <KanbanColumn
                  key={status}
                  id={status}
                  title={STATUS_TITLES[status]}
                  itemIds={columnOrder[status]}
                  getTodoById={getTodoById}
                />
              ))}
            </div>

            <DragOverlay>
              {activeId ? (
                <Card title={getTodoById(activeId)?.title ?? ''} dragging />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  )
}

function KanbanColumn(props: {
  id: Status
  title: string
  itemIds: string[]
  getTodoById: (id: string) => Todo | undefined
}) {
  const { setNodeRef, isOver } = useDroppable({ id: props.id })

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 px-1">
        {props.title}
      </div>
      <div
        ref={setNodeRef}
        className={
          'bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 sm:rounded-md p-3 min-h-[240px] transition-shadow' +
          (isOver ? ' ring-2 ring-blue-400' : '')
        }
      >
        <SortableContext items={props.itemIds} strategy={rectSortingStrategy}>
          <div className="space-y-3">
            {props.itemIds.map((id) => {
              const todo = props.getTodoById(id)
              if (!todo) return null
              return <SortableCard key={id} id={id} title={todo.title} />
            })}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}

function SortableCard(props: { id: string; title: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card title={props.title} dragging={isDragging} />
    </div>
  )
}

function Card(props: { title: string; dragging?: boolean }) {
  return (
    <div
      className={
        'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm shadow-sm cursor-grab active:cursor-grabbing select-none' +
        (props.dragging ? ' shadow-md' : '')
      }
    >
      {props.title}
    </div>
  )
}
