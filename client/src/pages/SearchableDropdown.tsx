import { useState, useEffect, useRef } from "react";

interface Option {
  id: string | number;
  name: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string; 
}

export default function SearchableDropdown({ options, value, onChange, placeholder = "Select..." }: Props) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedName = options.find(opt => opt.id.toString() === value)?.name || '';

  const filtered = options.filter(opt =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !(dropdownRef.current as any).contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-[400px] text-black" ref={dropdownRef}>
      <input
        type="text"
        placeholder={placeholder}
        value={isOpen ? search : selectedName}
        onClick={() => {
          setIsOpen(true);
          setSearch('');
        }}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {isOpen && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white border border-gray-300 shadow-md">
          {filtered.length > 0 ? (
            filtered.map((opt) => (
              <li
                key={opt.id}
                className="px-4 py-2 hover:bg-blue-500 hover:text-white cursor-pointer"
                onClick={() => {
                  onChange(opt.id.toString());
                  setSearch('');
                  setIsOpen(false);
                }}
              >
                {opt.name}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-gray-500">No results found</li>
          )}
        </ul>
      )}
    </div>
  );
}
