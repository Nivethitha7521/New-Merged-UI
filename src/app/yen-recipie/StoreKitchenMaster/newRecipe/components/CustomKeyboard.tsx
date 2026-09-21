// newrecipe/components/CustomKeyboard.tsx
import React, { useState, useRef, useEffect } from 'react';

interface CustomKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onClear: () => void;
  value: string;
  type?: 'text' | 'number';
}

export default function CustomKeyboard({ 
  isOpen, 
  onClose, 
  onKeyPress, 
  onDelete, 
  onClear, 
  value,
  type = 'number'
}: CustomKeyboardProps) {
  const [position, setPosition] = useState({ x: 100, y: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showLetters, setShowLetters] = useState(false);
  const [isShift, setIsShift] = useState(false);
  const keyboardRef = useRef<HTMLDivElement>(null);
  const buttonPressedRef = useRef<{ [key: string]: boolean }>({});

  // Handle both mouse and touch dragging
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!keyboardRef.current) return;
    e.preventDefault(); // Prevent default touch behavior
    
    setIsDragging(true);
    
    // Get coordinates from either mouse or touch event
    let clientX, clientY;
    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y
    });
  };

  useEffect(() => {
    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault(); // Prevent scrolling while dragging
      
      // Get coordinates from either mouse or touch event
      let clientX, clientY;
      if ('touches' in e) {
        // Touch event
        if (e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        // Mouse event
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      setPosition({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y
      });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      // Add both mouse and touch event listeners
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove, { passive: false });
      document.addEventListener('touchend', handleDragEnd);
      document.addEventListener('touchcancel', handleDragEnd);
    }

    return () => {
      // Remove both mouse and touch event listeners
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('touchend', handleDragEnd);
      document.removeEventListener('touchcancel', handleDragEnd);
    };
  }, [isDragging, dragStart]);

  if (!isOpen) return null;

  // Number keys
  const numberKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.'];

  // Letter keys layout
  const letterRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  // Get current letters with shift
  const getCurrentLetters = () => {
    if (isShift) {
      return letterRows.map(row => 
        row.map(letter => letter.toUpperCase())
      );
    }
    return letterRows;
  };

  const currentLetters = getCurrentLetters();

  // Single handler for all button presses
  const handleButtonPress = (e: React.MouseEvent | React.TouchEvent, action: () => void, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent double execution on touch devices
    if (buttonPressedRef.current[id]) {
      return;
    }
    
    buttonPressedRef.current[id] = true;
    action();
    
    // Clear the pressed state after a short delay
    setTimeout(() => {
      delete buttonPressedRef.current[id];
    }, 100);
  };

  return (
    <div
      ref={keyboardRef}
      className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-300 w-[500px] select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default',
        touchAction: 'none' // Prevent browser touch actions on the keyboard
      }}
    >
      {/* Drag Handle - with both mouse and touch events */}
      <div 
        className="bg-gray-100 p-2 rounded-t-lg flex justify-between items-center cursor-grab active:cursor-grabbing border-b touch-none"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <span className="text-xs font-medium text-gray-600">⋮⋮ Drag here</span>
        <button 
          onMouseDown={(e) => handleButtonPress(e, onClose, 'close')}
          onTouchStart={(e) => handleButtonPress(e, onClose, 'close')}
          className="text-gray-500 hover:text-gray-700 text-sm px-2"
        >
          ✕
        </button>
      </div>

      {/* Display current value */}
      <div className="p-3 bg-gray-50 border-b">
        <div className="bg-white border rounded p-2 text-right font-mono text-lg min-h-[42px]">
          {value || ' '}
        </div>
      </div>

      {/* Keyboard Type Toggle - Only show for text inputs */}
      {type === 'text' && (
        <div className="flex border-b">
          <button
            onMouseDown={(e) => handleButtonPress(e, () => setShowLetters(false), 'toggle-numbers')}
            onTouchStart={(e) => handleButtonPress(e, () => setShowLetters(false), 'toggle-numbers')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              !showLetters 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            123
          </button>
          <button
            onMouseDown={(e) => handleButtonPress(e, () => setShowLetters(true), 'toggle-letters')}
            onTouchStart={(e) => handleButtonPress(e, () => setShowLetters(true), 'toggle-letters')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              showLetters 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ABC
          </button>
        </div>
      )}

      {/* Keyboard Keys */}
      <div className="p-3">
        {(!showLetters || type === 'number') ? (
          /* Number Keyboard */
          <>
            <div className="grid grid-cols-3 gap-2">
              {numberKeys.map((key) => (
                <button
                  key={key}
                  onMouseDown={(e) => handleButtonPress(e, () => onKeyPress(key), `key-${key}`)}
                  onTouchStart={(e) => handleButtonPress(e, () => onKeyPress(key), `key-${key}`)}
                  className="bg-gray-200 hover:bg-gray-300 p-3 rounded text-lg font-medium active:bg-gray-400"
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onMouseDown={(e) => handleButtonPress(e, onClear, 'clear')}
                onTouchStart={(e) => handleButtonPress(e, onClear, 'clear')}
                className="bg-red-100 hover:bg-red-200 text-red-700 p-3 rounded text-sm font-medium active:bg-red-300"
              >
                Clear
              </button>
              <button
                onMouseDown={(e) => handleButtonPress(e, onDelete, 'delete')}
                onTouchStart={(e) => handleButtonPress(e, onDelete, 'delete')}
                className="bg-gray-300 hover:bg-gray-400 p-3 rounded text-sm font-medium active:bg-gray-500"
              >
                ⌫ Delete
              </button>
            </div>
          </>
        ) : (
          /* Letter Keyboard */
          <>
            {/* Letter Rows */}
            {currentLetters.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1 mb-1 justify-center">
                {row.map((letter) => (
                  <button
                    key={letter}
                    onMouseDown={(e) => handleButtonPress(e, () => onKeyPress(letter), `key-${letter}`)}
                    onTouchStart={(e) => handleButtonPress(e, () => onKeyPress(letter), `key-${letter}`)}
                    className="bg-gray-200 hover:bg-gray-300 w-14 h-14 rounded text-xl font-medium active:bg-gray-400"
                  >
                    {letter}
                  </button>
                ))}
              </div>
            ))}

            {/* Special Keys Row */}
            <div className="flex gap-1 mt-2">
              <button
                onMouseDown={(e) => handleButtonPress(e, () => setIsShift(!isShift), 'shift')}
                onTouchStart={(e) => handleButtonPress(e, () => setIsShift(!isShift), 'shift')}
                className={`px-3 py-4 rounded text-sm font-medium ${
                  isShift 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              >
                ⇧ Shift
              </button>
              <button
                onMouseDown={(e) => handleButtonPress(e, () => onKeyPress(' '), 'space')}
                onTouchStart={(e) => handleButtonPress(e, () => onKeyPress(' '), 'space')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 px-5 py-4 rounded text-sm font-medium active:bg-gray-400"
              >
                Space
              </button>
              <button
                onMouseDown={(e) => handleButtonPress(e, onDelete, 'delete-2')}
                onTouchStart={(e) => handleButtonPress(e, onDelete, 'delete-2')}
                className="px-5 py-4 bg-gray-300 hover:bg-gray-400 rounded text-sm font-medium active:bg-gray-500"
              >
                ⌫
              </button>
            </div>

            {/* Bottom Action Row */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onMouseDown={(e) => handleButtonPress(e, onClear, 'clear-2')}
                onTouchStart={(e) => handleButtonPress(e, onClear, 'clear-2')}
                className="bg-red-100 hover:bg-red-200 text-red-700 p-3 rounded text-sm font-medium active:bg-red-300"
              >
                Clear
              </button>
              <button
                onMouseDown={(e) => handleButtonPress(e, () => {
                  setShowLetters(false);
                  setIsShift(false);
                }, 'switch-to-numbers')}
                onTouchStart={(e) => handleButtonPress(e, () => {
                  setShowLetters(false);
                  setIsShift(false);
                }, 'switch-to-numbers')}
                className="bg-gray-300 hover:bg-gray-400 p-3 rounded text-sm font-medium active:bg-gray-500"
              >
                123
              </button>
            </div>
          </>
        )}

        {/* Done Button (always visible) */}
        <button
          onMouseDown={(e) => handleButtonPress(e, onClose, 'done')}
          onTouchStart={(e) => handleButtonPress(e, onClose, 'done')}
          className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded text-sm font-medium active:bg-blue-700"
        >
          Done
        </button>
      </div>
    </div>
  );
}