import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";

// --- Configuration & Data ---
// Added country code 91 for India
const WHATSAPP_NUMBER = "918200842466";

// Menu Data
const MENU_ITEMS = [
  {
    id: 1,
    category: "Starters",
    name: "Truffle Arancini",
    description: "Crispy risotto balls infused with black truffle oil, served with garlic aioli.",
    price: 12,
    image: "https://images.unsplash.com/photo-1626071476906-ac6d05f335e2?auto=format&fit=crop&w=800&q=80",
    tags: ["Vegetarian", "Crispy"]
  },
  {
    id: 2,
    category: "Starters",
    name: "Wagyu Beef Carpaccio",
    description: "Thinly sliced seared beef with parmesan shavings, capers, and truffle glaze.",
    price: 18,
    image: "https://images.unsplash.com/photo-1544025162-d76690b67f61?auto=format&fit=crop&w=800&q=80",
    tags: ["Gluten Free", "Raw"]
  },
  {
    id: 3,
    category: "Mains",
    name: "Pan-Seared Sea Bass",
    description: "Fresh sea bass fillet on a bed of asparagus risotto with lemon butter sauce.",
    price: 28,
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80",
    tags: ["Seafood", "Healthy"]
  },
  {
    id: 4,
    category: "Mains",
    name: "Herb-Crusted Lamb Rack",
    description: "Served pink with fondant potatoes, seasonal greens, and a red wine jus.",
    price: 34,
    image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80",
    tags: ["Signature", "Meat"]
  },
  {
    id: 5,
    category: "Mains",
    name: "Wild Mushroom Risotto",
    description: "Arborio rice cooked with porcini mushrooms, parmesan crisp, and fresh herbs.",
    price: 24,
    image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=800&q=80",
    tags: ["Vegetarian", "Rich"]
  },
  {
    id: 6,
    category: "Desserts",
    name: "Dark Chocolate Fondant",
    description: "Molten center chocolate cake served with Madagascar vanilla bean ice cream.",
    price: 14,
    image: "https://images.unsplash.com/photo-1617305855067-160d5b128549?auto=format&fit=crop&w=800&q=80",
    tags: ["Sweet", "Decadent"]
  },
  {
    id: 7,
    category: "Desserts",
    name: "Lemon Basil Tart",
    description: "Zesty lemon curd in a buttery pastry shell, topped with italian meringue.",
    price: 12,
    image: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=800&q=80",
    tags: ["Citrus", "Fresh"]
  }
];

// --- Types ---
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface UserDetails {
  name: string;
  address: string;
  notes: string;
}

type OrderType = 'delivery' | 'dine-in' | 'pickup';

