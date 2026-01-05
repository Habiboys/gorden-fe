import { X } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import whatsappIcon from '../assets/whatsapp.png';

export function FloatingWhatsApp() {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Don't show on admin pages
    if (location.pathname.startsWith('/admin')) {
        return null;
    }

    const phoneNumber = '6285142247464';

    const handleOptionClick = (message: string) => {
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        setIsOpen(false);
    };

    const mainButtonStyle: React.CSSProperties = {
        position: 'fixed',
        bottom: '32px',
        left: '32px',
        zIndex: 99999,
        width: '60px', // Reverted to 60px
        height: '60px', // Reverted to 60px
        borderRadius: '50%',
        backgroundColor: '#FFFFFF', // Reverted to White
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
    };

    const pulseStyle: React.CSSProperties = {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        backgroundColor: '#25D366',
        animation: isOpen ? 'none' : 'pulse 2s infinite',
        opacity: 0.4,
        zIndex: -1,
    };

    return (
        <>
            <style>
                {`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.4; }
            50% { transform: scale(1.3); opacity: 0; }
            100% { transform: scale(1); opacity: 0; }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
            </style>

            {/* Close Overlay (Click outside to close) */}
            {isOpen && (
                <div
                    className="fixed inset-0"
                    style={{ zIndex: 99997 }}
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Menu Options */}
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '100px',
                        left: '32px',
                        zIndex: 99998,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        animation: 'slideUp 0.3s ease-out',
                    }}
                >
                    {/* Option 2: Request Quote */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOptionClick('Halo admin, saya ingin membuat penawaran untuk proyek gorden saya...');
                        }}
                        className="bg-white px-4 py-3 rounded-xl shadow-lg hover:bg-gray-50 transition-all text-left min-w-[180px] border border-gray-100"
                    >
                        <p className="text-sm font-semibold text-gray-800">Buat Penawaran</p>
                    </button>

                    {/* Option 1: General Chat */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOptionClick('Halo admin, saya ingin konsultasi mengenai produk gorden...');
                        }}
                        className="bg-white px-4 py-3 rounded-xl shadow-lg hover:bg-gray-50 transition-all text-left min-w-[180px] border border-gray-100"
                    >
                        <p className="text-sm font-semibold text-gray-800">Chat dengan Kami</p>
                    </button>
                </div>
            )}

            {/* Main Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={mainButtonStyle}
                aria-label={isOpen ? "Close menu" : "Open WhatsApp menu"}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {!isOpen && <div style={pulseStyle} />}

                {isOpen ? (
                    <X className="w-8 h-8 text-gray-600" />
                ) : (
                    <img
                        src={whatsappIcon}
                        alt="WhatsApp"
                        style={{
                            width: '40px',
                            height: '40px',
                            objectFit: 'contain',
                        }}
                    />
                )}
            </button>
        </>
    );
}
