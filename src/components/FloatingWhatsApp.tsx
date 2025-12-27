import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import whatsappIcon from '../assets/whatsapp.png';
import { chatAdminFromFloatingButton } from '../utils/whatsappHelper';

export function FloatingWhatsApp() {
    const location = useLocation();
    const [isHovered, setIsHovered] = useState(false);

    // Don't show on admin pages
    if (location.pathname.startsWith('/admin')) {
        return null;
    }

    const buttonStyle: React.CSSProperties = {
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 99999,
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: '#FFFFFF',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isHovered
            ? '0 8px 25px rgba(0, 0, 0, 0.2)'
            : '0 4px 15px rgba(0, 0, 0, 0.15)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
    };

    const pulseStyle: React.CSSProperties = {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        backgroundColor: '#25D366',
        animation: 'pulse 2s infinite',
        opacity: 0.4,
        zIndex: -1,
    };

    const tooltipStyle: React.CSSProperties = {
        position: 'absolute',
        left: '72px',
        top: '50%',
        transform: `translateY(-50%) translateX(${isHovered ? '0' : '-10px'})`,
        backgroundColor: 'white',
        color: '#374151',
        padding: '10px 16px',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        whiteSpace: 'nowrap',
        fontSize: '14px',
        fontWeight: 500,
        opacity: isHovered ? 1 : 0,
        visibility: isHovered ? 'visible' : 'hidden',
        transition: 'all 0.3s ease',
        pointerEvents: 'none',
        border: '1px solid #E5E7EB',
    };

    const arrowStyle: React.CSSProperties = {
        position: 'absolute',
        left: '-6px',
        top: '50%',
        transform: 'translateY(-50%) rotate(45deg)',
        width: '12px',
        height: '12px',
        backgroundColor: 'white',
        borderLeft: '1px solid #E5E7EB',
        borderBottom: '1px solid #E5E7EB',
    };

    return (
        <>
            {/* Keyframes for pulse animation */}
            <style>
                {`
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 0.4;
            }
            50% {
              transform: scale(1.3);
              opacity: 0;
            }
            100% {
              transform: scale(1);
              opacity: 0;
            }
          }
        `}
            </style>

            <button
                onClick={chatAdminFromFloatingButton}
                style={buttonStyle}
                aria-label="Chat via WhatsApp"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Pulse effect */}
                <div style={pulseStyle} />

                {/* WhatsApp Icon */}
                <img
                    src={whatsappIcon}
                    alt="WhatsApp"
                    style={{
                        width: '36px',
                        height: '36px',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                    }}
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                            parent.innerHTML = '<span style="color: white; font-weight: bold; font-size: 16px;">WA</span>';
                        }
                    }}
                />

                {/* Tooltip */}
                <div style={tooltipStyle}>
                    <div style={arrowStyle} />
                    <span>Chat dengan Kami</span>
                </div>
            </button>
        </>
    );
}
