


//measurement
export interface Measure {
  id: string;
  measurementType :string;

}
//Uom
export interface Uom {
  createdAt: string;
  updatedAt: string;
  measurementType: string;
  id: string;
  uom: string;
  precision: number;
  displayFormat: string;
  status: string;   
  editStatus: boolean;
  uomId: string;
}

export interface UomState {
  items: Uom[];
  measurementTypes: Measure[];
  deactivatedItems: Uom[];
  loading: boolean;
  error: string | null;
  uomData: Uom;
  dialogOpen: 'none' | 'edit' | 'add';
  snackbarOpen: boolean;
  snackbarMessage: string;
  showDeactivated: boolean;
}

export const initialUom: Uom = {
  id: '',
  uom: '',
  measurementType: '',
  precision: 0,
  displayFormat: '',
  status: 'active',
  uomId: '',
  createdAt: '',
  updatedAt: '',
  editStatus: true,
};


export const initialState: UomState = {
  items: [],
  deactivatedItems: [],
  measurementTypes: [],
  loading: false,
  error: null,
  uomData: initialUom,
  dialogOpen: 'none',
  snackbarOpen: false,
  snackbarMessage: '',
  showDeactivated: false,
};

