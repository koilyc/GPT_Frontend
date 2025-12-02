import React, { useState, useCallback } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { SearchIcon, XIcon } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  defaultValue?: string;
  debounceMs?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "搜尋...",
  onSearch,
  onClear,
  defaultValue = "",
  debounceMs = 300
}) => {
  const [searchQuery, setSearchQuery] = useState(defaultValue);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  const debouncedSearch = useCallback((query: string) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    setTimeoutId(newTimeoutId);
  }, [onSearch, debounceMs, timeoutId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
    if (onClear) {
      onClear();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    onSearch(searchQuery);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
        <Input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XIcon className="w-4 h-4" />
          </Button>
        )}
      </div>
    </form>
  );
};

export default SearchBar;
