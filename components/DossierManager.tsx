import React, { useState } from 'react';
import { Category, DossierItem, Attachment } from '../types';
import { suggestItemImprovement } from '../services/geminiService';
import { r2Service } from '../services/r2Service';
import {
    FolderOpen,
    Plus,
    Trash2,
    QrCode,
    Loader2,
    ChevronRight,
    CheckCircle,
    AlertTriangle,
    Sparkles,
    Save,
    ArrowLeft,
    Edit2,
    Upload,
    X,
    FileText
} from 'lucide-react';

interface DossierManagerProps {
    categories: Category[];
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    onGenerateQR: (itemId: string) => void;
}

export const DossierManager: React.FC<DossierManagerProps> = ({ categories, setCategories, onGenerateQR }) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<DossierItem | null>(null);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [uploadingCount, setUploadingCount] = useState(0);

    // States for category management
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [tempCategoryTitle, setTempCategoryTitle] = useState("");

    const handleAddCategory = () => {
        const newCat: Category = {
            id: `cat-${Date.now()}`,
            title: "Danh mục mới",
            items: []
        };
        setCategories(prev => [...prev, newCat]);
        // Set edit mode immediately so user can rename it
        setEditingCategoryId(newCat.id);
        setTempCategoryTitle("Danh mục mới");
        // We do NOT auto-select here to keep mobile users on the list view for renaming
    };

    const saveCategoryTitle = (id: string) => {
        if (!tempCategoryTitle.trim()) return;
        setCategories(prev => prev.map(c => c.id === id ? { ...c, title: tempCategoryTitle } : c));
        setEditingCategoryId(null);
    };

    const handleDeleteCategory = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này và tất cả hồ sơ bên trong?")) {
            setCategories(prev => prev.filter(c => c.id !== id));
            if (selectedCategory === id) setSelectedCategory(null);
        }
    };

    const handleDeleteItem = (itemId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Bạn có chắc chắn muốn xóa mục này?")) {
            setCategories(prev => prev.map(cat => ({
                ...cat,
                items: (cat.items || []).filter(item => item.id !== itemId)
            })));
            if (editingItem?.id === itemId) setEditingItem(null);
        }
    };

    const handleUpdateItem = (updatedItem: DossierItem) => {
        setCategories(prev => prev.map(cat => ({
            ...cat,
            items: (cat.items || []).map(item => item.id === updatedItem.id ? updatedItem : item)
        })));
        setEditingItem(null);
    };

    const handleAiSuggest = async () => {
        if (!editingItem) return;
        setIsSuggesting(true);
        const suggestion = await suggestItemImprovement(editingItem.title, editingItem.notes);
        setEditingItem(prev => prev ? { ...prev, notes: prev.notes + '\n\n--- Gợi ý AI ---\n' + suggestion } : null);
        setIsSuggesting(false);
    };

    const activeCategory = categories.find(c => c.id === selectedCategory);

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
            {/* Sidebar - Category List */}
            {/* Logic: On Mobile, hide sidebar if a category is selected (drill down). On Desktop, always show. */}
            <div className={`${selectedCategory ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex-col h-full`}>
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                    <h2 className="font-bold text-gray-700">Danh mục hồ sơ</h2>
                    <button
                        onClick={handleAddCategory}
                        className="text-xs bg-medical-600 text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-medical-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-3 h-3" />
                        Thêm danh mục
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {categories.length === 0 && (
                        <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center">
                            <FolderOpen size={32} className="mb-2 opacity-20" />
                            Chưa có danh mục nào.<br />Hãy nhấn "Thêm danh mục".
                        </div>
                    )}
                    {categories.map(cat => {
                        const items = cat.items || [];
                        const total = items.length;
                        const completed = items.filter(i => i.status === 'ready').length;
                        const progress = total === 0 ? 0 : (completed / total) * 100;

                        return (
                            <div
                                key={cat.id}
                                onClick={() => {
                                    if (!editingCategoryId) {
                                        setSelectedCategory(cat.id);
                                        setEditingItem(null);
                                    }
                                }}
                                className={`w-full text-left p-4 md:p-3 rounded-lg border transition-all cursor-pointer group ${selectedCategory === cat.id
                                    ? 'bg-medical-50 border-medical-500 shadow-sm'
                                    : 'bg-white border-transparent hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    {editingCategoryId === cat.id ? (
                                        <input
                                            autoFocus
                                            className="flex-1 font-medium text-gray-900 bg-white border border-medical-300 rounded px-1 py-0.5 outline-none focus:ring-2 focus:ring-medical-200"
                                            value={tempCategoryTitle}
                                            onChange={e => setTempCategoryTitle(e.target.value)}
                                            onBlur={() => saveCategoryTitle(cat.id)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') saveCategoryTitle(cat.id);
                                            }}
                                            onClick={e => e.stopPropagation()}
                                        />
                                    ) : (
                                        <span className={`font-medium truncate flex-1 ${selectedCategory === cat.id ? 'text-medical-900' : 'text-gray-700'}`}>
                                            {cat.title}
                                        </span>
                                    )}

                                    <div className="flex items-center gap-1 ml-2">
                                        {/* QR Button */}
                                        {!editingCategoryId && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onGenerateQR(cat.id);
                                                }}
                                                className="p-1.5 text-medical-600 hover:text-medical-700 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity rounded-full hover:bg-medical-50"
                                                title="Tạo mã QR"
                                            >
                                                <QrCode size={14} />
                                            </button>
                                        )}
                                        {/* Edit Button */}
                                        {!editingCategoryId && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingCategoryId(cat.id);
                                                    setTempCategoryTitle(cat.title);
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-medical-600 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity rounded-full hover:bg-medical-50"
                                                title="Đổi tên"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        )}
                                        {/* Delete Button */}
                                        {!editingCategoryId && (
                                            <button
                                                onClick={(e) => handleDeleteCategory(cat.id, e)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity rounded-full hover:bg-red-50"
                                                title="Xóa danh mục"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                        <ChevronRight size={16} className={`hidden md:block ${selectedCategory === cat.id ? 'text-medical-500' : 'text-gray-300'}`} />
                                    </div>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                                    <div
                                        className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs text-gray-400 mt-1 text-right">{completed}/{total} hoàn thành</div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Main Content - Item List or Editor */}
            {/* Logic: On Mobile, hide main content if NO category is selected. On Desktop, always show. */}
            <div className={`${!selectedCategory ? 'hidden md:flex' : 'flex'} flex-1 flex-col h-full overflow-hidden relative`}>
                {!activeCategory ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                        <FolderOpen size={64} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium text-gray-500">Chưa chọn danh mục</p>
                        <p className="text-sm">Vui lòng chọn một danh mục từ cột bên trái để xem chi tiết.</p>
                    </div>
                ) : editingItem ? (
                    // Editor View
                    <div className="flex-1 flex flex-col h-full bg-white animate-fade-in z-20">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0 bg-white sticky top-0 z-10 shadow-sm">
                            <button onClick={() => setEditingItem(null)} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                                <ArrowLeft size={16} /> <span className="hidden sm:inline">Quay lại</span>
                            </button>
                            <div className="font-bold text-gray-800 truncate max-w-[50%]">Chi tiết hồ sơ</div>
                            <button
                                onClick={() => handleUpdateItem(editingItem)}
                                disabled={uploadingCount > 0}
                                className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 font-medium shadow-sm transition-colors ${uploadingCount > 0
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : 'bg-medical-600 text-white hover:bg-medical-700'
                                    }`}
                            >
                                {uploadingCount > 0 ? (
                                    <><Loader2 size={16} className="animate-spin" /> Đang tải ({uploadingCount})...</>
                                ) : (
                                    <><Save size={16} /> Lưu</>
                                )}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
                            <div className="max-w-2xl mx-auto space-y-6 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên mục hồ sơ</label>
                                    <input
                                        type="text"
                                        value={editingItem.title}
                                        onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-medical-500 outline-none transition-shadow"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                                    <div className="flex gap-2">
                                        {(['pending', 'in_progress', 'ready'] as const).map(status => (
                                            <button
                                                key={status}
                                                onClick={() => setEditingItem({ ...editingItem, status })}
                                                className={`flex-1 py-2 text-sm rounded-md border transition-all ${editingItem.status === status
                                                    ? status === 'ready' ? 'bg-green-50 border-green-500 text-green-700 font-semibold'
                                                        : status === 'in_progress' ? 'bg-yellow-50 border-yellow-500 text-yellow-700 font-semibold'
                                                            : 'bg-gray-100 border-gray-400 text-gray-700 font-semibold'
                                                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {status === 'ready' ? 'Đã xong' : status === 'in_progress' ? 'Đang làm' : 'Chưa làm'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tài liệu đính kèm</label>

                                    {/* File Upload Button */}
                                    <div className="mb-3">
                                        <input
                                            type="file"
                                            multiple
                                            onChange={async (e) => {
                                                const files = e.target.files;
                                                if (!files) return;

                                                for (const file of Array.from(files) as File[]) {
                                                    const tempId = `temp-${Date.now()}-${Math.random()}`;
                                                    try {
                                                        // Increment uploading count
                                                        setUploadingCount(prev => prev + 1);

                                                        // Show uploading state
                                                        setEditingItem(prev => prev ? {
                                                            ...prev,
                                                            attachments: [...(prev.attachments || []), {
                                                                id: tempId,
                                                                name: `Đang tải: ${file.name}...`,
                                                                size: file.size,
                                                                type: file.type,
                                                                key: '',
                                                                url: ''
                                                            }]
                                                        } : null);

                                                        // Upload to R2
                                                        const uploaded = await r2Service.uploadFile(file);

                                                        // Replace temp with actual
                                                        setEditingItem(prev => prev ? {
                                                            ...prev,
                                                            attachments: prev.attachments?.map(a =>
                                                                a.id === tempId ? {
                                                                    id: uploaded.key,
                                                                    name: uploaded.name,
                                                                    size: uploaded.size,
                                                                    type: uploaded.type,
                                                                    key: uploaded.key,
                                                                    url: uploaded.url
                                                                } : a
                                                            )
                                                        } : null);
                                                    } catch (error) {
                                                        console.error('Upload failed:', error);
                                                        alert(`Lỗi tải file ${file.name}`);
                                                        // Remove temp attachment on error
                                                        setEditingItem(prev => prev ? {
                                                            ...prev,
                                                            attachments: prev.attachments?.filter(a => a.id !== tempId)
                                                        } : null);
                                                    } finally {
                                                        // Decrement uploading count
                                                        setUploadingCount(prev => prev - 1);
                                                    }
                                                }
                                                e.target.value = '';
                                            }}
                                            className="hidden"
                                            id="file-upload"
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-medical-50 text-medical-700 border border-medical-200 rounded-lg cursor-pointer hover:bg-medical-100 transition-colors"
                                        >
                                            <Upload size={18} />
                                            Chọn file tải lên
                                        </label>
                                        <span className="text-xs text-gray-400 ml-2">Có thể chọn nhiều file</span>
                                    </div>

                                    {/* List of uploaded files */}
                                    {editingItem.attachments && editingItem.attachments.length > 0 && (
                                        <div className="space-y-2">
                                            {editingItem.attachments.map((att) => (
                                                <div key={att.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                                    <FileText size={16} className="text-medical-500 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-700 truncate">{att.name}</p>
                                                        <p className="text-xs text-gray-400">
                                                            {(att.size / 1024).toFixed(1)} KB
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={async () => {
                                                            if (att.key) {
                                                                try {
                                                                    await r2Service.deleteFile(att.key);
                                                                } catch (e) {
                                                                    console.error('Delete from R2 failed:', e);
                                                                }
                                                            }
                                                            setEditingItem(prev => prev ? {
                                                                ...prev,
                                                                attachments: prev.attachments?.filter(a => a.id !== att.id)
                                                            } : null);
                                                        }}
                                                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                        title="Xóa file"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {(!editingItem.attachments || editingItem.attachments.length === 0) && (
                                        <p className="text-sm text-gray-400 italic">Chưa có file nào được tải lên</p>
                                    )}
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-medium text-gray-700">Ghi chú & Giải trình</label>
                                        <button
                                            onClick={handleAiSuggest}
                                            disabled={isSuggesting}
                                            className="text-xs bg-purple-50 px-2 py-1 rounded-full flex items-center gap-1 text-purple-600 hover:bg-purple-100 transition-colors"
                                        >
                                            {isSuggesting ? <Loader2 className="animate-spin w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                                            Gợi ý nội dung
                                        </button>
                                    </div>
                                    <textarea
                                        rows={8}
                                        value={editingItem.notes}
                                        onChange={e => setEditingItem({ ...editingItem, notes: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-medical-500 outline-none"
                                        placeholder="Ghi chú chi tiết về mục này..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // List View (Items within Category)
                    <div className="flex-1 flex flex-col h-full animate-fade-in">
                        {/* Mobile Back Header */}
                        <div className="md:hidden bg-white p-3 border-b border-gray-200 flex items-center gap-2 sticky top-0 z-10 shadow-sm">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className="p-1 rounded-full hover:bg-gray-100 text-gray-600"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <h2 className="font-bold text-gray-800 text-lg truncate">{activeCategory.title}</h2>
                        </div>

                        {/* Desktop Header */}
                        <div className="hidden md:block p-6 bg-white border-b border-gray-200 shadow-sm shrink-0">
                            <h2 className="text-xl font-bold text-gray-800">{activeCategory.title}</h2>
                            <p className="text-gray-500 text-sm mt-1">Quản lý các mục trong danh mục này.</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 bg-gray-50">
                            {(!activeCategory.items || activeCategory.items.length === 0) && (
                                <div className="text-center py-10 text-gray-400">
                                    <p>Chưa có mục nào trong danh mục này.</p>
                                </div>
                            )}
                            {(activeCategory.items || []).map((item) => (
                                <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1" onClick={() => setEditingItem(item)}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-800 text-base">{item.title}</h3>
                                            {item.status === 'ready' && <CheckCircle size={16} className="text-green-500 shrink-0" />}
                                            {item.status === 'in_progress' && <Loader2 size={16} className="text-yellow-500 animate-spin-slow shrink-0" />}
                                            {item.status === 'pending' && <AlertTriangle size={16} className="text-gray-300 shrink-0" />}
                                        </div>
                                        {/* <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p> */}
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
                                        <button
                                            onClick={() => setEditingItem(item)}
                                            className="px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded hover:bg-gray-100 transition-colors text-sm font-medium flex-1 sm:flex-none text-center"
                                        >
                                            Chi tiết
                                        </button>

                                        <button
                                            onClick={(e) => handleDeleteItem(item.id, e)}
                                            className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded border border-red-200"
                                            title="Xóa mục"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={() => {
                                    const newItem: DossierItem = {
                                        id: `item-${Date.now()}`,
                                        title: "Mục mới",
                                        description: "Mô tả mục mới",
                                        status: 'pending',
                                        notes: ''
                                    };
                                    const updatedCategory = {
                                        ...activeCategory,
                                        items: [...(activeCategory.items || []), newItem]
                                    };
                                    setCategories(prev => prev.map(c => c.id === activeCategory.id ? updatedCategory : c));
                                    setEditingItem(newItem);
                                }}
                                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-medical-400 hover:text-medical-500 flex items-center justify-center gap-2 transition-colors bg-white mt-4"
                            >
                                <Plus size={20} /> Thêm mục mới
                            </button>

                            {/* Spacer for bottom scrolling */}
                            <div className="h-4"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};