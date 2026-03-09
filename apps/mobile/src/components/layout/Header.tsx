interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export default function Header({ title, onBack, rightAction }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex items-center h-12 px-3 safe-top bg-primary text-white shadow-md">
      {onBack ? (
        <button onClick={onBack} className="touch-target mr-2" aria-label="뒤로가기">
          <span className="text-xl">◀</span>
        </button>
      ) : (
        <div className="w-11" />
      )}

      <h1 className="flex-1 text-center text-lg font-bold truncate tracking-wider">
        {title}
      </h1>

      {rightAction ?? <div className="w-11" />}
    </header>
  );
}
