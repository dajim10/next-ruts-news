'use client';

interface FacultyFilterProps {
  faculties: string[];
  selectedFaculty: string | null;
  onSelectFaculty: (faculty: string | null) => void;
}

// Decode URL-encoded Thai text and map to readable names
const decodeFacultyName = (slug: string): string => {
  try {
    // Try to decode URL-encoded text
    const decoded = decodeURIComponent(slug);
    return decoded;
  } catch {
    return slug;
  }
};

export default function FacultyFilter({
  faculties,
  selectedFaculty,
  onSelectFaculty,
}: FacultyFilterProps) {
  return (
    <div className="mb-4 sm:mb-6">
      <h3 className="mb-2 text-xs font-semibold text-gray-700 sm:mb-3 sm:text-sm dark:text-gray-300">
        กรองตามคณะ
      </h3>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        <button
          onClick={() => onSelectFaculty(null)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm ${selectedFaculty === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
        >
          ทั้งหมด
        </button>
        {faculties.map((faculty) => (
          <button
            key={faculty}
            onClick={() => onSelectFaculty(faculty)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm ${selectedFaculty === faculty
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
          >
            {decodeFacultyName(faculty)}
          </button>
        ))}
      </div>
    </div>
  );
}
