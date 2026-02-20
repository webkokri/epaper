/**
=========================================================
* Material Dashboard 2 React - Subscription Management
=========================================================

* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useState, useEffect } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

// @mui icons
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import MDSnackbar from "components/MDSnackbar";

// Material Dashboard 2 React examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";

// API
import { subscriptionAPI } from "services/api";

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`subscription-tabpanel-${index}`}
      aria-labelledby={`subscription-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Subscriptions() {
  const [activeTab, setActiveTab] = useState(0);
  const [plans, setPlans] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    interval: "monthly",
    is_free: false,
    is_active: true,
    features: []
  });
  const [featureInput, setFeatureInput] = useState("");
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, subscribersRes, paymentsRes] = await Promise.all([
        subscriptionAPI.getAllPlans(),
        subscriptionAPI.getAllSubscriptions(),
        subscriptionAPI.getPaymentHistory()
      ]);
      
      setPlans(plansRes.data);
      setSubscribers(subscribersRes.data);
      setPayments(paymentsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      showSnackbar("Error fetching data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, color = "success") => {
    setSnackbar({ open: true, message, color });
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenDialog = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || "",
        price: plan.price,
        interval: plan.interval,
        is_free: plan.is_free,
        is_active: plan.is_active,
        features: JSON.parse(plan.features || "[]")
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        interval: "monthly",
        is_free: false,
        is_active: true,
        features: []
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPlan(null);
    setFeatureInput("");
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()]
      });
      setFeatureInput("");
    }
  };

  const handleRemoveFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price) || 0
      };

      if (editingPlan) {
        await subscriptionAPI.updatePlan(editingPlan.id, submitData);
        showSnackbar("Plan updated successfully");
      } else {
        await subscriptionAPI.createPlan(submitData);
        showSnackbar("Plan created successfully");
      }
      
      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error("Error saving plan:", error);
      showSnackbar(error.response?.data?.message || "Error saving plan", "error");
    }
  };

  const handleToggleStatus = async (plan) => {
    try {
      await subscriptionAPI.togglePlanStatus(plan.id, !plan.is_active);
      showSnackbar(`Plan ${plan.is_active ? "disabled" : "enabled"} successfully`);
      fetchData();
    } catch (error) {
      console.error("Error toggling plan status:", error);
      showSnackbar("Error toggling plan status", "error");
    }
  };

  const handleDeleteClick = (plan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await subscriptionAPI.deletePlan(planToDelete.id);
      showSnackbar("Plan deleted successfully");
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting plan:", error);
      showSnackbar(error.response?.data?.message || "Error deleting plan", "error");
    }
  };

  // Table columns for plans
  const plansColumns = [
    { Header: "Name", accessor: "name", width: "20%" },
    { Header: "Price", accessor: "price", width: "15%", Cell: ({ value, row }) => (
      <MDTypography variant="button" color={row.original.is_free ? "success" : "text"}>
        {row.original.is_free ? "Free" : `$${value}`}
      </MDTypography>
    )},
    { Header: "Interval", accessor: "interval", width: "15%" },
    { 
      Header: "Enable/Disable", 
      accessor: "toggle_status", 
      width: "15%",
      Cell: ({ row }) => (
        <Tooltip title={row.original.is_active ? "Click to disable" : "Click to enable"}>
          <Switch
            checked={row.original.is_active}
            onChange={() => handleToggleStatus(row.original)}
            color={row.original.is_active ? "success" : "default"}
          />
        </Tooltip>
      )
    },
    { Header: "Status", accessor: "status_display", width: "15%", Cell: ({ row }) => (
      <Chip 
        label={row.original.is_active ? "Active" : "Inactive"} 
        color={row.original.is_active ? "success" : "default"}
        size="small"
      />
    )},
    { 
      Header: "Actions", 
      accessor: "actions", 
      width: "20%",
      Cell: ({ row }) => (
        <MDBox display="flex" gap={1}>
          <Tooltip title="Edit">
            <IconButton onClick={() => handleOpenDialog(row.original)} color="info">
              <Icon>edit</Icon>
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => handleDeleteClick(row.original)} color="error">
              <Icon>delete</Icon>
            </IconButton>
          </Tooltip>
        </MDBox>
      )
    }
  ];

  // Table columns for subscribers
  const subscribersColumns = [
    { Header: "User", accessor: "user_name", width: "25%" },
    { Header: "Email", accessor: "user_email", width: "25%" },
    { Header: "Plan", accessor: "plan_name", width: "20%" },
    { Header: "Status", accessor: "status", width: "15%", Cell: ({ value }) => (
      <Chip 
        label={value} 
        color={value === "active" ? "success" : value === "canceled" ? "error" : "warning"}
        size="small"
      />
    )},
    { Header: "Period End", accessor: "current_period_end", width: "15%", Cell: ({ value }) => (
      value ? new Date(value).toLocaleDateString() : "N/A"
    )}
  ];

  // Table columns for payments
  const paymentsColumns = [
    { Header: "User", accessor: "user_name", width: "20%" },
    { Header: "Email", accessor: "user_email", width: "20%" },
    { Header: "Amount", accessor: "amount", width: "15%", Cell: ({ value, row }) => (
      <MDTypography variant="button">
        ${value} {row.original.currency}
      </MDTypography>
    )},
    { Header: "Status", accessor: "status", width: "15%", Cell: ({ value }) => (
      <Chip 
        label={value} 
        color={value === "succeeded" ? "success" : value === "failed" ? "error" : "warning"}
        size="small"
      />
    )},
    { Header: "Date", accessor: "created_at", width: "15%", Cell: ({ value }) => (
      new Date(value).toLocaleDateString()
    )},
    { Header: "Description", accessor: "description", width: "15%" }
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar absolute isMini />
      <MDBox mt={8} mb={3}>
        <MDBox mb={3}>
          <MDTypography variant="h3" fontWeight="medium">
            Subscription Management
          </MDTypography>
          <MDTypography variant="body2" color="text">
            Manage subscription plans, view subscribers, and monitor payments
          </MDTypography>
        </MDBox>

        <Card>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Plans" />
            <Tab label="Subscribers" />
            <Tab label="Payment History" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <MDTypography variant="h6">Subscription Plans</MDTypography>
              <MDButton 
                variant="gradient" 
                color="info"
                onClick={() => handleOpenDialog()}
              >
                <Icon sx={{ mr: 1 }}>add</Icon>
                Create Plan
              </MDButton>
            </MDBox>
            
            <DataTable
              table={{ columns: plansColumns, rows: plans }}
              isSorted={false}
              entriesPerPage={false}
              showTotalEntries={false}
              noEndBorder
            />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <MDBox mb={3}>
              <MDTypography variant="h6">All Subscribers</MDTypography>
            </MDBox>
            
            <DataTable
              table={{ columns: subscribersColumns, rows: subscribers }}
              isSorted={false}
              entriesPerPage={{ defaultValue: 10 }}
              showTotalEntries={true}
              noEndBorder
            />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <MDBox mb={3}>
              <MDTypography variant="h6">Payment History</MDTypography>
            </MDBox>
            
            <DataTable
              table={{ columns: paymentsColumns, rows: payments }}
              isSorted={false}
              entriesPerPage={{ defaultValue: 10 }}
              showTotalEntries={true}
              noEndBorder
            />
          </TabPanel>
        </Card>
      </MDBox>
      <Footer />

      {/* Create/Edit Plan Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPlan ? "Edit Subscription Plan" : "Create Subscription Plan"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Plan Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Interval</InputLabel>
                <Select
                  name="interval"
                  value={formData.interval}
                  onChange={handleInputChange}
                  label="Interval"
                >
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Price ($)"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                disabled={formData.is_free}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_free}
                    onChange={handleInputChange}
                    name="is_free"
                  />
                }
                label="Free Plan"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    name="is_active"
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12}>
              <MDTypography variant="h6" gutterBottom>
                Features
              </MDTypography>
              <MDBox display="flex" gap={1} mb={2}>
                <MDInput
                  placeholder="Add a feature..."
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddFeature()}
                  fullWidth
                />
                <MDButton variant="outlined" color="info" onClick={handleAddFeature}>
                  Add
                </MDButton>
              </MDBox>
              <MDBox display="flex" flexWrap="wrap" gap={1}>
                {formData.features.map((feature, index) => (
                  <Chip
                    key={index}
                    label={feature}
                    onDelete={() => handleRemoveFeature(index)}
                    color="info"
                    variant="outlined"
                  />
                ))}
              </MDBox>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCloseDialog} color="secondary">
            Cancel
          </MDButton>
          <MDButton onClick={handleSubmit} variant="gradient" color="info">
            {editingPlan ? "Update" : "Create"}
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <MDTypography>
            Are you sure you want to delete the plan "{planToDelete?.name}"? 
            This action cannot be undone.
          </MDTypography>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setDeleteDialogOpen(false)} color="secondary">
            Cancel
          </MDButton>
          <MDButton onClick={handleDeleteConfirm} variant="gradient" color="error">
            Delete
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <MDSnackbar
        color={snackbar.color}
        icon={snackbar.color === "success" ? "check" : "error"}
        title={snackbar.color === "success" ? "Success" : "Error"}
        content={snackbar.message}
        dateTime={new Date().toLocaleString()}
        open={snackbar.open}
        onClose={closeSnackbar}
        close={closeSnackbar}
        bgWhite
      >
        {snackbar.message}
      </MDSnackbar>
    </DashboardLayout>
  );
}

export default Subscriptions;
