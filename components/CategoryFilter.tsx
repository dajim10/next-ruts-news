'use client';

interface CategoryFilterProps {
  categories: Map<number, string>;
  selectedCategories: number[];
  onToggleCategory: (categoryId: number) => void;
}

export default function CategoryFilter({
  categories,
  selectedCategories,
  onToggleCategory,
}: CategoryFilterProps) {
  const categoryArray = Array.from(categories.entries());

  if (categoryArray.length === 0) return null;

  return (
    <div className="mb-4 sm:mb-6">
      <h3 className="mb-2 text-xs font-semibold text-gray-700 sm:mb-3 sm:text-sm dark:text-gray-300">
        กรองตามหมวดหมู่
      </h3>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {categoryArray.map(([id, name]) => (
          <button
            key={id}
            onClick={() => onToggleCategory(id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm ${
              selectedCategories.includes(id)
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
