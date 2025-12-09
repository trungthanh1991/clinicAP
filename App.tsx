import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { DossierManager } from './components/DossierManager';
import { InspectorView } from './components/InspectorView';
import { Category } from './types';
import { Stethoscope, X, Share2, Download, Cloud } from 'lucide-react';
import { subscribeToCategories, saveCategoriesToFirebase } from './services/firebase';

const AppContent: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [qrItem, setQrItem] = useState<{ id: string, title: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Load data from Firebase
  useEffect(() => {
    const unsubscribe = subscribeToCategories((data) => {
      setCategories(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Custom setter that updates both local state and Firebase
  // This allows DossierManager to work with existing logic while persisting to DB
  const handleSetCategories: React.Dispatch<React.SetStateAction<Category[]>> = (action) => {
    setCategories(prev => {
      const newData = typeof action === 'function' ? action(prev) : action;
      saveCategoriesToFirebase(newData);
      return newData;
    });
  };

  const handleGenerateQR = (categoryId: string) => {
    if (categoryId === 'all_categories') {
      setQrItem({ id: 'all_categories', title: "Toàn bộ danh mục" });
      return;
    }
    const category = categories.find(cat => cat.id === categoryId);
    const categoryTitle = category ? category.title : "";
    setQrItem({ id: categoryId, title: categoryTitle });
  };

  const QRModal = () => {
    if (!qrItem) return null;

    // We use a hash URL for the simulated inspector view
    const viewUrl = `${window.location.origin}${window.location.pathname}#/inspect/${qrItem.id}`;
    // Using a reliable public API for QR generation to ensure it works without npm packages
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(viewUrl)}&color=0284c7`;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
          <div className="bg-medical-900 p-4 flex justify-between items-center text-white">
            <h3 className="font-bold">Mã QR Kiểm tra</h3>
            <button onClick={() => setQrItem(null)} className="hover:bg-white/20 p-1 rounded">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 flex flex-col items-center">
            <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-inner mb-4">
              <img src={qrImageUrl} alt="QR Code" className="w-48 h-48 object-contain" />
            </div>
            <p className="text-center font-semibold text-gray-800 mb-1">{qrItem.title}</p>
            <p className="text-center text-xs text-gray-500 break-all px-4">{viewUrl}</p>

            <div className="flex gap-2 mt-6 w-full">
              <button
                onClick={() => {
                  // Simulate download
                  const link = document.createElement('a');
                  link.href = qrImageUrl;
                  link.download = `QR-${qrItem.id}.png`;
                  // Note: Direct download from cross-origin might be blocked by browser without backend proxy, 
                  // but usually works for simple image display or right-click save.
                  // For this demo, we'll just open it in new tab if download fails logic.
                  window.open(qrImageUrl, '_blank');
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded text-sm font-medium flex items-center justify-center gap-1"
              >
                <Download size={16} /> Tải ảnh
              </button>
              <button
                onClick={() => {
                  navigate(`/inspect/${qrItem.id}`);
                  setQrItem(null);
                }}
                className="flex-1 bg-medical-600 hover:bg-medical-700 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-1"
              >
                <Share2 size={16} /> Xem thử
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 md:px-6 shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-2 text-medical-600">
          <div className="bg-medical-100 p-2 rounded-lg">
            <Stethoscope size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-800">ClinicCheck</h1>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {isLoading ? (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Cloud size={14} className="animate-pulse" /> Đang đồng bộ...
            </span>
          ) : (
            <span className="text-xs text-green-600 flex items-center gap-1 font-medium">
              <Cloud size={14} /> Đã kết nối
            </span>
          )}
          <div className="text-sm text-gray-500 hidden md:block pl-3 border-l">
            Hệ thống thẩm định phòng khám 4.0
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={
          <DossierManager
            categories={categories}
            setCategories={handleSetCategories}
            onGenerateQR={handleGenerateQR}
          />
        } />
        <Route path="/inspect/:itemId" element={<InspectorRouteWrapper categories={categories} isLoading={isLoading} />} />
      </Routes>

      {qrItem && <QRModal />}
    </div>
  );
};

// Wrapper to handle params for inspector
const InspectorRouteWrapper = ({ categories, isLoading }: { categories: Category[], isLoading: boolean }) => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // Check if we came from the all_categories view
    // @ts-ignore - location.state is loosely typed
    if (location.state?.fromAll) {
      navigate('/inspect/all_categories');
    } else {
      navigate('/');
    }
  };

  return <InspectorView itemId={itemId || ''} categories={categories} onBack={handleBack} isLoading={isLoading} />;
}

import { ErrorBoundary } from './components/ErrorBoundary';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </ErrorBoundary>
  );
};

export default App;