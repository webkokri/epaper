/**
=========================================================
* E-Paper Publishing Platform
=========================================================
*/

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDBadge from "components/MDBadge";
import MDSnackbar from "components/MDSnackbar";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";

// API
import { epaperAPI } from "services/api";

// Images
import { API_URL } from "services/api";

function EPapers() {
  const [ePapers, setEPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: "", color: "success" });
  const navigate = useNavigate();

  useEffect(() => {
    fetchEPapers();
  }, []);

  const fetchEPapers = async () => {
    try {
      const response = await epaperAPI.getAll();
      setEPapers(response.data);
    } catch (error) {
      console.error("Error fetching e-papers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this e-paper?")) return;

    try {
      await epaperAPI.delete(id);
      fetchEPapers();
    } catch (error) {
      console.error("Error deleting e-paper:", error);
    }
  };

  const handlePublish = async (id) => {
    try {
      await epaperAPI.publish(id);
      fetchEPapers();
    } catch (error) {
      console.error("Error publishing e-paper:", error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: "warning",
      published: "success",
      live: "success",
      archived: "dark",
      disable: "dark",
      enable: "success",
      private: "warning",
      public: "info",
    };
    return colors[status] || "info";
  };

  const handleStatusChange = async (paperId, newStatus) => {
    try {
      let updateData = {};
      
      // Map dropdown values to database fields
      if (newStatus === "private") {
        updateData = { is_public: false };
      } else if (newStatus === "public") {
        updateData = { is_public: true };
      } else if (newStatus === "enable") {
        updateData = { status: "live" };
      } else if (newStatus === "disable") {
        updateData = { status: "archived" };
      }

      await epaperAPI.update(paperId, updateData);
      
      // Update local state
      setEPapers(ePapers.map(paper => 
        paper.id === paperId 
          ? { ...paper, ...updateData, statusDisplay: newStatus }
          : paper
      ));
      
      setNotification({
        open: true,
        message: "Status updated successfully",
        color: "success"
      });
      
      // Refresh to get updated data
      fetchEPapers();
    } catch (error) {
      console.error("Error updating status:", error);
      setNotification({
        open: true,
        message: "Error updating status",
        color: "error"
      });
    }
  };

  const getCurrentStatusValue = (paper) => {
    // Determine current dropdown value based on paper state
    if (paper.status === "archived") return "disable";
    if (paper.status === "live" || paper.status === "published") return "enable";
    if (paper.is_public === false) return "private";
    if (paper.is_public === true) return "public";
    return "enable"; // default
  };

  const closeNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const EPaperCard = ({ image, title, description }) => (
    <MDBox display="flex" alignItems="center" lineHeight={1}>
      <MDBox
        component="img"
        src={image || "/assets/images/home-decor-1.jpg"}
        alt={title}
        width="60px"
        height="80px"
        borderRadius="md"
        sx={{ objectFit: "cover" }}
      />
      <MDBox ml={2} lineHeight={1}>
        <MDTypography display="block" variant="button" fontWeight="medium">
          {title}
        </MDTypography>
        <MDTypography variant="caption" color="text">
          {description?.substring(0, 50)}...
        </MDTypography>
      </MDBox>
    </MDBox>
  );

  const columns = [
    { Header: "e-paper", accessor: "epaper", width: "40%", align: "left" },
    { Header: "pages", accessor: "pages", align: "center" },
    { Header: "status", accessor: "status", align: "center" },
    { Header: "created", accessor: "created", align: "center" },
    { Header: "action", accessor: "action", align: "center" },
  ];

  const rows = ePapers.map((paper) => ({
    epaper: (
      <EPaperCard
        image={paper.thumbnail_path ? `${API_URL.replace('/api', '')}${paper.thumbnail_path}` : null}
        title={paper.title}
        description={paper.description}
      />
    ),
    pages: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {paper.page_count || paper.total_pages} pages
      </MDTypography>
    ),
    status: (
      <MDBox ml={-1} minWidth={120}>
        <FormControl fullWidth size="small" variant="outlined">
          <InputLabel id={`status-label-${paper.id}`} sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
          <Select
            labelId={`status-label-${paper.id}`}
            id={`status-${paper.id}`}
            value={getCurrentStatusValue(paper)}
            onChange={(e) => handleStatusChange(paper.id, e.target.value)}
            label="Status"
            sx={{ 
              fontSize: '0.75rem',
              height: '32px',
              '& .MuiSelect-select': {
                padding: '4px 8px',
              }
            }}
          >
            <MenuItem value="private" sx={{ fontSize: '0.75rem' }}>
              <MDBadge badgeContent="Private" color="warning" variant="gradient" size="sm" />
            </MenuItem>
            <MenuItem value="public" sx={{ fontSize: '0.75rem' }}>
              <MDBadge badgeContent="Public" color="info" variant="gradient" size="sm" />
            </MenuItem>
            <MenuItem value="enable" sx={{ fontSize: '0.75rem' }}>
              <MDBadge badgeContent="Enable" color="success" variant="gradient" size="sm" />
            </MenuItem>
            <MenuItem value="disable" sx={{ fontSize: '0.75rem' }}>
              <MDBadge badgeContent="Disable" color="dark" variant="gradient" size="sm" />
            </MenuItem>
          </Select>
        </FormControl>
      </MDBox>
    ),
    created: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {new Date(paper.created_at).toLocaleDateString()}
      </MDTypography>
    ),
    action: (
      <MDBox display="flex" gap={1} alignItems="center">
        <MDButton
          variant="text"
          color="info"
          onClick={() => navigate(`/epapers/view/${paper.id}`)}
        >
          <Icon>visibility</Icon>
        </MDButton>
        <MDButton
          variant="text"
          color="success"
          onClick={() => handlePublish(paper.id)}
          disabled={paper.status === "published"}
        >
          <Icon>publish</Icon>
        </MDButton>
        <MDButton
          variant="text"
          color="primary"
          onClick={() => navigate(`/epapers/edit-areas/${paper.id}`)}
        >
          <Icon>edit</Icon>
        </MDButton>
        <MDButton
          variant="text"
          color="error"
          onClick={() => handleDelete(paper.id)}
        >
          <Icon>delete</Icon>
        </MDButton>
      </MDBox>
    ),
  }));

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <MDTypography variant="h6" color="white">
                  E-Papers {loading && "(Loading...)"}
                </MDTypography>
                <MDButton
                  variant="gradient"
                  color="success"
                  onClick={() => navigate("/epapers/upload")}
                >
                  <Icon sx={{ mr: 1 }}>add</Icon>
                  Upload New
                </MDButton>
              </MDBox>
              <MDBox pt={3}>
                <DataTable
                  table={{ columns, rows }}
                  isSorted={false}
                  entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20, 25] }}
                  showTotalEntries
                  noEndBorder
                  canSearch
                />
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
        onClose={closeNotification}
        close={closeNotification}
        bgWhite
      />
    </DashboardLayout>
  );
}

export default EPapers;
