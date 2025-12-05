import React from 'react';
import { Button } from './Button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  gridConfig?: {
    cols: { sm: number; md: number; lg: number; xl: number };
    rows?: number; // 預設每頁顯示的行數
  };
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  gridConfig
}) => {
  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // 計算基於 grid 佈局的合理分頁選項
  const getPageSizeOptions = () => {
    if (!gridConfig) {
      // 預設選項（用於非 grid 佈局）
      return [5, 10, 20, 50];
    }

    const { cols } = gridConfig;
    const options = [
      cols.sm * 2,      // 小屏幕 2 行
      cols.md * 2,      // 中屏幕 2 行  
      cols.lg * 3,      // 大屏幕 3 行
      cols.xl * 3,      // 超大屏幕 3 行
      cols.xl * 5,      // 超大屏幕 5 行
    ];

    // 去重並排序
    return [...new Set(options)].sort((a, b) => a - b);
  };

  const pageSizeOptions = getPageSizeOptions();

  console.log('Pagination component debug:', {
    totalCount,
    pageSize,
    totalPages,
    currentPage,
    startItem,
    endItem
  });

  const generatePageNumbers = () => {
    const pages = [];
    const showPages = 5; // 顯示的頁數
    
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);
    
    // 調整起始頁以確保顯示足夠的頁數
    if (endPage - startPage + 1 < showPages) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  // Always show pagination if there are items (temporarily disable the totalPages <= 1 check)
  // if (totalPages <= 1) return null;

  if (totalCount === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sm:px-6 gap-4">
      {/* 統計信息和控制項 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
        <div className="flex items-center">
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
            顯示 <span className="font-medium">{startItem}</span> 到{' '}
            <span className="font-medium">{endItem}</span> 筆，共{' '}
            <span className="font-medium">{totalCount}</span> 筆結果
          </p>
        </div>

        {/* 每頁筆數選擇 */}
        <div className="flex items-center space-x-2">
          <label htmlFor="pageSize" className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
            每頁顯示：
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border-2 border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 pr-8 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-[80px] cursor-pointer"
          >
            {pageSizeOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 分頁控制 */}
      <div className="flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-end overflow-x-auto pb-2 sm:pb-0">
        {/* 上一頁 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex items-center space-x-2 px-3 py-2 min-w-[80px] justify-center"
        >
          <ChevronLeftIcon className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">上一頁</span>
        </Button>

        {/* 頁碼 */}
        <div className="flex items-center space-x-1">
          {/* 第一頁 */}
          {currentPage > 3 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(1)}
                className="min-w-[40px] h-[36px] px-3 flex items-center justify-center"
              >
                1
              </Button>
              {currentPage > 4 && (
                <span className="text-gray-500 dark:text-gray-400 px-2 flex items-center">...</span>
              )}
            </>
          )}

          {/* 當前頁面附近的頁碼 */}
          {generatePageNumbers().map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "primary" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className="min-w-[40px] h-[36px] px-3 flex items-center justify-center"
            >
              {page}
            </Button>
          ))}

          {/* 最後一頁 */}
          {currentPage < totalPages - 2 && (
            <>
              {currentPage < totalPages - 3 && (
                <span className="text-gray-500 dark:text-gray-400 px-2 flex items-center">...</span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
                className="min-w-[40px] h-[36px] px-3 flex items-center justify-center"
              >
                {totalPages}
              </Button>
            </>
          )}
        </div>

        {/* 下一頁 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex items-center space-x-2 px-3 py-2 min-w-[80px] justify-center"
        >
          <span className="text-sm">下一頁</span>
          <ChevronRightIcon className="w-4 h-4 flex-shrink-0" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
