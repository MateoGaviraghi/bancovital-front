import { PacienteAnimalForm } from '@/components/domain/paciente-animal-form';
import { PageHeader } from '@/components/layout/page-header';

export default function NuevoPacienteAnimalPage() {
  return (
    <div>
      <PageHeader title="Nuevo paciente animal" description="Registrar un nuevo paciente animal." />
      <PacienteAnimalForm />
    </div>
  );
}
