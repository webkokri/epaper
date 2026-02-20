/**
=========================================================
* Crop and Share
=========================================================
*/

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import MDSnackbar from "components/MDSnackbar";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// API
import { epaperAPI, API_URL } from "services/api";

function CropAndShare() {
  const { id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  
  const [ePaper, setEPaper] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [scale, setScale] = useState(1);
  
  // Share form state
  const [shareTitle, setShareTitle] = useState("");
  const [shareDescription, setShareDescription] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  
  const [notification, setNotification] = useState({ open: false, message: "", color: "success" });

  useEffect(() => {
    fetchEPaper();
  }, [id]);

  const fetchEPaper = async () => {
    try {
      const response = await epaperAPI.getById(id);
      setEPaper(response.data);
      setShareTitle(`Share from ${response.data.title}`);
    } catch (error) {
      console.error("Error fetching e-paper:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  };

  const handleMouseDown = (e) => {
    const coords = getCanvasCoordinates(e);
    setIsDrawing(true);
    setStartPoint(coords);
    setEndPoint(coords);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const coords = getCanvasCoordinates(e);
    setEndPoint(coords);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    
    // Draw selection rectangle
    if (startPoint && endPoint) {
      const x = Math.min(startPoint.x, endPoint.x) * scale;
      const y = Math.min(startPoint.y, endPoint.y) * scale;
      const width = Math.abs(endPoint.x - startPoint.x) * scale;
      const height = Math.abs(endPoint.y - endPoint.y) * scale;
      
      ctx.strokeStyle = "#1A73E8";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
      
      ctx.fillStyle = "rgba(26, 115, 232, 0.2)";
      ctx.fillRect(x, y, width, height);
      
      // Draw dimensions
      ctx.fillStyle = "#1A73E8";
      ctx.font = "bold 14px Arial";
      ctx.fillText(`${Math.round(width)} x ${Math.round(height)}`, x, y - 5);
    }
  }, [startPoint, endPoint, scale]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleImageLoad = () => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (image && canvas) {
      canvas.width = image.naturalWidth * scale;
      canvas.height = image.naturalHeight * scale;
      drawCanvas();
    }
  };

  const handleCropAndShare = async () => {
    if (!startPoint || !endPoint) {
      setNotification({
        open: true,
        message: "Please select an area to crop first",
        color: "error",
      });
      return;
    }

    try {
      const currentPageData = ePaper.pages[currentPage];
      
      const cropData = {
        e_paper_id: id,
        page_id: currentPageData.id,
        x: Math.min(startPoint.x, endPoint.x),
        y: Math.min(startPoint.y, endPoint.y),
        width: Math.abs(endPoint.x - startPoint.x),
        height: Math.abs(endPoint.y - endPoint.y),
        share_title: shareTitle,
        share_description: shareDescription,
        is_public: isPublic,
      };

      const response = await epaperAPI.cropAndShare(cropData);
      
      setShareUrl(response.data.share_url);
      
      setNotification({
        open: true,
        message: "Cropped image created successfully! Share URL generated.",
        color: "success",
      });
      
    } catch (error) {
      console.error("Error cropping and sharing:", error);
      setNotification({
        open: true,
        message: error.response?.data?.message || "Error creating share",
        color: "error",
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setNotification({
      open: true,
      message: "Share URL copied to clipboard!",
      color: "success",
    });
  };

  const clearSelection = () => {
    setStartPoint(null);
    setEndPoint(null);
    setShareUrl("");
  };

  if (loading || !ePaper) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox pt={6} pb={3} textAlign="center">
          <MDTypography variant="h6">Loading...</MDTypography>
        </MDBox>
      </DashboardLayout>
    );
  }

  const currentPageData = ePaper.pages[currentPage];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={3}>
          {/* Header */}
          <Grid item xs={12}>
            <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <MDTypography variant="h4">Crop & Share: {ePaper.title}</MDTypography>
              <MDButton
                variant="outlined"
                color="secondary"
                onClick={() => navigate(`/epapers/view/${id}`)}
              >
                Back to Viewer
              </MDButton>
            </MDBox>
          </Grid>

          {/* Canvas Area */}
          <Grid item xs={12} md={8}>
            <Card>
              <MDBox p={2}>
                {/* Toolbar */}
                <MDBox
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                  p={1}
                  bgColor="grey-100"
                  borderRadius="md"
                >
                  <MDBox display="flex" gap={1} alignItems="center">
                    <MDTypography variant="button">
                      Page {currentPage + 1} of {ePaper.pages.length}
                    </MDTypography>
                    <MDButton
                      size="small"
                      color="info"
                      onClick={() => {
                        setCurrentPage(Math.max(0, currentPage - 1));
                        clearSelection();
                      }}
                      disabled={currentPage === 0}
                    >
                      <Icon>arrow_back</Icon>
                    </MDButton>
                    <MDButton
                      size="small"
                      color="info"
                      onClick={() => {
                        setCurrentPage(Math.min(ePaper.pages.length - 1, currentPage + 1));
                        clearSelection();
                      }}
                      disabled={currentPage === ePaper.pages.length - 1}
                    >
                      <Icon>arrow_forward</Icon>
                    </MDButton>
                  </MDBox>
                  <MDButton
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={clearSelection}
                    disabled={!startPoint}
                  >
                    <Icon sx={{ mr: 1 }}>clear</Icon>
                    Clear Selection
                  </MDButton>
                </MDBox>

                {/* Instructions */}
                <MDBox mb={2} p={1} bgColor="info" borderRadius="md">
                  <MDTypography variant="caption" color="white">
                    <Icon sx={{ fontSize: 16, verticalAlign: "middle", mr: 0.5 }}>info</Icon>
                    Click and drag on the image to select the area you want to crop and share
                  </MDTypography>
                </MDBox>

                {/* Canvas with Image */}
                <MDBox
                  position="relative"
                  display="flex"
                  justifyContent="center"
                  bgcolor="grey-200"
                  borderRadius="md"
                  overflow="auto"
                  maxHeight="700px"
                >
                  <img
                    ref={imageRef}
                    src={`${API_URL.replace('/api', '')}${currentPageData.image_path}`}
                    alt={`Page ${currentPage + 1}`}
                    style={{ display: "none" }}
                    onLoad={handleImageLoad}
                  />
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{
                      cursor: "crosshair",
                      maxWidth: "100%",
                    }}
                  />
                </MDBox>
              </MDBox>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Card>
              <MDBox p={2}>
                <MDTypography variant="h6" mb={2}>
                  Share Settings
                </MDTypography>
                
                <MDBox mb={2}>
                  <MDInput
                    type="text"
                    label="Share Title"
                    fullWidth
                    value={shareTitle}
                    onChange={(e) => setShareTitle(e.target.value)}
                  />
                </MDBox>

                <MDBox mb={2}>
                  <MDInput
                    type="text"
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                    value={shareDescription}
                    onChange={(e) => setShareDescription(e.target.value)}
                  />
                </MDBox>

                <MDBox mb={2} display="flex" alignItems="center">
                  <input
                    type="checkbox"
                    id="is-public"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    style={{ marginRight: "8px" }}
                  />
                  <MDTypography variant="button" htmlFor="is-public" component="label">
                    Make this share public
                  </MDTypography>
                </MDBox>

                {startPoint && endPoint && (
                  <MDBox mb={2} p={1} bgColor="grey-100" borderRadius="md">
                    <MDTypography variant="caption" display="block">
                      Selection: {Math.abs(endPoint.x - startPoint.x).toFixed(0)} x {Math.abs(endPoint.y - startPoint.y).toFixed(0)} pixels
                    </MDTypography>
                  </MDBox>
                )}

                <MDButton
                  variant="gradient"
                  color="success"
                  fullWidth
                  onClick={handleCropAndShare}
                  disabled={!startPoint || !endPoint}
                >
                  <Icon sx={{ mr: 1 }}>crop</Icon>
                  Crop & Generate Share Link
                </MDButton>

                {/* Share URL Display */}
                {shareUrl && (
                  <MDBox mt={3} p={2} bgColor="success" borderRadius="md">
                    <MDTypography variant="h6" color="white" mb={1}>
                      Share URL Generated!
                    </MDTypography>
                    <MDBox
                      p={1}
                      bgColor="white"
                      borderRadius="md"
                      mb={1}
                      sx={{ wordBreak: "break-all" }}
                    >
                      <MDTypography variant="caption">
                        {shareUrl}
                      </MDTypography>
                    </MDBox>
                    <MDButton
                      variant="outlined"
                      color="white"
                      fullWidth
                      onClick={copyToClipboard}
                    >
                      <Icon sx={{ mr: 1 }}>content_copy</Icon>
                      Copy to Clipboard
                    </MDButton>
                  </MDBox>
                )}

                {/* Preview */}
                {startPoint && endPoint && (
                  <MDBox mt={3}>
                    <MDTypography variant="h6" mb={1}>
                      Selection Preview
                    </MDTypography>
                    <MDBox
                      border="1px solid #ccc"
                      borderRadius="md"
                      overflow="hidden"
                    >
                      <canvas
                        ref={(canvas) => {
                          if (canvas && imageRef.current) {
                            const ctx = canvas.getContext("2d");
                            const width = Math.abs(endPoint.x - startPoint.x);
                            const height = Math.abs(endPoint.y - startPoint.y);
                            canvas.width = width;
                            canvas.height = height;
                            
                            ctx.drawImage(
                              imageRef.current,
                              Math.min(startPoint.x, endPoint.x),
                              Math.min(startPoint.y, endPoint.y),
                              width,
                              height,
                              0,
                              0,
                              width,
                              height
                            );
                          }
                        }}
                        style={{ maxWidth: "100%", height: "auto" }}
                      />
                    </MDBox>
                  </MDBox>
                )}
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
      <MDSnackbar
        color={notification.color}
        icon={notification.color === "success" ? "check" : "error"}
        title={notification.color === "success" ? "Success" : "Error"}
        content={notification.message}
        dateTime={new Date().toLocaleString()}
        open={notification.open}
        onClose={() => setNotification({ ...notification, open: false })}
        close={() => setNotification({ ...notification, open: false })}
        bgWhite
      />
    </DashboardLayout>
  );
}

export default CropAndShare;
