import Header from './Header';
import BottomNav from './BottomNav';

interface PageShellProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
  hideNav?: boolean;
}

export default function PageShell({ title, onBack, rightAction, children, hideNav }: PageShellProps) {
  return (
    <div className="flex flex-col min-h-dvh bg-gradient-to-b from-panel-top to-panel-bottom">
      <Header title={title} onBack={onBack} rightAction={rightAction} />

      <main className="flex-1 overflow-y-auto pb-16">
        {children}
      </main>

      {!hideNav && <BottomNav />}
    </div>
  );
}
