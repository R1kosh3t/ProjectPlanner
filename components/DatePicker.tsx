import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  onClose: () => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, onClose }) => {
  const { language } = useTranslation();
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';
  const ref = useRef<HTMLDivElement>(null);

  const initialDate = useMemo(() => {
    return value ? new Date(`${value}T00:00:00`) : new Date();
  }, [value]);
  
  const [viewDate, setViewDate] = useState(initialDate);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const calendarGrid = useMemo(() => {
    const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    
    // In many locales, Sunday is the first day of the week (0). We want Monday to be the first.
    const startDayOfWeek = (startOfMonth.getDay() + 6) % 7; // 0 = Monday, 6 = Sunday
    
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        days.push(day);
    }
    return days;
  }, [viewDate]);

  const dayNames = useMemo(() => {
    const names = [];
    const date = new Date(2023, 0, 2); // A known Monday
    for (let i = 0; i < 7; i++) {
        names.push(date.toLocaleDateString(locale, { weekday: 'short' }));
        date.setDate(date.getDate() + 1);
    }
    return names;
  }, [locale]);
  
  const changeMonth = (offset: number) => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const handleDayClick = (day: Date) => {
    const year = day.getFullYear();
    const month = (day.getMonth() + 1).toString().padStart(2, '0');
    const date = day.getDate().toString().padStart(2, '0');
    onChange(`${year}-${month}-${date}`);
  };

  const selectedDate = value ? new Date(`${value}T00:00:00`) : null;

  return (
    <div ref={ref} className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-4 w-72">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h3 className="text-sm font-semibold text-white capitalize">
          {viewDate.toLocaleString(locale, { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
        {dayNames.map(name => <div key={name} className="p-1">{name}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 mt-2">
        {calendarGrid.map((day, index) => {
          const isCurrentMonth = day.getMonth() === viewDate.getMonth();
          const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <button
              key={index}
              onClick={() => handleDayClick(day)}
              className={`
                w-9 h-9 rounded-full text-sm transition-colors
                ${isCurrentMonth ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-700'}
                ${isSelected ? '!bg-indigo-600 text-white' : ''}
                ${isToday && !isSelected ? 'border border-gray-600' : ''}
              `}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DatePicker;
