import React from 'react';
import { Button } from '@/components/ui/button';

interface WidgetProps {
  title: string;
  onSplit?: () => void;
}

export function Widget({ title, onSplit }: WidgetProps) {
  return (
    <div className="h-full p-2 border border-gray-200">
      <h3 className="font-bold mb-2">{title}</h3>
      {onSplit && (
        <Button onClick={onSplit} variant="outline" size="sm">
          Split
        </Button>
      )}
    </div>
  );
}
