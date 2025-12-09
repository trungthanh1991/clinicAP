import React from 'react';
import { DossierItem, Category } from '../types';
import { CheckCircle2, AlertCircle, FileText, ArrowLeft, Loader2, AlertTriangle, FolderOpen, Download, Search } from 'lucide-react';

interface InspectorViewProps {
  itemId: string; // This is now categoryId
  categories: Category[];
  onBack: () => void;
  isLoading?: boolean;
}

export const InspectorView: React.FC<InspectorViewProps> = ({ itemId: categoryId, categories, onBack, isLoading = false }) => {
  // Find the category by ID
  const foundCategory = categories.find(cat => cat.id === categoryId);
  const [expandedItemId, setExpandedItemId] = React.useState<string | null>(null);
  const [fileSearchTerm, setFileSearchTerm] = React.useState("");
  const [itemSearchTerm, setItemSearchTerm] = React.useState("");

  const handleToggleExpand = (itemId: string) => {
    if (expandedItemId === itemId) {
      setExpandedItemId(null);
    } else {
      setExpandedItemId(itemId);
      setFileSearchTerm("");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-medical-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Đang tải dữ liệu...</h2>
        </div>
      </div>
    );
  }

  if (!foundCategory) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy danh mục</h2>
          <p className="text-gray-600 mb-6">Mã QR không hợp lệ hoặc danh mục này đã bị xóa.</p>
          <button
            onClick={onBack}
            className="w-full bg-medical-600 text-white py-2 px-4 rounded hover:bg-medical-500 transition-colors"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  const items = foundCategory.items || [];
  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(itemSearchTerm.toLowerCase())
  );

  const totalItems = items.length;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const completedItems = items.filter(i => i.status === 'ready').length;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const inProgressItems = items.filter(i => i.status === 'in_progress').length;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const pendingItems = items.filter(i => i.status === 'pending').length;

  const getStatusBadge = (status: DossierItem['status']) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle2 size={12} /> Hoàn thành
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Loader2 size={12} className="animate-spin" /> Đang làm
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <AlertTriangle size={12} /> Chưa làm
          </span>
        );
    }
  };

  return (
    <div className="bg-gray-100 p-2">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Items List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-medical-800 to-medical-600 text-white px-4 py-2">
            <h2 className="font-bold text-sm">{foundCategory.title} ({totalItems} mục)</h2>
          </div>

          <div className="p-2 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm mục..."
                value={itemSearchTerm}
                onChange={(e) => setItemSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:border-medical-500 focus:ring-1 focus:ring-medical-500 outline-none"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              <FolderOpen size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">
                {itemSearchTerm ? "Không tìm thấy mục nào phù hợp." : "Chưa có mục nào."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredItems.map((item, index) => {
                const validAttachments = item.attachments?.filter(a => !a.name.startsWith('Đang tải:')) || [];
                const fileCount = validAttachments.length;
                const isExpanded = expandedItemId === item.id;
                const filteredAttachments = validAttachments.filter(att =>
                  att.name.toLowerCase().includes(fileSearchTerm.toLowerCase())
                );

                return (
                  <div key={item.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div
                      className="flex items-start justify-between gap-3 mb-2 cursor-pointer select-none"
                      onClick={() => handleToggleExpand(item.id)}
                    >
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-medical-100 text-medical-700 flex items-center justify-center font-bold text-xs">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="font-semibold text-gray-800 text-sm">{item.title}</h3>
                          {/* <p className="text-xs text-gray-500">{item.description}</p> */}
                          {fileCount > 0 && (
                            <p className="text-xs text-blue-600 mt-0.5 flex items-center gap-1 font-medium">
                              <FileText size={10} />
                              {fileCount} file đính kèm
                            </p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>

                    {/* Item Details - Only show if expanded */}
                    {isExpanded && (
                      <div className="ml-8 space-y-2 animate-fade-in">
                        {/* Attachments & Search */}
                        {fileCount > 0 && (
                          <div className="mt-2">
                            {/* Search Input */}
                            <div className="relative mb-2">
                              <input
                                type="text"
                                placeholder="Tìm kiếm file..."
                                value={fileSearchTerm}
                                onChange={(e) => setFileSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:border-medical-500 focus:ring-1 focus:ring-medical-500 outline-none"
                              />
                              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>

                            <div className="space-y-1">
                              {filteredAttachments.length > 0 ? (
                                filteredAttachments.map((att) => (
                                  <a
                                    key={att.id}
                                    href={att.url}
                                    download={att.name}
                                    className="flex items-center gap-2 text-xs p-1.5 bg-medical-50 rounded border border-medical-100 hover:bg-medical-100 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <FileText size={12} className="text-medical-500 shrink-0" />
                                    <span className="truncate text-gray-700">{att.name}</span>
                                    <span className="text-gray-400 shrink-0">({(att.size / 1024).toFixed(1)} KB)</span>
                                    <Download size={12} className="text-medical-500 shrink-0 ml-auto" />
                                  </a>
                                ))
                              ) : (
                                <p className="text-xs text-gray-400 italic py-1">Không tìm thấy file nào.</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {item.notes && (
                          <div className="bg-gray-50 p-2 rounded border border-gray-100 mt-2">
                            <p className="text-xs text-gray-600 whitespace-pre-line">{item.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white rounded-lg shadow-md p-3 text-center border border-gray-200">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-medical-600 font-medium flex items-center justify-center gap-1 mx-auto transition-colors text-sm"
          >
            <ArrowLeft size={14} />
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};
