import { PatientForm } from '@/components/domain/patient-form';
import { PageHeader } from '@/components/layout/page-header';

export default function NuevoPacientePage() {
  return (
    <div>
      <PageHeader title="Nuevo paciente" description="Alta en el padrón." />
      <PatientForm />
    </div>
  );
}
