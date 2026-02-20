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

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";
import MDBadge from "components/MDBadge";
import MDButton from "components/MDButton";

// API
import { authorsAPI } from "services/api";

// Images
import team2 from "assets/images/team-2.jpg";
import team3 from "assets/images/team-3.jpg";
import team4 from "assets/images/team-4.jpg";

const getImage = (imageName) => {
  const images = {
    '/assets/images/team-2.jpg': team2,
    '/assets/images/team-3.jpg': team3,
    '/assets/images/team-4.jpg': team4,
  };
  return images[imageName] || team3;
};

export default function useAuthorsTableData() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      const response = await authorsAPI.getAll();
      setAuthors(response.data);
    } catch (error) {
      console.error("Error fetching authors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await authorsAPI.delete(id);
      fetchAuthors();
    } catch (error) {
      console.error("Error deleting author:", error);
    }
  };

  const Author = ({ image, name, email }) => (
    <MDBox display="flex" alignItems="center" lineHeight={1}>
      <MDAvatar src={getImage(image)} name={name} size="sm" />
      <MDBox ml={2} lineHeight={1}>
        <MDTypography display="block" variant="button" fontWeight="medium">
          {name}
        </MDTypography>
        <MDTypography variant="caption">{email}</MDTypography>
      </MDBox>
    </MDBox>
  );

  const Job = ({ title, description }) => (
    <MDBox lineHeight={1} textAlign="left">
      <MDTypography display="block" variant="caption" color="text" fontWeight="medium">
        {title}
      </MDTypography>
      <MDTypography variant="caption">{description}</MDTypography>
    </MDBox>
  );

  const columns = [
    { Header: "author", accessor: "author", width: "45%", align: "left" },
    { Header: "function", accessor: "function", align: "left" },
    { Header: "status", accessor: "status", align: "center" },
    { Header: "employed", accessor: "employed", align: "center" },
    { Header: "action", accessor: "action", align: "center" },
  ];

  const rows = authors.map((author) => ({
    author: <Author image={author.image} name={author.name} email={author.email} />,
    function: <Job title={author.job_title} description={author.job_description} />,
    status: (
      <MDBox ml={-1}>
        <MDBadge 
          badgeContent={author.status} 
          color={author.status === 'online' ? "success" : "dark"} 
          variant="gradient" 
          size="sm" 
        />
      </MDBox>
    ),
    employed: (
      <MDTypography component="a" href="#" variant="caption" color="text" fontWeight="medium">
        {author.employed_date}
      </MDTypography>
    ),
    action: (
      <MDBox display="flex" gap={1}>
        <MDTypography 
          component="a" 
          href="#" 
          variant="caption" 
          color="text" 
          fontWeight="medium"
        >
          Edit
        </MDTypography>
        <MDTypography 
          component="button"
          onClick={() => handleDelete(author.id)}
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

  return { columns, rows, loading, refresh: fetchAuthors };
}
