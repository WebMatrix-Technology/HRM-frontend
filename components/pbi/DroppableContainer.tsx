import { useDroppable } from '@dnd-kit/core';

interface DroppableContainerProps {
    id: string;
    children: React.ReactNode;
    className?: string;
}

export default function DroppableContainer({ id, children, className }: DroppableContainerProps) {
    const { setNodeRef, isOver } = useDroppable({
        id,
    });

    return (
        <div
            ref={setNodeRef}
            className={`${className} ${isOver ? 'bg-slate-100 dark:bg-slate-700/30' : ''} transition-colors rounded-lg`}
        >
            {children}
        </div>
    );
}