// --- AI Service ---
const getAIRecommendation = async (prompt: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a world-class Maitre D' at a high-end restaurant called Lumière.
      The menu is: ${JSON.stringify(MENU_ITEMS.map(i => i.name + " (" + i.tags.join(',') + ")"))}.
      
      The customer says: "${prompt}".
      
      Recommend 1-2 specific dishes from the menu that match their request. Be brief, elegant, and appetizing. Do not list prices.`,
    });
    return response.text;
  } catch (error) {
    console.error("AI Error", error);
    return "Our Chef recommends the Herb-Crusted Lamb Rack, a timeless classic.";
  }
};

// --- Components ---

function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [showCheckout, setShowCheckout] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails>({ name: "", address: "", notes: "" });
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  
  // UI State
  const [isScrolled, setIsScrolled] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // AI State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Cart Helpers
  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
    showToast(`Added ${item.name} to order`);
    // Optional: Auto open cart on first add
    // setIsCartOpen(true); 
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(0, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // WhatsApp Checkout
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    
    let message = `*🍽️ New Order @ Lumière Dining*\n`;
    message += `----------------------------\n`;
    message += `*Type:* ${orderType.toUpperCase()}\n`;
    message += `*Name:* ${userDetails.name}\n`;
    message += `*Info:* ${userDetails.address}\n`;
    message += `----------------------------\n\n`;
    message += `*Order Details:*\n`;
    
    cart.forEach(item => {
      message += `▫️ ${item.quantity}x ${item.name} ($${item.price})\n`;
    });
    
    message += `\n*💰 Total Amount: $${cartTotal}*\n`;
    if (userDetails.notes) message += `\n*📝 Notes:* ${userDetails.notes}`;

    // Using the International format for WhatsApp API (no +)
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // AI Handler
  const handleAskAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiResponse("");
    const result = await getAIRecommendation(aiPrompt);
    setAiResponse(result);
    setIsAiLoading(false);
  };

  const categories = ["All", ...Array.from(new Set(MENU_ITEMS.map(i => i.category)))];
  const filteredItems = activeCategory === "All" 
    ? MENU_ITEMS 
    : MENU_ITEMS.filter(i => i.category === activeCategory);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20 relative overflow-x-hidden selection:bg-amber-500 selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-4 z-[100] animate-fade-in-left">
          <div className="bg-slate-800 border border-amber-500/50 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3">
            <i className="fa-solid fa-circle-check text-amber-500"></i>
            {toastMessage}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'glass-panel border-b border-slate-700/50 shadow-lg' : 'bg-transparent border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
              <i className="fa-solid fa-utensils text-amber-500 text-2xl"></i>
              <span className="text-2xl font-bold tracking-wider font-serif text-white">Lumière</span>
            </div>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-3 text-gray-300 hover:text-white transition-all transform hover:scale-110"
            >
              <i className="fa-solid fa-cart-shopping text-xl"></i>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-amber-500 text-slate-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce shadow-lg shadow-amber-500/50">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/30 z-10"></div>
          {/* Animated Background Image scale */}
          <img 
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80" 
            className="w-full h-full object-cover animate-[pulse_20s_infinite] scale-105" 
            alt="Restaurant Ambience"
            style={{ animation: 'none' }} // disabling pulse, just static scale for better performance or custom keyframe
          />
        </div>
        
        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto mt-16">
          <div className="inline-block mb-6 animate-fade-in-down">
             <span className="text-amber-500 tracking-[0.3em] uppercase text-xs md:text-sm font-bold px-4 py-2 border border-amber-500/30 rounded-full backdrop-blur-sm bg-slate-900/50">
               Premium Dining Experience
             </span>
          </div>
          <h1 className="text-5xl md:text-8xl font-bold text-white mb-8 leading-tight font-serif gold-text drop-shadow-2xl">
            Taste the Extraordinary
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-12 font-light max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
            A culinary journey crafted with passion, delivered to your table or your doorstep.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button 
              onClick={() => {
                document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-10 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2"
            >
              <span>Order Now</span>
              <i className="fa-solid fa-arrow-right"></i>
            </button>
            <button 
              onClick={() => {
                 document.getElementById('ai-chef')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-slate-800/80 hover:bg-slate-700 text-white backdrop-blur-md border border-slate-600 px-10 py-4 rounded-full font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <span>Ask AI Chef</span>
              <i className="fa-solid fa-wand-magic-sparkles"></i>
            </button>
          </div>
        </div>
      </div>

      {/* AI Sommelier Section */}
      <div id="ai-chef" className="max-w-7xl mx-auto px-4 -mt-24 relative z-30 mb-24">
        <div className="glass-panel p-8 md:p-10 rounded-2xl shadow-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="flex-1 w-full">
              <h3 className="text-3xl font-serif text-amber-500 mb-3 flex items-center gap-3"> 
                <i className="fa-solid fa-sparkles text-2xl"></i> 
                Unsure what to eat?
              </h3>
              <p className="text-gray-300 mb-6 text-lg">Tell our AI Maitre D' your mood, and we'll curate the perfect dish for you.</p>
              
              <div className="relative">
                <input 
                  type="text" 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. 'I want a romantic dinner with something spicy'" 
                  className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-6 py-4 pr-32 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-inner"
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                />
                <button 
                  onClick={handleAskAI}
                  disabled={isAiLoading}
                  className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-900 px-6 rounded-lg font-bold transition-all disabled:opacity-70 shadow-lg"
                >
                  {isAiLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : "Ask Chef"}
                </button>
              </div>

              {aiResponse && (
                <div className="mt-6 p-6 bg-slate-900/60 rounded-xl border border-amber-500/30 animate-fade-in flex gap-4">
                  <div className="flex-shrink-0 pt-1">
                    <i className="fa-solid fa-quote-left text-amber-500 text-xl"></i>
                  </div>
                  <p className="text-gray-200 italic leading-relaxed text-lg">{aiResponse}</p>
                </div>
              )}
            </div>
            <div className="w-full md:w-auto flex-shrink-0 hidden md:block">
              <div className="text-center p-8 border border-slate-600 rounded-2xl bg-slate-900/40 w-64">
                 <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-600">
                    <i className="fa-solid fa-robot text-3xl text-amber-500"></i>
                 </div>
                 <h4 className="font-bold text-white mb-2">Powered by Gemini</h4>
                 <p className="text-xs text-slate-400 leading-relaxed">Advanced AI analysis of our menu to match your specific taste preferences.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div id="menu" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">Our Menu</h2>
          <div className="w-24 h-1 bg-amber-500 mx-auto rounded-full mb-10"></div>
          
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-8 py-3 rounded-full transition-all duration-300 font-medium tracking-wide ${
                  activeCategory === cat 
                    ? 'bg-amber-500 text-slate-900 font-bold shadow-lg shadow-amber-500/20 transform scale-105' 
                    : 'bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {filteredItems.map(item => (
            <div key={item.id} className="group bg-slate-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-amber-900/20 transition-all duration-300 transform hover:-translate-y-2 border border-slate-700/50 flex flex-col h-full">
              <div className="h-56 overflow-hidden relative">
                <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition-colors z-10"></div>
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 flex gap-2 z-20">
                  {item.tags.map(tag => (
                    <span key={tag} className="bg-slate-900/90 backdrop-blur-md text-amber-500 text-[10px] uppercase font-bold px-3 py-1 rounded-full border border-amber-500/20">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-serif font-bold text-white group-hover:text-amber-500 transition-colors leading-tight">{item.name}</h3>
                  <span className="text-xl font-bold text-amber-500 ml-3">${item.price}</span>
                </div>
                <p className="text-gray-400 text-sm mb-6 flex-1 leading-relaxed">{item.description}</p>
                <button 
                  onClick={() => addToCart(item)}
                  className="w-full bg-slate-700/50 hover:bg-amber-500 hover:text-slate-900 text-white border border-slate-600 hover:border-amber-500 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group-hover:shadow-lg"
                >
                  <i className="fa-solid fa-plus"></i> Add to Order
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[60] overflow-hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)}></div>
          <div className="absolute inset-y-0 right-0 max-w-md w-full flex animate-slide-in-right">
            <div className="h-full w-full bg-slate-900 shadow-2xl flex flex-col border-l border-slate-700">
              {/* Cart Header */}
              <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 z-10">
                <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                  <i className="fa-solid fa-bag-shopping text-amber-500"></i> Your Order
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-slate-700 transition-colors">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
                      <i className="fa-solid fa-basket-shopping text-4xl text-slate-600"></i>
                    </div>
                    <p className="text-lg">Your cart is empty.</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="text-amber-500 hover:underline"
                    >
                      Browse Menu
                    </button>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors">
                       <div className="flex-1">
                         <h4 className="font-bold text-white mb-1">{item.name}</h4>
                         <p className="text-amber-500 text-sm font-medium">${item.price * item.quantity}</p>
                       </div>
                       <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-1.5 border border-slate-700">
                         <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-slate-700 rounded transition-colors">
                           <i className="fa-solid fa-minus text-[10px]"></i>
                         </button>
                         <span className="text-sm font-bold w-6 text-center text-white">{item.quantity}</span>
                         <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-slate-700 rounded transition-colors">
                           <i className="fa-solid fa-plus text-[10px]"></i>
                         </button>
                       </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer / Checkout */}
              <div className="p-6 bg-slate-800 border-t border-slate-700 shadow-[0_-5px_20px_rgba(0,0,0,0.3)] z-10">
                <div className="flex justify-between items-center mb-6 text-lg">
                  <span className="text-gray-400">Total Amount</span>
                  <span className="text-3xl font-serif font-bold text-amber-500">${cartTotal}</span>
                </div>
                
                {showCheckout ? (
                  <form onSubmit={handleCheckout} className="space-y-4 animate-fade-in-up">
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {['delivery', 'pickup', 'dine-in'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setOrderType(type as OrderType)}
                          className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                            orderType === type 
                              ? 'bg-amber-500 text-slate-900 border-amber-500' 
                              : 'bg-slate-900 text-gray-400 border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <input 
                        required
                        placeholder="Your Name"
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all"
                        value={userDetails.name}
                        onChange={e => setUserDetails({...userDetails, name: e.target.value})}
                      />
                      <input 
                        required
                        placeholder={orderType === 'dine-in' ? "Table Number" : "Delivery Address"}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all"
                        value={userDetails.address}
                        onChange={e => setUserDetails({...userDetails, address: e.target.value})}
                      />
                      <textarea 
                        placeholder="Special Requests / Allergies"
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none h-20 resize-none transition-all"
                        value={userDetails.notes}
                        onChange={e => setUserDetails({...userDetails, notes: e.target.value})}
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-900/20 transform hover:-translate-y-1"
                    >
                      <i className="fa-brands fa-whatsapp text-2xl"></i> 
                      <span>Send Order on WhatsApp</span>
                    </button>
                  </form>
                ) : (
                  <button 
                    onClick={() => setShowCheckout(true)}
                    disabled={cart.length === 0}
                    className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-4 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Checkout</span>
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-950 py-16 px-4 mt-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-utensils text-amber-500 text-2xl"></i>
              <span className="text-3xl font-serif font-bold text-white">Lumière</span>
            </div>
            <p className="text-gray-500 text-sm max-w-xs text-center md:text-left">
              Elevating gastronomy with every dish. Experience the art of fine dining.
            </p>
          </div>
          
          <div className="flex gap-6">
             <a href="#" className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-gray-400 hover:bg-amber-500 hover:text-slate-900 hover:border-amber-500 transition-all transform hover:scale-110">
               <i className="fa-brands fa-instagram text-xl"></i>
             </a>
             <a href="#" className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-gray-400 hover:bg-amber-500 hover:text-slate-900 hover:border-amber-500 transition-all transform hover:scale-110">
               <i className="fa-brands fa-facebook-f text-xl"></i>
             </a>
             <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-gray-400 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all transform hover:scale-110">
               <i className="fa-brands fa-whatsapp text-xl"></i>
             </a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-slate-900 text-center text-gray-600 text-sm">
          © {new Date().getFullYear()} Lumière Dining. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
