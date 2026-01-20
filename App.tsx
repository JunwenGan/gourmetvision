import React, { useState, useEffect, useRef } from 'react';
import { Dish } from './types';
import { parseMenuImage, generateDishPhoto } from './services/geminiService';
import DishCard from './components/DishCard';

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);
  
  const [menuImage, setMenuImage] = useState<string | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mobile Tab State: 'photos' or 'menu'
  const [activeTab, setActiveTab] = useState<'photos' | 'menu'>('photos');

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      try {
        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
        } else {
          setHasApiKey(true);
        }
      } catch (e) {
        console.error("Error checking API key:", e);
      } finally {
        setIsCheckingKey(false);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        setHasApiKey(true);
      }
    } catch (e) {
      console.error("Error selecting API key:", e);
      setError("Failed to select API key. Please try again.");
    }
  };

  const processImage = async (base64Data: string) => {
    setError(null);
    setIsAnalyzing(true);
    setActiveTab('photos');
    
    try {
        // Send to Gemini to parse
        const rawBase64 = base64Data.split(',')[1]; // Remove header
        const result = await parseMenuImage(rawBase64);
        
        const newDishes: Dish[] = result.dishes.map((d, index) => ({
          id: `dish-${index}-${Date.now()}`,
          originalName: d.originalName,
          englishTranslation: d.englishTranslation,
          description: d.ingredientsOrDescription,
          price: d.price,
          category: d.category,
          isLoadingImage: false, // Don't load immediately, wait for scroll
          hasAttemptedGeneration: false,
        }));
        
        setDishes(newDishes);
      } catch (err) {
        setError("Failed to analyze the menu. Please try a clearer image.");
        console.error(err);
      } finally {
        setIsAnalyzing(false);
      }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setMenuImage(base64);
      processImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    setError(null);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    } catch (err) {
        console.error("Camera error:", err);
        setError("Unable to access camera. Please allow permissions.");
        setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
      }
      setIsCameraOpen(false);
  };

  const capturePhoto = () => {
      if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext('2d');
          if (context) {
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              const base64 = canvas.toDataURL('image/jpeg');
              setMenuImage(base64);
              stopCamera();
              processImage(base64);
          }
      }
  };

  const generateSingleDish = async (dishId: string) => {
      setDishes(prevDishes => {
        const dish = prevDishes.find(d => d.id === dishId);
        if (!dish || dish.isLoadingImage || dish.generatedImageUrl) return prevDishes;
        return prevDishes.map(d => d.id === dishId ? { ...d, isLoadingImage: true } : d);
      });

      const dishToProcess = dishes.find(d => d.id === dishId);
      if (!dishToProcess) return;

      try {
        const imageUrl = await generateDishPhoto(
          dishToProcess.englishTranslation, 
          dishToProcess.description
        );
        
        setDishes(prev => prev.map(d => 
            d.id === dishId 
            ? { ...d, generatedImageUrl: imageUrl, isLoadingImage: false, hasAttemptedGeneration: true } 
            : d
        ));
      } catch (err: any) {
        console.error(`Error generating image for ${dishToProcess.englishTranslation}:`, err);
        setDishes(prev => prev.map(d => 
            d.id === dishId 
            ? { ...d, isLoadingImage: false, hasAttemptedGeneration: true } 
            : d
        ));
      }
  };

  const handleRetryGenerate = async (dishId: string) => {
    setDishes(prev => prev.map(d => d.id === dishId ? { ...d, hasAttemptedGeneration: false } : d));
    generateSingleDish(dishId);
  };

  const resetApp = () => {
    setMenuImage(null);
    setDishes([]);
    setError(null);
    setActiveTab('photos');
  };

  if (isCheckingKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-4">GourmetVision</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Please select a Google Cloud project to proceed.
          </p>
          <button
            onClick={handleSelectKey}
            className="w-full bg-stone-800 hover:bg-stone-900 text-white font-medium py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            Select API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-stone-800 font-sans">
      {/* Hidden Canvas for capture */}
      <canvas ref={canvasRef} className="hidden"></canvas>

      {/* Camera Modal Overlay */}
      {isCameraOpen && (
          <div className="fixed inset-0 z-[60] bg-black flex flex-col">
              <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  {/* Guide Frame */}
                  <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none flex items-center justify-center">
                      <div className="border-2 border-white/50 w-full h-full rounded-lg"></div>
                  </div>
              </div>
              <div className="h-32 bg-black flex items-center justify-between px-8">
                  <button onClick={stopCamera} className="text-white p-4 rounded-full hover:bg-white/10 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                  </button>
                  
                  <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/20 transition-all active:scale-95">
                      <div className="w-16 h-16 bg-white rounded-full"></div>
                  </button>

                  {/* Spacer to center button */}
                  <div className="w-16"></div>
              </div>
          </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={resetApp}>
            <div className="bg-stone-900 text-white p-2 rounded-lg group-hover:bg-emerald-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold font-serif tracking-tight text-stone-900">GourmetVision</h1>
          </div>
          {dishes.length > 0 && (
             <button 
                onClick={resetApp}
                className="text-sm font-medium text-stone-500 hover:text-red-500 transition-colors flex items-center gap-1"
             >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="hidden sm:inline">New Menu</span>
             </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!menuImage ? (
          // Upload State
          <div className="max-w-xl mx-auto mt-12 sm:mt-20 text-center animate-fade-in-up">
            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-stone-900 mb-6 tracking-tight">
              Visualize the menu.
            </h2>
            <p className="text-lg text-stone-500 mb-10 leading-relaxed max-w-md mx-auto">
              Scan any menu instantly. We identify dishes, extract prices, and generate realistic photos.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {/* Camera Button */}
                <button
                    onClick={startCamera}
                    className="flex-1 min-w-[160px] py-6 rounded-2xl border-2 border-stone-800 bg-stone-800 text-white flex flex-col items-center justify-center gap-3 transition-all hover:bg-stone-900 hover:shadow-lg hover:-translate-y-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                    </svg>
                    <span className="font-semibold text-lg">Use Camera</span>
                </button>

                {/* Upload Button */}
                <label className="flex-1 min-w-[160px] py-6 rounded-2xl border-2 border-dashed border-stone-300 bg-white text-stone-600 cursor-pointer flex flex-col items-center justify-center gap-3 transition-all hover:border-emerald-500 hover:bg-emerald-50/20 hover:text-emerald-700 hover:-translate-y-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <span className="font-semibold text-lg">Upload Photo</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
            </div>
            
            <p className="mt-6 text-sm text-stone-400">Works with JPEG and PNG</p>
          </div>
        ) : (
          // Analysis & Results State
          <div className="animate-fade-in">
             
             {/* Mobile Tabs */}
             <div className="md:hidden flex bg-white rounded-lg p-1 shadow-sm border border-gray-200 mb-6 sticky top-20 z-40">
                <button 
                  onClick={() => setActiveTab('photos')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'photos' ? 'bg-stone-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Photos
                </button>
                <button 
                  onClick={() => setActiveTab('menu')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'menu' ? 'bg-stone-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Original Menu
                </button>
             </div>

             <div className="flex flex-col md:flex-row gap-8 items-start">
                
                {/* Left Sidebar: Menu Source (Sticky on Desktop, Tabbed on Mobile) */}
                <div className={`w-full md:w-1/3 lg:w-1/4 md:sticky md:top-24 ${activeTab === 'menu' ? 'block' : 'hidden md:block'}`}>
                   <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                         <h3 className="font-bold text-stone-900 text-sm tracking-wide uppercase">Original Source</h3>
                      </div>
                      <div className="relative rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                        <img src={menuImage} alt="Uploaded Menu" className="w-full h-auto object-contain" />
                      </div>
                   </div>
                </div>

                {/* Main Content: Dishes */}
                <div className={`w-full md:w-2/3 lg:w-3/4 ${activeTab === 'photos' ? 'block' : 'hidden md:block'}`}>
                  {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100 flex items-center gap-3">
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008h-.008V15.75z" />
                        </svg>
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                  )}

                  {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                      <div className="relative w-16 h-16 mb-6">
                         <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                         <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                      </div>
                      <h3 className="text-2xl font-serif font-bold text-stone-900 mb-2">Reading the menu...</h3>
                      <p className="text-stone-500">Identifying delicious dishes & prices.</p>
                    </div>
                  ) : dishes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {dishes.map((dish) => (
                        <DishCard 
                        key={dish.id} 
                        dish={dish} 
                        onGenerate={generateSingleDish}
                        onRetry={handleRetryGenerate}
                        />
                    ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300 mx-auto mb-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-stone-500 font-medium">No dishes found.</p>
                        <p className="text-sm text-stone-400 mt-1">Try a clearer image or a different menu.</p>
                        <button 
                            onClick={resetApp}
                            className="mt-6 px-6 py-2.5 bg-stone-800 text-white rounded-xl font-medium shadow-lg hover:bg-stone-900 transition-all hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            Try Another Photo
                        </button>
                    </div>
                  )}
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
