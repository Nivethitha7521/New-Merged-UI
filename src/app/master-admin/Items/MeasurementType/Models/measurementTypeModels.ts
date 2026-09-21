


export interface MeasurementType {
  id: string;
  measurementType: string | null;
  status: string | null;
  measureId: string | null;
}

export interface MeasurementTypeState {
  items: MeasurementType[];
  deactivatedItems: MeasurementType[];
  loading: boolean;
  error: string | null;
  measurementTypeData: MeasurementType;
  editIndex: number | null;
  dialogOpen: 'none' | 'edit' | 'add';
  snackbarOpen: boolean;
  snackbarMessage: string;
  searchQuery: string;
  showDeactivated: boolean;
}

export const initialMeasurementType: MeasurementType = {
  id: '',
  measurementType: '',
  status: 'active',
  measureId: null,
};

export const initialState: MeasurementTypeState = {
  items: [],
  deactivatedItems: [],
  loading: false,
  error: null,
  measurementTypeData: initialMeasurementType,
  editIndex: null,
  dialogOpen: 'none',
  snackbarOpen: false,
  snackbarMessage: '',
  searchQuery: '',
  showDeactivated: false,
};