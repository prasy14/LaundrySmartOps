import React from "react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  totalItems: number;
  label: string;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  label,
}) => {
  return (
    <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground px-2">
      <span>
        Total {label}: <strong>{totalItems}</strong>
      </span>
      <span>
        Page {currentPage} of {totalPages}
        <button
          className="ml-4 text-blue-600 disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Prev
        </button>
        <button
          className="ml-2 text-blue-600 disabled:opacity-50"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </button>
      </span>
    </div>
  );
};

export default PaginationControls;
