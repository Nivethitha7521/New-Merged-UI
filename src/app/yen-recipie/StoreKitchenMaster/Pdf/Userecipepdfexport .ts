"use client"
import { useState, useCallback } from "react"
import axios from "axios"

const EXPORT_PDF_URL = "http://127.0.0.1:8000/yenerpapi/viewrecipehistory/export-pdf"

export interface PrintTarget {
  recipeId: string
  version: number
}

export function useRecipePdfExport() {
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [printTarget, setPrintTarget] = useState<PrintTarget | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const openPrintModal = useCallback((recipeId: string, version: number) => {
    setPrintTarget({ recipeId, version })
    setDownloadError(null)
    setPrintModalOpen(true)
  }, [])

  const closePrintModal = useCallback(() => {
    if (downloading) return
    setPrintModalOpen(false)
    setPrintTarget(null)
    setDownloadError(null)
  }, [downloading])

    const downloadPdf = useCallback(
    async (includeCost: boolean) => {
      if (!printTarget) return;

      setDownloading(true);
      setDownloadError(null);

      try {
        const response = await axios.get<Blob>(
          `${EXPORT_PDF_URL}/${printTarget.recipeId}/${printTarget.version}`,
          {
            params: {
              include_cost: includeCost,
            },
            responseType: "blob",
          }
        );

        const disposition = response.headers[
          "content-disposition"
        ] as string | undefined;

        const filename =
          disposition
            ?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/)?.[1]
            ?.trim() ??
          `recipe_${printTarget.recipeId}_v${printTarget.version}.pdf`;

        const blob = new Blob([response.data], {
          type: "application/pdf",
        });

        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = decodeURIComponent(filename);

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(blobUrl);

        setPrintModalOpen(false);
        setPrintTarget(null);
      } catch (error: unknown) {
        let message = "Failed to generate the PDF. Please try again.";

        if (axios.isAxiosError(error)) {
          if (typeof error.response?.data === "string") {
            message = error.response.data;
          } else if (
            error.response?.data &&
            typeof error.response.data === "object" &&
            "detail" in error.response.data
          ) {
            message = String(
              (error.response.data as { detail: string }).detail
            );
          } else if (error.message) {
            message = error.message;
          }
        }

        setDownloadError(message);
      } finally {
        setDownloading(false);
      }
    },
    [printTarget]
  );
  

  return {
    printModalOpen,
    printTarget,
    downloading,
    downloadError,
    openPrintModal,
    closePrintModal,
    downloadPdf,
  }
}