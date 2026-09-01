



// ✅ Correct - Asset is a type (interface)
  export interface Asset {
    createdAt: string;
    updatedAt: string;
    // createdAt?: any;
    // updatedAt?: any;
    assetId: string;
    assetName: string;
    serialNo: string;
    status: string;
    randomId: string;
  }

  // ✅ Correct - initialAsset is a value matching the Asset type
  export const initialAsset: Asset = {
    assetId: "",
    assetName: "",
    serialNo: "",
    status: "1",
    randomId: "",
    createdAt:"",
    updatedAt:"",
  };

export interface AssetState {
  assetId: string;
  assets: Asset[];
  deactivatedAssets: Asset[];
  loading: boolean;
  error: string | null;
  assetData: Asset;
  dialogOpen: 'none' | 'edit' | 'add';
  snackbarOpen: boolean;
  snackbarMessage: string;
  showDeactivated: boolean;
}



export const initialState: AssetState = {
  assets: [],
  deactivatedAssets: [],
  loading: false,
  error: null,
  assetData: initialAsset,
  dialogOpen: 'none',
  snackbarOpen: false,
  snackbarMessage: '',
  showDeactivated: false,
  assetId: '',
};