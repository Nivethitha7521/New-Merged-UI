"use client"
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, CircularProgress } from "@mui/material"
import DescriptionIcon from "@mui/icons-material/Description"
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong"

interface PrintOptionsModalProps {
  open: boolean
  onClose: () => void
  onSelect: (includeCost: boolean) => void
  downloading: boolean
  error: string | null
}

export default function PrintOptionsModal({ open, onClose, onSelect, downloading, error }: PrintOptionsModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1rem" }}>
        Choose Print Option
      </DialogTitle>
      <DialogContent>
        {error && (
          <Typography color="error" sx={{ mb: 2, fontSize: "0.8rem" }}>
            {error}
          </Typography>
        )}

        <Box display="flex" flexDirection="column" gap={2} py={1}>
          <Button
            variant="outlined"
            startIcon={<DescriptionIcon />}
            onClick={() => onSelect(false)}
            disabled={downloading}
            sx={{ justifyContent: "flex-start", textTransform: "none", py: 1.5 }}
          >
            <Box textAlign="left">
              <Typography sx={{ fontWeight: 600, fontSize: "0.88rem" }}>Recipe &amp; Items Only</Typography>
              <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                Recipe name and used items — no pricing shown
              </Typography>
            </Box>
          </Button>

          <Button
            variant="outlined"
            startIcon={<ReceiptLongIcon />}
            onClick={() => onSelect(true)}
            disabled={downloading}
            sx={{ justifyContent: "flex-start", textTransform: "none", py: 1.5 }}
          >
            <Box textAlign="left">
              <Typography sx={{ fontWeight: 600, fontSize: "0.88rem" }}>Full Details with Cost</Typography>
              <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                Recipe, used items, unit price &amp; total cost
              </Typography>
            </Box>
          </Button>
        </Box>

        {downloading && (
          <Box display="flex" justifyContent="center" alignItems="center" gap={1} mt={2}>
            <CircularProgress size={20} />
            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>Generating PDF…</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={downloading}>Cancel</Button>
      </DialogActions>
    </Dialog>
  )
}