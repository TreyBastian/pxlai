import React from 'react';
import ReactDOM from 'react-dom';

interface DialogPortalProps {
  children: React.ReactNode;
  isOpen: boolean;
}

export function DialogPortal({ children, isOpen }: DialogPortalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return ReactDOM.createPortal(
    isOpen ? (
      <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 10000 }}>
        <div className="fixed inset-0 bg-black bg-opacity-50" />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    ) : null,
    document.body
  );
}