/**
=========================================================
* User Management - Admin Panel
=========================================================
*/

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";

// Material Dashboard 2 React examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

// API
import { authAPI } from "services/api";

// Context
import { useAuth } from "context/AuthContext";

function UserManagement() {
  const { user: currentUser, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create"); // 'create' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Wait for auth to load before checking
    if (authLoading) return;
    
    // Redirect if not admin
    if (!isAdmin()) {
      navigate("/");
      return;
    }
    fetchUsers();
  }, [authLoading, isAdmin, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getAllUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setDialogMode("create");
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "user",
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (user) => {
    setDialogMode("edit");
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (dialogMode === "create" && !formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateForm()) return;

    try {
      await authAPI.createUser(formData);
      alert("User created successfully");
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      alert(error.response?.data?.message || "Failed to create user");
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    try {
      await authAPI.updateUserRole(selectedUser.id, formData.role);
      alert("User role updated successfully");
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      alert(error.response?.data?.message || "Failed to update user role");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser?.id) {
      alert("You cannot delete your own account");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      await authAPI.deleteUser(userId);
      alert("User deleted successfully");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(error.response?.data?.message || "Failed to delete user");
    }
  };

  const handleSubmit = () => {
    if (dialogMode === "create") {
      handleCreateUser();
    } else {
      handleUpdateRole();
    }
  };

  // Table columns
  const columns = [
    { Header: "Name", accessor: "name", width: "25%" },
    { Header: "Email", accessor: "email", width: "30%" },
    {
      Header: "Role",
      accessor: "role",
      width: "15%",
      Cell: ({ value }) => (
        <MDBox>
          <MDTypography
            variant="caption"
            color={value === "admin" ? "info" : value === "publisher" ? "success" : "text"}
            fontWeight={value === "admin" || value === "publisher" ? "bold" : "medium"}
          >
            {value === "admin" ? "Admin" : value === "publisher" ? "Publisher" : "User"}
          </MDTypography>
        </MDBox>
      ),
    },
    {
      Header: "Created",
      accessor: "created_at",
      width: "20%",
      Cell: ({ value }) => (
        <MDTypography variant="caption">
          {new Date(value).toLocaleDateString()}
        </MDTypography>
      ),
    },
    {
      Header: "Actions",
      accessor: "actions",
      width: "10%",
      Cell: ({ row }) => (
        <MDBox display="flex" gap={1}>
          <MDButton
            variant="text"
            color="info"
            size="small"
            onClick={() => handleOpenEditDialog(row.original)}
          >
            <Icon>edit</Icon>
          </MDButton>
          <MDButton
            variant="text"
            color="error"
            size="small"
            onClick={() => handleDeleteUser(row.original.id)}
            disabled={row.original.id === currentUser?.id}
          >
            <Icon>delete</Icon>
          </MDButton>
        </MDBox>
      ),
    },
  ];

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
                  User Management
                </MDTypography>
                <MDButton
                  variant="gradient"
                  color="success"
                  size="small"
                  onClick={handleOpenCreateDialog}
                >
                  <Icon sx={{ mr: 1 }}>add</Icon>
                  Add User
                </MDButton>
              </MDBox>
              <MDBox pt={3}>
                <DataTable
                  table={{ columns, rows: users }}
                  isSorted={true}
                  entriesPerPage={true}
                  showTotalEntries={true}
                  noEndBorder
                  canSearch={true}
                  isLoading={loading}
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      {/* Create/Edit User Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === "create" ? "Create New User" : "Edit User Role"}
        </DialogTitle>
        <DialogContent>
          <MDBox pt={2} pb={3} px={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={!!errors.name}
                  helperText={errors.name}
                  disabled={dialogMode === "edit"}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  disabled={dialogMode === "edit"}
                  margin="normal"
                />
              </Grid>
              {dialogMode === "create" && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    error={!!errors.password}
                    helperText={errors.password || "Minimum 6 characters"}
                    margin="normal"
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  margin="normal"
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="publisher">Publisher</MenuItem>
                  {dialogMode === "edit" && (
                    <MenuItem value="admin">Admin</MenuItem>
                  )}
                </TextField>
              </Grid>
            </Grid>
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCloseDialog} color="secondary">
            Cancel
          </MDButton>
          <MDButton onClick={handleSubmit} color="info" variant="gradient">
            {dialogMode === "create" ? "Create User" : "Update Role"}
          </MDButton>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

export default UserManagement;
