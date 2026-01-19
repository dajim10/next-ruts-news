'use client';

import { ChevronDown } from 'lucide-react';

interface FacultyDropdownProps {
    faculties: string[];
    selectedFaculty: string | null;
    onSelectFaculty: (faculty: string | null) => void;
}

// Decode URL-encoded Thai text
const decodeFacultyName = (slug: string): string => {
    try {
        return decodeURIComponent(slug);
    } catch {
        return slug;
    }
};

export default function FacultyDropdown({
    faculties,
    selectedFaculty,
    onSelectFaculty,
}: FacultyDropdownProps) {
    return (
        <div className="relative">
            <select
                value={selectedFaculty || ''}
                onChange={(e) => onSelectFaculty(e.target.value || null)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-600 sm:w-auto sm:min-w-[200px] sm:py-3"
            >
                <option value="">ทุกคณะ/หน่วยงาน</option>
                {faculties.map((faculty) => (
                    <option key={faculty} value={faculty}>
                        {decodeFacultyName(faculty)}
                    </option>
                ))}
            </select>
            {/* Dropdown Arrow */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
        </div>
    );
}
