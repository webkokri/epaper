/**
=========================================================
* Public E-Paper Viewer
=========================================================
*/

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

// @mui icons
import LockIcon from "@mui/icons-material/Lock";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// API
import { epaperAPI, API_URL } from "services/api";

// Auth Context
import { useAuth } from "context/AuthContext";

// Images
import bgImage from "assets/images/bg-sign-in-basic.jpeg";

function PublicEPaperViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [ePaper, setEPaper] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  
  // Subscription state
  const [accessInfo, setAccessInfo] = useState(null);
  const [pagesLimited, setPagesLimited] = useState(false);
  
  // Crop and Share states
  const [cropMode, setCropMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selection, setSelection] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [croppedImageUrl, setCroppedImageUrl] = useState("");
  
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchEPaper();
  }, [id]);

  const fetchEPaper = async () => {
    try {
      const response = await epaperAPI.getById(id);
      setEPaper(response.data);
      
      // Set access info from response
      if (response.data.access_info) {
        setAccessInfo(response.data.access_info);
        setPagesLimited(response.data.pages_limited || false);
      }
    } catch (error) {
      console.error("Error fetching e-paper:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      setSelection(null);
    }
  };

  const handleNextPage = () => {
    if (ePaper && currentPage < ePaper.pages.length - 1) {
      // Check if user is trying to access beyond allowed pages
      if (pagesLimited && currentPage >= accessInfo?.pages_allowed - 1) {
        // User is at the limit, show subscribe prompt
        return;
      }
      setCurrentPage(currentPage + 1);
      setSelection(null);
    }
  };

  const handleZoomIn = () => {
    setScale(Math.min(scale + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(Math.max(scale - 0.1, 0.5));
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  // Get coordinates relative to the image
  const getImageCoordinates = useCallback((e) => {
    if (!imageRef.current) return { x: 0, y: 0 };
    const rect = imageRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  }, [scale]);

  const handleMouseDown = (e) => {
    if (!cropMode) return;
    e.preventDefault();
    e.stopPropagation();
    const coords = getImageCoordinates(e);
    setIsDrawing(true);
    setSelection({ startX: coords.x, startY: coords.y, endX: coords.x, endY: coords.y });
  };

  const handleMouseMove = (e) => {
    if (!cropMode || !isDrawing) return;
    e.preventDefault();
    const coords = getImageCoordinates(e);
    setSelection(prev => prev ? { ...prev, endX: coords.x, endY: coords.y } : null);
  };

  const handleMouseUp = () => {
    if (!cropMode || !isDrawing) return;
    setIsDrawing(false);
    if (selection) {
      const width = Math.abs(selection.endX - selection.startX);
      const height = Math.abs(selection.endY - selection.startY);
      if (width > 20 && height > 20) {
        generateCroppedImage();
      } else {
        setSelection(null);
      }
    }
  };

  const generateCroppedImage = () => {
    if (!selection || !ePaper || !imageRef.current) return;
    
    const currentPageData = ePaper.pages[currentPage];
    const imageUrl = `${API_URL.replace('/api', '')}${currentPageData.image_path}`;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      const x = Math.min(selection.startX, selection.endX);
      const y = Math.min(selection.startY, selection.endY);
      const width = Math.abs(selection.endX - selection.startX);
      const height = Math.abs(selection.endY - selection.startY);
      
      // Limit canvas size
      const maxCanvasSize = 2000;
      const scaleFactor = Math.min(1, maxCanvasSize / Math.max(width, height));
      canvas.width = width * scaleFactor;
      canvas.height = height * scaleFactor;
      
      ctx.drawImage(img, x, y, width, height, 0, 0, canvas.width, canvas.height);
      
      const croppedUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCroppedImageUrl(croppedUrl);
      setShowShareModal(true);
    };
    
    img.onerror = () => {
      alert("Error loading image for cropping");
      setSelection(null);
    };
    
    img.src = imageUrl;
  };

  const copyToClipboard = () => {
    const textToCopy = croppedImageUrl || window.location.href;
    navigator.clipboard.writeText(textToCopy).then(() => {
      alert("Copied to clipboard!");
    }).catch(() => {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("Copied to clipboard!");
    });
  };

  const downloadCroppedImage = () => {
    if (!croppedImageUrl) return;
    const link = document.createElement('a');
    link.download = `cropped-news-${Date.now()}.jpg`;
    link.href = croppedImageUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareOnFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this news from ${ePaper?.title || 'E-Paper'}!`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'width=600,height=400');
  };

  const shareOnTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this news from ${ePaper?.title || 'E-Paper'}!`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
  };

  const shareOnWhatsApp = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this news from ${ePaper?.title || 'E-Paper'}: ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=400');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`News from ${ePaper?.title || 'E-Paper'}`);
    const body = encodeURIComponent(`Check out this news:\n\n${window.location.href}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const clearSelection = () => {
    setSelection(null);
    setIsDrawing(false);
  };

  const toggleCropMode = () => {
    if (cropMode) {
      clearSelection();
    }
    setCropMode(!cropMode);
  };

  const closeModal = () => {
    setShowShareModal(false);
    setSelection(null);
  };

  // Calculate selection styles
  const getSelectionStyles = () => {
    if (!selection || !imageRef.current) return null;
    
    const x = Math.min(selection.startX, selection.endX) * scale;
    const y = Math.min(selection.startY, selection.endY) * scale;
    const width = Math.abs(selection.endX - selection.startX) * scale;
    const height = Math.abs(selection.endY - selection.startY) * scale;
    
    return {
      left: x,
      top: y,
      width: width,
      height: height,
    };
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          width: "100%",
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Card sx={{ maxWidth: "400px", width: "100%", p: 4 }}>
          <MDBox textAlign="center">
            <MDTypography variant="h6">Loading...</MDTypography>
          </MDBox>
        </Card>
      </Box>
    );
  }

  if (!ePaper) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          width: "100%",
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Card sx={{ maxWidth: "500px", width: "100%", p: 4 }}>
          <MDBox textAlign="center">
            <MDTypography variant="h4" mb={2} color="text">
              E-Paper not found
            </MDTypography>
            <MDButton color="info" onClick={handleBackToHome} fullWidth>
              Back to Home
            </MDButton>
          </MDBox>
        </Card>
      </Box>
    );
  }

  const currentPageData = ePaper.pages[currentPage];
  const selectionStyles = getSelectionStyles();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        py: 4,
      }}
    >
      <Box sx={{ maxWidth: "1400px", mx: "auto", px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Subscription Alert */}
        {pagesLimited && (
          <Alert 
            severity={accessInfo?.access_type === 'unauthenticated' ? "warning" : "info"} 
            sx={{ mb: 3 }}
            componentsProps={{
              message: { component: 'div' }
            }}
          >
            <AlertTitle>
              {accessInfo?.access_type === 'unauthenticated' 
                ? "Login Required" 
                : "Subscribe to Continue Reading"}
            </AlertTitle>
            <Box component="span">
              {accessInfo?.access_type === 'unauthenticated' 
                ? "Please login to access this e-paper. Don't have an account? "
                : `You've reached the free preview limit (${accessInfo?.pages_allowed} pages). `}
            </Box>
            
            {accessInfo?.access_type === 'unauthenticated' ? (
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                <MDButton 
                  component={Link} 
                  to="/authentication/sign-up" 
                  color="info" 
                  size="small"
                  sx={{ textDecoration: 'underline' }}
                >
                  Sign Up
                </MDButton>
                <span>or</span>
                <MDButton 
                  component={Link} 
                  to="/authentication/sign-in" 
                  color="info" 
                  size="small"
                  sx={{ textDecoration: 'underline' }}
                >
                  Login
                </MDButton>
              </Box>
            ) : (
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                <MDButton 
                  component={Link} 
                  to="/subscription/checkout" 
                  color="success" 
                  size="small"
                  sx={{ textDecoration: 'underline' }}
                >
                  Subscribe Now
                </MDButton>
              </Box>
            )}
          </Alert>
        )}

        {/* Header */}
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <MDBox>
            <MDTypography variant="h4" fontWeight="bold" color="white">
              {ePaper.title}
            </MDTypography>
            <MDTypography variant="caption" color="white">
              {ePaper.total_pages || ePaper.pages.length} pages • Published on {new Date(ePaper.created_at).toLocaleDateString()}
              {pagesLimited && ` • Viewing ${accessInfo?.pages_allowed} of ${ePaper.total_pages || ePaper.pages.length} pages`}
            </MDTypography>
          </MDBox>
          <MDBox display="flex" gap={1}>
            {/* Only show crop button for subscribers */}
            {!pagesLimited && (
              <MDButton
                variant={cropMode ? "gradient" : "outlined"}
                color={cropMode ? "error" : "warning"}
                onClick={toggleCropMode}
              >
                <Icon sx={{ mr: 1 }}>{cropMode ? "cancel" : "crop"}</Icon>
                {cropMode ? "Cancel Crop" : "Crop & Share"}
              </MDButton>
            )}
            <MDButton
              variant="gradient"
              color="info"
              onClick={handleBackToHome}
            >
              <Icon sx={{ mr: 1 }}>home</Icon>
              Back to Home
            </MDButton>
          </MDBox>
        </MDBox>

        <Grid container spacing={3}>
          {/* Left Side - Page Thumbnails */}
          <Grid item xs={12} md={3} lg={2}>
            <Card sx={{ height: "calc(100vh - 200px)", overflow: "auto" }}>
              <MDBox p={2}>
                <MDTypography variant="h6" fontWeight="medium" mb={2}>
                  Pages ({ePaper.pages.length})
                </MDTypography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {ePaper.pages.map((page, index) => (
                    <Box
                      key={page.id}
                      onClick={() => {
                        if (!pagesLimited || index < accessInfo?.pages_allowed) {
                          setCurrentPage(index);
                          setSelection(null);
                        }
                      }}
                      sx={{
                        cursor: (!pagesLimited || index < accessInfo?.pages_allowed) ? "pointer" : "not-allowed",
                        border: currentPage === index ? "2px solid #1A73E8" : "2px solid transparent",
                        borderRadius: "8px",
                        overflow: "hidden",
                        position: "relative",
                        opacity: (!pagesLimited || index < accessInfo?.pages_allowed) ? 1 : 0.5,
                        "&:hover": {
                          borderColor: (!pagesLimited || index < accessInfo?.pages_allowed) ? "#1A73E8" : "transparent",
                        },
                      }}
                    >
                      <img
                        src={`${API_URL.replace('/api', '')}${page.image_path}`}
                        alt={`Page ${index + 1}`}
                        style={{
                          width: "100%",
                          height: "auto",
                          display: "block",
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: "rgba(0, 0, 0, 0.7)",
                          color: "white",
                          padding: "4px 8px",
                          fontSize: "12px",
                          textAlign: "center",
                        }}
                      >
                        {index + 1}
                        {pagesLimited && index >= accessInfo?.pages_allowed && (
                          <LockIcon sx={{ fontSize: 14, ml: 0.5, verticalAlign: "middle" }} />
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </MDBox>
            </Card>
          </Grid>

          {/* Right Side - Page Viewer */}
          <Grid item xs={12} md={9} lg={10}>
            <Card sx={{ height: "calc(100vh - 200px)" }}>
              <MDBox p={2}>
                {/* Toolbar */}
                <MDBox
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                  p={1}
                  bgcolor="grey-100"
                  borderRadius="md"
                >
                  <MDBox display="flex" gap={1} alignItems="center">
                    <MDButton
                      variant="outlined"
                      color="dark"
                      size="small"
                      onClick={handlePrevPage}
                      disabled={currentPage === 0}
                    >
                      <Icon>arrow_back</Icon>
                    </MDButton>
                    <MDTypography variant="button" alignSelf="center">
                      Page {currentPage + 1} of {ePaper.pages.length}
                    </MDTypography>
                    <MDButton
                      variant="outlined"
                      color="dark"
                      size="small"
                      onClick={handleNextPage}
                      disabled={currentPage === ePaper.pages.length - 1}
                    >
                      <Icon>arrow_forward</Icon>
                    </MDButton>
                  </MDBox>
                  <MDBox display="flex" gap={1} alignItems="center">
                    <MDButton
                      variant="outlined"
                      color="dark"
                      size="small"
                      onClick={handleZoomOut}
                      disabled={scale <= 0.5}
                    >
                      <Icon>zoom_out</Icon>
                    </MDButton>
                    <MDTypography variant="button" alignSelf="center">
                      {Math.round(scale * 100)}%
                    </MDTypography>
                    <MDButton
                      variant="outlined"
                      color="dark"
                      size="small"
                      onClick={handleZoomIn}
                      disabled={scale >= 2}
                    >
                      <Icon>zoom_in</Icon>
                    </MDButton>
                  </MDBox>
                </MDBox>

                {/* Page Image with Crop Overlay */}
                <MDBox
                  ref={containerRef}
                  display="flex"
                  justifyContent="center"
                  alignItems="flex-start"
                  height="calc(100vh - 320px)"
                  bgcolor="grey-200"
                  borderRadius="md"
                  overflow="auto"
                  position="relative"
                  sx={{
                    cursor: cropMode ? "crosshair" : "default",
                  }}
                >
                  {currentPageData && (
                    <Box
                      position="relative"
                      display="inline-block"
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      <img
                        ref={imageRef}
                        src={`${API_URL.replace('/api', '')}${currentPageData.image_path}`}
                        alt={`Page ${currentPage + 1}`}
                        style={{
                          maxWidth: "100%",
                          width: "auto",
                          height: "auto",
                          transform: `scale(${scale})`,
                          transformOrigin: "top center",
                          transition: "transform 0.2s ease",
                          display: "block",
                        }}
                        draggable={false}
                      />
                      
                      {/* Selection Overlay */}
                      {cropMode && selectionStyles && (
                        <Box
                          sx={{
                            position: "absolute",
                            left: selectionStyles.left,
                            top: selectionStyles.top,
                            width: selectionStyles.width,
                            height: selectionStyles.height,
                            border: "2px dashed #1A73E8",
                            backgroundColor: "rgba(26, 115, 232, 0.2)",
                            pointerEvents: "none",
                            zIndex: 10,
                          }}
                        >
                          {/* Dimensions Label */}
                          <Box
                            sx={{
                              position: "absolute",
                              top: -28,
                              left: 0,
                              backgroundColor: "#1A73E8",
                              color: "white",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              whiteSpace: "nowrap",
                              fontWeight: "bold",
                            }}
                          >
                            {Math.round(Math.abs(selection.endX - selection.startX))} × {Math.round(Math.abs(selection.endY - selection.startY))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}
                  
                  {/* Crop Mode Instructions */}
                  {cropMode && !selection && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 16,
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        color: "white",
                        padding: "12px 20px",
                        borderRadius: "8px",
                        fontSize: "14px",
                        zIndex: 20,
                        pointerEvents: "none",
                      }}
                    >
                      Click and drag to select area to crop
                    </Box>
                  )}
                </MDBox>

              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </Box>
      
      {/* Share Modal */}
      <Modal
        open={showShareModal}
        onClose={closeModal}
        aria-labelledby="share-modal-title"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "95%", sm: "500px" },
            maxHeight: "90vh",
            overflow: "auto",
            bgcolor: "background.paper",
            borderRadius: "16px",
            boxShadow: 24,
            p: 4,
          }}
        >
          <MDTypography id="share-modal-title" variant="h5" mb={2} fontWeight="bold">
            Share Cropped News
          </MDTypography>
          
          {croppedImageUrl ? (
            <Box mb={3} textAlign="center">
              <img
                src={croppedImageUrl}
                alt="Cropped selection"
                style={{
                  maxWidth: "100%",
                  maxHeight: "300px",
                  objectFit: "contain",
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0",
                }}
              />
            </Box>
          ) : (
            <MDBox mb={3} p={3} bgcolor="grey-100" borderRadius="md" textAlign="center">
              <MDTypography variant="body2" color="text">
                Generating cropped image...
              </MDTypography>
            </MDBox>
          )}
          
          {/* Social Media Share Buttons */}
          <MDTypography variant="h6" mb={2} textAlign="center">
            Share on Social Media
          </MDTypography>
          
          <MDBox display="flex" flexWrap="wrap" gap={1} justifyContent="center" mb={3}>
            <MDButton
              variant="gradient"
              color="info"
              size="small"
              onClick={shareOnFacebook}
              sx={{ background: "linear-gradient(45deg, #1877F2, #1877F2)", color: "white" }}
            >
              <Icon sx={{ mr: 0.5 }}>facebook</Icon>
              Facebook
            </MDButton>
            <MDButton
              variant="gradient"
              color="info"
              size="small"
              onClick={shareOnTwitter}
              sx={{ background: "linear-gradient(45deg, #1DA1F2, #1DA1F2)", color: "white" }}
            >
              <Icon sx={{ mr: 0.5 }}>twitter</Icon>
              Twitter
            </MDButton>
            <MDButton
              variant="gradient"
              color="success"
              size="small"
              onClick={shareOnWhatsApp}
              sx={{ background: "linear-gradient(45deg, #25D366, #25D366)", color: "white" }}
            >
              <Icon sx={{ mr: 0.5 }}>whatsapp</Icon>
              WhatsApp
            </MDButton>
            <MDButton
              variant="gradient"
              color="primary"
              size="small"
              onClick={shareOnLinkedIn}
              sx={{ background: "linear-gradient(45deg, #0A66C2, #0A66C2)", color: "white" }}
            >
              <Icon sx={{ mr: 0.5 }}>linkedin</Icon>
              LinkedIn
            </MDButton>
            <MDButton
              variant="gradient"
              color="dark"
              size="small"
              onClick={shareViaEmail}
            >
              <Icon sx={{ mr: 0.5 }}>email</Icon>
              Email
            </MDButton>
          </MDBox>
          
          <MDBox display="flex" gap={2} mb={2}>
            <MDButton
              variant="outlined"
              color="info"
              fullWidth
              onClick={copyToClipboard}
              disabled={!croppedImageUrl}
            >
              <Icon sx={{ mr: 1 }}>content_copy</Icon>
              Copy Link
            </MDButton>
            <MDButton
              variant="gradient"
              color="success"
              fullWidth
              onClick={downloadCroppedImage}
              disabled={!croppedImageUrl}
            >
              <Icon sx={{ mr: 1 }}>download</Icon>
              Download
            </MDButton>
          </MDBox>
          
          <MDBox display="flex" justifyContent="center">
            <MDButton
              variant="outlined"
              color="secondary"
              onClick={closeModal}
            >
              Close
            </MDButton>
          </MDBox>
        </Box>
      </Modal>
    </Box>
  );
}

export default PublicEPaperViewer;
