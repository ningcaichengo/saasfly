"use client";

import { useState, useEffect } from "react";
import { Button } from "@saasfly/ui/button";
import { Card } from "@saasfly/ui/card";
import * as Icons from "@saasfly/ui/icons";

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastProps extends Toast {
  onClose: (id: string) => void;
}

export function ToastComponent({ id, message, type, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Icons.Check className="h-5 w-5 text-emerald-600" />;
      case 'error':
        return <Icons.Close className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <Icons.Warning className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Icons.Help className="h-5 w-5 text-blue-600" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200 text-emerald-900';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  return (
    <Card className={`flex items-center gap-3 p-4 shadow-lg animate-in slide-in-from-right-5 duration-300 ${getColorClasses()}`}>
      {getIcon()}
      <p className="flex-1 text-sm font-medium">{message}</p>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onClose(id)}
        className="h-6 w-6 p-0 hover:bg-white/20"
      >
        <Icons.Close className="h-4 w-4" />
      </Button>
    </Card>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}