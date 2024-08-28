import React from 'react';
import ReactDOM from 'react-dom';

interface DialogPortalProps {
  children: React.ReactNode;
  isOpen: boolean;  // Add this prop
}

export function DialogPortal({ children, isOpen }: DialogPortalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !isOpen) return null;  // Only render when mounted and open

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 99999 }}>
      {children}
    </div>,
    document.body
  );
}