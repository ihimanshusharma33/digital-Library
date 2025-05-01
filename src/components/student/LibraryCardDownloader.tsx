import React, { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import JsBarcode from 'jsbarcode';
import { Student } from '../../types';

interface LibraryCardDownloaderProps {
  profile: Student;
}

const LibraryCardDownloader: React.FC<LibraryCardDownloaderProps> = ({ profile }) => {
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const barcodeRef = useRef<SVGSVGElement>(null);
  const [cardReady, setCardReady] = useState(false);

  const nameInitial = profile?.name?.charAt(0) || 'U';

  // Format date as MM/DD/YYYY
  const formatDate = (date: Date): string => {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };
  
  // Calculate expiry date (1 year from now)
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  // Pre-load images
  const logoUrl = "../../../logo.png";
  const stampUrl = "../../../IGu-seal.png"; // Placeholder for stamp image
  const [logoLoaded, setLogoLoaded] = useState(false);
  
  useEffect(() => {
    // Pre-load logo image
    const img = new Image();
    img.onload = () => setLogoLoaded(true);
    img.onerror = (e) => console.error("Error loading logo:", e);
    img.src = logoUrl;
  }, []);

  // Generate barcode after component mounts
  useEffect(() => {
    if (barcodeRef.current && profile?.library_id) {
      try {
        JsBarcode(barcodeRef.current, profile.library_id, {
          format: 'CODE128',
          width: 2,
          height: 50,
          displayValue: false,
          margin: 0,
        });
        // Mark card as ready when barcode is generated
        setCardReady(true);
      } catch (err) {
        console.error('Barcode generation error', err);
      }
    }
  }, [profile?.library_id, logoLoaded]);

  const generateCard = async () => {
    if (!profile || !cardRef.current || !cardReady) {
      console.error("Card not ready for download");
      return;
    }

    try {
      setDownloading(true);
      
      // Make card container visible before capturing
      const cardContainer = cardRef.current.parentElement;
      if (cardContainer) {
        const originalStyle = cardContainer.style.display;
        cardContainer.style.display = "block";
        
        // Wait a moment for rendering
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Capture the card
        const canvas = await html2canvas(cardRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "white",
          logging: true,
          onclone: (clonedDoc) => {
            // Ensure barcode is visible in cloned document
            const clonedBarcode = clonedDoc.querySelector('svg');
            if (clonedBarcode && barcodeRef.current) {
              clonedBarcode.innerHTML = barcodeRef.current.innerHTML;
            }
          }
        });
        
        // Restore original style
        cardContainer.style.display = originalStyle;

        // Download the image
        const img = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = img;
        link.download = `IGU_Library_Card_${profile.library_id || 'student'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Error generating card:', err);
      alert('Error generating the card. Please check console for details.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      {/* Hidden card template that will be captured for download */}
      <div style={{ display: 'none', position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div 
          ref={cardRef} 
          style={{
            position: 'relative',
            width: '900px',
            height: '556px',
            backgroundColor: 'white',
            border: '6px solid #F97316',
            fontFamily: 'Arial, sans-serif',
            overflow: 'hidden'
          }}
        >
          {/* Orange header */}
          <div style={{
            width: '100%',
            height: '120px',
            backgroundColor: '#F97316',
            position: 'relative'
          }}>
            {/* Logo circle */}
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '40px',
              width: '80px',
              height: '80px',
              backgroundColor: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {logoLoaded ? (
                <img 
                  src={logoUrl} 
                  alt="IGU Logo" 
                  style={{
                    width: '60px',
                    height: '60px',
                    objectFit: 'contain'
                  }} 
                  crossOrigin="anonymous"
                />
              ) : (
                <div style={{
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#F97316',
                  fontWeight: 'bold',
                  fontSize: '20px'
                }}>
                  IGU
                </div>
              )}
            </div>
            
            {/* University Name */}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '160px',
              color: 'white'
            }}>
              <div style={{
                fontWeight: 'bold',
                fontSize: '32px'
              }}>
                Indira Gandhi University, Rewari
              </div>
              <div style={{
                fontSize: '18px',
                marginTop: '5px'
                
              }}>
                IGU LIBRARY
              </div>
            </div>
            
            {/* Card Title */}
            <div style={{
              position: 'absolute',
              top: '30px',
              right: '40px',
              textAlign: 'right',
              color: 'white'
            }}>
              <div style={{
                fontWeight: 'bold',
                fontSize: '20px'
              }}>
                LIBRARY CARD
              </div>
              <div style={{
                fontSize: '16px',
                marginTop: '5px'
              }}>
                {profile?.library_id || 'ID: Not Assigned'}
              </div>
            </div>
          </div>

        
          {/* Name */}
          <div style={{
            position: 'absolute',
            top: '120px',
            left: '60px',
            fontSize: '34px',
            fontWeight: 'bold',
            color: '#1F2937'
          }}>
            {profile?.name || 'Student Name'}
          </div>

          {/* Left-side details */}
          <div style={{
            position: 'absolute',
            top: '210px',
            left: '60px'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <span style={{
                fontWeight: 'bold',
                fontSize: '16px',
                color: '#4B5563',
                display: 'inline-block',
                width: '110px'
              }}>Course:</span>
              <span style={{
                fontSize: '16px',
                color: '#1F2937'
              }}>{profile?.course_code || 'BTECH-ME-103'}</span>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <span style={{
                fontWeight: 'bold',
                fontSize: '16px',
                color: '#4B5563',
                display: 'inline-block',
                width: '110px'
              }}>Department:</span>
              <span style={{
                fontSize: '16px',
                color: '#1F2937'
              }}>{profile?.department || 'Mechanical'}</span>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <span style={{
                fontWeight: 'bold',
                fontSize: '16px',
                color: '#4B5563',
                display: 'inline-block',
                width: '110px'
              }}>Roll Number:</span>
              <span style={{
                fontSize: '16px',
                color: '#1F2937'
              }}>{profile?.university_roll_number || '2100110150321'}</span>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <span style={{
                fontWeight: 'bold',
                fontSize: '16px',
                color: '#4B5563',
                display: 'inline-block',
                width: '110px'
              }}>Valid Until:</span>
              <span style={{
                fontSize: '16px',
                color: '#1F2937'
              }}>{formatDate(expiryDate)}</span>
            </div>
          </div>

          {/* Right-side details */}
          <div style={{
            position: 'absolute',
            top: '210px',
            left: '550px'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <span style={{
                fontWeight: 'bold',
                fontSize: '16px',
                color: '#4B5563',
                display: 'inline-block',
                width: '70px'
              }}>Email:</span>
              <span style={{
                fontSize: '16px',
                color: '#1F2937'
              }}>{profile?.email || 'student@example.com'}</span>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <span style={{
                fontWeight: 'bold',
                fontSize: '16px',
                color: '#4B5563',
                display: 'inline-block',
                width: '70px'
              }}>Phone:</span>
              <span style={{
                fontSize: '16px',
                color: '#1F2937'
              }}>{profile?.phone_number || 'Not provided'}</span>
            </div>
          </div>

          {/* University stamp/seal */}
          <div style={{
            position: 'absolute',
            right: '80px',
            top: '380px',
            zIndex: 100,
            width: '140px',
            height: '140px',
            opacity: 0.2,
          }}>
            {/* Simple circle with text as fallback for the stamp image */}
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '3px solid #F97316',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'rotate(-15deg)',
              padding: '5px'
            }}>
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '18px', 
                color: '#F97316', 
                textAlign: 'center' 
              }}>
                IGU
              </div>
              <div style={{ 
                fontSize: '8px', 
                color: '#F97316', 
                textAlign: 'center', 
                margin: '3px 0' 
              }}>
                INDIRA GANDHI UNIVERSITY
              </div>
              <div style={{ 
                fontSize: '8px', 
                color: '#F97316', 
                textAlign: 'center' 
              }}>
                REWARI
              </div>
            </div>
          </div>

          {/* Footer area */}
          <div style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            width: '100%',
            height: '116px',
            backgroundColor: '#F9FAFB',
            borderTop: '1px solid #E5E7EB'
          }}>
            {/* Barcode */}
            <div style={{
              position: 'absolute',
              left: '40px',
              top: '30px',
              textAlign: 'center'
            }}>
              <svg 
                ref={barcodeRef} 
                style={{
                  height: '50px',
                  width: '180px'
                }}
              ></svg>
              <div style={{
                marginTop: '5px',
                fontSize: '14px',
                color: '#6B7280',
                textAlign: 'center',
                width: '180px'
              }}>
                {profile?.library_id || '73946352'}
              </div>
            </div>
            
            {/* Issue date */}
            <div style={{
              position: 'absolute',
              left: '400px',
              top: '40px',
              fontSize: '16px',
              color: '#6B7280'
            }}>
              Issue Date: {formatDate(new Date())}
            </div>
            
            {/* Signature area */}
            <div style={{
              position: 'absolute',
              right: '60px',
              top: '30px',
              width: '160px',
              textAlign: 'center'
            }}>
              <div style={{
                borderBottom: '1px solid #D1D5DB',
                height: '40px'
              }}></div>
              <div style={{
                marginTop: '10px',
                fontSize: '14px',
                fontStyle: 'italic',
                color: '#6B7280'
              }}>
                University stamp/signature
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={generateCard}
        disabled={downloading || !cardReady}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: downloading || !cardReady ? '#FDA974' : '#F97316',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: downloading || !cardReady ? 'not-allowed' : 'pointer',
          opacity: downloading || !cardReady ? 0.7 : 1,
          transition: 'background-color 0.2s',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          fontSize: '14px'
        }}
      >
        <Download size={16} />
        {downloading ? 'Generating...' : 'Download Library Card'}
      </button>
    </div>
  );
};

export default LibraryCardDownloader;
