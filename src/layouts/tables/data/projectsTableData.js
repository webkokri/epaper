/* eslint-disable react/prop-types */
/* eslint-disable react/function-component-definition */
/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page:  https://siman.ca/product/material-dashboard-react
* Copyright 2023 Creative Tim ( https://siman.ca)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useState, useEffect } from "react";

// @mui material components
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";
import MDProgress from "components/MDProgress";

// API
import { projectsAPI } from "services/api";

// Images
import LogoAsana from "assets/images/small-logos/logo-asana.svg";
import logoGithub from "assets/images/small-logos/github.svg";
import logoAtlassian from "assets/images/small-logos/logo-atlassian.svg";
import logoSlack from "assets/images/small-logos/logo-slack.svg";
import logoSpotify from "assets/images/small-logos/logo-spotify.svg";
import logoInvesion from "assets/images/small-logos/logo-invision.svg";

const getProjectIcon = (name) => {
  const icons = {
    'Material Dashboard 2': LogoAsana,
    'Dark Edition': logoGithub,
    'React Version': logoAtlassian,
    'Vue.js Version': logoSlack,
    'Angular Version': logoSpotify,
    'Mobile App': logoInvesion,
  };
  return icons[name] || LogoAsana;
};

const getStatusColor = (status) => {
  const colors = {
    'completed': 'success',
    'in_progress': 'info',
    'pending': 'warning',
    'canceled': 'error',
  };
  return colors[status] || 'info';
};

export default function useProjectsTableData() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll();
      setProjects(response.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await projectsAPI.delete(id);
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const Project = ({ image, name }) => (
    <MDBox display="flex" alignItems="center" lineHeight={1}>
      <MDAvatar src={image} name={name} size="sm" variant="rounded" />
      <MDTypography display="block" variant="button" fontWeight="medium" ml={1} lineHeight={1}>
        {name}
      </MDTypography>
    </MDBox>
  );

  const Progress = ({ color, value }) => (
    <MDBox display="flex" alignItems="center">
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {value}%
      </MDTypography>
      <MDBox ml={0.5} width="9rem">
        <MDProgress variant="gradient" color={color} value={value} />
      </MDBox>
    </MDBox>
  );

  const columns = [
    { Header: "project", accessor: "project", width: "30%", align: "left" },
    { Header: "budget", accessor: "budget", align: "left" },
    { Header: "status", accessor: "status", align: "center" },
    { Header: "completion", accessor: "completion", align: "center" },
    { Header: "action", accessor: "action", align: "center" },
  ];

  const rows = projects.map((project) => ({
    project: <Project image={getProjectIcon(project.name)} name={project.name} />,
    budget: (
      <MDTypography component="a" href="#" variant="button" color="text" fontWeight="medium">
        {project.budget}
      </MDTypography>
    ),
    status: (
      <MDTypography component="a" href="#" variant="caption" color="text" fontWeight="medium">
        {project.status}
      </MDTypography>
    ),
    completion: <Progress color={getStatusColor(project.status)} value={project.completion} />,
    action: (
      <MDBox display="flex" gap={1}>
        <MDTypography component="a" href="#" color="text">
          <Icon>more_vert</Icon>
        </MDTypography>
        <MDTypography 
          component="button"
          onClick={() => handleDelete(project.id)}
          variant="caption" 
          color="error" 
          fontWeight="medium"
          sx={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Delete
        </MDTypography>
      </MDBox>
    ),
  }));

  return { columns, rows, loading, refresh: fetchProjects };
}
