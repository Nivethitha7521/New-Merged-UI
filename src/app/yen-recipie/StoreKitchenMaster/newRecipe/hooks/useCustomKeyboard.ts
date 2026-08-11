// newrecipe/hooks/useCustomKeyboard.ts
import { useState, useCallback } from 'react';
import { useIsAndroid } from './useIsAndroid';

export const useCustomKeyboard = () => {
  const isAndroid = useIsAndroid();

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [activeInputId, setActiveInputId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [inputType, setInputType] = useState<'text' | 'number'>('text');

  const openKeyboard = useCallback((id: string, currentValue: string = '', type: 'text' | 'number' = 'text') => {
    // ← Desktop/Windows: never open the on-screen keyboard.
    if (!isAndroid) return;
    setActiveInputId(id);
    setInputValue(currentValue);
    setInputType(type);
    setIsKeyboardOpen(true);
  }, [isAndroid]);

  const closeKeyboard = useCallback(() => {
    setIsKeyboardOpen(false);
    setActiveInputId(null);
    // setInputValue('');
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    setInputValue(prev => {
      const newValue = prev + key;
      return newValue;
    });
  }, []);

  const handleDelete = useCallback(() => {
    setInputValue(prev => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setInputValue('');
  }, []);

  /**
   * Returns the right input props for the current platform, so you don't
   * need an if/else at every <input> call site.
   *
   * Android:  readOnly input, tapping it opens the custom on-screen keyboard.
   * Desktop:  normal input — native focus, native typing, onChange fires
   *           directly, custom keyboard never engages.
   */
  const getInputProps = useCallback(
    (
      id: string,
      value: string,
      onChangeValue: (val: string) => void,
      type: 'text' | 'number' = 'text'
    ) => {
      if (isAndroid) {
        return {
          value,
          readOnly: true,
          onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
            e.target.blur();
            openKeyboard(id, value, type);
          },
        };
      }
      return {
        value,
        readOnly: false,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChangeValue(e.target.value),
      };
    },
    [isAndroid, openKeyboard]
  );

  return {
    isAndroid,
    isKeyboardOpen,
    activeInputId,
    inputValue,
    inputType,
    openKeyboard,
    closeKeyboard,
    handleKeyPress,
    handleDelete,
    handleClear,
    getInputProps,
  };
};