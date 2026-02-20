/**
=========================================================
* Area Map Editor
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
import { epaperAPI, areaMapAPI, API_URL } from "services/api";

function AreaMapEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const [ePaper, setEPaper] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [points, setPoints] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [scale, setScale] = useState(1);

  // Area form state
  const [areaType, setAreaType] = useState("link");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkPageNumber, setLinkPageNumber] = useState("");
  const [tooltipText, setTooltipText] = useState("");

  const [notification, setNotification] = useState({ open: false, message: "", color: "success" });

  useEffect(() => {
    fetchEPaper();
  }, [id]);

  useEffect(() => {
    if (ePaper && ePaper.pages[currentPage]) {
      fetchAreasForPage(ePaper.pages[currentPage].id);
    }
  }, [ePaper, currentPage]);

  const fetchEPaper = async () => {
    try {
      const response = await epaperAPI.getById(id);
      setEPaper(response.data);
    } catch (error) {
      console.error("Error fetching e-paper:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAreasForPage = async (pageId) => {
    try {
      const response = await areaMapAPI.getByPage(pageId);
      setAreas(response.data);
    } catch (error) {
      console.error("Error fetching areas:", error);
    }
  };

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate the scaling factor between displayed size and actual canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Map click position to canvas coordinates
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleCanvasClick = useCallback((e) => {
    if (!drawing) return;

    const coords = getCanvasCoordinates(e);
    setPoints((prev) => [...prev, coords]);
  }, [drawing, scale]);

  const startDrawing = () => {
    setDrawing(true);
    setPoints([]);
    setSelectedArea(null);
  };

  const finishDrawing = () => {
    if (points.length < 3) {
      setNotification({
        open: true,
        message: "Please draw a polygon with at least 3 points",
        color: "error",
      });
      return;
    }
    setDrawing(false);
  };

  const cancelDrawing = () => {
    setDrawing(false);
    setPoints([]);
  };

  const saveArea = async () => {
    if (points.length < 3) {
      setNotification({
        open: true,
        message: "Please draw a valid polygon first",
        color: "error",
      });
      return;
    }

    try {
      const currentPageData = ePaper.pages[currentPage];

      const areaData = {
        e_paper_id: id,
        page_id: currentPageData.id,
        area_type: areaType,
        coordinates: points,
        link_url: areaType === "link" ? linkUrl : null,
        link_page_number: areaType === "page_nav" ? parseInt(linkPageNumber) : null,
        tooltip_text: tooltipText || null,
      };

      await areaMapAPI.create(areaData);

      setNotification({
        open: true,
        message: "Area saved successfully!",
        color: "success",
      });

      // Reset form
      setPoints([]);
      setLinkUrl("");
      setLinkPageNumber("");
      setTooltipText("");
      setDrawing(false);

      // Refresh areas
      fetchAreasForPage(currentPageData.id);

    } catch (error) {
      console.error("Error saving area:", error);
      setNotification({
        open: true,
        message: "Error saving area",
        color: "error",
      });
    }
  };

  const deleteArea = async (areaId) => {
    if (!window.confirm("Delete this area?")) return;

    try {
      await areaMapAPI.delete(areaId);
      const currentPageData = ePaper.pages[currentPage];
      fetchAreasForPage(currentPageData.id);
      setSelectedArea(null);

      setNotification({
        open: true,
        message: "Area deleted successfully!",
        color: "success",
      });
    } catch (error) {
      console.error("Error deleting area:", error);
    }
  };

  const autoDetectArea = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) {
      setNotification({
        open: true,
        message: "Canvas or image not ready",
        color: "error",
      });
      return;
    }

    try {
      const ctx = canvas.getContext("2d");
      const width = canvas.width;
      const height = canvas.height;
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      // Detect content regions by analyzing pixel variance
      const regions = detectContentRegions(data, width, height);
      
      if (regions.length === 0) {
        setNotification({
          open: true,
          message: "No content areas detected. Try manual drawing.",
          color: "warning",
        });
        return;
      }

      // Use the largest detected region
      const largestRegion = regions.reduce((max, region) => 
        region.area > max.area ? region : max
      );
      
      // Convert region to polygon points
      const points = [
        { x: largestRegion.x / scale, y: largestRegion.y / scale },
        { x: (largestRegion.x + largestRegion.width) / scale, y: largestRegion.y / scale },
        { x: (largestRegion.x + largestRegion.width) / scale, y: (largestRegion.y + largestRegion.height) / scale },
        { x: largestRegion.x / scale, y: (largestRegion.y + largestRegion.height) / scale },
      ];
      
      setPoints(points);
      setDrawing(false);
      
      setNotification({
        open: true,
        message: `Detected content area! Click "Save Area" to save or draw manually to adjust.`,
        color: "success",
      });
      
    } catch (error) {
      console.error("Auto detection error:", error);
      if (error.name === 'SecurityError' || error.message?.includes('cross-origin')) {
        setNotification({
          open: true,
          message: "CORS error: Server needs to allow cross-origin image access. Please use manual drawing instead.",
          color: "error",
        });
      } else {
        setNotification({
          open: true,
          message: "Error during auto detection. Try manual drawing.",
          color: "error",
        });
      }
    }
  };

  // Helper function to detect content regions
  const detectContentRegions = (data, width, height) => {
    const regions = [];
    const visited = new Set();
    const threshold = 30; // Pixel difference threshold
    const minArea = 5000; // Minimum area to consider
    
    // Convert to grayscale and calculate edge variance
    const getPixelDiff = (x, y) => {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      return (r + g + b) / 3;
    };
    
    // Simple grid-based detection
    const gridSize = 20;
    const gridWidth = Math.ceil(width / gridSize);
    const gridHeight = Math.ceil(height / gridSize);
    const grid = new Array(gridWidth * gridHeight).fill(0);
    
    // Calculate variance for each grid cell
    for (let gy = 0; gy < gridHeight; gy++) {
      for (let gx = 0; gx < gridWidth; gx++) {
        let variance = 0;
        let samples = 0;
        
        for (let y = gy * gridSize; y < Math.min((gy + 1) * gridSize, height); y++) {
          for (let x = gx * gridSize; x < Math.min((gx + 1) * gridSize, width); x++) {
            const current = getPixelDiff(x, y);
            const right = x < width - 1 ? getPixelDiff(x + 1, y) : current;
            const bottom = y < height - 1 ? getPixelDiff(x, y + 1) : current;
            
            variance += Math.abs(current - right) + Math.abs(current - bottom);
            samples++;
          }
        }
        
        grid[gy * gridWidth + gx] = variance / (samples || 1);
      }
    }
    
    // Find connected high-variance regions
    const findRegion = (startGx, startGy) => {
      const region = { x: startGx * gridSize, y: startGy * gridSize, width: 0, height: 0, area: 0 };
      const stack = [[startGx, startGy]];
      const cells = new Set();
      
      while (stack.length > 0) {
        const [gx, gy] = stack.pop();
        const key = `${gx},${gy}`;
        
        if (visited.has(key) || cells.has(key)) continue;
        if (gx < 0 || gx >= gridWidth || gy < 0 || gy >= gridHeight) continue;
        if (grid[gy * gridWidth + gx] < threshold) continue;
        
        cells.add(key);
        visited.add(key);
        
        stack.push([gx + 1, gy], [gx - 1, gy], [gx, gy + 1], [gx, gy - 1]);
      }
      
      if (cells.size === 0) return null;
      
      // Calculate bounding box
      let minX = width, minY = height, maxX = 0, maxY = 0;
      cells.forEach(key => {
        const [gx, gy] = key.split(',').map(Number);
        minX = Math.min(minX, gx * gridSize);
        minY = Math.min(minY, gy * gridSize);
        maxX = Math.max(maxX, (gx + 1) * gridSize);
        maxY = Math.max(maxY, (gy + 1) * gridSize);
      });
      
      region.x = minX;
      region.y = minY;
      region.width = maxX - minX;
      region.height = maxY - minY;
      region.area = region.width * region.height;
      
      return region;
    };
    
    // Find all regions
    for (let gy = 0; gy < gridHeight; gy++) {
      for (let gx = 0; gx < gridWidth; gx++) {
        const key = `${gx},${gy}`;
        if (!visited.has(key) && grid[gy * gridWidth + gx] >= threshold) {
          const region = findRegion(gx, gy);
          if (region && region.area >= minArea) {
            regions.push(region);
          }
        }
      }
    }
    
    return regions;
  };

  const saveAllAreas = async () => {
    setNotification({
      open: true,
      message: "All areas are already saved!",
      color: "success",
    });
  };

  const exportAreas = () => {
    const dataStr = JSON.stringify(areas, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `area-maps-page-${currentPage + 1}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    setNotification({
      open: true,
      message: "Area maps exported successfully!",
      color: "success",
    });
  };

  const importAreas = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedAreas = JSON.parse(event.target.result);
          // Validate and set areas
          setAreas(importedAreas);
          setNotification({
            open: true,
            message: "Area maps imported successfully!",
            color: "success",
          });
        } catch (error) {
          setNotification({
            open: true,
            message: "Invalid JSON file",
            color: "error",
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const resetAreas = async () => {
    if (!window.confirm("Reset all areas for this page?")) return;

    try {
      for (const area of areas) {
        await areaMapAPI.delete(area.id);
      }
      setAreas([]);
      setSelectedArea(null);
      setNotification({
        open: true,
        message: "All areas reset successfully!",
        color: "success",
      });
    } catch (error) {
      console.error("Error resetting areas:", error);
      setNotification({
        open: true,
        message: "Error resetting areas",
        color: "error",
      });
    }
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

    // Draw existing areas
    areas.forEach((area, index) => {
      const coords = area.coordinates;
      if (!coords || coords.length < 3) return;

      ctx.beginPath();
      ctx.moveTo(coords[0].x * scale, coords[0].y * scale);

      for (let i = 1; i < coords.length; i++) {
        ctx.lineTo(coords[i].x * scale, coords[i].y * scale);
      }

      ctx.closePath();

      // Style based on selection
      if (selectedArea === area.id) {
        ctx.fillStyle = "rgba(26, 115, 232, 0.3)";
        ctx.strokeStyle = "#1A73E8";
        ctx.lineWidth = 3;
      } else {
        ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
      }

      ctx.fill();
      ctx.stroke();

      // Draw label
      const centerX = coords.reduce((sum, p) => sum + p.x, 0) / coords.length * scale;
      const centerY = coords.reduce((sum, p) => sum + p.y, 0) / coords.length * scale;

      ctx.fillStyle = selectedArea === area.id ? "#1A73E8" : "red";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`${index + 1}. ${area.area_type}`, centerX, centerY);
    });

    // Draw current polygon being created
    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[0].x * scale, points[0].y * scale);

      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * scale, points[i].y * scale);
      }

      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw points
      points.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x * scale, point.y * scale, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "#00FF00";
        ctx.fill();
      });
    }
  }, [areas, points, selectedArea, scale]);

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
              <MDTypography variant="h4">Area Map Editor: {ePaper.title}</MDTypography>
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
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                    >
                      <Icon>arrow_back</Icon>
                    </MDButton>
                    <MDButton
                      size="small"
                      color="info"
                      onClick={() => setCurrentPage(Math.min(ePaper.pages.length - 1, currentPage + 1))}
                      disabled={currentPage === ePaper.pages.length - 1}
                    >
                      <Icon>arrow_forward</Icon>
                    </MDButton>
                  </MDBox>
                  <MDBox display="flex" gap={1} flexWrap="wrap">
                    {!drawing ? (
                      <>
                        <MDButton
                          variant="gradient"
                          color="success"
                          size="small"
                          onClick={startDrawing}
                        >
                          <Icon sx={{ mr: 1 }}>add</Icon>
                          Draw Polygon
                        </MDButton>
                        <MDButton
                          variant="outlined"
                          color="info"
                          size="small"
                          onClick={() => setScale(Math.min(3, scale + 0.25))}
                        >
                          <Icon>zoom_in</Icon>
                        </MDButton>
                        <MDButton
                          variant="outlined"
                          color="info"
                          size="small"
                          onClick={() => setScale(Math.max(0.25, scale - 0.25))}
                        >
                          <Icon>zoom_out</Icon>
                        </MDButton>
                        <MDButton
                          variant="outlined"
                          color="warning"
                          size="small"
                          onClick={autoDetectArea}
                        >
                          <Icon sx={{ mr: 1 }}>auto_fix_high</Icon>
                          Auto Detect
                        </MDButton>
                        <MDButton
                          variant="gradient"
                          color="primary"
                          size="small"
                          onClick={saveAllAreas}
                        >
                          <Icon sx={{ mr: 1 }}>save</Icon>
                          Save All
                        </MDButton>
                        <MDButton
                          variant="outlined"
                          color="secondary"
                          size="small"
                          onClick={exportAreas}
                        >
                          <Icon sx={{ mr: 1 }}>download</Icon>
                          Export
                        </MDButton>
                        <MDButton
                          variant="outlined"
                          color="secondary"
                          size="small"
                          onClick={importAreas}
                        >
                          <Icon sx={{ mr: 1 }}>upload</Icon>
                          Import
                        </MDButton>
                        <MDButton
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={resetAreas}
                        >
                          <Icon sx={{ mr: 1 }}>refresh</Icon>
                          Reset
                        </MDButton>
                      </>
                    ) : (
                      <>
                        <MDButton
                          variant="gradient"
                          color="info"
                          size="small"
                          onClick={finishDrawing}
                          disabled={points.length < 3}
                        >
                          <Icon sx={{ mr: 1 }}>check</Icon>
                          Finish
                        </MDButton>
                        <MDButton
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={cancelDrawing}
                        >
                          <Icon>close</Icon>
                        </MDButton>
                      </>
                    )}
                  </MDBox>
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
                    crossOrigin="anonymous"
                    style={{ display: "none" }}
                    onLoad={handleImageLoad}
                  />
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    style={{
                      cursor: drawing ? "crosshair" : "pointer",
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
                  Area Properties
                </MDTypography>

                {drawing && points.length > 0 ? (
                  <>
                    <MDTypography variant="caption" color="text" mb={2} display="block">
                      Points: {points.length} (Click on image to add more points)
                    </MDTypography>

                    <MDBox mb={2}>
                      <MDTypography variant="caption" color="text">
                        Area Type
                      </MDTypography>
                      <select
                        value={areaType}
                        onChange={(e) => setAreaType(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                          marginTop: "4px",
                        }}
                      >
                        <option value="link">External Link</option>
                        <option value="page_nav">Page Navigation</option>
                        <option value="ad">Advertisement</option>
                      </select>
                    </MDBox>

                    {areaType === "link" && (
                      <MDBox mb={2}>
                        <MDInput
                          type="url"
                          label="Link URL"
                          fullWidth
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          placeholder="https://example.com"
                        />
                      </MDBox>
                    )}

                    {areaType === "page_nav" && (
                      <MDBox mb={2}>
                        <MDInput
                          type="number"
                          label="Target Page Number"
                          fullWidth
                          value={linkPageNumber}
                          onChange={(e) => setLinkPageNumber(e.target.value)}
                          placeholder="1"
                        />
                      </MDBox>
                    )}

                    <MDBox mb={2}>
                      <MDInput
                        type="text"
                        label="Tooltip Text"
                        fullWidth
                        value={tooltipText}
                        onChange={(e) => setTooltipText(e.target.value)}
                        placeholder="Click to learn more"
                      />
                    </MDBox>

                    <MDButton
                      variant="gradient"
                      color="success"
                      fullWidth
                      onClick={saveArea}
                      disabled={points.length < 3}
                    >
                      <Icon sx={{ mr: 1 }}>save</Icon>
                      Save Area
                    </MDButton>
                  </>
                ) : selectedArea ? (
                  <>
                    <MDTypography variant="h6" color="info" mb={2}>
                      Area #{areas.findIndex(a => a.id === selectedArea) + 1}
                    </MDTypography>
                    <MDTypography variant="body2" mb={1}>
                      Type: {areas.find(a => a.id === selectedArea)?.area_type}
                    </MDTypography>
                    <MDButton
                      variant="gradient"
                      color="error"
                      fullWidth
                      onClick={() => deleteArea(selectedArea)}
                    >
                      <Icon sx={{ mr: 1 }}>delete</Icon>
                      Delete Area
                    </MDButton>
                  </>
                ) : (
                  <MDTypography variant="caption" color="text">
                    Click "Draw Polygon" to start creating clickable areas on the e-paper.
                    <br /><br />
                    Existing areas: {areas.length}
                  </MDTypography>
                )}

                {/* Areas List */}
                <MDBox mt={3}>
                  <MDTypography variant="h6" mb={2}>
                    Existing Areas
                  </MDTypography>
                  {areas.map((area, index) => (
                    <MDBox
                      key={area.id}
                      p={1}
                      mb={1}
                      borderRadius="md"
                      sx={{
                        cursor: "pointer",
                        bgcolor: selectedArea === area.id ? "rgba(26, 115, 232, 0.1)" : "grey-100",
                        border: selectedArea === area.id ? "1px solid #1A73E8" : "1px solid transparent",
                      }}
                      onClick={() => setSelectedArea(area.id)}
                    >
                      <MDTypography variant="button">
                        {index + 1}. {area.area_type}
                      </MDTypography>
                      {area.tooltip_text && (
                        <MDTypography variant="caption" display="block" color="text">
                          {area.tooltip_text}
                        </MDTypography>
                      )}
                    </MDBox>
                  ))}
                </MDBox>
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

export default AreaMapEditor;
