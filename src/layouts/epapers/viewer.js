/**
=========================================================
* E-Paper Viewer
=========================================================
*/

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// API
import { epaperAPI, API_URL } from "services/api";

function EPaperViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ePaper, setEPaper] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    fetchEPaper();
  }, [id]);

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

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (ePaper && currentPage < ePaper.pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    setScale(Math.min(scale + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(Math.max(scale - 0.1, 0.5));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox pt={6} pb={3} textAlign="center">
          <MDTypography variant="h6">Loading...</MDTypography>
        </MDBox>
      </DashboardLayout>
    );
  }

  if (!ePaper) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox pt={6} pb={3} textAlign="center">
          <MDTypography variant="h6">E-Paper not found</MDTypography>
          <MDButton color="info" onClick={() => navigate("/epapers")}>
            Back to E-Papers
          </MDButton>
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
              <MDTypography variant="h4">{ePaper.title}</MDTypography>
              <MDBox display="flex" gap={1}>
                <MDButton
                  variant="outlined"
                  color="info"
                  size="small"
                  onClick={() => navigate(`/epapers/edit-areas/${id}`)}
                >
                  <Icon sx={{ mr: 1 }}>edit</Icon>
                  Edit Areas
                </MDButton>
                <MDButton
                  variant="outlined"
                  color="success"
                  size="small"
                  onClick={() => navigate(`/epapers/crop/${id}`)}
                >
                  <Icon sx={{ mr: 1 }}>crop</Icon>
                  Crop & Share
                </MDButton>
                <MDButton
                  variant="outlined"
                  color="secondary"
                  size="small"
                  onClick={() => navigate("/epapers")}
                >
                  Back
                </MDButton>
              </MDBox>
            </MDBox>
          </Grid>

          {/* Page Viewer */}
          <Grid item xs={12} md={9}>
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
                  <MDBox display="flex" gap={1}>
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
                  <MDTypography variant="button">
                    Page {currentPage + 1} of {ePaper.pages.length}
                  </MDTypography>
                </MDBox>

                {/* Page Image */}
                <MDBox
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  minHeight="600px"
                  bgcolor="grey-200"
                  borderRadius="md"
                  overflow="hidden"
                >
                  {currentPageData && (
                    <MDBox
                      component="img"
                      src={`${API_URL.replace('/api', '')}${currentPageData.image_path}`}
                      alt={`Page ${currentPage + 1}`}
                      sx={{
                        maxWidth: "100%",
                        maxHeight: "800px",
                        transform: `scale(${scale})`,
                        transition: "transform 0.2s ease",
                        cursor: "crosshair",
                      }}
                    />
                  )}
                </MDBox>

                {/* Navigation */}
                <MDBox display="flex" justifyContent="center" gap={2} mt={2}>
                  <MDButton
                    variant="gradient"
                    color="info"
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                  >
                    <Icon>arrow_back</Icon>
                    Previous
                  </MDButton>
                  <MDButton
                    variant="gradient"
                    color="info"
                    onClick={handleNextPage}
                    disabled={currentPage === ePaper.pages.length - 1}
                  >
                    Next
                    <Icon sx={{ ml: 1 }}>arrow_forward</Icon>
                  </MDButton>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>

          {/* Sidebar - Page Thumbnails */}
          <Grid item xs={12} md={3}>
            <Card>
              <MDBox p={2}>
                <MDTypography variant="h6" mb={2}>
                  Pages
                </MDTypography>
                <MDBox
                  sx={{
                    maxHeight: "700px",
                    overflowY: "auto",
                    "&::-webkit-scrollbar": {
                      width: "8px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: "#ccc",
                      borderRadius: "4px",
                    },
                  }}
                >
                  {ePaper.pages.map((page, index) => (
                    <MDBox
                      key={page.id}
                      mb={1}
                      p={1}
                      borderRadius="md"
                      sx={{
                        cursor: "pointer",
                        border: currentPage === index ? "2px solid #1A73E8" : "2px solid transparent",
                        bgcolor: currentPage === index ? "rgba(26, 115, 232, 0.1)" : "transparent",
                        "&:hover": {
                          bgcolor: "rgba(0, 0, 0, 0.05)",
                        },
                      }}
                      onClick={() => setCurrentPage(index)}
                    >
                      <MDBox
                        component="img"
                        src={`${API_URL.replace('/api', '')}${page.image_path}`}
                        alt={`Page ${index + 1}`}
                        width="100%"
                        height="auto"
                        borderRadius="sm"
                      />
                      <MDTypography variant="caption" display="block" textAlign="center" mt={0.5}>
                        Page {index + 1}
                      </MDTypography>
                    </MDBox>
                  ))}
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default EPaperViewer;
