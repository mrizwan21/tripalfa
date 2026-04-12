import { toast } from 'sonner';
import api from '@/shared/lib/api';

export const addSupplierItem = async (
  selectedSupplierId: string | null,
  endpoint: string,
  values: any,
  setState: (items: any[]) => void,
  resetForm: () => void,
  itemName: string,
  mapItem: (item: any, values: any) => any
) => {
  if (!selectedSupplierId) {
    toast.error(`Create or select a supplier before adding ${itemName}`);
    return;
  }

  try {
    await api.post(`/admin/suppliers/${selectedSupplierId}/${endpoint}`, values);
    const res = await api.get(`/admin/suppliers/${selectedSupplierId}/${endpoint}`);
    const payload: any[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    setState(payload.map(item => mapItem(item, values)));
    resetForm();
  } catch (error) {
    console.error(`Failed to add ${itemName}`, error);
    toast.error(`Failed to add ${itemName}`);
  }
};
