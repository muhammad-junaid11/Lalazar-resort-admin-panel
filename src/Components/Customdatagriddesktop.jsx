import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { useTheme, alpha } from "@mui/material/styles";
import { GlobalStyles } from "@mui/material";

const Customdatagriddesktop = ({
  rows,
  columns,
  onRowClick,
  pageSizeOptions = [5, 10, 20],
  defaultPageSize = 10,
  getRowId, // ✅ optional prop for custom ID fields
}) => {
  const theme = useTheme();

  const adjustedColumns = columns.map((col) => ({
    ...col,
    sortable: col.sortable !== false,
    align: col.align || "center",
    headerAlign: col.headerAlign || "center",
    flex: col.flex || 1,
  }));

  return (
    <>
      <GlobalStyles
        styles={{
          ".MuiMenuItem-root:hover": {
            backgroundColor: `${alpha(theme.palette.primary.main, 0.08)} !important`,
          },
          ".MuiMenuItem-root.Mui-selected": {
            backgroundColor: `${alpha(theme.palette.primary.main, 0.12)} !important`,
            color: theme.palette.primary.main,
          },
          ".MuiMenuItem-root.Mui-selected:hover": {
            backgroundColor: `${alpha(theme.palette.primary.main, 0.12)} !important`,
          },
        }}
      />

      <DataGrid
        rows={rows}
        columns={adjustedColumns}
        disableRowSelectionOnClick={!onRowClick}
        onRowClick={(params) => onRowClick && onRowClick(params.row)}
        pagination
        autoHeight
        pageSizeOptions={pageSizeOptions}
        // ✅ Universal getRowId (uses custom prop or falls back safely)
        getRowId={getRowId || ((row) => row.id || Math.random().toString(36).substr(2, 9))}
        initialState={{
          pagination: { paginationModel: { pageSize: defaultPageSize, page: 0 } },
        }}
        sx={{
          borderRadius: 2,
          boxShadow: 2,
          backgroundColor: "background.paper",
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: theme.palette.background.default,
            borderBottom: `2px solid ${theme.palette.primary.main}`,
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            color: theme.palette.primary.main,
            fontWeight: 600,
            fontSize: "0.95rem",
          },
          "& .MuiDataGrid-columnSeparator": {
            color: theme.palette.primary.main,
          },
          "& .MuiDataGrid-row": {
            cursor: "pointer",
            transition: "background-color 0.2s ease",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: `${alpha(theme.palette.primary.main, 0.08)} !important`,
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid rgba(224,224,224,1)",
            px: 1,
          },
          "& .MuiTablePagination-root": {
            color: theme.palette.text.primary,
          },
          "& .MuiSelect-icon": {
            color: theme.palette.primary.main,
          },
          "& .MuiTablePagination-actions button": {
            color: theme.palette.primary.main,
          },
          "& .MuiDataGrid-footerContainer": {
            fontSize: "0.85rem",
            justifyContent: "flex-end",
            borderTop: `1px solid ${theme.palette.divider}`,
          },
          "& .MuiTablePagination-actions svg": {
            color: theme.palette.primary.main,
          },
        }}
      />
    </>
  );
};

export default Customdatagriddesktop;
