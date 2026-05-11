import { useParams } from 'react-router-dom';
import { VehicleWizard } from '@/components/admin/VehicleWizard/VehicleWizard';

export function AdminVehicleForm() {
  const { id } = useParams<{ id?: string }>();
  return <VehicleWizard vehicleId={id} />;
}
