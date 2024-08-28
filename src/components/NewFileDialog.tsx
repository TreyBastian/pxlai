import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogPortal } from './DialogPortal';

interface NewFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNewFile: (width: number, height: number, name: string) => void;
}

export function NewFileDialog({ isOpen, onClose, onCreateNewFile }: NewFileDialogProps) {
  const [width, setWidth] = useState('800');
  const [height, setHeight] = useState('600');
  const [name, setName] = useState('Untitled');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateNewFile(Number(width), Number(height), name);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal isOpen={isOpen}>  {/* Pass isOpen prop here */}
        <DialogContent className="sm:max-w-[425px]" style={{ zIndex: 100000 }}>
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
            <DialogDescription>
              Enter the dimensions and name for your new canvas.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="width" className="text-right">
                  Width
                </Label>
                <Input
                  id="width"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="height" className="text-right">
                  Height
                </Label>
                <Input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}