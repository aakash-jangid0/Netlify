import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFilterClick: () => void;
}

function SearchBar({ value, onChange, onFilterClick }: SearchBarProps) {
  return (
    <div className="relative flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search menu items..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>
      <button
        onClick={onFilterClick}
        className="flex items-center justify-center px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
      >
        <SlidersHorizontal className="w-5 h-5" />
      </button>
    </div>
  );
}

export default SearchBar;