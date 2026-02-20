/**
=========================================================
* Categories Management
=========================================================
*/

import { useState, useEffect } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

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
import DataTable from "examples/Tables/DataTable";

// API
import { categoriesAPI } from "services/api";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [notification, setNotification] = useState({ open: false, message: "", color: "success" });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
    setDialogOpen(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description || "" });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      await categoriesAPI.delete(id);
      fetchCategories();
      setNotification({
        open: true,
        message: "Category deleted successfully!",
        color: "success",
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      setNotification({
        open: true,
        message: error.response?.data?.message || "Error deleting category",
        color: "error",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setNotification({
        open: true,
        message: "Category name is required",
        color: "error",
      });
      return;
    }

    try {
      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, formData);
        setNotification({
          open: true,
          message: "Category updated successfully!",
          color: "success",
        });
      } else {
        await categoriesAPI.create(formData);
        setNotification({
          open: true,
          message: "Category created successfully!",
          color: "success",
        });
      }

      setDialogOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      setNotification({
        open: true,
        message: error.response?.data?.message || "Error saving category",
        color: "error",
      });
    }
  };

  const columns = [
    { Header: "name", accessor: "name", width: "30%", align: "left" },
    { Header: "description", accessor: "description", align: "left" },
    { Header: "created by", accessor: "created_by", align: "center" },
    { Header: "created", accessor: "created", align: "center" },
    { Header: "action", accessor: "action", align: "center" },
  ];

  const rows = categories.map((category) => ({
    name: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {category.name}
      </MDTypography>
    ),
    description: (
      <MDTypography variant="caption" color="text">
        {category.description || "No description"}
      </MDTypography>
    ),
    created_by: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {category.created_by_name || "Unknown"}
      </MDTypography>
    ),
    created: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {new Date(category.created_at).toLocaleDateString()}
      </MDTypography>
    ),
    action: (
      <MDBox display="flex" gap={1} alignItems="center">
        <MDButton
          variant="text"
          color="info"
          size="small"
          onClick={() => handleEdit(category)}
        >
          <Icon>edit</Icon>
        </MDButton>
        <MDButton
          variant="text"
          color="error"
          size="small"
          onClick={() => handleDelete(category.id)}
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
                  Categories {loading && "(Loading...)"}
                </MDTypography>
                <MDButton
                  variant="gradient"
                  color="success"
                  onClick={handleCreate}
                >
                  <Icon sx={{ mr: 1 }}>add</Icon>
                  Add Category
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingCategory ? "Edit Category" : "Create New Category"}
          </DialogTitle>
          <DialogContent>
            <MDBox mb={2}>
              <MDInput
                type="text"
                label="Category Name"
                fullWidth
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                type="text"
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </MDBox>
          </DialogContent>
          <DialogActions>
            <MDButton onClick={() => setDialogOpen(false)} color="secondary">
              Cancel
            </MDButton>
            <MDButton type="submit" color="info">
              {editingCategory ? "Update" : "Create"}
            </MDButton>
          </DialogActions>
        </form>
      </Dialog>

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

export default Categories;
