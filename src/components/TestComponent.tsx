/* 測試文件 - 檢查 Tailwind CSS 是否正常工作 */
import React from 'react';

export const TestComponent: React.FC = () => {
  return (
    <div className="p-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
      <h1 className="text-4xl font-bold mb-4">Tailwind CSS 測試</h1>
      <div className="bg-white text-black p-4 rounded-lg shadow-lg">
        <p>如果你看到這個有顏色的框框，說明 Tailwind CSS 正常工作</p>
      </div>
    </div>
  );
};
