/**
=========================================================
* E-Paper Upload
=========================================================
*/

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import OutlinedInput from "@mui/material/OutlinedInput";

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
import { epaperAPI, categoriesAPI } from "services/api";

function UploadEPaper() {
  const getCurrentDateFormatted = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return "ePaper " + dd + '/' + mm + '/' + yyyy;
  };

  const getCurrentDateForInput = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return yyyy + '-' + mm + '-' + dd;
  };

  const [editionName, setEditionName] = useState(getCurrentDateFormatted());
  const [alias, setAlias] = useState("");
  const [editionDate, setEditionDate] = useState(getCurrentDateForInput());
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("Draft");
  const [files, setFiles] = useState([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isFree, setIsFree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: "", color: "success" });
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file =>
      file.type === "application/pdf" ||
      file.type.startsWith("image/")
    );
    if (validFiles.length !== selectedFiles.length) {
      setNotification({
        open: true,
        message: "Please select only PDF or image files",
        color: "error",
      });
    }
    setFiles(validFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editionName.trim()) {
      setNotification({
        open: true,
        message: "Edition Name is required",
        color: "error",
      });
      return;
    }

    if (files.length === 0) {
      setNotification({
        open: true,
        message: "Please select at least one file (PDF or images)",
        color: "error",
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", editionName.trim());
      formData.append("alias", alias.trim());
      formData.append("edition_date", editionDate);
      formData.append("meta_title", metaTitle);
      formData.append("meta_description", metaDescription);
      formData.append("category", category);
      formData.append("status", status.toLowerCase());
      formData.append("is_public", isPublic);
      formData.append("is_free", isFree);

      // Add selected categories
      selectedCategories.forEach(catId => {
        formData.append("categories[]", catId);
      });

      files.forEach((file, index) => {
        if (file.type === "application/pdf") {
          formData.append("pdf", file);
        } else {
          formData.append("images", file);
        }
      });

      const response = await epaperAPI.create(formData);

      setNotification({
        open: true,
        message: `E-paper uploaded successfully! ${response.data.total_pages || files.length} pages processed.`,
        color: "success",
      });

      // Redirect after short delay
      setTimeout(() => {
        navigate("/epapers");
      }, 2000);

    } catch (error) {
      console.error("Error uploading e-paper:", error);
      setNotification({
        open: true,
        message: error.response?.data?.message || "Error uploading e-paper",
        color: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const closeNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleCategoryChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedCategories(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6} justifyContent="center">
          <Grid item xs={12} md={5}>
            <Card>
              <MDBox
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
                mx={2}
                mt={-3}
                p={2}
                mb={1}
                textAlign="center"
              >
                <MDTypography variant="h4" fontWeight="medium" color="white" mt={1}>
                  CREATE NEW EDITION
                </MDTypography>
              </MDBox>
              <MDBox pt={4} pb={3} px={3}>
                <MDBox component="form" role="form" onSubmit={handleSubmit}>
                  <MDBox mb={2}>
                    <MDInput
                      type="text"
                      label="EDITION Name"
                      variant="standard"
                      fullWidth
                      value={editionName}
                      onChange={(e) => setEditionName(e.target.value)}
                      required
                    />
                  </MDBox>
                  <MDBox mb={2}>
                    <MDInput
                      type="text"
                      label="alias (URL)"
                      variant="standard"
                      fullWidth
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                    />
                  </MDBox>
                  <MDBox mb={2}>
                    <MDInput
                      type="date"
                      label="Edition Date (dd/mm/yyyy)"
                      variant="standard"
                      fullWidth
                      value={editionDate}
                      onChange={(e) => setEditionDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </MDBox>
                  <MDBox mb={2}>
                    <MDInput
                      type="text"
                      label="Meta Title"
                      variant="standard"
                      fullWidth
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                    />
                  </MDBox>
                  <MDBox mb={2}>
                    <MDInput
                      type="text"
                      label="Meta Description"
                      variant="standard"
                      fullWidth
                      multiline
                      rows={3}
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                    />
                  </MDBox>
                  <MDBox mb={3}>
                    <FormControl fullWidth variant="outlined" sx={{ minHeight: 56 }}>
                      <InputLabel id="categories-label" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Categories</InputLabel>
                      <Select
                        labelId="categories-label"
                        id="categories"
                        multiple
                        value={selectedCategories}
                        onChange={handleCategoryChange}
                        input={<OutlinedInput label="Categories" sx={{ 
                          borderRadius: 2,
                          '& .MuiSelect-select': {
                            padding: '16px 14px',
                            minHeight: 24,
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 0.5
                          }
                        }} />}
                        renderValue={(selected) => (
                          <MDBox sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, py: 0.5 }}>
                            {categories
                              .filter(cat => selected.includes(cat.id))
                              .map(cat => (
                                <MDTypography
                                  key={cat.id}
                                  variant="caption"
                                  sx={{
                                    bgcolor: 'info.main',
                                    color: 'white',
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    fontSize: '0.75rem',
                                    fontWeight: 500
                                  }}
                                >
                                  {cat.name}
                                </MDTypography>
                              ))}
                          </MDBox>
                        )}
                        sx={{
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(0, 0, 0, 0.23)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(0, 0, 0, 0.87)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'info.main',
                            borderWidth: 2,
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 300,
                              borderRadius: 2,
                              mt: 1,
                              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                            }
                          }
                        }}
                      >
                        {categories.map((cat) => (
                          <MenuItem 
                            key={cat.id} 
                            value={cat.id}
                            sx={{
                              py: 1.5,
                              px: 2,
                              '&:hover': {
                                bgcolor: 'rgba(26, 115, 232, 0.08)'
                              },
                              '&.Mui-selected': {
                                bgcolor: 'rgba(26, 115, 232, 0.12)',
                                '&:hover': {
                                  bgcolor: 'rgba(26, 115, 232, 0.16)'
                                }
                              }
                            }}
                          >
                            <Checkbox 
                              checked={selectedCategories.indexOf(cat.id) > -1} 
                              sx={{ 
                                mr: 1.5,
                                color: 'info.main',
                                '&.Mui-checked': {
                                  color: 'info.main'
                                }
                              }}
                            />
                            <ListItemText 
                              primary={cat.name} 
                              primaryTypographyProps={{
                                fontSize: '0.875rem',
                                fontWeight: 500
                              }}
                            />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </MDBox>
                  <MDBox mb={3}>
                    <FormControl fullWidth variant="outlined" sx={{ minHeight: 56 }}>
                      <InputLabel id="status-label" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Status</InputLabel>
                      <Select
                        labelId="status-label"
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        input={<OutlinedInput label="Status" sx={{ 
                          borderRadius: 2,
                          '& .MuiSelect-select': {
                            padding: '16px 14px',
                            minHeight: 24,
                            display: 'flex',
                            alignItems: 'center'
                          }
                        }} />}
                        sx={{
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(0, 0, 0, 0.23)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(0, 0, 0, 0.87)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'info.main',
                            borderWidth: 2,
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              borderRadius: 2,
                              mt: 1,
                              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                            }
                          }
                        }}
                      >
                        <MenuItem 
                          value="Live"
                          sx={{
                            py: 1.5,
                            px: 2,
                            '&:hover': {
                              bgcolor: 'rgba(76, 175, 80, 0.08)'
                            },
                            '&.Mui-selected': {
                              bgcolor: 'rgba(76, 175, 80, 0.12)',
                              '&:hover': {
                                bgcolor: 'rgba(76, 175, 80, 0.16)'
                              }
                            }
                          }}
                        >
                          <MDBox sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MDBox
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: 'success.main'
                              }}
                            />
                            <MDTypography variant="button" fontWeight="medium">Live</MDTypography>
                          </MDBox>
                        </MenuItem>
                        <MenuItem 
                          value="Schedule"
                          sx={{
                            py: 1.5,
                            px: 2,
                            '&:hover': {
                              bgcolor: 'rgba(255, 152, 0, 0.08)'
                            },
                            '&.Mui-selected': {
                              bgcolor: 'rgba(255, 152, 0, 0.12)',
                              '&:hover': {
                                bgcolor: 'rgba(255, 152, 0, 0.16)'
                              }
                            }
                          }}
                        >
                          <MDBox sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MDBox
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: 'warning.main'
                              }}
                            />
                            <MDTypography variant="button" fontWeight="medium">Schedule</MDTypography>
                          </MDBox>
                        </MenuItem>
                        <MenuItem 
                          value="Draft"
                          sx={{
                            py: 1.5,
                            px: 2,
                            '&:hover': {
                              bgcolor: 'rgba(158, 158, 158, 0.08)'
                            },
                            '&.Mui-selected': {
                              bgcolor: 'rgba(158, 158, 158, 0.12)',
                              '&:hover': {
                                bgcolor: 'rgba(158, 158, 158, 0.16)'
                              }
                            }
                          }}
                        >
                          <MDBox sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MDBox
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: 'grey.500'
                              }}
                            />
                            <MDTypography variant="button" fontWeight="medium">Draft</MDTypography>
                          </MDBox>
                        </MenuItem>
                      </Select>
                    </FormControl>
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
                      Make this e-paper public
                    </MDTypography>
                  </MDBox>
                  <MDBox mt={4} mb={1}>
                    <MDButton
                      variant="gradient"
                      color="info"
                      fullWidth
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Uploading..." : "Create Edition"}
                    </MDButton>
                  </MDBox>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={5}>
            <Card>
              <MDBox
                variant="gradient"
                bgColor="success"
                borderRadius="lg"
                coloredShadow="success"
                mx={2}
                mt={-3}
                p={2}
                mb={1}
                textAlign="center"
              >
                <MDTypography variant="h4" fontWeight="medium" color="white" mt={1}>
                  Upload Files
                </MDTypography>
                <MDTypography display="block" variant="button" color="white" my={1}>
                  Upload images and PDF files
                </MDTypography>
              </MDBox>
              <MDBox pt={4} pb={3} px={3}>
                <MDBox mb={2}>
                  <MDTypography variant="caption" color="text">
                    Files (Images and PDFs, Max 500MB each)
                  </MDTypography>
                  <MDBox
                    mt={1}
                    p={2}
                    border="1px dashed"
                    borderColor="grey"
                    borderRadius="md"
                    textAlign="center"
                    sx={{
                      cursor: "pointer",
                      "&:hover": { borderColor: "success.main" },
                    }}
                    onClick={() => document.getElementById("file-upload").click()}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      accept=".pdf,image/*"
                      multiple
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                    <Icon fontSize="large" color="success">
                      upload_file
                    </Icon>
                    <MDTypography variant="button" display="block" mt={1}>
                      {files.length > 0 ? `${files.length} file(s) selected` : "Click to select files"}
                    </MDTypography>
                    {files.length > 0 && (
                      <MDBox mt={1}>
                        {files.map((file, index) => (
                          <MDTypography key={index} variant="caption" color="success" display="block">
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </MDTypography>
                        ))}
                      </MDBox>
                    )}
                  </MDBox>
                </MDBox>
                <MDBox mt={4} mb={1}>
                  <MDButton
                    variant="outlined"
                    color="secondary"
                    fullWidth
                    onClick={() => navigate("/epapers")}
                    disabled={loading}
                  >
                    Cancel
                  </MDButton>
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
        onClose={closeNotification}
        close={closeNotification}
        bgWhite
      />
    </DashboardLayout>
  );
}

export default UploadEPaper;
