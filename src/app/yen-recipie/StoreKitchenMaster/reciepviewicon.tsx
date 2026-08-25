
"use client"

import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Typography, Box, Chip,
  Button, CircularProgress, Divider,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"

interface RecipeItem {
  id?: string
  name?: string
  code?: string
  type?: string
  uom?: string
  quantity?: number
  unitPrice?: number
  totalPrice?: number
}

interface RecipeMeta {
  itemName?: string
  varianceName?: string
  itemCode?: string
  item_Uom?: string
  item_Defaultprice?: number
}

interface RecipeFullDetail {
  recipeId?: string
  recipeName?: string
  version?: number
  totalVersions?: number
  cost?: number
  status?: boolean
  createdAt?: string
  totalItemsCost?: number
  profit?: number   // ✅ comes straight from the API — no frontend math
  items?: RecipeItem[]
  recipeMeta?: RecipeMeta
}

interface RecipeDetailsModalProps {
  open: boolean
  recipe: RecipeFullDetail | null
  loading?: boolean
  error?: string | null
  onClose: () => void
}

const BORDER = "1px solid #e2e8f0"
const CELL_PADDING = "0.7rem 1.1rem"

const columns = [
  { key: "sno", label: "S.NO", align: "center" as const },
  { key: "name", label: "Ingredient", align: "left" as const },
  { key: "type", label: "Type", align: "center" as const },
  { key: "uom", label: "UOM", align: "center" as const },
  { key: "qty", label: "Qty", align: "right" as const },
  { key: "unitPrice", label: "Unit Price", align: "right" as const },
  { key: "totalPrice", label: "Total Price", align: "right" as const },
]

