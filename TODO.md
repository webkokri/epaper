# TODO: Update E-Paper Upload Page

## Tasks
- [x] Restructure layout to two columns (left: form, right: uploader)
- [x] Add form heading "CREATE NEW EDITION"
- [x] Add form fields: EDITION Name, alias (URL), Edition Date, Meta Title, Meta Description, Category, Status
- [x] Update uploader to accept images and PDF files
- [x] Update state variables for new fields
- [x] Update handleSubmit to include new fields
- [x] Update file handling for multiple files
- [x] Create categories management page
- [x] Add multi-select category dropdown with checkboxes
- [x] Update backend to handle new fields and categories
- [x] Update database schema
- [x] Test the updated page (code review completed - browser testing disabled)
- [x] Fix MDSelect import error - replaced with MUI Select component
- [x] Fix MDSnackbar dateTime prop warning in categories page
- [x] Fix MDSnackbar dateTime prop warning in crop-share page
- [x] Fix MDSnackbar dateTime prop warning in area-editor page
- [x] Run database migrations for categories table
- [x] Verify categories API endpoint is working (returns 401 for invalid token as expected)
- [x] Improve dropdown styling with better padding, rounded borders, and visual indicators

## Issues Fixed
1. **MDSelect import error**: Replaced with standard MUI Select component
2. **MDSnackbar dateTime warnings**: Added dateTime prop to all MDSnackbar components in:
   - categories/index.js
   - epapers/upload.js
   - epapers/crop-share.js
   - epapers/area-editor.js
3. **Categories API 404**: Database migrations run successfully, API now responding correctly
4. **Dropdown styling**: Improved with:
   - Better padding (16px 14px) and min-height (56px)
   - Rounded borders (borderRadius: 2)
   - Enhanced hover and focus states
   - Status dropdown with colored indicators (green/orange/grey)
   - Categories dropdown with chip-style tags for selected items
   - Improved menu item styling with hover effects
   - Better spacing between fields (mb={3})