export default function RecipeDetailsModal({
  open,
  recipe,
  loading = false,
  error = null,
  onClose,
}: RecipeDetailsModalProps) {
  const items = recipe?.items ?? []
  const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
  const totalItemsPrice = items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0)

  // ✅ No frontend calculation — display exactly what the API sends
  const cost = Number(recipe?.cost ?? 0)
  const makingCost = Number(recipe?.totalItemsCost ?? 0)
  const profit = Number(recipe?.profit ?? 0)

  const titleText = recipe
    ? [recipe.recipeName, recipe.recipeMeta?.varianceName].filter(Boolean).join(" - ")
    : "Recipe Details"

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: "0.4rem", maxHeight: "85vh" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          borderBottom: "1px solid rgb(229,231,235)",
          background: "linear-gradient(to right, rgb(249,250,251), rgb(255,255,255))",
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "1.15rem" }}>{titleText}</Typography>
          {recipe && (
            <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", mt: 0.3 }}>
              {recipe.recipeId ? `${recipe.recipeId} · ` : ""}v{recipe.version}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ overflowY: "hidden", display: "flex", flexDirection: "column" }}>
        {loading && (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={6} gap={2}>
            <CircularProgress size={32} />
            <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
              Loading recipe details...
            </Typography>
          </Box>
        )}

        {!loading && error && (
          <Box py={6} textAlign="center">
            <Typography sx={{ fontSize: "0.9rem", color: "error.main" }}>{error}</Typography>
          </Box>
        )}

        {!loading && !error && recipe && (
          <>
            {/* Summary strip — original single-row layout, Sale Cost removed */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                flexWrap: "wrap",
                rowGap: "0.9rem",
                columnGap: "1.2rem",
                mb: 3,
                px: 1,
                py: 1.5,
                flexShrink: 0,
              }}
            >
              <SummaryInline label="Status">
                <Chip
                  label={recipe.status ? "Active" : "Inactive"}
                  size="small"
                  color={recipe.status ? "success" : "warning"}
                  variant="outlined"
                  sx={{ height: 26, fontSize: "0.85rem", fontWeight: 600 }}
                />
              </SummaryInline>
              <Divider orientation="vertical" flexItem sx={{ my: 0.3 }} />
              <SummaryInline label="UOM" value={recipe.recipeMeta?.item_Uom || "—"} />
              <Divider orientation="vertical" flexItem sx={{ my: 0.3 }} />
              <SummaryInline label="Cost" value={`₹${cost.toFixed(2)}`} />
              <Divider orientation="vertical" flexItem sx={{ my: 0.3 }} />
              <SummaryInline label="Making Cost" value={`₹${makingCost.toFixed(2)}`} />
              <Divider orientation="vertical" flexItem sx={{ my: 0.3 }} />
              <SummaryInline label="Profit">
                <Typography
                  sx={{
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: profit >= 0 ? "success.main" : "error.main",
                  }}
                >
                  ₹{profit.toFixed(2)}
                </Typography>
              </SummaryInline>
              <Divider orientation="vertical" flexItem sx={{ my: 0.3 }} />
              <SummaryInline
                label="Created At"
                value={recipe.createdAt ? new Date(recipe.createdAt).toLocaleString() : "—"}
              />
            </Box>

            {/* Section title */}
            <Typography sx={{ fontWeight: 700, fontSize: "1rem", mb: 1.5, textAlign: "center", flexShrink: 0 }}>
              Ingredients Overview
            </Typography>

            {items.length === 0 ? (
              <Typography sx={{ fontSize: "0.9rem", color: "text.secondary", textAlign: "center" }}>
                No items in this version.
              </Typography>
            ) : (
              <Box
                sx={{
                  maxWidth: "100%",
                  maxHeight: 340,
                  overflow: "auto",
                  borderRadius: "0.2rem",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse", border: BORDER }}>
                  <thead>
                    <tr>
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.01em",
                            textAlign: col.align,
                            padding: CELL_PADDING,
                            border: BORDER,
                            background: "#f0f2f5",
                            whiteSpace: "nowrap",
                            position: "sticky",
                            top: 0,
                          }}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={`${item.id ?? item.code}-${idx}`}>
                        <Cell align="center">{idx + 1}</Cell>
                        <Cell align="left">{item.name}</Cell>
                        <Cell align="center">{item.type}</Cell>
                        <Cell align="center">{item.uom}</Cell>
                        <Cell align="right">{item.quantity}</Cell>
                        <Cell align="right">₹{Number(item.unitPrice ?? 0).toFixed(2)}</Cell>
                        <Cell align="right">₹{Number(item.totalPrice ?? 0).toFixed(2)}</Cell>
                      </tr>
                    ))}
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          fontWeight: 700,
                          textAlign: "right",
                          fontSize: "0.9rem",
                          padding: CELL_PADDING,
                          border: BORDER,
                          background: "#f8fafc",
                        }}
                      >
                        Totals:
                      </td>
                      <td
                        style={{
                          fontWeight: 700,
                          textAlign: "right",
                          fontSize: "0.9rem",
                          padding: CELL_PADDING,
                          border: BORDER,
                          background: "#f8fafc",
                        }}
                      >
                        {totalQty}
                      </td>
                      <td
                        style={{
                          padding: CELL_PADDING,
                          border: BORDER,
                          background: "#f8fafc",
                        }}
                      />
                      <td
                        style={{
                          fontWeight: 700,
                          textAlign: "right",
                          fontSize: "0.9rem",
                          padding: CELL_PADDING,
                          border: BORDER,
                          background: "#f8fafc",
                        }}
                      >
                        ₹{totalItemsPrice.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          justifyContent: "flex-end",
          gap: 1,
          borderTop: "1px solid rgb(229,231,235)",
          background: "rgb(249,250,251)",
        }}
      >
        <Button onClick={onClose} variant="outlined" size="small">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function Cell({ align, children }: { align: "left" | "center" | "right"; children: React.ReactNode }) {
  return (
    <td style={{ fontSize: "0.85rem", padding: CELL_PADDING, border: BORDER, textAlign: align, whiteSpace: "nowrap" }}>
      {children}
    </td>
  )
}

function SummaryInline({
  label,
  value,
  children,
}: {
  label: string
  value?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, whiteSpace: "nowrap" }}>
      <Typography sx={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.02em", color: "text.secondary" }}>
        {label}:
      </Typography>
      {children ?? <Typography sx={{ fontSize: "0.95rem", fontWeight: 700 }}>{value}</Typography>}
    </Box>
  )
}